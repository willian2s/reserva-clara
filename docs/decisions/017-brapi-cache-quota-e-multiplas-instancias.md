# ADR 017 — BRAPI, cache, timeout, retry e quota

- **Status:** `proposed`
- **Ticker relacionado:** `011`
- **Decisão:** 11 de 15 da spec 011

## Contexto

BRAPI é externa, transitória e sujeita a quota. A implementação atual tem cache,
deduplicação e retry process-local, mas isso não equivale a proteção global em
múltiplas instâncias.

## Decisão proposta

- BRAPI permanece somente no backend, atrás de port/adapter; Asset continua a
  identidade do domínio.
- Preservar `fresh`, `stale` e `unavailable`; indisponível nunca vira zero.
- Timeout, retry transitório, lote máximo, deduplicação, cache key e erros são
  bounded e observáveis. O baseline atual é timeout de 3 s, um retry e lote 20,
  sujeito à validação.
- Cache process-local é aceitável inicialmente como baseline explícita. Cache
  distribuído, fila ou Redis exigem quota, latência e custo que justifiquem a
  complexidade.
- Rate limit deve ocorrer antes do upstream e ser calibrado por owner/IP/rota,
  sem logar payload ou chave.

## Evidência e alternativas

O inventário [domínio/dados](../tasks/011-revisao-roadmap-evolucao-arquitetural/011-02-mapear-dominio-dados-e-riscos.md#quotes-brapi-e-limites-por-processo)
e o baseline de segurança cobrem os limites observados. BRAPI no browser,
cache global presumido ou indisponível convertido em zero foram rejeitados.

## Consequências e revisão

Réplicas podem repetir chamadas e consumir quota. A proposta será revisada na
014/019/020 com métricas, provider fake, falhas injetadas, orçamento e decisão
de escala; não é implementação produtiva nesta fase.

## Referências

- [Identidade e segurança 011](../architecture/011/identity-security.md#7-rate-limit-e-brapi)
- [ADR 010 — modelo relacional](010-modelo-relacional-e-registros-firestore.md)
