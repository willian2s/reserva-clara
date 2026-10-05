# Roadmap — Reserva Clara

> **Reserva Clara — Seu patrimônio, com clareza.**

Atualizado em: **2026-10-02**

Este documento define a direção de produto e a ordem macro de evolução do Reserva Clara.

Ele não substitui as specs detalhadas de cada fase. Use este roadmap para orientar o que construir, em qual ordem, quais dependências existem entre fases e quais boundaries arquiteturais devem ser preservados.

A especificação de cada fase deve sempre considerar, nesta ordem:

1. estado real da `main`;
2. decisões/ADRs já aceitas;
3. contratos realmente implementados;
4. handoff da fase anterior;
5. este roadmap;
6. documentação técnica atual aplicável.

Quando roadmap e implementação divergirem, o planejamento da fase deve investigar e reconciliar a diferença. O estado real do repositório é a fonte da verdade operacional.

---

# 1. Visão do produto

O Reserva Clara é uma aplicação de organização e planejamento patrimonial.

A evolução conceitual do produto é:

```text
Identidade
    ↓
Carteiras
    ↓
Ativos + Transações
    ↓
Cotações
    ↓
Posições
    ↓
Patrimônio
    ↓
Alocação
    ↓
Planejamento de aportes
    ↓
Histórico
    ↓
Metas
    ↓
Planejamento financeiro
```

Princípio central:

```text
Transactions = fatos
Assets       = identidade
Quotes       = mercado
Positions    = derivação
Snapshots    = histórico materializado
Goals        = intenção
```

Nenhuma projeção derivada deve substituir os fatos que a originaram.

---

# 2. Princípios arquiteturais

## 2.1 Transactions são a fonte da verdade patrimonial

Transactions representam eventos patrimoniais persistidos.

Positions, patrimônio, preço médio, alocação e outras visões derivadas devem ser reconstruíveis a partir do ledger e das fontes externas necessárias.

Não persistir estados derivados como segunda fonte autoritativa sem necessidade concreta.

## 2.2 Asset é identidade, não Position

Asset representa identidade econômica.

Asset não é fonte da verdade para:

- quantidade possuída;
- preço médio;
- valor investido;
- valor atual;
- lucro/prejuízo;
- rentabilidade;
- alocação;
- cotação.

## 2.3 Quotes são dados externos

Quote representa informação de mercado.

Providers externos, incluindo BRAPI, não devem se tornar identidade principal do domínio.

## 2.4 Firestore Rules são autorização

AuthGate e proteções de rota pertencem à experiência.

Autorização real permanece nas Firestore Security Rules e, quando invariantes superarem a capacidade das Rules, em um boundary confiável de escrita.

## 2.5 Multi-portfolio desde a fundação

O domínio suporta múltiplas carteiras por usuário.

Não transformar o produto em modelo de carteira única.

## 2.6 Segurança e privacidade por padrão

Evitar registrar ou expor sem necessidade:

- UID;
- tokens;
- patrimônio;
- quantidade;
- preço;
- valor;
- conteúdo completo de Transaction;
- dados pessoais.

## 2.7 Não antecipar complexidade

Evitar sem necessidade concreta:

- microservices;
- Redis;
- queues;
- GenericRepository;
- state managers globais;
- dependências pesadas;
- infraestrutura administrativa prematura.

---

# 3. Fundação

## 001 — Authentication ✅

### Objetivo

Estabelecer identidade do usuário.

### Entregue

- Google Sign-In;
- Firebase Authentication;
- restauração de sessão;
- login/logout;
- experiência para usuário anônimo;
- configuração sem secrets versionados.

### Boundary

```text
AuthGate        = UX
Firebase Auth   = identidade
Firestore Rules = autorização
```

---

## 002 — Brand & Design System Foundations ✅

### Objetivo

Estabelecer identidade visual e componentes fundamentais.

### Entregue

- identidade Reserva Clara;
- logos e assets;
- Inter;
- tokens;
- paleta;
- componentes base;
- estados de foco;
- responsividade base;
- linguagem visual sem estética de trading.

### Princípio

Cor de marca não equivale automaticamente a lucro ou performance positiva.

---

## 003 — Public / App Separation ✅

### Objetivo

Separar superfície pública e aplicação autenticada.

### Arquitetura

