import {
  addDecimalRationals,
  compareTransactions,
  decimalToRational,
  divideDecimalRationals,
  materializeDecimalRational,
  multiplyDecimalRationals,
  subtractDecimalRationals,
} from "./decimal-reducer";
import {
  InsufficientQuantityError,
  PositionAssetMismatchError,
  PositionAssetNotFoundError,
  PositionCurrencyMismatchError,
  PositionInvalidLedgerError,
} from "./errors";
import type { Asset } from "./asset";
import type { Transaction } from "./transaction";
import type { CurrencyCode, DecimalString, DocumentId } from "./value-objects";
import { parseDocumentId } from "./value-objects";

export type Position = Readonly<{
  portfolioId: DocumentId;
  assetId: DocumentId;
  currency: CurrencyCode;
  quantity: DecimalString;
  investedAmount: DecimalString;
  averageCost: DecimalString | null;
  closed: boolean;
}>;

export type PositionReductionInput = Readonly<{
  portfolioId: DocumentId;
  asset: Pick<Asset, "id" | "currency">;
  transactions: readonly Transaction[];
}>;

export type PositionsReductionInput = Readonly<{
  portfolioId: DocumentId;
  assets: readonly Asset[];
  transactions: readonly Transaction[];
}>;

function compareRationals(
  left: { numerator: bigint; denominator: bigint },
  right: { numerator: bigint; denominator: bigint },
): -1 | 0 | 1 {
  const difference = left.numerator * right.denominator - right.numerator * left.denominator;
  if (difference < BigInt(0)) return -1;
  if (difference > BigInt(0)) return 1;
  return 0;
}

function isZero(value: { numerator: bigint }): boolean {
  return value.numerator === BigInt(0);
}

function validateTransactionCurrency(
  transaction: Transaction,
  currency: CurrencyCode,
): void {
  if (
    transaction.unitPrice.currency !== currency ||
    (transaction.fee !== null && transaction.fee.currency !== currency)
  ) {
    throw new PositionCurrencyMismatchError();
  }
}

function reduceSortedTransactions(
  transactions: readonly Transaction[],
  currency: CurrencyCode,
): { quantity: ReturnType<typeof decimalToRational>; cost: ReturnType<typeof decimalToRational> } {
  let quantity = decimalToRational("0");
  let cost = decimalToRational("0");

  for (const transaction of [...transactions].sort(compareTransactions)) {
    validateTransactionCurrency(transaction, currency);
    const transactionQuantity = decimalToRational(transaction.quantity);

    if (transaction.kind === "buy") {
      const purchaseCost = multiplyDecimalRationals(
        transactionQuantity,
        decimalToRational(transaction.unitPrice.decimal),
      );
      const fee = transaction.fee === null
        ? decimalToRational("0")
        : decimalToRational(transaction.fee.decimal);
      quantity = addDecimalRationals(quantity, transactionQuantity);
      cost = addDecimalRationals(cost, addDecimalRationals(purchaseCost, fee));
      continue;
    }

    if (compareRationals(quantity, transactionQuantity) < 0) {
      throw new InsufficientQuantityError();
    }

    const proportionalCost = isZero(quantity)
      ? decimalToRational("0")
      : multiplyDecimalRationals(
          transactionQuantity,
          divideDecimalRationals(cost, quantity),
        );
    quantity = subtractDecimalRationals(quantity, transactionQuantity);
    cost = subtractDecimalRationals(cost, proportionalCost);
  }

  return { quantity, cost };
}

export function reducePosition(input: PositionReductionInput): Position {
  const portfolioId = parseDocumentId(input.portfolioId);
  const assetId = parseDocumentId(input.asset.id);

  for (const transaction of input.transactions) {
    if (transaction.assetId !== assetId) {
      throw new PositionAssetMismatchError();
    }
  }

  const { quantity, cost } = reduceSortedTransactions(input.transactions, input.asset.currency);
  const quantityValue = materializeDecimalRational(quantity);
  const investedAmount = materializeDecimalRational(cost);
  const closed = input.transactions.length > 0 && isZero(quantity);

  return {
    portfolioId,
    assetId,
    currency: input.asset.currency,
    quantity: quantityValue,
    investedAmount,
    averageCost: isZero(quantity)
      ? null
      : materializeDecimalRational(divideDecimalRationals(cost, quantity)),
    closed,
  };
}

export function reducePositions(input: PositionsReductionInput): readonly Position[] {
  const portfolioId = parseDocumentId(input.portfolioId);
  const assetsById = new Map<string, Asset>();

  for (const asset of input.assets) {
    const assetId = parseDocumentId(asset.id);
    if (assetsById.has(assetId)) {
      throw new PositionInvalidLedgerError();
    }
    assetsById.set(assetId, asset);
  }

  const transactionsByAsset = new Map<string, Transaction[]>();
  for (const transaction of input.transactions) {
    if (!assetsById.has(transaction.assetId)) {
      throw new PositionAssetNotFoundError();
    }

    const transactions = transactionsByAsset.get(transaction.assetId) ?? [];
    transactions.push(transaction);
    transactionsByAsset.set(transaction.assetId, transactions);
  }

  return [...transactionsByAsset.keys()]
    .sort()
    .map((assetId) =>
      reducePosition({
        portfolioId,
        asset: assetsById.get(assetId) as Pick<Asset, "id" | "currency">,
        transactions: transactionsByAsset.get(assetId) as readonly Transaction[],
      }),
    );
}
