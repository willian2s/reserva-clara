# 007-01 — Implementar archive e gate de lifecycle

- **Ticker:** `007`
- **Número:** `01`
- **Status:** `pending`

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

- **Arquivos alterados:** preencher ao executar.
- **Decisões/desvios:** preencher ao executar; não relaxar gate.
- **Comandos/resultados/evidências:** preencher ao executar.
- **Riscos residuais:** documentar ausência de purge e migração produtiva.
