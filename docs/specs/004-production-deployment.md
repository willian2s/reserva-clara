# 004 — Production Deployment

## Ticker

`004`

## Status

`completed`

## Contexto

As fases 001 (Authentication), 002 (Brand Integration & Design System
Foundations) e 003 (Public Landing & App Separation) estão concluídas. A fase
003 preparou a topologia no código, mas não ativou infraestrutura real.

Inspeção da `main` no início deste planejamento:

- branch `main` alinhada a `origin/main`, working tree limpo;
- HEAD `bddcfcd` (`docs(sdd): concluir topologia da fase 003`);
- Next.js `16.3.5`, React `19.2.8`, TypeScript strict, App Router, Tailwind 4,
  Firebase Web `12.19.0`;
- não existe `node_modules/next/dist/docs/` neste checkout, portanto a
  documentação local indicada em `AGENTS.md` não está disponível sem instalar
  dependências. Nenhuma dependência será instalada nesta execução de
  planejamento;
- não existe `vercel.json`, `firebase.json`, `.firebaserc`, configuração
  Wrangler/Cloudflare, workflow CI ou configuração de deploy versionada;
- `README.md` ainda contém texto genérico do template Create Next App e não é
  evidência de configuração efetiva.

A topologia implementada é:

- `reservaclara.com.br` → landing pública;
- `www.reservaclara.com.br` → redirect `308` para a origem pública;
- `app.reservaclara.com.br` → aplicação;
- `/login` e `/dashboard` no host público → redirect `307` para o host app;
- `/` no host app → redirect same-origin para `/login`;
- localhost e `*.vercel.app` → same-origin, `X-Robots-Tag: noindex, nofollow`;
- host desconhecido → `404` para documentos.

Essa política mora em `src/proxy.ts`. Route groups `(marketing)` e `(app)` só
organizam árvore e metadata. Firebase continua browser-only; `DashboardGate` é
guard de UX, não autorização. O dashboard contém apenas shell não sensível.

## Objetivo

Publicar o único projeto Next.js em Vercel, conectar os três domínios oficiais
via Cloudflare e validar, em HTTPS real, a fronteira público/app e o fluxo:

```text
https://reservaclara.com.br/
  → landing
  → Entrar
  → https://app.reservaclara.com.br/login
  → Google Sign-In
  → /dashboard
```

A fase deve transformar a topologia simulada em 003 numa topologia real,
verificável e reversível, sem introduzir novo app, serviço, sessão server-side,
Firebase Admin ou domínio financeiro.

## Requisitos

### Deploy e hosting

1. Conectar o repositório existente a um único projeto Vercel.
2. Usar `main` como branch de produção, salvo evidência explícita de que a
   configuração atual do repositório exige outra branch.
3. Preferir framework detection, install command, build command e output
   defaults da Vercel. Registrar valores efetivos sem criar configuração apenas
   para repetir defaults.
4. Não criar `vercel.json`, segundo projeto, segundo repositório, Firebase
   Hosting, VPS, container, Kubernetes, reverse proxy próprio ou CI/CD custom
   quando o deploy Git padrão for suficiente.
5. Confirmar deploy automático da branch de produção e previews de branches/PRs.
6. Confirmar como obter build logs, runtime logs, deployment anterior e rollback
   pela interface/capacidade padrão da Vercel.

### Domínios, DNS e TLS

7. Associar `reservaclara.com.br`, `www.reservaclara.com.br` e
   `app.reservaclara.com.br` ao mesmo projeto Vercel.
8. Obter da Vercel os valores atuais exigidos para apex e subdomínios. Não
   hardcodear IP, CNAME, TXT, CAA ou target que possa variar por projeto.
9. Configurar somente os registros necessários na zona Cloudflare, preservando
   MX, TXT, CAA e registros não relacionados.
10. Verificar durante a execução se o Cloudflare deve ficar DNS only ou proxied,
    conforme documentação oficial atual da Vercel/Cloudflare e comportamento
    observado. A recomendação inicial é DNS only para reduzir camadas, mas isso
    é checkpoint operacional, não fato assumido.
