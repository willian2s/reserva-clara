# 011 — Revisão do Roadmap e Evolução Arquitetural

## Status

`in_progress`

## Ticker

`011`

## Contexto e objetivo

A fase 010 está concluída e encerrou o primeiro marco patrimonial utilizável do
Reserva Clara: autenticação, carteiras, ativos, ledger `buy`/`sell`, cotações,
posições, alocação corrente e dashboards global e por carteira.

A direção técnica anterior — Next.js, acesso Firestore majoritariamente no
browser, um Route Handler para Quotes e deploy acoplado à Vercel — não deve ser
apagada do histórico. Ela foi adequada para construir e validar as fases
001–010, mas foi explicitamente sucedida para a próxima etapa do produto.

A arquitetura alvo decidida é:

```text
React + TypeScript + Vite
          ↓
Firebase Authentication no browser
          ↓ Firebase ID Token
ASP.NET Core API / .NET / C#
          ↓
Application + Domain
          ↓
Infrastructure + EF Core
          ↓
PostgreSQL gerenciado no Supabase

ASP.NET Core Infrastructure
          ↓
BRAPI
```

O objetivo desta spec é tornar essa mudança executável sem big-bang. Ela revisa
o roadmap posterior à fase 010, estabelece fases 011–021 com checkpoints
observáveis e detalha a primeira delas, Discovery / Architecture. Nenhuma fase
de produto nova deve começar antes do gate da 021.

Esta é uma tarefa exclusivamente de planejamento. Ela não cria aplicação Vite,
solution .NET, schema, migration, endpoint, infraestrutura ou deploy.

### Requisitos e critérios de aceite da revisão

- preservar como fatos históricos as fases 001–010 e registrar explicitamente
  quais mecanismos serão sucedidos;
- adotar somente a direção React/TypeScript/Vite → ASP.NET Core/.NET → EF Core
  → PostgreSQL/Supabase, com Firebase Authentication e BRAPI preservados nos
  boundaries definidos;
- planejar discovery, frontend/UX, backend em camadas, modelo relacional,
  integração, testes, ambientes, deploy, cutover e remoção do legado;
- quebrar a transformação em entregas com gates independentes, uma única fonte
  autoritativa e nenhum dual-write normal;
- tratar segurança, autorização, precisão, migração, observabilidade,
  acessibilidade, performance, DX e documentação como requisitos verificáveis;
- indicar ADRs, dependências, riscos e quais fases bloqueiam o retorno às
  features normais;
- não alterar código de produção, banco, deploy ou configuração externa.

> Nota histórica: uma tentativa anterior de substituir
> `docs/roadmap/reserva-clara-roadmap.md` foi negada pela política de edição do
> ambiente. Essa limitação foi superada e o roadmap canônico está sincronizado
> com esta spec; a nota antiga não representa o estado documental atual.

## 1. Histórico preservado: fases 001–010

| Fase | Estado | Entrega que permanece como histórico e baseline |
| --- | --- | --- |
| 001 — Authentication | concluída | Google Sign-In com Firebase Auth, restauração de sessão e guard de UX client-side. |
| 002 — Brand & Design System Foundations | concluída | Identidade Reserva Clara, Inter, tokens, componentes base, responsividade e fundamentos de acessibilidade. |
| 003 — Public / App Separation | concluída | Landing e app separados por host no mesmo Next.js, route groups e política central em `src/proxy.ts`. |
| 004 — Production Deployment | concluída | Vercel + Cloudflare, domínios, TLS, variáveis, authorized domains, smoke e rollback. |
| 005 — Domain Model & Firestore Foundation | concluída | Firestore owner-scoped, Rules default-deny, parsers/converters/repositories e value objects financeiros. |
| 006 — Portfolio Management | concluída | CRUD de Portfolio, shell protegido, navegação, estados e acessibilidade. |
| 007 — Assets & Transactions | concluída com emenda | Asset user-scoped, identidade única, archive/restore, ledger append-only, decimais exatos e taxas opcionais. |
| 008 — Quotes & BRAPI | concluída | Boundary autenticado `/api/quotes`, Firebase Admin, adapter BRAPI, cache, stale, retry e erros sanitizados. |
| 009 — Positions & Allocation | concluída | Reducer determinístico, custo médio, Market Position e alocação derivada sem persistir Position. |
| 010 — Real Portfolio Dashboard | concluída | Dashboard global e por carteira, totais conhecidos, estados partial/stale/unavailable e refresh manual. |

O roadmap antigo ainda marca 010 como próxima fase. Essa divergência é
documental: a spec e o overview da 010 registram `completed` e prevalecem como
estado operacional.

## 2. Decisões preservadas, sucedidas e descartadas

### 2.1 Preservadas como contratos de produto e domínio

- `Transaction` é fato e fonte autoritativa do patrimônio.
- `Position`, patrimônio, alocação e dashboards são derivações reconstruíveis.
- `Asset` é identidade econômica owner-scoped; ticker e BRAPI não são IDs.
- O ledger é append-only; correções futuras usam fatos compensatórios, não
  alteração silenciosa do passado.
- Venda não pode produzir quantidade negativa.
- IDs atuais de Portfolio, Asset e Transaction devem ser preservados na
  migração; não serão substituídos automaticamente por IDs sequenciais/UUIDs.
- A identidade de Asset continua única por owner e por
  `(symbol, market, assetType, currency)`.
- Portfolio continua multi-carteira, com archive/restore e sem cascade ingênuo.
- Decimais financeiros não usam `number`, `double` ou ponto flutuante binário.
- `effectiveDate` continua uma data civil; ordenação técnica precisa preservar
  a precisão necessária do timestamp e o desempate por ID.
- Quote é transitória e externa; stale é explícito, unavailable não é zero.
- Firebase Authentication continua sendo a identidade do usuário.
- BRAPI continua sendo acessada somente pelo backend.
- Logs e evidências não expõem token, UID bruto, payload financeiro ou valores.
- A separação conceitual entre superfície pública e aplicação permanece válida.

### 2.2 Sucedidas pela nova arquitetura

| Decisão anterior | Situação alvo |
| --- | --- |
| Next.js App Router, Server Components, route groups e `src/proxy.ts` | React/Vite SPA e política de hosts/redirects na infraestrutura escolhida. |
| Firestore como persistência patrimonial e Rules como autorização | PostgreSQL como única persistência patrimonial; API/authorization, constraints e defesa em profundidade no banco. |
| Repositories Firestore no browser | Cliente HTTP tipado; browser não acessa o banco patrimonial diretamente. |
| Route Handler `/api/quotes` | Endpoint ASP.NET Core e adapter BRAPI em Infrastructure. |
| Firebase Admin no Next.js | Validação do Firebase ID Token no ASP.NET Core. |
| Vercel como runtime obrigatório | Frontend estático e API hospedáveis de forma independente, sem recurso exclusivo da Vercel. |
| Firestore Emulator/Rules como prova principal de persistência | Testes de integração com PostgreSQL real, migrations, constraints e API. |

As ADRs 003 e 004 permanecem históricas, mas deverão receber estado
`superseded` quando a nova topologia entrar em produção. A ADR 001 permanece
válida quanto ao Firebase no cliente e ao guard como UX, mas sua evolução
server-side passa a ser Bearer ID Token + validação na API, não sessão Next.js.

### 2.3 Descartadas para a transição

