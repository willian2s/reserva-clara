# 011-01 — Inventariar frontend e acoplamentos Next.js

- **Ticker:** `011`
- **Número:** `01`
- **Status:** `completed`

## Objetivo e resultado esperado

Produzir um inventário verificável da superfície frontend atual e classificar
cada dependência de Next.js como preservável conceitualmente, adaptável ou
reescrita obrigatória. O resultado esperado é um mapa as-is que permita planejar
React/Vite sem transportar acoplamentos ou perder comportamento.

## Requisitos cobertos

- Mapear App Router, route groups, layouts, páginas e rotas dinâmicas.
- Identificar Server/Client Components, Route Handlers, proxy/middleware,
  metadata, SSR/SSG, routing e variáveis de ambiente.
- Mapear componentes, hooks, services/data access, auth, navegação, design
  system, estados e acessibilidade.
- Identificar dependências específicas de Next/Vercel e pontos reutilizáveis.

## Escopo

### Incluído

- `src/app/**`, `src/components/**`, `src/lib/**`, `src/proxy.ts`, CSS, assets,
  configuração e dependências npm.
- Matriz rota → tela → dados → auth → dependências de framework.
- Matriz preservar/adaptar/reescrever/remover com justificativa.
- Baseline de UX, acessibilidade, testabilidade e performance percebida.

### Excluído

- Escolha final de router, state/query library ou hosting.
- Alteração de componentes, rotas, CSS, package ou configuração.
- Protótipos finais de UX, que pertencem à 012.

## Dependências

- Fases 001–010 e código atual disponíveis.
- Nenhuma dependência de outra subtarefa; pode ocorrer em paralelo com 011-02.

## Arquivos e símbolos prováveis

- Leitura: `src/app/**`, `src/components/**`, `src/lib/firebase/client.ts`,
  `src/lib/host-routing.ts`, `src/proxy.ts`, `src/app/globals.css`,
  `package.json`, `next.config.ts`, `.env.example` e testes.
- Saída provável: `docs/architecture/011/frontend-next-inventory.md` ou artefato
  equivalente aprovado durante a execução.

## Passos de implementação

1. Enumerar rotas, layouts, páginas, hosts e redirects atuais.
2. Buscar imports `next/*`, directives `use client`, APIs server-only e tipos
   gerados pelo Next.
3. Traçar auth e dados desde cada tela até Firebase/Route Handler.
4. Inventariar componentes, hooks, eventos globais e estados de UI.
5. Registrar SSR/SSG realmente usado versus capacidade apenas disponível.
6. Classificar cada item com destino e risco de regressão.
7. Listar gaps de logout, navegação ativa, foco/dialog, offline, sessão expirada,
   testes React e acessibilidade.
8. Revisar o inventário contra a árvore real e a spec 011.

## Testes e comandos de validação

- Busca estática por `next/`, `use client`, `headers`, `cookies`, `metadata`,
  `route.ts`, `proxy` e `NEXT_PUBLIC_`.
- Conferência manual de cada rota do inventário contra `src/app/**`.
- Conferência de dependências contra `package.json`/`package-lock.json`.
- `git diff --check` nos artefatos documentais.

## Definição de pronto

- Todas as rotas e acoplamentos Next conhecidos estão catalogados.
- Cada item tem destino explícito e justificativa.
- O inventário distingue reaproveitamento conceitual de reutilização de código.
- Gaps de UX/a11y/testes e riscos de host routing estão registrados.
- Nenhum arquivo de produção foi alterado.

## Riscos e cuidados

- Não assumir que Server Component atual implica requisito de SSR.
- Não tratar `AuthGate` como autorização.
- Não escolher biblioteca por familiaridade antes da revisão de UX.
- Não copiar secrets server-only para variáveis `VITE_*`.

## Resultado e evidências

### Rotas, layouts e hosts

