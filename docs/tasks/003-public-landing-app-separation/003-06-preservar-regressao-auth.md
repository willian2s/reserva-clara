# 003-06 — Preservar regressão de autenticação

- **Ticker:** `003`
- **Número:** `06`
- **Status:** `completed`

## Objetivo e resultado esperado

Provar que a separação public/app e a movimentação para route groups não alteram
o fluxo Google da fase 001, os estados do popup, o guard client-side ou os
contratos de `/login` e `/dashboard`.

## Requisitos cobertos

- `/login` e `/dashboard` app-only por host, sem redesign arquitetural.
- Google popup e listener `onAuthStateChanged` preservados.
- Redirect autenticado para `/dashboard` e anônimo para `/login`.
- Dashboard continua sem dados sensíveis.
- Landing sem import ou inicialização Firebase.

## Escopo incluído

- Revisar imports após a movimentação de páginas para `(app)`.
- Validar login nominal, sessão já restaurada, dashboard autenticado e acesso
  anônimo.
- Validar cancelamento, popup bloqueado, erro recuperável e retry quando o
  ambiente permitir.
- Confirmar que a landing renderiza sem variáveis Firebase configuradas no
  browser/ambiente de demonstração.
- Registrar limitações de browser/WebView sem implementar fallback popup/redirect.

## Escopo excluído

- Alteração de Firebase Authentication, provider Google, sessão, persistência,
  logout ou autorização.
- Firebase Admin, cookies server-side, Firestore, dados financeiros ou roles.
- Redesign de UI além de regressão funcional necessária.
- Configuração de authorized domains produtivos, DNS ou deploy.

## Dependências

- 003-01 route groups concluídos.
- 003-03 CTA/paths concluídos.
- Ambiente Firebase local disponível apenas se a validação nominal for feita;
  segredos não devem ser lidos ou registrados.
- Matriz de auth da fase 001 e decisão `docs/decisions/001-*`.

## Arquivos e símbolos prováveis

- `src/app/(app)/login/page.tsx` e `dashboard/page.tsx`.
- `src/components/auth/google-sign-in.tsx`:
  `onAuthStateChanged`, `signInWithPopup`, `router.replace`.
- `src/components/auth/dashboard-gate.tsx`:
  listener e redirect anônimo.
- `src/lib/firebase/client.ts`: contrato `auth`, sem alteração esperada.
- `src/app/(marketing)/page.tsx`: ausência de imports Firebase/auth.

## Passos de implementação

1. Fazer inspeção estática da árvore de imports para confirmar que só as ilhas
   Client existentes importam Firebase.
2. Abrir `/login` na origem app/local e observar `checking` → `ready` sem sessão.
3. Executar login Google se ambiente autorizado, confirmando chegada em
   `/dashboard` e shell não sensível.
4. Reabrir `/login` autenticado, atualizar `/dashboard` autenticado e verificar
   que não há flash de conteúdo privado nem loop.
5. Abrir `/dashboard` anônimo e confirmar retorno para `/login`.
6. Exercitar cancelamento, popup bloqueado, erro e retry quando possível;
   registrar bloqueio se sessão existente impedir o cenário, sem apagar a
   evidência.
7. Abrir `/` e confirmar que não Firebase é inicializado/importado para renderizar
   a landing.

## Testes e comandos de validação

- `npm run lint`
- `npm exec next typegen`
- `npx tsc --noEmit`
- `npm run build`
- Matriz manual 001 em browser disponível: sem sessão, sessão existente,
  login nominal, cancelamento, popup bloqueado, erro/retry e acessibilidade.
- Smoke HTTP da origem app com `/login` e `/dashboard`.

## Definição de pronto

- Fluxo Google e guard observados com os mesmos paths e mensagens essenciais.
- Nenhuma lógica de auth foi movida para proxy, root layout ou landing.
- Landing responde sem Firebase e dashboard segue não sensível.
- Limitações de popup/mobile/WebView e cenários não reproduzidos estão
  registradas honestamente.

## Riscos e cuidados

- O proxy não é uma substituição para autorização; não aprovar dados privados.
- Não registrar env, tokens, uid, credenciais ou identidade da conta de teste.
- Não reabrir decisão popup vs redirect nesta fase sem bloqueio material.
- Mudança de origem no futuro pode exigir Firebase Authorized Domains, que fica
  para fase 004.

## Registro de execução

- **Status:** `completed`
- **Arquivos alterados:**
  - `docs/tasks/003-public-landing-app-separation/003-06-preservar-regressao-auth.md`
  - `docs/tasks/003-public-landing-app-separation/003-00-overview.md`
- **Decisões e desvios:** nenhuma alteração de código foi necessária. A
  regressão foi validada por inspeção estática, gates técnicos e smoke HTTP;
  nenhum fallback popup/redirect foi adicionado. A conclusão ficou bloqueada
  inicialmente porque a matriz manual Google não estava disponível; após teste
  manual, os cenários essenciais foram considerados aprovados.
- **Comandos executados e resultados:**
  - `npm run lint` — passou.
  - `npm exec next typegen` — passou; tipos de rotas gerados.
  - `npx tsc --noEmit` — passou.
  - `npm run build` — passou; Next.js 16.3.5 compilou `/`, `/login` e
    `/dashboard` como rotas estáticas e `src/proxy.ts` como Proxy.
  - `npm start -- --hostname 127.0.0.1` com smoke HTTP — passou: `/login` e
    `/dashboard` retornaram `200` em localhost com `X-Robots-Tag`; `/login` no
    host público retornou `307` para `https://app.reservaclara.com.br/login`;
    `/` no host app retornou `307` para `/login`; landing local retornou `200`
    sem referências Firebase no HTML.
- **Evidências:** somente `src/components/auth/google-sign-in.tsx` e
  `src/components/auth/dashboard-gate.tsx` importam Firebase; `GoogleSignIn`
  mantém `onAuthStateChanged`, `signInWithPopup`, estados de checking/ready,
  cancelamento/erro e `router.replace("/dashboard")`; `DashboardGate` mantém o
  listener, shell não sensível e `router.replace("/login")`; páginas e landing
  preservam route groups e contratos `/login`/`/dashboard`.
- **Evidência manual adicional:** ao abrir `/dashboard` sem sessão, o estado de
  loading foi exibido e o guard conduziu para `/login`; com sessão existente, o
  dashboard liberou o shell após a restauração. Ao fechar o popup durante o
  login, a mensagem `Login cancelado. Você pode tentar novamente.` foi exibida.
- **Limitações:** login nominal, popup bloqueado, erro/retry e acessibilidade
  completa de browser não foram exaustivamente reproduzidos. O teste com
  configuração do site para bloquear popup ainda abriu o popup, portanto o
  cenário de bloqueio não foi reproduzido. Authorized Domains Firebase e
  limitações de popup em WebView continuam dependentes da fase 004/decisão 001.
- **Riscos residuais:** `DashboardGate` continua guard somente client-side e não
  é autorização; popup pode falhar em browser bloqueado, WebView ou domínio não
  autorizado.
