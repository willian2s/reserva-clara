# 008-05 — Integrar cotações na UI

- **Ticker:** `008`
- **Número:** `05`
- **Status:** `pending`

## Objetivo e resultado esperado

Exibir Quotes no catálogo de Assets usando somente o endpoint autenticado,
mantendo carregamento e erro de cotação independentes do catálogo e do ledger.
Resultado: usuário vê preço/frescor de Assets suportados sem UI conhecer BRAPI,
sem cálculo patrimonial e sem regressão de operações.

## Requisitos cobertos

- Spec 008, critérios 19–23 e 26.
- Padrões de acessibilidade e estados da 006/007.

## Escopo incluído

- `src/data/quotes/quote-client.ts`: ID token Firebase e `fetch` same-origin
  para `/api/quotes`.
- `src/components/asset/asset-catalog.tsx` ou componente separado de quote:
  estado loading/available/stale/unavailable, retry e refresh.
- Exibição de preço, moeda, horário `quotedAt`, frescor e símbolo do provider
  quando `symbolChanged`.
- Mensagens sanitizadas para unsupported, not-found e indisponível.
- Requisição em lote após catálogo carregar, sem bloquear cards de identidade.
- Nenhum import de adapter, URL BRAPI, Admin SDK ou env server-only em client.

## Escopo excluído

- Alterar Transaction form/ledger para chamar Quotes.
- Position, total investido, patrimônio, lucro/perda, allocation, FX ou
  preenchimento automático de `unitPrice`.
- Test runner de UI, redesign amplo ou nova rota pública.

## Dependências

- `008-02` endpoint/auth concluídos.
- `008-04` QuoteService integrado à route.
- `008-01` contrato e estados estáveis.

## Arquivos e símbolos prováveis

- `src/data/quotes/quote-client.ts`: `fetchQuotes`.
- `src/components/asset/asset-catalog.tsx`: estado e ciclo de carregamento.
- `src/components/asset/asset-quote.tsx`: apresentação isolada, se necessário.
- `src/components/ui/*`: somente componentes/tokens existentes, salvo
  necessidade acessível comprovada.
- `src/components/transaction/transaction-ledger.tsx`: inspeção de não-regressão,
  sem alteração esperada.

## Passos de implementação

1. Obter ID token atual no client e montar body somente com `assetIds`.
2. Separar requestId/mounted guard de Quotes do carregamento do catálogo.
3. Renderizar disponibilidade por Asset sem esconder identidade quando quote
   falhar.
4. Mostrar stale de forma explícita e permitir retry/refresh sem loop automático.
5. Tratar `401` como estado de sessão/indisponibilidade, sem redirecionar por
   conta própria fora dos padrões AuthGate.
6. Confirmar que `/portfolios/[portfolioId]/transactions` funciona sem chamar
   endpoint quando BRAPI está indisponível.
7. Revisar teclado, focus, `aria-live`, labels, mobile e contraste.

## Testes e comandos de validação

- Inspeção estrutural: client não importa `firebase-admin`, adapter, URL BRAPI
  ou `process.env.BRAPI_API_KEY`.
- Fake endpoint/manual smoke: sucesso, stale, unsupported, unavailable, retry,
  token ausente e lote vazio.
- Confirmar que erro de Quotes não troca catálogo para erro de Assets e que
  ledger continua listando/criando operações com provider fake indisponível.
- Executar:

```bash
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
```

## Definição de pronto

- `/assets` mostra Quotes sem chamada direta à BRAPI.
- Cada estado é compreensível, acessível e sanitizado.
- Stale não é apresentado como fresh.
- Catalog/ledger permanecem operacionais com API indisponível.
- Nenhum cálculo de fase 009/010 entrou na UI.

## Riscos e cuidados

- `AuthGate` continua sendo UX, não assumir autorização por renderização.
- Não enviar `uid`, símbolo, provider ou URL controlada pelo usuário.
- Não fazer retry recursivo em render/effect; usar ação explícita e guards
  existentes.
- Não usar cor de marca como indicação automática de lucro/performance.