| URL | Arquivo/tela atual | Dados/services | Auth atual | Next/renderização | Destino na migração |
| --- | --- | --- | --- | --- | --- |
| `/` | `src/app/(marketing)/page.tsx` | Landing; sem dados privados | Nenhuma | Server page; `next/image`, `next/link`, marketing metadata | Reescrever como entrada pública do Vite; preservar conteúdo/SEO útil. |
| `/login` | `src/app/(app)/login/page.tsx` + `GoogleSignIn` | Sem dados patrimoniais; sessão Firebase é restaurada/persistida no browser | Firebase Web Auth; popup/listener | Server wrapper + Client; `next/image`, `next/navigation` no componente | Reescrever como rota React; preservar Firebase Web e UX. |
| `/dashboard` | `.../(protected)/dashboard/page.tsx` + `GlobalDashboard` | `useGlobalDashboard` → `listPortfolios`, `listAssets`, `listTransactions`, `quote-client` | `AuthGate` no protected layout; UX client-side | Server wrapper + Client após hidratação; `next/link`/navigation | Reescrever; dados passam por API ASP.NET Core. |
| `/assets` | `.../(protected)/assets/page.tsx` + `AssetCatalog` | Asset repository; `quote-client` → `/api/quotes` | `AuthGate`; depois Rules/token para dados | Server wrapper + Client; `next/link` e metadata | Reescrever; CRUD e Quotes passam pela API. |
| `/portfolios` | `.../(protected)/portfolios/page.tsx` + `PortfolioList` | `listPortfolios`, `listArchivedPortfolios`, `PortfolioCreateForm` → repository | `AuthGate`; UX client-side | Server wrapper + Client; `next/link`, `next/navigation` no form | Reescrever como primeira vertical Vite/API. |
| `/portfolios/[portfolioId]` | `.../[portfolioId]/page.tsx` + `PortfolioDetail` | `usePortfolioDashboard` → `readPortfolioPositions` com `getPortfolio`, `listTransactions`, `listAssets`, `fetchQuotes` | `AuthGate`; autorização não é do guard | Dynamic `params`/`PageProps`; Server wrapper + Client; `next/link`, `next/navigation` | Reescrever; manter archive e valores parciais. |
| `/portfolios/[portfolioId]/transactions` | `.../transactions/page.tsx` + `TransactionLedger` | `listAssets`, `listTransactions(portfolioId)`, `usePortfolio` → `getPortfolio`, `TransactionForm` → `createTransaction` | `AuthGate`; repository valida/reconcilia `SELL`, mas acesso direto ao SDK contorna a validação e não há boundary confiável | Dynamic `params`/`PageProps`; Server wrapper + Client; `next/link` | Reescrever sobre boundary financeiro confiável. |
| `/portfolios/[portfolioId]/settings` | `.../settings/page.tsx` + `PortfolioSettings` | `usePortfolio` → `getPortfolio`; componente chama `updatePortfolio`, `archivePortfolio`, `restorePortfolio` diretamente | `AuthGate`; UX client-side | Dynamic `params`/`PageProps`; Server wrapper + Client; `next/link` | Reescrever sobre Application/API. |
| `POST /api/quotes` | `src/app/api/quotes/route.ts` | Firebase Admin → owner assets → QuoteService → BRAPI | Bearer Firebase ID Token validado server-side | Route Handler; `next/server`; Node runtime | Remover após paridade; substituir por endpoint ASP.NET Core. |
| 404 | `src/app/not-found.tsx` | Sem dados; link contextual | Nenhuma | `next/headers` em request-time; `next/link` | Reescrever para shell/infra Vite. |

Layouts atuais:

- `src/app/layout.tsx`: idioma `pt-BR`, CSS global, `next/font/google`, metadata
  global e tipos gerados `LayoutProps`.
- `src/app/(marketing)/layout.tsx`: metadata pública, canonical e Open Graph.
- `src/app/(app)/layout.tsx`: `noindex,nofollow` para a aplicação.
- `src/app/(app)/(protected)/layout.tsx`: shell, navegação, skip link,
  `main#main-content` e `AuthGate`.

`src/lib/host-routing.ts` e `src/proxy.ts` classificam os hosts público, app,
`www`, localhost e previews `*.vercel.app`, com redirects fixos, 404 para host
desconhecido, bloqueio de `/api/quotes` no host público e `X-Robots-Tag` em
local/preview. Essa política é routing/hosting, não autorização, e deverá ser
reimplementada na infraestrutura independente do Vite/API.

