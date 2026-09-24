# 006 — Portfolio Management

- **Status geral:** `pending`
- **Spec:** [006-portfolio-management.md](../../specs/006-portfolio-management.md)
- **Progresso:** 0/8 subtarefas concluídas

## Objetivo

Entregar experiência owner-scoped de Portfolio sobre contratos e repository da
fase 005: listar, criar, abrir, renomear e excluir carteiras, sem dados
financeiros calculados e sem antecipar a fase 007.

## Checklist

- [ ] [006-01-estruturar-shell-auth-e-navegacao.md](006-01-estruturar-shell-auth-e-navegacao.md)
- [ ] [006-02-implementar-listagem-e-criacao.md](006-02-implementar-listagem-e-criacao.md)
- [ ] [006-03-implementar-detalhe-e-acesso.md](006-03-implementar-detalhe-e-acesso.md)
- [ ] [006-04-implementar-renomeacao.md](006-04-implementar-renomeacao.md)
- [ ] [006-05-implementar-exclusao-segura.md](006-05-implementar-exclusao-segura.md)
- [ ] [006-06-validar-regras-e-isolamento.md](006-06-validar-regras-e-isolamento.md)
- [ ] [006-07-validar-acessibilidade-e-responsividade.md](006-07-validar-acessibilidade-e-responsividade.md)
- [ ] [006-08-executar-gates-deploy-e-smoke.md](006-08-executar-gates-deploy-e-smoke.md)

## Observações

- Rotas canônicas: `/portfolios` e `/portfolios/[portfolioId]`; `/dashboard`
  aponta para a coleção sem duplicar listagem.
- AuthGate compartilhado será somente UX; Firestore Rules continuam autorização.
- Fetch V1 é one-shot. Não adicionar React Query, SWR, Redux, Zustand ou
  listener realtime sem requisito novo.
- Schema `Portfolio`, converter, parser, repository e Rules da fase 005 devem ser
  reutilizados. Nenhuma alteração de Rules/schema é esperada.
- Hard delete vale somente enquanto não existem subcoleções. Política futura
  escolhida: archive; até sua implementação, delete com filhos deve ser
  rejeitado antes de abrir Transactions em 007.
- Pré-condição bloqueante de 007: nenhum write de Transaction pode ser aberto
  enquanto archive não estiver implementado, `allow delete` não for removido
  das Rules e teste negativo do Emulator não comprovar delete físico negado.
- Execução futura exige leitura da documentação local Next 16 antes de alterar
  rotas/layouts/parâmetros dinâmicos. Esta execução criou somente documentação.
