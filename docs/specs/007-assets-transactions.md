# 007 — Assets & Transactions

## Status

`planned`

## Ticker

`007`

## Contexto

As fases 001–006 estão concluídas. O produto possui autenticação Google
client-only, Firestore Web owner-scoped e experiência real de Portfolio. O
baseline operacional é a `main`, com working tree limpo no commit
`38a5082` (`docs(sdd): concluir gates de Portfolio`); documentação histórica de
fases anteriores pode conter hashes antigos e não substitui o checkout atual.

O contrato existente mantém `Asset` e `Transaction` como tipos futuros, mas não
há parser, converter, repository, UI ou Rules abertas para essas entidades. A
Portfolio ainda pode sofrer hard delete em
`src/data/firestore/portfolio-repository.ts` e em `firestore.rules`. Esse é um
gate bloqueante: nenhum path de Transaction pode ser aberto enquanto o
lifecycle não for migrado para archive.

O checkout usa Next.js `16.3.5`, React `19.2.8`, TypeScript strict, Tailwind 4,
shadcn `base-nova`, Base UI, Firebase Web `12.19.0` e npm. Não há runner de UI,
formatter ou CI configurado. A implementação futura deve ler a documentação
local de Next.js em `node_modules/next/dist/docs/` após `npm ci`, antes de
alterar rotas, layouts ou parâmetros dinâmicos.

## Objetivo

Entregar catálogo privado de ativos e ledger mínimo de operações de compra e
venda, sem inventar patrimônio derivado. O usuário autenticado deve conseguir:

- criar e reutilizar uma identidade de Asset owner-scoped;
- associar uma operação a um Asset existente;
- registrar `buy` ou `sell` com quantidade, preço unitário e data civil;
- consultar operações em ordem cronológica determinística;
- preservar ledger e Portfolio após archive;
- receber erro explícito para schema inválido, referência inexistente, venda que
  produziria quantidade negativa ou conflito concorrente.

Position, saldo, preço médio, patrimônio, rentabilidade, cotação, FX,
alocação e fluxo de caixa continuam fora desta fase.

## Escopo

### Incluído

- migração de Portfolio de hard delete para archive reversível;
- compatibilidade de leitura com Portfolio legado sem `archivedAt`;
- `restorePortfolio`, listagem separada de ativos e arquivados e bloqueio de
  novas Transactions em Portfolio arquivada;
- Asset privado em `users/{uid}/assets/{assetId}`;
- identidade canônica composta por `symbol`, `market`, `assetType` e `currency`;
- registry owner-scoped para impedir duplicação concorrente da identidade sem
  abandonar auto IDs Firestore para o documento Asset;
- tipos de Asset V1 fechados e sem provider de cotação;
- Transaction privada em
  `users/{uid}/portfolios/{portfolioId}/transactions/{transactionId}`;
- somente `buy` e `sell` persistidos em V1;
- parser/converter/runtime validation e Rules fechadas para Asset, registry e
  Transaction;
- repository orientado ao domínio, sem SDK Firestore nos componentes React;
- write de Transaction em `runTransaction`, com leitura do ledger existente,
  validação cronológica e retry otimista do SDK;
- ordem total por `effectiveDate`, `createdAt` e `documentId`;
- reducer decimal sem `number` para quantidade, sem documento Position;
- UI de catálogo, criação de operação, ledger, estados de erro/loading e
  acessibilidade reaproveitando padrões de Portfolio;
- testes do Emulator para ownership, archive, registry, referências,
  schema fechado, append-only e concorrência reproduzível;
- índices somente quando query real exigir, registrados com evidência;
- gates técnicos e handoff documentado para Quotes/Positions.

### Fora de escopo

- `contribution`, `withdrawal`, `income`, `dividend`, `fee`, `tax`, `transfer`,
  `reversal` e `adjustment` persistidos ou expostos na UI;
- custos, impostos, corretagem, emolumentos ou desconto ocultos em preço,
  quantidade ou valor calculado;
- Position, saldo de caixa, custo médio, patrimônio, rentabilidade, snapshots,
  alocação e qualquer agregado autoritativo;
- edição ou exclusão física de Transaction; correção futura será evento
  compensatório em fase própria;