11. Evitar Redirect Rules, Workers, Page Rules, cache customizado ou outra
    política Cloudflare que duplique `src/proxy.ts`.
12. Validar propagação DNS, domínio verificado, certificado válido, HTTPS e
    renovação/estado exibido pela Vercel.

### Fronteira de host

13. Preservar `src/proxy.ts` como único dono de classificação de host,
    redirects de documento e `X-Robots-Tag` de local/preview.
14. Responsabilidade final:

    - **Cloudflare:** DNS autoritativo e registros;
    - **Vercel:** deploy, CDN, associação de domínios, TLS e logs padrão;
    - **`src/proxy.ts`:** `www` → público, público app-only → app, app `/` →
      `/login`, host allowlist e robots de local/preview.

15. Não mover redirect de aplicação para Cloudflare ou Vercel. Se a plataforma
    adicionar canonicalização automática que conflite com a matriz 003, parar,
    registrar o conflito e revisar a decisão antes de alterar código ou serviço.
16. Não tratar host routing como autorização. Não adicionar dados sensíveis ao
    dashboard nem alterar `DashboardGate` nesta fase.

### Environment variables

17. Configurar por ambiente Vercel as variáveis previstas em `.env.example`, sem
    copiar valores para código, spec, task, log ou commit:

    - `NEXT_PUBLIC_FIREBASE_API_KEY`;
    - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`;
    - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`;
    - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`;
    - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`;
    - `NEXT_PUBLIC_FIREBASE_APP_ID`;
    - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`, quando fornecida pela configuração
      oficial da aplicação Web Firebase; não inventar valor.

18. Produção deve usar valores da aplicação Web Firebase correta. Preview só
    recebe configuração pública quando isso for necessário para renderizar/testar
    a aplicação e houver autorização para usar o projeto; configurar variáveis
    não autoriza automaticamente o hostname no Firebase.
19. Development local continua usando `.env.local` ignorado. Nenhum conteúdo de
    `.env.local` deve ser solicitado, registrado ou versionado.
20. Não introduzir BRAPI, token, segredo privado ou variável não necessária.
21. Após qualquer alteração de environment variables, criar novo deployment;
    não considerar deployment anterior atualizado.

### Firebase Authentication

22. Confirmar provider Google habilitado no projeto Firebase usado pela fase 001.
23. Confirmar em documentação oficial atual e no console quais Authorized
    Domains são necessários para `signInWithPopup` na origem app.
24. Como baseline, validar `app.reservaclara.com.br` e preservar `localhost`;
    só adicionar `reservaclara.com.br` ou `www.reservaclara.com.br` se o fluxo
    real ou a documentação provar necessidade.
25. Não autorizar wildcard `*.vercel.app`. Para testar OAuth em preview, usar
    hostname estável e explicitamente autorizado, ou registrar bloqueio e manter
    preview sem auth nominal na V1.
26. Confirmar se `authDomain` existente pode permanecer no domínio Firebase
    padrão e se Google Cloud OAuth exige configuração complementar. Não mudar
    isso por inferência.
27. Validar popup, cancelamento, popup bloqueado, erro de domínio não autorizado,
    retry, restauração de sessão e saída para `/dashboard` no host app real.
28. Não adicionar `signInWithRedirect`, fallback híbrido, Firebase Admin, cookie
    de sessão, AuthProvider global ou autorização server-side.

### Produção, previews e indexação

29. Produção deve usar os três domínios oficiais, HTTPS, Firebase configurado,
    redirects reais e certificado válido.
30. Preview deve permanecer same-origin, sem redirect obrigatório para produção,
    útil para landing, metadata, assets e revisão de mudanças, com `noindex`.
31. Não considerar preview autenticado por padrão. Se login em preview for
    requisito adicional, parar antes de criar allowlist ampla ou Firebase
    separado e registrar decisão própria.
32. Preservar canonical pública absoluta
    `https://reservaclara.com.br/`; app não recebe canonical pública.