```text
reservaclara.com.br
    → landing pública

app.reservaclara.com.br
    → aplicação autenticada
```

### Entregue

- route groups;
- host routing;
- proxy;
- landing pública;
- app autenticado isolado.

---

## 004 — Production Deployment ✅

### Objetivo

Publicar a arquitetura real.

### Entregue

- Vercel;
- Cloudflare;
- domínio;
- TLS;
- Firebase Authorized Domains;
- variáveis de ambiente;
- previews protegidos;
- smoke de autenticação;
- rollback documentado.

---

## 005 — Domain Model & Firestore Foundation ✅

### Objetivo

Construir a fundação de dados.

### Entregue

- Firestore;
- namespace owner-scoped;
- Security Rules default deny;
- Emulator Suite;
- runtime validation;
- parsers;
- converters;
- repositories orientados ao domínio;
- value objects financeiros;
- Portfolio persistido;
- testes de isolamento.

### Value objects importantes

```text
CurrencyCode
MoneyMinor
DecimalString
Quantity
UnitPrice
BasisPoints
CivilDate
DocumentId
```

---

## 006 — Portfolio Management ✅

### Objetivo

Entregar a primeira vertical patrimonial utilizável.

### Rotas

```text
/portfolios
/portfolios/[portfolioId]
/portfolios/[portfolioId]/settings
```

### Entregue

- listar carteiras;
- criar;
- abrir;
- renomear;
- administrar;
- shell protegido;
- AuthGate;
- navegação mínima;
- acessibilidade;
- responsividade;
- 404 contextual;
- produção validada.

### Handoff

A fase estabeleceu que um Portfolio com ledger não pode depender de hard delete do documento pai.

---

# 4. Ledger patrimonial

## 007 — Assets & Transactions ✅ (emenda de lifecycle concluída)

### Objetivo

Adicionar catálogo privado de Assets e ledger owner-scoped de operações patrimoniais iniciais.

O núcleo da fase foi concluído. A política de produto abriu uma emenda no
mesmo ticker, planejada em `docs/tasks/007-assets-transactions/007-10` a
`007-14`, para editar Asset mantendo o `assetId` e excluir somente quando não
houver Transaction vinculada. A emenda troca Asset e registry atomicamente,
não faz cascade e não altera o escopo de Quotes; 008 continua seu próprio
trabalho e não é o lugar para implementar esse CRUD.

### Portfolio lifecycle

Hard delete foi substituído por archive/restore antes da abertura de Transactions.

Portfolio arquivada:

- permanece legível;
- preserva ledger;
- não aceita novas mutações patrimoniais;
- pode ser restaurada;
- não sofre cascade.

### Asset

Asset representa identidade econômica e é user-scoped, reutilizável entre carteiras.

Modelo persistido atual:

```text
users/{uid}
├── assets/{assetId}
├── assetIdentities/{identityKey}
└── portfolios/{portfolioId}
    └── transactions/{transactionId}
```

A identidade canônica considera dimensões como:

- symbol;
- market;
- assetType;
- currency.

Registry técnico owner-scoped garante unicidade concorrente da identidade sem transformar ticker em document ID.

Asset não contém Position, quantidade, preço médio, valor atual ou performance.

### Transaction

V1 implementada:

```text
buy
sell
```

O ledger é append-only.

Contrato contém, conforme a implementação final da 007:

- kind;
- assetId;
- quantity;
- unitPrice;
- effectiveDate;
- createdAt;
- taxa monetária opcional conforme contrato final da fase.

A UI segue convenções brasileiras de data e decimal, enquanto a persistência continua canônica.

### Integridade

A 007 entregou:

- decimais canônicos;
- reducer com `bigint`;
- ordenação determinística;
- validação owner-scoped;
- referência Asset ↔ Transaction;
- archive gate;
- idempotência/reconciliação;
- Rules fechadas para schema e ownership;
- catálogo de Assets;
- histórico e criação de operações;
- testes de domínio;
- Emulator Suite;
- gates e smoke finais.

Exemplo de invariant quantitativo:

```text
BUY 10
SELL 8   ✅

BUY 10
SELL 15  ❌ pelo repository/reducer
```

### Dívida arquitetural conhecida

Firestore Security Rules não conseguem reconstruir o ledger completo para garantir saldo quantitativo contra um cliente autenticado que ignore o repository.

