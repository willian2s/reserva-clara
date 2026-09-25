# 007-08 — Executar gates e handoff

- **Ticker:** `007`
- **Número:** `08`
- **Status:** `pending`

## Objetivo

Fechar fase 007 com evidência técnica, Rules, UX e documentação, sem avançar
automaticamente para 008 ou 009.

## Dependências

- 007-01 a 007-07 concluídas e revisadas.
- Revisão independente do diff e dos artefatos SDD disponível.
- Checkpoint humano para qualquer smoke produtivo.

## Escopo

- Executar Rules Emulator, lint, typegen, TypeScript, build e diff check na
  ordem documentada.
- Inspecionar imports, paths, schema, ausência de hard delete e ausência de
  dados/segredos pessoais.
- Validar manualmente archive/restore, Asset, buy/sell, erros, ownership,
  responsividade e acessibilidade em ambiente autorizado.
- Registrar comandos, contagens, evidências sanitizadas, riscos residuais e
  rollback de código/Rules.
- Atualizar spec, overview e subtarefa com status final e handoff explícito.

## Fora de escopo

- Começar fase seguinte, alterar roadmap, criar snapshots/positions ou fazer
  deploy sem aprovação humana.

## Critérios de aceite

- Todos os gates pertinentes passam ou falhas ficam explicitamente registradas.
- Overview chega a 8/8 somente se esta subtarefa e todas anteriores estiverem
  concluídas.
- Nenhuma subtarefa seguinte é iniciada automaticamente.
- Handoff para 008 preserva Asset como identidade e para 009 preserva ledger
  como fonte da verdade.

## Arquivos prováveis

- este arquivo e `007-00-overview.md`
- `docs/specs/007-assets-transactions.md`
- evidências sanitizadas sob `docs/tasks/007-assets-transactions/evidences/`,
  se realmente necessárias

## Validação

```bash
JAVA_HOME=$(/usr/libexec/java_home -v 21) npm run test:rules
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
git diff --check
```

## Registro de execução

- **Arquivos alterados:** preencher ao executar.
- **Decisões/desvios:** preencher após revisão independente.
- **Comandos/resultados/evidências:** preencher sem registrar UID, token ou patrimônio.
- **Riscos residuais:** ledger completo em carteiras grandes, ausência de UI
  automatizada e dependência de checkpoint produtivo.
