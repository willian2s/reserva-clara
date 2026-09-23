# 004-05 — Configurar Firebase Auth produção

- **Ticker:** `004`
- **Número:** `05`
- **Status:** `completed`

## Objetivo e resultado esperado

Preparar Firebase Authentication para Google popup na origem produtiva app,
mantendo a decisão 001 e a allowlist mínima de Authorized Domains.

## Requisitos cobertos

- Google provider habilitado.
- `app.reservaclara.com.br` em Authorized Domains.
- Avaliação técnica de público, `www`, localhost e previews.
- Popup OAuth, `authDomain` e erros de domínio não autorizado.
- Nenhum Firebase Admin, redirect flow ou sessão server-side.

## Escopo incluído

- Humano confirma projeto Firebase correto e provider Google ativo.
- Consultar documentação oficial atual sobre Web Google Sign-In, popup,
  Authorized Domains, `authDomain` e Google OAuth.
- Adicionar/verificar `app.reservaclara.com.br`.
- Conferir `localhost` para desenvolvimento.
- Testar se origem pública realmente executa Firebase; só adicionar público ou
  `www` se evidência/documentação exigir.
- Definir política de preview sem wildcard e registrar qualquer bloqueio.

## Escopo excluído

- Firebase Admin, Firestore, Security Rules, App Check, Storage ou backend.
- Google Cloud OAuth customizado sem exigência documentada.
- `signInWithRedirect`, fallback de popup, AuthProvider ou cookies.
- Inserir domínio Vercel dinâmico em massa.
- Registrar projeto ID, client ID, keys, tokens ou dados de conta de teste.

## Dependências

- 004-03 variables configuradas para o projeto correto.
- 004-04 app HTTPS validado.
- Usuário com acesso Firebase Console e provider Google.
- Conta Google de teste disponível para 004-07; não registrar identidade.

## Arquivos e símbolos prováveis

- `src/lib/firebase/client.ts`: `authDomain` e config Web.
- `src/components/auth/google-sign-in.tsx`: `GoogleAuthProvider`,
  `signInWithPopup`, erros e `router.replace`.
- Firebase Console Authentication → Sign-in method/Settings/Authorized Domains.
- Documentação oficial Firebase/Google consultada na data da execução.

## Passos de implementação

1. Humano confirma que Firebase Web app e Vercel variables pertencem ao mesmo
   projeto, sem colar valores no registro.
2. Confirmar Google como provider ativo e política de consentimento atual.
3. Adicionar/verificar `app.reservaclara.com.br` em Authorized Domains.
4. Preservar `localhost` se já existir; não adicionar público/`www` antes de
   observar necessidade no navegador.
5. Para previews, não cadastrar wildcard. Se houver hostname estável autorizado,
   registrar exatamente qual foi usado sem aceitar qualquer `.vercel.app`.
6. Confirmar se `authDomain` Firebase padrão é suficiente; só mudar por
   instrução oficial e alteração aprovada.
7. Abrir `/login` em app produtivo e observar erro sanitizado, sem ainda marcar
   fluxo nominal como aprovado se popup não for concluído.

## Testes e comandos de validação

- Console: provider Google ativo, domains mínimos e projeto correto.
- Browser: origem efetiva do popup é `app.reservaclara.com.br`.
- DevTools: ausência de `auth/unauthorized-domain` no cenário autorizado; se
  ocorrer, registrar diagnóstico sanitizado e bloquear aceite.
- Host público não deve inicializar Firebase para renderizar landing.
- Preview dinâmico: registrar explicitamente `OAuth não testado/bloqueado` se
  não houver autorização exata.

## Definição de pronto

- Google provider ativo no projeto correto.
- `app.reservaclara.com.br` autorizado e validado pelo menos até abertura do
  fluxo.
- Público/`www` só adicionados com justificativa observável.
- Nenhum wildcard de preview foi criado.
- `authDomain` não foi alterado por suposição.
- Cenários pendentes e intervenção necessária estão registrados para 004-07.

## Riscos e cuidados

- Authorized Domains é allowlist de origem, não autorização do dashboard.
- Preview com env correto pode continuar falhando por domínio não autorizado;
  isso é política deliberada, não motivo para wildcard.
- Popup bloqueado, WebView e browsers com restrição de storage continuam
  limitações da decisão 001; não redesenhar nesta task.
- Contas Firebase/Google de produção podem criar usuários reais; usar conta de
  teste autorizada e não apagar usuário como rollback.

