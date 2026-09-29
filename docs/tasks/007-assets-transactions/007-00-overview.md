# 007 — Assets & Transactions

- **Status geral:** `in_progress`
- **Ticker:** `007`
- **Spec:** [007-assets-transactions.md](../../specs/007-assets-transactions.md)
- **Progresso:** 5/8 subtarefas concluídas

## Objetivo

Adicionar catálogo privado de Assets e ledger owner-scoped de operações `buy` e
`sell`, preservando Portfolio por archive antes de abrir qualquer Transaction.
Não calcular posições, saldo, patrimônio, cotação, FX ou performance.

## Checklist

- [x] [007-01-implementar-archive-e-gate-de-lifecycle.md](007-01-implementar-archive-e-gate-de-lifecycle.md)
- [x] [007-02-fechar-contratos-e-reducer-decimal.md](007-02-fechar-contratos-e-reducer-decimal.md)
- [x] [007-03-implementar-persistencia-de-assets.md](007-03-implementar-persistencia-de-assets.md)
- [x] [007-04-implementar-persistencia-de-transactions.md](007-04-implementar-persistencia-de-transactions.md)
- [x] [007-05-abrir-rules-e-testes-do-emulator.md](007-05-abrir-rules-e-testes-do-emulator.md)
- [ ] [007-06-implementar-catalogo-de-assets.md](007-06-implementar-catalogo-de-assets.md)
- [ ] [007-07-implementar-ledger-e-ux-de-transactions.md](007-07-implementar-ledger-e-ux-de-transactions.md)
- [ ] [007-08-executar-gates-e-handoff.md](007-08-executar-gates-e-handoff.md)

## Observações

- Gate bloqueante: 007-01 precisa remover `deletePortfolio`, retirar
  `allow delete` das Rules e provar no Emulator que delete físico falha antes de
  qualquer write de Transaction ser liberado. 007-01 concluída: archive/restore,
  compatibilidade legada, listagens separadas e delete negado passaram em 7
  testes do Emulator; Assets/Transactions continuam fechados.
- Asset é user-scoped e compartilhável entre Portfolios; Transaction é filho de
  Portfolio. Documentos principais usam auto IDs; registry técnico garante
  identidade Asset única e não aparece na UI.
- V1 persiste somente `buy`/`sell`. Custos, impostos, caixa, Position, Quotes,
  FX, snapshots e performance ficam para fases posteriores.
- Reducer/repository protege quantidade não negativa; Security Rules validam
  ownership/schema/referências, mas não conseguem agregar ledger contra SDK
  direto. Garantia forte exigirá boundary server/aggregate futura.
- 007-02 concluída: contratos V1, decimais canônicos, TimestampParts, ordenação
  total e reducer `bigint` passaram nos testes puros e gates técnicos; parser,
  persistência, Rules abertas e UI permanecem nas próximas subtarefas.
- 007-03 concluída: paths, parser/converter fechados, registry somente com
  `assetId`, criação atômica owner-scoped e listagem com validação bidirecional
  passaram nos gates técnicos; Rules e testes Emulator específicos de Asset
  permanecem para 007-05.
- 007-04 concluída: parser/converter fechados, repository append-only com
  idempotência por ID, validação de venda com reducer, archive gate, ordenação
  determinística e marcador de concorrência em `Portfolio.updatedAt` passaram
  nos gates técnicos e em revisão independente. O ledger completo ainda é
  consultado fora do read set de query do SDK Web; Rules, testes Emulator
  específicos de ownership/append-only/concorrência e o risco de SDK direto
  permanecem para 007-05.
- 007-05 concluída: Rules de Asset, registry e Transaction abertas com schema
  fechado, ownership, vínculo atômico, `exists`, `getAfter`, archive gate e
  append-only; Emulator passou em 13 testes. Sell schema-válido direto continua
  sendo limite deliberado das Rules, coberto pelo reducer/repository.
- Nenhuma operação produtiva, deploy, seed ou mudança de Console faz parte deste
  planejamento.
