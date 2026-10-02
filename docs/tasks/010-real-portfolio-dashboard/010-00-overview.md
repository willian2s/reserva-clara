# 010 — Real Portfolio Dashboard

- **Status geral:** in_progress
- **Spec:** [010-real-portfolio-dashboard.md](../../specs/010-real-portfolio-dashboard.md)
- **Progresso:** 1/7 subtarefas concluídas

## Objetivo

Entregar dashboards global e por carteira sobre o ledger, Positions e Quotes já
existentes, com totais conhecidos honestos, estados parciais explícitos,
atualização manual e nenhuma fonte patrimonial paralela.

## Checklist

- [x] [010-01-fechar-contratos-e-semantica.md](010-01-fechar-contratos-e-semantica.md)
- [ ] [010-02-refatorar-projecao-de-carteira.md](010-02-refatorar-projecao-de-carteira.md)
- [ ] [010-03-compor-read-side-global.md](010-03-compor-read-side-global.md)
- [ ] [010-04-criar-apresentacao-patrimonial.md](010-04-criar-apresentacao-patrimonial.md)
- [ ] [010-05-entregar-dashboard-da-carteira.md](010-05-entregar-dashboard-da-carteira.md)
- [ ] [010-06-entregar-dashboard-global.md](010-06-entregar-dashboard-global.md)
- [ ] [010-07-validar-gates-e-handoff.md](010-07-validar-gates-e-handoff.md)

## Observações

- Dependências: fases 007, 008 e 009 concluídas; 010 deve consumir o read-side
  existente sem persistir Position ou alterar o ledger.
- O consolidado inclui somente carteiras ativas. Arquivadas permanecem
  consultáveis no detalhe e são marcadas como read-only.
- Quote stale é valorizável com aviso; unavailable e moeda incompatível ficam
  fora dos totais, que passam a ser explicitamente conhecidos/parciais.
- Não há migration, mudança de Rules, índice, secret, deploy, target allocation,
  histórico, FX ou read model persistido nesta fase.
