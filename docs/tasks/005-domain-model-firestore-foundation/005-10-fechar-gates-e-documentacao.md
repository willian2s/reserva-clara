# 005-10 — Fechar gates e documentação

- **Ticker:** `005`
- **Número:** `10`
- **Status:** `pending`

## Objetivo

Executar gates finais, revisar fronteiras e consolidar evidências/handoff para
fase 006 sem declarar features fora do escopo.

## Resultado esperado

Spec, overview e tasks refletem estado real; gates técnicos e Rules passam; fase
005 fica concluída somente com todos os checkpoints resolvidos.

## Requisitos cobertos

- lint, typegen, typecheck e build;
- documentação/evidências atualizadas;
- base pronta para 006;
- ausência de UI financeira, seed pessoal, Admin e acesso direto em React;
- checklist/progresso coerentes.

## Escopo incluído

- executar comandos na ordem oficial;
- executar teste de Rules reproduzível;
- verificar imports/boundaries e ausência de Firebase em landing/layout;
- revisar git diff, paths, config, env e arquivos sem secrets;
- registrar resultado, limitações, rollback e handoff 006–014;
- marcar subtarefas `[x]` somente após definição de pronto individual e atualizar
  progresso.

## Escopo excluído

- implementar carteira UI, transação, quote, dashboard ou qualquer fase futura;
- corrigir problemas fora da fase sem task nova;
- criar decisão externa não aprovada;
- commit/push automático.

## Dependências

- 005-01 a 005-09 concluídas ou bloqueios explicitamente aceitos;
- database/Rules status conhecido;
- acesso a comandos npm e emulator.

## Arquivos e símbolos prováveis

- `docs/specs/005-domain-model-firestore-foundation.md`;
- `docs/tasks/005-domain-model-firestore-foundation/005-00-overview.md`;
- subtarefas e evidências da fase;
- `src/domain/*`, `src/data/firestore/*`, `src/lib/firebase/client.ts`;
- `firestore.rules`, `firebase.json`, `.firebaserc`.

## Passos de implementação futura

1. Rodar Rules tests e gates npm na ordem prescrita.
2. Inspecionar diff para confirmar somente escopo aprovado.
3. Conferir links, status, checkboxes e contagem no overview.
4. Atualizar spec com fatos executados e riscos residuais.
5. Registrar ausência de `firestore.indexes.json` como decisão, se aplicável.
6. Preparar handoff: 006 começa pela experiência Portfolio, não por schema novo.
7. Só então marcar fase concluída; sem commit automático.

## Testes e comandos de validação

```bash
firebase emulators:exec --only firestore "node --test tests/firestore.rules.test.mjs"
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
git diff --check
git status --short
```

Substituir path do teste pelo script real aprovado, sem omitir typegen antes do
typecheck.

## Definição de pronto

- todos os gates exigidos passaram ou têm falha/risk explicitamente registrado;
- overview mostra `X/N` igual a itens `[x]`;
- nenhum caminho futuro foi aberto sem schema/teste;
- produção não contém fixture pessoal;
- documentação diferencia pending/blocked/completed;
- handoff 006 descreve contratos e decisão de delete/cascade pendente.

## Riscos e cuidados

- Não marcar subtarefa por intenção ou por configuração de Console não validada.
- Não esconder limitação de browser/Auth em smoke de persistência.
- Não incluir saída de comandos com env/UID/token nas evidências.
- Se gate falhar, manter task `in_progress`/`blocked` e registrar erro concreto;
  não ampliar escopo para “fazer passar”.
