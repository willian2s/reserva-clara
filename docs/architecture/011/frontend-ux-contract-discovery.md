# 011 — Handoff de UX, frontend e contratos provisórios

- **Ticker:** `011`
- **Entrada:** `011-01`, `011-02`, `011-03` e `011-05`
- **Destino:** fase `012 — Product, UX/UI, Information Architecture & Provisional API Discovery`
- **Estado:** baseline técnico e handoff; nenhum contrato está congelado

## 1. Propósito e fronteira

Este documento evita que a fase 012 precise redescobrir a aplicação atual do zero.
Ele registra o que foi observado nas fases 001–010, os acoplamentos que precisam
ser removidos ou adaptados, os problemas conhecidos e as perguntas que devem ser
respondidas antes de congelar uma vertical slice.

O documento **não** decide a nova arquitetura de informação, não redesenha telas,
não escolhe router, biblioteca de estado/cache ou design system e não fecha DTOs,
endpoints ou payloads. Os exemplos de capacidade, sucesso, erro e estado abaixo
são ilustrativos e deliberadamente provisórios. A 012 pode mantê-los, simplificá-
los, reorganizá-los ou descartá-los após pesquisa, walkthroughs e protótipos.

### Invariantes que não devem ser perdidos na descoberta

- Firebase Authentication continua sendo a identidade do usuário; `AuthGate` é
  somente UX e nunca uma fronteira de autorização.
- O browser não acessa Firestore/PostgreSQL diretamente na arquitetura alvo e não
  chama BRAPI; o backend deriva o owner do Firebase ID Token verificado.
- `Transaction` permanece o fato patrimonial; posições, alocação e dashboards são
  derivações reconstruíveis.
- IDs legados, ownership, archive/restore, ledger append-only, precisão decimal,
  data civil e ordenação temporal precisam ser preservados ou ter divergência
  explicitamente justificada.
- Quote `stale` é identificada como stale e `unavailable` não vira zero; totais
  parciais não podem ser apresentados como completos.

## 2. Evidência e baseline atual

O baseline foi consolidado a partir do inventário `011-01`, do mapa de domínio e
dados `011-02`, dos limites de camadas `011-03`, da identidade e segurança
`011-05`, das specs 001–010 e da árvore atual de `src/app`, `src/components`,
`src/data`, `src/domain` e `src/server`. Não houve pesquisa com usuários,
avaliação heurística, teste de protótipo ou acesso a dados produtivos nesta fase.

### 2.1 Inventário descritivo das jornadas 001–010

