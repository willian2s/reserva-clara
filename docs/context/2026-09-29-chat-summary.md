# Resumo consolidado do projeto — Reserva Clara

Atualizado em: **2026-09-29**

Este documento resume as decisões, arquitetura, progresso e próximos passos discutidos durante o desenvolvimento do Reserva Clara.

Ele serve como contexto rápido para novas sessões/agentes. A fonte da verdade operacional continua sendo a `main`, as specs, ADRs, tasks e o roadmap oficial.

## Produto

**Reserva Clara — Seu patrimônio, com clareza.**

O produto é uma aplicação de organização e planejamento patrimonial. Não deve ser posicionado como terminal de trading, corretora, recomendador de investimentos ou ferramenta focada apenas em orçamento doméstico.

A evolução conceitual é:

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

Princípios centrais:

```text
Transactions = fatos
Assets       = identidade
Quotes       = mercado
Positions    = derivação
Snapshots    = histórico materializado
Goals        = intenção
```

## Stack e infraestrutura

- Next.js 16 + TypeScript.
- React 19.
- Tailwind CSS 4.
- shadcn/ui base-nova + Base UI.
- Firebase Authentication.
- Firestore.
- Vercel.
- Cloudflare para domínio/DNS.
- BRAPI planejada para cotações, sempre via server-side/provider boundary.

Topologia produtiva:

```text
reservaclara.com.br
    → landing pública

www.reservaclara.com.br
    → redirect para apex

app.reservaclara.com.br
    → aplicação autenticada
```

O projeto permanece em um único repositório e um único projeto Next.js.

## Segurança e boundaries

- Firebase Auth fornece identidade.
- AuthGate e guards de rota são UX, não autorização.
- Firestore Security Rules são a autorização atual dos dados.
- Firestore segue default deny.
- Dados são owner-scoped por Firebase `uid`.
- UID não deve ser fornecido por formulário/componentes.
- UI não deve montar paths Firestore nem chamar SDK diretamente quando existe repository.
- Não registrar tokens, UID, patrimônio, quantidades, preços ou payload financeiro em logs/docs sem necessidade.

Dívida arquitetural conhecida desde a 007:

Firestore Security Rules não conseguem reconstruir o ledger inteiro para impedir, sozinhas, um SELL quantitativamente inválido enviado por um cliente autenticado que ignore o repository.

A garantia forte desse invariant deverá futuramente migrar para um trusted financial write boundary.

## Modelo de domínio

### Portfolio

- Multi-portfolio desde o início.
- Base currency V1: BRL.
- Portfolio possui lifecycle por archive/restore.
- Hard delete deixou de ser operação normal antes da abertura do ledger.
- Portfolio arquivada permanece legível, preserva seus filhos e não aceita novas mutações patrimoniais.

### Asset

Asset é identidade econômica, nunca Position.

Não deve armazenar como fonte da verdade:

- quantidade;
- preço médio;
- valor investido;
- valor atual;
- rentabilidade;
- allocation;
- cotação.

Asset é user-scoped e reutilizável entre Portfolios.

Identidade canônica considera:

- symbol;
- market;
- assetType;
- currency.

Existe registry técnico owner-scoped para unicidade concorrente da identidade.

### Transaction

Transaction é fato patrimonial.

V1 implementada:

- `buy`;
- `sell`.

O ledger é append-only.

Contrato inclui, conforme implementação final da 007:

- kind;
- assetId;
- quantity;
- unitPrice;
- effectiveDate;
- createdAt;
- taxa monetária opcional.

Quantidade e preço usam representação decimal canônica, evitando floating point ingênuo.

O reducer de integridade usa `bigint`.

## Firestore

Estrutura relevante atual:

```text
users/{uid}
├── assets/{assetId}
├── assetIdentities/{identityKey}
└── portfolios/{portfolioId}
    └── transactions/{transactionId}
```

Transactions permanecem sob Portfolio.

Assets ficam no namespace do usuário e podem ser reutilizados em múltiplas carteiras.

## Fases concluídas

### 001 — Authentication ✅

Entregou Google Sign-In, Firebase Auth, restauração de sessão e fluxo autenticado.

### 002 — Brand & Design System Foundations ✅

Entregou identidade visual, tokens, Inter e componentes base.

### 003 — Public / App Separation ✅

Separou landing pública e aplicação autenticada por host.

### 004 — Production Deployment ✅

Entregou Vercel, Cloudflare, TLS, domínio, Authorized Domains, previews e smoke produtivo.

### 005 — Domain Model & Firestore Foundation ✅

Entregou:

- Firestore;
- value objects;
- Portfolio;
- runtime validation;
- parsers/converters;
- repositories;
- Security Rules;
- Emulator Suite;
- isolamento owner-scoped.

Value objects importantes incluem:

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

### 006 — Portfolio Management ✅

Entregou:

```text
/portfolios
/portfolios/[portfolioId]
/portfolios/[portfolioId]/settings
```

Usuário consegue listar, criar, abrir, renomear e administrar carteiras.

Também entregou shell protegido, AuthGate, navegação mínima, acessibilidade, responsividade e 404 contextual.

A fase criou o gate arquitetural que obrigou a 007 a trocar hard delete por archive antes de abrir Transactions.

### 007 — Assets & Transactions ✅

Concluída e mergeada na `main`.