#### Matriz host × path atual

| Host/classe | `/` | `/login` | `/dashboard`, `/portfolios/**`, `/assets/**` | `/api/quotes/**` | Header/observação |
| --- | --- | --- | --- | --- | --- |
| `reservaclara.com.br` / public | landing | `307` para app | `307` para o mesmo path no app | `404` | público não serve aplicação/API. |
| `app.reservaclara.com.br` / app | `307` para `/login` | passa | passa | passa | proxy não autoriza dados. |
| `www.reservaclara.com.br` / www | `308` para o mesmo path no público | `308` para público, depois possível ponte ao app | `308` para público, depois possível ponte ao app | `308` para público | canonicalização no proxy. |
| localhost/loopback / local | passa | passa | passa | passa | `X-Robots-Tag: noindex, nofollow`. |
| `*.vercel.app` / preview | passa | passa | passa | passa | `X-Robots-Tag: noindex, nofollow`; não é boundary de segurança. |
| host desconhecido / unknown | `404` | `404` | `404` | `404` | allowlist de host. |

O matcher cobre somente `/`, `/login/:path*`, `/dashboard/:path*`,
`/portfolios/:path*`, `/assets/:path*` e `/api/quotes/:path*`; não intercepta
assets estáticos, `/_next/static`, `/_next/image` ou favicon. Os redirects
constroem a URL com pathname e não preservam query string na ponte; isso é
comportamento legado que deve ser decidido explicitamente na infraestrutura alvo.

### Acoplamentos específicos do Next.js

| Acoplamento | Ocorrências principais | Classificação |
| --- | --- | --- |
| `next/link` | Marketing, protected layout, dashboards, Portfolio, ledger, settings e 404 | Reescrever para links/router React escolhido. |
| `next/navigation` | `GoogleSignIn`, `AuthGate`, `PortfolioCreateForm`, `DashboardRefreshButton` | Reescrever/adaptar para router e navegação Vite. |
| `next/image` | Landing, login e protected layout | Adaptar para assets estáticos/`img` ou componente próprio. |
| `next/font/google` | `src/app/layout.tsx` | Adaptar carregamento da Inter sem pipeline Next. |
| `next/server` | `src/proxy.ts` (`NextRequest`/`NextResponse`) | Remover; mover host policy para hosting/reverse proxy. |
| `next/headers` | `src/app/not-found.tsx` | Remover; 404 recebe contexto da infra ou do shell. |
| Metadata API | root, marketing e app layouts | Adaptar para HTML/configuração do frontend estático. |
| `PageProps`/`LayoutProps`/`next-env.d.ts` | páginas/layouts e tipos `.next` | Remover; parâmetros vêm do router Vite. |
| Route Handler/`runtime = "nodejs"` | `/api/quotes` | Remover após migração; responsabilidade vai para ASP.NET Core. |

Não foram encontrados Server Actions, `use server`, `cookies()`, middleware
separado, `generateMetadata`, `generateStaticParams`, `revalidate`, `dynamic`
ou fetch server-side de dados privados. O comportamento atual é essencialmente
client-driven, apesar de páginas/layouts serem Server Components wrappers.

### Client Components, autenticação e dados

Os principais módulos com `use client` estão em `src/lib/firebase`,
`src/data/firestore`, `src/data/positions`, `src/data/quotes`, componentes de
auth, hooks de dashboard/Portfolio, formulários, ledger e telas financeiras.

Fluxo observado:

```text
GoogleSignIn
  → signInWithPopup / onAuthStateChanged
  → sessão Firebase restaurada/confirmada no browser
  → router.replace("/dashboard")
  → protected layout monta AuthGate e observa a mesma sessão
  → repositories Firestore no browser
  → read-side de posições/dashboards
  → getIdToken()
  → POST /api/quotes
  → Firebase Admin + Asset reader + BRAPI
```

Detalhes relevantes:

