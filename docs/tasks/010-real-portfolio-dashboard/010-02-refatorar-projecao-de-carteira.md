# 010-02 — Refatorar projeção de carteira

- **Ticker:** `010`
- **Número:** `02`
- **Status:** `completed`

## Objetivo e resultado esperado

Extrair uma projeção compartilhável de carteira e enriquecer o read model do
detalhe com Asset, observação de Quote e totais conhecidos, mantendo a facade
`readPortfolioPositions` compatível e toda a regressão da fase 009 verde.

## Requisitos cobertos

- Critérios 1–18, 20–21 e 47 da spec 010.

## Escopo incluído

- Separar preparação do ledger, batching/sanitização de Quotes e projeção final.
- Associar cada Position ao Asset correspondente.
- Preservar `quotedAt`, `fetchedAt`, freshness, motivo e código sanitizado.
- Derivar patrimônio e custo investido na moeda-base com status explícito.
- Preservar posições fechadas no contrato, sem solicitar Quote para elas.
- Manter `PortfolioPositionRead` existente ou fornecer adaptação aditiva.
- Ampliar testes do read-side individual e do summary puro.

## Escopo excluído

- Listar múltiplas carteiras ou agregar dashboard global.
- Criar componentes, hooks ou alterar as rotas.
- Persistir summaries ou modificar Rules/repositories de escrita.

## Dependências

- 010-01 concluída.
- `reducePositions`, `deriveMarketPosition`, `calculateAllocation` e helpers
  decimais da fase 009.
- `fetchQuotes` e política de lote da fase 008.

## Arquivos e símbolos prováveis

- `src/data/positions/portfolio-read.ts`.
- `src/domain/portfolio-summary.ts`.
- `src/domain/index.ts`.
- `tests/positions-read.test.mjs`.
- `tests/domain.test.mjs` ou novo teste de portfolio summary.
- scripts de harness apenas se necessários.

## Passos de implementação

1. Extrair helpers puros para preparar Positions a partir de Portfolio, Assets
   e Transactions sem I/O ou React.
2. Extrair o fetch de lotes, incluindo resposta incompleta e erro sanitizado,
   para reutilização pelo leitor global.
3. Projetar `PositionReadItem` a partir das Positions e QuoteResults, mantendo
   o resultado indisponível que hoje é descartado.
4. Calcular `KnownAmount` de patrimônio e custo com aritmética decimal exata.
5. Derivar `QuoteCoverage` e ordenação determinística.
6. Adaptar `readPortfolioPositions` para os helpers sem mudar seu boundary
   client-only nem duplicar chamadas.
7. Cobrir posições fresh, stale, unavailable, moeda incompatível, fechada,
   carteira vazia e ledger inválido.
8. Executar regressão completa da 009 antes de avançar.

## Testes e comandos de validação

```bash
npm run test:domain
npm run test:positions
npm run test:positions-read
npm run test:quotes-route
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
git diff --check
```

## Definição de pronto

- Existe uma única projeção por carteira reutilizável pelo detalhe e global.
- O read model preserva Asset, timestamps, freshness e erro sanitizado.
- Totais obedecem à matriz da 010-01 e reconciliam com Allocation.
- Posição fechada não dispara Quote nem aparece como posição atual.
- Testes antigos e novos passam sem persistência ou alteração de schema.

## Riscos e cuidados

- Não mudar a semântica matemática de Position/MarketPosition/Allocation.
- Não importar Firebase, React ou `fetch` em módulos puros de domínio.
- Não fazer lookup por símbolo; usar sempre `assetId`.
- Não converter erro de ledger em indisponibilidade normal de Quote.
- Não perder o limite de 20 nem executar lotes concorrentes além da política.

## Registro de execução

- **Status:** `completed`
- **Arquivos alterados:** `src/data/positions/portfolio-read.ts`,
  `src/data/positions/portfolio-projection.ts`,
  `src/domain/portfolio-summary.ts`, `tests/positions-read.test.mjs` e
  `tests/domain.test.mjs`.
- **Decisões:** a preparação do ledger, a projeção enriquecida e a extração de
  posições valorizadas foram separadas em helpers reutilizáveis. O batching de
  Quotes permanece sequencial, limitado a 20, sanitiza respostas incompletas e
  valida cada resultado no boundary. A facade preserva `portfolio`, `positions`,
  `marketPositions` e `allocation`, adicionando `items`, `marketValue`,
  `investedAmount` e `quotes`. Totais usam racionais decimais; stale permanece
  conhecido, unavailable preserva código sanitizado e posições fora da moeda
  base geram gap sem FX. A ordenação usa comparação lexicográfica determinística
  compartilhada com o domínio. A projeção aceita um superset de QuoteResults
  compartilhado pelo leitor global e considera somente Assets abertos da
  carteira corrente; duplicidade dentro desse conjunto continua sendo falha de
  composição.
- **Desvios:** nenhum requisito foi alterado. O helper de projeção foi criado em
  módulo próprio para ser consumido pelo leitor global da 010-03; não foram
  alteradas rotas, componentes, persistência, Rules ou contratos de escrita.
- **Comandos executados:** `npm run test:domain`, `npm run test:positions`,
  `npm run test:positions-read`, `npm run test:quotes-route`, `npm run lint`,
  `npm exec next typegen`, `npx tsc --noEmit`, `npm run build` e
  `git diff --check`.
- **Resultados e evidências:** todos os comandos concluíram com código zero.
  Os testes registraram 14 casos de domínio, 4 de posições e 9 de read-side;
  o build Next.js 16.3.5 compilou, executou TypeScript e gerou todas as rotas.
  A revisão independente apontou ordenação, validação defensiva de Quote e
  compatibilidade com superset global; os pontos foram corrigidos e as
  validações foram executadas novamente com sucesso.
- **Riscos residuais:** o leitor global ainda depende da composição desta
  projeção e será implementado somente em 010-03. Não foi executado smoke de UI,
  pois dashboards e componentes estão fora do escopo desta subtarefa.
