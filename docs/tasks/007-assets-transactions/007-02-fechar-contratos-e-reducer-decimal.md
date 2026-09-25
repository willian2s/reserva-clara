# 007-02 — Fechar contratos e reducer decimal

- **Ticker:** `007`
- **Número:** `02`
- **Status:** `pending`

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

- **Arquivos alterados:** preencher ao executar.
- **Decisões/desvios:** registrar qualquer ajuste aos limites; não usar `parseFloat`.
- **Comandos/resultados/evidências:** preencher ao executar.
- **Riscos residuais:** documentar limite operacional de ledger completo.
