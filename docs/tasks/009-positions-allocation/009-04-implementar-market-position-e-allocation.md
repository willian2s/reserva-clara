# 009-04 — Implementar Market Position e Allocation

- **Ticker:** `009`
- **Número:** `04`
- **Status:** `pending`

## Objetivo e resultado esperado

Combinar Positions abertas com QuoteResults e calcular a composição corrente da
carteira, preservando fresh/stale/unavailable, moeda-base e estado parcial sem
tratar ausência de cotação como valor zero.

## Requisitos cobertos

- Critérios 14–21, 25 e 26 da spec 009.
- Separação entre Allocation observada da 009 e Target Allocation da 011.

## Escopo incluído

- `MarketPosition`/resultado indisponível e valuation nominal.
- Valor atual, custo investido, diferença nominal e frescor.
- `AllocationResult` com status, total conhecido, entries e diagnósticos.
- Exclusão de posições zeradas e valores fora da moeda-base do denominador.
- Testes de fresh, stale, unavailable, currency mismatch e denominator zero.

## Escopo excluído

- Buscar Quotes, chamar BRAPI ou acessar repositories.
- Persistir preços, posições, histórico ou snapshots.
- Target allocation, recomendação, performance, FX, caixa ou dashboard.

## Dependências

- 009-01, 009-02 e 009-03.
- Contratos existentes em `src/domain/quote.ts` e `value-objects.ts`.

## Arquivos e símbolos prováveis

- Novo `src/domain/market-position.ts`.
- Novo `src/domain/allocation.ts`.
- `src/domain/index.ts`.
- `tests/positions.test.mjs` ou testes puros equivalentes.

## Passos de implementação

1. Aceitar somente QuoteResult associado ao mesmo `assetId`.
2. Recusar moeda divergente sem FX e preservar o código/diagnóstico sanitizado.
3. Calcular market value com aritmética exata e propagar `freshness`.
4. Excluir Position fechada antes de solicitar/combinar cotação.
5. Somar apenas valores conhecidos na moeda-base para o denominador.
6. Calcular razões determinísticas, com half-up final e status complete,
   partial ou empty.
7. Ordenar entries/diagnósticos por `assetId` e testar ausência de NaN/infinito.

## Testes e comandos de validação

- `npm run test:positions` ou `npm run test:domain`.
- `npm run lint`.
- `npm exec next typegen && npx tsc --noEmit`.
- `npm run build`.

## Definição de pronto

- Stale permanece explicitamente stale e ainda pode valorar.
- Unavailable, zero e moeda incompatível não distorcem allocation.
- Allocation não contém target nem recomendação.
- Contrato está pronto para ser consumido pelo read-side/010.

## Riscos e cuidados

- Nunca converter unavailable para preço zero.
- Não chamar `QuoteService` do domínio.
- Não usar BasisPoints/target allocation só porque o tipo existe no projeto.
- Não chamar diferença negativa de performance histórica.