- catálogo global, integração BRAPI, QuoteService, provider mapping ou preço
  de mercado;
- conversão cambial, FX, multi-currency calculation ou arredondamento de
  total monetário;
- Firebase Admin, Cloud Functions, jobs, filas, backend server-side, sessão
  server-side ou operação administrativa de purge;
- cascade client-side, batch de exclusão, enumeração de subcoleções ou purge
  de Portfolio arquivada;
- framework de repository, state manager, React Query/SWR, realtime listener,
  UI/E2E framework ou dependência decimal sem caso aprovado;
- dados produtivos, seed, deploy Console ou alteração de região nesta
  execução de planejamento.

## Requisitos e critérios de aceite

### Lifecycle e compatibilidade

1. A primeira execução remove `allow delete` de Portfolio nas Rules e remove a
   operação pública `deletePortfolio`; hard delete físico passa a ser negado.
2. Portfolio ganha `archivedAt: Date | null` no contrato de domínio e
   `Timestamp | null` no documento Firestore. Parser interpreta documento legado
   sem esse campo como `null`; nenhuma migração destrutiva ou backfill produtivo
   é necessário.
3. Archive e restore alteram somente `archivedAt` e `updatedAt`, usando timestamp
   server-side. Rename preserva archive state.
4. `listPortfolios` retorna apenas carteiras ativas; `listArchivedPortfolios`
   retorna arquivadas. A UI não esconde archive como delete permanente.
5. Portfolio arquivada continua legível pelo owner para restauração e consulta
   histórica, mas não aceita nova Transaction write. Assets são catálogo
   user-scoped e não dependem de Portfolio ativa.
6. Não há cascade. Dados filhos permanecem intactos durante archive e não existe
   promessa de purge ou undo após remoção física, que fica fora do CRUD V1.

### Asset

7. Asset vive fora de Portfolio, é compartilhável entre carteiras do mesmo
   usuário e nunca representa posição.
8. Asset V1 contém exatamente `symbol`, `market`, `assetType`, `currency`,
   `identityKey`, `createdAt` e `updatedAt`, além do document ID. Não contém
   provider, preço, quantidade, saldo ou `uid` duplicado.
9. `symbol` e `market` são trimados e normalizados para uppercase, limitados a
   caracteres `[A-Z0-9._-]`; `assetType` pertence ao enum fechado V1:
   `stock`, `etf`, `fii`, `fund`, `bond`, `crypto`, `other`.
10. `identityKey` é derivada exclusivamente da tupla normalizada
    `(symbol, market, assetType, currency)`. Não é digitada pelo usuário e não
    contém `/`. Rules repetem essa concatenação após validar uppercase, enum e
    gramática, portanto SDK direto não pode escolher chave diferente.
11. Documento Asset usa auto ID Firestore. Documento técnico
    `users/{uid}/assetIdentities/{identityKey}` mapeia uma identidade para
    `assetId`; Asset e registry são criados atomicamente. Esse registry é a
    única exceção técnica ao catálogo e existe para garantir unicidade
    concorrente sem usar ticker como ID.
12. Asset não pode ser alterado ou deletado no V1. Operação inválida deve falhar
    antes do SDK; identidade corrigida exige novo Asset e política futura para
    referências antigas.

### Transaction e ledger

13. Transaction V1 é união discriminada somente por `kind: "buy" | "sell"` e
    contém exatamente `assetId`, `quantity`, `unitPrice`, `effectiveDate`,
    `createdAt` e `kind`.
14. `assetId` referencia Asset do mesmo `uid`; Rules e repository rejeitam
    referência inexistente ou pertencente a outro owner. Asset não é copiado
    para o documento Transaction.
15. `quantity` e `unitPrice.decimal` são strings decimais canônicas positivas,
    sem expoente, floating point, zeros ambíguos ou `number` persistido. A
    gramática persistida é `(?:0|[1-9][0-9]{0,29})(?:\.[0-9]{0,17}[1-9])?`;
    quantidade/preço positivos não aceitam `0`. Input pode ser normalizado
    (`1.2300` vira `1.23`, `0.000` vira `0`); somente formato persistido sem
    zeros à esquerda/finais passa nas Rules. Excedente falha explicitamente.
