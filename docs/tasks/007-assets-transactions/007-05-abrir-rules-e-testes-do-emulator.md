# 007-05 — Abrir Rules e testes do Emulator

- **Ticker:** `007`
- **Número:** `05`
- **Status:** `pending`

## Objetivo

Abrir somente os schemas aprovados de Asset, registry e Transaction e provar
ownership, vínculo atômico, archive gate e append-only no Emulator.

## Dependências

- 007-01 a 007-04 concluídas e revisadas.
- Parser/converter e repository usados como fonte para matriz de campos.

## Escopo

- Remover denies específicos somente de Assets, registry e Transactions.
- Implementar helpers de owner, Portfolio ativa, Asset válido e schema fechado.
- Validar `identityKey` como concatenação dos campos normalizados
  `symbol~market~assetType~currency`; SDK direto com chave divergente falha.
- Usar `getAfter` para exigir Asset↔registry na mesma operação atômica e
  comparar `registry.assetId`, `registry.identityKey` implícita no path e
  `asset.identityKey`.
- Permitir registry somente em create atômico; negar update/delete e rebind.
- Usar `getAfter` do documento Portfolio em Transaction create para impedir
  batch que arquive e crie Transaction no mesmo commit.
- Usar `exists` para exigir Asset do mesmo owner em Transaction.
- Permitir read owner de ledger arquivado, negar create em Portfolio arquivada.
- Negar update/delete de Transaction, update/delete de Asset e paths futuros.
- Expandir `tests/firestore.rules.test.mjs` com fixtures e casos negativos.

## Fora de escopo

- Deploy produtivo, criação de índice, seed ou bypass com Rules desabilitadas.

## Critérios de aceite

- Owner válido acessa somente seu namespace.
- A não lê/escreve/lista B, anônimo falha e query não vira filtro permissivo.
- Asset sem registry, registry órfão e vínculo cross-user falham.
- Transaction com kind/campo/tipo/ref inválidos falha.
- Decimal persistido com zeros à esquerda/finais, expoente ou fora de 30/18
  falha; fixtures são iguais às usadas no parser/reducer.
- Transaction válida passa somente em Portfolio ativa; tentativa de batch
  archive+Transaction falha.
- Update/delete de Transaction e delete de Portfolio falham.
- Sell schema-válido enviado diretamente pelo SDK é documentado como limite das
  Rules, não como validação agregada; reducer/repository mantém sua própria prova.
- `npm run test:rules` verde com contagem registrada.

## Arquivos prováveis

- `firestore.rules`
- `tests/firestore.rules.test.mjs`
- `firestore.indexes.json` somente com evidência de query necessária

## Validação

```bash
JAVA_HOME=$(/usr/libexec/java_home -v 21) npm run test:rules
```

Reexecutar lint/typegen/TypeScript/build após a mudança de Rules.

## Registro de execução

- **Arquivos alterados:** preencher ao executar.
- **Decisões/desvios:** registrar limites Rules e uso de `getAfter`.
- **Comandos/resultados/evidências:** preencher ao executar.
- **Riscos residuais:** Rules não executam reducer decimal; manter prova de domínio.
