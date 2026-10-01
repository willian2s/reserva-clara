# 009 — Positions & Allocation

- **Status geral:** pending
- **Spec:** [009-positions-allocation.md](../../specs/009-positions-allocation.md)
- **Progresso:** 0/6 subtarefas concluídas

## Objetivo

Derivar posições e alocação corrente a partir de Transactions, Assets e Quotes,
com precisão decimal, sem persistir Position como fonte autoritativa e sem
antecipar o dashboard da fase 010.

## Checklist

- [ ] [009-01-fechar-contratos-e-politica.md](009-01-fechar-contratos-e-politica.md)
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