- reescrita simultânea de frontend, backend, banco e autenticação;
- dual-write normal entre Firestore e PostgreSQL;
- acesso Supabase/PostgreSQL direto pelo browser;
- Supabase Auth;
- manutenção permanente de dois domínios e duas persistências patrimoniais;
- conversão mecânica de classes TypeScript em classes C#;
- `GenericRepository`, microservices, queues, Redis ou read models persistidos
  sem evidência concreta;
- congelamento de toda a API antes da revisão de UX/UI;
- validação da migração apenas por compilação.

## 3. Comportamento atual encontrado

### Frontend e Next.js

- Rotas atuais: `/`, `/login`, `/dashboard`, `/assets`, `/portfolios`, detalhe,
  transações e settings de Portfolio.
- `src/app/layout.tsx` usa `next/font`; páginas e componentes usam `next/link`,
  `next/navigation` e `next/image`.
- `src/proxy.ts` é dono da matriz público/app/preview e de redirects.
- `src/app/api/quotes/route.ts` é o único Route Handler de negócio.
- Não há Server Actions, SSR de dados privados, SSG relevante ou cookies de
  sessão. As páginas montam principalmente componentes client-side.
- Auth, repositories Firestore e hooks de dados dependem de singletons Firebase
  no browser; isso reduz testabilidade e será removido da camada de dados.
- Há estados úteis de loading/error/empty/partial e componentes financeiros
  reaproveitáveis conceitualmente, mas não há testes React/E2E automatizados.

### Domínio e persistência

```text
users/{uid}
├── portfolios/{portfolioId}
│   └── transactions/{transactionId}
├── assets/{assetId}
├── assetIdentities/{identityKey}
└── assetUsages/{assetId}
```

- Portfolio tem nome, `baseCurrency = BRL`, archive e timestamps.
- Asset tem identidade canônica owner-scoped e ID estável.
- Transaction aceita `buy`/`sell`, quantity/preço/taxa canônicos,
  `effectiveDate` civil e timestamp com segundos/nanossegundos.
- `assetIdentities` compensa a ausência de unique constraint no Firestore.
- `assetUsages` é um guard monotônico, não Position nem contador.
- Repositories carregam coleções/ledgers completos e filtram/ordenam em memória.
- Firestore Rules garantem owner, schema, referências, archive e append-only,
  mas não reduzem o ledger: um cliente autenticado que ignore o repository pode
  gravar uma venda acima do saldo.
- O reducer usa strings canônicas, `bigint`, racionais e materialização em até
  18 casas. `System.Decimal` não deve ser adotado sem provar que cobre o
  contrato de até 30 dígitos inteiros e 18 fracionários.

### Autenticação e Quotes

- Firebase Web autentica no browser; `AuthGate` só controla experiência.
- O cliente obtém `getIdToken()` para `POST /api/quotes`.
- O Route Handler verifica o Bearer token, deriva o UID, lê apenas Assets desse
  owner e consulta BRAPI por um adapter server-side.
- O lote máximo é 20; cache é por processo, com fresh/stale, timeout, retry e
  deduplicação. O cache não é compartilhado entre instâncias.

### Qualidade e operação

- Existem testes `node:test` para domínio, posição, read-side, dashboards,
  apresentação financeira, Quotes e Firestore Rules.
- Não há runner de componentes, E2E, formatter, CI ou observabilidade dedicada.
- O README ainda é o template do Next.js.
- Existe no workspace um arquivo local ignorado com nome de credencial Firebase
  Admin. A fase 011 deve verificar histórico/exposição sem registrar seu
  conteúdo e solicitar rotação somente se houver evidência.

## 4. Abordagem escolhida e princípios da transformação

1. Uma única fonte patrimonial autoritativa por owner em cada instante.
2. Firestore continua autoritativo até o write fence do cutover; PostgreSQL
   passa a ser autoritativo após o point of no return.
3. Não fazer dual-write de produção. Migração usa cópia, staging, comparação e
   freeze/fence.
4. A sequência de desenho é Produto/UX/UI → casos de uso → API Contract →
   Application → Domain → Persistence. A API representa capacidades e casos de
   uso do produto, não o modelo do banco ou as entidades do EF Core.
5. Contratos HTTP são provisórios durante o discovery e fechados por vertical
   slice somente após a UX dessa slice; mantêm compatibilidade de deploy N/N-1
   quando necessário.
6. Domain não depende de EF Core, PostgreSQL, Supabase, Firebase, Firebase
   Admin, HTTP, ASP.NET Core ou BRAPI.
7. Application contém casos de uso, autorização contextual, validação e ports,
   sem depender diretamente de detalhes de Infrastructure.
8. Infrastructure contém EF Core/Npgsql, Firebase token integration, BRAPI e
   serviços externos; a API traduz HTTP para casos de uso e mantém controllers
   finos.
9. O browser conhece a API, usa Firebase apenas para autenticação e nunca
   acessa PostgreSQL/Supabase diretamente. Firebase fornece identidade; o
   ASP.NET Core valida essa identidade e controla autorização.
10. BRAPI é uma integração externa do backend, não uma dependência do Domain ou
    do frontend.
11. Testes com PostgreSQL real provam comportamento que SQLite/EF InMemory não
    representam: constraints, locks, transações, índices e eventual RLS.
12. Observabilidade, segurança e deploy são capacidades de cada slice, não uma
    fase cosmética no final.
13. Next/Firestore só são removidos depois de paridade, migração, cutover e soak.

## 5. Roadmap revisado: fases 011–021

### 011 — Discovery, Architecture & Migration Baseline

**Objetivo:** compreender o sistema atual, resolver decisões estruturais e
produzir o plano verificável antes de implementar.

**Contexto:** o domínio tem contratos valiosos, mas está misturado com limitações
do Firestore e há risco conhecido em `SELL` direto.

**Escopo:** discovery e redução de incertezas: inventário Next/frontend,
domínio/server/data, dados Firestore, volumetria, modelo relacional lógico,
limites de camadas, auth Firebase → API, baseline técnico de UX/frontend,
perguntas abertas, testes, migração, deploy, riscos e ADRs. A fase responde
somente às perguntas necessárias para iniciar a migração com segurança; não tenta
especificar todo o sistema futuro.

A 011-06 é um handoff técnico para a 012: consolida o estado atual, os
acoplamentos, gaps, restrições e perguntas que evitam redescobrir o sistema do
zero. A 011 não executa a descoberta de Produto/UX/UI, arquitetura de
informação, prototipação ou decisões finais de arquitetura frontend que cabem à
012.

Não são exigidos nesta fase todos os endpoints, DTOs, componentes, detalhes de
implementação ou contratos definitivos da API, nem decisões prematuras de
infraestrutura que dependam das fases posteriores. Esses detalhes permanecem
abertos quando dependerem de descoberta de UX/UI, domínio ou implementação.

**Princípio de encerramento:** a 011 deve eliminar incertezas arquiteturais e de
migração capazes de causar retrabalho estrutural. Detalhes que não ameaçam essa
segurança devem ser deliberadamente refinados depois.

**Entregáveis:** mapas as-is/to-be, matriz preservar/reusar/reescrever/remover,
baseline técnico frontend/UX e handoff de perguntas para a 012, catálogo de
dados e queries, ERD lógico, matriz Firestore→PostgreSQL, threat model, OpenAPI
inicial não congelado, plano de testes, estratégia de cutover e ADRs
propostas/aceitas.

**Tasks:** executar as oito subtarefas desta spec, começando pelo inventário do
frontend e fechando com ADRs, gates e handoff.

**Dependências:** fases 001–010 concluídas; acesso somente leitura a ambientes e
dados sanitizados; decisão da stack já tomada.

