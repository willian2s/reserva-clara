# 012 — Product, UX/UI, Information Architecture & Provisional API Discovery

- **Status geral:** pending
- **Spec:** [012-product-ux-ui-ia-api-discovery.md](../../specs/012-product-ux-ui-ia-api-discovery.md)
- **Progresso:** 6/13 subtarefas concluídas

## Objetivo

Revisar produto, jornadas, UX/UI, arquitetura da informação e arquitetura
frontend do Reserva Clara antes de congelar capacidades e contratos das
verticais da migração, preservando os invariantes patrimoniais e produzindo um
handoff verificável para 013–019.

## Checklist

- [x] [012-01-confirmar-gate-e-escopo.md](012-01-confirmar-gate-e-escopo.md)
- [x] [012-02-mapear-jornadas-e-problemas-de-produto.md](012-02-mapear-jornadas-e-problemas-de-produto.md)
- [x] [012-03-definir-ia-navegacao-e-shell.md](012-03-definir-ia-navegacao-e-shell.md)
- [x] [012-04-definir-estados-sessao-e-recovery.md](012-04-definir-estados-sessao-e-recovery.md)
- [x] [012-05-auditar-acessibilidade-densidade-e-microcopy.md](012-05-auditar-acessibilidade-densidade-e-microcopy.md)
- [x] [012-06-revisar-design-system-e-componentes.md](012-06-revisar-design-system-e-componentes.md)
- [ ] [012-07-prototipar-e-freezar-portfolio.md](012-07-prototipar-e-freezar-portfolio.md)
- [ ] [012-08-decidir-lifecycle-de-asset.md](012-08-decidir-lifecycle-de-asset.md)
- [ ] [012-09-prototipar-transaction-e-ledger.md](012-09-prototipar-transaction-e-ledger.md)
- [ ] [012-10-prototipar-quotes-valuation-e-dashboard.md](012-10-prototipar-quotes-valuation-e-dashboard.md)
- [ ] [012-11-realizar-spike-frontend-e-data-layer.md](012-11-realizar-spike-frontend-e-data-layer.md)
- [ ] [012-12-mapear-api-provisoria-e-compatibilidade.md](012-12-mapear-api-provisoria-e-compatibilidade.md)
- [ ] [012-13-consolidar-freezes-e-handoff.md](012-13-consolidar-freezes-e-handoff.md)

## Observações

- O aceite independente de C1 está registrado; UX-01 foi executado em `012-02`
  com dados sintéticos e sem writes patrimoniais.
- C0 permanece limitado a dev/testes e dados sintéticos/descartáveis; não há
  implementação de Vite, .NET, banco, migration, endpoint ou deploy nesta fase.
- Contratos HTTP são provisórios e congelam por slice apenas após protótipo,
  estados críticos e aceite de acessibilidade/responsividade.
- `012-01` está `completed`: C1 foi aceito formalmente em 2026-10-07 por
  revisão independente do subagente `review`, com C0 restrito a dev/testes e
  dados sintéticos/descartáveis.
- `012-02` está `completed`: UX-01 foi documentado com fixtures sintéticas,
  walkthroughs heurísticos e decisão de Carteiras como entrada principal;
  dashboard permanece como Visão geral. A subtarefa seguinte não foi iniciada
  automaticamente.
- `012-03` está `completed`: a IA conceitual promove Carteiras a entrada
  autenticada, mantém Visão geral como consolidado e documenta shell, deep links,
  history, foco, filtros, 404, retorno pós-login e host policy separada de
  autorização. O walkthrough mínimo foi exercitado no protótipo standalone,
  sem avançar automaticamente para a subtarefa seguinte.
- `012-04` está `completed`: a taxonomia transversal e o fluxo de sessão/recovery
  documentam último dado válido, refresh único, retry idempotente, não repetição
  cega de writes, signOut, usuário desabilitado, offline, conflito, resultado
  desconhecido, foco, copy e retorno interno sem loop. O tabletop foi documental,
  com fixtures sintéticas, sem alterar código ou avançar automaticamente.
- `012-05` está `completed`: a auditoria documental produziu matriz WCAG com 15
  achados priorizados, fixtures sintéticas, critérios observáveis para teclado,
  foco, leitor de tela, contraste, 320 px e zoom de 200%, além de glossário
  financeiro aprovado. Validação manual de runtime permanece requisito dos
  protótipos 013/017–019; a subtarefa seguinte não foi iniciada automaticamente.
- `012-06` está `completed`: o inventário e a decisão documental de design system
  cobrem tokens, primitives, estados, componentes financeiros, boundaries de UI,
  critérios de reuso e lacunas para 013/017/018/019. A revisão independente foi
  aprovada; não houve alteração de produção, escolha de biblioteca por hábito ou
  avanço automático para 012-07.
