# ADR 019 — Migração, write fence, reconciliação e point of no return

- **Status:** `proposed`
- **Ticker relacionado:** `011`
- **Decisão:** 13 de 15 da spec 011

## Contexto

A migração precisa preservar fatos e IDs, tratar anomalias sem descarte e evitar
que Firestore e PostgreSQL sejam autoridades simultâneas. Rollback muda de
significado depois do primeiro write no destino.

## Decisão proposta

- Extract/validate/transform/stage/load/reconcile é repetível por batch e sem
  dual-write normal.
- Firestore é autoridade durante desenvolvimento e rehearsal; PostgreSQL recebe
  cópia não autoritativa.
- Colisões, órfãos, perda temporal, decimal inválido, `SELL` inválido e hash
  divergente vão para quarentena; nenhum fato é corrigido silenciosamente.
- Cutover é preferencialmente global, pois Portfolio/Asset/Transaction têm FKs
  cruzadas. Exceção por owner exige fence forte e autoridade inequívoca; por
  tabela é proibido.
- C9 inicia o novo stack read-only. C10 registra o primeiro write PostgreSQL e
  encerra a possibilidade operacional de reabrir Firestore como destino.
- Após C10, rollback é versão compatível com PostgreSQL, restore/PITR ou forward
  fix; retenção do legado é decidida antes de C11.

## Evidência e alternativas

O [pipeline de migração](../architecture/011/data-migration-strategy.md#pipeline-repetível)
e [runbook de cutover](../architecture/011/quality-environments-cutover.md#103-rollback-honesto)
descrevem batches, fence, reconciliação e PONR. Dual-write, cutover por tabela e
rollback ilusório foram rejeitados.

## Consequências e revisão

O processo exige rehearsals, janela, backup, digest e aprovação operacional. A
proposta será revisada na 016/020 e só se torna aceita com C8–C10 executados;
retenção e remoção final dependem de C11.

## Referências

- [ADR 007 — autoridade única](007-topologia-alvo-e-autoridade-dos-dados.md)
- [Gates C0–C11](../architecture/011/quality-environments-cutover.md#9-checkpoints-c0c11-e-gono-go)