| Fase/capacidade | Jornada observada hoje | Estados/componentes observados | Dependência de dados/capacidade | Pergunta que fica para 012 |
| --- | --- | --- | --- | --- |
| 001 — Authentication | Usuário entra em `/login`, autentica com Google, aguarda restauração de sessão e segue para `/dashboard`. | `GoogleSignIn`, `AuthGate`, loading, redirect e erro de popup; logout visível não foi encontrado. | Firebase Web Auth, refresh de sessão e futura chamada HTTP autenticada. | Como login, sessão expirada, logout, erro, conta bloqueada e retorno à origem devem funcionar em desktop e mobile? |
| 002 — Brand & Design System | Usuário encontra a marca na superfície pública e usa controles/tipografia consistentes na aplicação. | Inter, tokens CSS, `button`, `card`, `input`, `label`, foco visível e responsividade. | Assets estáticos e tokens; não depende de API. | Quais tokens e componentes continuam úteis depois de testar densidade financeira, contraste e zoom? |
| 003 — Public / App Separation | Usuário acessa a landing no host público e a aplicação no host app; redirects diferenciam as superfícies. | Route groups, shell protegido, skip link, `main#main-content`, proxy e 404 contextual. | Política de host/redirect na infraestrutura, não autorização de dados. | A separação de hosts ainda é a melhor IA e como links/404/query string devem se comportar no alvo? |
| 004 — Production Deployment | Aplicação é publicada como Next/Vercel com hosts, TLS, variáveis e previews. | Configuração de deploy e `X-Robots-Tag` em local/preview; não é fluxo de produto. | Frontend estático, API independente, CORS e Firebase por ambiente no alvo. | Quais ambientes, origens e mensagens de indisponibilidade precisam ser representados na UX? |
| 005 — Domain & Firestore Foundation | Usuário trabalha com carteiras, ativos e operações sob seu próprio namespace. | Repositories, parsers/converters, Rules default-deny, value objects e estados de validação. | Firestore direto no browser hoje; API/Application/relacional no alvo. | Quais conceitos devem aparecer para o usuário e quais registries/guards são somente detalhes de infraestrutura? |
| 006 — Portfolio Management | Usuário lista carteiras ativas/arquivadas, cria, renomeia, arquiva, restaura e abre o detalhe. | `PortfolioList`, `PortfolioCreateForm`, `PortfolioDetail`, settings, loading/error/empty/retry. | CRUD de Portfolio, archive/restore e leitura do dashboard. | Carteiras ativas/arquivadas, criação e settings continuam separados? Quais confirmações e feedback evitam ações acidentais? |
| 007 — Assets & Transactions | Usuário cadastra/edita ativos e registra `buy`/`sell` dentro de uma carteira; consulta histórico e settings. | `AssetCatalog`, formulários, `TransactionLedger`, validação, estados de referência e archive. | Assets owner-scoped, Transactions append-only, saldo derivado e futura escrita confiável/idempotente. | Como explicar identidade do Asset, venda, taxas, correção compensatória, conflito e operação arquivada sem transformar regra interna em ruído? |
| 008 — Quotes & BRAPI | Usuário vê cotações associadas a Assets compatíveis e pode receber stale/unavailable. | `quote-client`, cards/tabelas financeiras, retry, loading, erro sanitizado e lote máximo atual de 20. | Capacidade de Quotes autenticada; BRAPI somente no backend e cache process-local atual. | Quando cotar, como expor horário/frescor/quota e qual feedback é acionável sem sugerir garantia de preço? |
| 009 — Positions & Allocation | Usuário consulta posições abertas, custo médio, valor corrente e composição derivada. | Reducer, `Position`, `MarketPosition`, Allocation, estados empty/complete/partial e moeda incompatível. | Ledger + Assets + Quotes; nenhuma Position persistida. | Que linguagem ajuda a distinguir custo, patrimônio conhecido, diferença nominal e performance histórica ainda inexistente? |
| 010 — Real Portfolio Dashboard | Usuário consulta o consolidado de carteiras ativas e o detalhe de uma carteira ativa/arquivada. | Dashboard global/detalhe, refresh manual, cards/listas, cobertura de Quotes, partial/stale/unavailable. | Read model derivado, catálogo/ledgers e Quotes deduplicadas; arquivadas fora do global. | O consolidado atual é a melhor entrada? Quais comparações, hierarquia, filtros e ações devem ser testados antes de definir capacidades? |

Esse inventário descreve o comportamento e os conceitos encontrados; não afirma
que a jornada atual deve ser preservada. A 012 pode manter, simplificar,
reorganizar, substituir, remover ou dividir qualquer fluxo com justificativa.

### 2.2 Navegação e superfícies atuais

| Superfície | Arquivo/tela atual | Natureza dos dados | Situação na migração |
| --- | --- | --- | --- |
| `/` | Landing em `(marketing)` | Pública, sem dados patrimoniais | Reescrever como entrada pública do frontend estático; conteúdo e SEO serão validados na 012. |
| `/login` | `GoogleSignIn` em `(app)` | Firebase Web Auth | Adaptar para o shell escolhido; não transportar APIs de navegação Next. |
| `/dashboard` | `GlobalDashboard` em `(protected)` | Portfolios, Assets, Transactions e Quotes derivados | Reavaliar jornada e capacidade de leitura; não assumir o layout atual. |
| `/assets` | `AssetCatalog` | CRUD de Asset e Quotes | Reavaliar catálogo, identidade, lifecycle e feedback. |
| `/portfolios` | `PortfolioList` e criação | Portfolio ativo/arquivado | Candidata a primeira slice, mas contrato e IA dependem da 012. |
| `/portfolios/[portfolioId]` | `PortfolioDetail` | Read model de posições e Quotes | Reavaliar detalhe, estado arquivado e ações contextuais. |
| `/portfolios/[portfolioId]/transactions` | `TransactionLedger` e formulário | Ledger por Portfolio | Reavaliar operação, validação, conflito e explicação de append-only. |
| `/portfolios/[portfolioId]/settings` | `PortfolioSettings` | Rename/archive/restore | Reavaliar separação de configuração e ações destrutivas. |
| `POST /api/quotes` | Route Handler Next | Bearer validado, Assets do owner e BRAPI backend-only | Responsabilidade provisoriamente mapeada para capacidade de Quotes da API alvo. |
| 404/host | `not-found.tsx`, `src/proxy.ts` | Contexto de host e redirects | Política de infraestrutura/shell a validar; não é autorização. |

