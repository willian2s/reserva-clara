# 008-06 — Validar gates e handoff

- **Ticker:** `008`
- **Número:** `06`
- **Status:** `completed`

## Objetivo e resultado esperado

Fechar a fase 008 com evidência técnica, revisão de segurança, smoke autorizado,
rollback e handoff para Positions. Resultado: spec/overview/subtarefas refletem
execução real, sem deploy automático e sem aceitar Quote sem prova de precisão,
ownership ou resiliência.

## Requisitos cobertos

- Todos os critérios da spec 008, especialmente 1–6, 14–26.
- Handoff 009: Position deriva de Transaction + Asset + Quote; ledger continua
  fonte da verdade.

## Escopo incluído

- Executar testes puros de Quote/adapter/service/route e regressão domain/rules.
- Executar lint, Next typegen, TypeScript, build e diff check na ordem do repo.
- Inspecionar imports, env, bundle, logs/erros sanitizados, URL/header e
  ausência de persistência/Rules novas.
- Smoke manual autenticado em ambiente autorizado, usando Assets sintéticos.
- Registrar contagens, comandos, evidências sem UID/token/preço/patrimônio e
  riscos residuais.
- Documentar rollout, rollback e handoff 009/010/012 na spec/overview.

## Escopo excluído

- Deploy, configuração de Console, seed produtivo ou alteração de Rules.
- Começar Position, dashboard, histórico, FX, Redis/KV ou rate limit global.
- Registrar secrets, dados pessoais ou payload financeiro nas evidências.

## Dependências

- `008-01` a `008-05` e `008-07` concluídas e revisadas.
- Secrets local/preview disponíveis somente para checkpoint autorizado.
- Fakes e fixtures cobrindo provider sem chamadas reais em CI.

## Arquivos e símbolos prováveis

- `docs/specs/008-quotes-brapi.md`.
- `docs/tasks/008-quotes-brapi/008-00-overview.md` e este arquivo.
- `tests/*quotes*`, `scripts/*quote*`, se criados nas subtarefas.
- `package.json`, `.env.example`, `src/proxy.ts` e bundle `.next` somente para
  inspeção.
- Evidências sanitizadas sob `docs/tasks/008-quotes-brapi/evidences/` somente
  se uma evidência for realmente necessária.

## Passos de implementação/validação

1. Executar testes de domínio, adapter, service e route com provider fake.
2. Executar regressão do Emulator Rules, mesmo sem alteração de Rules.
3. Executar gates técnicos na ordem documentada.
4. Inspecionar que `firebase-admin` e env server-only não entram em client
   bundle; confirmar ausência de `NEXT_PUBLIC_BRAPI_*`.
5. Smoke: login, catálogo, quote B3/BRL suportada, unsupported, unavailable,
   stale/retry, cross-user, teclado/mobile e ledger durante indisponibilidade.
6. Registrar resultado real, divergências e riscos; não marcar concluído diante
   de falha não explicada.
7. Atualizar overview para `completed` e checklist 7/7 somente após todas as
   subtarefas e evidências passarem.

## Testes e comandos de validação

```bash
npm run test:domain
JAVA_HOME=$(/usr/libexec/java_home -v 21) npm run test:rules
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
git diff --check
```

Smoke não usa produção nem dados pessoais. Se `/usr/libexec/java_home` não
existir no ambiente, registrar aviso concreto e executar Rules com Java
disponível, seguindo precedente da 007.

## Definição de pronto

- Testes e gates passam ou falhas estão explicitamente registradas com impacto.
- Auth/ownership, precisão, stale, timeout, retry, dedup, partial failure e
  sanitização têm evidência.
- Ledger funciona com BRAPI indisponível e nenhuma persistência/migração nova
  foi criada.
- Overview tem exatamente sete itens, todos `[x]`, e progresso `7/7` somente
  quando isso for verdade.
- Handoff 009/010/012 e rollback estão documentados.

## Riscos e cuidados

