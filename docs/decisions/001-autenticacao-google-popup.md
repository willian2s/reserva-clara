# 001 — Autenticação Google no cliente

- **Status:** accepted
- **Escopo:** primeira vertical `/login` → Google → `/dashboard`
- **Ticker relacionado:** `001`

## Contexto

Reserva Clara usa Next.js 16 com App Router, React 19, TypeScript strict e
Firebase Authentication Web já inicializado em
`src/lib/firebase/client.ts`. Ainda não existem rotas de autenticação,
middleware/proxy, sessão server-side, Firebase Admin SDK ou dados privados.

Primeira entrega precisa validar fluxo end-to-end com menor superfície possível,
sem antecipar Firestore, autorização ou domínio de investimentos. Login deve
funcionar em browsers desktop e mobile comuns, mantendo layout e páginas como
Server Components sempre que possível.

## Decisão

1. Usar `signInWithPopup` com `GoogleAuthProvider` em uma pequena ilha Client.
2. Usar `onAuthStateChanged` localmente em `/login` e `/dashboard` para esperar
   restauração assíncrona da persistência e decidir navegação/renderização.
   Listener será autoridade única de navegação para evitar corrida com o
   resultado do handler do popup; o handler não chama `router.replace` em
   paralelo.
3. Redirecionar com `router.replace("/dashboard")` após autenticação bem-sucedida.
4. Redirecionar usuário já autenticado que abrir `/login` para `/dashboard`.
5. Redirecionar usuário não autenticado que abrir `/dashboard` para `/login`,
   somente como guard de UX no cliente.
6. Manter `/login` e `/dashboard` como Server Components de rota, delegando
   Firebase, estado, eventos, navegação e mensagens à menor subárvore Client.
7. Não criar AuthProvider, Context global, middleware/proxy, Firebase Admin,
   endpoint de autenticação, cookie de sessão, AuthService genérico ou camada de
   autorização nesta etapa.

O popup é aberto diretamente pela ação do usuário. O botão fica desabilitado
durante a operação; cancelamento do popup retorna a estado ocioso com nova
tentativa disponível; demais falhas exibem mensagem genérica e segura.

## Por que popup

`signInWithPopup` mantém fluxo assíncrono em uma única navegação, fornece
resultado, erro e cancelamento no mesmo componente e não exige tratamento de
retorno após reload. Isso atende menor implementação no hosting atual e permite
preservar páginas e layout no servidor.

`signInWithRedirect` é alternativa relevante para mobile e ambientes que
bloqueiam popup, mas adiciona retorno pós-navegação, `getRedirectResult`, mais
estados e dependência de configuração/domínio OAuth. Não será combinado com
popup por detecção de dispositivo: user-agent criaria dois fluxos e matriz de
testes sem necessidade atual.

Premissa operacional: “mobile” significa browsers móveis comuns iniciando o
popup por gesto do usuário; WebViews, browsers embutidos e bloqueadores de popup
não têm garantia nesta primeira vertical. Se essa limitação se tornar requisito,
reabrir decisão para redirect ou fallback explícito.

## Responsabilidades

### Server Components

- `src/app/login/page.tsx`: estrutura visual, branding e conteúdo público.
- `src/app/dashboard/page.tsx`: entrada da rota e shell mínimo sem dados
  privados.
- `src/app/layout.tsx`: permanece global, com metadata e `lang="pt-BR"` já
  existentes.
- Não importar `auth`, não usar APIs de browser e não decidir identidade local.

### Client Components

- Componente de login: importar `auth` pela fronteira Client, observar auth,
  criar provider Google, iniciar popup, controlar loading/erro/cancelamento e
  navegar.
- Componente de dashboard: observar auth, mostrar loading, redirecionar ausente
  e renderizar shell somente após usuário confirmado.
- Limitar importação de Firebase a esses componentes; não promover Firebase ao
  layout ou a provider global.

## Consequências

### Positivas

- Menor alteração arquitetural para provar autenticação real.
- Bundle e hidratação limitados às ilhas interativas.
- Sem dependência adicional ou migração de dados.
- UI de login fica desacoplada da futura sessão server-side por ter boundary
  Client local e contrato de navegação estável.

### Negativas e riscos aceitos

- Guard client-side não é autorização: `/dashboard` pode ser solicitado e seu
  JavaScript manipulado antes da hidratação.
- Popup pode ser bloqueado, especialmente em WebViews e alguns cenários
  móveis.
- Server Components não podem confiar na identidade Firebase local nesta fase.
- Erros de provider, domínio autorizado, ambiente ou rede só serão observados
  em runtime.

Mitigação: dashboard contém somente confirmação não sensível; não usar
Firestore, Storage ou valores patrimoniais; não registrar tokens; validar
providers/domínios e browsers no aceite manual.

## Alternativas descartadas

| Alternativa | Motivo do descarte nesta etapa |
| --- | --- |
| `signInWithRedirect` | Mais estados e reload para MVP; fica como opção quando popup bloqueado for requisito. |
| Popup + redirect por dispositivo | Detecção frágil e dois fluxos para testar; não usar user-agent. |
| AuthProvider/Context global | Não há consumidor global; aumenta hidratação e acoplamento. |
| Middleware/proxy | Não enxerga persistência Firebase no browser; daria falsa proteção. |
| Firebase Admin e sessão `HttpOnly` | Exigem backend, verificação de token e configuração fora do escopo. |
| API própria, AuthService, repository ou adapter | Abstrações sem segundo consumidor nesta vertical. |
| Firestore ou sincronização de usuário | Explicitamente fora do objetivo end-to-end. |

## Evolução posterior

Quando `/dashboard` receber dados privados, manter a UI de login e seus estados,
mas introduzir fluxo server-side separado: trocar ID token no servidor por
cookie `HttpOnly`, `Secure`, `SameSite`, validar sessão em Server Components e
camada de dados, e adicionar Firebase Admin somente no servidor. Middleware/proxy
poderá otimizar navegação, nunca substituir autorização e Security Rules. O
guard Client atual continua útil para UX.

## Referências consultadas

- `AGENTS.md` e código local do projeto.
- Next.js 16.3.5: [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components).
- Firebase: [Authenticate Using Google with JavaScript](https://firebase.google.com/docs/auth/web/google-signin).
- Firebase: [Best practices for signInWithRedirect flows](https://firebase.google.com/docs/auth/web/redirect-best-practices).
- Documentação local indicada em `AGENTS.md` (`node_modules/next/dist/docs/`) não
  existe neste checkout; comportamento Next foi conferido na documentação da
  versão instalada e nos contratos locais do pacote.
