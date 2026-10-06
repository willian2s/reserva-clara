# ADR 006 — Identidade de Asset e ledger append-only

- **Status:** `accepted for 007`
- **Data:** 2026-09-25
- **Fase:** `007`

## Contexto

Asset precisa ser reutilizado em várias Portfolios do mesmo usuário, enquanto
Transaction precisa preservar histórico e não pode depender de ticker, índice de
array ou `number` decimal. O cliente usa Firebase Web, sem Admin SDK ou função
server-side. Auto ID sozinho não impede retry duplicado nem garante unicidade de
identidade.

## Decisão

Asset permanece em `users/{uid}/assets/{assetId}` com auto ID e identidade
canônica `(symbol, market, assetType, currency)`. Um registry
`users/{uid}/assetIdentities/{identityKey}` mapeia a tupla ao Asset. Criação de
Asset e registry ocorre em uma Firestore transaction; Rules usam `getAfter()` para
impedir Asset sem registry ou registry órfão.

Transaction (a união persistível de 007 supersede os placeholders
`contribution`/`withdrawal` de 005) permanece em
`users/{uid}/portfolios/{portfolioId}/transactions/{transactionId}` e V1 aceita
somente `buy` e `sell`. Documento é append-only; update/delete são negados. O ID
auto-gerado é reservado antes do primeiro write e reutilizado na reconciliação,
sem overwrite de payload divergente. Retry compara apenas os campos da intenção,
não `createdAt`, que é atribuído por server timestamp.

Write de Transaction lê Portfolio, Asset e ledger, executa reducer decimal em
memória e rejeita sell que deixaria quantidade negativa. Ordem total é
`effectiveDate ASC`, `createdAt ASC`, `documentId ASC`; segundos/nanos do
Timestamp são preservados para o domínio Transaction. Quantidade/preço são
strings canônicas (input pode normalizar zeros finais antes de persistir);
cálculos usam escala inteira/`bigint`, nunca floating point.

Rules usam `getAfter()` para impedir archive+Transaction no mesmo batch e
`exists()`/schema para ownership e referências. Elas não conseguem agregar todo
o ledger: quantidade não negativa é garantia do repository confiável, não
propriedade contra SDK direto. Uma garantia forte exige boundary server/aggregate
em fase futura.

## Alternativas rejeitadas

- **Ticker como document ID:** ticker não é identidade global e colide por
  mercado, tipo ou moeda.
- **Asset dentro de Portfolio:** duplica identidade e quebra reutilização.
- **Auto ID sem registry:** duas criações concorrentes podem duplicar a mesma
  identidade econômica.
- **Pretender que Rules agreguem sell:** Security Rules não fazem reducer sobre
  coleção inteira; declarar essa garantia seria falso sem backend/aggregate.
- **Position/contador auxiliar:** cria fonte de verdade concorrente ao ledger e
  exige consistência adicional.
- **Atualizar/deletar Transaction:** apaga trilha histórica; correção futura
  deve ser evento compensatório.
- **`number` para decimal:** perde precisão e torna reducer não determinístico.
- **Taxas/custos implícitos:** mistura conceitos sem contrato de rounding; fases
  futuras devem modelá-los explicitamente.

## Consequências

Registry aumenta superfície de Rules e exige testes de `getAfter`, mas oferece
unicidade sem romper decisão anterior de auto IDs. Reducer lendo ledger completo
é correto para V1 pequena, porém tem custo de escala e não é uma barreira contra
SDK direto; Quotes/Positions/Snapshots devem resolver materialização derivada e
uma boundary confiável sem tornar Position fonte autoritativa.
Sem backend, erro ambíguo não recebe retry cego: UI reconcilia pelo ID e mostra
conflito sanitizado.

## Revisão na fase 011

- **Estado temporal:** `accepted for 007`; esta ADR permanece válida para o
  Firestore enquanto ele for a autoridade e não foi marcada `superseded`.
- **Princípios preservados:** Asset é identidade owner-scoped com ID estável;
  Transaction é fato append-only; `buy`/`sell`, precisão exata, ordem temporal,
  idempotência e correção compensatória continuam contratos de domínio.
- **Mecanismos a suceder:** registry `assetIdentities`, Rules/repository como
  boundary patrimonial e leitura client-side serão substituídos por unique/FKs,
  API/Application, locks e PostgreSQL. `assetUsages` será somente evidência de
  auditoria, não autorização para delete.
- **Gatilho:** a sucessão efetiva depende de C6, C10 e C11; não há mudança
  produtiva nesta revisão e o risco C0 continua restrito a dev/testes sintéticos.

Evidência: [ADR 010 da revisão 011](010-modelo-relacional-e-registros-firestore.md),
[ADR 014](014-concorrencia-idempotencia-e-append-only.md) e [estratégia de
migração](../architecture/011/data-migration-strategy.md).
