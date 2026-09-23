# 003 — Public Landing & App Separation

## Ticker

`003`

## Status

`completed`

## Contexto

As fases 001 (Authentication) e 002 (Brand Integration & Design System
Foundations) estão concluídas. A inspeção inicial desta fase foi feita na `main`,
em `7ff6054` (`docs: refine repository agent guidance`), com working tree limpo
antes da criação desta documentação.

O projeto é um único Next.js `16.3.5` com App Router, React `19.2.8`, TypeScript
strict, Tailwind CSS 4, shadcn `base-nova`, Base UI e Firebase Authentication
Web. A fase 001 criou `/login` e `/dashboard`; a fase 002 integrou Inter, tokens
semânticos, assets oficiais e foundations de acessibilidade. A rota `/` ainda
é o template inicial do Create Next App, com `next.svg`, `vercel.svg`, copy em
inglês e links externos (`src/app/page.tsx:1-69`).

O posicionamento oficial está em `docs/brand/brand.md`: Reserva Clara é uma
aplicação para organizar, acompanhar e construir patrimônio com clareza, com a
tagline “Seu patrimônio, com clareza.”. A identidade deve comunicar clareza,
segurança, tranquilidade, organização, progresso responsável e visão de longo
prazo; não deve reduzir o produto a trading, banco, corretora, controle de
gastos ou uma promessa de rentabilidade.

No início do planejamento não havia `src/proxy.ts`, `middleware.ts` ou regras de
host em `next.config.ts`. A autenticação continua browser-only: `auth` é
inicializado em `src/lib/firebase/client.ts`, enquanto `GoogleSignIn` e
`DashboardGate` são as ilhas Client existentes. O dashboard é um guard de UX e
não é uma fronteira de autorização.

A documentação local indicada por `AGENTS.md` (`node_modules/next/dist/docs/`)
não está presente neste checkout. Como não foi instalada dependência durante o
planejamento, a decisão sobre Next.js foi conferida na documentação oficial da
mesma linha instalada: Proxy, redirects, route groups e Metadata API. Esse
limite e as referências estão registrados na seção de referências abaixo.

## Objetivo

Substituir o resíduo do template em `/` por uma landing pública enxuta e
oficial, e estabelecer uma fronteira única e compreensível entre a superfície
pública e a aplicação autenticada, mantendo um único repositório, um único
projeto Next.js e o fluxo Firebase da fase 001 sem redesign arquitetural.

Ao final da implementação futura:

- `reservaclara.com.br` será a origem canônica da presença pública;
- `app.reservaclara.com.br` será a origem canônica da aplicação;
- `www.reservaclara.com.br` estará preparado para redirecionar à origem
  pública quando a infraestrutura da fase 004 existir;
- `/` no host público renderizará a landing Reserva Clara;
- `/login` e `/dashboard` serão rotas conceitualmente app-only;
- localhost e previews da Vercel continuarão simples e utilizáveis em uma única
  origem;
- a landing será Server Component, não importará Firebase/Firestore e usará as
  foundations visuais da fase 002.

## Requisitos

### Fronteira público/app

1. Centralizar a classificação de host e as decisões de redirect em um único
   `src/proxy.ts`, usando a convenção `proxy.ts` do Next.js 16, sem espalhar
   hostname checks por páginas ou componentes.
2. Usar route groups somente para organização e metadata: `(marketing)` para a
   landing e `(app)` para `/login` e `/dashboard`; os grupos não podem alterar
   as URLs públicas existentes.
3. Usar redirects explícitos, não rewrites, para a ponte entre hosts. O proxy
   não poderá ser tratado como autenticação ou autorização.
4. Normalizar o hostname antes da comparação (minúsculas e remoção de ponto
   final), aceitar somente hosts conhecidos e não derivar o destino de redirect
   de input controlado pelo usuário.
5. Manter a política de host restrita a rotas de documento e não interceptar
   `_next/static`, `_next/image`, `public/brand/*`, favicons ou outros assets.