- `src/lib/firebase/client.ts` exporta singleton Web Auth/Firestore.
- `src/components/auth/google-sign-in.tsx` observa/restaura a sessão, abre o
  popup quando necessário e navega para `/dashboard` após autenticação.
- `src/components/auth/auth-gate.tsx` é um segundo observer no layout protegido;
  mostra loading, renderiza filhos para usuário confirmado e redireciona
  anônimos para `/login`. É UX, não autorização.
- `src/data/firestore/{portfolio,asset,transaction}-repository.ts` fazem CRUD e
  leitura diretamente no Firestore.
- `src/data/positions/{portfolio-read,dashboard-read}.ts` calculam o read-side
  no browser, carregando ledgers e catálogos conforme o schema atual.
- `src/data/quotes/quote-client.ts` obtém Bearer Firebase e acessa o Route
  Handler same-origin.
- `src/server/firebase-admin.ts`, `src/server/data/asset-reader.ts` e
  `src/server/quotes/**` são server-only e usam `FIREBASE_ADMIN_*`/`BRAPI_API_KEY`.
- `src/components/dashboard/use-dashboard-read.ts` usa eventos/estado de janela
  para refresh; isso deverá virar uma boundary explícita do cliente HTTP.

### Componentes, design system e baseline UX/a11y

Reutilizáveis conceitualmente:

- UI: `src/components/ui/{button,card,input,label}.tsx`;
- auth: `AuthGate`, `GoogleSignIn`;
- Portfolio: lista, detalhe, settings, criação e hooks;
- Asset: catálogo, criação, edição e Quote;
- Transaction: ledger e formulário;
- dashboard/financial: cards, tabelas, allocation, formatadores, cobertura e
  refresh;
- Tailwind 4 CSS-first, tokens e estados em `src/app/globals.css`;
- assets de marca em `public/brand/**`.

Pontos positivos confirmados: `lang="pt-BR"`, skip link, `main` identificável,
labels associados, `aria-describedby`/`aria-invalid`, `role="status"`/`alert`,
`aria-live`, `aria-busy`, foco visível e layout responsivo.

Gaps que alimentam o baseline/handoff da 011-06 e a descoberta da 012:

- não foi encontrado `signOut`/logout visível;
- não há indicador claro de navegação ativa;
- sessão expirada, refresh único após 401, offline e reconexão não possuem
  estratégia explícita;
- confirmações inline usam `role="group"`, sem dialog semântico/focus trap
  completo;
- não foram encontrados `loading.tsx`, `error.tsx` ou error boundary equivalente;
- telas concentram efeitos, estado, chamadas de dados e apresentação;
- não há testes automatizados de teclado, contraste, zoom, leitor de tela ou
  navegação.

### SSR, SSG, ambiente e testabilidade

| Rota/superfície | Boundary atual | Renderização/build | Consequência Vite |
| --- | --- | --- | --- |
| `/` | Server page/layout; sem dados privados | Path estático no `routes-manifest`, mas `next build` reporta `ƒ`/request-time na baseline atual; conteúdo é público e não usa fetch privado | Preservar HTML/SEO necessário no shell estático ou hosting escolhido. |
| `/login` | Server wrapper + Client `GoogleSignIn` | Path estático no `routes-manifest`; `next build` reporta `ƒ`; auth e interação ocorrem após hidratação | Rota client-side; metadata/robots vão para HTML/config do shell. |
| `/dashboard` e `/assets` | Server wrapper + Client AuthGate/hooks/repositories | Paths estáticos no `routes-manifest`; `next build` reporta `ƒ`; dados são carregados no browser após auth | API HTTP substitui Firestore; loading/error precisam ser explícitos no cliente. |
| `/portfolios` | Server wrapper + Client `usePortfolio`/forms | Path estático no `routes-manifest`; `next build` reporta `ƒ`; listagem ocorre no browser | Primeira slice React/API, sem depender de SSR privado. |
| `/portfolios/[portfolioId]/**` | Server wrapper resolve `params`; componentes client carregam dados | Paths dinâmicos no `routes-manifest` e `ƒ` no build; não há `generateStaticParams` nem fetch privado server-side | Router Vite recebe params; API fornece dados e estados. |
| `not-found` | `headers()` em `src/app/not-found.tsx` | request-time para decidir contexto/links | Infra/shell precisa fornecer política de host/404. |
| `POST /api/quotes` | Route Handler Node server-only | endpoint request-time | Endpoint sai do frontend e vai para ASP.NET Core. |

