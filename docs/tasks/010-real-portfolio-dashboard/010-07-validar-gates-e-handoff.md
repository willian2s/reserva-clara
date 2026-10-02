# 010-07 — Validar gates e handoff

- **Ticker:** `010`
- **Número:** `07`
- **Status:** `pending`

## Objetivo e resultado esperado

Fechar a fase 010 com evidência dos testes, gates técnicos, smoke funcional,
boundaries preservados e handoff explícito para planejamento, histórico, FX,
trusted boundary e performance.

## Requisitos cobertos

- Critérios 47–50 e todos os invariantes/boundaries da spec 010.
- Checkpoints, rollout, rollback, riscos residuais e handoffs.

## Escopo incluído

- Executar testes novos de summary/read-side e regressões existentes.
- Executar Rules Emulator mesmo sem mudança de Rules.
- Executar lint, typegen, TypeScript, build e diff check.
- Fazer smoke manual estruturado dos dois dashboards.
- Inspecionar imports client/server, bundle, schema, Rules, índices e secrets.
- Confirmar ausência de logs com dados financeiros e persistência derivada.
- Registrar resultados concretos e atualizar spec/overview após evidência.

## Escopo excluído

- Deploy, smoke produtivo, seed, migration, Console ou mudança de Rules.
- Corrigir problemas criando cache persistido, FX ou funcionalidade de fase
  posterior.
- Marcar conclusão sem testes e smoke executados.

## Dependências

- 010-01 a 010-06 concluídas e revisadas.
- Java compatível para Firestore Emulator.
- Environment local somente se o smoke autenticado exigir; nunca versionar
  `.env.local` nem registrar seus valores.

## Arquivos e símbolos prováveis

- `docs/specs/010-real-portfolio-dashboard.md`.
- `docs/tasks/010-real-portfolio-dashboard/010-00-overview.md` e subtarefas.
- `tests/dashboard-read.test.mjs`, testes de Position/Quotes/Rules.
- `package.json`, scripts novos e módulos `src/data/positions/*`.
- componentes/rotas dos dashboards para inspeção final.

## Passos de implementação/validação

1. Executar testes novos e regressões com fixtures sintéticas.
2. Executar Rules Emulator e gates técnicos na ordem documentada.
3. Fazer smoke da matriz de empty/complete/partial/stale/error/archive/refresh.
4. Validar teclado, foco, anúncios, zoom 200%, 320 px e desktop.
5. Inspecionar que componentes não recalculam valores e client não importa
   Admin SDK, BRAPI server adapter ou segredo.
6. Confirmar nenhuma coleção/index/migration/Rule/secret/dependência pesada.
7. Confirmar que arquivadas ficam fora do global e unavailable nunca vira zero.
8. Registrar comandos, resultados, desvios e riscos residuais sanitizados.
9. Atualizar checklist para `7/7` e status `completed` somente com evidência.

## Testes e comandos de validação

```bash
npm run test:domain
npm run test:positions
npm run test:positions-read
npm run test:dashboard-read
npm run test:quotes-adapter
npm run test:quotes-service
npm run test:quotes-route
npm run test:rules
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
git diff --check
```

## Definição de pronto

- Testes novos, regressões e gates passam ou têm bloqueio concreto registrado.
- Smoke dos dois dashboards cobre os estados e viewport definidos.
- Ledger, Quotes, archive, auth e Rules permanecem compatíveis.
- Não há persistência derivada, FX, target, histórico ou segredo no client.
- Overview possui exatamente sete itens `[x]` e progresso `7/7` somente após a
  conclusão real das sete subtarefas.
- Handoff e riscos residuais para 011/012/017/020/021 estão registrados.

## Riscos e cuidados

- Não registrar UID, token, patrimônio, quantidade, preço ou payload de ledger.
- Não tratar build como teste de acessibilidade/interação.
- Não tratar AuthGate como autorização ou testes de domínio como prova de Rules.
- Se custo de leitura bloquear, encaminhar para 021 sem persistir atalho.
- Se documentação Next local continuar ausente, registrar o fato e não inferir
  APIs novas sem verificar a versão instalada por fonte confiável.
