# 009 — Positions & Allocation

- **Status geral:** in_progress
- **Spec:** [009-positions-allocation.md](../../specs/009-positions-allocation.md)
- **Progresso:** 4/6 subtarefas concluídas

## Objetivo

Derivar posições e alocação corrente a partir de Transactions, Assets e Quotes,
com precisão decimal, sem persistir Position como fonte autoritativa e sem
antecipar o dashboard da fase 010.

## Checklist

- [x] [009-01-fechar-contratos-e-politica.md](009-01-fechar-contratos-e-politica.md)
- [x] [009-02-estender-aritmetica-decimal.md](009-02-estender-aritmetica-decimal.md)
- [x] [009-03-implementar-position-engine.md](009-03-implementar-position-engine.md)
- [x] [009-04-implementar-market-position-e-allocation.md](009-04-implementar-market-position-e-allocation.md)
- [ ] [009-05-compor-read-side-de-carteira.md](009-05-compor-read-side-de-carteira.md)
- [ ] [009-06-validar-gates-e-handoff.md](009-06-validar-gates-e-handoff.md)

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