A garantia forte desse invariant exigirá futuramente um boundary confiável de escrita/aggregate.

Isso não bloqueia a 008 ou a 009, mas deve permanecer explícito.

---

# 5. Dados de mercado

## 008 — Quotes & BRAPI ✅

### Objetivo

Adicionar preços de mercado sem contaminar a identidade do domínio.

### Arquitetura esperada

```text
Asset
  ↓
Provider Mapping
  ↓
QuoteService
  ↓
BRAPI
```

Nunca:

```text
Asset.id = brapiId
```

### Escopo esperado

- integração BRAPI server-side;
- token somente em environment server;
- provider adapter;
- mapping Asset ↔ provider;
- Quote type;
- preço;
- moeda;
- timestamp da cotação;
- tratamento de stale;
- timeout;
- erros sanitizados;
- retry controlado;
- cache;
- deduplicação de chamadas.

### QuoteService

Contrato conceitual:

```ts
getQuote(asset)
getQuotes(assets)
```

A UI não chama BRAPI diretamente.

### Cache

Definir durante o planejamento:

- TTL;
- stale behavior;
- deduplicação;
- limites;
- cache key;
- erro do provider;
- fallback.

### Critério fundamental

```text
BRAPI indisponível
       ↓
ledger continua funcionando
```

### Fora de escopo

- Position;
- patrimônio;
- preço médio;
- rentabilidade;
- allocation;
- FX completo;
- recomendação.

---

# 6. Motor patrimonial

## 009 — Positions & Allocation ✅

### Objetivo

Derivar posições a partir do ledger.

```text
Transactions
      ↓
Position Engine
      ↓
Positions
```

### Position

Conceitualmente derivada por:

```text
portfolioId
assetId
quantity
averageCost
investedAmount
```

Nenhum desses valores substitui Transactions como fonte da verdade.

### Escopo

- reducer completo de posição;
- quantidade;
- custo acumulado;
- preço médio;
- tratamento de venda;
- taxas da Transaction no custo conforme regra definida;
- operações retroativas;
- precisão decimal;
- posições zeradas;
- múltiplos ativos;
- invariantes.

### Com Quotes

```text
Position
+
Quote
=
Market Position
```

Permitindo:

- valor atual;
- valor investido;
- diferença nominal.

### Allocation

```text
assetMarketValue / portfolioMarketValue
```

### Regra

Não persistir Position como fonte autoritativa.

Se houver read model/cache, ele deve ser reconstruível a partir do ledger.

---

# 7. Dashboard patrimonial real

## 010 — Real Portfolio Dashboard ⏭️

### Objetivo

Mostrar patrimônio real.

### Dashboard global

- patrimônio total;
- distribuição entre carteiras;
- resumo de posições;
- atualização de cotações;
- ativos sem cotação.

### Dashboard da carteira

Em:

```text
/portfolios/[portfolioId]
```

Mostrar:

- patrimônio;
- Valor investido;
- composição;
- posições;
- distribuição;
- atualização dos dados.

### Visualizações

Possíveis:

- composição por ativo;
- composição por classe;
- breakdown da carteira.

Não mostrar performance histórica antes de existir histórico confiável.

---

# 8. Planejamento de alocação

## 011 — Contribution Planning

### Objetivo

Indicar como um novo aporte pode aproximar a carteira da alocação definida pelo próprio usuário.

### Target Allocation

Modelo conceitual:

```text
Portfolio
└── allocationTargets
      assetId
      targetBasisPoints
```

Invariant:

```text
Σ target = 10000 bp
```

### Motor

```ts
calculateNextContribution({
  availableAmount,
  positions,
  targetAllocations,
})
```

### V1 esperada

- sem vendas;
- somente novos aportes;
- priorizar ativos abaixo da meta;
- respeitar precisão e limites.

### Posicionamento

Não apresentar o resultado como:

- recomendação de investimento;
- market timing;
- promessa;
- seleção do melhor ativo.

É planejamento da alocação definida pelo usuário.

---

# 9. Histórico patrimonial

## 012 — Snapshots & Wealth History

### Objetivo

Responder:

> Como meu patrimônio evoluiu?

Transactions dizem o que aconteceu.

Snapshots materializam uma visão patrimonial em determinado momento.

### Snapshot conceitual

```text
portfolioId
capturedAt
portfolioValue
positions[]
quote references/version
```

