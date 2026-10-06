# ADR 010 — Modelo relacional e substituição dos registros Firestore

- **Status:** `proposed`
- **Ticker relacionado:** `011`
- **Decisão:** 4 de 15 da spec 011

## Contexto

`assetIdentities` e `assetUsages` existem para compensar limitações do Firestore.
Copiá-los literalmente criaria entidades técnicas e uma segunda fonte de
verdade no PostgreSQL.

## Decisão proposta

O modelo lógico inicial contém `Owner`, `Portfolio`, `Asset` e `Transaction`.
`Transaction` referencia Portfolio e Asset por FKs compostas owner-scoped.

- A identidade de Asset é uma unique constraint em
  `(owner, symbol, market, assetType, currency)`.
- `assetIdentities` não vira tabela; seu resultado é validado durante a
  migração.
- `assetUsages` não vira tabela; qualquer Transaction histórica é evidência de
  uso e `ON DELETE RESTRICT` impede remoção do Asset referenciado.
- Position, MarketPosition, Allocation e dashboards permanecem derivados e
  reconstruíveis, não persistidos como verdade.

## Evidência e alternativas

O [ERD lógico](../architecture/011/relational-model.md#erd-lógico) e a matriz
[Firestore → PostgreSQL](../architecture/011/relational-model.md#matriz-firestore--postgresql)
documentam campos, FKs, constraints e auditoria. Copiar registries ou persistir
Position foi rejeitado por inércia e por criar autoridade paralela.

## Consequências e revisão

Colisões, órfãos e Transaction sem usage precisam ser auditados antes da
promoção. A proposta será validada com export sanitizado, volumetria e
PostgreSQL real na 016; divergências vão para quarentena.

## Referências

- [ADR 006 — identidade de Asset e ledger](006-assets-transactions-ledger.md)
- [Estratégia de migração](../architecture/011/data-migration-strategy.md)
