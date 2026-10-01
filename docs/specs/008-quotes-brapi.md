# 008 — Quotes & BRAPI

## Status

`in_progress` — subtarefas 008-01 a 008-05 e 008-07 concluídas; os gates finais
da 008-06 permanecem pendentes.

## Ticker

`008`

## Contexto e baseline operacional

O baseline da fase é a `main` após conclusão da 007. O handoff registrado em
`docs/tasks/007-assets-transactions/007-08-executar-gates-e-handoff.md` aponta o
commit `38a5082`, com working tree limpo no encerramento da fase. A fase 007
entregou catálogo owner-scoped de `Asset`, ledger append-only de `buy`/`sell`,
decimais canônicos e Rules de Asset/Transaction.

O roadmap define a sequência crítica:

```text
Transaction
    ↓
Quote
    ↓
Position
    ↓
Dashboard
```

Quote é mercado externo. Asset continua sendo identidade e Transaction continua
sendo fato patrimonial. A BRAPI não pode virar identidade principal do domínio,
nem uma cotação pode introduzir Position, patrimônio ou performance antes da
fase 009.

## Objetivo

Entregar cotações de mercado para Assets suportados, com integração BRAPI
server-side e contrato resiliente a indisponibilidade do provider. O usuário
deve conseguir consultar preço, moeda, momento da cotação e frescor sem que a
UI conheça BRAPI, sem expor secrets e sem bloquear catálogo ou ledger quando a
BRAPI falhar.

## Comportamento atual encontrado

- `src/domain/asset.ts` define Asset somente como identidade composta por
  `symbol`, `market`, `assetType`, `currency` e `identityKey`; não há provider,
  preço ou posição.
- `src/domain/transaction.ts` define apenas `buy` e `sell`; `unitPrice` é
  decimal textual canônico e o reducer usa `bigint`.
- `src/data/firestore/asset-repository.ts` e
  `src/data/firestore/transaction-repository.ts` são client-only e obtêm UID de
  `auth.currentUser`.
- `src/lib/firebase/client.ts` inicializa somente Firebase Web no browser. Não
  existe Firebase Admin, route handler, server action, serviço server-side,
  cache ou padrão de revalidação.
- `src/components/asset/asset-catalog.tsx` exibe identidade e explicitamente
  não mistura cotação ou posição.
- `src/components/transaction/transaction-ledger.tsx` carrega Assets e
  Transactions diretamente dos repositories Web; não depende de provider
  externo.
- `.env.example` contém somente variáveis `NEXT_PUBLIC_FIREBASE_*`; não há
  chave BRAPI ou credenciais server-side.
- `package.json` não possui `firebase-admin`, cliente HTTP ou dependência de
  cache. O projeto usa `fetch` nativo como menor superfície adicional.
- `src/proxy.ts` não inclui `/api/quotes` no matcher e não há regra de host
  específica para API.
- Não há tipos, adapter, mapping, QuoteService, persistência, testes ou UI de
  Quotes.

## Escopo

### Incluído

- contrato puro de `Quote` e resultado por Asset;
- mapping explícito Asset → BRAPI, fora do tipo Asset;
- suporte inicial a Assets `market = B3`, `currency = BRL` e
  `assetType ∈ {stock, etf, fii}` pelo endpoint BRAPI v2 de cotações de ações;
- resposta por lote com limite de 20 Assets e falhas parciais;
- adapter BRAPI server-side usando `Authorization: Bearer` e URL fixa;
- conversão imediata do preço recebido pelo provider para decimal canônico
  textual, sem aritmética com `number` no contrato interno;
- `quotedAt` vindo de `regularMarketTime` e `fetchedAt` gerado no servidor;
- `POST /api/quotes` autenticado por Firebase ID token no header
  `Authorization`, com UID derivado exclusivamente pelo servidor;