## Checkpoint humano

Somente responsável com acesso ao Firebase Console pode habilitar/verificar
provider e Authorized Domains. A task não pode ser marcada `[x]` com base em
intenção ou screenshot sem teste da origem efetiva.

## Evidências da execução

- **Data:** 2026-09-23.
- **Checkpoint humano:** responsável confirmou configuração do projeto Firebase
  correto, provider Google ativo e login funcionando na aplicação produtiva.
  Nenhum valor de configuração, token, UID, email ou identidade foi solicitado
  ou registrado. A confirmação não substitui teste nominal em contexto sem
  sessão quando a captura não mostra o início do popup.
- **Origem observada:** captura do dashboard mostra
  `https://app.reservaclara.com.br/dashboard` após autenticação. Isso comprova
  que área logada foi alcançada, mas não distingue login novo de sessão já
  existente.
- **Authorized Domains:** captura do Firebase Console mostra `localhost`,
  domínios padrão Firebase, `reservaclara.com.br` e o hostname estável
  `reserva-clara.vercel.app`; não há wildcard `*.vercel.app`. A captura não
  mostra `app.reservaclara.com.br`; confirmação humana posterior revalidou a
  configuração atual com o host app autorizado.
- **Evidências visuais recebidas, não editadas:**
  `evidences/004-05-firebase-domains.png` e
  `evidences/004-05-area-logada.png`.
- **Documentação oficial consultada em 2026-09-23:**
  [Firebase Google Web Sign-In](https://firebase.google.com/docs/auth/web/google-signin)
  confirma `GoogleAuthProvider`/`signInWithPopup` e a configuração do provider;
  [Firebase redirect best practices](https://firebase.google.com/docs/auth/web/redirect-best-practices)
  foi consultada para preservar a decisão de popup e não introduzir redirect.

## Arquivos alterados

- `docs/tasks/004-production-deployment/004-05-configurar-firebase-auth-producao.md`
- `docs/tasks/004-production-deployment/004-00-overview.md`

Arquivos de evidência recebidos pelo responsável, não editados pelo agente:

- `docs/tasks/004-production-deployment/evidences/004-05-firebase-domains.png`
- `docs/tasks/004-production-deployment/evidences/004-05-area-logada.png`

## Decisões e desvios

- Nenhum código, dependência, variável, `authDomain` ou serviço foi alterado.
- Nenhum wildcard de preview foi criado. O hostname Vercel exibido é específico,
  não uma autorização ampla de `*.vercel.app`.
- A configuração atual removeu `reservaclara.com.br`; `www` não foi autorizado.
  Allowlist permanece mínima, sem wildcard de preview.
- Confirmação humana posterior registrou `app.reservaclara.com.br` visível no
  console e popup concluído em contexto sem sessão. Nenhuma alteração de código
  ou fluxo foi necessária.
- `authDomain` Firebase padrão permaneceu sem alteração; o popup produtivo foi
  validado sem exigir configuração complementar.
- A matriz nominal completa, restauração de sessão, cenário anônimo e erros
  continuam pertencendo à subtarefa 004-07; ela não foi iniciada.

## Comandos executados e resultados

- `git status --short --branch` — `main...origin/main`; somente documentação e
  evidências recebidas aparecem alteradas/não rastreadas.
- `git diff --check` — passou.
- `npm run lint` — passou.
- `npm exec next typegen` — passou; tipos gerados.
- `npx tsc --noEmit` — passou.
- `npm run build` — passou; Next `16.3.5` compilou as rotas esperadas.
- Test runner — não configurado no projeto; nenhuma suíte automatizada existe.
- Browser — login produtivo confirmado pelo responsável; destino observado em
  `app.reservaclara.com.br/dashboard`.
- Confirmação humana posterior — `app.reservaclara.com.br` autorizado no
  console, popup nominal concluído em sessão limpa e `reservaclara.com.br`
  removido da allowlist.

## Riscos residuais

- A captura visual arquivada anteriormente não mostra a linha `app`, mas a
  confirmação humana posterior revalidou console e fluxo em sessão limpa.
- Popup bloqueado, cancelamento, retry, restauração de sessão e comportamento
  anônimo ainda não foram validados como matriz completa; permanecem em 004-07.
- Preview dinâmico continua sem autorização por wildcard; OAuth em hostname
  efêmero não foi declarado.
