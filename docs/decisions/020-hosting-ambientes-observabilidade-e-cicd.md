# ADR 020 — Hosting, ambientes, observabilidade e CI/CD

- **Status:** `proposed`
- **Ticker relacionado:** `011`
- **Decisão:** 14 de 15 da spec 011

## Contexto

O legado acopla frontend e API ao Next/Vercel. O alvo precisa publicar frontend
estático, API e migration job independentemente, com isolamento por ambiente e
evidência operacional antes de cutover, sem escolher fornecedor prematuramente.

## Decisão proposta

- Local, test, staging e produção têm Firebase, origens, CORS, dados e secrets
  isolados; previews não recebem produção por conveniência.
- Frontend é artefato estático; API e migration job são artefatos/serviços
  independentes. Nenhum migration roda no startup.
- O fornecedor final de hosting fica aberto até requisitos, custo e smoke da 020;
  não há dependência normativa da Vercel.
- CI executa gates de frontend, API, contratos, integração PostgreSQL, migração,
  scans e E2E proporcional à fase. Deploy independente exige N/N-1.
- Logs, traces, métricas, health, alertas, SLO, backup/restore e runbooks são
  capacidades desde a fundação e redigem tokens, UID e dados financeiros.

## Evidência e alternativas

O [baseline operacional](../architecture/011/quality-environments-cutover.md#6-ambientes-e-topologia-lógica)
define topologia e pipeline sem vendor lock-in. Manter o runtime Next como
obrigatório, compartilhar secrets entre ambientes ou adiar observabilidade para
o final foram rejeitados.

## Consequências e revisão

Há custo inicial de pipelines e isolamento, mas o cutover fica verificável. A
proposta será revisada na 013 e aceita operacionalmente somente na 020 após
smoke, DNS/TLS/CORS, restore, métricas e go/no-go.

## Referências

- [ADR 004 — Cloudflare/Vercel](004-cloudflare-proxied-vercel.md), preservada como histórico do legado.
- [Matriz operacional 011](../architecture/011/quality-environments-cutover.md)