### Landing V1

6. Remover integralmente o template inicial de `/` e entregar uma landing em
   português brasileiro que responda: o que é Reserva Clara, qual problema
   ajuda a resolver, que visão/organização oferece e qual é o próximo passo.
7. Compor somente o necessário para uma V1 real: header com marca e entrada,
   hero, proposta de valor/capacidades, explicação simples de como ajuda, CTA
   final e footer. Não adicionar seções para preencher espaço.
8. Usar copy ampla sobre patrimônio e decisões de longo prazo. Não posicionar o
   produto exclusivamente como gastos, reserva de emergência, carteira,
   trading, banco, corretora ou ferramenta de superar o mercado.
9. Não inventar depoimentos, usuários, patrimônio administrado, avaliações,
   logos de clientes, parceiros, certificações, prêmios, estatísticas,
   pricing, planos ou promessas de enriquecimento/rentabilidade.
10. Não usar os gráficos de referência `docs/brand/patrimonio.png` e
    `docs/brand/consolidacao.png` como dashboard ou prova visual da landing,
    pois seus números podem parecer dados reais. Se houver apoio visual, ele
    deverá usar os assets oficiais sem dados financeiros, ou uma composição
    abstrata sem valores.

### Navegação e CTA

11. O CTA principal deve ser um link navegável e acessível para `/login`, sem
    URL de produção embutida no componente. No host público produtivo, o proxy
    conduzirá `/login` à origem app; em localhost e preview o caminho será
    same-origin.
12. O header e o footer podem repetir uma entrada para a aplicação, desde que
    não criem destinos diferentes. Não introduzir `returnTo`, autenticação
    adicional, query de redirect ou fallback client-side de hostname.
13. Preservar os contratos existentes `router.replace("/dashboard")` após
    autenticação e `router.replace("/login")` para o guard anônimo; ambos
    continuarão relativos à origem app quando o login/dashboard já estiverem no
    host app.

### Design, responsividade e acessibilidade

14. Reutilizar Inter, tokens semânticos, spacing, radius, borders, foco,
    `Button`, `Card` e assets de `public/brand/` estabelecidos na fase 002. Não
    criar uma segunda linguagem visual de marketing.
15. Manter direção de clareza, confiança, tranquilidade, organização e espaço;
    evitar estética de trading, excesso de verde, gradientes decorativos, glow,
    glassmorphism, sombras exageradas, animação gratuita e hero SaaS genérico.
16. Planejar mobile-first, desktop, zoom e viewport estreito com semântica
    HTML, landmarks, um heading principal, headings em ordem, foco visível,
    navegação por teclado, contraste WCAG, alvos adequados, alt apropriado e
    comunicação que não dependa apenas de cor.

### Metadata e indexação

17. Definir metadata específica da landing: title, description, canonical
    absoluto para `https://reservaclara.com.br/`, Open Graph básico, locale
    `pt_BR`, tipo `website` e reutilização dos ícones/favicons oficiais já
    registrados no layout.
18. Marcar `/login` e `/dashboard` como `noindex` e `nofollow` por metadata da
    superfície app, sem transformar isso em mecanismo de segurança.
19. Previews Vercel e ambientes locais não devem ser indexáveis; essa proteção
    será aplicada de forma centralizada na política de host com
    `X-Robots-Tag`, sem iniciar analytics, consentimento, sitemap completo ou
    projeto de SEO.

### Preservação e escopo

20. A landing não poderá importar Firebase, Firestore ou componentes de auth
    sem necessidade. `/login` e `/dashboard` devem conservar seus componentes,
    estados, guard, popup Google e comportamento da fase 001.
21. Não adicionar Firestore, domínio financeiro, sessão server-side, Firebase
    Admin, autorização, logout, dark mode, pricing, analytics, consentimento,
    DNS, Cloudflare, configuração efetiva de Vercel/Firebase ou deploy.