Entregou:

- archive/restore de Portfolio;
- hard delete removido;
- catálogo owner-scoped de Assets;
- identity registry técnico;
- contratos de Asset e Transaction;
- decimais canônicos;
- reducer de integridade com `bigint`;
- persistência de Assets;
- persistência de Transactions;
- Rules de Asset/registry/Transaction;
- testes de domínio;
- Emulator Suite;
- rota protegida `/assets`;
- rota de Transactions por Portfolio;
- criação e histórico de `buy`/`sell`;
- taxas opcionais em Transaction;
- convenção brasileira de data/decimal na UI;
- gates e smoke finais.

## Estado atual

A fase 007 está concluída.

Próxima fase do roadmap:

**008 — Quotes & BRAPI**

O roadmap oficial está em:

`docs/roadmap/reserva-clara-roadmap.md`

## 008 — direção esperada

Objetivo: adicionar preços de mercado sem transformar BRAPI em identidade de domínio.

Boundary esperado:

```text
Asset
  ↓
Provider Mapping
  ↓
QuoteService
  ↓
BRAPI
```

Regras importantes:

- BRAPI server-side only;
- token nunca no frontend;
- Asset não usa `brapiId` como identidade principal;
- provider mapping separado do domínio principal;
- cache para reduzir chamadas;
- tratamento de stale/timeout/erro;
- ledger continua funcionando mesmo se BRAPI estiver indisponível;
- não calcular Position/patrimônio ainda.

## 009 — direção esperada

**Positions & Allocation**

Derivar posições exclusivamente de Transactions + Assets, incorporando Quotes quando necessário.

Conceitualmente:

```text
Transactions
      ↓
Position Engine
      ↓
Positions
      +
Quotes
      ↓
Market Positions
```

Position não deve virar fonte autoritativa.

A fase deverá tratar quantidade, custo acumulado, preço médio, vendas, taxas, retroatividade e precisão.

## 010 — direção esperada

**Real Portfolio Dashboard**

Primeiro dashboard patrimonial real, com:

- patrimônio;
- posições;
- composição;
- distribuição;
- atualização de cotações.

Sem inventar performance histórica antes de haver snapshots/histórico confiável.

## Histórico — planejamento patrimonial anterior à migração

> Este resumo foi escrito antes da rebaseline pós-010. As fases abaixo são
> contexto histórico/superseded, não a sequência operacional atual. A sequência
> oficial é 011–021 — Discovery, Architecture, Foundation e Migration — no
> roadmap canônico e na spec 011. Features de produto só retornam após o gate
> da 021.

### 011 — Contribution Planning

Target allocation e cálculo do próximo aporte, inicialmente sem vendas.

### 012 — Snapshots & Wealth History

Histórico materializado e evolução patrimonial.

### 013 — Goals

Metas financeiras e progresso.

### 014 — Emergency Reserve

Reserva de emergência separada da carteira de longo prazo.

## 015–021 — domínio financeiro completo e escala

- 015 — Expanded Transactions.
- 016 — Cash Ledger.
- 017 — Currency & FX.
- 018 — Import / Export.
- 019 — Account & Data Management.
- 020 — Trusted Financial Write Boundary.
- 021 — Read Models & Performance.

A fase 020 deve endereçar explicitamente a dívida de integridade do ledger conhecida desde 007.

## 022–028 — preparação de produto público

- 022 — Security & Privacy Hardening.
- 023 — Operational Observability.
- 024 — Product Onboarding.
- 025 — Accessibility, UX & Performance Pass.
- 026 — Engineering Automation.
- 027 — Private Beta.
- 028 — Public Beta / V1.

## Sequência crítica

A sequência técnica principal a preservar é:

```text
Transaction
    ↓
Quote
    ↓
Position
    ↓
Dashboard
```

Evitar pular diretamente do ledger para dashboards sofisticados antes de Quotes e Position estarem corretos.

## Workflow de desenvolvimento

Para cada nova fase:

1. consultar `docs/roadmap/reserva-clara-roadmap.md`;
2. inspecionar a `main`;
3. ler `AGENTS.md`;
4. ler spec/tasks/ADRs das fases anteriores;
5. dar atenção especial ao handoff da fase imediatamente anterior;
6. planejar somente documentação primeiro;
7. revisar o planejamento;
8. executar task por task;
9. rodar gates;
10. fazer smoke;
11. fechar documentação/handoff.

Modelo mental:

```text
ROADMAP
= o que queremos construir e em qual ordem

SPEC
= como construiremos determinada fase

REPOSITÓRIO
= o que realmente existe agora
```

O repositório prevalece quando houver divergência com uma previsão antiga do roadmap.

## Gates técnicos atuais

Quando aplicável:

```bash
npm run test:domain
npm run test:rules
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
git diff --check
```

Seguir sempre as instruções atuais de `AGENTS.md`.

## Próxima ação recomendada

Planejar a fase 008 com algo como:

```text
Planeje a fase 008 — Quotes & BRAPI conforme
docs/roadmap/reserva-clara-roadmap.md e o estado atual da main.

Leia AGENTS.md, as decisões e specs anteriores, especialmente o handoff da 007.
Use o roadmap como direção e o estado real do repositório como fonte da verdade.

Nesta execução faça apenas planejamento/documentação.
Não implemente, não faça deploy e não altere produção.
```
