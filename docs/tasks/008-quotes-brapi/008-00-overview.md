# 008 — Quotes & BRAPI

- **Status geral:** in_progress
- **Spec:** [008-quotes-brapi.md](../../specs/008-quotes-brapi.md)
- **Progresso:** 2/6 subtarefas concluídas

## Objetivo

Adicionar cotações BRAPI server-side para Assets suportados, preservando Asset
como identidade, Transaction como ledger e funcionamento do fluxo patrimonial
quando provider estiver indisponível.

## Checklist

- [x] [008-01-fechar-contratos-e-politica.md](008-01-fechar-contratos-e-politica.md)
- [x] [008-02-criar-boundary-server-e-auth.md](008-02-criar-boundary-server-e-auth.md)
- [ ] [008-03-implementar-adapter-brapi.md](008-03-implementar-adapter-brapi.md)
- [ ] [008-04-implementar-quoteservice-cache.md](008-04-implementar-quoteservice-cache.md)
- [ ] [008-05-integrar-cotacoes-na-ui.md](008-05-integrar-cotacoes-na-ui.md)
- [ ] [008-06-validar-gates-e-handoff.md](008-06-validar-gates-e-handoff.md)

## Observações

- Provider mapping fica fora de Asset; nenhuma coleção Quote ou alteração de
  Rules é prevista.
- Boundary usa Firebase ID token verificado por Firebase Admin, sem migração
  completa da autenticação para SSR.
- Cache é efêmero por processo, com stale-if-error; histórico pertence a fase
  posterior.
- 008-01 foi concluída com contrato puro, matriz B3/BRL, política de cache e
  environment server-only documentados. As demais dependem deste contrato
  e/ou módulos anteriores; não há bloqueios registrados.
- 008-02 foi concluída com boundary Node autenticado, reader owner-scoped,
  host público bloqueado e testes com verifier/reader/service fakes. O seam
  `NOT_CONFIGURED` permanece intencionalmente até a implementação do
  QuoteService em 008-04; não é bloqueio para 008-03.