**Critérios de aceite:** nenhum acoplamento Next relevante sem classificação;
modelo Firestore completo; ownership/IDs/decimais/timestamps mapeados; boundary
de `SELL` tratado como risco imediato; ADRs cobrem decisões irreversíveis;
roadmap e handoff não exigem big-bang. O handoff inclui baseline frontend,
acoplamentos e gaps conhecidos, jornadas a revisitar, restrições técnicas,
dependências UX/API e perguntas abertas para a 012. A fase não exige UX final,
protótipos, design system final, arquitetura frontend completa ou contratos HTTP
definitivos. Pode ser encerrada quando houver decisão explícita para C0, limites
de camadas e autoridade dos dados definidos, dependências críticas para 012/013
identificadas, estratégia de migração e critérios de validação suficientes para
iniciar a próxima etapa com segurança, e uma lista rastreável de decisões ainda
abertas sem bloquear a fundação.

**Testes necessários:** revisão cruzada entre código e inventário; amostras
sintéticas/anonimizadas; validação de todos os paths, contratos e links; threat
model e tabletop de cutover/rollback.

**Riscos:** inventário incompleto, dado legado não observado, contrato atual
tratado como correto por inércia, ou decisão prematura de biblioteca/hosting.

**Decisões:** autoridade dos dados, camadas, IDs/ownership, precisão decimal e
temporal, auth/autorização, schema, concorrência/idempotência e cutover.

### 012 — Product, UX/UI & Provisional API Discovery

**Objetivo:** redesenhar jornadas e arquitetura de informação antes de congelar
os contratos de cada vertical.

**Contexto:** a UI atual cresceu por fases e não deve ser apenas transportada
para Vite. Dashboard, carteiras, ativos e operações precisam ser reavaliados.

**Escopo:** revisão de produto, UX, UI, arquitetura de informação e arquitetura
frontend — não apenas modernização visual. A análise parte da evolução até a
010: patrimônio,
carteiras, ativos, transações, posições, alocação, cotações, dashboards e
projeções. Deve responder: **a interface atual é realmente a melhor forma de
ajudar o usuário a compreender e gerenciar seu patrimônio?**

Inclui pesquisa heurística, navegação, hierarquia visual, densidade financeira,
mobile, acessibilidade, feedback, loading/error/empty/offline/session,
microcopy, formulários, fluxos de criação/edição, consistência entre telas,
design system, componentes reutilizáveis e protótipos. Cada tela, fluxo ou
conceito pode ser mantido, simplificado, reorganizado, substituído, removido ou
dividido em novos fluxos.

**Entregáveis:** mapa de jornadas, nova IA, protótipos responsivos, inventário de
componentes, decisão de design system, matriz WCAG, decisão de arquitetura
frontend, capacidades provisórias da API e exemplos de payload/erro por slice. A
012 pode alterar requisitos, DTOs e capacidades da API; essas mudanças alimentam
a fase de definição dos contratos e não são descartadas para preservar a
interface antiga.

**Tasks:** auditar telas; entrevistar/validar premissas; redesenhar navegação e
shell; prototipar fluxos; testar teclado/mobile; mapear impactos em DTOs;
priorizar mudanças; registrar decisão de arquitetura frontend.

**Dependências:** 011.

**Critérios de aceite:** fluxos 001–010 cobertos; nenhum contrato é congelado
antes do protótipo correspondente; estados críticos e acessibilidade estão
especificados; feedback de UX está refletido no backlog e nos requisitos da API;
as decisões de manter, simplificar, reorganizar, substituir, remover ou dividir
fluxos estão justificadas.

**Testes necessários:** walkthrough com cenários, avaliação heurística, teclado,
zoom 200%, 320 px, contraste, linguagem e testes de protótipo.

**Riscos:** redesign sem usuário, escopo visual infinito, componentes escolhidos
antes das necessidades, contrato orientado pela tela antiga.

**Decisões:** router, organização por feature, camada HTTP/cache/state,
validação runtime, design system, estratégia de formulários e acessibilidade.

### 013 — Engineering & Environment Foundation

**Objetivo:** criar a base de coexistência e automação para evoluir frontend,
API e banco de forma independente.

**Contexto:** hoje há um único pacote Next.js e checks manuais; não há CI,
ambientes .NET/PostgreSQL nem E2E.

**Escopo:** estrutura do repositório, app Vite, solution .NET em camadas,
PostgreSQL local real, configuração, secrets, test projects, CI, OpenAPI,
observabilidade base e deploy não produtivo.

**Entregáveis:** builds separados, convenções de dependência, containers locais,
pipeline CI, migrations por job separado, health checks e ambientes dev/test/
staging com configuração documentada.

**Tasks:** definir layout; criar Vite; criar API/Application/Domain/
Infrastructure; configurar testes; subir PostgreSQL local; configurar lint/
typecheck/build; criar CI; publicar skeletons em ambiente não produtivo.

**Dependências:** 011 e 012. A fundação de tooling e ambientes pode começar após
as decisões estruturais da 011 e avançar em paralelo com a 012 somente quando
não depender de decisões de Produto/UX/UI/frontend nem congelar capacidades,
DTOs ou contratos provisórios que a 012 ainda possa alterar.

**Critérios de aceite:** clone limpo reproduz builds/testes; API e frontend
publicam independentemente; migrations não rodam no startup; secrets não entram
em artefatos; CI bloqueia regressões básicas.

**Testes necessários:** build Vite, lint/typecheck, testes .NET, startup com
PostgreSQL, migration up/down em banco descartável, health checks e smoke de
deploy.

**Riscos:** monorepo complexo, pipeline lento, ambiente local divergente do
Supabase, segredo em `VITE_*`.

**Decisões:** layout do repo, versões suportadas, estratégia de config, conexão
direta/pooler do Supabase, migration job e telemetria vendor-neutral.

### 014 — Authenticated Walking Skeleton & Security Baseline

**Objetivo:** provar cedo o caminho React/Vite → Firebase Auth → ASP.NET Core →
PostgreSQL, com identidade e isolamento reais.

**Contexto:** esperar a primeira feature até fases tardias concentraria risco de
rede, token, CORS, deploy e autorização.

**Escopo:** login Firebase no Vite, obtenção/refresh de ID Token, Bearer token,
validação ASP.NET Core, `CurrentOwner`, operação mínima no PostgreSQL, CORS,
Problem Details, rate limit, security headers, traces e health checks.

**Entregáveis:** walking skeleton autenticado em staging, testes A/B de owner,
contrato de erros e runbook de diagnóstico.

**Tasks:** configurar Firebase Web; criar interceptor HTTP; validar JWT; derivar
owner de `sub`; implementar endpoint/probe autenticado; aplicar CORS/limits;
testar tokens inválidos/revogados conforme política; instrumentar e publicar.

**Dependências:** 013 e decisões de identidade da 011.

**Critérios de aceite:** token de projeto/issuer/audience incorretos, expirado ou
malformado falha fechado; UID de body/query/header é ignorado; cross-user falha;
nenhum token/UID bruto é logado; frontend não recebe credencial PostgreSQL.

**Testes necessários:** unit de token mapping, integração API/PostgreSQL, 401/
403/404, CORS por origem, rate limit, refresh de token, A/B owner e staging E2E.

**Riscos:** aceitar access token Google em vez de ID Token, wildcard CORS,
confiar em email/UID do payload da request, vazamento de identidade em logs.

**Decisões:** JwtBearer versus Firebase Admin no hot path, política de revogação,
owner context, RLS de defesa em profundidade e códigos HTTP.