## Critérios de aceite

1. A rota `/` não contém nenhum resíduo do Create Next App e, no host público,
   renderiza uma landing Reserva Clara em pt-BR com o posicionamento de
   patrimônio e longo prazo.
2. Existe uma matriz implementável e centralizada para hosts público canônico,
   app canônico, `www`, localhost, previews Vercel e host desconhecido, sem
   regras duplicadas em componentes.
3. No host público, `/` é a landing e `/login`/`/dashboard` são encaminhados
   com segurança de destino para `app.reservaclara.com.br`; no host app, `/`
   conduz a `/login` e as duas rotas de aplicação permanecem disponíveis.
4. `www` está preparado para redirect permanente ao domínio público, mas DNS,
   TLS, Vercel e ativação efetiva permanecem na fase 004.
5. Localhost e previews mostram uma única origem funcional: `/` landing,
   `/login` auth e `/dashboard` guard, sem redirect obrigatório para produção.
6. O CTA principal e as entradas equivalentes conduzem a `/login` sem
   hardcode de domínio em páginas/componentes e sem depender de Firebase para
   a landing.
7. A landing usa os assets, Inter e tokens da fase 002; não há segunda paleta,
   dados financeiros, números fictícios, prova social ou promessa comercial.
8. Landing, login e dashboard têm metadata coerente: a landing é indexável e
   canônica no domínio público; login/dashboard são `noindex`; preview/local
   recebem `noindex` centralizado.
9. A composição é responsiva, legível em viewport estreito e acessível por
   teclado, foco, landmarks, headings, alt, contraste e nomes de controles.
10. Login Google, popup, estados e guard client-side da fase 001 continuam com
    o mesmo contrato; a landing não inicializa ou importa Firebase.
11. `npm run lint`, `npm exec next typegen`, `npx tsc --noEmit` e `npm run build`
    passam nessa ordem, sem criar dependências, test runner ou alterações fora
    do escopo aprovado.

## Comportamento atual encontrado

- `src/app/page.tsx:1-69` é o template inicial com `next.svg`, `vercel.svg`,
  links para Vercel/Next.js, copy em inglês, classes `dark:*` e hex inline.
- `src/app/layout.tsx:1-64` é o root layout Server Component, aplica Inter,
  `lang="pt-BR"`, `min-h-full flex flex-col` e metadata global com favicons e
  app icon oficiais.
- `src/app/login/page.tsx:1-45` é Server Component e compõe logo oficial,
  tagline, `Card` e `GoogleSignIn`.
- `src/app/dashboard/page.tsx:1-5` compõe somente `DashboardGate`.
- `src/components/auth/google-sign-in.tsx:71-99,101-138` observa o Firebase
  client, usa `signInWithPopup` e faz `router.replace("/dashboard")`; os estados
  `checking`, `ready`, `signing-in`, `cancelled`, `error` e `authenticated`
  já estão tratados.
- `src/components/auth/dashboard-gate.tsx:25-51` observa auth e faz
  `router.replace("/login")` para anônimo; `:53-103` renderiza apenas shell não
  sensível após autenticação.
- `src/lib/firebase/client.ts:1-19` inicializa Firebase Web e não deve ser
  importado pela landing.
- `src/app/globals.css:59-105,141-189` possui brand tokens, semantic tokens
  light, Inter, radius, focus e `.dark` dormente; a landing deve consumir os
  tokens, não espalhar hex.
- `src/components/ui/button.tsx:5-55` e `card.tsx:4-102` já fornecem os
  componentes base-nova alinhados à fase 002.
- `next.config.ts:1-7` não contém routing; não há `src/proxy.ts` ou
  `middleware.ts`.
- `public/brand/` contém lockups, mark, app icons e favicons oficiais. Os assets
  de documentação em `docs/brand/` são referência visual; não devem ser
  tratados automaticamente como assets de runtime.
- Não há test runner, formatter, CI ou dependência de teste configurados.

