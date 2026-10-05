# 010-01 — Fechar contratos e semântica

- **Ticker:** `010`
- **Número:** `01`
- **Status:** `completed`

## Objetivo e resultado esperado

Fechar os contratos públicos e a linguagem patrimonial da fase antes de alterar
o read-side ou a UI. Ao final, implementação e testes terão definições únicas
para total conhecido, custo investido, posição exibível, cobertura de Quotes,
escopo global ativo, archive e falhas parciais.

## Requisitos cobertos

- Critérios 1–18, 23–27 e 43 da spec 010.
- Premissas de moeda-base, archive, stale, unavailable e ausência de histórico.

## Escopo incluído

- Confirmar nomes e discriminantes de `KnownAmount`, `AmountGap`,
  `PositionReadItem`, `QuoteCoverage`, `PortfolioDashboardRead`,
  `GlobalPortfolioEntry` e `GlobalDashboardRead`.
- Definir matriz completa de `empty | complete | partial` para patrimônio e
  custo investido.
- Definir razões estáveis e sanitizadas para gaps de Asset/Portfolio.
- Fixar carteiras ativas como escopo global e BRL como moeda consolidada V1.
- Definir copy normativa para patrimônio conhecido, custo remanescente, stale,
  unavailable, diferença nominal e carteira arquivada.
- Registrar assinaturas na spec e/ou módulos de tipos sem implementar UI.

## Escopo excluído

- Refatorar `readPortfolioPositions`, buscar dados ou criar componentes.
- Alterar contratos persistidos, reducers matemáticos, Rules ou `/api/quotes`.
- Introduzir target allocation, performance, FX, caixa ou snapshots.

## Dependências

- Spec 010 aprovada como direção.
- Contratos 009 de Position, MarketPosition, Allocation e read-side.
- ADRs de ledger e archive.

## Arquivos e símbolos prováveis

- `docs/specs/010-real-portfolio-dashboard.md`.
- `src/domain/portfolio-summary.ts` ou módulo equivalente de contratos puros.
- `src/data/positions/portfolio-read.ts` para compatibilidade dos tipos.
- `src/domain/index.ts` somente se os contratos puros forem exportados.
- `tests/domain.test.mjs` ou novo harness de contratos/summary.

## Passos de implementação

1. Mapear cada situação da matriz de totais para status, valor conhecido e gap.
2. Fechar o contrato de item de posição sem contaminar `MarketPosition` com
   Asset ou metadados de Quote.
3. Fechar o contrato global discriminado para carteira pronta/indisponível.
4. Definir ordenação determinística e identidade `portfolioId + assetId`.
5. Confirmar que stale é valorizável, unavailable não é zero e moeda divergente
   não recebe FX implícito.
6. Revisar a copy para não prometer total, performance, histórico ou aportes.
7. Atualizar a documentação apenas com decisões realmente fechadas.

## Testes e comandos de validação

```bash
npm run test:domain
npm run test:positions
npm run test:positions-read
npm run lint
npm exec next typegen
npx tsc --noEmit
git diff --check
```

Se a subtarefa adicionar somente tipos/documentação, os testes devem provar que
exports e contratos existentes continuam compilando; não declarar runtime novo.

## Definição de pronto

- Todos os discriminantes, razões e semânticas estão sem ambiguidade.
- Total parcial, zero parcial e custo investido têm comportamento documentado.
- Archive, BRL V1 e falhas por carteira estão fechados.
- Nenhum contrato da 009 ou persistido foi quebrado.
- A subtarefa 010-02 pode refatorar a projeção sem decisão de produto pendente.

## Riscos e cuidados

- Não usar “total” quando parte do valor é desconhecida.
- Não modelar Quote stale como falha de cobertura.
- Não transformar contrato de dashboard em snapshot ou read model persistível.
- Não expor mensagem de provider/Firebase em `AmountGap`.
- Não criar abstração genérica além dos dois dashboards desta fase.

## Registro de execução

- **Status:** `completed`
- **Arquivos alterados:** `src/domain/portfolio-summary.ts`,
  `src/domain/index.ts`, `docs/specs/010-real-portfolio-dashboard.md`,
  `docs/tasks/010-real-portfolio-dashboard/010-00-overview.md` e este arquivo.
- **Decisões:** contratos puros foram exportados em módulo dedicado; `AmountGap`
  é discriminado por `asset`/`portfolio` e contém somente IDs e razões
  sanitizadas; `QuoteCoverage` conta unidades solicitadas, sem percentual de
  cobertura monetária; global usa `active-portfolios` e `BaseCurrencyCode`
  (BRL). Stale permanece valorizável, unavailable não recebe zero e custo
  investido permanece independente de Quote quando o custo está em BRL.
  `composition-failed` é falha de Portfolio, nunca gap de Asset; Quote
  unavailable exige código sanitizado, enquanto incompatibilidade de moeda não
  carrega código; a cobertura obedece `requested = fresh + stale + unavailable`.
  `GlobalPortfolioCandidate` permite diagnosticar uma moeda-base não-BRL no seam
  global sem relaxar o contrato persistido V1.
- **Desvios:** nenhum. Não foram alterados UI, read-side, contratos
  persistidos, reducers, Rules ou endpoint de Quotes.
- **Comandos executados:** `npm run test:domain`, `npm run test:positions`,
  `npm run test:positions-read`, `npm run lint`, `npm exec next typegen`,
  `npx tsc --noEmit`, `npm run build` e `git diff --check`.
- **Resultados e evidências:** todos os comandos concluíram com código zero;
  os harnesses de domínio/read-side continuaram compilando com os exports
  novos. A matriz de totais, razões, copy normativa e escopo BRL foi registrada
  na spec 010.
- **Riscos residuais:** a projeção enriquecida e a composição global ainda não
  consomem os contratos; permanecem deliberadamente para 010-02 e 010-03.