### 015 — Domain/Application Compatibility Harness

**Objetivo:** portar regras para C# de maneira crítica e verificável, por slice,
sem tradução mecânica nem meses de trabalho horizontal sem feedback.

**Contexto:** TypeScript já possui regras úteis, mas também decisões específicas
do Firestore. A equivalência financeira exige golden masters.

**Escopo:** fixtures compartilhadas, value objects, erros, portas Application e
domínio necessário primeiro para Portfolio; ledger/positions entram quando suas
slices forem executadas.

**Entregáveis:** harness TS↔C#, catálogo de invariantes, representação exata de
decimal/data/timestamp/ID e casos de uso sem dependência de EF/HTTP.

**Tasks:** classificar regras; criar fixtures; fechar representações; portar
Portfolio; criar ports/casos de uso; comparar saídas; documentar divergências;
estender harness nas fases 018/019.

**Dependências:** 011 e 013; 012 informa nomes/capacidades externas.

**Critérios de aceite:** regras preservadas ou divergências justificadas; Domain
não referencia EF/Firebase/BRAPI/HTTP; erros são determinísticos; nenhuma
matemática financeira usa ponto flutuante.

**Testes necessários:** unit C#, property/boundary tests, golden masters,
fixtures legadas e análise de arquitetura/dependency rules.

**Riscos:** snapshotar bug como contrato, `System.Decimal` estreitar precisão,
overengineering DDD, DTO contaminar Domain.

**Decisões:** value objects, formato JSON, política de arredondamento,
representação temporal e boundaries Application.

### 016 — PostgreSQL/EF Core Foundation & Repeatable Migrator

**Objetivo:** desenhar e provar persistência relacional, migrations e migração
repetível antes de qualquer cutover.

**Contexto:** estruturas Firestore não devem virar tabelas literalmente; unique
constraints/FKs substituem registries e guards quando apropriado.

**Escopo:** schema lógico completo; implementação física incremental da próxima
slice; EF Core/Npgsql; roles; constraints; índices; migrations; extract,
validate, transform, stage, load e reconcile.

**Entregáveis:** ERD, matriz de campos, primeira migration, banco local/teste,
migrador idempotente, relatórios sanitizados e dry-run com fixtures/legado.

**Tasks:** modelar owner/Portfolio/Asset/Transaction; fechar IDs e precisão;
definir constraints/índices; configurar DbContext; separar runtime/migration
roles; criar staging/import; reconciliar; provar backup/restore e Supabase.

**Dependências:** 011, 013 e contratos de precisão da 015.

**Critérios de aceite:** IDs e ownership preservados; Asset tem unicidade por
owner; Transaction é append-only por design e permissões; `effectiveDate` é
`date`; timestamp mantém ordenação; migrations são repetíveis; schema privado
não é exposto à Data API/browser.

**Testes necessários:** PostgreSQL real para migrations, constraints, FKs,
índices, roles/RLS se adotada, precisão, timestamps, import repetido,
quarentena de inválidos e restore.

**Riscos:** `timestamptz` perder nanossegundos, pooler quebrar transação/lock,
RLS ser contornada pelo papel runtime, migration alterar fatos silenciosamente.

**Decisões:** schema/tabelas, chave owner, numeric versus string canônica,
timestamp lossless, RLS, pooling, migrations e retenção de dados antigos.

### 017 — Portfolio Vertical Slice & React/Vite Shell

**Objetivo:** entregar a primeira jornada real completa no novo stack sem mudar
a autoridade produtiva ainda.

**Contexto:** Portfolio é uma slice menor que prova routing, auth, UI, API,
Application, EF Core e PostgreSQL antes do ledger.

**Escopo:** shell, navegação, rotas, auth UX, cliente HTTP, list/create/get/
rename/archive/restore, estados revisados e migration/reconciliation de Portfolio.

**Entregáveis:** app Vite em host não canônico, API de Portfolio, OpenAPI/cliente
tipado, UX aprovada, E2E e dry-run de migração.

**Tasks:** congelar contrato da slice; implementar use cases/API/persistência;
implementar shell/rotas/telas; testar auth/owner; migrar fixtures; publicar;
validar acessibilidade/performance; registrar handoff.

**Dependências:** 012, 014, subset Portfolio de 015 e 016.

**Critérios de aceite:** browser não toca Firestore nessa experiência; todos os
comandos derivam owner do token; archive é preservado; UX mobile/teclado passa;
contrato da slice fica versionado.

**Testes necessários:** domain/application/API/integration/component/E2E,
cross-user, contract tests, accessibility e migration reconciliation.

**Riscos:** duas UIs confundirem usuários, contrato congelado cedo, auth state
intermitente, diferenças de comportamento archive.

**Decisões:** router, cache/query layer, formulários, client generation e
compatibilidade N/N-1.

### 018 — Assets & Transactions Trusted Vertical Slice

**Objetivo:** mover catálogo e ledger para um boundary confiável e eliminar na
arquitetura alvo a fragilidade de venda direta pelo SDK.

**Contexto:** esta é a slice de maior integridade; exige concorrência,
idempotência, append-only e preservação total do histórico.

**Escopo:** Assets, unicidade, lifecycle, Transactions `buy`/`sell`, taxa,
reducer, autorização, locks/transações, migration/reconciliation e UI revisada.

**Entregáveis:** comandos/queries via API, constraints, ledger C#, UI Vite,
testes concorrentes e migrador completo da slice.

**Tasks:** decidir edição de Asset usado; portar domínio/golden masters; criar
schema/EF; implementar casos de uso; serializar writes; garantir idempotência;
implementar UI; migrar/reconciliar; executar testes e staging E2E.

**Dependências:** 017 e extensões de 015/016.

**Critérios de aceite:** dois `SELL`s concorrentes não ultrapassam saldo; retry
igual não duplica e payload divergente conflita; update/delete de Transaction é
negado; referência/owner são garantidos; nenhum write financeiro novo usa
Firestore no Vite.

**Testes necessários:** domínio, use cases, API, PostgreSQL concorrente,
idempotência, append-only, cross-user, retroatividade, component/E2E e migration.

**Riscos:** deadlock, lock insuficiente, alteração de ordem temporal, dado
legado negativo, edição de Asset invalidar ledger.

**Decisões:** lock por Portfolio/Asset, idempotency key, lifecycle de Asset usado,
append-only no banco e política para dados inválidos.

### 019 — BRAPI, Positions, Dashboards & Frontend Completion

**Objetivo:** completar paridade funcional das fases 008–010 e concluir a
revisão visual/arquitetural do frontend.

**Contexto:** Quotes e read models atuais são úteis, mas estão divididos entre
Next server e cliente; o alvo centraliza integrações/regras no backend.

**Escopo:** adapter BRAPI, cache/retry/timeout, Quotes API, Position Engine,
Market Position, allocation corrente, dashboards, catálogo, operações,
loading/error/empty/partial, mobile e acessibilidade.

**Entregáveis:** integrações backend, read models C#, frontend sem Firestore,
paridade funcional completa, UX/UI revisada e E2E das jornadas 001–010.

**Tasks:** portar BRAPI; definir cache/quota; portar golden masters de posição;
criar queries/read models; integrar dashboards; concluir design system; validar
estados/telemetria/performance; publicar staging e executar E2E.

**Dependências:** 018 e decisões/protótipos da 012.

**Critérios de aceite:** frontend não importa Firebase Firestore/Admin nem chama
BRAPI; stale/unavailable/partial preservados; cálculos não vivem em componentes;
carteiras arquivadas ficam fora do consolidado; todas as jornadas críticas
funcionam no Vite.