## 3. Baseline técnico de frontend

### 3.1 Organização observada

| Área | Baseline atual | Implicação para React/Vite |
| --- | --- | --- |
| Entrypoints | App Router, route groups e layouts em `src/app/**`. | Rotas, layout e host policy precisam de boundaries independentes; o router é decisão da 012. |
| Features | Componentes agrupados principalmente por `auth`, `dashboard`, `portfolio`, `asset`, `transaction` e `financial`. | Organização por feature é hipótese útil, não decisão; validar contra jornadas e dependências reais. |
| Domínio | `src/domain/**` concentra value objects, reducer, Position, Allocation, Quote e summaries. | Preservar semântica e testes; não mover regra financeira para componentes ou DTOs. |
| Data/services | Repositories Firestore no browser, read-side client-only e `quote-client` para Route Handler. | Substituir persistência por cliente HTTP; separar composição de tela, cache e transporte. |
| Hooks | Hooks de Auth, Portfolio e dashboards coordenam loading, efeitos, refresh e request identity. | Reavaliar fronteira de estado de servidor, sessão e apresentação; não escolher store global por antecipação. |
| UI | shadcn `base-nova`/Base UI, Tailwind 4 CSS-first, tokens em `globals.css`, componentes financeiros reutilizáveis. | Reuso é conceitual e sujeito a teste de acessibilidade, densidade e mobile. |
| HTTP | Um Route Handler de Quotes, same-origin, Bearer obtido pelo Firebase Web SDK. | A futura API deve ser independente de Next; métodos, URLs, DTOs e geração de cliente continuam abertos. |
| Estado/cache | Estado local por tela, request ID para descartar resposta antiga e cache de Quotes no processo servidor. | A 012 deve decidir o mínimo necessário para estado de sessão, servidor, formulário e feedback; não há evidência para cache global. |
| Validação | Value objects/parsers e validações em formulários/repositories; Rules complementam o Firestore. | Separar validação de interação, contrato HTTP e invariantes de Domain; preservar strings decimais. |
| Testes | `node:test` para domínio/read-side/Quotes/Rules; sem runner React, component tests ou E2E. | A 012 deve propor experimentos testáveis e a 013 deve tornar a pirâmide reproduzível. |

### 3.2 Fluxo atual e boundaries

```text
GoogleSignIn/AuthGate
  → Firebase Web Auth no browser
  → repositories Firestore no browser
  → read-side de posições/dashboards
  → getIdToken()
  → POST /api/quotes
  → Firebase Admin + Asset reader + BRAPI no servidor Next
```

Na arquitetura alvo, a direção conceitual é:

```text
React/Vite UI
  → cliente HTTP + Firebase ID Token
  → ASP.NET Core API
  → Application/Domain
  → Infrastructure/EF Core
  → PostgreSQL privado
                       └→ BRAPI
```

Essa direção não escolhe router, cliente HTTP, query/cache library, serialização
de erro ou formato final de recursos. Ela somente preserva os trust boundaries:
Firebase fornece identidade, a API autoriza e o backend acessa persistência e
BRAPI.

## 4. Acoplamentos Next.js e problemas conhecidos

