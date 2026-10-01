# 009-06 — Validar gates e handoff

- **Ticker:** `009`
- **Número:** `06`
- **Status:** `pending`

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