**Testes necessários:** adapter/service/API BRAPI, golden masters Position,
integration PostgreSQL, componentes, auth, E2E, acessibilidade, visual,
performance e falhas do provider.

**Riscos:** quota BRAPI em múltiplas instâncias, cache local parecer global,
drift de cálculo, regressão de UX, bundle e queries lentas.

**Decisões:** cache por processo/distribuído apenas com evidência, endpoint de
read models, paginação, design system final e budgets de performance.

### 020 — Data Migration, Independent Deploy & Controlled Cutover

**Objetivo:** migrar dados e tráfego com reconciliação, rollback honesto e sem
duas autoridades permanentes.

**Contexto:** staging já deve ter paridade funcional; esta fase operacionaliza
pré-cópias, freeze, import final e ativação.

**Escopo:** deploy frontend/API, Supabase produtivo, Firebase por ambiente,
CORS/domínios, CI/CD, observabilidade, backups/PITR, rehearsals, shadow compare,
write fence, import final, smoke e soak.

**Entregáveis:** ambientes produtivos, runbooks, relatórios de rehearsal,
checklist go/no-go, dados reconciliados, novo stack ativo e plano pós-cutover.

**Tasks:** escolher hosting; preparar staging/produção; configurar secrets/
domínios; ensaiar migração; pré-copiar; congelar writes Firestore; importar e
reconciliar; ativar read-only; trocar tráfego; habilitar writes PostgreSQL;
monitorar soak.

**Dependências:** 019, rehearsals de 016–019 e aceite operacional.

**Critérios de aceite:** contagens/IDs/FKs/hashes/posições reconciliam; inválido
é bloqueado/quarentenado, nunca descartado; CORS é allowlist; backups e restore
foram provados; nenhum recurso exclusivo Vercel é necessário; point of no
return é explícito.

**Testes necessários:** rehearsal completo, restore, smoke anônimo/autenticado,
cross-user, E2E, carga básica, falha BRAPI, rotação de secrets, observabilidade,
DNS/TLS/CORS e rollback antes do primeiro write PostgreSQL.

**Riscos:** janela excedida, dados divergentes, rollback ilusório, DNS/cache,
config Firebase cruzada entre ambientes, migrations concorrentes.

**Decisões:** hosting, topologia de hosts, cutover global versus cohort, RTO/RPO,
retenção, point of no return e processo de release.

### 021 — Migration Completion / Production Readiness & Legacy Retirement

**Objetivo:** remover a arquitetura antiga após soak e tornar o novo stack a
única base mantida.

**Contexto:** coexistência é temporária. Manter Next/Firestore/adapters duplica
risco, custo e conhecimento.

**Escopo:** remover Route Handler, `src/proxy.ts`, App Router e dependências Next;
remover repositories/converters/Rules patrimoniais e adapters temporários;
revogar secrets; atualizar scripts, CI/CD, README, diagramas, runbooks e ADRs.

**Entregáveis:** repositório sem código morto, Firestore patrimonial imutável/
retido conforme política, documentação atual, alertas/runbooks e aceite final.

**Tasks:** confirmar zero tráfego antigo; fechar reads/writes; arquivar export;
remover Next; remover Firestore patrimonial; remover bridges/flags; revogar
credenciais; atualizar docs/pipelines; executar regressão; registrar ADRs como
superseded e handoff.

**Dependências:** 020 concluída, soak sem incidentes bloqueantes e retenção
aprovada.

**Critérios de aceite:** só Firebase Auth permanece do Firebase no frontend;
PostgreSQL é única persistência; BRAPI só no backend; builds não dependem de
Next/Vercel/Firestore; documentação e operação refletem o estado real.

**Testes necessários:** suíte completa, busca estática por imports/config antiga,
E2E produtivo controlado, restore, dependency/secret scan e smoke de deploy.

**Riscos:** remover cedo, credencial órfã, runbook desatualizado, dado antigo sem
retenção ou rollback operacional não ensaiado.

**Decisões:** duração do soak/retenção, descarte seguro, supersession das ADRs
003–006 e critério para reabrir features.

## 6. Checkpoints e migração sem big-bang

| Gate | Evidência mínima | Bloqueia |
| --- | --- | --- |
| C0 — Risco atual contido | **A — aceitação temporária restrita a dev/testes**, escolhida porque o projeto ainda não possui usuários ativos. São permitidos apenas dados sintéticos/descartáveis; não são permitidos writes patrimoniais em staging/produção nem dados reais. O owner operacional é o maintainer do projeto. A saída ocorre antes do primeiro usuário ativo, dado real, avanço para staging/produção ou cutover; o backend novo não pode replicar a fragilidade. | Continuação da migração sem escopo permitido, owner e condição de saída registrados. |
| C1 — Discovery fechado | Inventários, ERD, threat model, ADRs e plano de migração revisados. | 012–016 sem arquitetura. |
| C2 — Fundação reproduzível | CI, Vite/API, PostgreSQL real, migrations e staging skeleton. | Feature nova no alvo. |
| C3 — Auth E2E | Token válido funciona; issuer/audience/exp/cross-user falham. | Dados privados na API. |
| C4 — Compatibilidade | Golden masters de ID, decimal, data, timestamp e Portfolio. | Primeira slice. |
| C5 — Portfolio slice | Jornada completa no novo stack e reconciliação. | Ledger. |
| C6 — Ledger confiável | Concorrência de `SELL`, idempotência e append-only provados. | Cutover funcional. |
| C7 — Paridade 001–010 | BRAPI, posições, dashboards e UX Vite aprovados. | Migração produtiva. |
| C8 — Rehearsal | Import repetível dentro da janela e sem divergência inexplicada. | Go/no-go. |
| C9 — Read-only cutover | Novo stack lê dados finais e smoke passa antes de writes. | Point of no return. |
| C10 — PostgreSQL writes | Primeiro write no PostgreSQL; Firestore não volta a ser destino. | Rollback para Firestore. |
| C11 — Retirement | Soak sem tráfego/erro antigo e retenção aprovada. | Remoção final. |

### Critérios de sucesso da migração

O migration gate valida o sistema funcionando, não apenas a presença de arquivos
ou estruturas. A migração só é concluída quando, no mínimo:

1. o usuário executa os principais fluxos existentes;
2. o frontend roda independentemente do Next.js;
3. o backend roda independentemente do frontend;
4. o Firebase ID Token é validado no backend;
5. PostgreSQL é a fonte oficial após o cutover;
6. EF Core controla o acesso ao PostgreSQL;
7. regras de negócio críticas estão no backend;
8. não existem writes patrimoniais críticos diretamente pelo frontend;
9. os dados migrados foram reconciliados;
10. os principais fluxos têm cobertura de testes adequada;
11. o deploy dos componentes pode ser feito independentemente quando apropriado;
12. o caminho antigo de persistência foi removido ou explicitamente desativado;
13. não existem dependências críticas da aplicação em recursos específicos do
    Next.js;
14. a documentação arquitetural está atualizada.

Somente depois desse gate o projeto retorna ao desenvolvimento normal de
features. O gate deve incluir evidências de execução em ambiente representativo,
autorização, observabilidade mínima, segurança, deploy e cutover; compilar ou
passar testes isolados não é suficiente.

### Fluxo de cutover

