# ADR 016 — Contrato HTTP, OpenAPI, erros e compatibilidade

- **Status:** `proposed`
- **Ticker relacionado:** `011`
- **Decisão:** 10 de 15 da spec 011

## Contexto

O único contrato HTTP atual é Quotes no Next. As jornadas e requisitos podem
mudar na 012, portanto fechar endpoints e DTOs agora criaria contrato orientado
pela UI antiga ou pelo banco.

## Decisão proposta

- Capacidades e casos de uso, não tabelas EF, orientam o contrato.
- O mapa atual (`portfolio`, `asset`, `transaction`, `valuation` e `quote`) é
  provisório; URLs, verbos, envelopes e campos dependem da 012.
- Problem Details e códigos sanitizados devem distinguir validação, conflito,
  autenticação, indisponibilidade e rate limit sem expor token, UID ou payload.
- Cada vertical congela seu OpenAPI somente depois do protótipo, estados críticos
  e aceite de acessibilidade. O freeze é por slice.
- Deploy independente exige compatibilidade N/N-1 ou rollout coordenado; mudança
  incompatível exige versão/adapter removível.

## Evidência e alternativas

O [handoff de contratos provisórios](../architecture/011/frontend-ux-contract-discovery.md#6-mapa-preliminar-de-capacidades-e-contratos)
e a regra de freeze documentam a proposta. Congelar a API antes da UX ou expor
entidades de persistência foi rejeitado.

## Consequências e revisão

Há retrabalho deliberado entre 011 e 012, em troca de evitar retrabalho
estrutural. A ADR será revisada quando 012 aceitar as primeiras capacidades e
novamente em cada slice 017–019.

## Referências

- [ADR 008 — limites de camadas](008-limites-de-camadas-e-dependencias.md)
- [Compatibilidade de release](../architecture/011/quality-environments-cutover.md#7-cicd-e-releases-independentes)