## Abordagem escolhida

### Organização de rotas

Manter um único root layout em `src/app/layout.tsx` e reorganizar as páginas
com route groups, sem mudar o URL público:

```text
src/app/
  layout.tsx
  globals.css
  (marketing)/
    page.tsx
  (app)/
    layout.tsx
    login/page.tsx
    dashboard/page.tsx
```

`(marketing)` organiza a superfície pública e sua metadata. `(app)` organiza as
rotas autenticáveis e aplica `noindex`; nenhum grupo cria um segundo root layout
ou um segundo projeto Next.js. O root layout continua compartilhado para
preservar Inter, favicons e foundations.

### Política central de host

Adotar `src/proxy.ts` como único dono da política de host. O proxy normaliza o
hostname, classifica a origem, atua somente sobre rotas de documento e usa
destinos fixos. A tabela é o contrato da implementação:

| Classe | `/` | `/login` | `/dashboard` | Indexação |
| --- | --- | --- | --- | --- |
| `reservaclara.com.br` | Renderiza landing | `307` para `https://app.reservaclara.com.br/login` | `307` para `https://app.reservaclara.com.br/dashboard` | Pública |
| `app.reservaclara.com.br` | `307` relativo para `/login` | Renderiza login | Renderiza rota + `DashboardGate` | `noindex` |
| `www.reservaclara.com.br` | `308` para o mesmo caminho em `https://reservaclara.com.br` | `308` para público; depois ponte para app | `308` para público; depois ponte para app | Não duplicar |
| `localhost`, loopback | Renderiza landing | Renderiza login na mesma origem | Renderiza rota na mesma origem | `noindex` |
| `*.vercel.app` | Renderiza landing | Renderiza login na mesma origem | Renderiza rota na mesma origem | `noindex` |
| Outro host | `404` para documento | `404` para documento | `404` para documento | Não aplicável |

Os redirects de ponte público→app serão `307` durante a fase 003 para evitar
cache permanente prematuro. O redirect do alias `www` será `308`, mas só terá
efeito quando DNS, domínio, TLS e configuração de produção existirem na fase
004. Query strings não controlarão destino nem introduzirão `returnTo`; a
implementação não deve criar open redirect.

Localhost inclui `localhost`, `127.0.0.1`, `0.0.0.0` e `::1` para manter o
desenvolvimento simples. Previews `*.vercel.app` são tratadas como uma única
origem de demonstração, não como produção nem como origem de autorização. A
validação poderá simular domínios produtivos com header `Host`, sem alterar DNS
ou `/etc/hosts`.

O matcher do proxy deve ser estreito para os documentos existentes (`/`,
`/login/:path*` e `/dashboard/:path*`) e não alcançar `_next/static`,
`_next/image`, `public/brand`, favicons ou APIs. Ao adicionar nova página pública,
a única política central deve ser atualizada junto com sua matriz de host; não
serão criados checks em cada página.

### Redirects, não rewrites

Não usar rewrite para fazer uma origem parecer outra: isso mascararia a URL,
complicaria canonical/Open Graph, cache e requests RSC. `next.config.ts` não
será um segundo dono da política. `headers()` não será usado para escolher a
composição da página, pois espalharia decisão de host e tornaria a rota dinâmica
sem necessidade. Redirect client-side também fica descartado para a fronteira,
pois permite flash da superfície errada e depende de JavaScript.

Host routing não é autorização. O `DashboardGate` continua somente UX e o
dashboard permanecerá sem dados sensíveis, conforme
`docs/decisions/001-autenticacao-google-popup.md`. Sessão server-side, Firebase
Admin e autorização real continuam fora da fase.

### Composição da landing

A V1 será uma página Server Component, sem import Firebase e sem client island
obrigatória:

1. **Header:** lockup horizontal oficial em superfície clara, link de marca
   para `/` e entrada acessível “Acessar a aplicação” para `/login`.
