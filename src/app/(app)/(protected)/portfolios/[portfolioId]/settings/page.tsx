import { PortfolioSettings } from "@/components/portfolio/portfolio-settings";

export default async function PortfolioSettingsPage(
  props: PageProps<"/portfolios/[portfolioId]/settings">,
) {
  const { portfolioId } = await props.params;

  return <PortfolioSettings portfolioId={portfolioId} />;
}
