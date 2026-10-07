# ADR 021 — Lifecycle de Asset referenciado por Transaction

- **Status:** `proposed — decisão de produto da 012; enforcement pendente em 018`
- **Ticker relacionado:** `011/012`
- **Decisão:** UX-06 da 012; enforcement e concorrência permanecem em 018

## Contexto

Asset é identidade econômica compartilhável entre Portfolios. Um Asset usado no
ledger não pode ser removido sem apagar contexto histórico, e trocar seu ID
quebraria referências migradas.

## Decisão da descoberta 012

- `assetId` é estável durante a vida do fato e é preservado na migração.
- Depois da primeira Transaction, a identidade econômica é imutável na edição
  comum. Correção excepcional exige comando explícito, motivo e trilha auditável
  a ser definido em 018; não troca o ID nem reescreve Transactions.
- Delete físico de Asset referenciado por qualquer Transaction é bloqueado por
  FK/restrict, independentemente de `assetUsages` legado. Asset **ativo** sem
  uso pode ser excluído com confirmação, sem fatos relacionados; Asset retirado
  sem uso deve ser reativado antes da revisão e confirmação da exclusão.
- O produto chama o lifecycle reversível de **retirar do catálogo**. O Asset
  retirado permanece legível no ledger, não é oferecido para nova Transaction e
  pode ser reativado com ação explícita. Não há estado de archive separado para
  Asset.
- Duplicidade é resolvida pela identidade owner-scoped
  `(symbol, market, assetType, currency)`: cadastrar a mesma tupla retorna o
  cadastro existente, sem novo ID.
- `assetIdentities` e `assetUsages` são mecanismos de compatibilidade/auditoria,
  não autoridade para liberar delete ou declarar ausência de referência.

## Evidência e alternativas

O [modelo relacional](../architecture/011/relational-model.md#fks-lifecycle-e-append-only), o
[handoff de UX](../architecture/011/frontend-ux-contract-discovery.md#5-jornadas-obrigatórias-para-a-012-e-dependências-uxapi) e o
[pacote de lifecycle da 012](../architecture/012/slices/asset-lifecycle.md)
mostram FK `RESTRICT`, preservação de IDs e a pergunta UX-06. Hard delete,
cascade, troca automática de ID e mutação inline após uso foram rejeitados. A
decisão é semântica e não congela endpoint, DTO ou schema.

## Consequências e revisão

O produto precisa explicar retirada, reativação, deduplicação e o bloqueio de
delete sem transformar `assetUsages` em autoridade. O catálogo legado ainda
permite editar identidade usada e só reconcilia referências no delete; isso é um
gap conhecido, não evidência de que a decisão já esteja implementada. A decisão
será implementada/revisada em 017 e 018, com enforcement, concorrência,
idempotência e migração antes de qualquer lifecycle no novo stack.

## Referências

- [ADR 005 — archive de Portfolio](005-portfolio-archive-lifecycle.md)
- [ADR 006 — Asset e ledger](006-assets-transactions-ledger.md)
- [Pacote 012 — lifecycle de Asset](../architecture/012/slices/asset-lifecycle.md)
