# 010-03 — Compor read-side global

- **Ticker:** `010`
- **Número:** `03`
- **Status:** `completed`

## Objetivo e resultado esperado

Criar o leitor client-only do dashboard global, carregando carteiras ativas e
catálogo uma vez, isolando falhas por ledger e deduplicando Quotes entre
carteiras antes de produzir totais e distribuição reconciliados.

## Requisitos cobertos

- Critérios 19–27, 47–48 da spec 010.

## Escopo incluído

- Dependências injetáveis para `listPortfolios`, `listAssets`,
  `listTransactions` e `fetchQuotes`.
- Um ledger por carteira ativa e nenhuma leitura de arquivadas.
- Preparação por carteira com isolamento de falha via resultado discriminado.
- União/deduplicação dos Assets de posições abertas.
- Quote batch compartilhado e projeção da 010-02 por carteira.
- Totais globais, Quote coverage, distribuição conhecida e gaps.
- Harness `node:test`, script npm e fixtures sintéticas.

## Escopo excluído

- Componentes ou estado React.
- Retry isolado por carteira, polling ou cache client.
- Otimizar o schema Firestore ou criar read model persistido.
- Converter moedas ou incluir carteiras arquivadas.

## Dependências

- 010-01 e 010-02 concluídas.
- `listPortfolios` retorna apenas ativas no repository atual.
- Helpers de projeção e batching compartilhados disponíveis.

## Arquivos e símbolos prováveis

- `src/data/positions/dashboard-read.ts`.
- `src/data/positions/portfolio-read.ts` para helpers compartilhados.
- `src/domain/portfolio-summary.ts`.
- `src/data/firestore/portfolio-repository.ts`,
  `asset-repository.ts`, `transaction-repository.ts` apenas como dependências.
- `src/data/quotes/quote-client.ts` apenas como dependência.
- `tests/dashboard-read.test.mjs`.
- `scripts/run-dashboard-read-tests.mjs`.
- `package.json` com `test:dashboard-read`.

## Passos de implementação

1. Definir `GlobalDashboardReadDependencies` sem importar implementations no
   domínio puro.
2. Listar carteiras ativas e catálogo uma vez; retornar estado vazio sem Quotes
   quando não houver posições abertas.
3. Ler Transactions por carteira e isolar erros sanitizados sem registrar
   payload financeiro.
4. Preparar as carteiras legíveis e deduplicar `assetId` aberto globalmente.
5. Buscar Quotes em lotes sequenciais de 20 e fornecer os mesmos resultados a
   todas as carteiras afetadas.
6. Projetar entradas prontas/indisponíveis e calcular totais exatos.
7. Calcular participação no valor conhecido, com `null` para denominador zero.
8. Ordenar carteiras e posições de forma determinística.
9. Criar testes de chamadas, chunking, deduplicação, archive, falhas e moeda.

## Testes e comandos de validação

```bash
npm run test:positions-read
npm run test:dashboard-read
npm run test:quotes-service
npm run test:quotes-route
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
git diff --check
```

## Definição de pronto

- Catálogo e lista de carteiras são chamados uma vez por leitura global.
- Cada carteira ativa tem no máximo uma leitura de ledger.
- Asset compartilhado é cotado uma vez e chunking respeita 20.
- Falha de uma carteira não derruba as demais e torna o agregado parcial.
- Arquivadas não entram nas dependências nem nos totais.
- Breakdown e total global reconciliam sem `number` ou FX.

## Riscos e cuidados

- `Promise.allSettled` não deve mascarar falha estrutural comum de catálogo/auth.
- Não executar Quotes antes de validar/reduzir os ledgers legíveis.
- Não logar exceções com UID, paths, Transactions ou valores.
- Não assumir que Quote compartilhada autoriza acesso ao Asset; o endpoint
  continua verificando ownership.
- Não transformar carteira inválida em carteira com patrimônio zero.

## Registro de execução

- **Status:** `completed`
- **Arquivos alterados:** `src/data/positions/dashboard-read.ts`,
  `src/data/positions/portfolio-read.ts`, `tests/dashboard-read.test.mjs`,
  `scripts/run-dashboard-read-tests.mjs` e `package.json`.
- **Decisões:** o leitor lista catálogo e carteiras uma vez, filtra arquivadas,
  lê um ledger por carteira ativa e prepara cada carteira isoladamente. Assets
  abertos são unidos por `assetId`, ordenados e cotados em lotes sequenciais de
  até 20; a mesma lista sanitizada é projetada por todas as carteiras legíveis.
  Falhas de ledger/composição viram entries indisponíveis com gaps de Portfolio,
  sem imputação de zero; falhas de autenticação permanecem fatais. Totais,
  shares e coverage usam os helpers decimais e a cobertura de Quote é contada
  por Asset deduplicado. Moeda-base diferente de BRL é excluída sem FX.
- **Desvios:** nenhum requisito foi alterado. O batching compartilhado recebeu
  apenas a correção necessária para não converter `UNAUTHENTICATED` em Quote
  indisponível; não foram alterados schema, Rules, repositories ou UI.
- **Comandos executados:** `npm run test:domain`, `npm run test:positions`,
  `npm run test:positions-read`, `npm run test:dashboard-read`,
  `npm run test:quotes-service`, `npm run test:quotes-route`, `npm run lint`,
  `npm exec next typegen`, `npx tsc --noEmit`, `npm run build` e
  `git diff --check`.
- **Resultados e evidências:** todos os comandos concluíram com código zero.
  Os harnesses passaram com 14 testes de domínio, 4 de posições, 9 de
  read-side individual e 8 de read-side global; Quotes service passou 8 e
  Quotes route passou 8. Os testes globais comprovam catálogo único, archive,
  ledger isolado, deduplicação, chunking sequencial 20+1, stale/unavailable,
  moeda, falha de autenticação, denominador zero e reconciliação decimal. A
  revisão independente final não encontrou bloqueadores.
- **Riscos residuais:** não há teste específico separado para autenticação fatal
  em cada uma das dependências de catálogo/ledger, embora os erros sejam
  propagados pelo boundary. Smoke de UI permanece nas subtarefas seguintes.
