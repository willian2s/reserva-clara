# 004-06 — Validar topologia real

- **Ticker:** `004`
- **Número:** `06`
- **Status:** `pending`

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
