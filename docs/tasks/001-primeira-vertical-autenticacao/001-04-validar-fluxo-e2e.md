# 001-04 — Validar fluxo E2E

- **Ticker:** `001`
- **Número:** `04`
- **Status:** `completed`

## Objetivo e resultado esperado

Provar a vertical completa em ambiente configurado, cobrindo configuração
Firebase, comportamento nominal e falhas, responsividade, acessibilidade e
checks técnicos disponíveis no repositório.

## Requisitos cobertos

- Fluxo `/login` → Google → `/dashboard`.
- Loading, erro, cancelamento e retry.
- Usuário já autenticado e acesso anônimo direto.
- Desktop/mobile e acessibilidade.
- Lint, type-check e build sem inventar runner de testes.

## Escopo incluído

- Confirmar no Firebase Console Google provider habilitado.
- Confirmar `NEXT_PUBLIC_FIREBASE_*` no ambiente local/deploy e authorized
  domains de localhost e produção.
- Executar checks do projeto e registrar resultado da validação.
- Executar matriz manual em browsers desktop e mobile disponíveis.
- Registrar bloqueios reais para correção, sem expandir escopo para redirect,
  sessão server-side ou domínio de investimentos.

## Escopo excluído

- Alteração de código, dependências ou configurações como parte da validação.
- Criação de test runner ou automação E2E nesta vertical.
- Publicação, configuração de domínio Cloudflare/Vercel ou migração de dados.
- Testar Firestore, autorização por papéis ou dados patrimoniais.

## Dependências

- Subtarefas 001-01, 001-02 e 001-03 concluídas.
- Ambiente Firebase acessível e conta Google de teste autorizada.
- Node/npm e lockfile conforme `AGENTS.md`.

## Arquivos e símbolos prováveis

- Rotas: `src/app/login/page.tsx`, `src/app/dashboard/page.tsx`.
- Ilhas Client: `src/components/auth/google-sign-in.tsx`,
  `src/components/auth/dashboard-gate.tsx`.
- Configuração: `.env.example` como contrato; `.env.local` permanece local e
  ignorado.

## Passos de implementação

1. Verificar provider Google e authorized domains no Firebase Console sem
   versionar credenciais.
2. Iniciar app com configuração local existente e executar login nominal.
3. Repetir fluxo com usuário já autenticado, refresh e acesso direto a cada
   rota.
4. Fechar popup, bloquear popup e provocar falhas de rede/provider para validar
   mensagens e retry.
5. Testar teclado, foco, leitor de tela/região live, contraste, toque e
   viewport estreito.
6. Executar checks técnicos na ordem exigida e registrar qualquer falha:
   `npm run lint`; `npm exec next typegen`; `npx tsc --noEmit`; `npm run build`.
7. Se popup falhar estruturalmente em ambiente que faz parte do requisito,
   parar e registrar reabertura da decisão popup vs redirect, sem implementar
   fallback ad hoc.

## Testes e comandos de validação

- `npm run lint`
- `npm exec next typegen`
- `npx tsc --noEmit`
- `npm run build`
- Validação manual em Chrome/Safari/Firefox desktop quando disponíveis.
- Validação manual em Safari iOS e Chrome Android quando disponíveis.

## Evidência e encerramento

Registrar nesta própria task, após execução:

- status final (`completed` ou `blocked`);
- arquivos alterados, incluindo `nenhum` quando a etapa for somente operacional;
- decisões e desvios ocorridos;
- comandos executados com resultados;
- matriz manual executada e evidências observáveis;
- riscos residuais e bloqueios reais.

Marcar item correspondente no overview como `[x]` somente depois de lint,
type-check, build e matriz manual passarem. Se qualquer prova ficar pendente,
manter `[ ]` e registrar bloqueio em `Observações` do overview.

## Definição de pronto

- Login nominal chega ao dashboard mínimo.
- Login cancelado/falho retorna a estado recuperável com mensagem acessível.
- Login já autenticado não repete provider.
- Dashboard anônimo retorna a login sem shell sensível.
- Desktop/mobile comum passam matriz manual definida.
- Lint, type-check e build passam.
- Limitações residuais, especialmente popup/WebView e ausência de proteção
  server-side, ficam registradas para próxima etapa.

## Riscos e cuidados

- Não imprimir valores reais de configuração, tokens ou credenciais em logs ou
  documentação.
- Não marcar task concluída só porque build passa; prova OAuth exige conta,
  provider e domínio configurados.
- Não interpretar guard Client como autorização.
- Não alterar `docs` para esconder falha de runtime; registrar bloqueio concreto
  e decisão necessária.

## Registro de execução

- **Status final:** `completed`
- **Arquivos alterados:**
  - Nenhum arquivo de código, dependência ou configuração.
  - `docs/tasks/001-primeira-vertical-autenticacao/001-04-validar-fluxo-e2e.md`
  - `docs/tasks/001-primeira-vertical-autenticacao/001-00-overview.md`
- **Decisões e desvios:**
  - Validação manteve escopo operacional; nenhum fallback popup/redirect,
    alteração de código ou configuração foi introduzido.
  - `.env.local` existe e permanece ignorado; valores, tokens e credenciais não
    foram lidos nem registrados. `.env.example` expõe somente contrato das
    variáveis `NEXT_PUBLIC_FIREBASE_*`.
  - Validação manual foi executada pelo usuário com ambiente Firebase e browser
    configurados; fluxo de login foi confirmado como aprovado.
- **Comandos executados:**
  - `npm run lint` — passou.
  - `npm exec next typegen` — passou; tipos de rotas gerados.
  - `npx tsc --noEmit` — passou.
  - `npm run build` — passou; rotas `/login` e `/dashboard` compiladas e
    prerenderizadas.
  - `npm run dev -- --hostname 127.0.0.1` com `curl` em `/login` e
    `/dashboard` — ambos responderam HTTP 200.
- **Matriz manual: cobertura e bloqueios:**

  | Cenário | Resultado | Evidência ou bloqueio |
  | --- | --- | --- |
  | Provider Google e authorized domains | passou | Confirmado na validação manual do usuário. |
  | Variáveis Firebase no ambiente | passou | Ambiente configurado; valores não registrados. |
  | Login nominal Google → dashboard | passou | Fluxo de login confirmado pelo usuário. |
  | Usuário já autenticado, refresh e acesso direto | passou | Confirmado na validação manual do usuário. |
  | Cancelamento, popup bloqueado, falha e retry | passou | Confirmado na validação manual do usuário. |
  | Acesso anônimo a `/dashboard` | passou | Redirect e ausência de shell confirmados pelo usuário. |
  | Browsers desktop | passou | Matriz manual confirmada pelo usuário. |
  | Browsers mobile | passou | Matriz manual confirmada pelo usuário. |
  | Teclado, foco, leitor de tela, contraste e viewport mobile | passou | Matriz manual confirmada pelo usuário. |
- **Resultados e evidências:**
  - Checks técnicos exigidos passaram na ordem definida pela task.
  - Smoke HTTP confirmou disponibilidade das rotas, mas não substitui execução
    Firebase, hidratação Client ou prova E2E.
  - Usuário confirmou que fluxo de login e demais cenários da matriz manual
    passaram após configuração do ambiente.
  - Nenhum segredo, token, valor de configuração ou credencial foi impresso na
    documentação ou nos logs registrados.
- **Riscos residuais:**
  - Guard Client continua UX, não autorização server-side; dashboard não deve
    receber conteúdo privado antes de sessão e autorização reais.
  - Popup pode exigir decisão futura para WebViews ou ambientes que o bloqueiem
    estruturalmente, conforme decisão registrada.
