# 009 — Positions & Allocation

- **Status geral:** completed
- **Spec:** [009-positions-allocation.md](../../specs/009-positions-allocation.md)
- **Progresso:** 6/6 subtarefas concluídas

## Objetivo

Derivar posições e alocação corrente a partir de Transactions, Assets e Quotes,
com precisão decimal, sem persistir Position como fonte autoritativa e sem
antecipar o dashboard da fase 010.

## Checklist

- [x] [009-01-fechar-contratos-e-politica.md](009-01-fechar-contratos-e-politica.md)
- [x] [009-02-estender-aritmetica-decimal.md](009-02-estender-aritmetica-decimal.md)
- [x] [009-03-implementar-position-engine.md](009-03-implementar-position-engine.md)
- [x] [009-04-implementar-market-position-e-allocation.md](009-04-implementar-market-position-e-allocation.md)
- [x] [009-05-compor-read-side-de-carteira.md](009-05-compor-read-side-de-carteira.md)
- [x] [009-06-validar-gates-e-handoff.md](009-06-validar-gates-e-handoff.md)

## Observações

- Dependências: 007 e 008 concluídas; não há mudança prevista em Rules,
  schema, persistência ou secrets.
- Decisões centrais: média ponderada, taxa de compra no custo quando compatível,
  taxa de venda fora do custo, sem FX, stale explícito e unavailable fora do
  denominador.
- O dashboard visual, targets de alocação, histórico e read models persistidos
  permanecem fora desta fase.
- 009-01 concluída: contratos e decisões de Position, Market Position,
  Allocation e read-side foram fechados na spec, sem implementação de reducer,
  aritmética, persistência ou UI. A próxima subtarefa pode implementar a
  aritmética decimal sem decisão matemática bloqueante.
- 009-02 concluída: aritmética racional com `bigint`, produto, divisão,
  subtração assinada, half-up e overflow foram implementados e cobertos pelo
  harness de domínio, preservando o reducer de quantidade. A próxima
  subtarefa pode implementar o Position Engine.
- 009-03 concluída: Position Engine puro exportado pelo domínio, com média
  ponderada, fees, backfill determinístico, agrupamento por `assetId`, erros
  explícitos, zeragem e materialização racional sem persistência. A próxima
  subtarefa pode implementar Market Position e Allocation.
- 009-04 concluída: Market Position e Allocation puros exportados pelo domínio,
  com fresh/stale/unavailable, diferença nominal assinada, moeda-base,
  diagnósticos parciais, ordenação determinística e denominador zero seguro.
  A próxima subtarefa pode compor o read-side da carteira.
- 009-05 concluída: read-side efêmero compõe Portfolio, Transactions, Assets e
  Quotes por dependências injetáveis, deriva Positions antes do provider,
  respeita lotes de 20, preserva posições em falhas sanitizadas e não solicita
  cotação para posições fechadas. Testes, lint, typegen, TypeScript e build
  passaram; a próxima subtarefa pode executar os gates finais e o handoff.
- 009-06 concluída: foi criado o harness dedicado `test:positions` (4 testes),
  além dos testes de domínio (13), read-side (6), Quotes (7/8/8) e Rules
  Emulator (19). Lint, typegen, TypeScript, build e diff check também
  passaram. A inspeção confirmou ausência de persistência Position/Quote,
  índice, migration, segredo ou alteração de UI; os handoffs para
  010/011/012/015/016/017/020/021 estão registrados na spec. A revisão
  independente foi **APROVADA**, sem bloqueadores.
