# ADR 005 — Archive de Portfolio antes de abrir o ledger

- **Status:** `accepted for 007`
- **Data:** 2026-09-25
- **Fase:** `007`

## Contexto

006 implementou hard delete enquanto Portfolio não possuía subcoleções. Firestore
não faz cascade de subcoleções, portanto abrir Transactions mantendo delete do
documento pai permitiria remover o contexto e deixar ledger órfão. Security Rules
não conseguem enumerar genericamente todos os filhos para autorizar delete com
segurança.

## Decisão

Antes de abrir qualquer write de Transaction:

- Portfolio passa a ter `archivedAt: Date | null` no domínio e
  `Timestamp | null` no documento Firestore;
- documentos legados sem campo são interpretados como ativos;
- `archivePortfolio` e `restorePortfolio` atualizam `archivedAt` e `updatedAt`
  com controle server-side;
- `deletePortfolio` deixa de existir no repository público;
- `allow delete` de Portfolio é removido das Rules;
- archive preserva pai e filhos, e Transaction create exige Portfolio ativa;
- purge físico, cascade e exclusão de Asset/Transaction não pertencem ao CRUD
  client-side V1.

Listagem ativa e arquivada são separadas. Portfolio arquivada permanece legível
para restauração e histórico, mas fica read-only para o ledger.

## Alternativas rejeitadas

- **Manter hard delete:** perde contexto do ledger e não tem rollback de dados.
- **Cascade client-side:** falhas parciais e não há autoridade transacional de
  servidor.
- **Contador de filhos:** race, manutenção extra e não prova existência de toda
  subcoleção.
- **Migration obrigatória de todos os documentos:** quebra leitura de legado e
  exige operação produtiva antes do gate.

## Consequências

Archive é reversível e compatível, mas não remove dados. A UI deve substituir
linguagem de delete por archive e não prometer purge. Rules, parser, converter,
repository, testes e UI precisam mudar coordenadamente. O gate de 007 falha se
qualquer hard delete permanecer.

## Revisão na fase 011

- **Estado temporal:** `accepted for 007`; esta ADR continua descrevendo o
  comportamento do legado até o cutover e não foi marcada `superseded`.
- **Princípio preservado:** archive/restore mantém o pai, o ledger histórico e
  a leitura; Portfolio arquivada não aceita novos fatos.
- **Mecanismo a suceder:** `archivedAt`/Rules/repository Firestore serão
  reimplementados como lifecycle transacional na API/PostgreSQL, com lock da
  Portfolio, FKs e autorização owner-scoped.
- **Gatilho:** a sucessão só pode ser aceita após paridade, C10 e C11; antes
  disso, o comportamento Firestore desta ADR permanece histórico-operacional.

Evidência: [ADR 021 da revisão 011](021-lifecycle-de-asset-referenciado.md)
e [modelo relacional](../architecture/011/relational-model.md#fks-lifecycle-e-append-only).