16. `unitPrice.currency` é ISO 4217 uppercase. Nenhuma conversão para BRL ou
    multiplicação de preço por quantidade é persistida; moeda diferente de BRL
    pode ser armazenada, mas não é convertida nesta fase.
17. `effectiveDate` é data civil real `YYYY-MM-DD`; `createdAt` é Timestamp
    server-side. Data de negócio não usa timezone local.
18. Transaction é append-only: não há update/delete público, UI ou Rule. Retry
    de uma mesma intenção reutiliza `transactionId` auto-gerado antes do write;
    documento existente compara somente `kind`, `assetId`, `quantity`,
    `unitPrice` e `effectiveDate` (não `createdAt`). Payload diferente é
    conflito, não overwrite.
19. Write usa Firestore transaction otimista: lê Portfolio, Asset, registry
    quando necessário e ledger relevante; valida estado cronológico; grava
    somente depois das leituras. Rules também validam o estado `getAfter()` da
    Portfolio, impedindo batch que arquive e crie Transaction no mesmo commit.
    Concorrência detectada pelo SDK reinicia a operação. Sem Position auxiliar
    ou contador de saldo.
20. Reducer ordena por `effectiveDate ASC`, `createdAt ASC`, `documentId ASC`.
    Para `sell`, quantidade acumulada do Asset antes do evento deve ser maior ou
    igual à venda; resultado negativo é rejeitado pelo repository. Eventos
    históricos devem ser inseridos em ordem de negócio válida, mesmo quando
    chegam depois. Rules não conseguem agregar todo o ledger e não prometem
    impedir um cliente autenticado de escrever um sell schema-válido via SDK
    direto; esse limite fica explícito como risco residual.
21. Soma/subtração do reducer usa representação inteira/string ou `bigint` em
    memória, nunca `number` decimal. Normalização, escala e limites são testados
    com casos de fração, zeros, carry/borrow e tentativa negativa.
22. Correção de erro de lançamento não é mutação silenciosa. V1 orienta usuário
    a não apagar evento e registra handoff para evento compensatório futuro.

### Segurança e persistência

23. `auth.currentUser.uid` é obtido internamente; UID, owner e path não são
    argumentos de formulário.
24. Rules usam default deny, campos fechados, ownership explícito e tipos
    compatíveis com parser. `getAfter()` é usado para garantir vínculo atômico
    Asset↔registry e para verificar Portfolio ativa após o commit;
    `exists()` valida Asset em create de Transaction. Registry permite somente
    create atômico: update/delete, rebind e mismatch de `identityKey` são
    negados.
25. Assets são user-scoped e podem ser cadastrados pelo usuário mesmo sem
    Portfolio ativa; somente Transaction exige Portfolio ativa. Archive não
    apaga catálogo compartilhado.
26. Query de Transaction retorna dados somente do owner; Rules não são tratadas
    como filtro. Client consulta subcoleção owner-scoped e trata indisponibilidade
    sem revelar existência cross-user.
27. Parser rejeita documento ausente, campo desconhecido, campo faltante, tipo
    incorreto, timestamp não Timestamp, decimal inválido, data impossível e
    referência malformada. Não há fallback silencioso.
28. Componentes React não importam `collection`, `doc`, `query`, `runTransaction`
    ou chamadas SDK; acessam repositories/domain.

### Experiência

29. Rota protegida `/assets` lista/cria catálogo privado com loading, empty,
    erro/retry, formulário acessível e identidade normalizada visível.
30. Rota protegida
    `/portfolios/[portfolioId]/transactions` lista ledger e oferece create
    somente para Portfolio ativa. Portfolio arquivada fica read-only e informa
    motivo sem perder histórico.
31. Formulário de Transaction exige Asset existente, kind, quantidade, preço,
    moeda e data; não oferece taxas, total calculado, posição ou rentabilidade.
32. Lista usa ordem determinística do domínio, apresenta evento real e estados
    sanitizados. Falha ambígua não repete write automaticamente; a ação de
    reconciliação relê ledger usando mesma intenção quando aplicável.
