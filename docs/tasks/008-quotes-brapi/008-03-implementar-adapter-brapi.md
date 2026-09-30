# 008-03 — Implementar adapter BRAPI

- **Ticker:** `008`
- **Número:** `03`
- **Status:** `pending`

## Objetivo e resultado esperado

Implementar adapter concreto para BRAPI v2, isolando contrato externo de Quote.
Resultado: Assets mapeáveis geram request server-side seguro e payload válido
vira Quote sem alterar identidade local; payload inválido ou provider failure
vira erro sanitizado.

## Requisitos cobertos

- Spec 008, critérios 7–12, 18 e 25.
- BRAPI docs: endpoint `/api/v2/stocks/quote`, Bearer header, `results[].data`,
  `regularMarketPrice`, `currency`, `regularMarketTime` e `changed`.

## Escopo incluído

- `src/server/quotes/brapi-mapping.ts` conforme matriz 008-01.
- `src/server/quotes/brapi-adapter.ts` usando `fetch` nativo e URL fixa.
- Header `Authorization: Bearer ${BRAPI_API_KEY}` apenas no servidor.
- `AbortController` com timeout de 3 segundos.
- Parser fechado de response, preço, moeda, timestamp e símbolo retornado.
- Classificação de status HTTP/provider em códigos internos sem body BRAPI.
- Fixtures e fake fetch para sucesso, ticker alterado, not-found, 4xx, 429,
  5xx, timeout e schema inválido.

## Escopo excluído

- Cache, retry orquestrado e deduplicação do serviço.
- Route handler, Admin auth e leitura de Assets.
- FX, arredondamento de preço, persistência, mudança de Asset ou chamada real
  em CI.

## Dependências

- `008-01` concluída.
- `008-02` fornece convenções de env/runtime, mas adapter pode ser testado
  isoladamente com Asset sintético.

## Arquivos e símbolos prováveis

- `src/server/quotes/brapi-mapping.ts`: `mapAssetToBrapi`.
- `src/server/quotes/brapi-adapter.ts`: `BrapiAdapter`, parser de resposta e
  classificação de falha.
- `src/server/quotes/errors.ts`: erros internos compartilhados, se necessário.
- `tests/quotes-adapter.test.mjs` e fixtures sanitizadas.

## Passos de implementação

1. Aceitar somente mapping suportado e gerar query com símbolos normalizados do
   Asset; nunca aceitar URL/query arbitrária.
2. Ler `BRAPI_API_KEY` server-only e enviar somente header Authorization.
3. Abortar request após timeout e preservar distinção entre erro transitório e
   permanente para o QuoteService.
4. Validar envelope, item solicitado, preço positivo, moeda BRL e timestamp
   ISO; converter preço diretamente para decimal textual canônico.
5. Preservar `requestedSymbol`, `providerSymbol` e `symbolChanged`; não gravar
   nada em Asset.
6. Transformar body/status externo em erro sem payload bruto, token, query ou
   credencial.

## Testes e comandos de validação

- Fake fetch comprova URL/headers e ausência de query token.
- Preço `41.18` vira decimal string; preço inválido, moeda divergente,
  timestamp inválido e envelope inesperado falham explicitamente.
- `changed: true` mantém símbolo local intacto e sinaliza símbolo do provider.
- 429/5xx são marcados transitórios; 400/401/403/not-found/schema inválido não
  são marcados para retry cego.
- Executar:

```bash
npm run lint
npm exec next typegen
npx tsc --noEmit
```

## Definição de pronto

- Adapter concreto cobre matriz suportada e não suporta provider genérico.
- Nenhum preço `number` atravessa Quote/cache/DTO.
- Fixtures cobrem sucesso, mudança de ticker, erros e schema inválido.
- Token não aparece em URL, logs, response ou client bundle.
- Adapter está pronto para ser consumido pelo QuoteService da 008-04.

## Riscos e cuidados

- BRAPI publica preço como JSON number; não fazer aritmética nem arredondamento
  silencioso. Rejeitar forma não representável.
- Não interpretar `changed` como autorização para renomear Asset.
- Não tratar `regularMarketTime` como garantia de mercado aberto.
- Não fazer retry nesta camada se isso duplicar a política central do serviço.
