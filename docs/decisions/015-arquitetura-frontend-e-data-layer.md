# ADR 015 — Arquitetura frontend, routing, data layer e estado

- **Status:** `proposed`
- **Ticker relacionado:** `011`
- **Decisão:** 9 de 15 da spec 011

## Contexto

O frontend atual é client-driven, mas seus dados vêm de repositories Firestore,
Route Handler Next e hooks acoplados. A migração não deve escolher router,
cache ou store apenas por familiaridade antes da descoberta de Produto/UX/UI.

## Decisão proposta

O alvo é uma aplicação React/TypeScript/Vite organizada por capacidades/features,
com Firebase Web somente para Auth e cliente HTTP para a API. A 012 deve decidir
router, organização de IA, camada de query/cache, estado de formulário/sessão,
validação runtime, design system e boundaries de erro a partir de protótipos e
experimentos.

As restrições não negociáveis são: browser sem Firestore/PostgreSQL/BRAPI,
decimais como strings, estados `partial`/`stale`/`unavailable` explícitos e
AuthGate sem papel de autorização.

## Evidência e alternativas

O [handoff frontend](../architecture/011/frontend-ux-contract-discovery.md)
registra baseline, gaps e backlog UX-01–UX-10, A11Y-01 e API-01–API-04.
Transportar App Router ou escolher um state manager global antes da 012 foi
rejeitado por congelar decisões sem evidência.

## Consequências e revisão

O baseline orienta a 012 sem fingir arquitetura final. Esta ADR será revisada
após os protótipos da 012 e o spike da 013; nenhum contrato ou biblioteca é
aceito por este documento sozinho.

## Referências

- [ADR 007 — topologia alvo](007-topologia-alvo-e-autoridade-dos-dados.md)
- [Handoff de UX/frontend](../architecture/011/frontend-ux-contract-discovery.md)
