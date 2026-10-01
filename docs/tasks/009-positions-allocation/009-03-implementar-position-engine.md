# 009-03 — Implementar Position Engine

- **Ticker:** `009`
- **Número:** `03`
- **Status:** `pending`

## Objetivo e resultado esperado

Derivar uma ou várias Positions válidas a partir de Assets e Transactions de
uma carteira, com custo médio ponderado, taxas conforme política, recomputação
retroativa e posição zerada explícita, sem persistir resultado.

## Requisitos cobertos

- Critérios 1–13, 25 e 27 da spec 009.
- Handoffs 007/008 sobre ledger como fonte da verdade e Asset como identidade.

## Escopo incluído

- `Position`, `reducePosition` e `reducePositions` em módulo puro.
- Agrupamento por `assetId`, ordenação total e validação de referência.
- BUY/SELL, venda parcial, custo proporcional, fee de compra e fee de venda.
- Backfill retroativo, múltiplos Assets, zeragem e erros explícitos.
- Export público pelo domínio.

## Escopo excluído

- Quotes, Market Position, Allocation e chamadas HTTP.
- Persistência, read model, novas Rules, autorização ou UI.
- Lucro realizado, performance, caixa, FX e eventos financeiros novos.

## Dependências

- 009-01 e 009-02.
- `asset.ts`, `transaction.ts`, `decimal-reducer.ts`, `errors.ts` e value
  objects atuais.

## Arquivos e símbolos prováveis

- Novo `src/domain/position-engine.ts`.
- `src/domain/index.ts`.
- `src/domain/errors.ts`, apenas para erros estáveis de posição.
- `tests/positions.test.mjs` ou extensão do teste de domínio.
- `scripts/run-positions-tests.mjs` se o módulo exigir compilação isolada.

## Passos de implementação

1. Receber `portfolioId`, Assets e Transactions sem confiar na ordem de entrada.
2. Validar Asset referenciado e compatibilidade de moeda do preço/taxa.
3. Ordenar por data civil, timestamp preservando nanos e document ID.
4. Reduzir quantidade e custo com estado intermediário exato.
5. Aplicar média ponderada em compra e remoção proporcional de custo em venda.
6. Materializar valores canônicos e manter Position zerada quando houver
   histórico, com `averageCost: null`.
7. Retornar posições determinísticas por `assetId` e propagar falhas sem
   fabricar fallback.
8. Adicionar fixtures de backfill, empate, frações, venda acima do saldo e
   múltiplos Assets.

## Testes e comandos de validação

- `npm run test:domain`.
- `npm run test:positions` (se criado).
- `npm run lint`.
- `npm exec next typegen && npx tsc --noEmit`.
- `npm run build`.

## Definição de pronto

- O mesmo ledger em qualquer ordem de array produz o mesmo resultado.
- Fórmulas de buy/sell, fee e zeragem têm testes.
- Venda inválida mantém `INSUFFICIENT_QUANTITY`.
- Nenhum documento ou mutação de Firestore é introduzido.

## Riscos e cuidados

- Não usar o timestamp máximo do repository como regra especial do read-side.
- Não agrupar por ticker ou provider.
- Não arredondar custo a cada Transaction.
- Manter a limitação de Rules/SDK direto documentada para a fase 020.
