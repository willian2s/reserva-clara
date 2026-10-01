# 007-11 — Implementar edição e exclusão atômicas

- **Ticker:** `007`
- **Número:** `11`
- **Status:** `completed`

## Objetivo e resultado esperado

Implementar no domínio e no repository a edição de Asset mantendo o mesmo
`assetId` e a exclusão condicionada à ausência de Transactions, com troca
atômica de registry e remoção sem cascade.

## Requisitos cobertos

- Spec 007, critérios 12, 12a–12c, 14, 23–25.
- Guard de uso criado ou confirmado no mesmo write de uma nova Transaction.

## Escopo incluído

- `updateAsset(assetId, input)` preservando ID e `createdAt`.
- `deleteAsset(assetId)` com guard e erro `ASSET_HAS_TRANSACTIONS`.
- Paths, parser/converter e erros necessários para `assetUsages`.
- Reconciliação owner-scoped de Transactions legadas antes do delete.
- Testes puros/repository com conflito, inconsistência e falha sem alteração
  parcial.

## Escopo excluído

- Alterar Firestore Rules ou UI; essas mudanças ficam em 007-12 e 007-13.
- Cascade, purge, archive de Asset ou mutação de Transaction.

## Dependências

- `007-10` concluída e revisada.
- `assetUsages` e mensagens do contrato definidos.
- `007-12` ainda não está concluída; o código de delete deve permanecer fechado
  atrás da reconciliação e não pode ser exposto pela UI antes das Rules de guard.

## Definição de pronto

- Edição troca registry antigo/novo no mesmo commit e preserva ID/criação.
- Delete só remove Asset e registry após provar ausência de uso.
- Uso em Portfolio ativa ou arquivada bloqueia delete com erro sanitizado.
- `reconcileAssetUsage(assetId)` retorna cobertura explícita; `complete: false`
  mantém delete fechado.
- Corrida, colisão e inconsistência não deixam escrita parcial.

## Testes e comandos de validação

```bash
npm run test:domain
npm run lint
npm exec next typegen
npx tsc --noEmit
git diff --check
```

## Riscos e cuidados

- Não decidir exclusão por uma leitura fora do `runTransaction`.
- Não aceitar UID, path, identityKey ou assetId de outro owner como autoridade.

## Execução

- **Status:** `completed`; update/delete owner-scoped, reconciliação e guard de
  uso foram implementados sem alterar Rules ou UI.
- **Arquivos alterados:** `src/domain/asset.ts`,
  `src/data/firestore/asset-repository.ts`,
  `src/data/firestore/transaction-repository.ts`,
  `src/data/firestore/errors.ts`, `src/data/firestore/paths.ts`,
  `src/data/firestore/converters/asset-converter.ts`,
  `src/data/firestore/converters/asset-usage-converter.ts`,
  `src/data/firestore/parsers/asset-usage-parser.ts` e
  `tests/domain.test.mjs`.
- **Decisões e desvios:** `AssetUpdateInput` aceita somente os quatro campos de
  identidade; `id`, `identityKey` e `createdAt` continuam sob autoridade do
  documento existente. A troca de registry, update e delete usam um único
  `runTransaction`. A reconciliação percorre as Portfolios owner-scoped,
  incluindo arquivadas, e usa a contagem real de Transactions encontradas para
  tornar a evidência explícita. O converter de Asset continua rejeitando
  updates genéricos; o repository usa o payload fechado de update diretamente
  no write transacional. Nenhuma Rule ou ação de UI foi aberta antecipadamente.
- **Comandos executados:** `npm run test:domain`, `npm run lint`,
  `npm exec next typegen`, `npx tsc --noEmit`, `npm run build`,
  `npm run test:rules` e `git diff --check`.
- **Resultados e evidências:** 7 testes de domínio passaram; 13 testes do
  Emulator de Rules passaram sem alterações nas Rules; lint, typegen,
  TypeScript, build e diff check passaram. A revisão independente confirmou a
  correção do write de update e a atomicidade do lifecycle. O Emulator ainda
  cobre somente o contrato anterior, pois os cenários de `assetUsages`, update
  e delete pertencem à 007-12.
- **Riscos residuais:** `007-12` precisa publicar as Rules de guard,
  update/delete atômicos e executar a auditoria legada antes de qualquer
  rollout ou exposição na UI. Até lá, novas Transactions pelo repository serão
  bloqueadas pelas Rules atuais; isso é um gate intencional, não um fallback
  permissivo. A reconciliação consulta todos os matches para preservar
  `transactionCount` real, em vez da otimização `limit(1)` descrita na
  estratégia da spec; esse custo deve ser reavaliado no gate 007-12.
