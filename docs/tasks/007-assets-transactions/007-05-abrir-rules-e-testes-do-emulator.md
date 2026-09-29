# 007-05 — Abrir Rules e testes do Emulator

- **Ticker:** `007`
- **Número:** `05`
- **Status:** `completed`

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

### Arquivos alterados

- `firestore.rules` — helpers de ownership, schemas fechados, identidade Asset,
  registry atômico, decimais/data e gate de Portfolio via `getAfter()`.
- `tests/firestore.rules.test.mjs` — fixtures sintéticas e casos positivos e
  negativos de Asset, registry, Transaction, ownership, archive e append-only.

### Decisões e desvios

- Assets e registry permitem leitura/listagem somente no namespace do owner;
  Asset é create-only e o registry é create-only, com `getAfter()` validando o
  par completo e `exists()` impedindo referências órfãs.
- `identityKey` é comparada com a concatenação dos campos normalizados e o
  registry só pode nascer na mesma operação que o Asset auto-ID.
- Transaction create exige Asset do mesmo owner, schema V1 fechado, decimal
  canônico positivo, moeda ISO 4217, data civil real e `createdAt` server-side.
- O gate de archive usa `getAfter()` e compara o diff do Portfolio com o estado
  anterior; assim, Portfolio legada sem `archivedAt` permanece ativa, mas batch
  `archive + Transaction` é rejeitado.
- Sell schema-válido enviado diretamente pelo SDK continua permitido de forma
  deliberada: Rules não agregam o ledger; reducer/repository mantém essa prova.
- Nenhum índice foi adicionado: as queries testadas são owner-scoped simples.

### Comandos, resultados e evidências

```bash
npm run test:rules
npm run test:domain
npm run lint
npm exec next typegen && npx tsc --noEmit
npm run build
git diff --check
```

- `npm run test:rules`: 13 testes aprovados, 0 falhas.
- Emulator comprovou isolamento A/B/anônimo, query owner-scoped, schema fechado,
  identity divergente, Asset sem registry, registry órfão/rebind, referências
  cross-user, registry/Asset atômicos, buy/sell válidos, decimais fora da
  gramática, datas inválidas incluindo ano zero e ano não bissexto, Portfolio
  arquivada, archive+Transaction atômico, update/delete append-only e paths
  futuros negados.
- `npm run test:domain`: 5 testes aprovados, 0 falhas; `lint`, typegen,
  TypeScript, build e `git diff --check` passaram.
- Build preservou somente as rotas existentes; nenhuma UI ou rota 007 foi aberta.

### Riscos residuais

- Rules não executam o reducer decimal nem impedem um `sell` schema-válido
  escrito diretamente pelo SDK; a garantia de quantidade não negativa permanece
  no repository/reducer e exige boundary futura para proteção forte.
- O ledger completo continua sujeito ao limite operacional documentado para
  crescimento; aggregate/snapshot permanece handoff de fase posterior.
- Não houve deploy produtivo, seed, índice ou alteração de Console.

### Revisão independente

- Aprovada sem bloqueadores; foi confirmada a consistência SDD, a cobertura de
  ownership/anônimo/cross-user, o gate `getAfter()` e a rejeição de ano zero.