Não há SSR de dados privados, SSG explícito, ISR, `generateStaticParams`,
`revalidate`, `dynamic`, Server Actions ou `cookies()`. Páginas/layouts são
Server Components wrappers, mas os dados patrimoniais aparecem após hidratação.
O `routes-manifest` distingue os paths estáticos (`/`, `/login`, `/dashboard`,
`/assets` e `/portfolios`) dos paths dinâmicos de Portfolio; o resumo do
`next build` reporta todos como `ƒ`/request-time e o proxy como middleware/proxy.
Essa diferença entre padrão de rota e estratégia de renderização é evidência da
baseline, não requisito alvo.
Metadata existe, mas deve ser reproduzida no shell estático.
- `.env.example` separa `NEXT_PUBLIC_FIREBASE_*` de `BRAPI_API_KEY` e
  `FIREBASE_ADMIN_*`; somente a configuração pública Firebase e a base URL da
  API poderão chegar a `VITE_*`.
- `package.json` usa Next `16.3.5`, React `19.2.8`, Firebase Web/Admin, Base UI,
  Tailwind/shadcn e ESLint Next; não há Vitest, Jest, Testing Library,
  Playwright ou Cypress.
- Existem testes Node para domínio, positions/read-side/dashboard, Quotes e
  Rules, mas não há testes de componentes, hooks, routing, auth visual,
  acessibilidade ou E2E.

#### Tooling e acoplamentos de build

| Artefato | Dependência atual | Destino explícito |
| --- | --- | --- |
| `package.json` scripts `dev/build/start` | `next dev`, `next build`, `next start` | Substituir por scripts Vite; não manter Next após 021. |
| `package.json` `next`/`eslint-config-next` | Next `16.3.5` e presets específicos | Remover após paridade; escolher lint independente no foundation. |
| `eslint.config.mjs` | `eslint-config-next/core-web-vitals`, `typescript`; ignora `next-env.d.ts` | Reescrever config para frontend alvo; não copiar preset Next automaticamente. |
| `tsconfig.json` | plugin `next`, includes `next-env.d.ts` e `.next/**` | Remover plugin/includes gerados; manter strict/paths conforme decisão Vite. |
| `next-env.d.ts` | referências Next, image types e `.next/types` | Remover quando App Router/Next sair. |
| `next.config.ts` | Configuração Next vazia | Remover após confirmar que não há comportamento oculto. |
| `package-lock.json` | árvore de dependências Next/Firebase/Admin | Regenerar somente na migração; é autoridade da baseline atual. |
| `tests/quotes-route.test.mjs` | importa `NextRequest` e `next/server.js` para testar proxy | Reescrever como teste API/host independente; preservar casos de auth/ownership. |
| `scripts/run-*.mjs` | compilam subconjuntos TS para harness Node | Preservar/adaptar temporariamente; substituir/ampliar por runners frontend/.NET. |

O server-only atual é uma convenção de import graph (`src/server/**` só chega ao
Route Handler); não há sentinel explícito `import "server-only"`. A arquitetura
alvo deve tornar esse boundary estrutural no ASP.NET Core, com secrets nunca no
bundle Vite.

### Matriz de destino

