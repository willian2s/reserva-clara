# 001-04 — Validar fluxo E2E

- **Ticker:** `001`
- **Número:** `04`
- **Status:** `pending`

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
