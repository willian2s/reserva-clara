# 003-08 — Validar topologia local e preview

- **Ticker:** `003`
- **Número:** `08`
- **Status:** `completed`

## Objetivo e resultado esperado

Fechar a prova da fronteira public/app em ambiente local ou simulável, cobrindo
hosts, redirects, assets, metadata, preview e handoff explícito para a fase
004, sem fingir que DNS, Vercel ou produção foram configurados.

## Requisitos cobertos

- `reservaclara.com.br`, `www`, `app.reservaclara.com.br`.
- localhost/loopback e previews `*.vercel.app`.
- Host desconhecido.
- `/`, `/login`, `/dashboard` e recursos estáticos.
- Status, `Location`, ausência de loop e noindex.
- Preparação sem deploy/configuração de infraestrutura.

## Escopo incluído

- Iniciar servidor local e simular Hosts com header HTTP.
- Validar matriz completa da spec em navegação direta e, quando possível,
  browser/client navigation.
- Conferir `X-Robots-Tag` em local/preview e metadata no HTML.
- Conferir `/brand/*`, `/_next/static/*`, `/_next/image`, favicon e requests RSC.
- Registrar limitações do ambiente e itens entregues à fase 004.

## Escopo excluído

- Criar DNS, registros Cloudflare, domínio/tls Vercel, `www` real ou deploy.
- Alterar authorized domains Firebase.
- Testar sessão server-side, autorização, Firestore ou dados financeiros.
- Adicionar automação de testes, Playwright ou dependência nova.

## Dependências

- 003-01 a 003-07 concluídas.
- Build aprovado e servidor local iniciável.
- Browser/curl disponível; configuração Firebase somente para regressão já
  coberta em 003-06.

## Arquivos e símbolos prováveis

- `src/proxy.ts`: matcher, classificação, redirects e headers.
- `src/app/(marketing)/page.tsx` e `src/app/(app)/*`.
- `src/app/(marketing)/layout.tsx`, `src/app/(app)/layout.tsx` e root metadata.
- Assets em `public/brand/` e artefatos `.next` sem versionamento.
- Documentação desta task e overview para evidências/status.

## Passos de implementação

1. Iniciar `npm run dev -- --hostname 127.0.0.1` ou `npm start` após build;
   registrar porta e não registrar segredos.
2. Para cada host simulado, requisitar `/`, `/login` e `/dashboard` com
   `curl -I`/browser e registrar status, `Location` e número de saltos. Incluir
   `localhost`, `127.0.0.1`, `0.0.0.0`, `::1`, `foo.vercel.app`, hostname em
   maiúsculas e hostname com ponto final para provar a normalização.
3. Confirmar público `200` landing, público app-only `307`, app raiz `307`,
   app login/dashboard same-origin, `www` `308`, local/preview `200` same-origin
   e host desconhecido `404` para documentos.
4. Seguir os redirects com limite baixo e confirmar que não existe loop ou
   redirect para host controlado por query.
5. Requisitar assets e recursos internos diretamente e confirmar que não foram
   redirecionados pelo matcher.
6. Inspecionar metadata e headers de indexação em cada classe de host.
7. Validar CTA no browser local/preview e simular o handoff de produção por
   Host header, sem afirmar disponibilidade de DNS.
8. Registrar no encerramento o que a fase 004 precisa ativar e quais browsers
   não estavam disponíveis.

## Testes e comandos de validação

- `npm run dev -- --hostname 127.0.0.1`
- `npm start` depois de `npm run build`, quando apropriado.
- `curl -I -H 'Host: reservaclara.com.br' http://127.0.0.1:3000/`
- Repetir para `app.reservaclara.com.br`, `www.reservaclara.com.br`,
  `localhost`, `foo.vercel.app` e host desconhecido.
- Testar `/login`, `/dashboard`, `/brand/logo-horizontal.png`,
  `/_next/static/*`, `/_next/image` e favicon.
- Browser desktop/mobile disponível para link, layout, console e navegação.
- Confirmar novamente `npm run lint`, `npm exec next typegen`,
  `npx tsc --noEmit` e `npm run build` se a validação alterar algo.

## Definição de pronto

- A matriz de hosts tem evidência para todos os casos relevantes.
- Status/Location, noindex, canonical e assets correspondem à spec.
- Não há loop, open redirect, bloqueio de asset ou landing no app host.
- A validação distingue simulação local de infraestrutura efetiva.
- Overview só será atualizado para `[x]` e `8/8` após todas as tasks e esta
  prova estarem concluídas.
- Handoff para a fase 004 lista DNS/Vercel/TLS/Firebase Authorized Domains sem
  executar nenhum deles.

## Riscos e cuidados

- Header `Host` local pode não reproduzir todos os detalhes de proxy/CDN; não
  declarar comportamento de produção sem deploy real.
- Preview Vercel real pode ter headers/aliases adicionais; validar o sufixo sem
  aceitar subdomínios produtivos arbitrários.
- Não seguir redirects sem limite nem usar `-L` sem registrar a cadeia.
- Não confundir `200` de uma landing local com indexação ou domínio canônico.
- Não registrar cookies, tokens Firebase, dados da conta de teste ou segredos.

## Registro de execução

### Status

`completed`

### Arquivos alterados

- `docs/tasks/003-public-landing-app-separation/003-08-validar-topologia-local-preview.md`:
  registro da matriz HTTP, assets, metadata e handoff de infraestrutura.
- `docs/tasks/003-public-landing-app-separation/003-00-overview.md`: checklist,
  status geral, progresso e observações atualizados.
- `docs/specs/003-public-landing-app-separation.md`: status sincronizado para
  `completed` após as oito subtarefas concluídas.

