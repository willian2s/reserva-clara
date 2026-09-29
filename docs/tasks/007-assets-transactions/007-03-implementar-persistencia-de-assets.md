# 007-03 — Implementar persistência de Assets

- **Ticker:** `007`
- **Número:** `03`
- **Status:** `completed`

## Objetivo

Adicionar paths, parser, converter e repository owner-scoped para Asset com
registry de identidade atomicamente consistente.

## Dependências

- 007-01 archive gate concluída.
- 007-02 contratos e `identityKey` concluídos.

## Escopo

- Criar helpers para `assets/{assetId}` e `assetIdentities/{identityKey}`.
- Criar parser/converter de Asset com schema fechado e timestamps.
- Criar parser de registry contendo somente `assetId`.
- Implementar create em `runTransaction`: consultar registry, reutilizar Asset
  existente ou criar Asset auto-ID e registry juntos.
- Rejeitar identidade conflitante, registry órfão e Asset sem registry.
- Implementar listagem owner-scoped; não implementar update/delete.
- Sanitizar erros e manter UID derivado de `auth.currentUser`.

## Fora de escopo

- Rules finais, UI, provider, archive de Asset e Transaction.

## Critérios de aceite

- Duas criações seriais da mesma identidade retornam o mesmo Asset.
- Corrida usa transação otimista e não cria duas reservas válidas.
- Auto ID do Asset não deriva de ticker.
- Componentes React não importam SDK nem constroem paths.
- Documento inválido falha no parser sem fallback.

## Arquivos prováveis

- `src/data/firestore/paths.ts`
- `src/data/firestore/asset-repository.ts`
- `src/data/firestore/parsers/asset-parser.ts`
- `src/data/firestore/parsers/asset-identity-parser.ts`
- `src/data/firestore/converters/asset-converter.ts`
- `src/data/firestore/errors.ts`

## Validação

Executar testes unitários/repository disponíveis, `npm run lint`,
`npm exec next typegen`, `npx tsc --noEmit` e `git diff --check`. Rules ainda
podem negar writes até 007-05.

## Registro de execução

### Arquivos alterados

- `src/domain/asset.ts` — parser da `identityKey` canônica.
- `src/data/firestore/paths.ts` — paths de Assets e `assetIdentities`.
- `src/data/firestore/parsers/asset-parser.ts` — parser fechado de Asset e do
  registry, com validação de Timestamp e IDs.
- `src/data/firestore/converters/asset-converter.ts` — converter fechado,
  timestamps server-side e criação com identidade derivada.
- `src/data/firestore/asset-repository.ts` — criação/listagem owner-scoped,
  transação atômica e validação bidirecional Asset↔registry.
- `src/data/firestore/errors.ts` — erros sanitizados de inconsistência e
  operação de Asset.

### Decisões e desvios

- O registry persiste somente `{ assetId }`; sua `identityKey` é o ID do
  documento e é validada como a composição canônica de quatro segmentos.
- `createAsset` faz uma pré-leitura para detectar Asset órfão e então usa
  `runTransaction`: lê o registry, reutiliza o Asset existente ou grava o
  Asset com auto-ID e o registry no mesmo commit. Em corrida, o retry otimista
  do SDK relê o registry e reutiliza o documento vencedor; a detecção de órfão
  também repete a tentativa para não transformar uma corrida em falso erro.
- `listAssets` valida tanto que cada Asset possui registry correspondente quanto
  que nenhum registry aponta para Asset ausente ou para identidade conflitante;
  reconsulta inconsistências transitórias e ordena a lista pelo document ID.
- Asset é imutável no converter: writes parciais/merge são rejeitados e os
  únicos sentinelas aceitos nos timestamps são `serverTimestamp()`.
- Não foram abertas Rules nem adicionados testes Emulator de Asset; isso fica
  deliberadamente para 007-05, conforme o gate do plano.

### Comandos/resultados/evidências

```bash
npm run test:domain
npm run test:rules
npm run lint
npm exec next typegen && npx tsc --noEmit
npm run build
git diff --check
```

- `test:domain`: 5 testes aprovados, 0 falhas.
- `test:rules`: 7 testes aprovados, 0 falhas; os paths 007 de Asset continuam
  fechados nesta subtarefa.
- Lint, typegen, TypeScript e build passaram; o build manteve somente as rotas
  existentes e não expôs UI de Asset.
- `git diff --check` passou.
- Revisão independente final: sem achados bloqueadores; confirmou atomicidade,
  tratamento de corrida, schema fechado, imutabilidade do converter e
  owner-scoping. Riscos residuais de Rules e ausência de teste isolado do
  repository permanecem para 007-05.

### Riscos residuais

- Rules de Asset/registry ainda não estão abertas; ownership, vínculo atômico e
  schema contra SDK direto serão comprovados em 007-05.
- A listagem valida todas as relações Asset↔registry e pode exigir várias
  leituras; não há aggregate, purge ou rotina administrativa de reparo.
- Não existe runner de repository isolado configurado; a validação de corrida
  depende do comportamento otimista do SDK e deverá ser coberta pelo Emulator
  quando o gate de Rules for implementado.