2. **Hero:** H1 com “Seu patrimônio, com clareza.” e texto que explique
   organizar, acompanhar e construir patrimônio com visão de longo prazo;
   CTA primário “Acessar a aplicação”.
3. **Proposta de valor:** três blocos curtos, sem números, para “visão do
   todo”, “organização contínua” e “decisões conscientes”, ou copy equivalente
   aprovada na implementação. Os blocos descrevem benefício, não prova de
   capacidade já entregue.
4. **Como ajuda:** uma explicação curta em três movimentos — organizar,
   acompanhar e decidir — sem dashboard fictício, gráfico, saldo ou promessa de
   resultado.
5. **CTA final e footer:** repetição contextual do próximo passo, tagline,
   marca e link para a aplicação. Não incluir pricing, links sociais inventados
   ou claims comerciais.

O visual usará `logo-horizontal.png`/`logo-compact.png` conforme largura,
`logo-mark.png` somente como apoio decorativo ou compacto, Inter, tokens
semânticos, `Button`/`Card` quando houver benefício real e a escala de spacing
existente. Não usar `patrimonio.png` ou `consolidacao.png` na UI pública.

### CTA e navegação

Links da landing usarão `/login` relativo. Assim, localhost, preview e produção
compartilham o mesmo contrato; somente o proxy decide se `/login` permanece na
origem ou vai para `app.reservaclara.com.br`. O login continua redirecionando
para `/dashboard` relativo e o dashboard continua retornando `/login` quando
anônimo. Nenhum componente conhecerá `reservaclara.com.br` ou
`app.reservaclara.com.br` para decidir navegação.

### Metadata e SEO V1

- A landing terá title descritivo da marca/produto, description coerente com o
  posicionamento e canonical absoluto `https://reservaclara.com.br/`.
- Open Graph terá title, description, `url` canônica, `siteName`, locale `pt_BR`
  e `type: "website"`; se validado visualmente, poderá reutilizar
  `/brand/logo-horizontal.png` como imagem oficial, usando URL absoluta ou
  `metadataBase` restrito ao segmento `(marketing)`, sem inventar arte ou dados.
- O favicon e Apple icon atuais de `src/app/layout.tsx` serão preservados.
- O layout `(app)` marcará `/login` e `/dashboard` como `robots: noindex,
  nofollow`; isso é orientação para indexadores, não controle de acesso.
- Localhost e previews receberão `X-Robots-Tag: noindex, nofollow` pelo proxy.
- Sitemap, analytics, consentimento/cookies, JSON-LD amplo e ferramentas de
  marketing não entram nesta fase.

### Acessibilidade e regressão

Header, main e footer serão landmarks; a navegação terá nomes compreensíveis;
o documento terá um H1 e headings ordenados; imagens informativas receberão alt
e marcas redundantes terão alt vazio; os CTAs serão links reais com foco
visível. A validação cobrirá teclado, zoom, contraste, viewport mobile, ausência
de overflow horizontal e leitura sem depender de cor.

A implementação não deve tocar na lógica de `GoogleSignIn`,
`DashboardGate` ou `src/lib/firebase/client.ts` salvo ajuste estrutural de
import causado pela movimentação das páginas. O aceite deve provar acesso
anônimo e autenticado em `/login`/`/dashboard`, além de confirmar que a landing
responde sem configuração Firebase.

## Alternativas descartadas