33. Rotas 007 entram no matcher/bridge de host e no grupo protegido sem alterar
    contrato público, landing ou AuthGate como boundary de segurança.
34. Teclado, foco, labels, live regions, disabled/pending, contraste, mobile e
    ausência de ações por hover seguem padrões comprovados de Portfolio.

## Modelo persistido

```text
users/{uid}
  assets/{assetId}
    symbol: string
    market: string
    assetType: "stock" | "etf" | "fii" | "fund" | "bond" | "crypto" | "other"
    currency: string
    identityKey: string
    createdAt: Timestamp
    updatedAt: Timestamp

  assetIdentities/{identityKey}
    assetId: string

  portfolios/{portfolioId}
    name: string
    baseCurrency: "BRL"
    archivedAt: Timestamp | null       # ausente em legado é lido como null
    createdAt: Timestamp
    updatedAt: Timestamp
    transactions/{transactionId}
      kind: "buy" | "sell"
      assetId: string
      quantity: string
      unitPrice: { currency: string, decimal: string }
      effectiveDate: "YYYY-MM-DD"
      createdAt: Timestamp
```

`identityKey` deve ser composta somente de segmentos já normalizados, por
exemplo `BOVA11~B3~etf~BRL`; `~` é reservado como separador e não é aceito em
campos de identidade. O registry não é exibido na UI nem usado como coleção de
listagem.

## Fonte da verdade e invariantes

- Firebase Auth é fonte de identidade e `uid`.
- Portfolio é configuração/lifecycle; archive não muda seu ID nem filhos.
- Asset é identidade privada reutilizável, não posição.
- Transaction é ledger imutável de buy/sell.
- Quantidade derivada existe somente durante reducer/read model; não é
  persistida como Position.
- Ordem de negócio usa `effectiveDate`; ordem de chegada usa `createdAt` com
  segundos e nanos preservados no domínio Transaction; ID resolve empate.
  Nenhuma posição depende de ordem do array ou do resultado da query sem sort
  explícito. O evento novo é tratado como posterior aos eventos já lidos
  durante a validação do write.
- Rules protegem cliente malicioso; parser protege dados corrompidos; reducer
  protege invariantes cronológicas no write e na leitura.

## Arquivos e módulos esperados

### Alterações prováveis

- `src/domain/portfolio.ts` e arquivos Portfolio: `archivedAt`, archive/restore.
- `src/domain/asset.ts`, `src/domain/transaction.ts`, `src/domain/value-objects.ts`:
  contratos e parsers de identidade/decimal.
- `src/data/firestore/paths.ts`: Assets, registry e Transactions.
- `src/data/firestore/parsers/*` e `converters/*`: schemas fechados.
- `src/data/firestore/asset-repository.ts`, `transaction-repository.ts` e
  errors específicos.
- `firestore.rules`: archive, Assets, registry e Transactions.
- `tests/firestore.rules.test.mjs` e testes puros mínimos do reducer/domain,
  somente se runner existente continuar suficiente.
- `src/proxy.ts`, páginas protegidas e componentes 007.
- `firestore.indexes.json` somente se query composta real for adotada.

### Reutilização obrigatória

- `src/lib/firebase/client.ts` e singleton Firebase existente;
- `auth.currentUser`, parser/converter e sanitização de erros da fase 005;
- `Button`, `Card`, `Input`, `Label`, tokens e padrões de `components/portfolio`;
- `AuthGate` somente como UX; Rules como autorização;
- npm, `node:test` e Firebase Emulator já configurados.

Não criar GenericRepository, contexto financeiro global, service locator ou
camada abstrata para entidades futuras.

## Ordem de execução

1. [007-01-implementar-archive-e-gate-de-lifecycle.md](../tasks/007-assets-transactions/007-01-implementar-archive-e-gate-de-lifecycle.md)
   — remover hard delete e tornar archive/restore compatível.
2. [007-02-fechar-contratos-e-reducer-decimal.md](../tasks/007-assets-transactions/007-02-fechar-contratos-e-reducer-decimal.md)
   — fechar schemas, identidade, decimais, ordem e reducer.
3. [007-03-implementar-persistencia-de-assets.md](../tasks/007-assets-transactions/007-03-implementar-persistencia-de-assets.md)
   — paths, parser, converter, registry e repository Asset.