| Área | Destino | Decisão |
| --- | --- | --- |
| Regras de domínio, IDs, decimais, archive, estados de Quote | Preservar conceitualmente | São contratos da spec 011; portar com golden masters. |
| Tokens, identidade visual, assets e componentes financeiros | Adaptar/reusar conceitualmente | Independentes do Next, mas sujeitos à revisão UX/UI. |
| Firebase Web Auth e `AuthGate` | Preservar/adaptar | Auth permanece no frontend; `AuthGate` continua somente UX. |
| Repositories Firestore e SDK de persistência | Reescrever | Novo frontend usa cliente HTTP; banco só pelo backend. |
| `quote-client` | Reescrever/adaptar | Preservar estados/erros, trocar boundary e política de 401. |
| `src/app/**`, route groups e layouts | Reescrever | Substituir App Router por React/Vite/router a decidir. |
| `next/link`, navigation, image e font | Reescrever/adaptar | Remover APIs específicas do framework. |
| `src/proxy.ts`/host routing | Remover após cutover | Routing de host vai para a infraestrutura alvo. |
| `/api/quotes`, Firebase Admin/Firestore Admin no Next | Remover após paridade | Responsabilidades ficam no ASP.NET Core/Infrastructure. |
| `src/domain/**` e testes Node | Reusar seletivamente/portar | Preservar sem transportar dependências Firestore. |
| `package.json`, `eslint.config.mjs`, `tsconfig.json`, `next-env.d.ts`, `next.config.ts` | Remover/adaptar no retirement | São tooling/framework, não contratos de produto; precisam de migração explícita. |
| `tests/quotes-route.test.mjs`/harness Next | Reescrever/adaptar | Cobertura de segurança permanece, implementação de request muda. |

### Riscos residuais do inventário

1. O browser ainda possui writes patrimoniais diretos até a migração; `SELL`
   acima do saldo exige contenção no gate C0.
2. O host routing está acoplado a `NextRequest`/`NextResponse`, Vercel previews e
   origins fixas.
3. O contrato HTTP atual cobre Quotes, mas não CRUD patrimonial; as novas APIs
   devem ser definidas por vertical slice após UX.
4. O read-side client-only lê coleções completas e pode não escalar.
5. Cache BRAPI é por processo e não representa política global multi-réplica.
6. `next-env.d.ts` e tipos gerados pelo `.next` ainda fazem parte da baseline do
   build atual e só podem ser removidos no retirement.
7. O arquivo local ignorado `firebase-adminsdk-keys.json` deve ser verificado
   quanto a histórico/exposição sem ler ou registrar seu conteúdo.

## Arquivos alterados

- `docs/specs/011-revisao-roadmap-evolucao-arquitetural.md` — status da fase
  alinhado para `in_progress` após início da execução de 011-01.
- `docs/tasks/011-revisao-roadmap-evolucao-arquitetural/011-01-inventariar-frontend-e-next.md` — status, inventário, matriz, evidências, riscos e distinção entre path estático/dinâmico e renderização `ƒ`.
- `docs/tasks/011-revisao-roadmap-evolucao-arquitetural/011-00-overview.md` — checklist e progresso da fase.
- Nenhum arquivo de produção, configuração externa, banco, deploy ou segredo foi alterado.

Não foi criado o artefato separado sugerido em `docs/architecture/**` porque a
permissão de edição disponível nesta sessão restringe alterações a `docs/specs/**`
e `docs/tasks/**`; o inventário completo foi registrado nesta subtarefa.

## Decisões e desvios

- O inventário confirma que a migração pode ser tratada como SPA client-driven;
  não há requisito atual de preservar SSR/SSG privado.
- O design system e os componentes financeiros são reaproveitáveis
  conceitualmente, não automaticamente: a revisão UX/UI pode alterar sua forma.
- A escolha de router, state/query layer e hosting permanece aberta conforme a
  spec 011; não foi antecipada nesta subtarefa.
- A remoção de Next, Firestore e Firebase Admin foi classificada como posterior
  à paridade, cutover, soak e fase 021.
- O inventário foi incorporado ao arquivo da subtarefa em vez de criar um novo
  arquivo fora dos diretórios permitidos.
- Após revisão independente, a tabela de renderização foi corrigida para não
  confundir o padrão de rota do `routes-manifest` com a classificação `ƒ` do
  `next build`: rotas sem parâmetro têm path estático, mas continuam request-time
  na baseline; rotas `[portfolioId]` são dinâmicas em ambos os sentidos.