| Alternativa | Motivo do descarte |
| --- | --- |
| Segundo projeto Next.js ou monorepo | A topologia desejada pode ser preparada em um projeto; duplicar deploy e contratos cria custo antes de necessidade técnica comprovada. |
| `middleware.ts` | No Next 16 a convenção foi renomeada para `proxy.ts`; manter o nome antigo contradiz a versão instalada e a documentação atual. |
| `next.config.ts` como único host router | Redirects condicionados por host existem, mas não dão um ponto tão claro para normalização, previews, host desconhecido e headers; não criar dois donos da política. |
| `rewrites` entre marketing e app | Mantêm a URL original e podem apresentar conteúdo app em origem pública, complicando canonical, cache, RSC e debugging. |
| `headers()` dentro de `page.tsx` | Espalha hostname checks na árvore React, torna renderização dinâmica e não resolve redirects de canonicalização. |
| Client-side hostname detection | Depende de JavaScript, permite flash da superfície errada e é pior para SEO e navegação direta. |
| Route groups sem proxy | Organizam pastas, mas não distinguem hosts nem impedem `/login` e `/dashboard` no host público. |
| Links absolutos fixos da landing para app | Tornam localhost/previews incômodos e espalham domínio de produção em componentes; o proxy central resolve a ponte. |
| Popup + redirect ou sessão server-side | São decisões de autenticação da fase 001 e não são necessárias para separar superfícies; ficam para requisitos futuros. |
| Dashboard visual fictício na landing | Pode ser interpretado como dado real e contradiz o escopo sem Firestore/domínio financeiro. |

## Arquivos, módulos e contratos afetados

### Alterações esperadas na implementação futura

- `src/app/page.tsx`: substituir/mover o template para
  `src/app/(marketing)/page.tsx` ou remover após a migração, sem manter duas
  páginas resolvendo `/`.
- `src/app/(marketing)/page.tsx`: nova landing Server Component, copy, layout,
  links e assets.
- `src/app/(marketing)/layout.tsx`: metadata pública compartilhável, se a
  implementação usar layout de marketing.
- `src/app/(app)/layout.tsx`: metadata `noindex` da superfície app.
- `src/app/(app)/login/page.tsx` e `src/app/(app)/dashboard/page.tsx`:
  movimentação estrutural sem mudar `/login` e `/dashboard`.
- `src/proxy.ts`: normalização/classificação de host, redirects, resposta para
  host desconhecido e `X-Robots-Tag` de local/preview.

### Reutilização sem alteração esperada

- `src/app/layout.tsx`, `src/app/globals.css` e `src/components/ui/*` da fase
  002, salvo necessidade de metadata compartilhada comprovada;
- `src/components/auth/google-sign-in.tsx` e
  `src/components/auth/dashboard-gate.tsx`;
- `src/lib/firebase/client.ts`;
- `public/brand/*` e seus nomes/variantes oficiais;
- `next.config.ts`, sem introduzir segundo mecanismo de host routing;
- `package.json` e `package-lock.json`, sem novas dependências.

### Contratos técnicos

- A landing e seus componentes são Server Components por padrão e não importam
  Firebase/Firestore.
- Firebase permanece limitado às ilhas Client existentes.
- A URL pública de assets continua `/brand/...`, nunca `/public/brand/...`.
- Route groups não alteram `/`, `/login` ou `/dashboard`.
- `src/proxy.ts` é o único módulo autorizado a classificar host e emitir ponte
  entre origens nesta fase.
- Redirects usam destinos fixos e nenhum parâmetro de usuário controla host,
  caminho de destino ou `returnTo`.
- `/login` e `/dashboard` não se tornam autorização server-side por causa do
  proxy ou de `robots`.
- A canonical pública é `https://reservaclara.com.br/`; `app` nunca herda essa
  canonical.

## Riscos e mitigação

