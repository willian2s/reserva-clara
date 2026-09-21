# 001 — Primeira vertical de autenticação

## Ticker

`001`

## Contexto

Reserva Clara é aplicação web multiusuário para acompanhamento de patrimônio e
investimentos, com tagline “Seu patrimônio, com clareza.”. O repositório usa
Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS, shadcn/ui e
Firebase Authentication Web. Firebase já está inicializado em
`src/lib/firebase/client.ts`, com variáveis `NEXT_PUBLIC_FIREBASE_*` previstas
em `.env.example` e provider Google habilitado conforme contexto do produto.

Estado versionado ainda é o template inicial: existe somente `/`, não existem
`/login`, `/dashboard`, componente de autenticação, listener de sessão,
middleware/proxy, sessão customizada, Firebase Admin ou testes automatizados.

Não há documentação anterior em `docs/`; esta spec inaugura o padrão de
decision, spec e tasks do repositório. Nenhum ticker explícito foi informado e
nenhum prefixo numérico existente foi encontrado; por isso foi escolhido `001`.

## Objetivo

Validar a menor vertical funcional de autenticação:

`/login` → Google Sign-In → Firebase Authentication → `/dashboard`

Dashboard deve ser shell mínimo para confirmar autenticação, sem dados
financeiros ou domínio de investimentos.

## Requisitos

### Funcionais

- Criar rota pública `/login`.
- Oferecer somente login Google, com CTA exato `Continuar com Google`.
- Usar Firebase Authentication Web existente e `GoogleAuthProvider`.
- Usar `signInWithPopup` iniciado por ação explícita do usuário.
- Após sucesso, navegar para `/dashboard` com `router.replace`.
- Criar `/dashboard` mínimo, sem gráficos, valores, widgets ou dados fictícios.
- Ao acessar `/login` já autenticado, navegar para `/dashboard`.
- Ao acessar `/dashboard` sem usuário confirmado, navegar para `/login`.
- Tratar restauração inicial, loading da operação, cancelamento e erro sem
  expor detalhes sensíveis.
- Permitir nova tentativa após cancelamento ou falha recuperável.
- Funcionar em browsers desktop e mobile comuns, com layout responsivo.
- Preservar componentes Server por padrão e limitar Firebase a componentes
  Client interativos.

### Fora de escopo

- Firestore, BRAPI, ativos, carteiras, transações, metas, histórico e aporte.
- Login por e-mail/senha ou qualquer provider além de Google.
- Onboarding, logout, recuperação de conta, múltiplos perfis ou papéis.
- AuthProvider global, Context global, middleware/proxy e autorização real.
- Firebase Admin SDK, API própria, cookie de sessão e backend de autenticação.
- Persistência customizada, sincronização de usuário e camada genérica de
  serviços, repositories, factories ou adapters.

## Fluxo esperado

1. Usuário abre `/login`.
2. Ilha Client observa `onAuthStateChanged` enquanto estado está `checking`.
3. Se usuário existir, página não mostra CTA e faz `router.replace` para
   `/dashboard`.
4. Se não existir usuário, mostra cartão simples com “Reserva Clara”, tagline e
   botão `Continuar com Google`.
5. Ao clicar, botão fica desabilitado e informa loading; inicia
   `signInWithPopup(auth, new GoogleAuthProvider())`.
6. Se popup concluir, aplicação navega para `/dashboard`.
7. Se usuário fechar/cancelar popup, mantém `/login`, informa cancelamento de
   forma neutra e reabilita tentativa.
8. Se ocorrer falha de rede, configuração, provider ou popup bloqueado, exibe
   mensagem genérica acionável, sem stack trace, token ou código bruto; permite
   tentar novamente.
9. `/dashboard` observa `onAuthStateChanged` antes de renderizar shell. Com
   usuário, mostra confirmação mínima. Sem usuário, mantém loading breve e
   substitui rota por `/login`.

`/dashboard` é guard de UX, não boundary de segurança. Até existir sessão
server-side, seu conteúdo deve permanecer não sensível.

## Estados de UI

| Estado | Comportamento |
| --- | --- |
| `checking` | Não mostrar CTA acionável; exibir indicação breve de carregamento e `aria-busy`. |
| `ready` | Mostrar CTA Google habilitado e foco visível. |
| `signing-in` | Desabilitar CTA, impedir cliques duplicados e anunciar progresso em região live. |
| `cancelled` | Mensagem neutra; CTA volta a habilitado. |
| `error` | Mensagem genérica, sem segredo; CTA volta a habilitado. |
| `authenticated` | Navegar para `/dashboard`; não deixar conteúdo privado intermediário. |

Mapeamento mínimo de erro:

