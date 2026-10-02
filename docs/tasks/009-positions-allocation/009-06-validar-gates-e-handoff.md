# 009-06 — Validar gates e handoff

- **Ticker:** `009`
- **Número:** `06`
- **Status:** `completed`

## Objetivo e resultado esperado

Fechar a fase 009 com evidência dos contratos, testes de domínio/read-side,
gates técnicos e handoff claro para Dashboard, Contribution Planning, History,
FX, Trusted Boundary e Performance.

## Requisitos cobertos

- Critérios 25–27 da spec 009 e todos os invariantes de fonte da verdade.
- Rollback, ausência de persistência e handoffs da seção final da spec.

## Escopo incluído

- Executar testes de aritmética, Position, Market Position, Allocation e leitor.
- Executar regressão de domínio, Quotes e Rules Emulator.
- Executar lint, typegen, TypeScript, build e diff check.
- Inspecionar bundle client, imports server-only, schema, Rules e índices.
- Registrar resultados sanitizados, riscos residuais e handoff 010/011/012/020/021.
- Atualizar spec/overview somente com execução confirmada.

## Escopo excluído

- Deploy, seed, migração, Console, mudança de Rules ou dados reais.
- Implementar dashboard, target allocation, snapshots, FX ou trusted boundary.
- Marcar subtarefas concluídas sem evidência dos passos anteriores.

## Dependências

- 009-01 a 009-05 revisadas e concluídas.
- Fixtures sintéticas e harnesses de teste disponíveis.
- Java 21 disponível para Rules Emulator, ou aviso concreto registrado.

## Arquivos e símbolos prováveis

- `docs/specs/009-positions-allocation.md`.
- `docs/tasks/009-positions-allocation/009-00-overview.md` e subtarefas.
- `tests/*positions*`, `tests/domain.test.mjs`, `tests/firestore.rules.test.mjs`.
- `package.json`, scripts de teste e `src/data/positions/*`.

## Passos de implementação/validação

1. Executar testes novos e regressões com fixtures sem dados pessoais.
2. Executar Rules Emulator mesmo sem mudança de Rules.
3. Rodar lint, Next typegen, TypeScript, build e diff check na ordem definida.
4. Inspecionar que nenhum módulo client importa Admin SDK, BRAPI ou segredo.
5. Confirmar ausência de coleção Position/Quote, índices, migration e UI de
   dashboard.
6. Registrar falhas concretas, sem declarar sucesso por intenção.
7. Atualizar overview para `completed` e checklist `6/6` somente quando toda a
   evidência existir.

## Testes e comandos de validação

```bash
npm run test:domain
npm run test:positions
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

## Definição de pronto

- Testes de Position/Allocation/read-side e regressões passam.
- Gates técnicos passam, com avisos/falhas residuais documentados.
- Ledger, Quotes e Rules existentes permanecem compatíveis.
- Não existe persistência ou fonte autoritativa derivada.
- Overview tem exatamente seis itens `[x]` e progresso `6/6` somente após
  conclusão real.
- Handoff para 010/011/012/015/016/017/020/021 está registrado.

## Riscos e cuidados

- Não registrar UID, token, patrimônio, preço ou payload financeiro.
- Não tratar teste de domínio como prova de autorização das Rules.
- Não aceitar smoke produtivo ou deploy como necessário para esta fase.
- Se o ledger grande ou custo de leitura bloquear, registrar o limite e
  encaminhar para 021, sem criar read model autoritativo como atalho.

## Execução

- **Arquivos alterados:** `package.json`, `scripts/run-position-tests.mjs`,
  `tests/position.test.mjs`, `docs/specs/009-positions-allocation.md`, este
  arquivo e `docs/tasks/009-positions-allocation/009-00-overview.md`. Nenhum
  arquivo de runtime, Rules, schema, índice, migration ou UI foi alterado.
- **Decisões e desvios:** foi criado o harness dedicado `test:positions`, com
  compilação CommonJS temporária do mesmo conjunto de módulos de domínio e
  quatro testes sintéticos de Position: custo médio/fees e ordenação, zeragem
  sem mutação, agrupamento por Asset e erros de ledger/moeda/saldo. O leitor
  mantém harness próprio em `test:positions-read`. A instrução macOS
  `/usr/libexec/java_home` continua inexistente neste Linux; Java 21 instalado
  foi confirmado e o Rules Emulator passou.
- **Comandos executados:** `npm run test:positions` (4/4), `npm run
  test:domain` (13/13), `npm run test:positions-read` (6/6), `npm run
  test:quotes-adapter` (7/7), `npm run test:quotes-service` (8/8), `npm run
  test:quotes-route` (8/8), `JAVA_HOME=$(/usr/libexec/java_home -v 21) npm
  run test:rules` (19/19), `java -version`, `npm run lint`, `npm exec next
  typegen`, `npx tsc --noEmit`, `npm run build` e `git diff --check`.
- **Resultados e evidências:** todos os testes executáveis passaram; lint,
  typegen, TypeScript, build e diff check passaram sem erros. O Rules Emulator
  executou com Java OpenJDK 21.0.12.1. A inspeção do módulo client e dos
  chunks client gerados não encontrou Admin SDK, BRAPI, `QuoteService` ou
  segredo. `firebase.json` referencia somente `firestore.rules`; não há
  `firestore.indexes.json`, migration ou coleção Position/Quote. O dashboard
  existente aparece no build, mas não houve alteração de UI/rota nesta fase.
  A revisão dos handoffs para 010, 011, 012, 015, 016, 017, 020 e 021 foi
  registrada na spec. A revisão independente retornou **APROVADO**, sem
  bloqueadores; confirmou o ticker, o checklist único `6/6`, as evidências,
  os handoffs e o escopo da alteração.
- **Riscos residuais:** o leitor continua client-only, efêmero e dependente das
  Rules; custo de recomputação de ledger grande segue encaminhado para 021 e a
  garantia forte de escrita para 020. O teste dedicado não altera contratos ou
  comportamento de produção.
