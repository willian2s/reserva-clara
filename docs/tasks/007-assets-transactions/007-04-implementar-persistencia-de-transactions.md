# 007-04 — Implementar persistência de Transactions

- **Ticker:** `007`
- **Número:** `04`
- **Status:** `completed`

## Objetivo

Implementar repository append-only de Transaction com referência owner-scoped,
idempotência por auto ID de intenção e validação cronológica concorrente.

## Dependências

- 007-01 archive gate concluída.
- 007-02 reducer e contratos concluídos.
- 007-03 Asset repository disponível.

## Escopo

- Criar converter/parser e path da subcoleção de Portfolio.
- Gerar `transactionId` auto-ID antes do primeiro write e mantê-lo durante a
  intenção/reconciliação.
- Usar `runTransaction` para ler Portfolio, Asset e ledger necessário; negar
  Portfolio arquivada, Asset ausente e sell cronologicamente inválido.
- Criar somente documento novo; payload igual com mesmo ID reconcilia comparando
  `kind`, `assetId`, `quantity`, `unitPrice` e `effectiveDate`, sem comparar o
  `createdAt` server-side; payload diferente gera conflito; nunca overwrite.
- Implementar listagem com ordenação determinística e paginação somente se a
  query real puder preservar cursor completo.
- Expor erros sanitizados e sem retry automático cego.

## Fora de escopo

- Update/delete, compensating event, Position, aggregate auxiliar ou Rules novas.

## Critérios de aceite

- Buy válido persiste uma vez.
- Sell inválido não altera ledger quando escrito pelo repository.
- Archive iniciado antes do commit bloqueia novo write; race é tratada por retry
  otimista e `getAfter()` nas Rules, inclusive em batch archive+Transaction.
- Corrida de duas vendas não permite quantidade final negativa.
- Documento existente não é sobrescrito por retry ou payload divergente.
- Risco residual de SDK direto escrever sell schema-válido sem reducer fica
  explicitamente registrado; não declarar Rules como agregador de ledger.

## Arquivos prováveis

- `src/data/firestore/transaction-repository.ts`
- `src/data/firestore/parsers/transaction-parser.ts`
- `src/data/firestore/converters/transaction-converter.ts`
- `src/data/firestore/paths.ts`
- `src/data/firestore/errors.ts`

## Validação

Testar repository e reducer com fixtures sintéticas; depois `npm run lint`,
`npm exec next typegen`, `npx tsc --noEmit` e `git diff --check`.

## Registro de execução

- **Arquivos alterados:**
  - `src/domain/transaction.ts`
  - `src/data/firestore/errors.ts`
  - `src/data/firestore/paths.ts`
  - `src/data/firestore/parsers/transaction-parser.ts`
  - `src/data/firestore/converters/transaction-converter.ts`
  - `src/data/firestore/transaction-repository.ts`
- **Decisões/desvios:**
  - O `transactionId` é gerado com `doc(CollectionReference).id` antes do
    `runTransaction` e pode ser recebido explicitamente para reconciliação da
    mesma intenção.
  - Não foi adicionada paginação: a listagem lê o ledger completo e aplica
    `sortTransactions`, preservando `effectiveDate`, `createdAt` e ID.
  - A validação de venda usa um evento sintético posterior aos eventos lidos,
    preservando a regra de backfill sem usar `number` para decimais.
  - Como o SDK Web não expõe leitura de query no objeto de
    `FirestoreTransaction`, o ledger é consultado dentro do callback e cada
    documento encontrado é relido pela transação. A criação também atualiza
    `Portfolio.updatedAt` como marcador de concorrência; archive/restore e Rules
    permanecem fora desta subtarefa.
  - Converter/parser usam schema fechado, `serverTimestamp()` em `createdAt`,
    TimestampParts com nanos e rejeição de update/merge.
- **Comandos/resultados/evidências:**
  - `npm run test:domain` — 5 testes passaram.
  - `npm run test:rules` — 7 testes passaram; Transactions continuam negadas
    enquanto as Rules permanecem fechadas para 007-05.
  - `npm run lint` — passou sem warnings.
  - `npm exec next typegen && npx tsc --noEmit` — passou.
  - `npm run build` — build de produção passou.
  - `git diff --check` — passou.
  - Revisão independente — aprovada após corrigir a geração inicial de ID que
    usava um path de coleção com `doc(db, path)`.
- **Riscos residuais:**
  - O ledger completo é lido em cada criação/listagem; carteiras grandes podem
    exceder limites operacionais e exigirão aggregate/snapshot em fase futura.
  - `getDocs` não participa diretamente do read set transacional; o marcador
    `Portfolio.updatedAt` serializa writes deste repository, mas não impede
    sell schema-válido escrito diretamente pelo SDK. As Rules, ownership,
    append-only e `getAfter()` serão provados em 007-05.
  - Ainda não há teste de integração específico do repository para idempotência,
    conflito de payload e duas vendas concorrentes; essa evidência fica para o
    Emulator da subtarefa 007-05.
