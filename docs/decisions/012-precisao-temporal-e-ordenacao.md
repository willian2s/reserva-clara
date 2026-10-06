# ADR 012 — Precisão temporal e ordenação determinística do ledger

- **Status:** `proposed`
- **Ticker relacionado:** `011`
- **Decisão:** 6 de 15 da spec 011

## Contexto

`effectiveDate` é uma data civil, enquanto `createdAt` participa do desempate
de Transactions. Converter timestamps para `Date` ou depender da ordem física
do banco pode alterar o reducer.

## Decisão proposta

1. `effectiveDate` permanece `date`, sem timezone.
2. Timestamps canônicos são pares `seconds`/`nanoseconds`; `nanoseconds` fica
   entre 0 e 999999999.
3. A ordem total é `effectiveDate`, seconds, nanoseconds e ID, todos ascendentes.
4. `Date` e `timestamptz` podem ser projeções, nunca a fonte canônica, até
   demonstrarem preservação lossless.

## Evidência e alternativas

O [modelo temporal](../architecture/011/relational-model.md#decisão-de-precisão-temporal)
e o plano de [golden masters](../architecture/011/quality-environments-cutover.md#33-golden-master-e-contract-harness)
exigem fixtures com mesmo microssegundo, nanos diferentes e IDs invertidos.
Usar timestamp de precisão menor ou ordem de inserção foi rejeitado.

## Consequências e revisão

Extratores devem ler o Timestamp bruto e quarentenar perda não comprovada. A
proposta será validada na 015/016 com PostgreSQL real e reconciliação do ledger.

## Referências

- [Comparação de Transactions no inventário](../tasks/011-revisao-roadmap-evolucao-arquitetural/011-02-mapear-dominio-dados-e-riscos.md#value-objects-enums-e-precisão)
- [ADR 011 — decimais](011-precisao-decimal-e-representacao.md)