- Não declarar smoke manual executado sem confirmação/evidência autorizada.
- Não armazenar token, chave, UID, payload BRAPI completo, preço pessoal ou
  patrimônio em logs/evidências.
- Rollback de código não revoga segredo comprometido; incluir rotação de keys.
- Não transformar aprovação dos gates em autorização para implementar fases
  posteriores.

## Execução

- **Status:** `completed`; os gates automatizados passaram e a validação manual
  autenticada foi confirmada como ok pelo solicitante.
- **Arquivos alterados:** este arquivo,
  `docs/tasks/008-quotes-brapi/008-00-overview.md` e
  `docs/specs/008-quotes-brapi.md`. Nenhum arquivo de código, Rules, índice ou
  configuração de deploy foi alterado.
- **Decisões e desvios:** a subtarefa foi selecionada explicitamente pelo
  caminho informado. A spec, o overview e as sete subtarefas usam o ticker
  `008`; o overview mantém uma única seção `## Checklist` com sete itens. As
  dependências `008-01` a `008-05` e `008-07` estavam concluídas. Não houve
  chamada real à BRAPI, deploy, seed, Console ou uso de dados pessoais.
- **Comandos executados, na ordem:**

  ```bash
  npm run test:domain
  npm run test:quotes-adapter
  npm run test:quotes-service
  npm run test:quotes-route
  JAVA_HOME=$(/usr/libexec/java_home -v 21) npm run test:rules
  npm run lint
  npm exec next typegen
  npx tsc --noEmit
  npm run build
  git diff --check
  ```

- **Resultados e evidências:** domínio **6/6**, adapter **7/7**, serviço
  **8/8**, route/boundary **8/8** e Rules Emulator **13/13** passaram. O
  comando documentado de Rules emitiu o aviso esperado porque
  `/usr/libexec/java_home` não existe neste Linux, mas executou com Java
  disponível (OpenJDK 21). Lint, Next typegen, TypeScript, build e diff check
  passaram. O build confirmou `/api/quotes` em runtime Node dinâmico. A
  inspeção dos componentes client, do cliente de Quotes e de
  `.next/static/chunks` não encontrou `firebase-admin`, `BRAPI_API_KEY`,
  credenciais Admin, `NEXT_PUBLIC_BRAPI` ou `brapi.dev`; a ocorrência
  server-side ficou restrita ao bundle server. A rota usa URL fixa e
  Authorization no servidor, o ledger não importa Quotes nem chama
  `/api/quotes`, e não há coleção Quote/ProviderMapping ou alteração de
  Rules/index.
- **Smoke manual:** a validação manual autenticada foi confirmada como ok pelo
  solicitante, cobrindo o checkpoint final de login, catálogo com quote B3/BRL,
  unsupported, unavailable, stale/retry, cross-user, teclado/mobile e ledger
  durante indisponibilidade. Nenhum UID, token, payload financeiro ou dado
  pessoal foi registrado nesta evidência.
- **Rollout, rollback e handoff:** rollout futuro permanece limitado a local ou
  preview com secrets server-only, validação por fakes antes de provider real e
  sem deploy nesta fase. Rollback remove route/UI/serviço e desabilita secrets;
  não toca Assets, Transactions ou Rules. Suspeita de vazamento exige rotação
  da chave BRAPI e das credenciais Admin, pois rollback de código não basta.
  Para **009**, Position deve derivar de `Transaction + Asset + Quote`, com o
  ledger como fonte da verdade; **010** deve reutilizar o contrato e distinguir
  stale de valor atual; **012** deve materializar histórico explicitamente, sem
  tratar o cache 008 como histórico.
- **Riscos residuais:** `.env.local` e `firebase-adminsdk-keys.json` existem
  somente como artefatos ignorados locais e não foram lidos nem incluídos nas
  evidências; devem permanecer fora de commit e bundle. O cache continua
  process-local e sem rate limit distribuído. A validação manual foi confirmada;
  permanecem apenas os riscos operacionais já documentados, sem bloqueio para o
  handoff.
