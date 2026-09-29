# 007-01 — Implementar archive e gate de lifecycle

- **Ticker:** `007`
- **Número:** `01`
- **Status:** `completed`

## Objetivo

Substituir hard delete de Portfolio por archive reversível e compatível com
documentos legados, fechando gate obrigatório antes de abrir Transactions.

## Dependências

- 006 concluída; `Portfolio`, parser, converter, repository, UI de settings e
  Rules existentes disponíveis.
- Nenhum write de Asset/Transaction deve ser liberado antes desta subtarefa.

## Escopo

- Adicionar `archivedAt: Date | null` ao domínio; ausência no Firestore legado
  vira `null`.
- Implementar `archivePortfolio`, `restorePortfolio` e listagens ativa/arquivada.
- Remover `deletePortfolio` do contrato público e `allow delete` das Rules.
- Substituir ação de settings por archive com confirmação explícita; oferecer
  restore na superfície definida pelo padrão atual sem apagar filhos.
- Manter rename e leitura compatíveis com Portfolio legada.
- Atualizar Rules para aceitar documento antigo sem `archivedAt`, novas escritas
  com `null`/Timestamp e alterações server-side.
- Adicionar testes Emulator para archive, restore, legacy e delete negado.

## Fora de escopo

- Abrir Assets/Transactions nas Rules.
- Migração produtiva, backfill, purge, cascade ou alteração de Console.

## Critérios de aceite

- Nenhum símbolo público de hard delete permanece no fluxo de Portfolio.
- Delete físico falha no Emulator para Portfolio vazia, ativa e arquivada.
- Documento legado lê, lista como ativo e pode ser arquivado/restaurado.
- Archive preserva ID e subcoleções; Transaction futura ficaria bloqueada por
  `archivedAt` não nulo.
- Gates técnicos e Rules existentes passam sem abrir paths futuros.

## Arquivos prováveis

- `src/domain/portfolio.ts`
- `src/data/firestore/portfolio-repository.ts`
- `src/data/firestore/parsers/portfolio-parser.ts`
- `src/data/firestore/converters/portfolio-converter.ts`
- `src/components/portfolio/portfolio-settings.tsx`
- `firestore.rules`
- `tests/firestore.rules.test.mjs`

## Validação

```bash
JAVA_HOME=$(/usr/libexec/java_home -v 21) npm run test:rules
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
git diff --check
```

## Registro de execução

### Arquivos alterados

- `src/domain/portfolio.ts` — `archivedAt: Date | null` e compatibilidade de
  metadata legada.
- `src/data/firestore/parsers/portfolio-parser.ts` — schema novo/legado e
  ausência de `archivedAt` interpretada como `null`.
- `src/data/firestore/converters/portfolio-converter.ts` — persistência do
  campo, criação explícita com `null` e writes server-side de archive/restore.
- `src/data/firestore/portfolio-repository.ts` — listagens separadas,
  `archivePortfolio` e `restorePortfolio`; `deletePortfolio` removido.
- `src/data/firestore/errors.ts` — operação `delete` removida do contrato.
- `src/components/portfolio/portfolio-settings.tsx` — confirmação explícita de
  archive e ação de restore sem exclusão de filhos.
- `src/components/portfolio/portfolio-list.tsx` — separação visual de carteiras
  ativas e arquivadas.
- `firestore.rules` — schema compatível com legado/novo, transições de lifecycle
  server-side e remoção de `allow delete`.
- `tests/firestore.rules.test.mjs` — archive, restore, legado e delete negado.

### Decisões e desvios

- Archive e restore alteram somente `archivedAt` e `updatedAt`; ambos usam
  `serverTimestamp()` e preservam ID, nome e dados filhos.
- `listPortfolios` filtra somente documentos ativos; `listArchivedPortfolios`
  filtra arquivados. Parser converte documento legado sem `archivedAt` para
  carteira ativa (`null`).
- Settings substitui exclusão permanente por confirmação de digitação exata do
  nome; restore fica disponível na mesma superfície. Nenhum path de subcoleção
  foi tocado.
- Rules continuam fechadas para Assets/Transactions e aceitam tanto documentos
  legados sem `archivedAt` quanto novos documentos com `null`/Timestamp válido.
  Transições de archive/restore rejeitam mutações combinadas de nome ou outros
  campos.
- O `create` das Rules também aceita ausência de `archivedAt` para permitir
  fixtures/documentos legados sem bypass; Rules não distinguem criação histórica
  de criação atual. O repository sempre envia `archivedAt: null` em novas
  criações, e a limitação fica registrada como risco residual.
- Não houve refactor fora do lifecycle nem migração/backfill produtivo.

### Comandos executados

```bash
JAVA_HOME=$(/usr/libexec/java_home -v 21) npm run test:rules
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
git diff --check
```

### Resultados e evidências

- Firebase Emulator passou: 7 testes, 7 aprovados, 0 falhas, projeto demo
  `demo-reserva-clara`.
- Delete físico foi negado para Portfolio vazia, ativa e arquivada; archive e
  restore passaram; documento legado sem `archivedAt` leu como ativo, foi
  renomeado, arquivado e restaurado.
- Lint, typegen, TypeScript e build passaram. Build reconheceu rotas existentes
  de Portfolio sem abrir rotas de Assets/Transactions.
- `git diff --check` passou.
- Busca estrutural no código não encontrou `deletePortfolio` nem `allow delete`
  no fluxo de Portfolio.

### Riscos residuais

- Não existe purge, cascade ou migração/backfill produtivo; documentos legados
  permanecem sem `archivedAt` até serem alterados.
- Cliente SDK direto ainda pode criar Portfolio sem `archivedAt`, porque Rules
  não conseguem distinguir essa escrita de um documento legado sem campo; novas
  escritas pelo repository são explícitas com `null`. Tightening futuro exigirá
  estratégia de fixture/migração compatível.
- Não há runner automatizado de UI; foco, teclado, confirmação e restore ainda
  exigem validação manual autenticada.
- Rules não substituem a validação de lifecycle do repository para futuras
  Transactions; paths futuros permanecem negados nesta subtarefa.
