# 012 — Product, UX/UI, Information Architecture & Provisional API Discovery

- **Status geral:** pending
- **Spec:** [012-product-ux-ui-ia-api-discovery.md](../../specs/012-product-ux-ui-ia-api-discovery.md)
- **Progresso:** 0/13 subtarefas concluídas

## Objetivo

Revisar produto, jornadas, UX/UI, arquitetura da informação e arquitetura
frontend do Reserva Clara antes de congelar capacidades e contratos das
verticais da migração, preservando os invariantes patrimoniais e produzindo um
handoff verificável para 013–019.

## Checklist

- [ ] [012-01-confirmar-gate-e-escopo.md](012-01-confirmar-gate-e-escopo.md)
- [ ] [012-02-mapear-jornadas-e-problemas-de-produto.md](012-02-mapear-jornadas-e-problemas-de-produto.md)
- [ ] [012-03-definir-ia-navegacao-e-shell.md](012-03-definir-ia-navegacao-e-shell.md)
- [ ] [012-04-definir-estados-sessao-e-recovery.md](012-04-definir-estados-sessao-e-recovery.md)
- [ ] [012-05-auditar-acessibilidade-densidade-e-microcopy.md](012-05-auditar-acessibilidade-densidade-e-microcopy.md)
- [ ] [012-06-revisar-design-system-e-componentes.md](012-06-revisar-design-system-e-componentes.md)
- [ ] [012-07-prototipar-e-freezar-portfolio.md](012-07-prototipar-e-freezar-portfolio.md)
- [ ] [012-08-decidir-lifecycle-de-asset.md](012-08-decidir-lifecycle-de-asset.md)
- [ ] [012-09-prototipar-transaction-e-ledger.md](012-09-prototipar-transaction-e-ledger.md)
- [ ] [012-10-prototipar-quotes-valuation-e-dashboard.md](012-10-prototipar-quotes-valuation-e-dashboard.md)
- [ ] [012-11-realizar-spike-frontend-e-data-layer.md](012-11-realizar-spike-frontend-e-data-layer.md)
- [ ] [012-12-mapear-api-provisoria-e-compatibilidade.md](012-12-mapear-api-provisoria-e-compatibilidade.md)
- [ ] [012-13-consolidar-freezes-e-handoff.md](012-13-consolidar-freezes-e-handoff.md)

## Observações

- A execução começa por `012-01` somente após o aceite independente de C1.
- C0 permanece limitado a dev/testes e dados sintéticos/descartáveis; não há
  implementação de Vite, .NET, banco, migration, endpoint ou deploy nesta fase.
- Contratos HTTP são provisórios e congelam por slice apenas após protótipo,
  estados críticos e aceite de acessibilidade/responsividade.
- `012-01` está `blocked`: C1 está pronto para revisão independente, mas ainda
  não possui aceite formal. O checklist permanece sem itens concluídos e `012-02`
  só é elegível após a remoção desse bloqueio.
