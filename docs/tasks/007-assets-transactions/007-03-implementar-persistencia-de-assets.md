# 007-03 — Implementar persistência de Assets

- **Ticker:** `007`
- **Número:** `03`
- **Status:** `pending`

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

- **Arquivos alterados:** preencher ao executar.
- **Decisões/desvios:** registrar schema do registry e comportamento de corrida.
- **Comandos/resultados/evidências:** preencher ao executar.
- **Riscos residuais:** documentar limites do SDK e ausência de purge.