| Acoplamento/gap | Evidência atual | Tratamento a investigar/implementar depois | Risco se for apenas transportado |
| --- | --- | --- | --- |
| `next/link`/`next/navigation` | Links, redirects e refresh em telas, Auth e shell. | Escolher navegação após walkthrough de jornadas e host policy. | URLs quebradas, histórico/foco inconsistente e router escolhido pela implementação antiga. |
| `next/image`/`next/font/google` | Landing, login e shell. | Estratégia de assets/fontes no artefato estático. | Bundle, carregamento e acessibilidade alterados sem evidência. |
| App Router/layouts/`PageProps`/`LayoutProps` | Wrappers server com páginas client e params dinâmicos. | Modelar shell e rotas conforme IA da 012; não presumir SSR privado. | Reproduzir estrutura de pastas sem reproduzir necessidade do usuário. |
| `src/proxy.ts` e `NextRequest/NextResponse` | Allowlist de hosts, redirects, 404 e bloqueio público de Quotes. | Mover host policy para infraestrutura/reverse proxy e deixar autorização na API. | Confundir canonicalização com segurança; perder query string ou abrir host indevido. |
| Route Handler `/api/quotes` | Único endpoint de negócio, com Firebase Admin e BRAPI. | Redefinir capacidade de Quotes após UX; ASP.NET Core/Infrastructure será o destino. | Congelar URL/DTO pela rota legada ou vazar provider ao cliente. |
| Firebase/Firestore singleton no browser | Auth, repositories e hooks dependem de módulos singleton. | Manter Firebase Web somente para Auth; injetar cliente HTTP e testar estados isoladamente. | Testes frágeis, acesso direto ao banco e acoplamento de sessão com dados. |
| Read-side client-only e scans completos | Ledgers/catálogos são carregados e compostos no browser. | Reavaliar queries, paginação e capacidades de leitura por jornada. | Latência, payload excessivo e contratos orientados pelo schema Firestore. |
| Metadata/not-found request-time | Metadata em layouts e `headers()` no 404. | Reproduzir apenas necessidades públicas no shell/infra. | Levar sem necessidade uma dependência de runtime Next. |
| Variáveis de ambiente | `NEXT_PUBLIC_*` públicas e segredos server-only separados. | Somente config pública Firebase/base URL pode chegar ao bundle `VITE_*`. | Expor Admin, PostgreSQL ou BRAPI em build/preview. |
| Ausência de boundaries de erro | Não há `loading.tsx`, `error.tsx` ou boundary equivalente sistemático. | Experimentar taxonomia de estados e recovery por jornada. | Erros de rede, sessão e domínio viram mensagens genéricas ou tela vazia. |
| Gaps de UX/a11y | Logout visível, nav ativa, offline/reconexão, dialog/foco e testes automatizados ausentes. | Fazer auditoria e protótipos na 012. | Declarar conformidade ou preservar padrões inadequados sem evidência. |

O fato de as páginas atuais serem Server Components wrappers não constitui
requisito de SSR privado: os dados patrimoniais aparecem após hidratação e não há
Server Actions, cookies de sessão ou fetch privado server-side catalogados.

## 5. Jornadas obrigatórias para a 012 e dependências UX/API

Cada item é uma pergunta de descoberta, não uma decisão de produto.

