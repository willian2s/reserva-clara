# ADR 021 — Lifecycle de Asset referenciado por Transaction

- **Status:** `proposed`
- **Ticker relacionado:** `011`
- **Decisão:** 15 de 15 da spec 011

## Contexto

Asset é identidade econômica compartilhável entre Portfolios. Um Asset usado no
ledger não pode ser removido sem apagar contexto histórico, e trocar seu ID
quebraria referências migradas.

## Decisão proposta

- `assetId` é estável durante a vida do fato e é preservado na migração.
- Delete físico de Asset referenciado por qualquer Transaction é bloqueado por
  FK/restrict, independentemente de `assetUsages` legado.
- Archive/retire é preferível a hard delete para identidade histórica; o Asset
  permanece legível para o ledger.
- Alteração de identidade de Asset usado não pode trocar o ID nem reescrever
  Transactions. A 012 deve decidir, com UX, se a identidade é imutável após uso
  ou se haverá comando explícito de correção/migração; nenhuma opção autoriza
  mutação silenciosa.
- `assetIdentities` e `assetUsages` são mecanismos de compatibilidade/auditoria,
  não autoridade para liberar delete.

## Evidência e alternativas

O [modelo relacional](../architecture/011/relational-model.md#fks-lifecycle-e-append-only)
e o [handoff de UX](../architecture/011/frontend-ux-contract-discovery.md#5-jornadas-obrigatórias-para-a-012-e-dependências-uxapi)
mostram FK `RESTRICT`, preservação de IDs e a pergunta UX-06. Hard delete,
cascade e troca automática de ID foram rejeitados.

## Consequências e revisão

O produto precisa explicar archive/retire e possíveis correções compensatórias.
Esta proposta será revisada em 012 (decisão de jornada) e 018 (enforcement,
concorrência e migração), antes de qualquer lifecycle no novo stack.

## Referências

- [ADR 005 — archive de Portfolio](005-portfolio-archive-lifecycle.md)
- [ADR 006 — Asset e ledger](006-assets-transactions-ledger.md)
