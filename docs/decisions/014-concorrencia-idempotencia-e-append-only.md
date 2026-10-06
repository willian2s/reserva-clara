# ADR 014 — Concorrência, idempotência e append-only de Transaction

- **Status:** `proposed`
- **Ticker relacionado:** `011`
- **Decisão:** 8 de 15 da spec 011

## Contexto

O repository atual reduz o ledger, mas Rules não agregam Transactions. Dois
`SELL`s concorrentes ou retries sem identidade estável podem violar saldo ou
duplicar fatos.

## Decisão proposta

1. O caso de uso financeiro valida o reducer antes do write.
2. A transação bloqueia a Portfolio (`FOR UPDATE` ou mecanismo equivalente),
   revalida ownership/archive e serializa archive/restore com insert.
3. Cada comando exige `transactionId` estável ou idempotency key que produza o
   mesmo ID. Mesmo ID e payload canônico são no-op; payload divergente é conflito.
4. Transaction não recebe UPDATE/DELETE pelo papel runtime. Correções são fatos
   compensatórios.
5. Retry após 401 nunca repete cegamente um write sem identidade idempotente.

## Evidência e alternativas

O lifecycle e o lock estão descritos em [relational-model.md](../architecture/011/relational-model.md#fks-lifecycle-e-append-only)
e os testes concorrentes em [quality-environments-cutover.md](../architecture/011/quality-environments-cutover.md#5-postgresql-migrations-e-restore).
Contador auxiliar, update/delete e confiança exclusiva em Rules foram rejeitados.

## Consequências e revisão

Locks podem reduzir throughput e exigem testes de deadlock. A decisão só será
aceita após C6, com duas conexões PostgreSQL reais, retry igual/divergente,
SELL concorrente e prova de append-only.

## Referências

- [ADR 006 — identidade de Asset e ledger](006-assets-transactions-ledger.md)
- [Modelo relacional](../architecture/011/relational-model.md#fks-lifecycle-e-append-only)
