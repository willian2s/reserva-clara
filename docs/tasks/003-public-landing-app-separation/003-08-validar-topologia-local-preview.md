# 003-08 — Validar topologia local e preview

- **Ticker:** `003`
- **Número:** `08`
- **Status:** `pending`

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
