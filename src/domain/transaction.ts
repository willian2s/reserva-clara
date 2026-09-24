import type {
  CivilDate,
  DocumentId,
  PositiveMoneyMinor,
  Quantity,
  UnitPrice,
} from "./value-objects";

/** Initial ledger events; future kinds must be added without reinterpretation. */
export type TransactionKind =
  | "buy"
  | "sell"
  | "contribution"
  | "withdrawal";

/** Reserved names for future phases; no persistence or Rules are opened here. */
export type FutureTransactionKind =
  | "income"
  | "dividend"
  | "fee"
  | "tax"
  | "transfer"
  | "reversal"
  | "adjustment";

type TransactionBase = Readonly<{
  id: DocumentId;
  effectiveDate: CivilDate;
  createdAt: Date;
}>;

export type TradeTransaction = TransactionBase &
  Readonly<{
    kind: "buy" | "sell";
    assetId: DocumentId;
    quantity: Quantity;
    unitPrice: UnitPrice;
  }>;

export type CashTransaction = TransactionBase &
  Readonly<{
    kind: "contribution" | "withdrawal";
    amount: PositiveMoneyMinor;
  }>;

/** Future ledger contract. Transactions remain source of truth; positions are derived. */
export type Transaction = TradeTransaction | CashTransaction;
