# 008-01 — Fechar contratos e política

- **Ticker:** `008`
- **Número:** `01`
- **Status:** `pending`

## Objetivo e resultado esperado

Fechar contrato puro de Quote, resultado por Asset, códigos de erro, mapping
BRAPI inicial, formato de timestamp, precisão decimal, environment e política
de cache antes de abrir boundary ou UI. Resultado: implementação posterior tem
contrato verificável e nenhuma decisão implícita sobre identidade ou stale.

## Requisitos cobertos

- Spec 008, critérios 1, 7–18, 24 e 25.
- Handoff 007: provider fora de Asset, `identityKey` imutável e preço sem
  floating point.
- Roadmap: Quote como mercado externo e fora de Position/patrimônio.

## Escopo incluído

- Criar/ajustar `src/domain/quote.ts` e export puro em `src/domain/index.ts`.
- Definir `Quote`, `QuoteResult`, `QuoteErrorCode`, `freshness` e parsers de
  decimal/timestamp sem Firebase.
- Definir matriz B3/BRL para `stock`, `etf` e `fii`; demais combinações ficam
  `UNSUPPORTED_ASSET`.
- Registrar constantes de TTL, stale, timeout, retry, lote, concorrência e
  limite de cache.
- Definir `BRAPI_API_KEY` e variáveis Firebase Admin em `.env.example`, sem
  valores reais.
- Criar fixtures sintéticas de contrato para preço, moeda, timestamp,
  `changed` e erros, se o harness puder consumi-las sem provider real.

## Escopo excluído

- Firebase Admin, route handler, chamada HTTP BRAPI ou cache operacional.
- Alteração de `Asset`, `Transaction`, Firestore schema, Rules ou indexes.
- UI e integração no catálogo.

## Dependências

- Nenhuma subtarefa 008.
- Contratos existentes em `src/domain/value-objects.ts`, especialmente
  `CurrencyCode`, `PositiveDecimalString` e `DocumentId`.

## Arquivos e símbolos prováveis

- `src/domain/quote.ts`: tipos, parser e códigos.
- `src/domain/index.ts`: exports.
- `src/domain/value-objects.ts`: somente reutilização; alterar apenas se
  requisito de Quote não puder ser expresso pelo contrato existente.
- `.env.example`: nomes server-only.
- `tests/domain.test.mjs` e `scripts/run-domain-tests.mjs`: fixtures/testes
  puros, se Quote for incluído no harness de domínio.

## Passos de implementação

1. Modelar Quote com `assetId`, provider, símbolos de origem/retorno, preço
   textual, moeda, timestamps ISO e freshness.
2. Modelar resultado discriminado por Asset para sucesso e indisponibilidade;
   manter códigos sanitizados e estáveis.
3. Reutilizar validação decimal/ISO existente; rejeitar preço zero, negativo,
   expoente, timestamp inválido ou moeda fora de ISO.
4. Registrar mapping e política inicial sem criar registry genérico.
5. Atualizar fixtures e documentação de environment sem inserir secrets.
6. Revisar que nenhum campo altera Asset/Transaction ou cria persistência.

## Testes e comandos de validação

- Testar suportados, não suportados, decimal canônico, moeda, timestamp e
  `symbolChanged` com `node:test` existente.
- Confirmar que `Quote` não contém campo `number` de preço e que o domínio não
  importa Firebase/Admin.
- Executar:

```bash
npm run test:domain
npm run lint
npm exec next typegen
npx tsc --noEmit
```

## Definição de pronto

- Contrato e matriz de mapping estão versionados e cobertos por testes.
- Política de cache/erro/environment coincide com spec 008.
- `Asset`, `Transaction`, Rules e paths não foram alterados.
- Nenhum valor secreto ou chamada externa foi adicionada.
- Revisão aprova início da 008-02 e 008-03.

## Riscos e cuidados

- Não usar `number` como tipo persistente, de cache ou de resposta.
- Não transformar `providerSymbol` em `Asset.symbol` quando BRAPI indicar
  mudança.
- Não adicionar suporte especulativo a fundos, cripto, FX ou múltiplos providers.
- Não colocar `BRAPI_API_KEY` em `NEXT_PUBLIC_*`.