- Registro histórico da execução: naquele momento, o status da spec foi
  alinhado a `in_progress`, o overview estava em `1/8` e somente 011-01 estava
  concluída. O estado atual deve ser consultado no overview da fase.

## Comandos executados e resultados

### Inspeção documental e de código

- `functions.glob` em `src/app/**`, `src/components/**` e módulos `src/lib`,
  `src/data` e `src/server`: rotas, componentes e boundaries confirmados.
- `functions.read` de `AGENTS.md`, spec/overview/task 011-01, configurações e
  arquivos de implementação relevantes: concluído.
- `functions.grep` para headings/status/checklist/tickers: concluído.
- Revisões independentes `explore` e `review`: após correções de granularidade e
  exatidão factual, a revisão final retornou **APROVADO**, sem findings.

### Gates técnicos de baseline

- `npm run lint` — **passou**.
- `npm run test:domain` — **passou**, 14 testes.
- `npm run test:positions` — **passou**, 4 testes.
- `npm run test:positions-read` — **passou**, 9 testes.
- `npm run test:dashboard-read` — **passou**, 8 testes.
- `npm run test:quotes-adapter` — **passou**, 7 testes.
- `npm run test:quotes-service` — **passou**, 8 testes.
- `npm run test:quotes-route` — **passou**, 8 testes.
- `npm run test:financial-presentation` — **passou**, 6 testes.
- `npm run test:rules` — **passou**, 19 testes no Firestore Emulator; os logs
  esperados de `PERMISSION_DENIED` correspondem aos casos negativos.
- `npm exec next typegen && npx tsc --noEmit` — **passou**; tipos gerados e
  typecheck sem erros.
- `npm run build` — **passou**; Next 16.3.5 compilou e gerou as rotas atuais.
- `git diff --check` — **passou**; a verificação equivalente com
  `git diff --no-index --check` também passou para os três arquivos documentais
  não rastreados.
- Validação desta execução: `npm run lint`, todos os scripts `test:*`,
  `npm exec next typegen && npx tsc --noEmit`, `npm run build` e `git diff --check`
  passaram novamente; o build confirmou `ƒ` para as rotas e o
  `.next/routes-manifest.json` confirmou quais paths são estáticos ou dinâmicos.

## Evidências e aceite

- Todas as rotas, layouts, host routing e Route Handler foram catalogados.
- Os acoplamentos `next/*`, APIs server-only, metadata e tipos gerados têm
  destino explícito.
- Auth, Firestore, read-side, Quotes e variáveis server-only foram rastreados.
- Reuso conceitual versus reescrita obrigatória está separado.
- Gaps de UX, acessibilidade, testabilidade, sessão, offline e performance estão
  registrados para as subtarefas seguintes.
- A baseline técnica permanece verde e nenhum código de produção foi alterado.
- A revisão independente final aprovou o inventário, os fluxos e os gates
  documentais; uma ambiguidade sobre path estático versus renderização `ƒ` foi
  corrigida e não há findings pendentes nesta subtarefa.

## Riscos residuais

- C0 foi decidido como aceitação temporária restrita a dev/testes: apenas dados
  sintéticos/descartáveis, sem writes em staging/produção ou dados reais, com
  owner maintainer e saída antes do primeiro usuário ativo, dado real,
  staging/produção ou cutover.
- O modelo relacional, a autorização ASP.NET/RLS, o router Vite e os contratos
  HTTP ainda não foram definidos; isso pertence às próximas subtarefas.
- A política de hosts/deploy ainda depende da revisão de ambientes e cutover.
- A ausência de testes React/E2E permanece risco até as fases 013–019.

## Handoff

- `011-02` pode iniciar agora para mapear domínio, dados e riscos; não depende
  deste inventário.
- `011-03` deve usar esta matriz para separar API/Application/Domain/
  Infrastructure e classificar o host routing como infraestrutura.
- `011-06` deve consolidar os gaps de UX/a11y, as restrições frontend e as
  perguntas para a 012; a 012 prototipa, altera requisitos/DTOs e só então
  permite o freeze de contratos por slice.
- A remoção efetiva dos acoplamentos fica bloqueada até 017–021.
