# 004-06 — Validar topologia real

- **Ticker:** `004`
- **Número:** `06`
- **Status:** `completed`

## Objetivo e resultado esperado

Provar por HTTP, DNS, TLS e browser que a topologia de 003 funciona nos domínios
reais, sem loops, open redirect, asset bloqueado ou canonicalização duplicada.

## Requisitos cobertos

- Apex, `www`, app e HTTPS.
- Redirects público/app e `www`.
- Landing, metadata, robots, assets e favicon.
- DNS/TLS/certificado e host desconhecido quando testável.
- Logs Vercel mínimos.

## Escopo incluído

- Requests sem seguir redirect e cadeias limitadas.
- Validação dos paths `/`, `/login`, `/dashboard` nos hosts oficiais.
- Validação de HTTP → HTTPS, certificado e propagação.
- Inspeção de canonical, Open Graph, robots, `X-Robots-Tag`, assets e RSC.
- Registro da diferença entre evidência HTTP e browser.
- Consulta de build/runtime logs sem expor segredo.

## Escopo excluído

- Configurar DNS/Firebase/Vercel; isso deve estar concluído nas tasks anteriores.
- Declarar Google OAuth aprovado; 004-07.
- Dados privados, autorização server-side ou test runner novo.
- Corrigir código sem evidência de incompatibilidade; qualquer correção volta
  para revisão de spec/task.

## Dependências

- 004-04 certificados/HTTPS verificados.
- 004-05 origem app autorizada para o próximo fluxo.
- Deployment Vercel conhecido e logs acessíveis.

## Arquivos e símbolos prováveis

- `src/proxy.ts`: matriz de host e matcher.
- `src/app/(marketing)/layout.tsx`: canonical/OG.
- `src/app/(app)/layout.tsx`: `noindex`/`nofollow`.
- `src/app/layout.tsx`, `public/brand/*` e chunks `/_next/*`.
- Vercel Deployments/Logs, DNS público e navegador.

## Passos de implementação

1. Testar cada hostname HTTPS sem seguir redirect; registrar status e `Location`.
2. Seguir manualmente cada cadeia com limite baixo: `www → público`, público
   app-only → app e app `/` → app `/login`.
3. Testar `reservaclara.com.br/`, `www/`, `app/`, `/login` e `/dashboard`.
4. Testar HTTP nos três hosts e confirmar HTTPS sem loop.
5. Testar `/brand/logo-horizontal.png`, favicon, `/_next/static/*`,
   `/_next/image` e uma resposta RSC quando disponível.
6. Inspecionar HTML/head: landing, title, canonical, OG, locale, icons, app
   noindex e ausência de template.
7. Testar landing pública no browser; confirmar CTA chega ao host app.
8. Consultar logs por host/rota e registrar erros/warnings materiais.
9. Se qualquer resposta divergir, manter task pending/blocked e não ajustar
   redirect em camada paralela.

## Testes e comandos de validação

```bash
curl -sS -D - -o /dev/null --max-redirs 0 https://reservaclara.com.br/
curl -sS -D - -o /dev/null --max-redirs 0 https://www.reservaclara.com.br/
curl -sS -D - -o /dev/null --max-redirs 0 https://app.reservaclara.com.br/
dig reservaclara.com.br
dig www.reservaclara.com.br
dig app.reservaclara.com.br
```

Comandos são exemplos; adaptar ao ambiente sem registrar cookies, headers
privados ou tokens. Repetir com browser para certificado, console e interação.

## Evidências da execução

- **Data/hora:** 2026-09-23, validação pública entre 20:20 e 20:42 UTC.
- **Dependências:** 004-04 e 004-05 estão `completed`; os três domínios
  permanecem associados ao mesmo projeto Vercel, com Cloudflare Proxied,
  Full (strict), certificado vigente e `app.reservaclara.com.br` autorizado no
  Firebase conforme evidências dessas tasks.
- **HTTPS sem seguir redirect:** `reservaclara.com.br/` retornou `200`; público
  `/login` e `/dashboard` retornaram `307` para os paths equivalentes em
  `https://app.reservaclara.com.br`; `www` retornou `308` para o público; app
  `/` retornou `307` para `/login`; app `/login` e `/dashboard` retornaram `200`.
- **Cadeias limitadas:** `www/` chegou ao apex em 1 redirect; `www/login` e
  `www/dashboard` chegaram ao app em 2 redirects; público app-only chegou ao
  app em 1 redirect; app `/` chegou a `/login` em 1 redirect. Nenhuma cadeia
  excedeu o limite de 5 ou formou loop.
- **HTTP:** os três hosts retornaram `308` para o mesmo hostname HTTPS em `/`;
  app `/login` e `/dashboard` também retornaram `308` para HTTPS. Não houve
  loop HTTP/HTTPS.
- **DNS/TLS:** `dig` retornou endereços anycast Cloudflare para apex, `www` e
  app, sem CNAME público observado. `openssl s_client` com SNI e verificação de
  hostname passou nos três hosts; certificado Let's Encrypt, SAN para o apex e
  wildcard, válido até 2026-12-13. `curl --cert-status` não foi usado como
  critério: o edge não forneceu resposta OCSP stapled, sem invalidar a
  verificação TLS concluída.
