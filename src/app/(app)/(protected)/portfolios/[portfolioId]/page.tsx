import { PortfolioDetail } from "@/components/portfolio/portfolio-detail";

export default async function PortfolioPage(
  props: PageProps<"/portfolios/[portfolioId]">,
) {
  const { portfolioId } = await props.params;

  return <PortfolioDetail portfolioId={portfolioId} />;
}