1. Firestore segue como autoridade durante desenvolvimento.
2. O migrador faz pré-cópias idempotentes para staging e compara resultados.
3. UI/API Vite usam dados sintéticos ou cópias não autoritativas até o go-live.
4. No cutover, bloquear writes no app/Rules antigos.
5. Exportar delta final; validar, transformar, carregar em staging tables.
6. Reconciliar por owner: contagens, IDs, referências, identities, ledger,
   posições e totais, sem logar payload financeiro.
7. Promover dados e iniciar novo stack em modo read-only.
8. Executar smoke de auth, owner, Portfolios, Assets, Transactions, Quotes e
   dashboards.
9. Trocar hosts/origens e só então habilitar writes PostgreSQL.
10. Após o primeiro write PostgreSQL, rollback significa versão anterior da
    API/frontend compatível com PostgreSQL, restore/PITR ou forward fix — nunca
    reabrir Firestore sem um projeto explícito de reverse migration.

Cutover por owner só será usado se a janela global for inviável e se houver um
write fence forte por owner. Cutover por tabela é proibido porque Portfolio,
Asset e Transaction têm invariantes cruzados.

## 7. Modelo relacional inicial a validar na 011/016

O desenho final depende de discovery, mas deve representar ao menos:

```text
Owner (Firebase UID ou mapeamento imutável)
  ├── Portfolio
  │     └── Transaction ─────┐
  └── Asset ─────────────────┘
```

Constraints mínimas candidatas:

- owner externo Firebase único e imutável;
- IDs legados preservados como texto opaco;
- FK owner-scoped entre Transaction, Portfolio e Asset;
- unique `(owner, symbol, market, asset_type, currency)`;
- `base_currency = 'BRL'` enquanto a V1 não tiver FX;
- quantity/unit price positivos; fee nula ou positiva;
- `effective_date` como `date`;
- update/delete de Transaction negado ao papel runtime;
- delete de Portfolio/Asset com referência bloqueado; archive preservado;
- índices derivados das queries reais, incluindo owner + lifecycle e
  owner/portfolio + ordem do ledger.

`assetIdentities` deve virar unique constraint, não tabela de domínio por
inércia. `assetUsages` deve ser reconciliado, mas pode ser substituído por FK e
`ON DELETE RESTRICT`. O modelo não deve persistir Position como verdade.

## 8. Firebase Authentication no ASP.NET Core

### Fluxo normativo

```text
Firebase Web SDK
  → login/refresh no browser
  → Firebase ID Token
  → Authorization: Bearer <token>
  → ASP.NET Core valida assinatura, alg, issuer, audience, exp/iat e subject
  → CurrentOwner derivado somente do subject verificado
  → Application autoriza recurso owner-scoped
  → EF Core consulta por owner + resource ID
```

- Não aceitar Google OAuth access token como Firebase ID Token.
- Não aceitar UID, email ou owner fornecido por body/query/header da aplicação.
- Não enviar refresh token ao backend nem persistir ID Token manualmente em
  `localStorage`.
- O backend deve validar o projeto Firebase exato. Política de revogação/
  disabled user será registrada em ADR; operações destrutivas exigem tratamento
  mais forte do que reads comuns.
- Recurso inexistente e recurso de outro owner devem ter resposta indistinguível
  quando necessário para evitar enumeração.
- CORS usa allowlist exata por ambiente, sem wildcard e sem credenciais por
  cookie. O marketing host não recebe acesso implícito à API.
- Em `401`, o frontend pode forçar um único refresh e repetir reads ou writes
  idempotentes; nunca repetir write não idempotente cegamente.
- Banco fica em schema/roles privados; nenhuma anon key/credencial Supabase é
  distribuída ao browser. Se RLS for adotada, deve usar o Firebase UID definido
  transacionalmente e ser testada com pooling real, sem `auth.uid()`.

## 9. Estratégia de testes

### Frontend

- unit tests para formatadores, validações, reducers de estado e HTTP;
- component tests para formulários, estados, auth UX e acessibilidade;
- integration tests com API simulada/contract fixtures;
- E2E para login, Portfolio, Asset, Transaction, Quotes e dashboards;
- teclado, zoom, mobile, contraste, loading/error/empty/partial/offline;
- testes de refresh de token, 401 e autorização visual sem confundir UI com
  segurança.

### Backend

- Domain unit/property/golden-master tests;
- Application/use-case tests sem controller/EF;
- API contract tests e Problem Details;
- integração real com PostgreSQL para EF, transações e queries;
- auth tests para issuer/audience/exp/alg/revogação conforme política;
- cross-user A/B em todos os recursos;
- concorrência/idempotência do ledger;
- adapter BRAPI com fixtures, timeout/retry/stale/quota.

### Banco e migração

- migrations up/down ou estratégia forward-only explicitamente testada;
- constraints, FKs, unique, checks, roles e RLS se aplicável;
- locks com duas conexões reais;
- precisão decimal e temporal;
- plano de query/índice para queries críticas;
- import repetido, campos legados, documento inválido, ledger negativo,
  reconciliação e restore/PITR.

### E2E e gates

Compilar não basta. Cada slice exige testes unitários, integração, contrato,
componentes e E2E proporcionais, mais observabilidade em staging. A 020 exige
rehearsal completo e a 021 exige regressão após remoção do legado.

## 10. Deploy, ambientes e observabilidade

- Frontend Vite é artefato estático independente.
- API ASP.NET Core é serviço independente e não depende de Vercel.
- PostgreSQL/Supabase é acessado somente pelo backend/migration job.
- Firebase projects/configurações devem ser separados por ambiente quando
  aplicável; authorized domains e OAuth precisam acompanhar os hosts.
- Variáveis `VITE_*` contêm somente config pública Firebase e base URL da API.
- Secrets de Firebase Admin/validação, PostgreSQL e BRAPI ficam em secret
  manager/workload identity e nunca no bundle.
- Migrations são um passo controlado do release, não startup side effect.
- CI executa frontend lint/typecheck/tests/build; .NET build/tests/analyzers;
  integração PostgreSQL; contratos; E2E selecionado e scans.
- Preview environments precisam de política explícita de CORS/Firebase e não
  devem compartilhar dados produtivos.
- Logs estruturados, traces/correlation ID, métricas de latência/erro, cache
  BRAPI, migrations e reconciliação nascem sem payload financeiro/UID bruto.
- Definir liveness/readiness, alertas, SLO inicial, backup, restore, RTO/RPO e
  runbooks antes do cutover.

## 11. ADRs necessárias

Criar na fase 011, com status `proposed` até evidência suficiente:

1. Topologia alvo e autoridade única dos dados.
2. Limites Domain/Application/Infrastructure/API e regras de dependência.
3. IDs, ownership Firebase e tenancy no PostgreSQL.
4. Modelo relacional e substituição de `assetIdentities`/`assetUsages`.
5. Precisão decimal, arredondamento e representação HTTP/PostgreSQL/C#.
6. Precisão temporal e ordenação determinística do ledger.
7. Validação Firebase ID Token, autorização, revogação e CORS.
8. Concorrência, idempotência e append-only de Transaction.
9. Arquitetura frontend, routing, data layer, cache/state e validação, a validar
   na 012 após a descoberta de produto/UX/UI.
10. Contrato HTTP/OpenAPI, erros e compatibilidade de deploy, provisórios até os
    protótipos e o freeze de cada vertical.
11. BRAPI, cache, timeout, retry, quota e múltiplas instâncias.
12. Supabase PostgreSQL: schema privado, roles, pooling, migration e backups.
13. Migração, write fence, reconciliação, point of no return e retenção.
14. Hosting, domínios, ambientes, observabilidade e CI/CD.
15. Lifecycle de Asset já referenciado por Transaction.

