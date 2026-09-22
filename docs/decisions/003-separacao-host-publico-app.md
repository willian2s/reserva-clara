# 003 — Separação por host entre superfície pública e aplicação

- **Status:** accepted
- **Escopo:** fase 003 — Public Landing & App Separation
- **Ticker relacionado:** `003`

## Contexto

Reserva Clara precisa servir uma presença pública em
`reservaclara.com.br` e uma aplicação em `app.reservaclara.com.br`, mantendo um
único repositório e um único projeto Next.js. Hoje existe uma única árvore App
Router, a rota `/` ainda é o template inicial e `/login`/`/dashboard` são as
rotas da vertical de autenticação da fase 001.

O objetivo desta decisão é escolher o mecanismo de separação de superfícies,
não criar uma fronteira de autorização. O Firebase Authentication permanece
browser-only, o `DashboardGate` continua sendo apenas UX e o dashboard não
receberá dados sensíveis nesta fase.

O checkout não contém `node_modules/next/dist/docs/`, portanto a documentação
local citada em `AGENTS.md` não estava disponível sem instalar dependências. A
convenção e o comportamento foram conferidos na documentação oficial da linha
Next.js 16.3.x antes desta decisão.

## Decisão

1. Usar um único `src/proxy.ts` como dono da política de host e de redirects
   entre superfícies.
2. Usar route groups `(marketing)` e `(app)` apenas para organização e
   metadata, preservando as URLs `/`, `/login` e `/dashboard`.
3. Usar redirects explícitos e não rewrites. O proxy terá destinos fixos,
   normalizará hostname e não aceitará destino derivado de query string,
   `returnTo` ou `Host` arbitrário.
4. Manter o matcher restrito às rotas de documento atuais, sem interceptar
   `_next/static`, `_next/image`, assets de `public`, favicons ou APIs.
5. Não duplicar a regra de host em páginas, componentes, `headers()` ou
   `next.config.ts`. Novas rotas públicas devem atualizar a matriz e o único
   proxy.
6. Tratar localhost e previews Vercel como uma única origem de desenvolvimento:
   `/` é landing e `/login`/`/dashboard` permanecem same-origin. Ambos recebem
   `X-Robots-Tag: noindex, nofollow`.
7. Restringir produção a hosts conhecidos:
   `reservaclara.com.br`, `app.reservaclara.com.br` e
   `www.reservaclara.com.br`. Hosts de preview `*.vercel.app` são permitidos
   somente como experiência de preview; outros hosts de documento recebem 404.

## Matriz de comportamento

| Host normalizado | `/` | `/login` | `/dashboard` |
| --- | --- | --- | --- |
| `reservaclara.com.br` | Renderiza landing | `307` para `https://app.reservaclara.com.br/login` | `307` para `https://app.reservaclara.com.br/dashboard` |
| `app.reservaclara.com.br` | `307` relativo para `/login` | Renderiza login | Renderiza dashboard + guard existente |
| `www.reservaclara.com.br` | `308` para o mesmo caminho em `https://reservaclara.com.br` | `308` para público e depois ponte app | `308` para público e depois ponte app |
| `localhost`, `127.0.0.1`, `0.0.0.0`, `::1` | Renderiza landing, `noindex` | Renderiza login same-origin, `noindex` | Renderiza dashboard/guard same-origin, `noindex` |
| `*.vercel.app` | Renderiza landing, `noindex` | Renderiza login same-origin, `noindex` | Renderiza dashboard/guard same-origin, `noindex` |
| Outro | 404 para documento | 404 para documento | 404 para documento |

Hostname deve ser comparado em lowercase, sem ponto final. A aceitação de
`*.vercel.app` exige prefixo não vazio e serve para previews, não para
autorização. Os redirects de ponte público→app são `307` na fase 003 para
evitar cache permanente durante rollout; `www` usa `308` por ser alias
canônico, mas só será observável quando DNS, TLS e domínio estiverem ativos na
fase 004.

Query strings não poderão alterar o destino. A implementação não adicionará
`returnTo` nem fallback client-side. O comportamento padrão de bridge pode
descartar query strings nesta fase; analytics e parâmetros de campanha estão
fora do escopo.

## Responsabilidades

### `src/proxy.ts`

- ler o hostname da requisição;
- normalizar e classificar host;
- decidir redirect fixo, passagem ou 404 para os documentos cobertos;
- adicionar `X-Robots-Tag` em localhost/previews;
- preservar recursos estáticos ao respeitar matcher estreito;
- não importar Firebase, não ler sessão browser e não autorizar dashboard.

### Route groups e metadata

- `(marketing)` contém a landing e a metadata pública/indexável;
- `(app)` contém `/login` e `/dashboard`, com `noindex`/`nofollow`;
- `src/app/layout.tsx` continua root layout compartilhado para Inter, idioma,
  ícones e foundations;
- grupos não alteram paths e não criam layouts root independentes.

### Componentes e autenticação

