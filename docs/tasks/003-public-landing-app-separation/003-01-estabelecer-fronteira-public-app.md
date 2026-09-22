# 003-01 — Estabelecer fronteira public/app

- **Ticker:** `003`
- **Número:** `01`
- **Status:** `completed`

## Objetivo e resultado esperado

Criar a organização de rotas e o único ponto de host routing para que o mesmo
projeto Next.js distinga a superfície pública da aplicação sem alterar os paths
`/`, `/login` e `/dashboard` ou introduzir autorização server-side.

## Requisitos cobertos

- Domínios canônicos público/app e alias `www`.
- Localhost e previews Vercel same-origin.
- Classificação de host centralizada.
- Redirects fixos e ausência de rewrites.
- Não interceptação de assets, APIs e requests estáticos.
- Preservação dos contratos de auth da fase 001.

## Escopo incluído

- Criar `src/proxy.ts` conforme a convenção do Next.js 16.
- Normalizar hostname e classificar hosts público, app, `www`, loopback,
  `*.vercel.app` e desconhecido.
- Aplicar a matriz de status/redirect da spec para `/`, `/login` e
  `/dashboard`.
- Reorganizar páginas em `(marketing)` e `(app)` sem duplicar paths.
- Manter o root layout único e não importar Firebase no proxy.

## Escopo excluído

- Landing/copy final, metadata SEO detalhada e ajustes visuais.
- DNS, TLS, Cloudflare, configuração de domínios na Vercel ou Firebase
  Authorized Domains.
- Sessão server-side, Firebase Admin, autorização ou dados privados.
- Rewrites, alteração de `next.config.ts` como segundo router ou fallback
  client-side de hostname.

## Dependências

- Spec 003 e decision document de separação por host revisadas.
- Contratos atuais de `src/app/login/page.tsx`, `src/app/dashboard/page.tsx`,
  `GoogleSignIn` e `DashboardGate`.
- Documentação oficial do Proxy/route groups da linha Next.js 16, pois
  `node_modules/next/dist/docs/` não está disponível neste checkout.

## Arquivos e símbolos prováveis

- `src/proxy.ts`: `proxy`, normalização/classificação e `config.matcher`.
- `src/app/(marketing)/page.tsx`: destino temporário/estrutura da rota `/`.
- `src/app/(app)/login/page.tsx` e `src/app/(app)/dashboard/page.tsx`:
  movimentação das páginas existentes.
- `src/app/layout.tsx`: preservar root layout compartilhado.
- `next.config.ts`: confirmar que não recebe uma segunda política de host.

## Passos de implementação

1. Criar os route groups e mover as páginas existentes preservando imports e
   URLs; remover a possibilidade de duas páginas resolverem o mesmo path.
2. Implementar o normalizador de hostname com comparação exata para os hosts
   produtivos, loopback conhecido e sufixo de preview Vercel não vazio.
3. Implementar redirects fixos: público app-only para app, app raiz para
   `/login`, `www` para o público e 404 para host desconhecido.
4. Usar `307` na ponte público→app e `308` no alias `www`; não transportar um
   destino vindo de query string e não criar `returnTo`.
5. Configurar matcher somente para os documentos atuais e verificar que
   `/_next/static`, `/_next/image`, `/brand/*`, favicons e APIs seguem livres.
6. Adicionar `X-Robots-Tag` para local/preview somente se isso não misturar a
   tarefa com metadata de rota; a definição final fica na task 003-04.
7. Executar navegação direta e build estrutural antes de iniciar a landing.

## Testes e comandos de validação

- `npm run lint`
- `npm exec next typegen`
- `npx tsc --noEmit`
- `npm run build`
- Smoke local com `curl` usando headers `Host` para público, app, `www`,
  localhost, preview e host desconhecido.
- Conferir que `/login` e `/dashboard` continuam compilando e que os assets não
  recebem redirect.

## Definição de pronto

