# 005-07 — Configurar Emulator e testes de Rules

- **Ticker:** `005`
- **Número:** `07`
- **Status:** `pending`

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
