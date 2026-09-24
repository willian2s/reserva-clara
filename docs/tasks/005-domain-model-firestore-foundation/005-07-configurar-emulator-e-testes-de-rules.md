# 005-07 — Configurar Emulator e testes de Rules

- **Ticker:** `005`
- **Número:** `07`
- **Status:** `completed`

## Objetivo

Criar execução local reproduzível para Rules, sem atingir Firestore real e sem
introduzir test runner genérico desnecessário.

## Resultado esperado

Emulator Suite carrega Rules versionadas e testes cobrem isolamento, anônimo,
schema e default deny com fixtures fictícias.

## Requisitos cobertos

- forma atual recomendada pelo Firebase para testar Rules;
- projeto local isolado;
- casos A/B/anônimo e documento inválido;
- nenhum seed automático produtivo.

## Escopo incluído

- configuração mínima de Firestore Emulator em `firebase.json`;
- projeto demo/emulator sem project ID produtivo em fixtures;
- `@firebase/rules-unit-testing` se necessário para contextos Auth;
- runner nativo `node:test` ou menor alternativa documentada;
- fixtures mínimas `user-a`, `user-b`, Portfolio sintético;
- comando único para executar e encerrar emulator;
- prova de todos os casos da spec e regressão do schema.

## Escopo excluído

- autenticação Google real ou conta pessoal;
- conexão com database produtivo;
- seed/deploy em produção;
- testes de UI, BRAPI, posições ou Transaction;
- `firestore.indexes.json` sem query real.

## Dependências

- 005-06 Rules compiláveis;
- Firebase CLI/Emulator Suite disponível conforme aprovação de execução;
- eventual dependência oficial e lockfile, sem instalação nesta etapa de plano.

## Arquivos e símbolos prováveis

- `firebase.json`;
- `tests/firestore.rules.test.mjs` ou equivalente;
- `firestore.rules`;
- `package.json` scripts de Rules, somente em execução futura;
- `package-lock.json`, somente se dependência for aprovada.

## Passos de implementação futura

1. Confirmar versões atuais de CLI e Rules Unit Testing docs.
2. Configurar somente emulator Firestore e Rules em `firebase.json`.
3. Escolher Node `node:test` para evitar framework maior, ou documentar motivo
   concreto se runner diferente for indispensável.
4. Criar contextos autenticados sintéticos A/B e contexto anônimo.
5. Testar allow/deny, schema, timestamps, query e paths futuros.
6. Rodar via `emulators:exec`, garantindo cleanup e exit code propagado.
7. Guardar evidência sanitizada de resultado.

## Testes e comandos de validação

```bash
firebase emulators:exec --only firestore "node --test tests/firestore.rules.test.mjs"
```

Também executar os gates do repositório após qualquer alteração TypeScript:

```bash
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
```

## Definição de pronto

- comando reproduzível passa em máquina limpa com dependências declaradas;
- A próprio permitido, A→B negado, anônimo negado;
- inválido/campo extra/path futuro negado;
- fixtures não contêm patrimônio pessoal;
- nenhum request alcança production Firebase;
- resultado registrado antes de 005-08.

## Riscos e cuidados

- Não usar `withSecurityRulesDisabled` para provar autorização; usar somente
  setup/fixtures.
- Não apontar projeto demo para credenciais ou database real.
- Emulator verde não prova Rules publicadas; separar evidência.
- Se dependência ou CLI não puder ser instalada, manter task bloqueada e
  registrar erro concreto, sem marcar checklist.

## Execução e evidências

- **Data:** 2026-09-24.
- **Implementado:** `firebase.json` configura somente Firestore Emulator na
  porta 8080 e carrega `firestore.rules`; `.firebaserc` aponta exclusivamente
  para o projeto demo `demo-reserva-clara`. Nenhum projeto produtivo aparece na
  configuração.
- **Dependências:** `@firebase/rules-unit-testing@5.0.2` e
  `firebase-tools@15.31.0` são dependências de desenvolvimento. O runner usa
  somente `node:test`; não foi introduzido framework genérico.
- **Cobertura:** testes exercitam CRUD owner, leitura/listagem owner-scoped,
  isolamento `user-a`/`user-b`, anônimo, campos ausentes/extras, moeda inválida,
  timestamp de cliente/tipo inválido, `createdAt` mutável, `updatedAt` sem
  server timestamp, update cross-user, nome em branco, namespace raiz, `assets`,
  `goals`, `emergencyReserve`, `transactions`, `allocationTargets`, `snapshots`
  e caminho desconhecido. Nenhum teste usa `withSecurityRulesDisabled`.
- **Execução:** com JDK 21, `JAVA_HOME=$(/usr/libexec/java_home -v 21)
  npm run test:rules` executa
  `firebase emulators:exec --project demo-reserva-clara --only firestore
  "node --test tests/firestore.rules.test.mjs"`, propagando falhas e
  encerrando o Emulator Suite. O teste limpa fixtures antes/depois e chama
  `cleanup()` do ambiente mesmo quando a limpeza final falha.
- **Resultado:** comando Rules passou com 5 testes e 0 falhas; somente emulator
  local foi acessado. `npm run lint`, `npm exec next typegen`, `npx tsc
  --noEmit` e `npm run build` também passaram após a alteração.

## Arquivos alterados

- `.gitignore`
- `.firebaserc`
- `firebase.json`
- `package.json`
- `package-lock.json`
- `tests/firestore.rules.test.mjs`
- `docs/tasks/005-domain-model-firestore-foundation/005-07-configurar-emulator-e-testes-de-rules.md`

## Decisões e desvios

- O projeto demo é fixo e explícito no script e no `.firebaserc`, evitando
  qualquer fallback para o projeto usado pelo Auth.
- `firebase-tools@15.31.0` foi fixado após disponibilização de JDK 21 para o
  Emulator; Expo/React Native pode continuar usando JDK 17 em comandos próprios.
- `firestore-debug.log` passou a ser ignorado e removido do versionamento, pois
  é artefato gerado pelo Emulator.
- Não foi criado `firestore.indexes.json`, pois testes usam somente caminhos e
  listagem sem query composta. `firestore.rules` não precisou de alteração.

## Riscos residuais e bloqueios

- Emulator verde não comprova Rules publicadas nem autoriza conexão com banco
  real. `005-08` continua bloqueada até checkpoint humano de região/ativação;
  `005-09` continua bloqueada até publicação aprovada e smoke sintético.
- `npm audit --omit=optional` reporta 5 vulnerabilidades moderadas transitivas
  no tooling (`@opentelemetry/core`, `@google-cloud/pubsub`, `gaxios` e
  `uuid`); `npm audit --omit=dev` não reporta vulnerabilidades de produção.
  Não foram aplicadas atualizações forçadas fora do escopo.