| Jornada a revisitar | Cenários mínimos | Capacidade de API que a UX pode exigir | Evidência para sair da 012 |
| --- | --- | --- | --- |
| Entrada, sessão e recuperação | login, sessão restaurada, logout, token expirado, refresh único, usuário desabilitado, retorno após login e offline | `session/identity` conceitual; retry de leitura idempotente; erro de autenticação sanitizado | Walkthrough desktop/mobile, estados e copy aprovados; regra de retry não idempotente documentada. |
| Shell, navegação e host | landing/app, deep link, 404, redirect, back/forward, foco e host não permitido | capabilities não patrimoniais de navegação/configuração | Mapa de IA e teste de teclado/URL sem depender de Next. |
| Portfolio lifecycle | listar ativas/arquivadas, criar, renomear, arquivar/restaurar, vazio, conflito e erro | list/get/create/rename/archive/restore de Portfolio, ainda sem URL/DTO final | Protótipo responsivo e matriz de estados/ações; archive não confundido com delete. |
| Asset catalog/lifecycle | criar, editar identidade, duplicidade, usado por Transaction, indisponível e filtros | list/get/create/update/lifecycle de Asset; conflito de identidade | Decisão justificada sobre edição de Asset referenciado e mensagens acionáveis. |
| Transaction/ledger | buy/sell, fee, precisão, saldo insuficiente, retry, concorrência, append-only e histórico | commands/queries de Transaction, idempotency/conflict e validação de saldo | Protótipo do formulário/histórico e contrato de erro derivado dos cenários, sem congelar endpoint. |
| Quotes e cobertura | fresh, stale, unavailable, provider timeout/rate limit, refresh e símbolo não suportado | quote/read ou valuation capability, lote/deduplicação apenas como hipótese | Teste de copy/feedback: stale não parece atual e unavailable não parece zero. |
| Portfolio detail | carteira vazia, aberta, fechada, arquivada, parcial, moeda incompatível e refresh | read model de Portfolio + positions/valuation, possivelmente uma capacidade composta | Protótipo e walkthrough com dados sintéticos; custo não confundido com aporte/performance. |
| Consolidado | múltiplas carteiras, arquivada fora, falha isolada, total parcial, distribuição conhecida | read model global com escopo explícito e diagnóstico por carteira | Evidência de hierarquia e reconciliação de total/breakdown sem imputar zero. |
| Feedback, acessibilidade e mobile transversal | 320 px, zoom 200%, teclado, foco, contraste, leitor de tela, loading, empty, error, offline | envelopes de estado/erro consistentes entre capabilities | Matriz WCAG e testes de protótipo com critérios observáveis. |

Dependências críticas:

1. a UX decide a intenção e a granularidade da ação;
2. a capacidade de API representa essa intenção, não a tabela PostgreSQL nem a
   tela antiga;
3. Application/Domain validam invariantes e autorização contextual;
4. Persistence e Infrastructure implementam a capacidade sem alterar sua
   semântica;
5. o contrato só congela quando o protótipo da slice, seus estados e testes de
   acessibilidade foram aceitos.

## 6. Mapa preliminar de capacidades e contratos

O mapa usa nomes de capacidade para permanecer independente de framework. Os
nomes, verbos, URLs, envelopes e campos são candidatos para investigação. A 012
deve remover qualquer item que não corresponda a uma jornada aprovada.

| Capacidade provisória | Intenção | Dados que podem ser necessários | Dependências/restrições |
| --- | --- | --- | --- |
| `session/identity` | Estabelecer a sessão no browser e enviar o Firebase ID Token à API. | Estado local de autenticação, expiração e resultado sanitizado. | Não enviar refresh token à API; owner vem somente do `sub` verificado. |
| `portfolio/list` e `portfolio/detail` | Consultar carteiras e lifecycle. | ID opaco, nome, moeda-base, archive e estados de leitura. | Owner implícito no token; carteira arquivada é legível, mas não recebe nova Transaction. |
| `portfolio/commands` | Criar, renomear, arquivar e restaurar. | Input de nome/ação, resultado atualizado e conflito. | Sem decidir se será um ou vários recursos HTTP; concorrência e autorização ficam no backend. |
| `asset/catalog` | Consultar catálogo owner-scoped e identidade econômica. | ID, símbolo, mercado, tipo, moeda, lifecycle e diagnóstico de duplicidade. | BRAPI não é identidade; unique owner-scoped é hipótese do modelo relacional. |
| `transaction/history` | Consultar ledger e estados de histórico. | Fatos append-only, ordem civil/timestamp/ID e paginação futura. | Não transformar read model em fonte; ordem precisa preservar precisão temporal. |
| `transaction/commands` | Registrar buy/sell e futura correção compensatória. | Decimal como string, data civil, fee/moeda, idempotency/conflict e erro de saldo. | Trusted write boundary, lock e idempotência são obrigatórios no alvo; não implementar aqui. |
| `valuation/portfolio` | Compor posições, custo e Quotes de uma carteira. | Posição derivada, custo remanescente, quote freshness, gaps e status. | Sem persistir Position; regras de partial/stale/unavailable são provisórias para UX. |
| `valuation/global` | Compor carteiras ativas e cobertura conhecida. | Entradas por Portfolio, totais, distribuição, gaps e moeda. | Arquivadas fora do escopo; nenhuma conversão FX implícita. |
| `quote/read` | Fornecer valor transitório e seu frescor. | Asset identity, preço decimal, provider symbol, horários e código sanitizado. | BRAPI backend-only; lote 20/cache process-local são baseline atual, não contrato final. |