### Planejar

- frequência;
- geração;
- reconstrução;
- idempotência;
- timezone;
- versão do modelo.

### UI

- evolução patrimonial;
- patrimônio ao longo do tempo;
- aportes versus crescimento, quando semanticamente correto.

### Regra

```text
aporte ≠ rentabilidade
```

Snapshots não substituem Transactions.

---

# 10. Metas financeiras

## 013 — Goals

### Objetivo

Relacionar patrimônio a objetivos.

### Exemplos

- imóvel;
- viagem;
- educação;
- aposentadoria;
- independência financeira;
- objetivo personalizado.

### Modelo conceitual

```text
Goal
name
targetAmount
targetDate?
portfolioId?
priority?
createdAt
updatedAt
```

### Métricas

- valor alvo;
- valor associado;
- percentual atingido;
- gap;
- contribuição necessária.

Projeções devem usar hipóteses explícitas.

---

# 11. Reserva de emergência

## 014 — Emergency Reserve

### Objetivo

Tratar reserva de emergência como domínio separado dos investimentos de longo prazo.

### Configuração possível

- despesas essenciais mensais;
- meses desejados;
- valor manual.

### Exemplo

```text
R$ 6.000 × 6 meses
= R$ 36.000
```

### Estado

- valor atual;
- meta;
- percentual;
- gap.

### Integração futura

```text
Reserva incompleta
      ↓
priorizar reserva

Reserva completa
      ↓
planejamento da carteira
```

---

# 12. Ledger financeiro expandido

## 015 — Expanded Transactions

### Objetivo

Expandir o ledger de forma incremental.

Possíveis novos eventos:

```text
dividend
income
fee
tax
contribution
withdrawal
transfer
```

A 007 já introduziu taxa opcional como parte do contrato de buy/sell. Esta fase deve distinguir claramente taxas embutidas em uma operação de eventos financeiros independentes.

Não adicionar todos os eventos automaticamente.

Cada tipo precisa definir:

- efeito quantitativo;
- efeito financeiro;
- moeda;
- custo;
- histórico;
- invariantes.

### Correções

Avaliar eventos como:

```text
reversal
correction
```

em vez de alterar fatos históricos silenciosamente.

---

# 13. Caixa e fluxo financeiro

## 016 — Cash Ledger

### Objetivo

Representar saldo financeiro completo da carteira.

Buy/sell permite reconstruir posição de ativos, mas não representa sozinho um ledger completo de caixa.

### Domínio

```text
cash inflow
cash outflow
dividends
fees
taxes
purchases
sales
```

### Resultado

```text
Portfolio
├── Securities
└── Cash
```

Permitindo:

- saldo;
- aportes;
- retiradas;
- dividendos;
- caixa por moeda.

---

# 14. Multi-moeda e FX

## 017 — Currency & FX

### Objetivo

Suportar patrimônio internacional corretamente.

Distinguir:

```text
Asset currency
Transaction currency
Portfolio base currency
```

### Necessidades

- FX provider;
- taxa por data;
- taxa atual;
- histórico;
- conversão para moeda-base;
- política de arredondamento.

Sempre preservar moeda original.

---

# 15. Importação e exportação

## 018 — Import / Export

### Import

Possíveis fontes:

- CSV;
- planilha;
- extratos futuros.

Pipeline:

```text
Upload
  ↓
Parse
  ↓
Preview
  ↓
Validation
  ↓
Deduplication
  ↓
Confirmation
  ↓
Ledger
```

Nunca importar diretamente sem preview.

### Export

Permitir exportar:

- carteiras;
- ativos;
- transações;
- metas;
- configurações relevantes.

Formatos possíveis:

```text
CSV
JSON
```

---

# 16. Conta e ciclo dos dados

## 019 — Account & Data Management

### Objetivo

Dar controle ao usuário sobre conta e dados.

### Conta

- informações;
- logout;
- exclusão de conta.

### Dados

- export;
- delete;
- retenção;
- archive versus purge.

### Exclusão de conta

Não depender de cascade ingênuo client-side.

Essa fase pode exigir boundary server-side/Admin controlado.

---

# 17. Boundary financeiro confiável

## 020 — Trusted Financial Write Boundary

### Objetivo

Resolver invariantes que Firestore Rules não conseguem garantir sozinhas.