ADRs 003/004 só mudam para `superseded` depois do cutover; 005/006 devem ser
revisitadas para separar princípio de domínio preservado de mecanismo Firestore
descartado.

## 12. Roadmap futuro e itens antigos superseded

As fases futuras 011–028 do roadmap anterior nunca foram executadas. Elas não
são apagadas, mas sua numeração/ordem foi sucedida por 011–021 acima.

| Proposta antiga | Disposição revisada |
| --- | --- |
| 011 Contribution Planning | Retorna após 021, provisoriamente como primeira feature do novo stack. |
| 012 Snapshots & Wealth History | Reavaliar depois de modelar aportes/retiradas/caixa; não gerar histórico semanticamente incompleto. |
| 013 Goals / 014 Emergency Reserve | Permanecem backlog de produto posterior à migração. |
| 015 Expanded Transactions / 016 Cash Ledger | Antecipar antes de histórico quando necessário para distinguir aporte de rentabilidade. |
| 017 Currency & FX | Backlog posterior, preservando moeda original. |
| 018 Import / Export / 019 Account & Data | Permanecem, mas passam obrigatoriamente pela API e PostgreSQL. |
| 020 Trusted Financial Write Boundary | Absorvida por 014 e, sobretudo, 018; não pode esperar o fim do produto. |
| 021 Read Models & Performance | Parte entra em schema/queries 016–019; materialização só com evidência. |
| 022 Security / 023 Observability | Tornam-se requisitos transversais desde 011/013/014. |
| 024 Onboarding / 025 Quality | UX/acessibilidade entram em 012 e por slice; onboarding segue backlog. |
| 026 Engineering Automation | Antecipada para 013. |
| 027 Private Beta / 028 V1 | Continuam marcos, agora condicionados ao gate 021 e às features reordenadas. |

Antes de retomar desenvolvimento normal de features, devem estar concluídas as
fases 011–021. A primeira candidata posterior é Contribution Planning, mas a
ordem entre contribuição, cash ledger e snapshots deve ser confirmada pelo
handoff da 021 e aprendizado de produto.

### 12.1 Respostas objetivas da revisão

1. **O que foi concluído até 010?** Auth, identidade visual, separação de hosts,
   deploy, Firestore/domain, Portfolios, Assets/Transactions, BRAPI, Positions/
   Allocation e dashboards reais.
2. **O que será preservado?** Regras de domínio, IDs, ownership, ledger
   append-only, precisão, archive, estados de Quote, identidade visual útil,
   Firebase Auth e BRAPI.
3. **O que será descartado?** Next runtime/App Router/proxy/Route Handler,
   persistência Firestore e acesso direto do browser, adapters temporários e
   dependência obrigatória da Vercel, somente após cutover/soak.
4. **Por que mudar?** Para criar boundary confiável, persistência relacional,
   separação frontend/backend e uma base de aprendizado/manutenção profissional.
5. **Qual é a arquitetura alvo?** React/Vite → ASP.NET Core em camadas → EF Core
   → PostgreSQL no Supabase, com integrações em Infrastructure.
6. **Como Firebase continua?** O Web SDK mantém login, sessão e refresh no
   frontend; não será substituído por Supabase Auth.
7. **Como o token é validado?** Bearer Firebase ID Token com assinatura,
   algoritmo, issuer, audience, exp/iat/sub validados; owner vem só do subject.
8. **Como Firestore é substituído?** Export/migrador repetível, staging,
   reconciliação, write fence e cutover sem dual-write.
9. **Como EF Core será usado?** Mapeamento/persistência em Infrastructure,
   migrations controladas, Npgsql, transações e testes em PostgreSQL real.
10. **Como Next é substituído?** Inventário dos acoplamentos, skeleton Vite,
    migração por slices e remoção final somente na 021.
11. **Como o frontend é revisado?** A 011 registra o baseline e os acoplamentos;
     a 012 decide a arquitetura por feature, routing, HTTP, cache/state,
     validação, testabilidade e boundaries de UI.
12. **Como UX/UI é revisada?** Auditoria e protótipos de todas as jornadas,
    mobile, acessibilidade, estados, microcopy e design system antes dos freezes.
13. **Como a API é definida?** Capacidades provisórias após UX e OpenAPI
    congelada por vertical slice, com Problem Details e compatibilidade N/N-1.
14. **Como evitar big-bang?** Walking skeleton, Portfolio, ledger e dashboards
    como slices, gates C0–C11, rehearsals e uma autoridade por owner.
15. **Como cada etapa é testada?** Unit/domain/application, component,
    integration PostgreSQL/API, contract, auth, migration, accessibility e E2E.
16. **Como será o deploy?** Frontend estático, API e migration job independentes,
    ambientes separados, CORS/domínios/secrets explícitos e sem lock-in Vercel.
17. **Quais riscos?** Precisão, ordem temporal, cross-user, `SELL`, dados
    inválidos, cache/quota, pooling/RLS, janela, rollback e coexistência longa.
18. **Quais ADRs?** As quinze decisões da seção 11, criadas na 011 e atualizadas
    conforme evidência/cutover.
19. **Quais fases vêm antes de novas features?** Todas as fases 011–021; só o
    handoff da 021 reabre Contribution Planning e o restante do backlog.

## 13. Alternativas descartadas

| Alternativa | Motivo |
| --- | --- |
| Migrar Next para Vite e manter Firestore direto | Não cria boundary confiável nem arquitetura backend alvo. |
| Criar backend inteiro antes de UX | Congela contratos errados e posterga feedback. |
| Portar todo Domain TS para C# de uma vez | Tradução mecânica e risco de longo período sem slice utilizável. |
| Dual-write Firestore/PostgreSQL | Split-brain, ordem/idempotência complexas e rollback ilusório. |
| Supabase direto no frontend | Contorna ASP.NET Core, divide autorização e acopla às APIs proprietárias. |
| Supabase Auth | Decisão fora do escopo; Firebase Auth permanece. |
| EF InMemory/SQLite como prova de banco | Não prova PostgreSQL, locks, constraints, RLS ou tipos reais. |
| Persistir Position como fonte | Cria segunda autoridade patrimonial. |
| Microservices/Redis/queue agora | Complexidade sem necessidade medida. |
| Manter Next Route Handlers após cutover | Deixa dois backends e acoplamento de deploy permanentes. |

## 14. Arquivos, módulos e contratos afetados

### Referências atuais a inventariar/preservar até o cutover

- `src/app/**`, `src/proxy.ts`, `src/lib/host-routing.ts`;
- `src/components/**`, `src/app/globals.css`, `public/brand/**`;
- `src/lib/firebase/client.ts` e componentes de auth;
- `src/domain/**` e testes golden-master atuais;
- `src/data/firestore/**`, `src/data/positions/**`, `src/data/quotes/**`;
- `src/server/firebase-admin.ts`, `src/server/quotes/**`,
  `src/server/data/asset-reader.ts`;
- `firestore.rules`, `firebase.json`, `.env.example`, `package.json`;
- `tests/**`, `scripts/**`, ADRs/specs/tasks 001–010.

### Contratos não negociáveis durante a migração

- Firebase UID verificado define owner; cliente não escolhe owner.
- IDs atuais e referências são preservados.
- Transaction é append-only e idempotente.
- Ordem do ledger não muda por perda de precisão temporal.
- Decimais e arredondamento são exatos e testados.
- Archive/read-only, unicidade de Asset, BRL V1 e estados de Quote são mantidos.
- Dados parciais não viram zero; stale não vira fresh.

