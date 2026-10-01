# 007-11 — Implementar edição e exclusão atômicas

- **Ticker:** `007`
- **Número:** `11`
- **Status:** `pending`

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

- **Status:** `pending`; implementação depende da conclusão de 007-10.
- **Riscos residuais:** sem repository não há ainda garantia operacional de
  exclusão segura.