- `auth/popup-closed-by-user` e cancelamento equivalente: tratar como
  cancelamento, não como falha fatal.
- `auth/popup-blocked`: explicar que popup foi bloqueado e oferecer nova
  tentativa após permitir popups; não implementar fallback automático.
- Demais códigos: mensagem genérica de indisponibilidade e retry.

## UX e acessibilidade

- Usar `lang="pt-BR"` já definido no layout.
- Usar estrutura semântica (`main`, heading único, botão real) e textos em
  português brasileiro.
- CTA deve ser operável por teclado, ter foco visível, área adequada para toque,
  estado disabled perceptível e nome acessível.
- Mensagens de loading e erro devem ser anunciadas com região apropriada
  (`role="status"`/`aria-live` e `role="alert"` quando aplicável).
- Não depender somente de cor para erro ou estado.
- Cartão deve ocupar largura disponível em mobile, respeitar espaçamento seguro
  e manter largura confortável em desktop.
- Não inserir gráficos fictícios, valores financeiros, widgets decorativos ou
  aparência de template SaaS genérico.

## Comportamento atual encontrado

- `src/app/page.tsx` é página inicial padrão do create-next-app e só expõe `/`.
- `src/app/layout.tsx` já fornece metadata Reserva Clara, Geist e `lang="pt-BR"`.
- `src/lib/firebase/client.ts` reutiliza app existente, cria `getAuth` e exporta
  `auth`; não contém provider, popup, redirect ou listener.
- Componentes `Button`, `Card`, `CardHeader`, `CardTitle`, `CardDescription` e
  `CardContent` já existem em `src/components/ui` e devem ser reutilizados.
- `components.json` indica shadcn `base-nova`, Base UI e RSC; Tailwind 4 usa
  tokens em `src/app/globals.css`.
- Não existe middleware/proxy, route handler, Firebase Admin ou biblioteca de
  sessão.
- `package.json` tem Firebase 12.19.0, Next 16.3.5 e scripts `lint`/`build`,
  sem test runner ou formatter.

## Abordagem escolhida

### Composição

- `/login/page.tsx` permanece Server Component e compõe branding, cartão e
  componente Client de login.
- `src/components/auth/google-sign-in.tsx` (nome provável) concentra o limite
  Client: listener, provider, popup, estado de UI e navegação.
- `/dashboard/page.tsx` permanece Server Component e compõe um componente Client
  de guard/shell mínimo.
- `src/components/auth/dashboard-gate.tsx` (nome provável) observa auth e
  impede shell privado antes da confirmação.
- `src/lib/firebase/client.ts` é reutilizado sem criar outro inicializador ou
  abstraction layer.

### Popup, guard e sessão

A decisão completa deve ficar em
`docs/decisions/001-autenticacao-google-popup.md`. Em resumo: popup é menor
para esta entrega; não haverá detecção de dispositivo, fallback híbrido,
AuthProvider, middleware/proxy, Admin SDK ou sessão custom.

### Contratos de rota

- `/login`: pública, renderização inicial server-side com ilha interativa.
- `/dashboard`: shell não sensível, guard client-side baseado em Firebase Web.
- `/`: permanece fora desta vertical; não é necessário redirecioná-la para
  `/login` sem requisito adicional.

### Configuração externa

Implementação não adiciona dependências nem altera `.env.example`. Validação
manual deve confirmar provider Google habilitado, variáveis públicas presentes e
domínios de desenvolvimento/produção autorizados no Firebase Console.

## Arquivos, módulos e contratos afetados

### Alterações esperadas na implementação futura

- `src/app/login/page.tsx`: nova rota e estrutura visual server-side.
- `src/app/dashboard/page.tsx`: nova rota e entrada do shell mínimo.
- `src/components/auth/google-sign-in.tsx`: nova ilha Client de login e estados.
- `src/components/auth/dashboard-gate.tsx`: nova ilha Client de guard e shell.

### Reutilização sem alteração esperada

- `src/lib/firebase/client.ts`: contrato exportado `auth`.
- `src/components/ui/button.tsx` e `src/components/ui/card.tsx`.
- `src/app/layout.tsx`, `src/app/globals.css`, `components.json`.

### Contratos técnicos

- Firebase é importado somente por módulos Client que rodam no browser.
- Nenhum token, segredo, `uid` ou objeto Firebase é passado de Server para Client
  como prop sem necessidade.
- Navegação pós-auth usa caminho fixo `/dashboard`; não há `returnTo` nesta
  primeira vertical.
- Erros exibidos são mensagens sanitizadas; logs, se necessários durante
  desenvolvimento, não podem incluir tokens ou credenciais.

