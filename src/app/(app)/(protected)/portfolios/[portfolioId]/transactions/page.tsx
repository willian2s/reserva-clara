import { TransactionLedger } from "@/components/transaction/transaction-ledger";

export default async function TransactionsPage(
  props: PageProps<"/portfolios/[portfolioId]/transactions">,
) {
  const { portfolioId } = await props.params;

  return <TransactionLedger portfolioId={portfolioId} />;
}
