# 008 — Quotes & BRAPI

- **Status geral:** completed
- **Spec:** [008-quotes-brapi.md](../../specs/008-quotes-brapi.md)
- **Progresso:** 7/7 subtarefas concluídas

## Objetivo

Adicionar cotações BRAPI server-side para Assets suportados, preservando Asset
como identidade, Transaction como ledger e funcionamento do fluxo patrimonial
quando provider estiver indisponível.

## Checklist

- [x] [008-01-fechar-contratos-e-politica.md](008-01-fechar-contratos-e-politica.md)
- [x] [008-02-criar-boundary-server-e-auth.md](008-02-criar-boundary-server-e-auth.md)
- [x] [008-03-implementar-adapter-brapi.md](008-03-implementar-adapter-brapi.md)
- [x] [008-04-implementar-quoteservice-cache.md](008-04-implementar-quoteservice-cache.md)
- [x] [008-05-integrar-cotacoes-na-ui.md](008-05-integrar-cotacoes-na-ui.md)
- [x] [008-06-validar-gates-e-handoff.md](008-06-validar-gates-e-handoff.md)
- [x] [008-07-revisar-linguagem-e-listar-ativos.md](008-07-revisar-linguagem-e-listar-ativos.md)

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
- 008-03 foi concluída com mapping server-side, adapter BRAPI de URL fixa,
  parsing fechado, timeout de 3 segundos, classificação sanitizada e fakes
  para sucesso, ticker alterado, not-found, falhas HTTP, rede, timeout e
  schema inválido. Retry, cache e stale permanecem deliberadamente na 008-04.
- 008-04 foi concluída com QuoteService, cache process-local sem identidade de
  usuário, TTL/stale-if-error, retry único sanitizado, deduplicação, fila de
  upstream, limites e testes determinísticos. Não há bloqueios registrados;
  provider real e smoke produtivo permanecem fora desta subtarefa.
- 008-05 foi concluída com client autenticado same-origin, estados independentes
  de Quote no catálogo, lotes limitados, frescor explícito e retry/refresh manual.
  Os gates automatizados passaram; smoke visual autenticado e validação com
  provider real permanecem para 008-06, sem bloqueio de implementação registrado.
- 008-07 foi concluída ao revisar a linguagem visível da UI e transformar o
  catálogo de ativos em lista, sem alterar contratos ou lógica;
  a 008-06 deve validar o resultado final, sem bloqueio registrado.
- 008-06 executou os testes puros, Rules Emulator, lint, typegen, TypeScript,
  build, diff check e inspeções de boundary/bundle sem falhas; Rules passou com
  13 testes e os testes de Quote passaram com 6 de domínio, 7 de adapter, 8 de
  serviço e 8 de route. O comando documentado de Java emitiu aviso porque
  `/usr/libexec/java_home` não existe neste Linux, mas usou o OpenJDK 21
  disponível. A validação manual autenticada foi confirmada como ok pelo
  solicitante, incluindo o checkpoint de acessibilidade; a subtarefa está
  `completed`, o item está `[x]` e o progresso é `7/7`.
- Rollout futuro de 008 permanece restrito a local/preview com secrets
  server-only e sem deploy nesta fase. Rollback remove route/UI/serviço e
  desabilita secrets sem tocar Assets, Transactions ou Rules; suspeita de
  vazamento exige rotação das chaves. O handoff para 009 deriva Position de
  `Transaction + Asset + Quote`, para 010 reutiliza o contrato distinguindo
  stale de valor atual, e para 012 materializa histórico sem tratar o cache 008
  como histórico.