33. Preservar `noindex, nofollow` de `/login` e `/dashboard`, e
    `X-Robots-Tag: noindex, nofollow` em local/preview.

### Segurança e observabilidade mínima

34. Confirmar ausência de secrets versionados, `.env.local` ignorado, somente
    variáveis necessárias no Vercel e nenhum token em documentação/log.
35. Tratar config pública Firebase como configuração exposta ao browser, sem
    transformá-la em segredo nem copiá-la desnecessariamente para documentação.
36. Confirmar ausência de BRAPI, Firebase Admin, Firestore, dados patrimoniais e
    qualquer mudança que faça host routing parecer autorização.
37. Usar somente build logs, runtime logs, deployment history e rollback padrão
    da Vercel. Não introduzir observabilidade externa.

## Fora do escopo

- Firestore, regras Firestore, Storage, modelo financeiro, carteiras, ativos,
  transações, posições, alocação, snapshots, metas, aportes e BRAPI;
- QuoteService, dashboard financeiro ou dados sensíveis;
- Firebase Admin, sessão server-side, cookies `HttpOnly`, autorização real,
  App Check, WAF, rate limiting ou CSP amplo;
- redesign de auth, troca de popup por redirect, logout ou provider adicional;
- segundo app, monorepo, repositório, projeto Firebase ou infraestrutura própria;
- Firebase Hosting, Workers, reverse proxy, Kubernetes ou observabilidade
  externa;
- analytics, consentimento/cookies, marketing adicional, pricing e mudanças
  visuais na landing;
- alterações em `src/`, `public/`, `package.json`, lockfile, `.env.local` ou
  `next.config.ts` durante esta execução de planejamento;
- criação de `vercel.json`, instalação de dependências, deploy ou mudança real
  em Vercel, Cloudflare, DNS e Firebase nesta execução.

## Comportamento atual encontrado

### Código e contratos

- `src/proxy.ts` normaliza hostname, remove porta/ponto final, aceita hosts
  oficiais, loopback e qualquer subdomínio não vazio com sufixo `.vercel.app`,
  retorna `404` para host desconhecido e aplica redirects/robots conforme a
  matriz 003.
- Matcher do proxy cobre somente `/`, `/login/:path*` e
  `/dashboard/:path*`; assets, `/_next/*`, favicons e APIs não são interceptados.
- `src/app/(marketing)/page.tsx` é Server Component e não importa Firebase;
  seus CTAs usam `/login` relativo e assets usam `/brand/...`.
- `src/app/(marketing)/layout.tsx` declara canonical e Open Graph da origem
  pública `https://reservaclara.com.br/`.
- `src/app/(app)/layout.tsx` declara `robots: noindex, nofollow` para login e
  dashboard.
- `src/app/layout.tsx` mantém `lang="pt-BR"`, Inter, favicons oficiais e root
  layout compartilhado.
- `src/lib/firebase/client.ts` inicializa Firebase Web usando as sete variáveis
  `NEXT_PUBLIC_FIREBASE_*` e exporta `auth`; não existe código de servidor.
- `GoogleSignIn` usa `onAuthStateChanged`, `GoogleAuthProvider`,
  `signInWithPopup` e `router.replace("/dashboard")`.
- `DashboardGate` usa `onAuthStateChanged`, redireciona anônimo com
  `router.replace("/login")` e mostra shell não sensível.
- `next.config.ts` contém somente configuração vazia tipada; não há redirects,
  headers ou domínio.

### Infraestrutura e validação já realizada

- `.gitignore` ignora `.env*` e preserva somente `.env.example`; `.vercel`,
  `.next`, build e certificados PEM também são ignorados.
- `package.json` tem scripts `lint`, `build`, `start` e `dev`; não há test runner,
  formatter, CI ou pre-commit.
- Fase 003 passou lint, typegen, typecheck, build e smoke HTTP com Host
  simulado. Isso não prova DNS, Vercel, Cloudflare, TLS ou OAuth em domínio real.
- 003 registrou limitações de browser visual, popup bloqueado, erro/retry e
  WebView. Esses pontos devem ser reavaliados somente dentro do aceite de 004.