| Risco | Mitigação |
| --- | --- |
| Loop entre `www`, público e app | Matriz fixa, destino por classe, `www` sempre termina no público e público app-only sempre termina no app; testar no máximo os saltos previstos. |
| Host header ou preview classificado incorretamente | Normalizar e comparar allowlist/sufixo Vercel exato; host desconhecido recebe 404 para documento; não aceitar subdomínio arbitrário de produção. |
| Proxy interceptar assets/RSC | Matcher restrito, inspeção de `/_next/*`, `/brand/*`, favicon e requests de navegação; nenhum matcher global sem exclusões. |
| Host routing confundido com auth | Manter dashboard sem dados sensíveis e registrar explicitamente que proxy/guard são UX; sessão server-side fica para fase futura. |
| Firebase OAuth na origem app | Não alterar auth nesta fase; validação manual registra que authorized domains e domínio app efetivo são configuração de fase 004. |
| CTA absoluto quebrar local/preview | Usar `/login` relativo e centralizar apenas a ponte no proxy. |
| Canonical/indexação duplicada | Canonical somente na landing pública, `noindex` em app e preview, `www` com redirect permanente quando ativado. |
| Copy prometer recurso ainda inexistente | Escrever benefícios em termos de propósito e organização; revisão contra fora de escopo e proibição de dados/claims. |
| Landing visualmente virar outro produto | Reusar Inter, tokens, assets, Button/Card e regras de `docs/brand/brand.md`; validar contra as proibições da fase 002. |
| Movimentação de páginas quebrar auth | Route groups preservam URL; executar typegen, build e matriz manual de popup/guard antes de concluir. |
| Falta da documentação local do Next | Não inventar API; decisão foi cruzada com documentação oficial da versão e deve ser validada pelos checks do pacote instalado na implementação. |

## Estratégia de testes e validação

Não há test runner configurado. A prova da fase combina gates existentes,
inspeção estrutural, smoke HTTP com Host e validação manual visual/a11y:

1. Antes dos gates, confirmar que a landing não importa `firebase`,
   `src/lib/firebase/client` ou `DashboardGate` e que somente o proxy contém
   classificação de host.
2. Executar, nessa ordem, `npm run lint`, `npm exec next typegen`, `npx tsc
   --noEmit` e `npm run build`.
3. Iniciar `npm run dev -- --hostname 127.0.0.1` ou `npm start` após build e
   simular com `curl`/browser os Hosts `reservaclara.com.br`,
   `app.reservaclara.com.br`, `www.reservaclara.com.br`, `localhost`,
   `127.0.0.1`, `foo.vercel.app` e um host desconhecido.
4. Para cada host relevante, verificar `/`, `/login`, `/dashboard`, status,
   `Location`, ausência de loop, query não convertida em redirect e presença de
   `X-Robots-Tag` em local/preview.
5. Confirmar que `/brand/*`, `/_next/static/*`, `/_next/image` e favicon não
   recebem redirect inesperado.
6. Confirmar no HTML/head: title, description, canonical público, Open Graph,
   locale, favicons, `noindex` app e ausência do template/links externos.
7. Validar landing em viewport mobile e desktop, zoom, teclado, foco,
   landmarks, headings, alt, contraste, leitura de CTA e ausência de overflow.
8. Reexecutar a matriz essencial de auth: login sem sessão, popup Google,
   usuário autenticado em `/login`, dashboard autenticado, dashboard anônimo,
   cancelamento/erro/retry quando possível, sem exigir redesign.

### Matriz mínima de topologia

| Host simulado | Caminho | Resultado esperado |
| --- | --- | --- |
| público | `/` | `200`, landing, indexável, canonical pública |
| público | `/login` | `307`, `Location` app `/login` |
| público | `/dashboard` | `307`, `Location` app `/dashboard` |
| app | `/` | `307`, `Location: /login` |
| app | `/login` | `200`, login existente |
| app | `/dashboard` | shell/redirect do guard existente |
| `www` | `/` | `308` para público `/` |
| localhost | `/` | `200`, landing same-origin, `noindex` |
| preview Vercel | `/login` | `200`, login same-origin, `noindex` |
| desconhecido | `/` | `404`, sem landing/app |

## Ordem das subtarefas