### 6.1 Forma ilustrativa de sucesso

O seguinte representa **sem compromisso de nomes ou envelope** uma leitura
provisória. Strings decimais e estados discriminados são exemplos para evitar
ambiguidade; a 012 pode mudar a forma após prototipar a jornada:

```json
{
  "data": {
    "scope": "active-portfolios",
    "status": "partial",
    "currency": "BRL",
    "knownAmount": "1234.56",
    "items": [
      {
        "portfolioId": "opaque-id",
        "assetId": "opaque-asset-id",
        "valuation": { "status": "available", "freshness": "stale" }
      }
    ],
    "gaps": [{ "scope": "asset", "reason": "quote-unavailable" }]
  }
}
```

`opaque-id` e os valores são placeholders didáticos, não dados de ambiente. O
contrato final deve decidir se usa `data`, recurso direto ou outra representação,
além de paginação, cache headers, correlation ID e versionamento.

### 6.2 Forma ilustrativa de erro

Um Problem Details provisório pode carregar um tipo estável e um código seguro,
sem token, UID, payload financeiro ou motivo criptográfico detalhado:

```json
{
  "type": "https://api.example.invalid/problems/validation",
  "title": "Não foi possível concluir a operação",
  "status": 422,
  "code": "TRANSACTION_SELL_EXCEEDS_BALANCE",
  "detail": "Revise a quantidade disponível.",
  "traceId": "opaque-trace-id",
  "errors": { "quantity": ["Informe uma quantidade válida."] }
}
```

O status HTTP, o vocabulário, a presença de `traceId`, a localização dos erros e
os códigos ainda precisam ser alinhados entre UX, Application e API. `401` deve
permitir um único refresh controlado para operações apropriadas; um write não
idempotente não deve ser repetido cegamente. Recurso de outro owner pode usar
resposta indistinguível de inexistente conforme a política de segurança de 011-05.

### 6.3 Taxonomia preliminar de estados

| Estado | Semântica provisória | Feedback mínimo a investigar |
| --- | --- | --- |
| `idle` | Nenhuma leitura iniciada ou formulário ainda não submetido. | Ação primária clara, sem spinner permanente. |
| `loading` | Primeira leitura em andamento, sem dado válido. | Progresso percebível e estrutura que não salte excessivamente. |
| `refreshing` | Nova leitura em andamento com dado válido preservado. | Botão ocupado, anúncio discreto e último dado visível. |
| `ready` | Leitura válida e completa para o escopo. | Conteúdo e ações contextuais. |
| `empty` | Não há fatos aplicáveis, distinto de falha. | Explicação e próximo passo, sem gráfico/tabela vazia enganosa. |
| `partial` | Parte conhecida e parte desconhecida/indisponível. | “Valor conhecido”, gaps explícitos e nenhuma imputação de zero. |
| `stale` | Dado utilizável, mas fora da janela fresh. | Texto, horário e ação de atualizar; nunca somente cor. |
| `unavailable` | Recurso/quote não pôde ser obtido; valor não é zero. | Motivo sanitizado, retry quando aplicável e preservação de contexto. |
| `validation` | Input não atende regra local ou de domínio. | Erro junto ao campo, linguagem acionável e foco semântico. |
| `unauthorized` | Sessão ausente/inválida ou ação não permitida. | Reautenticação/logout conforme política, sem revelar recurso. |
| `conflict` | Concorrência, identidade duplicada ou idempotency key divergente. | Explicar que o estado mudou e oferecer releitura; não repetir cegamente. |
| `offline` | Rede indisponível ou reconexão pendente. | Distinguir ausência de rede de indisponibilidade do dado; não prometer escrita offline. |
| `archived/read-only` | Portfolio legível, mas sem novos fatos. | Aviso persistente e ações de escrita desabilitadas com explicação. |
| `fatal-error` | Falha estrutural da capacidade ou composição. | Mensagem sanitizada, retry e preservação do último dado quando possível. |

