# 008-05 — Integrar cotações na UI

- **Ticker:** `008`
- **Número:** `05`
- **Status:** `completed`

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
- Requisição em lote após catálogo carregar, sem bloquear o catálogo ou os
  dados básicos dos ativos.
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

## Execução

- **Status:** `completed`.
- **Arquivos alterados:** `src/data/quotes/quote-client.ts`,
  `src/components/asset/asset-catalog.tsx` e
  `src/components/asset/asset-quote.tsx`.
- **Decisões e desvios:** o client obtém `auth.currentUser.getIdToken()` e envia
  somente `{ assetIds }` para `/api/quotes`, convertendo ausência/falha de sessão,
  HTTP e payload em códigos sanitizados. O catálogo mantém request ID e guard de
  montagem independentes para Quotes, consulta lotes de até 20 Assets, preserva
  os dados básicos dos ativos em falhas e oferece atualização explícita sem retry
  automático. A apresentação exibe preço decimal, moeda, `quotedAt`, frescor
  stale/fresh e `providerSymbol` somente quando `symbolChanged`; não foi alterado
  `Asset`, `Transaction`, `unitPrice` ou o ledger.
- **Comandos executados:** `npm run test:domain`,
  `npm run test:quotes-adapter`, `npm run test:quotes-service`,
  `npm run test:quotes-route`, `npm run lint`, `npm exec next typegen`,
  `npx tsc --noEmit`, `npm run build` e `git diff --check`.
- **Resultados e evidências:** 6 testes de domínio, 7 do adapter, 8 do serviço e
  8 do boundary passaram. Lint, geração de tipos, TypeScript, build e diff check
  concluíram sem erros; o build manteve `/api/quotes` em runtime Node. Inspeção
  estrutural não encontrou `firebase-admin`, adapter, URL BRAPI, `BRAPI_API_KEY`
  ou env server-only nos componentes client de Asset/Transaction; o ledger não
  importa Quotes nem chama `/api/quotes`.
- **Riscos residuais:** não há runner de UI nem credenciais autorizadas neste
  ambiente, portanto o smoke visual autenticado de sucesso, stale, retry,
  indisponibilidade, token ausente, teclado/mobile e ledger com provider fora do
  ar permanece para a 008-06. Não houve chamada real à BRAPI.
