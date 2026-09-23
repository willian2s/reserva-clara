# 004 — Production Deployment

- **Status geral:** pending
- **Spec:** [004-production-deployment.md](../../specs/004-production-deployment.md)
- **Progresso:** 0/9 subtarefas concluídas

## Objetivo

Publicar o único projeto Next.js em Vercel, conectar os domínios oficiais por
Cloudflare, configurar Firebase Web sem secrets versionados e provar em HTTPS
real a topologia público/app e o fluxo Google até `/dashboard`.

## Checklist

- [ ] [004-01-preparar-baseline-oficial.md](004-01-preparar-baseline-oficial.md)
- [ ] [004-02-conectar-vercel-e-publicar-preview.md](004-02-conectar-vercel-e-publicar-preview.md)
- [ ] [004-03-configurar-environment-variables.md](004-03-configurar-environment-variables.md)
- [ ] [004-04-configurar-dominios-dns-tls.md](004-04-configurar-dominios-dns-tls.md)
- [ ] [004-05-configurar-firebase-auth-producao.md](004-05-configurar-firebase-auth-producao.md)
- [ ] [004-06-validar-topologia-real.md](004-06-validar-topologia-real.md)
- [ ] [004-07-validar-google-sign-in-producao.md](004-07-validar-google-sign-in-producao.md)
- [ ] [004-08-validar-previews-e-seguranca.md](004-08-validar-previews-e-seguranca.md)
- [ ] [004-09-fechar-gates-e-rollback.md](004-09-fechar-gates-e-rollback.md)

## Observações

- Fase 003 já é autoridade para `src/proxy.ts`, route groups, redirects e
  canonical. Não redesenhar essa arquitetura sem incompatibilidade concreta.
- Ações em Git/Vercel, Cloudflare, DNS e Firebase exigem acesso e checkpoint
  humano. Configurado no painel não equivale a validado em produção.
- Valores de environment variables, tokens, credenciais, identidade da conta
  Google e conteúdo de `.env.local` nunca entram nas tasks.
- Preview mantém same-origin e `noindex`; OAuth em hostname dinâmico permanece
  não autorizado por padrão.
- O modo Cloudflare (DNS only/proxied) deve ser confirmado na documentação
  oficial atual e registrado na task 004-04 antes da alteração pública.