- **Metadata:** landing entregou `lang=pt-BR`, title oficial, canonical
  absoluta `https://reservaclara.com.br/`, Open Graph com URL, site name,
  locale `pt_BR` e type `website`. Login/dashboard entregaram title de app,
  `robots=noindex, nofollow` e nenhum canonical público.
- **Robots e recursos:** `X-Robots-Tag` não apareceu em produção oficial;
  metadata de app forneceu noindex. `robots.txt` e `sitemap.xml` não existem
  (404). Logos, seis favicons PNG, apple icon, primeiro chunk
  `/_next/static/immutable/*`, `/_next/image` e resposta RSC retornaram
  respostas esperadas (`200`); RSC retornou `text/x-component` com `Vary` de
  headers RSC. O `/favicon.ico` convencional retorna 404, mas os icons
  efetivamente publicados no HTML são os PNG oficiais e retornam `200`.
- **Query/open redirect:** `returnTo=https://evil.example` não alterou nenhum
  destino; redirects continuaram fixos e a query foi descartada nas pontes.
- **Host desconhecido:** SNI desconhecido foi rejeitado antes da aplicação pelo
  edge; HTTP com host desconhecido retornou `409` e override de `Host` em HTTPS
  retornou `403`. Nenhum cenário serviu a landing ou o app; o `404` do proxy
  não foi observável por causa da rejeição anterior do Cloudflare.
- **Browser:** Chrome 154 headless, perfil sem sessão, confirmou landing e
  login. Clique via Chrome DevTools no CTA `/login` terminou em
  `https://app.reservaclara.com.br/login`. Dashboard anônimo renderizou
  `Verificando sua sessão...`; não foi tratado como OAuth nominal, que pertence
  a 004-07. Não houve cookies, tokens ou identidade registrados.
- **Logs:** evidências sanitizadas de build/runtime por host permanecem em
  `004-02`/`004-04`; smoke atual retornou `server: cloudflare` e `x-vercel-id`
  por rota, sem erro 4xx/5xx nas rotas oficiais. Nenhum segredo foi coletado.

## Arquivos alterados

- `docs/tasks/004-production-deployment/004-06-validar-topologia-real.md`
- `docs/tasks/004-production-deployment/004-00-overview.md`

Nenhum arquivo de código, dependência, configuração externa ou environment
variable foi alterado.

## Decisões e desvios

- Task foi encerrada como `completed`: contrato HTTP, redirects, DNS/TLS,
  metadata, assets, RSC e navegação browser passaram.
- A ausência de `robots.txt`/`sitemap.xml` e o 404 de `/favicon.ico` não são
  divergências do contrato publicado: metadata robots e links de ícones PNG são
  os mecanismos declarados pelo código e responderam corretamente.
- Host desconhecido ficou registrado como comportamento de edge não testável
  até o `src/proxy.ts`: não foi criado bypass nem alterado redirect.
- OAuth nominal, restauração de sessão, erros de popup e autorização do
  dashboard continuam exclusivamente em 004-07.

## Comandos executados e resultados

- `curl` GET/HEAD com `--max-redirs 0` para matriz HTTPS — passou com status e
  `Location` esperados.
- `curl -L --max-redirs 5` para cadeias oficiais — passou com 1 ou 2 redirects,
  sem loop.
- `curl` para HTTP, query `returnTo`, assets, favicon, `/_next/image` e RSC —
  passou conforme evidências acima.
- `dig +short A/AAAA/CNAME` nos três hosts — retornou anycast Cloudflare; nenhum
  CNAME público observado.
- `openssl s_client -servername -verify_hostname` e `openssl x509` — TLS e SAN
  verificados nos três hosts.
- Chrome headless/DevTools — landing, CTA para app/login e metadata browser
  confirmados; dashboard anônimo permaneceu no estado de verificação de sessão.
- `npm run lint` — passou.
- `npm exec next typegen` — passou.
- `npx tsc --noEmit` — passou.
- `npm run build` — passou com Next.js 16.3.5; rotas e Proxy compilados.
- `git status --short --branch` e `git diff --check` — passaram; nenhuma
  alteração de código ou dependência.

## Riscos residuais

- Cloudflare rejeita host desconhecido antes do proxy Next; não há prova direta
  do `404` interno nesse edge, embora nenhum conteúdo da aplicação tenha sido
  exposto.
- Renovação futura do certificado e logs brutos de Host/SNI/IP continuam
  limitações observacionais aceitas em 004-04; não foram adicionados endpoints
  ou logging para produzi-los.
- `robots.txt`, `sitemap.xml` e `/favicon.ico` não são publicados; qualquer
  requisito futuro por esses paths deve reabrir revisão de spec, não ser criado
  como redirect paralelo.

## Definição de pronto

- Matriz HTTP real completa tem status, `Location` e cadeia documentados.
- HTTPS/certificados passam nos três hosts.
- No loops/open redirects; query não controla destino.
- Landing, app, metadata, robots, favicon e assets correspondem a 003/004.
- Logs consultáveis distinguem erro de deploy/runtime/edge.
- OAuth ainda fica separado e explicitamente não marcado nesta task.

## Riscos e cuidados

- CDN, cache e headers intermediários podem divergir de Host simulado local.
- `HEAD` pode ter comportamento diferente de GET; usar ambos quando necessário.
- Não seguir redirects indefinidamente nem aceitar `Location` arbitrário.
- Não confundir `200` com autenticação funcional ou autorização.
- Certificado válido não prova Firebase Authorized Domains.