Essa taxonomia é uma ferramenta de investigação. A 012 deve decidir quais estados
serão comuns, quais são específicos de uma capability e como serão anunciados em
teclado, leitor de tela, mobile e zoom.

## 7. Regra de freeze por vertical slice e compatibilidade

1. A 012 pode alterar requisitos, jornadas, DTOs, códigos de erro e capacidades
   provisórias sem preservar a tela ou o contrato legado por inércia.
2. Nenhum contrato é congelado antes do protótipo correspondente, walkthrough dos
   estados críticos e aceite de acessibilidade/responsividade da slice.
3. O freeze é por slice, não global: Portfolio pode fechar antes de
   Assets/Transactions, e uma mudança posterior não reabre silenciosamente uma
   slice já publicada.
4. Antes do freeze, exemplos desta documentação são hipóteses. Depois do freeze,
   a especificação versionada da slice torna-se a fonte autoritativa daquele
   contrato.
5. Deploys durante a transição devem suportar N/N-1 quando frontend e API forem
   publicados separadamente: o consumidor N e o N-1 precisam de resposta
   compatível durante a janela acordada, ou a mudança exige rollout coordenado.
6. Compatibilidade N/N-1 não autoriza manter dois significados para dinheiro,
   ownership, append-only ou estado de Quote. Mudanças incompatíveis devem usar
   versão explícita, adapter temporário ou feature flag removível com prazo.
7. O backend deve tolerar campos opcionais desconhecidos somente quando isso não
   enfraquecer validação, autorização ou invariantes. O frontend deve degradar de
   forma explícita, nunca converter ausência em zero.
8. Após uma slice ganhar autoridade produtiva, alterações de contrato exigem
   evidência de consumidor, plano de migração, testes de contrato e registro de
   compatibilidade; esta regra não é um freeze antecipado da 011.

## 8. Backlog verificável para a fase 012

| ID | Pergunta/hipótese | Experimento pequeno | Evidência de conclusão |
| --- | --- | --- | --- |
| UX-01 | A navegação atual ajuda a entender patrimônio? | Walkthrough de login → carteira → operação → dashboard com três perfis de tarefa. | Mapa de IA comparado e decisão de manter/simplificar/reorganizar/substituir/remover/dividir cada entrada. |
| UX-02 | O dashboard global deve ser a entrada principal? | Protótipos alternativos de entrada global e lista de carteiras, testados em tarefas de localização e compreensão. | Resultado de tarefas, problemas e decisão justificada. |
| UX-03 | A densidade financeira cabe em 320 px e zoom 200%? | Protótipo com números longos, stale, unavailable, partial e nomes extensos. | Capturas/observações, overflow zero e lista de ajustes. |
| UX-04 | Usuários distinguem custo, patrimônio conhecido e performance? | Teste de linguagem com cenários sem histórico de snapshots. | Copy escolhida e termos proibidos/ambíguos registrados. |
| UX-05 | Como o usuário recupera uma sessão expirada? | Simular 401 em read, write idempotente e write não idempotente. | Fluxo de refresh/logout e política de repetição aprovada. |
| UX-06 | Quais ações de Asset usado são compreensíveis? | Testar editar identidade, arquivar e tentar apagar Asset referenciado. | Decisão de lifecycle e impactos nas capacidades de Asset/Transaction. |
| UX-07 | O formulário de Transaction explica precisão e SELL? | Walkthrough com fee, decimal extremo, saldo insuficiente, retry e conflito. | Campos, validações, Problem Details mapeados e sem decisão de endpoint prematura. |
| UX-08 | A lista de operações precisa de paginação/filtro? | Usar fixtures sintéticas pequenas, médias e grandes e medir tarefa/latência percebida. | Necessidade de query, ordenação e paginação encaminhada à API. |
| UX-09 | Quais estados devem ser compartilhados? | Matriz loading/empty/error/partial/stale/offline por jornada com teste de teclado. | Taxonomia final da 012 e componentes/boundaries a validar na 013. |
| UX-10 | Qual arquitetura frontend minimiza acoplamento sem store global? | Spike descartável de uma leitura e um formulário com fake API, sem escolher biblioteca por hábito. | Critérios comparáveis de testabilidade, cache, invalidação, auth e bundle. |
| API-01 | Quais capacidades correspondem às jornadas aprovadas? | Mapear cada ação do protótipo para command/query e erro observável. | Catálogo provisório revisado, sem URLs finais desnecessárias. |
| API-02 | Que granularidade de read model evita overfetch? | Comparar detalhe e global com fixtures de partial/stale/unavailable. | Payload mínimo suficiente e dependências de query registradas. |
| API-03 | Quais erros são acionáveis e estáveis? | Tabletop com 401, 404 indistinguível, 409, 422, timeout, rate limit e offline. | Matriz Problem Details/copy/retry, sem segredo ou UID. |
| API-04 | Como manter N/N-1 por slice? | Simular cliente anterior e posterior contra envelopes provisórios. | Estratégia de versionamento/adapter e janela de compatibilidade. |
| A11Y-01 | Quais padrões atuais passam e quais falham? | Auditoria de teclado, foco, contraste, leitor de tela, 320 px e zoom 200%. | Matriz WCAG, achados priorizados e critérios de aceite por protótipo. |
| OBS-01 | Que feedback de rede é necessário? | Simular latência, timeout, provider stale e reconexão. | Copy, telemetria mínima e estados de recovery sem expor payload. |