- Existe um único arquivo de host routing em `src/proxy.ts`.
- Route groups preservam `/`, `/login` e `/dashboard`.
- A matriz de hosts e status da spec pode ser observada por HTTP.
- Não há Firebase, auth ou autorização no proxy.
- Assets, APIs, RSC e arquivos estáticos não são bloqueados pelo matcher.
- Lint, typegen, typecheck e build passam, ou bloqueios concretos ficam
  registrados sem marcar a task como concluída.

## Riscos e cuidados

- Não usar `middleware.ts`: Next 16 usa `proxy.ts` para esta convenção.
- Um matcher amplo pode quebrar CSS, JavaScript, `next/image` ou logos; testar
  esses recursos explicitamente.
- Host routing não protege o dashboard; manter seu conteúdo não sensível.
- Não aceitar qualquer subdomínio `*.reservaclara.com.br` como produção.
- Não ativar DNS/TLS ou testar a existência de domínio como se fosse entregue
  nesta fase.

## Registro da implementação

### Status

`completed`

### Arquivos alterados

- `src/proxy.ts`: normalização/classificação centralizada de host, matriz de
  redirects e matcher restrito a documentos.
- `src/app/(marketing)/page.tsx`: movimentação temporária da página raiz para o
  grupo de marketing, sem alterar o conteúdo da landing nesta subtarefa.
- `src/app/(app)/login/page.tsx`: movimentação da página de login preservando
  imports e contrato de autenticação.
- `src/app/(app)/dashboard/page.tsx`: movimentação da página de dashboard
  preservando `DashboardGate`.
- Removidos os antigos `src/app/page.tsx`, `src/app/login/page.tsx` e
  `src/app/dashboard/page.tsx` para evitar rotas duplicadas.

### Decisões e desvios

- O proxy lê o header `Host`, com fallback para `request.nextUrl.hostname`,
  porque isso permite validar a topologia com Host headers e mantém a
  classificação em um único ponto.
- O redirect do app `/` usa uma URL absoluta same-origin. A implementação do
  Proxy do Next.js 16 rejeita `Location` relativo durante a serialização da
  resposta; o destino continua fixo em `/login`, sem query, `returnTo` ou host
  controlado pelo usuário.
- `X-Robots-Tag` foi incluído para localhost e previews conforme a matriz; a
  metadata de rota permanece para a task 003-04.
- A landing continua sendo o template temporário existente; copy, visual e
  metadata final permanecem nas subtarefas seguintes.

### Comandos executados

```bash
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
```

Também foi executado smoke HTTP com `npm start -- --hostname 127.0.0.1
--port 3100` e `curl` usando headers `Host`.

### Resultados e evidências

- Lint, geração de tipos, typecheck e build passaram nessa ordem.
- O build reconheceu `/`, `/login`, `/dashboard` e `ƒ Proxy (Middleware)`.
- Smoke HTTP observou: público `/` `200`; público `/login` e `/dashboard`
  `307` para `https://app.reservaclara.com.br`; app `/` `307` same-origin para
  `/login`; app `/login` `200`; `www` `308` para o público; localhost e
  `*.vercel.app` `200` same-origin com `X-Robots-Tag: noindex, nofollow`;
  host desconhecido `404`.
- Host em maiúsculas, ponto final, porta local e loopback IPv6 foram
  normalizados corretamente.
- Query `returnTo` não foi transportada no redirect público→app.
- Requests de `/brand/logo-horizontal.png`, `/_next/static/*`, `/_next/image`,
  favicon e `/api/*` não receberam redirect do proxy.
- `src/proxy.ts` não importa Firebase, auth ou componentes de autorização;
  `GoogleSignIn`, `DashboardGate`, root layout e `next.config.ts` foram
  preservados.

### Riscos residuais

- A separação por host é routing, não autorização; o dashboard continua sem
  fronteira server-side e sem dados sensíveis.
- DNS, TLS, Vercel, `www` efetivo e Firebase Authorized Domains continuam
  adiados para a fase 004.
- A validação foi feita com servidor local e Host headers simulados; não prova
  configuração real de infraestrutura nem o fluxo OAuth em domínio produtivo.
