# 007-02 — Fechar contratos e reducer decimal

- **Ticker:** `007`
- **Número:** `02`
- **Status:** `completed`

## Objetivo

Transformar contratos futuros de Asset/Transaction em schemas V1 fechados e
implementar reducer de quantidade com ordem total, sem floating point.

## Dependências

- 007-01 concluída e archive gate comprovado.
- Value objects, errors e contratos 005 preservados onde compatíveis; a união
  persistível de Transaction `buy`/`sell` supersede os placeholders
  `contribution`/`withdrawal` de 005.

## Escopo

- Fechar `AssetType`, normalização de símbolo/mercado, currency e `identityKey`.
- Restringir Transaction persistida a união `buy`/`sell`.
- Definir limites 30 dígitos inteiros/18 fracionários para quantidade e preço.
- Formalizar persistência como `(?:0|[1-9][0-9]{0,29})(?:\.[0-9]{0,17}[1-9])?`;
  input com zeros finais pode ser normalizado antes do write, mas Rules recebem
  somente forma canônica. Compartilhar fixtures parser/Rules/reducer.
- Implementar comparação, soma e subtração decimal por escala inteira/`bigint`.
- Implementar ordenação por `effectiveDate`, `createdAt`, `documentId`,
  preservando segundos/nanos de Timestamp no domínio Transaction; Portfolio
  continua usando `Date` no domínio.
- Definir gramática persistida sem zeros finais; aceitar normalização de input
  antes do write e compartilhar fixtures entre parser, Rules e reducer.
- Implementar reducer puro que rejeita sell acima de quantidade disponível.
- Definir erros sanitizados para decimal inválido, data, referência e conflito.
- Cobrir backfill, mesmo dia, empate, frações, carry/borrow e quantidade zero.

## Fora de escopo

- Firestore SDK, Rules, UI, dinheiro calculado, custos/taxas ou Position.

## Critérios de aceite

- Domínio não importa React/Firebase e não persiste `number` decimal.
- Campos desconhecidos ou kinds futuros não são aceitos pelo parser.
- Reducer é determinístico para qualquer permutação de leitura após sort.
- Sell que tornaria quantidade negativa falha antes do write pelo repository;
  documentar que Rules não agregam ledger contra SDK direto.
- Limites e arredondamento não são implícitos.

## Arquivos prováveis

- `src/domain/asset.ts`
- `src/domain/transaction.ts`
- `src/domain/value-objects.ts`
- `src/domain/errors.ts`
- novo módulo em `src/domain/` para decimal/reducer
- testes puros usando runner já existente, sem dependência nova

## Validação

Executar testes de domínio adicionados, `npm run lint`, `npm exec next typegen`,
`npx tsc --noEmit` e `git diff --check`.

## Registro de execução

### Arquivos alterados

- `src/domain/asset.ts` — contrato Asset V1, enum fechado, normalização e
  `identityKey` derivada.
- `src/domain/transaction.ts` — união persistível somente `buy`/`sell`, parser
  de campos fechados e Timestamp com segundos/nanosegundos.
- `src/domain/value-objects.ts` — gramática decimal canônica, limites 30/18,
  parsers de input/persistência e validação de Timestamp.
- `src/domain/errors.ts` — erros sanitizados de decimal, data, referência,
  quantidade insuficiente e conflito.
- `src/domain/decimal-reducer.ts` — comparação, soma, subtração, ordenação e
  reducer puro com `bigint`.
- `src/domain/index.ts` — export do reducer.
- `tests/domain.test.mjs` — testes puros de contratos, decimais, ordenação e
  reducer usando `node:test`.
- `scripts/run-domain-tests.mjs` — compilação temporária do domínio para o
  runner nativo, sem dependência nova.
- `package.json` — script `test:domain`.

### Decisões e desvios

- Input decimal aceita zeros fracionários finais e normaliza antes do write;
  `parsePersisted*` aceita somente a gramática canônica sem zeros finais.
- O limite de 30 dígitos inteiros e 18 fracionários é aplicado explicitamente
  também ao input, sem `parseFloat` ou `number` para cálculo decimal.
- `Transaction.createdAt` usa `TimestampParts` agnóstico ao Firebase, mantendo
  `seconds` e `nanoseconds`; Portfolio permanece com `Date`.
- `parseTransactionDocument` e `parseAssetDocument` são estritos para dados
  persistidos; construtores de input fazem a normalização prevista.
- O reducer aceita uma coleção sem `assetId` explícito somente quando todos os
  eventos pertencem ao mesmo Asset; mistura de Assets falha com referência
  inválida. Venda acima do saldo falha antes de qualquer write.
- IDs são comparados por code units (`<`/`>`) para não depender de locale.

### Comandos/resultados/evidências

```bash
npm run test:domain
npm run test:rules
npm run lint
npm exec next typegen && npx tsc --noEmit
npm run build
git diff --check
```

- `test:domain`: 5 testes aprovados, 0 falhas; cobriu normalização, campos
  extras, kinds futuros, limites, canonicalização, carry/borrow, backfill,
  empate por timestamp/ID, quantidade zero, múltiplos Assets e venda negativa.
- `test:rules`: 7 testes aprovados, 0 falhas; Rules de 007 continuam fechadas.
- Lint, typecheck com typegen, build e `git diff --check` passaram.
- Build preservou somente as rotas existentes; nenhum path de Asset/Transaction
  foi aberto nesta subtarefa.

### Riscos residuais

- O reducer lê o ledger completo fornecido pelo chamador; crescimento além do
  limite operacional de leitura continua exigindo aggregate/snapshot em fase
  futura, sem introduzir Position nesta subtarefa.
- Security Rules ainda não agregam o ledger contra SDK direto; a garantia de
  quantidade não negativa depende do repository confiável e permanece risco
  documentado para as subtarefas de persistência.
- Parser/converter Firestore, repository, Rules abertas e UI permanecem nas
  subtarefas seguintes.
