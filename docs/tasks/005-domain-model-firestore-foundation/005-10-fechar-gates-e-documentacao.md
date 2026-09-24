# 005-10 — Fechar gates e documentação

- **Ticker:** `005`
- **Número:** `10`
- **Status:** `completed`

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

## Execução e evidências

- **Data:** 2026-09-24.
- **Status final:** `completed`; subtarefa concluída sem alteração de código,
  configuração Firebase ou produção nesta execução.
- **Comandos executados, na ordem aprovada:**
  `JAVA_HOME=$(/usr/libexec/java_home -v 21) npm run test:rules`,
  `npm run lint`, `npm exec next typegen`, `npx tsc --noEmit`,
  `npm run build`, `git diff --check` e `git status --short`.
- **Rules:** `npm run test:rules` passou com 5 testes e 0 falhas, usando somente
  projeto demo do Emulator Suite. Mensagens `PERMISSION_DENIED` são tentativas
  negativas esperadas da matriz de Rules; não indicam falha de teste.
- **Gates:** lint, typegen, typecheck e build passaram na ordem prescrita. Build
  gerou rotas existentes sem alteração de UI.
- **Fronteiras:** `src/app` não importa Firebase/Firestore; landing e layouts não
  acessam SDK ou repository. Acesso Firestore permanece em `src/data/firestore`
  e no singleton client existente.
- **Escopo/configuração:** não existe `firestore.indexes.json`; não há UI
  financeira, seed pessoal, Firebase Admin, service account ou secret versionado.
  `.env.local` e logs do Emulator permanecem ignorados.
- **Produção/handoff:** evidências de `005-08` e `005-09` registram database
  configurado, Rules publicadas e smoke sintético owner/anônimo/cross-user com
  fixture removida. Fase 006 começa pela experiência Portfolio usando contratos
  e repository existentes, sem schema novo.

## Arquivos alterados

- `docs/specs/005-domain-model-firestore-foundation.md`
- `docs/tasks/005-domain-model-firestore-foundation/005-00-overview.md`
- `docs/tasks/005-domain-model-firestore-foundation/005-10-fechar-gates-e-documentacao.md`

Nenhum arquivo de aplicação, configuração, Rules, dependência ou evidência
produtiva foi alterado nesta subtarefa.

## Decisões e desvios

- Foi usado o script aprovado `npm run test:rules`, com JDK 21 explícito exigido
  pela Firebase CLI disponível; nenhum fallback produtivo foi usado.
- Não houve desvio de escopo nem correção oportunista. Estado produtivo foi
  consolidado a partir das evidências sanitizadas de `005-08` e `005-09`.
- `firestore.indexes.json` permanece ausente porque nenhuma query composta exige
  índice.

## Riscos residuais e bloqueios

- Smoke produtivo cross-user usou uma conta autorizada contra namespace sintético
  diferente, não duas sessões autenticadas reais; ampliar isso exigiria conta de
  teste adicional e nova evidência.
- Hash remoto das Rules não foi registrado; publicação foi confirmada pelo CLI e
  comportamento foi coberto pelo cliente Web/Emulator.
- Antes de 007, semântica de delete/cascade de Portfolio deve ser revisada ao
  abrir subcoleções filhas. Não há bloqueio para handoff 006.