## Riscos e mitigação

| Risco | Mitigação |
| --- | --- |
| Popup bloqueado | Abrir somente em handler de clique; tratar `auth/popup-blocked`; validar configuração. Fallback redirect fica adiado. |
| Mobile/WebView incompatível | Aceitar apenas browsers móveis comuns nesta etapa; registrar limitação e reabrir decisão se WebView for requisito. |
| Falsa sensação de proteção | Exibir somente shell não sensível; documentar guard como UX; implementar sessão server-side antes de dados privados. |
| Auth state assíncrono | Usar `onAuthStateChanged`, estado `checking` e cleanup do listener. |
| Provider/domínio/env incorreto | Validar Firebase Console, authorized domains e variáveis antes do aceite E2E. |
| Duplo clique ou navegação concorrente | Desabilitar CTA durante operação e usar `router.replace`. |
| Vazamento de informação | Mensagens genéricas; não renderizar erro bruto, tokens ou dados patrimoniais. |
| Regressão visual mobile | Validar viewport estreito, teclado, foco, contraste e toque em browsers reais. |

## Estratégia de testes e validação

Não há test runner configurado; não declarar cobertura automatizada. Validação
será composta por:

1. `npm run lint`.
2. `npm exec next typegen` seguido de `npx tsc --noEmit`, conforme
   `AGENTS.md`.
3. `npm run build`.
4. Teste manual com ambiente Firebase configurado:
   - login Google concluído e chegada em `/dashboard`;
   - refresh e acesso direto a `/dashboard` com usuário autenticado;
   - `/login` aberto já autenticado;
   - usuário fechando/cancelando popup;
   - popup bloqueado;
   - erro de rede/provider/domínio;
   - acesso anônimo direto a `/dashboard` e retorno para `/login`;
   - retry após erro/cancelamento;
   - Chrome, Safari e Firefox desktop quando disponíveis;
   - Safari iOS e Chrome Android quando disponíveis;
   - teclado, foco, leitor de tela/região live, contraste e viewport mobile.

Critério end-to-end: um usuário Google autorizado conclui login, vê o shell
mínimo de `/dashboard`, e um usuário anônimo não vê esse shell após guard
confirmar ausência de autenticação.

## Critérios de aceite

- `/login` existe, responde em pt-BR e exibe “Reserva Clara”, “Seu patrimônio, com clareza.” e “Continuar com Google”.
- Login oferece somente Google e usa `auth` de `src/lib/firebase/client.ts`.
- Clique inicia popup Firebase, mostra loading e impede duplicidade.
- Sucesso navega para `/dashboard` sem reload adicional da aplicação.
- Cancelamento permite retry e não apresenta stack trace ou código cru.
- Falhas tratáveis apresentam mensagem acessível e retry.
- Usuário já autenticado em `/login` é enviado a `/dashboard`.
- `/dashboard` mostra somente shell mínimo após auth confirmada e envia anônimo a `/login`.
- Layout funciona em desktop/mobile comuns e atende teclado, foco, semântica, live region e contraste.
- Não existe AuthProvider, middleware/proxy, Admin SDK, sessão customizada, Firestore ou autorização por papéis introduzidos pela vertical.
- Lint, type-check gerado e build passam; validação manual E2E foi executada.

## Ordem das subtarefas

1. [001-01-estruturar-login-ui.md](../tasks/001-primeira-vertical-autenticacao/001-01-estruturar-login-ui.md) — casca visual e fronteira Client.
2. [001-02-integrar-google-popup.md](../tasks/001-primeira-vertical-autenticacao/001-02-integrar-google-popup.md) — autenticação Google, estados e navegação.
3. [001-03-criar-dashboard-guard.md](../tasks/001-primeira-vertical-autenticacao/001-03-criar-dashboard-guard.md) — shell e guard client-side.
4. [001-04-validar-fluxo-e2e.md](../tasks/001-primeira-vertical-autenticacao/001-04-validar-fluxo-e2e.md) — configuração operacional e prova final.

## Premissas explícitas

- Ticker não foi fornecido; `001` é o próximo prefixo disponível.
- Provider Google e configuração Firebase estão habilitados como informado,
  mas authorized domains e variáveis precisam ser confirmados no ambiente de
  execução.
- “Mobile” nesta entrega significa browsers móveis comuns; WebViews ou popup
  bloqueado de forma estrutural exigem decisão posterior sobre redirect.
- `/dashboard` não terá dados privados, Firestore, logout ou conteúdo de domínio.
- `/` permanece página existente e não vira automaticamente uma rota protegida.
- Ausência de test runner é fato do repositório; testes manuais e comandos
  disponíveis não substituem futura automação.