- leitura server-side somente dos Assets do UID verificado;
- `QuoteService.getQuote(asset)` e `QuoteService.getQuotes(assets)`;
- cache em memória por processo, deduplicação de chamadas em andamento,
  timeout, retry controlado, stale-if-error, limite de entradas e limites de
  lote/conexão;
- erros internos e do provider convertidos para códigos sanitizados;
- integração client-side na tela `/assets`, sem chamada direta da UI à BRAPI;
- estados de cotação `fresh`, `stale` e `unavailable` por Asset;
- host policy explícita para impedir uso da API pelo host público;
- testes puros, testes do contrato de route handler com fakes, regressão do
  Emulator e gates técnicos existentes;
- documentação de secrets, rollout e rollback.

### Fora de escopo

- alteração de `Asset`, `identityKey`, `Transaction`, `unitPrice`, reducer ou
  ledger;
- `Asset.id = brapiId`, provider dentro do documento Asset ou alteração de
  símbolo quando BRAPI indicar `changed`;
- persistência de Quote, ProviderMapping, histórico de preços ou nova coleção
  Firestore;
- novas Firestore Rules, índices, backfill ou migração de dados;
- Position, custo médio, patrimônio, rentabilidade, allocation ou dashboard;
- conversão FX, normalização de moeda diferente de BRL ou cálculo de total;
- suporte inicial a `fund`, `bond`, `crypto`, `other`, mercados diferentes de
  B3 ou moedas diferentes de BRL;
- múltiplos providers, registry genérico de providers ou configuração de URL
  externa por request;
- Redis, KV, queue, job de atualização em background ou rate limit global;
- sessão SSR completa, migração dos repositories Web ou autorização geral de
  páginas server-side;
- chamada real à BRAPI em testes automatizados, seed produtivo, deploy ou
  mudança de Console.

## Requisitos e critérios de aceite

### Identidade, ownership e boundary

1. `Asset`, `identityKey`, `Transaction`, Rules e paths persistidos da 007
   permanecem inalterados.
2. O browser envia somente `assetIds` no body de `POST /api/quotes`; não envia
   UID, símbolo arbitrário, URL, provider ou token BRAPI.
3. O servidor exige `Authorization: Bearer <Firebase ID token>`, verifica o
   token com Firebase Admin e deriva UID do token verificado. Token ausente,
   malformado, expirado ou inválido retorna `401` sanitizado.
4. O servidor lê Assets somente em `users/{uid-verificado}/assets/{assetId}`.
   ID inexistente ou pertencente a outro usuário não revela dados e não gera
   chamada à BRAPI.
5. `/api/quotes` executa em runtime Node. `BRAPI_API_KEY` e credenciais Admin
   aparecem somente em environment server e nunca em `NEXT_PUBLIC_*`, URL,
   resposta, log ou bundle client.
6. O host público não expõe o endpoint como proxy de terceiros. O host app,
   ambientes local e preview seguem a política existente; a autenticação do
   endpoint continua obrigatória em todos eles.

### Mapping e contrato de Quote

7. Mapping inicial aceita somente `(market = B3, currency = BRL,
   assetType ∈ {stock, etf, fii})` e produz símbolo externo a partir de
   `Asset.symbol`. Outros Assets retornam `UNSUPPORTED_ASSET` sem request
   externo.
8. Quote contém, no mínimo, `assetId`, `provider: "brapi"`,
   `requestedSymbol`, `providerSymbol`, `symbolChanged`, `price` com moeda e
   decimal positivo canônico, `quotedAt`, `fetchedAt` e `freshness`.
9. `regularMarketPrice` é validado como finito, positivo e suportado pela
   precisão do contrato; é normalizado imediatamente para string decimal. Não
   existe `number` em Quote, cache, response DTO ou UI.
10. A moeda retornada pela BRAPI precisa coincidir com `Asset.currency`; moeda
    divergente retorna `CURRENCY_MISMATCH` e nunca sofre FX.