1. [003-01-estabelecer-fronteira-public-app.md](../tasks/003-public-landing-app-separation/003-01-estabelecer-fronteira-public-app.md) — registrar a decisão aplicada, criar a organização de route groups e implementar o único boundary de host.
2. [003-02-estruturar-landing-v1.md](../tasks/003-public-landing-app-separation/003-02-estruturar-landing-v1.md) — substituir o template por composição e copy oficiais, usando as foundations e assets da fase 002.
3. [003-03-integrar-cta-e-navegacao.md](../tasks/003-public-landing-app-separation/003-03-integrar-cta-e-navegacao.md) — fechar contratos de links same-origin e confirmar o handoff público→app sem hardcode em componentes.
4. [003-04-estabelecer-metadata-seo.md](../tasks/003-public-landing-app-separation/003-04-estabelecer-metadata-seo.md) — aplicar metadata pública, canonical, Open Graph, icons e `noindex` app/preview.
5. [003-05-validar-responsividade-acessibilidade.md](../tasks/003-public-landing-app-separation/003-05-validar-responsividade-acessibilidade.md) — provar composição mobile-first, contraste, foco, semântica e ausência de dados/claims indevidos.
6. [003-06-preservar-regressao-auth.md](../tasks/003-public-landing-app-separation/003-06-preservar-regressao-auth.md) — validar que login Google e dashboard guard mantêm o contrato da fase 001 em origem app/local.
7. [003-07-executar-checks-tecnicos.md](../tasks/003-public-landing-app-separation/003-07-executar-checks-tecnicos.md) — executar lint, typegen, typecheck e build na ordem do repositório.
8. [003-08-validar-topologia-local-preview.md](../tasks/003-public-landing-app-separation/003-08-validar-topologia-local-preview.md) — fechar a matriz HTTP/browser de hosts, redirects, assets, canonical e riscos para a fase 004.

## Premissas explícitas

- `003` foi informado no pedido e é preservado como ticker.
- Um único projeto Next.js é tecnicamente suficiente; não há razão concreta
  para monorepo, segundo app ou infraestrutura independente nesta fase.
- Os domínios canônicos foram decididos pelo pedido. A existência de DNS,
  certificado, projeto Vercel e authorized domains Firebase não é assumida como
  configurada; isso pertence à fase 004.
- Localhost e previews são ambientes de desenvolvimento/demonstração same-origin
  e não precisam imitar dois domínios reais para validar a aplicação.
- `*.vercel.app` será aceito como classe de preview somente para experiência e
  `noindex`; não é confiança de segurança nem autorização.
- O redirecionamento de `www` será preparado no código/política, mas sua
  ativação observável depende da infraestrutura da fase 004.
- A landing pode descrever a visão e as capacidades futuras do produto, mas não
  poderá representar dados, métricas ou funcionalidades financeiras como já
  disponíveis sem implementação correspondente.
- Nenhuma decisão humana adicional bloqueia o plano. A escolha Proxy + route
  groups + redirects, e a política local/preview, ficam registradas nesta spec
  e em `docs/decisions/003-separacao-host-publico-app.md`.
- Não criar nesta fase sitemap completo, analytics, consentimento, sessão
  server-side, autorização, Firebase Admin ou domínio financeiro.

## Referências consultadas

- `AGENTS.md` e regras relevantes do repositório; não havia arquivos em
  `.opencode/rules/`.
- `docs/specs/001-primeira-vertical-autenticacao.md` e tasks da fase 001.
- `docs/specs/002-brand-integration-design-system-foundations.md` e tasks da
  fase 002.
- `docs/brand/brand.md` e boards visuais em `docs/brand/`.
- Código atual em `src/app`, `src/components/auth`, `src/components/ui`,
  `src/lib/firebase`, `next.config.ts` e `package.json`.
- Next.js 16.3.5 Metadata API:
  https://nextjs.org/docs/app/api-reference/functions/generate-metadata
- Next.js Proxy convention:
  https://nextjs.org/docs/app/api-reference/file-conventions/proxy
- Next.js redirects:
  https://nextjs.org/docs/app/api-reference/config/next-config-js/redirects
- Next.js route groups:
  https://nextjs.org/docs/app/api-reference/file-conventions/route-groups
- Decision document da fase:
  `docs/decisions/003-separacao-host-publico-app.md`
