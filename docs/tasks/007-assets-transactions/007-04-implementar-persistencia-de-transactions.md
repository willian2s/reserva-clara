# 007-04 — Implementar persistência de Transactions

- **Ticker:** `007`
- **Número:** `04`
- **Status:** `pending`

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

- **Arquivos alterados:** preencher ao executar.
- **Decisões/desvios:** registrar cursor, limites e política de conflito.
- **Comandos/resultados/evidências:** preencher ao executar.
- **Riscos residuais:** custo de ler ledger completo em carteiras grandes.