11. `regularMarketTime` inválido ou ausente, preço inválido, estrutura
    inesperada ou resultado sem correspondência ao ticker solicitado retorna
    `INVALID_PROVIDER_RESPONSE` sem fabricar fallback.
12. `changed: true` mantém `Asset.symbol` e `identityKey` intactos. A Quote
    preserva `providerSymbol`/`symbolChanged` para transparência e não regrava
    identidade local.
13. `getQuote(asset)` usa a mesma política de `getQuotes([asset])`. Lote válido
    retorna resultado individual por Asset, permitindo sucesso, não suportado,
    não encontrado, stale ou indisponível no mesmo response.

### Resiliência, cache e erros

14. Cache usa chave versionada por provider, endpoint e símbolo externo; não
    inclui UID nem dados financeiros do usuário.
15. Política inicial é: fresh TTL de 60 segundos; stale-if-error até 5 minutos;
    timeout upstream de 3 segundos; no máximo um retry; retry somente para
    timeout, erro de rede, `429` ou `5xx`; backoff entre 100 e 250 ms; lote
    máximo de 20; no máximo uma chamada upstream concorrente por processo; até
    500 entradas; sem background refresh prometido.
16. Cache stale pode ser servido somente quando refresh falhar de modo
    transitório e estiver dentro da janela de 5 minutos. Sem cache válido,
    resposta é `unavailable`; nunca se apresenta preço stale como fresh.
17. Chamadas concorrentes para mesma chave compartilham promise em andamento.
    Símbolos repetidos no lote não geram chamadas duplicadas.
18. O corpo da BRAPI não é repassado ao cliente. Códigos públicos ficam
    limitados a `UNAUTHENTICATED`, `INVALID_REQUEST`, `BATCH_LIMIT`,
    `UNSUPPORTED_ASSET`, `CURRENCY_MISMATCH`, `NOT_FOUND`, `TIMEOUT`,
    `RATE_LIMITED`, `PROVIDER_UNAVAILABLE`, `INVALID_PROVIDER_RESPONSE` e
    `NOT_CONFIGURED`.
19. Falha da BRAPI não interrompe `listAssets`, `listTransactions`, criação de
    Transaction ou leitura do ledger. A UI trata Quotes em estado separado.

### Experiência

20. `/assets` continua exibindo catálogo mesmo quando endpoint de Quotes falha.
    Cada Asset suportado mostra preço, moeda, horário da cotação e estado
    fresh/stale; Assets não suportados ou indisponíveis mostram mensagem
    sanitizada e podem ser tentados novamente.
21. Browser chama somente `/api/quotes` com token Firebase atual. Nenhum
    componente client importa adapter, URL BRAPI, Firebase Admin ou secret.
22. A tela não calcula posição, patrimônio, rentabilidade, total, ganho/perda
    ou conversão cambial. A cotação não preenche `Transaction.unitPrice`.
23. Estados de loading, retry, erro, foco, teclado, live region, mobile e
    contraste seguem padrões já usados em Portfolio/Asset.

### Persistência e validação

24. Nenhum documento Firestore de Quote ou ProviderMapping é criado; não há
    alteração em `firestore.rules` ou `firestore.indexes.json`.
25. Testes usam `node:test`, fixtures sintéticas, `fetch` fake, clock/sleeper
    controláveis e verifier/reader fake. Não há chamada real BRAPI automatizada.
26. Gates de domínio, Rules, lint, typegen, TypeScript, build e diff check
    continuam verdes; smoke autenticado confirma Assets suportados,
    indisponibilidade, stale, retry, cross-user, ausência de secret no bundle e
    ledger funcional.

## Abordagem escolhida

### Fluxo arquitetural

```text
Client Component
  ↓ auth.currentUser.getIdToken()
POST /api/quotes { assetIds }
  ↓ Authorization Bearer
Next Route Handler (Node)
  ↓ verifyIdToken
Firebase Admin Auth + Firestore reader owner-scoped
  ↓ Asset[]
QuoteService
  ↓ ProviderMapping
BrapiAdapter → https://brapi.dev/api/v2/stocks/quote?symbols=...
  ↓ QuoteResult[]
Client quote state
```