### Artefatos alvo esperados, sem impor layout prematuramente

- aplicação React/Vite organizada por feature/domínio;
- solution .NET com projetos API, Application, Domain e Infrastructure;
- projetos de teste por nível;
- OpenAPI e cliente TypeScript tipado;
- migrations EF Core/Npgsql e migrador/reconciliador;
- configuração local/staging/produção e pipelines independentes;
- documentação arquitetural, ERD, runbooks e ADRs.

## 15. Riscos e mitigação

| Risco | Mitigação |
| --- | --- |
| `SELL` malicioso antes do cutover | C0 explícito; se houver usuário não confiável, suspender writes ou planejar bridge temporário confiável, nunca dual-write. |
| Perda de precisão decimal | Canonical strings/golden masters; tipo C# exato; PostgreSQL testado; não assumir `System.Decimal`. |
| Perda de nanos/ordem | ADR temporal e armazenamento lossless/desempate por ID, com fixtures. |
| Documento legado ou ledger negativo | Auditoria, quarantine e bloqueio por owner; nunca corrigir fato silenciosamente. |
| Cross-user leak | Owner do token, predicados compostos, constraints/RLS se adotada e testes A/B. |
| Token inválido aceito | Validação estrita de assinatura/alg/issuer/audience/exp/sub e testes negativos. |
| XSS/token exfiltration | CSP, dependências, sem armazenamento manual do token e sem token em logs. |
| API e UI incompatíveis no deploy | OpenAPI por slice, cliente gerado e compatibilidade N/N-1. |
| Cache BRAPI multiplicar quota | Métricas, rate limit e decisão explícita antes de escalar réplicas. |
| Supabase exposto | Schema/roles privados, sem anon key no browser e CORS não tratado como autorização. |
| Pooler quebrar locks/RLS | Testes no modo real de conexão e migration role separada. |
| Migração exceder janela | Rehearsals, pré-cópia, delta final e go/no-go. |
| Rollback impossível após writes | Point of no return explícito; rollback posterior permanece no PostgreSQL. |
| Duas arquiteturas permanentes | Fase 021 obrigatória e critério de zero tráfego. |
| UX piorar durante port | 012 antes dos freezes, componentes/E2E/a11y por slice. |
| Observabilidade vazar finanças | Allowlist de campos, pseudonimização e testes/revisão de logs. |
| Credencial local ter sido exposta | Verificar histórico sem ler/divulgar segredo; rotacionar se houver evidência. |

## 16. Ordem das subtarefas da fase 011

1. [011-01-inventariar-frontend-e-next.md](../tasks/011-revisao-roadmap-evolucao-arquitetural/011-01-inventariar-frontend-e-next.md)
2. [011-02-mapear-dominio-dados-e-riscos.md](../tasks/011-revisao-roadmap-evolucao-arquitetural/011-02-mapear-dominio-dados-e-riscos.md)
3. [011-03-desenhar-arquitetura-alvo-e-camadas.md](../tasks/011-revisao-roadmap-evolucao-arquitetural/011-03-desenhar-arquitetura-alvo-e-camadas.md)
4. [011-04-modelar-postgresql-e-migracao.md](../tasks/011-revisao-roadmap-evolucao-arquitetural/011-04-modelar-postgresql-e-migracao.md)
5. [011-05-definir-identidade-e-seguranca.md](../tasks/011-revisao-roadmap-evolucao-arquitetural/011-05-definir-identidade-e-seguranca.md)
6. [011-06-revisar-ux-frontend-e-contratos.md](../tasks/011-revisao-roadmap-evolucao-arquitetural/011-06-revisar-ux-frontend-e-contratos.md)
7. [011-07-planejar-testes-ambientes-e-cutover.md](../tasks/011-revisao-roadmap-evolucao-arquitetural/011-07-planejar-testes-ambientes-e-cutover.md)
8. [011-08-registrar-adrs-e-handoff.md](../tasks/011-revisao-roadmap-evolucao-arquitetural/011-08-registrar-adrs-e-handoff.md)

As tarefas 01 e 02 podem ser investigadas em paralelo. A 03 depende dos dois
inventários; 04 e 05 dependem do modelo alvo inicial; 06 pode começar após 01,
mas só fecha o handoff técnico com os insumos de 03/05 e não executa a descoberta
de Produto/UX/UI. A 07 depende de 03–06; 08 fecha decisões, gates e handoff.
Depois do handoff, a 012 executa a descoberta de Produto/UX/UI/IA/frontend e
revisa capacidades, requisitos, DTOs e contratos provisórios antes dos freezes.

## 17. Premissas explícitas

- Não havia ticker explícito no pedido. `010` era o maior prefixo existente em
  `docs/specs/` e `docs/tasks/`; portanto foi escolhido `011`.
- O slug é `revisao-roadmap-evolucao-arquitetural`.
- A stack alvo e a permanência de Firebase Auth/BRAPI são decisões, não opções a
  reabrir.
- Supabase será PostgreSQL gerenciado; suas APIs de dados/Auth não são requisito.
- O volume real, janela de manutenção, RTO/RPO, hosting, router e bibliotecas de
  frontend ainda precisam de discovery e não bloqueiam este plano.
- Uso atual pequeno/interno não transforma a fragilidade de `SELL` em garantia;
  o risco precisa ser aceito ou contido em C0.
- A migração preservará fatos e IDs. Inconsistências serão reportadas e
  quarentenadas, não normalizadas silenciosamente.
- Nenhuma fase 011–021 adiciona feature de produto que não seja necessária à
  migração/paridade.
- Fases futuras do roadmap antigo permanecem como histórico de intenção, mas
  sua antiga numeração não é ordem executável depois desta revisão.
- O roadmap canônico foi sincronizado com esta revisão em
  `docs/roadmap/reserva-clara-roadmap.md`; spec e roadmap devem permanecer
  coerentes, com a spec detalhando os critérios e o roadmap apresentando a
  sequência oficial.

## 18. Definição de pronto desta revisão

- spec, overview e oito subtarefas existem e têm ticker/links consistentes;
- fases 001–010 estão preservadas como concluídas;
- fases 011–021 têm objetivo, contexto, escopo, entregáveis, tasks, dependências,
  aceite, testes, riscos e decisões;
- arquitetura alvo, Firebase token, EF Core/PostgreSQL, Vite, baseline de UX,
  descoberta de Produto/UX/UI na 012, API, testes, deploy, migração incremental e
  remoção antiga estão explícitos;
- itens antigos superseded estão mapeados, não apagados;
- nenhuma implementação, deploy, migration ou segredo foi criado/alterado;
- o roadmap canônico está sincronizado sem alterar código, deploy, banco ou
  configuração externa.

## Referências

- `AGENTS.md`.
- `docs/roadmap/reserva-clara-roadmap.md` (roadmap canônico sincronizado).
- `docs/specs/001-primeira-vertical-autenticacao.md` a
  `docs/specs/010-real-portfolio-dashboard.md`.
- `docs/decisions/001-autenticacao-google-popup.md`.
- `docs/decisions/003-separacao-host-publico-app.md`.
- `docs/decisions/004-cloudflare-proxied-vercel.md`.
- `docs/decisions/005-portfolio-archive-lifecycle.md`.
- `docs/decisions/006-assets-transactions-ledger.md`.
- `src/app/**`, `src/components/**`, `src/domain/**`, `src/data/**`,
  `src/server/**`, `src/proxy.ts` e `firestore.rules`.
