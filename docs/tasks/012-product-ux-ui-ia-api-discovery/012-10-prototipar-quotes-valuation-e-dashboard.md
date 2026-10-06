# 012-10 — Prototipar Quotes, valuation e dashboard

- **Ticker:** `012`
- **Número:** `10`
- **Status:** `pending`

## Objetivo e resultado esperado

Definir como o usuário interpreta Quotes, posições, alocação, valor conhecido e
consolidado, cobrindo fresh/stale/unavailable, timeout, rate limit, moeda
incompatível, parcial, arquivada fora do global e refresh.

## Requisitos cobertos

UX-03, UX-04, OBS-01, `valuation/portfolio`, `valuation/global` e `quote/read`
como capacidades provisórias.

## Escopo incluído e excluído

Incluído: hierarquia, copy, gaps, estados, refresh e telemetria percebida.
Excluído: BRAPI, cache, posições C#, read model persistido, performance final e
contratos do endpoint legado.

## Dependências

`012-05`, `012-07`, `012-09`, componentes financeiros, `portfolio-summary.ts` e
handoff de Quotes/Positions da 011.

## Arquivos e símbolos prováveis

`docs/architecture/012/slices/valuation-and-dashboard.md`, `GlobalDashboard`,
`PortfolioDetail`, `KnownAmountCard`, `QuoteCoverageCard`, `PositionTable`.

## Passos de implementação

1. Prototipar detalhe e consolidado com dados sintéticos parciais.
2. Testar stale, unavailable, timeout, moeda incompatível e carteira indisponível.
3. Definir linguagem para custo, patrimônio conhecido e ausência de histórico.
4. Encaminhar queries, limites e métricas para 019 sem persistir Position.

## Testes e comandos de validação

Walkthrough de compreensão e recuperação; confirmar que indisponível não vira
zero, stale não parece fresh e arquivadas não entram no consolidado.

## Definição de pronto

Pacote de leitura com protótipos, estados, copy, gaps, refresh e capability
provisória, rastreável aos invariantes de domínio.

## Riscos e cuidados

Não chamar cotação de garantia, não exibir performance histórica sem snapshots e
não transformar um read model em fonte autoritativa.