O route handler é uma ponte mínima de autenticação para esta integração, não
uma migração da aplicação inteira para SSR. Admin SDK bypassa Rules; por isso o
reader deve construir paths apenas a partir do UID verificado e de IDs validados
e deve ler somente Assets, nunca aceitar path ou UID vindo do request.

### Contrato compartilhado

O tipo puro pode viver em `src/domain/quote.ts` para manter precisão e estados
compartilhados entre servidor e UI, sem importar dependências Firebase. O
serviço, adapter, cache e configuração ficam sob `src/server/quotes/`.

Forma conceitual do contrato JSON:

```ts
type Quote = {
  assetId: DocumentId;
  provider: "brapi";
  requestedSymbol: string;
  providerSymbol: string;
  symbolChanged: boolean;
  price: { currency: CurrencyCode; decimal: PositiveDecimalString };
  quotedAt: string;  // ISO-8601 UTC validado
  fetchedAt: string; // ISO-8601 UTC gerado no servidor
  freshness: "fresh" | "stale";
};

type QuoteResult =
  | { assetId: DocumentId; status: "available"; quote: Quote }
  | { assetId: DocumentId; status: "unavailable"; code: QuoteErrorCode };
```

O transport DTO é explícito para que datas sejam serializadas e para que
`number` do JSON upstream não atravesse o boundary. `regularMarketPrice` é uma
exceção de ingress do provider: o adapter o transforma imediatamente em decimal
canônico e rejeita valor não representável, sem operações aritméticas.

### Provider mapping

Mapping é função concreta, versionada em código, não campo persistido:

| Asset | BRAPI inicial | Resultado |
| --- | --- | --- |
| `B3 + BRL + stock` | `/api/v2/stocks/quote` | suportado |
| `B3 + BRL + etf` | `/api/v2/stocks/quote` | suportado |
| `B3 + BRL + fii` | `/api/v2/stocks/quote` | suportado |
| qualquer outra combinação | nenhum endpoint | `UNSUPPORTED_ASSET` |

O adapter associa resposta por `requestedSymbol`. `symbol` retornado pela BRAPI
fica em `providerSymbol`; `changed` não altera o Asset local.

### Cache e upstream

O cache é `Map` por processo, com mapa separado de promises in-flight. Ele é
deliberadamente efêmero: cold start/redeploy perde entradas, mas não perde
dados do domínio. Não haverá promessa de refresh em background em ambiente
serverless. Logs operacionais, se necessários, registram somente provider,
status sanitizado, duração, cache hit/miss, tamanho do lote e correlation ID;
não registram UID, token, preço completo ou payload de Transaction.

### UI

`src/components/asset/asset-catalog.tsx` mantém o catálogo como fonte de
identidade e adiciona estado independente de Quotes, preferencialmente extraído
para componente/helper de quote para não tornar o carregamento do catálogo
dependente do provider. A função client-side obtém ID token atual e chama o
endpoint same-origin. O ledger 007 não passa a buscar Quotes.

## Alternativas descartadas

| Alternativa | Motivo |
| --- | --- |
| UI chamar BRAPI diretamente | expõe chave, permite abuso direto e viola boundary server-side. |
| Endpoint público sem autenticação | transforma aplicação em proxy de quota e perde owner boundary. |
| Server Action | não oferece ganho necessário sobre contrato HTTP explícito e não resolve auth browser-only. |
| Sessão Firebase por cookie/SSR completo | solução futura válida, mas amplia 008 para migração de autenticação. |
| Cloud Function ou microservice | nova infraestrutura/deploy sem necessidade concreta; um route handler Node basta. |
| Persistir Quote no Firestore | cotação é volátil, duplica dados por owner, exige Rules e não substitui histórico da 012. |
| Redis/KV | cache compartilhado não é necessário antes de evidência de escala; Map é reversível. |
| ProviderMapping dentro de Asset | contamina identidade e quebra handoff 007. |
| Registry genérico de providers | existe um provider e uma implementação; abstração seria especulativa. |
| `number` como preço de domínio | quebra precisão e contrato decimal canônico. |