4. [007-04-implementar-persistencia-de-transactions.md](../tasks/007-assets-transactions/007-04-implementar-persistencia-de-transactions.md)
   — repository append-only, idempotência por ID e validação concorrente.
5. [007-05-abrir-rules-e-testes-do-emulator.md](../tasks/007-assets-transactions/007-05-abrir-rules-e-testes-do-emulator.md)
   — abrir somente schemas aprovados e provar ownership/integridade.
6. [007-06-implementar-catalogo-de-assets.md](../tasks/007-assets-transactions/007-06-implementar-catalogo-de-assets.md)
   — rota `/assets`, criação, listagem e estados acessíveis.
7. [007-07-implementar-ledger-e-ux-de-transactions.md](../tasks/007-assets-transactions/007-07-implementar-ledger-e-ux-de-transactions.md)
   — rota de ledger, formulário buy/sell e Portfolio arquivada read-only.
8. [007-08-executar-gates-e-handoff.md](../tasks/007-assets-transactions/007-08-executar-gates-e-handoff.md)
   — gates, evidências, revisão, rollout e handoff 008/009.

## Estratégia de testes e validação

### Domínio e persistência

- Parser: campos exatos, normalização, enum, identidade, decimal, data real,
  Timestamp com nanos e IDs.
- Reducer: buy/sell em ordem, mesmo dia, backfill, empate por ID, frações,
  overflow de escala, venda maior que saldo e concorrência.
- Repository: UID interno, archive gate, Asset registry atômico, referência
  owner-scoped, ID repetido com payload igual/diferente, erro ambíguo sem
  overwrite.

### Emulator Rules

Provar com projeto demo e fixtures sintéticas:

- archive/restore owner; delete físico negado inclusive Portfolio legada;
- leitura/listagem owner e isolamento A/B/anônimo;
- Asset válido, campo extra, enum/moeda/identity inválidos, registry órfão e
  tentativa cross-user;
- Asset e registry permitidos somente no vínculo atômico;
- Transaction buy/sell válida, schema inválido, update/delete negados,
  referência inexistente/cross-user, Portfolio arquivada negada e leitura
  histórica permitida;
- paths desconhecidos, root profile e futuras subcoleções negados;
- query owner-scoped e tentativa de query cross-user negadas.

Não usar `withSecurityRulesDisabled`, produção, dados pessoais ou bypass de
Rules. Rules não provam o reducer; testes de domínio não substituem Emulator.

### Gates técnicos

Executar na ordem exigida pelo repositório:

```bash
JAVA_HOME=$(/usr/libexec/java_home -v 21) npm run test:rules
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
git diff --check
```

Se testes puros forem adicionados, usar `node:test` existente; não instalar
framework genérico. Manual autenticado deve cobrir archive/restore, catálogo,
buy/sell, refresh, backfill, erro de venda, cross-user, teclado e viewport.

## Rollout e checkpoints

1. Revisar diff de archive/parser/converter/repository/Rules e confirmar que
   nenhum delete físico permanece.
2. Rodar Emulator verde com Paths 007 ainda fechados para Transaction durante o
   primeiro checkpoint.
3. Publicar archive e Rules de Asset/registry/Transaction em mudança atômica;
   não expor UI antes de Rules publicadas e smoke local verde.
4. Criar fixtures sintéticas somente em ambiente autorizado, sem patrimônio
   pessoal; validar owner, cross-user e archive.
5. Se query composta for necessária, registrar erro/documentação do Firestore,
   adicionar índice mínimo e repetir Emulator/build.
6. Rollback de código usa deployment anterior; Rules usam arquivo anterior.
   Rollback não remove nem restaura dados e não equivale a purge.

## Riscos e mitigação

| Risco | Mitigação |
| --- | --- |
| Hard delete permanecer aberto | Primeira subtarefa remove função pública, Rule e teste positivo antigo; gate de Transaction bloqueia até evidência. |
| Portfolio legada sem `archivedAt` quebrar | Parser aceita ausência como `null`; Rules aceitam forma legada e novas escritas explicitam campo. |
 | Registry e Asset divergirem | `runTransaction`, `getAfter`, schema fechado, registry somente create, comparação de `assetId`/`identityKey` e teste de órfão/rebind. |