Nenhum arquivo de código, dependência, lockfile ou asset foi alterado. O
servidor usou build já aprovado em 003-07; o processo local foi encerrado após
os checks.

### Decisões e desvios

- A validação usou `npm start` em `127.0.0.1:3138` e headers `Host`, sem
  afirmar DNS, TLS, Vercel, `www` efetivo ou configuração Firebase produtiva.
- O redirect do app `/` apareceu como URL absoluta para o servidor local
  (`http://127.0.0.1:3138/login`), comportamento já documentado em 003-01;
  destino e path continuam fixos e same-origin. A matriz textual da spec usa a
  forma relativa, mas a implementação mantém a forma absoluta por exigência de
  serialização do Proxy no Next.js 16; ambas preservam o contrato seguro
  same-origin.
- Requests RSC sem query de cache receberam redirect interno do Next.js para a
  mesma rota com `?_rsc`; a requisição RSC com essa query retornou `200` e
  `text/x-component`. Não houve redirect de host pelo Proxy.
- Chrome, Chromium e variantes de Chrome não estão disponíveis no ambiente;
  CTA e metadata foram validados por HTML/HTTP, sem declarar cobertura visual
  de browser.

### Comandos executados

```bash
npm start -- --hostname 127.0.0.1 --port 3138
npm start -- --hostname 127.0.0.1 --port 3139
curl -sS -D - -o /dev/null --max-redirs 0 -H 'Host: ...' 'http://127.0.0.1:3138/...'
curl -sS -H 'Host: ...' 'http://127.0.0.1:3138/'
git diff --check
```

Também foram executadas requisições para a matriz completa de hosts/caminhos,
cadeias manuais de redirect, query `returnTo`, assets, `_next/image`, RSC,
metadata HTML, CTA local/preview e detecção de browsers disponíveis.

### Resultados e evidências

- Servidor Next.js `16.3.5` iniciou em `127.0.0.1:3138` sem erro.
- `reservaclara.com.br`: `/` retornou `200`; `/login` e `/dashboard`
  retornaram `307` para `https://app.reservaclara.com.br` nos mesmos paths.
- `app.reservaclara.com.br`: `/` retornou `307` para `/login` same-origin;
  `/login` e `/dashboard` retornaram `200`.
- `www.reservaclara.com.br`: `/`, `/login` e `/dashboard` retornaram `308`
  para os mesmos paths em `https://reservaclara.com.br`.
- `localhost`, `127.0.0.1`, `0.0.0.0` e `[::1]`: os três documentos
  retornaram `200` same-origin. `localhost` recebeu
  `X-Robots-Tag: noindex, nofollow`.
- `foo.vercel.app`: os três documentos retornaram `200` same-origin e
  todos receberam `X-Robots-Tag: noindex, nofollow`. A repetição na porta
  `3139` confirmou o mesmo header em `/`, `/login` e `/dashboard` para
  `localhost`, `127.0.0.1`, `0.0.0.0`, `[::1]` e `foo.vercel.app`.
- Host desconhecido, `UNKNOWN.RESERVACLARA.COM.BR` e
  `foo.reservaclara.com.br` retornaram `404` para documentos. Hosts produtivos
  em caixa alta mantiveram classificação (`RESERVACLARA.COM.BR` `307`,
  `APP.RESERVACLARA.COM.BR` `200`, `WWW.RESERVACLARA.COM.BR` `308`).
  `FOO.VERCEL.APP.` retornou `200`; `vercel.app` exato retornou `404`.
- Host público com ponto final normalizou corretamente. Query
  `returnTo=https://evil.example` não foi transportada em nenhum redirect
  observado.
- A repetição na porta `3139` confirmou normalização em caixa alta:
  `RESERVACLARA.COM.BR` `307`, `APP.RESERVACLARA.COM.BR` `200` e
  `WWW.RESERVACLARA.COM.BR` `308` para `/login`.
- Cadeias manuais não tiveram loop: `www → público → app` para `/login`,
  `www → público` para `/`, e `app / → app /login` terminaram em `200`.
- `/brand/logo-horizontal.png`, favicon, chunk CSS e `/_next/image` retornaram
  `200` sem `Location`; `/api/health` retornou `404` sem redirect. Asset em
  host desconhecido também não foi interceptado pelo matcher.
- RSC com query `_rsc` retornou `200` `text/x-component`; redirect inicial
  interno apontou somente para a mesma origem/rota com query de cache.
- Landing pública apresentou title, description, canonical
  `https://reservaclara.com.br/`, `og:title`, `og:description`, `og:url`,
  `og:site_name`, `og:locale=pt_BR` e `og:type=website`, sem resíduos do
  template. Login app não apresentou canonical/OG públicos e apresentou
  `robots=noindex, nofollow`.
- CTA local e preview apresentaram três `href="/login"` e nenhum link absoluto
  para `app.reservaclara.com.br`; inspeção não-browser confirmou o contrato
  same-origin.

### Handoff para fase 004

- Configurar DNS, TLS, domínios e redirects efetivos na Vercel/infraestrutura,
  incluindo `www`.
- Configurar Firebase Authorized Domains para as origens produtivas.
- Repetir smoke HTTP e fluxo OAuth em domínio real após ativação; esta task
  validou somente simulação local por `Host`.

### Riscos residuais

- Headers `Host` em servidor local não provam comportamento de CDN, DNS, TLS ou
  aliases reais da Vercel.
- Ausência de browser impede prova visual direta de navegação por teclado,
  viewport, zoom, foco, console e scroll; essas limitações permanecem
  registradas em 003-05 e 003-06.
- Proxy/host routing continua sendo roteamento, não autorização server-side;
  `DashboardGate` permanece guard de UX.