## Arquivos, módulos e contratos afetados

### Alterações prováveis

- `package.json`, `package-lock.json`: `firebase-admin` server-only e scripts de
  testes puros de Quotes, se necessários.
- `.env.example`: `BRAPI_API_KEY` e credenciais server-only do Firebase Admin,
  sem valores.
- `src/domain/quote.ts`, `src/domain/index.ts`: Quote, QuoteResult, códigos e
  validação sem dependência Firebase.
- `src/server/firebase-admin.ts`: inicialização singleton e verificação de ID
  token; nunca importado por client component.
- `src/server/data/asset-reader.ts`: leitura estreita de Assets por UID
  verificado, adaptando Timestamp do Admin para parser de domínio sem usar
  repository Web.
- `src/server/quotes/brapi-mapping.ts`: matriz suportada e chave externa.
- `src/server/quotes/brapi-adapter.ts`: URL fixa, header, timeout, parsing e
  sanitização do payload BRAPI.
- `src/server/quotes/quote-service.ts` e módulos auxiliares de cache/erros:
  TTL, stale, retry, dedup e batch.
- `src/app/api/quotes/route.ts`: POST, body/auth validation e response HTTP.
- `src/proxy.ts`: matcher e política de host para `/api/quotes`.
- `src/data/quotes/quote-client.ts` e
  `src/components/asset/asset-catalog.tsx` ou componente de quote dedicado:
  chamada same-origin e estados acessíveis.
- `scripts/*` e `tests/*`: fixtures, fakes, testes de contrato e execução
  compatível com `node:test`.

### Reutilização obrigatória

- `src/domain/asset.ts` e `src/domain/value-objects.ts`, sem alterar
  identidade nem representação decimal existente;
- `auth.currentUser.getIdToken()` e padrões de estado/reconciliação client-side
  já usados na 007;
- componentes UI, tokens, foco, live regions e mensagens sanitizadas já
  usados em Asset/Portfolio;
- `fetch` nativo, `AbortController`, `node:test`, Firebase Emulator e gates
  npm existentes;
- Firebase Admin somente no novo boundary server-side, nunca no browser.

Não criar GenericRepository, contexto global financeiro, service locator,
provider registry genérico ou coleção Firestore de Quotes.

## Estratégia de testes e validação

### Domínio e adapter

- mapping de cada combinação suportada e não suportada;
- payload BRAPI válido, ausência de preço, zero/negativo, `NaN`/infinito,
  moeda divergente, timestamp inválido, ticker ausente e `changed`;
- normalização de preço para decimal canônico, sem expoente, arredondamento ou
  `number` atravessando Quote/cache/DTO;
- datas `quotedAt`/`fetchedAt` e frescor determinístico;
- URL fixa e header Authorization sem token em query string;
- erros upstream permanentes e transitórios sem vazamento do body.

### QuoteService

- `getQuote` delega para lote unitário;
- cache fresh, stale-if-error, stale expirado e ausência de cache;
- timeout e retry único apenas para classes transitórias;
- nenhum retry para `400`, `401`, `403`, ticker não encontrado ou payload
  inválido;
- deduplicação de símbolo e promise concorrente;
- limite de lote, limite de cache e partial failure;
- cache não contém UID e uma falha BRAPI não rejeita todos os Assets válidos.

### Route e segurança

- auth ausente, inválida, expirada e válida;
- body desconhecido, lista vazia, ID malformado, duplicado e acima de 20;
- Asset do owner, ID inexistente e tentativa cross-user;
- nenhuma chamada BRAPI quando auth/ownership/request falha;
- resposta sem body upstream, token, credencial ou path sensível;
- bundle client sem `firebase-admin`, `BRAPI_API_KEY` ou URL/header secreto;
- host público bloqueado e host app/local/preview sujeito a auth.