| `getAfter` mal modelado nas Rules | Fixtures de create atômico, Asset sem registry, registry sem Asset e cross-user no Emulator. |
 | Venda concorrente gerar quantidade negativa | Transaction Firestore lê ledger e reexecuta em conflito; reducer valida repository; Rules não fazem agregação e o risco de SDK direto fica registrado para backend/aggregate futuro. |
| Ledger crescer além de transaction read | Registrar limite operacional e handoff 009/012 para aggregate/snapshot; não introduzir Position escondida. |
| Retry duplicar evento | ID auto-gerado por intenção, payload imutável, conflito explícito e reconciliação sem retry cego. |
 | Decimal virar floating point | Strings persistidas em gramática canônica, parser normaliza input antes do write, Rules rejeitam bruto não canônico, `bigint`/escala em memória, limites e casos de carry/borrow. |
| Asset duplicar provider/ticker | Provider fora do schema; identidade exige quatro dimensões e registry determinístico. |
| Rules serem tratadas como filtro | Query owner-scoped, testes cross-user e parser/repository sem confiar em filtro de cliente. |
| UI sugerir patrimônio fictício | Sem total, posição, cotação ou performance; revisão visual contra escopo. |
| SDK Firestore vazar para Server Component | Implementação client-only confinada a repository; documentação Next 16 e build/typecheck. |

## Handoffs

- **008 — Quotes/BRAPI:** pode mapear provider fora de Asset e sem alterar
  identidade; não converter preço para float.
- **009 — Positions/Allocation:** deve derivar posição exclusivamente de
  Transaction + Asset + Quotes; nenhum Position mutável deve virar fonte de
  verdade.
- **012 — History/Snapshots:** pode materializar leitura derivada com versão e
  consistência explícitas; não substituir ledger.

## Premissas e decisões pendentes

- `007` foi fornecido pelo contexto da solicitação e permanece ticker fixo.
- Asset user-scoped e Transaction portfolio-scoped preservam contratos 005.
- BRL continua base de Portfolio, mas V1 não calcula FX; `unitPrice.currency`
  é armazenada e exibida.
- Não há decisão pendente bloqueante para criar o plano. A escolha de registry
  é deliberada porque unicidade Asset é invariável útil e auto IDs continuam
  necessários no documento principal.
- Escala máxima decimal é 30/18 nesta spec. Input pode conter zeros finais e é
  normalizado antes de persistir; Firestore recebe somente gramática canônica
  sem zeros finais. Isso deve ser provado com os mesmos fixtures no parser,
  Rules e reducer.
- A decisão de `Transaction.createdAt` supersede o placeholder Date de 005 para
  preservar nanos no reducer; Portfolio continua usando Date no domínio.
- A proteção de quantidade não negativa é garantia do repository confiável, não
  uma propriedade que Security Rules conseguem impor contra SDK direto. Uma
  garantia forte exige aggregate/server boundary em fase futura.
- Produção, Rules publicadas, dados, Console, Vercel e deploy só entram após
  revisão independente e checkpoint humano.

## Referências

- `AGENTS.md` e regras locais do repositório.
- `docs/specs/005-domain-model-firestore-foundation.md`.
- `docs/specs/006-portfolio-management.md`.
- `docs/tasks/006-portfolio-management/006-00-overview.md`.
- `src/domain/asset.ts`, `src/domain/transaction.ts`,
  `src/domain/value-objects.ts`.
- `src/data/firestore/portfolio-repository.ts`, `paths.ts`, parsers e
  converters existentes.
- `firestore.rules`, `tests/firestore.rules.test.mjs`, `package.json`.
- https://firebase.google.com/docs/firestore/manage-data/transactions
- https://firebase.google.com/docs/firestore/security/rules-conditions
- https://firebase.google.com/docs/firestore/security/rules-query
- https://firebase.google.com/docs/firestore/manage-data/structure-data
- https://firebase.google.com/docs/firestore/query-data/indexing
- https://firebase.google.com/docs/emulator-suite/connect_firestore
- https://nextjs.org/docs/app/getting-started
