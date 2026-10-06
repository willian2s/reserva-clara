# ADR 011 — Precisão decimal, arredondamento e representação

- **Status:** `proposed`
- **Ticker relacionado:** `011`
- **Decisão:** 5 de 15 da spec 011

## Contexto

O contrato atual aceita até 30 dígitos inteiros e 18 fracionários. `number`,
`double` e `System.Decimal` não podem ser adotados sem provar que preservam o
contrato completo.

## Decisão proposta

- HTTP e persistência usam decimal como string canônica, nunca JSON number.
- Domain/Application validam gramática, escala e sinais; aritmética usa
  `BigInteger`/racionais ou representação equivalente exata.
- A baseline PostgreSQL usa `text` com checks explícitos. `numeric(48,18)` só
  poderá substituir a representação após experimento byte a byte com Npgsql.
- Quantity e UnitPrice são positivos; Fee é nula ou não negativa e zero
  canônico normaliza para nulo conforme o contrato existente.
- Não há arredondamento implícito durante migração ou reconciliação; qualquer
  materialização pública segue regra explícita e testada.

## Evidência e alternativas

Os limites e o experimento obrigatório estão em [relational-model.md](../architecture/011/relational-model.md#decisão-de-precisão-decimal)
e no [harness planejado](../architecture/011/quality-environments-cutover.md#33-golden-master-e-contract-harness).
Floating point e `System.Decimal` por conveniência foram rejeitados.

## Consequências e revisão

O tipo é menos conveniente, mas evita perda silenciosa de patrimônio. A decisão
será revisada na 015/016 com limites, soma/subtração e golden masters TS↔C#;
nenhuma implementação futura pode estreitar a escala sem ADR nova.

## Referências

- [ADR 006 — ledger append-only](006-assets-transactions-ledger.md)
- [Modelo relacional 011](../architecture/011/relational-model.md)
