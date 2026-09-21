# 001-03 — Criar dashboard e guard

- **Ticker:** `001`
- **Número:** `03`
- **Status:** `pending`

## Objetivo e resultado esperado

Criar `/dashboard` mínimo e confirmar no cliente que somente usuário com estado
Firebase autenticado vê o shell. Usuário ausente deve retornar a `/login` sem
expor conteúdo privado durante a checagem.

## Requisitos cobertos

- Rota `/dashboard` mínima após login.
- Confirmação visual de fluxo autenticado, sem domínio financeiro.
- Redirect de acesso anônimo e refresh.
- Loading inicial e uso de `onAuthStateChanged`.
- Preservação de Server Component na página e Client apenas no guard.

## Escopo incluído

- Criar `src/app/dashboard/page.tsx` como Server Component de entrada.
- Criar `src/components/auth/dashboard-gate.tsx` como componente Client local.
- No guard, aguardar primeira emissão de `onAuthStateChanged(auth, ...)`.
- Com usuário, renderizar shell mínimo de confirmação.
- Sem usuário, manter conteúdo fora do shell e executar
  `router.replace("/login")`.
- Remover listener no cleanup e tratar loading com semântica acessível.
- Usar apenas texto de confirmação, sem valores, gráficos, cards financeiros,
  Firestore ou dados de perfil.

## Escopo excluído

- Proteção server-side, middleware/proxy, Firebase Admin ou cookie de sessão.
- Logout, menu, dashboard real, Firestore, investimentos e autorização.
- Exposição de `uid`, e-mail ou dados do usuário sem necessidade.
- Alteração de `/login` além do necessário para completar o destino.

## Dependências

- Subtarefa 001-02 concluída ou contrato de `auth` disponível.
- `src/lib/firebase/client.ts` exportando `auth`.
- Decisão de guard client-side em
  `docs/decisions/001-autenticacao-google-popup.md`.

## Arquivos e símbolos prováveis

- `src/app/dashboard/page.tsx`: export default `DashboardPage`.
- `src/components/auth/dashboard-gate.tsx`: `DashboardGate`, estado de auth e
  `useRouter`.
- `src/lib/firebase/client.ts`: import de `auth` sem alteração.

## Passos de implementação

1. Criar rota server-side `/dashboard` que renderiza somente o guard Client.
2. Implementar estado inicial `checking` com indicador acessível.
3. Assinar `onAuthStateChanged`; ao receber usuário, renderizar shell mínimo.
4. Ao receber `null`, não renderizar shell e substituir rota por `/login`.
5. Remover listener ao desmontar e evitar atualizar estado após cleanup.
6. Confirmar que qualquer texto renderizado antes da autenticação é apenas
   loading não sensível.

## Testes e comandos de validação

- Usuário autenticado: abrir `/dashboard`, confirmar shell.
- Usuário autenticado: atualizar página, confirmar loading breve e shell.
- Usuário anônimo: abrir `/dashboard` diretamente, confirmar retorno a `/login`.
- Usuário anônimo: confirmar que shell não aparece antes da decisão.
- Navegar entre `/login` e `/dashboard` sem listeners duplicados observáveis.
- `npm run lint -- src/app/dashboard/page.tsx src/components/auth/dashboard-gate.tsx`.

## Definição de pronto

- `/dashboard` existe e confirma autenticação sem conteúdo fictício ou privado.
- Authenticated user vê shell após listener confirmar identidade.
- Anonymous user é enviado a `/login` e não vê shell.
- Refresh e acesso direto seguem comportamento definido.
- Página continua Server Component; Firebase fica no guard Client.
- Listener tem cleanup e lint passa.

## Riscos e cuidados

- Guard Client não protege HTML, APIs ou dados futuros; registrar essa limitação.
- Não importar Firebase na página server-side.
- Não renderizar dados patrimoniais, Firestore ou valores nesta vertical.
- Não usar `auth.currentUser` como única decisão.
- Não adicionar middleware/proxy apenas para esconder essa limitação.