### Regressão e gates

Executar depois de cada mudança estrutural e novamente no fechamento:

```bash
npm run test:domain
JAVA_HOME=$(/usr/libexec/java_home -v 21) npm run test:rules
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
git diff --check
```

Não alterar Rules não elimina a regressão do Emulator: ownership, archive,
registry, Transaction e isolamento A/B devem continuar verdes. Smoke manual em
ambiente autorizado usa somente Assets sintéticos e confirma login, quote
suportada, Asset não suportado, stale/unavailable, retry, cross-user, teclado,
viewport e ledger funcionando com BRAPI indisponível.

## Ordem das subtarefas

1. `008-01-fechar-contratos-e-politica.md` — fechar Quote, mapping, erros,
   precisão, cache, limites, environment e decisão de não persistência.
2. `008-02-criar-boundary-server-e-auth.md` — adicionar runtime server, Admin,
   verificação de token, reader owner-scoped, route skeleton e host policy.
3. `008-03-implementar-adapter-brapi.md` — integrar endpoint fixo, mapping,
   parsing, timestamps e erros do provider com fakes.
4. `008-04-implementar-quoteservice-cache.md` — compor serviço, lote, cache,
   stale, timeout, retry e deduplicação.
5. `008-05-integrar-cotacoes-na-ui.md` — conectar `/assets` somente ao endpoint,
   exibir estados e preservar independência do ledger.
6. `008-07-revisar-linguagem-e-listar-ativos.md` — remover termos internos da
   interface e apresentar o catálogo de ativos em lista.
7. `008-06-validar-gates-e-handoff.md` — executar testes/gates/smoke, revisar
   secrets, rollback, documentação e handoff para 009.

Subtarefas são sequenciais para manter o contrato estável. A 008-03 pode ser
desenvolvida em paralelo à parte mecânica da 008-02 somente após 008-01, mas a
ordem de revisão permanece a listada.

## Rollout, checkpoints e rollback

1. Revisar contrato, matriz de mapping e política de cache antes de abrir
   endpoint.
2. Configurar somente em ambiente local/preview `BRAPI_API_KEY` e credenciais
   Admin, sem registrar valores em docs, logs ou commits.
3. Validar route/auth com provider fake e Admin/Firestore Emulator antes de
   usar BRAPI real.
4. Validar adapter e QuoteService isolados; depois integrar UI.
5. Fazer smoke autenticado com dados sintéticos e confirmar ledger independente.
6. Publicação futura deve configurar secrets por ambiente; não executar deploy
   nesta fase de planejamento.
7. Rollback remove route/UI/serviço e desabilita secrets; não toca Assets,
   Transactions ou Rules. Se houver suspeita de vazamento, rotacionar BRAPI key
   e credenciais Admin; rollback de código sozinho não basta.

## Riscos e mitigação

| Risco | Mitigação |
| --- | --- |
| Admin SDK bypassa Firestore Rules | UID vem somente do token verificado; reader aceita apenas IDs validados e paths owner-scoped; testes cross-user. |
| Credencial server-side vai para bundle | imports server-only isolados, runtime Node, env sem `NEXT_PUBLIC_`, build e inspeção de bundle. |
| Token/URL/body BRAPI vazam | token somente header interno, URL fixa, erros sanitizados e logs sem payload. |
| Payload BRAPI muda | parser fechado, fixtures de contrato, `INVALID_PROVIDER_RESPONSE` e sem fallback inventado. |
| Preço upstream chega como JSON number | conversão imediata para decimal textual, sem aritmética; casos de precisão e limites testados. |
| Cache por processo não compartilha instâncias | documentar semântica efêmera; dedup por processo é suficiente nesta fase; Redis/KV fica para evidência futura. |
| Stale parece preço atual | `freshness` explícito, horário `quotedAt` visível e mensagem de dado desatualizado. |
| BRAPI indisponível bloqueia fluxo patrimonial | Quotes têm estado independente; ledger não chama endpoint e smoke prova indisponibilidade. |
| Assets sem suporte ficam sem preço | mapping explícito e mensagem `UNSUPPORTED_ASSET`, sem tentar endpoint arbitrário. |
| API vira vetor de abuso | auth obrigatória, lote máximo, cache/dedup, retry limitado, host público bloqueado; rate limit global fica risco conhecido. |
| Falta de credencial Admin bloqueia execução | registrar env obrigatório como pré-condição da 008-02 e validar configuração antes de integrar UI. |
| Sem persistência não há fallback após cold start | decisão explícita; histórico materializado pertence à 012, não fabricar cotação local. |

