# 003 — Public Landing & App Separation

- **Status geral:** in_progress
- **Spec:** [003-public-landing-app-separation.md](../../specs/003-public-landing-app-separation.md)
- **Progresso:** 7/8 subtarefas concluídas

## Objetivo

Substituir o template de `/` por uma landing pública Reserva Clara e preparar a
separação por host entre `reservaclara.com.br` e `app.reservaclara.com.br` em um
único projeto Next.js, preservando o fluxo de autenticação da fase 001 e as
foundations da fase 002.

## Checklist

- [x] [003-01-estabelecer-fronteira-public-app.md](003-01-estabelecer-fronteira-public-app.md)
- [x] [003-02-estruturar-landing-v1.md](003-02-estruturar-landing-v1.md)
- [x] [003-03-integrar-cta-e-navegacao.md](003-03-integrar-cta-e-navegacao.md)
- [x] [003-04-estabelecer-metadata-seo.md](003-04-estabelecer-metadata-seo.md)
- [x] [003-05-validar-responsividade-acessibilidade.md](003-05-validar-responsividade-acessibilidade.md)
- [x] [003-06-preservar-regressao-auth.md](003-06-preservar-regressao-auth.md)
- [x] [003-07-executar-checks-tecnicos.md](003-07-executar-checks-tecnicos.md)
- [ ] [003-08-validar-topologia-local-preview.md](003-08-validar-topologia-local-preview.md)

## Observações

- A decisão operacional escolhida é um único `src/proxy.ts` para host routing,
  route groups apenas para organização e redirects, não rewrites.
- A decisão arquitetural independente está registrada em
  [003-separacao-host-publico-app.md](../../decisions/003-separacao-host-publico-app.md).
- Localhost e previews Vercel permanecem same-origin; produção e DNS continuam
  fora desta fase e serão ativados na fase 004.
- A landing não deve importar Firebase nem exibir gráficos, números ou claims
  financeiros que pareçam reais.
- `GoogleSignIn` e `DashboardGate` permanecem sem redesign arquitetural; o
  dashboard continua não sensível e o guard continua sendo somente UX.
- A documentação local do Next indicada por `AGENTS.md` não está disponível no
  checkout; a decisão foi conferida na documentação oficial da versão instalada
  e deve ser validada pelos checks do pacote durante a implementação.
- A subtarefa 003-01 foi concluída com os quatro gates técnicos e smoke HTTP da
  matriz de hosts. O app `/` usa redirect absoluto same-origin, pois o Proxy
  do Next.js 16 rejeita `Location` relativo; o path e o destino permanecem
  fixos. A landing final, regressão auth e validação visual continuam nas
  subtarefas específicas.
- A subtarefa 003-04 foi concluída: metadata pública estática ficou restrita ao
  grupo marketing, app recebeu `noindex, nofollow`, ícones oficiais foram
  preservados e localhost/preview mantêm `X-Robots-Tag` centralizado no proxy.
- A subtarefa 003-05 foi concluída: landing recebeu correções de responsividade,
  targets, headings, foco, alt e limites oficiais de assets. Lint, typegen,
  typecheck, build, smoke estrutural e revisão independente passaram. Chrome e
  Chromium não estão disponíveis no ambiente; teclado, zoom, contraste
  renderizado e scroll não tiveram prova visual direta. Refinamento posterior
  deixou CTAs do hero lado a lado no mobile quando houver espaço, com quebra
  segura em larguras extremas.
- A subtarefa 003-06 foi concluída sem alteração de código: imports, contratos
  de `GoogleSignIn`/`DashboardGate`, shell não sensível e ausência de Firebase na
  landing foram confirmados. Lint, typegen, typecheck, build e smoke HTTP
  localhost/app passaram. Teste manual confirmou loading e redirecionamento de
  dashboard anônimo para login, restauração de sessão no dashboard e mensagem
  de cancelamento ao fechar popup. Configuração do site para bloquear popup não
  impediu sua abertura; popup bloqueado, erro/retry e acessibilidade manual
  não foram exaustivamente reproduzidos, sem bloquear conclusão dos cenários
  essenciais.
- A subtarefa 003-07 foi concluída: `npm run lint`, `npm exec next typegen`,
  `npx tsc --noEmit` e `npm run build` passaram nessa ordem. Build reconheceu
  `/`, `/login`, `/dashboard` e `ƒ Proxy (Middleware)`; não houve warning
  material. Nenhum package, lockfile ou asset foi alterado. A matriz HTTP de
  hosts e assets permanece para 003-08.
