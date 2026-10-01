# 008-04 — Implementar QuoteService e cache

- **Ticker:** `008`
- **Número:** `04`
- **Status:** `completed`

## Objetivo e resultado esperado

Compor `QuoteService.getQuote/getQuotes` sobre Assets e adapter BRAPI, aplicando
cache efêmero e resiliência determinística. Resultado: uma chamada por símbolo
quando possível, falhas parciais previsíveis e stale claramente marcado, sem
persistência ou dependência do ledger.

## Requisitos cobertos

- Spec 008, critérios 13–19 e 25.
- Roadmap: TTL, stale, timeout, retry, cache, deduplicação e limites.

## Escopo incluído

- `src/server/quotes/quote-service.ts` e módulo de cache em memória.
- Chave versionada sem UID, limite de 500 entradas e eviction simples.
- Promise in-flight por chave/símbolo e dedup de batch.
- Fresh TTL 60s, stale-if-error 5min, timeout 3s, retry máximo 1 com backoff
  controlado de 100–250ms.
- Retry somente timeout/rede/429/5xx; sem retry para falhas permanentes.
- Batch máximo 20 e uma chamada upstream concorrente por processo.
- Resultados individuais para Assets suportados, não suportados, not-found,
  currency mismatch e indisponíveis.
- Injeção de clock, sleeper e adapter fake somente para testes, sem criar
  interface genérica de provider pública.

## Escopo excluído

- Nova infraestrutura de cache, Redis/KV, rate limit distribuído ou background
  refresh.
- UI, route parsing, auth, Firestore write ou histórico de preços.
- Cálculo de Position, patrimônio, performance ou FX.

## Dependências

- `008-01` e `008-03` concluídas.
- Contrato de boundary da `008-02` para composição final da route.

## Arquivos e símbolos prováveis

- `src/server/quotes/quote-service.ts`: `getQuote`, `getQuotes`.
- `src/server/quotes/quote-cache.ts`: entry, TTL, stale e eviction.
- `src/server/quotes/errors.ts`: classificação sanitizada.
- `tests/quotes-service.test.mjs`: clock, sleeper, adapter e fetch fakes.
- `src/app/api/quotes/route.ts`: wiring do serviço, se não fechado na 008-02.

## Passos de implementação

1. Receber Assets já validados/owner-scoped; mapear unsupported antes do
   provider.
2. Consultar cache fresh; deduplicar símbolos e promises in-flight.
3. Chamar adapter em lote dentro de timeout e controlar retry/backoff.
4. Armazenar somente Quote válido no cache, sem UID; guardar timestamps de
   fetch para freshness.
5. Em falha transitória, servir stale dentro da janela e marcar `stale`; fora
   da janela, retornar `unavailable`.
6. Garantir que uma falha por item não invalide resultados válidos do lote.
7. Encaixar códigos públicos na resposta sem repassar exception/provider body.
8. Provar que cache some em processo novo sem afetar Firestore/ledger.

## Testes e comandos de validação

- Fresh hit não chama adapter; expired chama uma vez.
- Dois pedidos concorrentes compartilham promise.
- Símbolos duplicados resultam em uma consulta.
- Timeout/429/5xx fazem no máximo um retry; 400/401/403/schema não fazem.
- Stale transitório é servido por até 5min e marcado; stale expirado fica
  unavailable.
- Limites de lote/cache/conexão são aplicados.
- Partial failure preserva Quotes disponíveis.
- Executar:

```bash
npm run lint
npm exec next typegen
npx tsc --noEmit
```

## Definição de pronto

- QuoteService possui política completa e testes determinísticos.
- Cache não contém UID, token, Asset completo ou Transaction.
- `getQuote` e `getQuotes` têm contrato estável para route/UI.
- BRAPI indisponível nunca lança falha que bloqueie repositories do ledger.
- Nenhuma coleção Firestore ou dependência de infraestrutura nova foi criada.

## Riscos e cuidados

- Cache por processo não é rate limit global nem garantia de dedup entre
  instâncias; documentar limite residual.
- Stale precisa ser visível ao consumidor, nunca silenciosamente tratado como
  atual.
- Não armazenar exception ou body externo no cache.
- Não adicionar retry em camadas múltiplas sem respeitar orçamento de latência.

## Execução

- **Status:** `completed`.
- **Arquivos alterados:** `src/server/quotes/quote-service.ts`,
  `src/server/quotes/quote-cache.ts`, `src/app/api/quotes/route.ts`,
  `tests/quotes-service.test.mjs`, `scripts/run-quotes-service-tests.mjs` e
  `package.json`.
- **Decisões e desvios:** o cache mantém somente os dados da cotação sem
  `assetId`, UID, Asset, Transaction ou credenciais; a identidade do Asset é
  recolocada somente na materialização do resultado. O cache e as promises
  in-flight padrão são compartilhados no processo, com eviction FIFO em 500
  entradas. Uma fila de processo limita chamadas upstream concorrentes a uma,
  enquanto retry é permitido somente para `TIMEOUT`, `RATE_LIMITED` e
  `PROVIDER_UNAVAILABLE`, com um backoff determinístico de 100ms. O fallback
  stale recalcula o clock depois de toda a espera de refresh/retry. A route foi
  ligada ao serviço real; sem `BRAPI_API_KEY`, o adapter retorna
  `NOT_CONFIGURED` sem bloquear o ledger.
- **Comandos executados:** `npm run test:domain`,
  `npm run test:quotes-adapter`, `npm run test:quotes-service`,
  `npm run test:quotes-route`, `npm run lint`,
  `npm exec next typegen && npx tsc --noEmit`, `npm run build` e
  `git diff --check`.
- **Resultados e evidências:** 6 testes de domínio, 7 do adapter, 8 do
  serviço e 8 do boundary passaram. Os testes do serviço cobrem fresh TTL,
  refresh expirado, deduplicação de símbolo e promise entre instâncias,
  concorrência upstream, retry/backoff, falha permanente e parcial,
  `UNSUPPORTED_ASSET`, stale dentro e fora da janela, stale expirado durante
  espera, limite de lote e eviction em 500 entradas. Lint, typegen,
  TypeScript, build e diff check concluíram sem erros; o build manteve
  `/api/quotes` em runtime Node dinâmico.
- **Riscos residuais:** o cache permanece efêmero por processo e não substitui
  rate limit ou cache distribuído; cold start perde as entradas. Não houve
  chamada real à BRAPI nem smoke com credencial produtiva, e o comportamento
  de provider real continua coberto por fakes do adapter.
