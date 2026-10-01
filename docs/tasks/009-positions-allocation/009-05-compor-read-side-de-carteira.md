# 009-05 — Compor read-side de carteira

- **Ticker:** `009`
- **Número:** `05`
- **Status:** `pending`

## Objetivo e resultado esperado

Compor uma leitura efêmera de Portfolio, Transactions, Assets e Quotes para que
a fase 010 tenha uma fonte única de dados derivados, mantendo repositories e
Quote client nos boundaries atuais e deixando o ledger funcional quando o
provider falhar.

## Requisitos cobertos

- Critérios 22–24 e 26–27 da spec 009.
- Handoffs da 008 sobre `fetchQuotes`, limite de 20 e autenticação browser-only.

## Escopo incluído

- Novo módulo sob `src/data/positions/` com interfaces de dependência testáveis.
- Leitura owner-scoped via `getPortfolio`, `listTransactions` e `listAssets`.
- Derivação por Position Engine e combinação com Market Position/Allocation.
- Requests de Quote somente para Positions abertas, em chunks de até 20.
- Fallback sanitizado para falha de Quote sem perder Positions.
- Fakes para repositories e Quote client.

## Escopo excluído

- Nova API, Route Handler, SSR, Firebase Admin ou segredo.
- Mudança de `QuoteClient`, repositories, Rules ou Firestore schema.
- Tela, dashboard, loading visual, target editor ou navegação.

## Dependências

- 009-03 e 009-04.
- `src/data/firestore/*-repository.ts` e `src/data/quotes/quote-client.ts`.
- Contratos de Quote da 008.

## Arquivos e símbolos prováveis

- Novo `src/data/positions/portfolio-read.ts`.
- Possível `src/data/positions/types.ts` somente se necessário para seams.
- `src/data/firestore/portfolio-repository.ts`, `asset-repository.ts`,
  `transaction-repository.ts`.
- `src/data/quotes/quote-client.ts`.
- `tests/positions-read.test.mjs` e script/harness correspondente.

## Passos de implementação

1. Definir dependências estreitas para leitura de Portfolio, Assets,
   Transactions e Quotes, permitindo fakes sem Firebase real.
2. Ler o ledger e Assets; derivar Positions antes de fazer requests externos.
3. Filtrar posições abertas e dividir IDs em lotes de no máximo 20.
4. Transformar falha de um lote em resultados unavailable sanitizados, sem
   apagar Positions nem interromper o ledger.
5. Combinar resultados, calcular Allocation e devolver read model efêmero.
6. Confirmar que o módulo client não importa `QuoteService`, Admin SDK, BRAPI
   ou variáveis server-only.

## Testes e comandos de validação

- `npm run test:positions`/`npm run test:positions-read` conforme harness.
- `npm run test:domain` e `npm run test:quotes-route`.
- `npm run lint`.
- `npm exec next typegen && npx tsc --noEmit`.
- `npm run build` e inspeção do bundle client.

## Definição de pronto

- Leitura usa somente boundaries existentes e retorna posições reconstruíveis.
- No máximo 20 IDs são enviados por chamada de Quote.
- Provider indisponível não bloqueia Position/ledger.
- Não há rota ou UI nova; 010 consegue consumir o contrato.

## Riscos e cuidados

- Não transformar o leitor em cache autoritativo.
- Não aceitar UID, path ou símbolo como argumento de autoridade.
- Não incluir Assets sem Transaction como posições zero artificiais.
- Não esconder erro de ledger atrás de unavailable de Quote.
