# 004 — Production Deployment

- **Status geral:** in_progress
- **Spec:** [004-production-deployment.md](../../specs/004-production-deployment.md)
- **Progresso:** 5/9 subtarefas concluídas

## Objetivo

Publicar o único projeto Next.js em Vercel, conectar os domínios oficiais por
Cloudflare, configurar Firebase Web sem secrets versionados e provar em HTTPS
real a topologia público/app e o fluxo Google até `/dashboard`.

## Checklist

- [x] [004-01-preparar-baseline-oficial.md](004-01-preparar-baseline-oficial.md)
- [x] [004-02-conectar-vercel-e-publicar-preview.md](004-02-conectar-vercel-e-publicar-preview.md)
- [x] [004-03-configurar-environment-variables.md](004-03-configurar-environment-variables.md)
- [x] [004-04-configurar-dominios-dns-tls.md](004-04-configurar-dominios-dns-tls.md)
- [x] [004-05-configurar-firebase-auth-producao.md](004-05-configurar-firebase-auth-producao.md)
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
- 004-01 concluída em 2026-09-23: baseline atual é `main` em
  `bdf7bed23007b778539a3923230ae97cbb651bc6`, working tree limpo antes desta
  atualização, contratos 003 conferidos, docs oficiais consultadas e gates
  locais aprovados na ordem lint → typegen → typecheck → build. Documentação
  local do Next continua ausente; nenhum código, serviço ou env foi alterado.
- Snapshot DNS público mostrou apex/`www` respondendo por Cloudflare e nenhum
  A/CNAME público para `app`; isso é observação para rollback, não configuração
  efetiva nem target futuro. MX/TXT/CAA/DNSSEC dependem de acesso Cloudflare em
  004-04; alteração DNS permanece bloqueada até snapshot completo de RRsets,
  TTL, DNSSEC, proxy status, timestamp e fonte. Próximo avanço exige checkpoint
  humano Vercel/Git.
 - 004-02 concluída em 2026-09-23: prints confirmam repositório conectado,
   `main` como Production Branch, defaults efetivos de Next.js/root/build,
   ambientes, `reserva-clara.vercel.app` válido, deployment `Ready`, Build Logs,
  rollback e URL `.vercel.app` protegida. O deployment capturado é
  `Production`/`main`; requests à URL protegida retornaram `302` para Vercel
  SSO sem sessão. Preview branch específico não foi evidenciado; smoke e
   política de proteção ficam para 004-08. Não registrar valores de environment
   variables; configuração de env pertence à 004-03.
   - 004-03 concluída em 2026-09-23: confirmação humana registra os sete nomes em
     `Production and Preview`; variables foram configuradas durante a conexão,
     antes do deployment inicial. Smoke no Chrome confirmou página, chaves, login
     e redirecionamento. Nenhum valor, token ou `.env.local` foi solicitado ou
     registrado; checklist `[x]` e progresso `3/9`. OAuth em Preview dinâmico não
     é assumido.
  - 004-04 concluída em 2026-09-23: três hosts associados ao mesmo projeto
     Vercel; Cloudflare Proxied e SSL/TLS Full (strict) aplicados; snapshot final,
     regras sem customizações, smoke público, ACME probe, redirects,
     confirmação visual de TLS e logs por host passaram. Revisão independente
     final aprovou após follow-up HTTP→HTTPS em app `/dashboard` e rotulagem da
     captura apex antiga como intermediária. Rollback foi documentado como
     desligar Proxied nos três records web, preservando targets. Item `[x]`;
   progresso `4/9`. Riscos residuais permanecem documentados na task e
   decisão 004.
   - 004-05 concluída em 2026-09-23: confirmação humana posterior revalidou
     `app.reservaclara.com.br` no Authorized Domains, popup nominal em contexto
     sem sessão e remoção de `reservaclara.com.br`. Sem wildcard de preview e
     sem alteração de `authDomain`. OAuth nominal completo e matriz de erros
     permanecem em 004-07. Progresso `5/9`.