Prioridade sugerida: `UX-01`–`UX-05`, `A11Y-01`, `API-01`–`API-03`, depois
`UX-06`–`UX-10`, `API-04` e `OBS-01`. A ordem é uma sugestão operacional para
reduzir incerteza, não uma nova dependência formal do roadmap.

## 9. Critérios de handoff

A 011-06 está pronta para a 012 quando:

- o baseline de rotas, componentes, dados, estados e acoplamentos Next estiver
  disponível sem necessidade de nova descoberta estrutural;
- as jornadas 001–010 estiverem descritas como comportamento atual e separadas de
  decisões futuras de Produto/UX/UI;
- cada dependência UX/API estiver identificada como capacidade provisória,
  incluindo sucesso, erro e estados parciais;
- a regra de freeze por slice e a compatibilidade N/N-1 estiverem explícitas;
- o backlog possuir perguntas e experimentos com evidência observável;
- não houver redesign final, protótipo final, escolha definitiva de router/
  state/cache/design system ou contrato HTTP congelado.

### Riscos residuais entregues à 012/013+

- Não há pesquisa com usuários nem validação definitiva de acessibilidade; o
  baseline contém hipóteses e gaps, não aprovação da UI atual.
- O contrato de API atual é insuficiente para CRUD patrimonial e o Route Handler
  de Quotes não deve ser copiado como desenho final.
- Sessão expirada, offline, logout visível, navegação ativa, dialog/foco e
  boundaries de erro ainda exigem decisão e testes.
- Scans client-side, cache de Quotes por processo e ausência de testes React/E2E
  permanecem riscos técnicos até as fundações e slices seguintes.
- A decisão de arquitetura frontend, a IA final e a forma dos DTOs podem mudar
  depois dos protótipos; nenhum consumidor deve tratar este documento como API.

## Referências

- `docs/specs/011-revisao-roadmap-evolucao-arquitetural.md`
- `docs/tasks/011-revisao-roadmap-evolucao-arquitetural/011-00-overview.md`
- `docs/tasks/011-revisao-roadmap-evolucao-arquitetural/011-01-inventariar-frontend-e-next.md`
- `docs/tasks/011-revisao-roadmap-evolucao-arquitetural/011-02-mapear-dominio-dados-e-riscos.md`
- `docs/tasks/011-revisao-roadmap-evolucao-arquitetural/011-03-desenhar-arquitetura-alvo-e-camadas.md`
- `docs/tasks/011-revisao-roadmap-evolucao-arquitetural/011-05-definir-identidade-e-seguranca.md`
- `docs/architecture/011/relational-model.md`
- `docs/architecture/011/identity-security.md`
- `docs/architecture/011/data-migration-strategy.md`