Problema já conhecido desde a 007:

```text
Browser Firebase SDK
       ↓
Firestore Rules
       ↓
não consegue agregar ledger inteiro
```

Arquitetura futura:

```text
Client
  ↓
Trusted Command Boundary
  ↓
Domain validation
  ↓
Firestore
```

### Possíveis responsabilidades

- SELL com garantia forte;
- serialização de mutações;
- comandos financeiros;
- account deletion;
- migrations administrativas;
- operações atômicas complexas.

Não implica microservices.

Objetivo:

```text
1 aplicação
1 banco
1 boundary confiável
```

---

# 18. Performance e escala

## 021 — Read Models & Performance

### Objetivo

Evitar reler o ledger completo indefinidamente.

Possíveis read models:

```text
portfolio summary
asset position
daily snapshot
```

### Regra

```text
read model pode ser apagado e reconstruído
ledger não
```

### Escopo

- paginação;
- cursores;
- índices;
- limites;
- caches;
- consultas eficientes;
- custo Firestore;
- batch quote fetching.

---

# 19. Segurança e privacidade

## 022 — Security & Privacy Hardening

### Objetivo

Preparar o produto para uso público maior.

### Escopo

- threat model;
- revisão de Firestore Rules;
- host isolation;
- abuse de Auth;
- App Check, se necessário;
- CSP;
- security headers;
- dependency audit;
- secrets;
- logs sanitizados;
- rate limits;
- provider abuse;
- data export/delete;
- checklist/pentest.

Cross-user A/B continua sendo requisito de segurança.

---

# 20. Observabilidade

## 023 — Operational Observability

### Objetivo

Saber se o produto está funcionando sem coletar dados financeiros desnecessários.

### Métricas

- erros;
- latência;
- falhas do provider;
- cache hit rate;
- Firestore reads/writes;
- deploy health.

### Logs

Não registrar por padrão:

- patrimônio;
- quantidade;
- preço;
- carteira;
- UID;
- payload financeiro.

Adicionar stack externa somente quando houver necessidade concreta.

---

# 21. Onboarding

## 024 — Product Onboarding

### Objetivo

Ensinar o fluxo principal sem bloquear usuário experiente.

```text
Criar conta
   ↓
Criar carteira
   ↓
Cadastrar primeiro ativo
   ↓
Registrar primeira compra
   ↓
Ver posição
   ↓
Definir alocação
```

### Requisitos

- progressivo;
- dismissível;
- sem wizard excessivo;
- acessível;
- contextual.

---

# 22. Qualidade consolidada

## 025 — Accessibility, UX & Performance Pass

### Objetivo

Fazer auditoria consolidada antes de abertura maior.

### Escopo

- WCAG;
- teclado;
- screen readers;
- contraste;
- mobile;
- zoom;
- touch targets;
- loading;
- erros;
- Core Web Vitals;
- bundle;
- imagens;
- queries;
- perceived performance.

---

# 23. Automação de engenharia

## 026 — Engineering Automation

### Objetivo

Automatizar os gates já adotados manualmente.

Pipeline desejado:

```text
PR
 ↓
domain tests
 ↓
rules tests
 ↓
lint
 ↓
next typegen
 ↓
typecheck
 ↓
build
```

### Também

- CI;
- branch protection;
- preview;
- checks obrigatórios;
- dependency updates;
- rollback documentado;
- deploy coordenado de Rules.

---

# 24. Private Beta

## 027 — Private Beta

### Pré-condição

Fluxo central completo:

```text
login
portfolio
assets
transactions
quotes
positions
dashboard
allocation
contribution planning
history
```

### Objetivo

Descobrir:

- onde usuários erram;
- o que não entendem;
- quais dados faltam;
- quais imports são necessários;
- quais métricas têm valor real.

Foco em aprendizado, não escala.

---

# 25. Reserva Clara V1

## 028 — Public Beta / V1

### Mínimo esperado

```text
Authentication
Portfolio
Assets
Transactions
Quotes
Positions
Dashboard
Target Allocation
Contribution Planning
History
Emergency Reserve
Data Export
Account/Data Controls
Security Hardening
Observability
```

Goals podem entrar na V1 ou imediatamente depois conforme feedback e ritmo do produto.

---

# 26. Pós-V1

A partir daqui, o roadmap deve ser dirigido principalmente por uso real.