- landing, header e footer não conhecem domínios de produção;
- links da landing apontam para `/login`;
- `GoogleSignIn` continua usando `router.replace("/dashboard")`;
- `DashboardGate` continua usando `router.replace("/login")`;
- nenhuma dessas ilhas passa a decidir hostname.

## Alternativas consideradas

| Alternativa | Decisão |
| --- | --- |
| `middleware.ts` | Rejeitada: Next 16 renomeou/depreciou a convenção em favor de `proxy.ts`. |
| `next.config.ts` com `redirects` e `has: host` | Rejeitada como dono único: é suficiente para redirects estáticos, mas mistura a política com config e é menos clara para normalização, previews, 404 e headers. Não será combinado com proxy. |
| `rewrites` condicionados por host | Rejeitada: mascara a origem real, complica canonical, Open Graph, cache e RSC. |
| `headers()` em páginas | Rejeitada: deixa routing dentro da composição React, duplica regra e introduz dinâmica desnecessária. |
| Client-side redirect | Rejeitada: depende de JavaScript, permite flash da superfície errada e é inadequada para SEO. |
| Dois apps/projetos | Rejeitada: não há impossibilidade técnica concreta; duplicaria deploy, auth e foundations. |
| Proxy como autorização Firebase | Rejeitada: auth é browser-only e não há sessão verificável no request; host routing não protege dados. |

## Consequências

### Positivas

- Existe um ponto único para a fronteira de host.
- A landing permanece estática/Server Component e não hidrata Firebase.
- O app mantém as URLs e os contratos da fase 001.
- Localhost e preview não dependem de DNS nem redirect para produção.
- Redirects, canonical e metadata refletem a origem efetiva em vez de esconder
  uma superfície com rewrite.
- A migração para domínios reais pode ser validada por Host header antes da
  configuração da fase 004.

### Negativas e riscos aceitos

- `src/proxy.ts` é uma nova superfície de request e precisa de matcher correto;
  um matcher amplo pode quebrar assets ou requests RSC.
- O proxy terá os nomes dos domínios canônicos centralizados; isso é política
  deliberada, mas uma mudança de domínio exige alteração única e validação.
- A ponte público→app adiciona um redirect em `/login` e `/dashboard` no
  domínio público.
- Auth e persistência Firebase passam a ser testadas também na origem app real
  quando a fase 004 configurar domínios autorizados.
- Preview same-origin não reproduz exatamente a topologia de produção; a
  matriz com Host header cobre a regra sem infraestrutura efetiva.

## Rollout e rollback

1. Criar route groups mantendo os caminhos e executar typegen/build antes de
   adicionar a política de host.
2. Adicionar o proxy com redirects temporários e matcher estreito.
3. Substituir `/` pelo conteúdo de marketing e aplicar metadata.
4. Validar localmente com `Host` simulado e requests de assets.
5. Na fase 004, configurar domínios/TLS/DNS, validar `www`, authorized domains
   Firebase e somente então considerar o redirect permanente operacional.

Rollback da fase 003 pode remover o proxy e desfazer a movimentação dos route
groups sem migração de dados ou mudança de sessão. A rota `/` voltaria a
exigir recuperação do template, por isso o rollback deve ser feito por
reversão versionada, não por regra alternativa espalhada em páginas.

## Validação obrigatória

- `npm run lint`;
- `npm exec next typegen` antes de `npx tsc --noEmit`;
- `npm run build`;
- smoke HTTP com Hosts público, app, `www`, localhost, preview e desconhecido;
- confirmação de `Location`, status 307/308, ausência de loops e ausência de
  redirect em `/brand/*`, `/_next/static/*`, `/_next/image` e favicon;
- inspeção de title, canonical, Open Graph, robots e `X-Robots-Tag`;
- regressão manual do login Google e dashboard guard, sem tratar proxy como
  autorização.

## Fase 004

Ficam explicitamente adiados:

- configuração efetiva de Vercel, DNS, Cloudflare, TLS e aliases;
- authorized domains do Firebase para hosts produtivos;
- sessão server-side, cookies `HttpOnly`, Firebase Admin e autorização real;
- dados financeiros no dashboard;
- decisão sobre `signInWithRedirect` para WebViews/popup bloqueado;
- expansão de sitemap, analytics, consentimento e SEO de marketing.

## Referências

- `AGENTS.md:5-17,19-29`.
- `docs/decisions/001-autenticacao-google-popup.md:31-35,90-123`.
- `docs/specs/002-brand-integration-design-system-foundations.md:14-41,181-205`.
- `src/app/page.tsx:1-69`, `src/app/layout.tsx:1-64`,
  `src/components/auth/google-sign-in.tsx:71-138` e
  `src/components/auth/dashboard-gate.tsx:25-51`.
- Next.js 16 Proxy: https://nextjs.org/docs/app/api-reference/file-conventions/proxy
- Next.js 16 redirects:
  https://nextjs.org/docs/app/api-reference/config/next-config-js/redirects
- Next.js Metadata API:
  https://nextjs.org/docs/app/api-reference/functions/generate-metadata
- Next.js route groups:
  https://nextjs.org/docs/app/api-reference/file-conventions/route-groups
