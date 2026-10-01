# 009 — Positions & Allocation

- **Status geral:** in_progress
- **Spec:** [009-positions-allocation.md](../../specs/009-positions-allocation.md)
- **Progresso:** 1/6 subtarefas concluídas

## Objetivo

Derivar posições e alocação corrente a partir de Transactions, Assets e Quotes,
com precisão decimal, sem persistir Position como fonte autoritativa e sem
antecipar o dashboard da fase 010.

## Checklist

- [x] [009-01-fechar-contratos-e-politica.md](009-01-fechar-contratos-e-politica.md)
- [ ] [009-02-estender-aritmetica-decimal.md](009-02-estender-aritmetica-decimal.md)
- [ ] [009-03-implementar-position-engine.md](009-03-implementar-position-engine.md)
- [ ] [009-04-implementar-market-position-e-allocation.md](009-04-implementar-market-position-e-allocation.md)
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
