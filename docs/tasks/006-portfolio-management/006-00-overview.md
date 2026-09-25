# 006 — Portfolio Management

- **Status geral:** `in_progress`
- **Spec:** [006-portfolio-management.md](../../specs/006-portfolio-management.md)
- **Progresso:** 6/9 subtarefas concluídas

## Objetivo

Entregar experiência owner-scoped de Portfolio sobre contratos e repository da
fase 005: listar/criar em `/portfolios`, abrir contexto patrimonial em
`/portfolios/[portfolioId]` e administrar rename/delete em
`/portfolios/[portfolioId]/settings`, sem dados financeiros calculados e sem
antecipar a fase 007.

## Checklist

- [x] [006-01-estruturar-shell-auth-e-navegacao.md](006-01-estruturar-shell-auth-e-navegacao.md)
- [x] [006-02-implementar-listagem-e-criacao.md](006-02-implementar-listagem-e-criacao.md)
- [x] [006-03-implementar-detalhe-e-acesso.md](006-03-implementar-detalhe-e-acesso.md)
- [x] [006-04-implementar-renomeacao.md](006-04-implementar-renomeacao.md)
- [x] [006-05-implementar-exclusao-segura.md](006-05-implementar-exclusao-segura.md)
- [ ] [006-06-validar-regras-e-isolamento.md](006-06-validar-regras-e-isolamento.md)
- [ ] [006-07-validar-acessibilidade-e-responsividade.md](006-07-validar-acessibilidade-e-responsividade.md)
- [ ] [006-08-executar-gates-deploy-e-smoke.md](006-08-executar-gates-deploy-e-smoke.md)
- [x] [006-09-customizar-pagina-404.md](006-09-customizar-pagina-404.md)

## Observações

- Rotas canônicas: `/portfolios`, `/portfolios/[portfolioId]` e
  `/portfolios/[portfolioId]/settings`; `/portfolios` lista/cria, detalhe mostra
  contexto patrimonial e settings concentra administração. `/dashboard` aponta
  para a coleção sem duplicar listagem.
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
- Alterações de rotas/layouts seguem documentação local Next 16 lida antes da
  implementação; parâmetros dinâmicos permanecem para subtarefas posteriores.
- 006-01 concluída: AuthGate, grupo protegido, shell, CTA de Dashboard e bridge
  de `/portfolios` implementados; gates técnicos passaram e revisão independente
  não encontrou bloqueadores.
- 006-02 concluída: listagem owner-scoped, empty state, criação BRL, retry,
  reconciliação e gates técnicos implementados; revisão independente não encontrou
  bloqueadores.
- 006-09 concluída: 404 global customizada usa classificação de host compartilhada
  e retorno host-aware; renderização por requisição foi documentada como trade-off
  aceito por ser fluxo excepcional.
- 006-03 concluída: detalhe dinâmico owner-scoped, estados de loading e
  indisponibilidade unificados, retry, retorno e links acessíveis da listagem;
  gates técnicos e Rules Emulator passaram. Validação manual permanece pendente.
- 006-04 concluída e revisada após mudança de UX: rename foi removido do detalhe
  e movido exclusivamente para settings; detalhe oferece link explícito e
  acessível para configurações. Settings reutiliza parser/repository da fase 005,
  evita write quando nome normalizado não muda, preserva draft durante loading,
  bloqueia concorrência, sanitiza falhas e atualiza estado com retorno do update.
  Hook compartilhado mantém leitura owner-scoped, loading, indisponibilidade e
  retry sem duplicar contrato. Gates técnicos e Rules Emulator passaram; validação
  manual da nova rota foi confirmada pelo usuário; casos específicos não foram
  discriminados no relato.
- 006-05 concluída: exclusão existe somente em settings com confirmação inline
  em duas etapas, digitação exata do nome normalizado, foco e feedback acessíveis,
  bloqueio de concorrência, retry sanitizado e `router.replace("/portfolios")`.
  `deletePortfolio` remove somente o documento pai; nenhuma operação de
  subcoleção, cascade ou Transaction foi adicionada. Hard delete permanece válido
  somente antes de filhos; archive e remoção futura de `allow delete` continuam
  gate bloqueante de 007. Revisão independente corrigiu confirmação stale em
  troca de rota e trigger reabrível. Validação manual autenticada permanece
  confirmada pelo usuário como funcionando; casos individuais não foram
  discriminados no relato.
- Usuário confirmou validação manual bem-sucedida de settings; casos específicos
  e matriz completa de hosts/assets não foram discriminados no relato.
