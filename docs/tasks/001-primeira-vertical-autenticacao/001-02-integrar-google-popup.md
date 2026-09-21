# 001-02 — Integrar Google popup

- **Ticker:** `001`
- **Número:** `02`
- **Status:** `completed`

## Objetivo e resultado esperado

Conectar CTA da tela de login ao Firebase Authentication existente, cobrindo
restauração de auth, Google Sign-In via popup, loading, cancelamento, erro,
retry e navegação para `/dashboard`.

## Requisitos cobertos

- Login somente com Google.
- Uso de `auth` centralizado e `GoogleAuthProvider`.
- `signInWithPopup` e redirect pós-sucesso.
- Usuário já autenticado em `/login`.
- Loading, erro, cancelamento e acessibilidade de estados.
- Nenhum provider global, API ou sessão customizada.

## Escopo incluído

- Alterar `src/components/auth/google-sign-in.tsx` para ser a única ilha Client
  responsável pela interação.
- Observar `onAuthStateChanged(auth, ...)` no mount e remover listener no
  cleanup.
- Usar estado `checking` antes de exibir CTA; usuário existente deve usar
  `router.replace("/dashboard")`.
- No clique, criar `GoogleAuthProvider`, chamar `signInWithPopup(auth, provider)`
  e desabilitar ação até terminar.
- Após sucesso, deixar `onAuthStateChanged` ser a única autoridade que chama
  `router.replace("/dashboard")`; o handler do popup não navega em paralelo.
- Classificar fechamento/cancelamento como estado recuperável; tratar popup
  bloqueado e demais falhas com mensagens sanitizadas e retry.
- Usar regiões live/alert e não renderizar erro bruto.

## Escopo excluído

- `signInWithRedirect` ou fallback automático por device.
- AuthProvider, Context, AuthService genérico ou armazenamento próprio.
- Guard do `/dashboard` (subtarefa 03).
- Logout, Firestore, Admin SDK, middleware/proxy e dados financeiros.
- Alteração de dependências, configuração ou variáveis públicas.

## Dependências

- Subtarefa 001-01 concluída.
- `auth` exportado por `src/lib/firebase/client.ts`.
- Firebase Console com Google provider e domínio de desenvolvimento autorizados.
- `next/navigation` disponível para `useRouter`.

## Arquivos e símbolos prováveis

- `src/components/auth/google-sign-in.tsx`: `GoogleSignIn` e estados locais.
- `src/lib/firebase/client.ts`: somente import do contrato `auth`; não alterar
  inicialização.
- APIs Firebase: `GoogleAuthProvider`, `signInWithPopup`,
  `onAuthStateChanged` e tipos de erro necessários.

## Passos de implementação

1. Adicionar `"use client"` no componente de interação, se ainda não existir.
2. Conectar listener de auth com estado inicial `checking`, cleanup e navegação
   de usuário já autenticado.
3. Implementar handler de clique com provider Google e popup iniciado no gesto.
4. Controlar `signing-in`, disabled e indicação live para evitar duplo clique.
5. Mapear `auth/popup-closed-by-user`/equivalente como cancelamento; mapear
   `auth/popup-blocked` com orientação específica; usar mensagem genérica nos
   demais casos.
6. Fazer o listener, ao confirmar usuário, chamar
   `router.replace("/dashboard")`; manter handler e listener idempotentes sem
   navegação concorrente.
7. Confirmar que nenhum token, stack trace ou objeto sensível aparece na UI ou
   log.

## Testes e comandos de validação

- Com Firebase configurado, clicar CTA e concluir conta Google de teste.
- Fechar popup e confirmar retorno ao estado ocioso com retry.
- Bloquear popup, simular falha de rede/provider e confirmar mensagens seguras.
- Repetir com usuário já autenticado abrindo `/login`.
- Confirmar botão desabilitado durante operação e mensagens anunciadas.
- `npm run lint -- src/components/auth/google-sign-in.tsx`.

## Definição de pronto

- CTA inicia somente Google via `auth` existente.
- Sucesso chega a `/dashboard`.
- Login já autenticado não mostra fluxo redundante.
- Loading, cancelamento, popup bloqueado e falha têm comportamento recuperável e
  acessível.
- Listener é removido ao desmontar componente.
- Nenhuma infraestrutura fora da decisão foi introduzida.

## Riscos e cuidados

- Não usar somente `auth.currentUser`: restauração é assíncrona.
- Não redirecionar por user-agent nem misturar popup/redirect.
- Popup precisa nascer diretamente do handler de clique para reduzir bloqueio.
- Não considerar esse fluxo como prova de autorização server-side.
- Evitar navegações concorrentes do listener e do handler; manter destino único
  `/dashboard` e usar `replace`.

## Registro de execução

- **Status final:** `completed`
- **Arquivos alterados:**
  - `src/components/auth/google-sign-in.tsx`
  - `docs/tasks/001-primeira-vertical-autenticacao/001-02-integrar-google-popup.md`
  - `docs/tasks/001-primeira-vertical-autenticacao/001-00-overview.md`
- **Decisões e desvios:**
  - Mantida API opcional da ilha Client e composição existente; Firebase foi
    importado somente no componente interativo.
  - `onAuthStateChanged` é autoridade única para `router.replace("/dashboard")`,
    com navegação idempotente e cleanup do listener.
  - Cancelamentos oficiais de popup são recuperáveis; popup bloqueado e demais
    falhas exibem mensagens fixas, acionáveis e sem detalhes do erro.
  - Nenhum desvio funcional, dependência, configuração ou infraestrutura nova foi
    introduzido.
- **Comandos executados:**
  - `npm run lint -- src/components/auth/google-sign-in.tsx` — passou.
  - `npm exec next typegen` — passou; tipos de rotas gerados.
  - `npx tsc --noEmit` — passou.
  - `npm run build` — passou; compilação e geração estática concluídas.
- **Resultados e evidências:**
  - Estado inicial `checking` desabilita CTA e anuncia restauração de sessão;
    listener leva usuário existente a `/dashboard`.
  - Popup usa `GoogleAuthProvider` com `auth` centralizado; handler não navega.
  - Cancelamento, popup bloqueado e falha genérica permitem retry com regiões
    `status`/`alert`, botão desabilitado durante operação e nenhum erro bruto na UI.
  - Build confirmou rotas atuais `/`, `/_not-found` e `/login`; `/dashboard`
    permanece dependente da subtarefa 001-03.
- **Riscos residuais:**
  - Validação manual de Firebase, popup, browsers, provider e domínios autorizados
    permanece bloqueada até configuração/prova operacional da subtarefa 001-04.
  - `/dashboard` ainda não existe; chegada efetiva ao destino depende da subtarefa
    001-03.