Possíveis direções:

```text
029 — Broker / Statement Import
030 — Advanced Goals
031 — Cash-flow Planning
032 — Retirement Scenarios
033 — Tax Reporting Helpers
034 — Family / Household
035 — Shared Portfolios
036 — Notifications
037 — Mobile / PWA Improvements
038 — Additional Quote Providers
039 — Corporate Actions
040 — Advanced Analytics
```

Essas fases são possibilidades, não backlog obrigatório.

---

# 27. Mapa de dependências

```text
001 Auth ✅
   ↓
005 Firestore ✅
   ↓
006 Portfolio ✅
   ↓
007 Assets + Transactions ✅
   ↓
008 Quotes & BRAPI ✅
   ↓
009 Positions + Allocation ✅
   ↓
010 Dashboard ⏭️
   ↓
011 Target Allocation + Contributions
   ↓
012 Snapshots / History
   ↓
┌──────────────┬────────────────┐
│ 013 Goals    │ 014 Emergency  │
│              │ Reserve        │
└──────┬───────┴────────┬───────┘
       ↓                ↓
     Planning Intelligence
              ↓
015+ Ledger expansion / Cash / FX
              ↓
Import / Export / Data Management
              ↓
Trusted Boundary / Scale / Security
              ↓
Private Beta
              ↓
V1
```

---

# 28. Grandes marcos

## Marco A — Fundação ✅

Fases 001–006.

Resultado:

> O usuário consegue entrar e organizar carteiras com segurança.

---

## Marco B — Patrimônio real

Fases 007–010.

Estado atual:

- 007 concluída, incluindo a emenda de lifecycle;
- 008 concluída;
- 009 concluída;
- 010 é a próxima fase.

Resultado esperado ao concluir o marco:

```text
usuário registra operações
        ↓
sistema conhece posições
        ↓
busca preços
        ↓
mostra patrimônio real
```

Esse é o primeiro grande marco de valor patrimonial do produto.

---

## Marco C — Planejamento

Fases 011–014.

O produto evolui de:

> Onde estou?

para:

> Onde quero chegar e qual deve ser meu próximo movimento?

Entram:

- alocação;
- aportes;
- histórico;
- metas;
- reserva.

---

## Marco D — Produto financeiro completo

Fases 015–021.

Entram:

- ledger expandido;
- caixa;
- FX;
- import/export;
- gestão de dados;
- boundary confiável;
- escala.

---

## Marco E — Produto público

Fases 022–028.

Entram:

- hardening;
- observabilidade;
- onboarding;
- qualidade;
- CI/CD;
- beta;
- V1.

---

# 29. Sequência crítica

Não pular do ledger diretamente para visualizações sofisticadas.

A sequência crítica é:

```text
Transaction
    ↓
Quote
    ↓
Position
    ↓
Dashboard
```

Essa cadeia forma o núcleo patrimonial do Reserva Clara.

Depois dela, funcionalidades como histórico, alocação, aportes, metas e planejamento podem ser construídas sobre uma base confiável.

---

# 30. Como usar este roadmap no modo Plano

Para planejar uma fase, use:

```text
Planeje a fase XXX — <nome da fase> conforme o roadmap em
docs/roadmap/reserva-clara-roadmap.md e o estado atual do projeto.

Antes de planejar:

- leia AGENTS.md;
- inspecione a main;
- leia specs, decisions e tasks das fases anteriores;
- leia especialmente o handoff da fase imediatamente anterior;
- inspecione a implementação real relacionada;
- preserve decisões arquiteturais já aceitas;
- use o roadmap como direção, não como substituto da realidade do repositório.

Produza somente planejamento/documentação.

Não implemente.
Não faça deploy.
Não altere produção.
Não faça commits automaticamente.

Ao final apresente:

- baseline;
- decisões;
- arquitetura;
- escopo;
- fora de escopo;
- tasks;
- ordem;
- critérios de aceite;
- riscos;
- checkpoints;
- dependências;
- handoff para fases seguintes.
```

Regra:

```text
ROADMAP
= o que queremos construir e em qual ordem

SPEC
= como construiremos determinada fase

REPOSITÓRIO
= o que realmente existe agora
```

A spec da fase pode refinar o roadmap, mas não deve silenciosamente quebrar contratos já aceitos ou antecipar fases posteriores.