## Abordagem escolhida

### Plano de rollout

1. Conferir branch, working tree, commit, docs oficiais atuais e gates locais;
   criar snapshot somente de informações não secretas necessárias ao rollback.
2. Conectar repositório a um projeto Vercel único, confirmar framework Next.js,
   branch `main`, defaults de instalação/build/output, deploy automático,
   previews, logs e rollback.
3. Configurar environment variables por ambiente sem registrar valores; criar
   novo deployment e validá-lo no domínio Vercel gerado.
4. Validar primeiro landing, login, dashboard, noindex, assets e logs no
   domínio Vercel, sem mexer em DNS público.
5. Confirmar oficialmente a política de Firebase e provider Google; preparar
   Authorized Domains sem ampliar previews dinamicamente.
6. Adicionar os três domínios customizados ao mesmo projeto Vercel e capturar os
   valores de DNS/TLS exibidos para esse projeto.
7. Alterar Cloudflare somente com os registros efetivos fornecidos pela Vercel,
   preservando registros existentes e sem redirect adicional.
8. Aguardar propagação, verificar domínio/TLS e validar HTTP real antes de
   testar OAuth.
9. Executar matriz real de redirects, landing, app, metadata, robots, assets,
   HTTPS, certificado e ausência de loops.
10. Executar Google Sign-In com conta de teste autorizada, restauração de sessão,
    dashboard anônimo e cenários de erro/retry; não registrar identidade ou
    tokens.
11. Validar preview disponível, segurança mínima, logs, procedimento de
    rollback e evidências. Só então marcar tasks como concluídas.

### Gate de intervenção humana

O agente pode preparar comandos, ler estado público, executar gates locais e
validar HTTP. Login no Git/Vercel, autorização do projeto, alteração de
environment variables, DNS Cloudflare, Firebase Console, consentimento OAuth e
teste com conta Google exigem usuário com acesso e checkpoint explícito. Uma
task com ação externa pendente permanece `pending` ou `blocked`; não recebe
`[x]` por intenção.

### Confirmações oficiais obrigatórias

Durante a execução, registrar URL, data e conclusão factual da documentação
oficial atual, sem congelar targets no plano:

- Vercel: custom domains, apex/subdomínios, valores DNS por projeto, SSL,
  environments, Git deploys, branch de produção, previews, redirects, logs e
  rollback;
- Firebase: Google Web Sign-In, Authorized Domains, `authDomain`, popup,
  browsers e requisitos de Google OAuth;
- Cloudflare: criação de registros, proxy status, TTL, apex/CNAME flattening,
  TLS e efeitos de redirects/cache;
- Next.js: documentação instalada em `node_modules/next/dist/docs/`, se presente
  no ambiente de execução. Se continuar ausente, não alterar Proxy com base em
  memória; usar contrato já validado em 003 e registrar a limitação.

Referências de partida, a conferir novamente durante execução:

- [Next.js Proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
- [Next.js Metadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Vercel domains](https://vercel.com/docs/domains/working-with-domains)
- [Vercel custom domain](https://vercel.com/docs/domains/set-up-custom-domain)
- [Vercel environments](https://vercel.com/docs/deployments/environments)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)
- [Vercel runtime logs](https://vercel.com/docs/logs/runtime)
- [Firebase Google Sign-In Web](https://firebase.google.com/docs/auth/web/google-signin)
- [Firebase redirect best practices](https://firebase.google.com/docs/auth/web/redirect-best-practices)
- [Cloudflare DNS records](https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/)
- [Cloudflare SSL modes](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/)

No início do planejamento não havia decision document novo: Vercel + Cloudflare
e Firebase eram decisões de infraestrutura fornecidas pelo pedido, e o modo
efetivo de proxy/TLS e a allowlist de previews dependiam de confirmação oficial
e do estado real das contas. A execução confirmou a configuração efetiva e
registrou a decisão operacional em
`docs/decisions/004-cloudflare-proxied-vercel.md`; a decisão
`docs/decisions/003-separacao-host-publico-app.md` continua sendo autoridade
para o contrato do `src/proxy.ts`.

## Alternativas descartadas

| Alternativa | Motivo |
| --- | --- |
| Firebase Hosting | Hosting decidido como Vercel; adicionar outro edge duplica deploy e TLS. |
| Segundo projeto Next.js ou monorepo | Não há incompatibilidade concreta; um projeto já atende público e app. |
| Vercel `vercel.json` | Não há necessidade identificada; redirects pertencem ao Proxy e defaults devem permanecer defaults. |
| Redirects Cloudflare/Vercel concorrentes | Duplicam `www` e ponte público→app, dificultam loops, cache e rollback. |
| Cloudflare como reverse proxy sem prova | Pode alterar TLS, cache, headers e visibilidade do `Host`; só considerar se documentação/necessidade concreta exigir. |
| Autorizar todo `*.vercel.app` no Firebase | Wildcard amplia confiança e não é necessário para preview de landing/routing. |
| Firebase Admin ou sessão server-side | Fora do escopo; dashboard ainda não tem dados sensíveis. |
| `signInWithRedirect` ou fallback híbrido | Reabre decisão 001 sem bloqueio concreto do popup no escopo V1. |
| BRAPI, observabilidade externa ou hardening amplo | Não são necessários para publicar e validar esta vertical. |

## Arquivos, módulos e contratos afetados

### Inspeção/reutilização sem alteração esperada

- `src/proxy.ts`: contrato de host, redirects e matcher da fase 003;
- `src/app/(marketing)/page.tsx` e layout de marketing: landing, canonical e
  Open Graph;
- `src/app/(app)/layout.tsx`, login e dashboard: app metadata e rotas;
- `src/app/layout.tsx`: idioma, Inter e ícones;
- `src/lib/firebase/client.ts`, `src/components/auth/google-sign-in.tsx` e
  `src/components/auth/dashboard-gate.tsx`: auth browser-only;
- `.env.example`: nomes das variáveis públicas;
- `.gitignore`: exclusão de env local e artefatos;
- `next.config.ts`: deve permanecer sem segundo dono de redirects;
- `package.json`/`package-lock.json`: comandos e versão efetiva.

### Configuração externa futura

- projeto Vercel conectado ao repositório;
- environment variables Vercel por Production, Preview e Development conforme
  necessidade;
- domínios customizados e estado de certificado Vercel;
- registros Cloudflare e estado de proxy/TTL;
- Firebase provider Google e Authorized Domains.

### Contratos de URL e resposta

| Origem | Caminho | Resultado esperado |
| --- | --- | --- |
| público | `/` | `200`, landing, canonical pública |
| público | `/login` | `307` para `https://app.reservaclara.com.br/login` |
| público | `/dashboard` | `307` para `https://app.reservaclara.com.br/dashboard` |
| `www` | qualquer documento coberto | `308` para mesmo caminho no público |
| app | `/` | `307` same-origin para `/login` |
| app | `/login` | `200`, login e popup Google |
| app | `/dashboard` | shell/redirect client-side conforme sessão |
| preview | `/`, `/login`, `/dashboard` | same-origin e `noindex` |
| host desconhecido | documento | `404` |

Redirect HTTP → HTTPS e emissão de certificado pertencem à camada de hosting;
não devem ser simulados em `src/proxy.ts`. Se Cloudflare proxied for validado,
confirmar preservação do host e cadeia TLS antes de aceitar o comportamento.

## Riscos e mitigação

| Risco | Mitigação |
| --- | --- |
| Registro DNS aponta para target errado ou valor obsoleto | Adicionar domínio na Vercel primeiro; copiar valores exibidos naquele projeto; validar `dig` e status de domínio antes de trocar tráfego. |
| Mudança pública interrompe serviço existente | Snapshot de DNS/MX/TXT/CAA, TTL observado, alteração mínima e rollback pré-planejado. |
| Proxy Cloudflare conflita com Vercel | Começar pela opção validada em docs; testar `Host`, TLS, redirects, RSC, assets e logs antes de aceitar. |
| Redirect duplicado ou loop `www`/público/app | Manter Vercel/Cloudflare sem regras concorrentes; testar cadeia com limite baixo e comparar `Location`. |
| Certificado ausente ou inválido | Não validar OAuth nem aceite; aguardar/diagnosticar domínio Vercel e confirmar certificado por browser/CLI oficial. |
| Variáveis ausentes ou env errado | Conferir somente nomes/escopos, nunca valores em texto; redeploy após mudança e testar domínio Vercel antes de DNS. |
| Firebase `auth/unauthorized-domain` | Confirmar Authorized Domains do host app exato; não adicionar wildcard; preservar mensagem sanitizada e registrar código apenas em evidência privada sem segredo. |
| Preview cria falsa sensação de auth | Declarar preview same-origin/noindex, separar smoke de OAuth e autorizar somente hostname exato quando necessário. |
| Popup bloqueado ou WebView | Repetir matriz 001 em browsers suportados; registrar limitação; não trocar fluxo sem reabrir decisão 001. |
| Firebase config exposta em logs/docs | Tratar como config pública de browser, mas nunca copiar valores; sanitizar evidências e console. |
| Host routing confundido com autorização | Dashboard segue não sensível; não adicionar Firestore, tokens server-side ou claims. |
| `308` cacheia estado incorreto | Configurar/validar antes do alias; rollback inclui DNS e deployment, lembrando cache/propagação. |
| Build local passa e deploy falha | Rodar gates antes e observar build/runtime logs Vercel; não mascarar falha com config customizada. |
| Plataforma muda comportamento | Reconsultar docs oficiais durante execução e registrar data/URL; parar se contrato 003 perder validade. |

## Estratégia de testes e validação

Não há test runner. A prova combina gates locais, inspeção de configuração,
HTTP real, DNS/TLS, browser e intervenção humana. Toda evidência deve distinguir
`configurado`, `deployment publicado`, `respondeu` e `fluxo OAuth realmente
validado`.

### Gates locais

Executar nesta ordem, conforme `AGENTS.md`:

```bash
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
```

Não alterar dependências para mascarar falha. `build` não prova DNS, TLS,
redirect, popup ou autorização.

### Matriz HTTP/DNS/TLS de produção

| Caso | Verificação automatizável | Aceite |
| --- | --- | --- |
| `https://reservaclara.com.br/` | GET/HEAD, status, body/head | `200`, landing Reserva Clara, canonical absoluta pública, assets 200 |
| `https://www.reservaclara.com.br/` | request sem seguir redirect e cadeia limitada | `308` para público; sem loop |
| `https://app.reservaclara.com.br/` | request sem seguir redirect | `307` same-origin para `/login` |
| público `/login` | `Location` sem seguir redirect | `307` para app `/login` |
| público `/dashboard` | `Location` sem seguir redirect | `307` para app `/dashboard` |
| `www` `/login` e `/dashboard` | cadeia limitada | `www → público → app`, sem destino arbitrário |
| app `/login` | HTML, metadata, assets | `200`, login, `noindex`, sem canonical pública |
| app `/dashboard` | HTML e browser anônimo | shell/guard esperado, sem dados sensíveis |
| HTTP nos três hosts | request HTTP e cadeia | HTTPS válido, sem loop HTTP/HTTPS |
| DNS apex/`www`/`app` | `dig`/inspeção Vercel/Cloudflare | registros correspondem aos valores efetivos fornecidos pela Vercel |
| certificado | browser/CLI oficial | certificado válido para cada hostname, sem aviso |
| assets/favicon/RSC | GET em `/brand/*`, `/_next/static/*`, `/_next/image`, favicon e RSC | `200`/resposta esperada, sem redirect de host indevido |
| robots/canonical | head e headers | landing pública indexável/canônica; app e preview noindex; sem canonical pública no app |
| host desconhecido | request isolado, se testável | `404` para documento; não expor landing |

### Validação browser/humana

Requer interação humana e conta Google de teste autorizada:

- landing → Entrar termina em `https://app.reservaclara.com.br/login`;
- popup Google conclui e chega a `/dashboard`;
- refresh e reabertura restauram sessão;
- `/login` autenticado vai para `/dashboard`;
- `/dashboard` anônimo vai para `/login`;
- cancelamento, popup bloqueado, erro de domínio/rede e retry exibem estados
  previstos sem segredo, stack trace ou token;
- console, cookies, origem e URL não mostram configuração privada;
- ao menos desktop e mobile browser disponível; WebView fica explicitamente
  não suportado se não houver requisito.

### Preview

Quando existir deployment de branch/PR:

- abrir URL `.vercel.app` sem redirect para domínio produtivo;
- validar landing, `/login`, `/dashboard`, assets, metadata e
  `X-Robots-Tag`/robots `noindex`;
- testar auth somente se hostname estiver explicitamente autorizado e sem
  ampliar wildcard; caso contrário registrar `OAuth preview: não validado por
  política`, não tratar como falha de produção.

### Segurança e logs

- `git status`, `git diff --check` e inspeção de arquivos confirmam ausência de
  env local, tokens, secrets e artefatos versionados;
- Vercel build logs confirmam commit, branch, comandos e sucesso;
- Vercel runtime logs filtrados por host/rota registram falhas sem coletar
  credenciais, tokens, UID ou dados da conta;
- nenhuma task é concluída somente porque uma variável ou domínio aparece como
  configurado no painel.

## Rollback

Preparar rollback antes de DNS:

1. Registrar deployment Vercel saudável anterior e o deployment candidato,
   commit, branch e horário, sem registrar secrets.
2. Exportar/snapshotar somente estado DNS necessário: registros afetados,
   TTL, status de proxy e registros que não podem ser removidos.
3. Se build/runtime quebrar, apontar domínios ao último deployment saudável ou
   usar rollback nativo Vercel, conforme documentação atual, antes de investigar.
4. Se domínio/TLS/DNS quebrar, restaurar registros anteriores no Cloudflare e
   manter aliases Vercel até o tráfego estabilizar; considerar propagação/cache.
5. Se `www` gerar loop, retirar qualquer regra externa concorrente e restaurar
   DNS/assignment anterior; não alterar o `308` do Proxy sem evidência e revisão.
6. Se Firebase falhar, remover somente Authorized Domain incorreto ou corrigir
   configuração no console; não remover usuários como rollback.
7. Após rollback, repetir smoke de disponibilidade, HTTPS e assets. Registrar
   causa, evidência, horário, camada responsável e próxima ação.

Rollback não desfaz usuários criados no Firebase, cache DNS, certificados já
emitidos ou links de preview. Esses efeitos devem ser considerados antes do
checkpoint de OAuth.

## Critérios de aceite

- Projeto único conectado ao repositório e publicado em Vercel.
- Production deployment saudável, com logs consultáveis e rollback conhecido.
- `https://reservaclara.com.br/` entrega landing pública por HTTPS.
- `www.reservaclara.com.br` canonicaliza para o domínio raiz sem loop.
- `app.reservaclara.com.br` entrega aplicação por HTTPS.
- Ponte público/app da fase 003 funciona em infraestrutura real, com `307`/`308`
  e destinos fixos esperados.
- As sete variáveis previstas são tratadas por ambiente sem secrets versionados;
  `MEASUREMENT_ID` segue disponibilidade oficial do app Firebase.
- Provider Google está habilitado e Authorized Domains contém somente origens
  justificadas; Google Sign-In funciona no app produtivo.
- Usuário autenticado chega ao dashboard e restaura sessão; anônimo não vê o
  shell após o guard e retorna a `/login`.
- Preview continua same-origin, útil para revisão e `noindex`; OAuth de preview
  só é declarado se hostname exato tiver sido autorizado e testado.
- Canonical, robots, assets, favicon, landing e metadata estão corretos.
- Não há loop de redirect, open redirect, domínio desconhecido servindo app,
  asset bloqueado ou duplicação de responsabilidade.
- `npm run lint`, `npm exec next typegen`, `npx tsc --noEmit` e `npm run build`
  passam na ordem correta.
- Evidências distinguem configuração de painel, deployment, disponibilidade,
  validação HTTP e validação manual de OAuth.
- Nenhuma mudança fora dos serviços/documentação autorizados foi introduzida;
  não foram adicionados BRAPI, dados financeiros, Admin, sessão server-side ou
  hardening fora de escopo.

## Ordem das subtarefas

1. [004-01-preparar-baseline-oficial.md](../tasks/004-production-deployment/004-01-preparar-baseline-oficial.md) — confirmar estado, gates e documentação oficial atual.
2. [004-02-conectar-vercel-e-publicar-preview.md](../tasks/004-production-deployment/004-02-conectar-vercel-e-publicar-preview.md) — conectar repositório, ambientes de deploy e primeiro deployment Vercel.
3. [004-03-configurar-environment-variables.md](../tasks/004-production-deployment/004-03-configurar-environment-variables.md) — configurar variáveis Firebase por ambiente e redeploy seguro.
4. [004-04-configurar-dominios-dns-tls.md](../tasks/004-production-deployment/004-04-configurar-dominios-dns-tls.md) — associar domínios Vercel, alterar DNS Cloudflare e validar TLS.
5. [004-05-configurar-firebase-auth-producao.md](../tasks/004-production-deployment/004-05-configurar-firebase-auth-producao.md) — confirmar Google provider e Authorized Domains mínimos.
6. [004-06-validar-topologia-real.md](../tasks/004-production-deployment/004-06-validar-topologia-real.md) — provar HTTP, redirects, metadata, robots, assets e logs em produção.
7. [004-07-validar-google-sign-in-producao.md](../tasks/004-production-deployment/004-07-validar-google-sign-in-producao.md) — provar popup, sessão, anônimo e erros no domínio app.
8. [004-08-validar-previews-e-seguranca.md](../tasks/004-production-deployment/004-08-validar-previews-e-seguranca.md) — validar previews, noindex, escopo de Firebase e segurança mínima.
9. [004-09-fechar-gates-e-rollback.md](../tasks/004-production-deployment/004-09-fechar-gates-e-rollback.md) — executar gates finais, consolidar evidências e fechar rollback.

## Premissas explícitas e decisões pendentes no início do planejamento

As premissas abaixo registram o estado anterior à execução. O estado final e as
evidências estão nas subtasks `004-01` a `004-09` e no overview da fase.

- `004` foi informado explicitamente e é preservado como ticker.
- O domínio `reservaclara.com.br` é controlado por Cloudflare, mas nenhum
  registro atual, TTL, proxy status, MX, CAA ou DNSSEC foi assumido.
- Vercel é o hosting decidido pelo pedido; o projeto e o vínculo ao repositório
  ainda não existem ou não foram confirmados neste checkout.
- `main` é a branch atual e deve ser produção, salvo evidência contrária na
  conta Vercel/Git.
- Os valores de DNS e variáveis reais só podem vir das plataformas/conta
  autorizadas durante execução. Nunca entram nesta documentação.
- A recomendação inicial é Cloudflare DNS only e TLS/HTTP na Vercel, mas a
  escolha efetiva depende de confirmação oficial atual e teste de preservação de
  host. Se mudar trust boundary ou redirects, criar decision document antes.
- Authorized Domains produtivos ainda não foram confirmados. `app` é baseline;
  público e `www` dependem de prova técnica. Preview dinâmico não será
  autorizado em wildcard.
- A configuração Firebase pública não é segredo, mas não deve ser copiada para
  docs ou logs. Nenhum token BRAPI existe nesta fase.
- Preview precisa continuar útil sem depender dos domínios produtivos; OAuth em
  hostname efêmero é decisão pendente, não critério automático de falha.
- Nenhum browser ou conta Google foi usado nesta execução de planejamento.
- Não há decision document novo nesta etapa porque não se aceitou ainda uma
  política operacional de edge/TLS diferente do contrato 003; qualquer mudança
  concreta deve gerar registro independente antes de aplicação.