## Premissas explícitas

- `008` é ticker explícito da solicitação; não criar numeração alternativa.
- A `main` e os artefatos 007 são fonte operacional, mesmo se documentação
  histórica anterior divergir.
- BRAPI v2 `/api/v2/stocks/quote?symbols=...` permanece contrato externo de
  referência durante implementação; mudanças devem atualizar adapter e testes,
  não contaminar Asset.
- A credencial Firebase Admin estará disponível em ambiente autorizado antes
  da execução da 008-02. Sem ela, a subtarefa fica bloqueada; não substituir
  verificação por confiança no UID do browser.
- O token Firebase continua no browser nesta fase. Isso protege o endpoint de
  Quotes, mas não transforma `AuthGate` em boundary server-side para páginas.
- BRL é a única moeda suportada pelo mapping inicial. Não há FX implícito.
- `quotedAt` pode ser antigo por mercado fechado; isso é exibido como horário
  fornecido pelo provider, não como garantia de mercado aberto.
- Quote transitória não é fonte histórica. Snapshot/histórico e read models
  materializados ficam para fases posteriores.
- Não há operação produtiva, deploy, seed, Console ou alteração de Rules neste
  planejamento.

## Handoff para fases seguintes

- **009 — Positions & Allocation:** consumir `Asset + Transaction + Quote` como
  dados distintos; derivar Position no read/reducer e nunca persistir Quote como
  fonte autoritativa nem substituir ledger.
- **010 — Real Portfolio Dashboard:** reutilizar `QuoteService`/contrato e
  estados de indisponibilidade; dashboard deve continuar distinguindo dado stale
  de valor atual.
- **012 — Snapshots & Wealth History:** se precisar de histórico de cotação,
  materializar versão e momento de captura explicitamente; não tratar cache 008
  como histórico.
- **020/021 — Trusted Boundary e Performance:** avaliar rate limit distribuído,
  cache compartilhado, aggregate e limites de leitura somente com evidência
  operacional.

## Referências

- `AGENTS.md`.
- `docs/roadmap/reserva-clara-roadmap.md:94-104, 308-496`.
- `docs/specs/007-assets-transactions.md:124-191, 239-317, 422-455`.
- `docs/tasks/007-assets-transactions/007-08-executar-gates-e-handoff.md:89-147`.
- `docs/decisions/006-assets-transactions-ledger.md:15-69`.
- `docs/context/2026-09-29-chat-summary.md:233-295`.
- `src/domain/asset.ts`, `src/domain/transaction.ts`,
  `src/domain/value-objects.ts`.
- `src/data/firestore/asset-repository.ts`,
  `src/data/firestore/transaction-repository.ts`.
- `src/components/asset/asset-catalog.tsx`,
  `src/components/transaction/transaction-ledger.tsx`.
- BRAPI docs: https://brapi.dev/docs e
  https://brapi.dev/docs/authentication.
- Next.js Route Handlers: https://nextjs.org/docs/app/api-reference/file-conventions/route.
- Firebase Admin token verification:
  https://firebase.google.com/docs/auth/admin/verify-id-tokens.
