# 007 — Assets & Transactions

## Status

`amended/in_progress` — o núcleo original foi concluído e teve smoke manual
confirmado pelo checkpoint humano do handoff. A emenda de lifecycle de Asset
(007-10 a 007-14) está planejada e reabre somente o escopo necessário para
edição e exclusão segura.

## Ticker

`007`

## Contexto

As fases 001–006 estão concluídas. O produto possui autenticação Google
client-only, Firestore Web owner-scoped e experiência real de Portfolio. O
baseline operacional é a `main`, com working tree limpo no commit
`38a5082` (`docs(sdd): concluir gates de Portfolio`); documentação histórica de
fases anteriores pode conter hashes antigos e não substitui o checkout atual.

O núcleo original da fase já entregou parser, converter, repository, UI e Rules
para Asset/Transaction. O histórico desta spec registra que a Portfolio teve
de migrar de hard delete para archive antes da abertura do ledger. O baseline
atual é o contrato V2 owner-scoped descrito abaixo; a única lacuna reaberta é o
lifecycle de Asset definido na emenda 007-10 a 007-14.

O checkout usa Next.js `16.3.5`, React `19.2.8`, TypeScript strict, Tailwind 4,
shadcn `base-nova`, Base UI, Firebase Web `12.19.0` e npm. Não há runner de UI,
formatter ou CI configurado. A implementação futura deve ler a documentação
local de Next.js em `node_modules/next/dist/docs/` após `npm ci`, antes de
alterar rotas, layouts ou parâmetros dinâmicos.

O núcleo 007 permanece histórico e compatível: Asset continua owner-scoped,
reutilizável entre Portfolios e referenciado por `assetId` nas Transactions.
Uma decisão posterior do produto exige agora edição preservando o mesmo ID e
exclusão somente quando não houver Transaction vinculada. Essa emenda não será
implementada na fase 008 de Quotes; 008-06 continua bloqueada apenas pelo
smoke manual ainda pendente e não confirmado nesta sessão.

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
- taxa monetária fixa opcional persistida em Transaction V2, com leitura
  compatível de Transaction V1 legada;
- parser/converter/runtime validation e Rules fechadas para Asset, registry e
  Transaction;
- repository orientado ao domínio, sem SDK Firestore nos componentes React;
- write de Transaction em `runTransaction`, com leitura do ledger existente,
  validação cronológica e retry otimista do SDK;
- ordem total por `effectiveDate`, `createdAt` e `documentId`;
- reducer decimal sem `number` para quantidade, sem documento Position;
- UI de catálogo, criação de operação, ledger, estados de erro/loading e
  acessibilidade reaproveitando padrões de Portfolio;
- edição de Asset preservando o mesmo `assetId`, com troca atômica de Asset e
  registry;
- exclusão de Asset somente sem Transaction vinculada, removendo Asset e
  registry no mesmo commit e sem cascade;
- guard técnico owner-scoped para registrar que um Asset já foi referenciado por
  Transaction, além de auditoria das Transactions legadas antes de abrir o
  delete;
- testes do Emulator para ownership, archive, registry, referências,
  schema fechado, append-only, lifecycle de Asset e concorrência reproduzível;
- índices somente quando query real exigir, registrados com evidência;
- gates técnicos e handoff documentado para Quotes/Positions.

### Fora de escopo

- `contribution`, `withdrawal`, `income`, `dividend`, `tax`, `transfer`,
  `reversal` e `adjustment` persistidos ou expostos na UI;
- custos, impostos, corretagem, emolumentos ou desconto ocultos em preço,
  quantidade ou valor calculado;
- Position, saldo de caixa, custo médio, patrimônio, rentabilidade, snapshots,
  alocação e qualquer agregado autoritativo;
- edição ou exclusão física de Transaction; correção futura será evento
  compensatório em fase própria;
- arquivamento de Asset; permanece decisão futura e não substitui a exclusão
  condicionada desta emenda;
- catálogo global, integração BRAPI, QuoteService, provider mapping ou preço
  de mercado;
- conversão cambial, FX, multi-currency calculation ou arredondamento de
  total monetário;
- Firebase Admin, Cloud Functions, jobs, filas, backend server-side, sessão
  server-side ou operação administrativa de purge;
- cascade client-side, batch de exclusão para filhos, enumeração de
  subcoleções como mecanismo de cascade ou purge de Portfolio arquivada;
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
12. Asset pode ser editado mantendo o mesmo `assetId`: a operação recalcula a
    identidade canônica e, quando ela mudar, remove o registry antigo, grava o
    novo registry e atualiza o documento Asset no mesmo commit. `id` e
    `createdAt` permanecem invariantes; `updatedAt` é server-side. Colisão com
    outro registry, Asset/registry inconsistente ou mutação parcial falha sem
    alterar nenhum dos três documentos.

    12a. Asset pode ser excluído somente quando não houver Transaction que o
    referencie em nenhuma Portfolio do owner, ativa ou arquivada. O commit
    remove apenas o Asset e seu registry correspondente; nunca remove
    Portfolio, Transaction ou qualquer outro filho.

    12b. O repository não pode decidir o delete apenas por uma leitura de
    catálogo ou por uma checagem fora do commit. Um guard técnico
    `assetUsages/{assetId}` create-only será criado atomicamente na primeira
    Transaction, mantido para as demais e lido no commit de exclusão. A
    operação `reconcileAssetUsage(assetId)` enumera todas as Portfolios do
    owner, consulta cada subcoleção e retorna `complete`, `transactionCount` e
    `portfolioCount`; falha ou cobertura inconclusiva mantém o delete fechado.
    Antes de habilitar a UI de delete, as Rules passam a exigir o guard em toda
    nova Transaction e a auditoria de dados legados é executada com sucesso,
    criando os guards faltantes. `deleteAsset` repete a reconciliação do alvo
    e só então entra no commit.

    12c. Corridas entre primeira Transaction e exclusão são serializadas pela
    leitura do guard no Firestore transaction e pelo vínculo obrigatório
    Transaction↔guard nas Rules. Um SDK direto sem o guard deve falhar. O guard
    não é posição, contador patrimonial, índice exibido ou cascade.

    12d. Erro de exclusão por vínculo deve ser explícito e estável, por exemplo
    `ASSET_HAS_TRANSACTIONS`: “Não é possível excluir este ativo porque existem
    operações vinculadas.” Não há undo, purge ou arquivamento implícito.

### Transaction e ledger

13. Transaction V2 é união discriminada somente por `kind: "buy" | "sell"` e
    contém exatamente `assetId`, `quantity`, `unitPrice`, `effectiveDate`,
    `createdAt`, `kind` e `fee`. Documentos V1 legados sem `fee` continuam
    legíveis e são interpretados como `fee: null`; novas escritas sempre
    persistem o campo.
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
17. `fee` é opcional na entrada e representa um valor monetário fixo absoluto,
    nunca percentual: `null` significa ausência e um valor usa
    `{ currency, decimal }`, com `decimal` não negativo e moeda ISO 4217
    uppercase. Taxa zero é normalizada para `null`; não há conversão, soma,
    total ou arredondamento implícito, e a taxa não altera quantidade nem
    validação de `sell`.
18. `effectiveDate` é data civil real `YYYY-MM-DD`; `createdAt` é Timestamp
    server-side. Data de negócio não usa timezone local.
19. Transaction é append-only: não há update/delete público, UI ou Rule. Retry
    de uma mesma intenção reutiliza `transactionId` auto-gerado antes do write;
    documento existente compara somente `kind`, `assetId`, `quantity`,
    `unitPrice`, `effectiveDate` e `fee` (não `createdAt`). Payload diferente é
    conflito, não overwrite.
20. Write usa Firestore transaction otimista: lê Portfolio, Asset, registry
    quando necessário e ledger relevante; valida estado cronológico; grava
    somente depois das leituras. Rules também validam o estado `getAfter()` da
    Portfolio, impedindo batch que arquive e crie Transaction no mesmo commit.
    Concorrência detectada pelo SDK reinicia a operação. Sem Position auxiliar
    ou contador de saldo.
21. Reducer ordena por `effectiveDate ASC`, `createdAt ASC`, `documentId ASC`.
    Para `sell`, quantidade acumulada do Asset antes do evento deve ser maior ou
    igual à venda; resultado negativo é rejeitado pelo repository. Eventos
    históricos devem ser inseridos em ordem de negócio válida, mesmo quando
    chegam depois. Rules não conseguem agregar todo o ledger e não prometem
    impedir um cliente autenticado de escrever um sell schema-válido via SDK
    direto; esse limite fica explícito como risco residual.
22. Soma/subtração do reducer usa representação inteira/string ou `bigint` em
    memória, nunca `number` decimal. Normalização, escala e limites são testados
    com casos de fração, zeros, carry/borrow e tentativa negativa.
23. Correção de erro de lançamento não é mutação silenciosa. V1 orienta usuário
    a não apagar evento e registra handoff para evento compensatório futuro.

### Segurança e persistência

23. `auth.currentUser.uid` é obtido internamente; UID, owner e path não são
    argumentos de formulário.
24. Rules usam default deny, campos fechados, ownership explícito e tipos
     compatíveis com parser. `getAfter()` garante vínculo atômico
     Asset↔registry, a troca de registry durante edição, a remoção conjunta no
     delete e o vínculo Transaction↔assetUsage; também verifica Portfolio ativa
     após o commit. `exists()` valida Asset em create de Transaction. Registry
     permite somente create/delete dentro dessas transições atômicas; update,
     rebind, delete isolado e mismatch de `identityKey` são negados. O guard de
     uso é owner-scoped, create-only e não pode ser removido para viabilizar
     delete.
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
31. Formulário de operação exige Ativo existente, compra/venda, quantidade,
    preço, moeda e data; oferece taxa fixa opcional com moeda e valor, sem
    total calculado, posição ou rentabilidade.
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

  assetUsages/{assetId}                 # guard técnico, não exibido
    assetId: string
    createdAt: Timestamp

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
      fee: null | { currency: string, decimal: string }
      effectiveDate: "YYYY-MM-DD"
      createdAt: Timestamp
```

`identityKey` deve ser composta somente de segmentos já normalizados, por
exemplo `BOVA11~B3~etf~BRL`; `~` é reservado como separador e não é aceito em
campos de identidade. O registry não é exibido na UI nem usado como coleção de
listagem. `assetUsages` também não é fonte de posição nem substitui o ledger;
sua única função é tornar monotônica e verificável a informação de que já houve
uma Transaction para o Asset.

## Estratégia de consulta e guarda de Transactions

Transactions continuam em
`users/{uid}/portfolios/{portfolioId}/transactions`, portanto não existe uma
consulta reversa direta por `assetId` no repository atual. A estratégia da
emenda é deliberadamente em duas camadas:

1. **Reconciliação legada/auditoria:** `reconcileAssetUsage(assetId)` lista
   Portfolios owner-scoped, incluindo arquivadas, e consulta cada subcoleção
   `transactions` com `where("assetId", "==", assetId).limit(1)`. A consulta é
   feita por caminho conhecido, não por `collectionGroup`, para manter o owner
   boundary das Rules e evitar tratar Rules como filtro. A operação retorna
   `complete`, `transactionCount` e `portfolioCount`, cria ou confirma o guard
   quando encontra uso e registra somente contagens/códigos sanitizados, nunca
   payload financeiro. Qualquer falha retorna `complete: false` e mantém delete
   fechado.
2. **Decisão concorrente de runtime:** toda nova criação de Transaction grava ou
   confirma `assetUsages/{assetId}` no mesmo write atômico. O delete lê esse
   documento dentro do `runTransaction`; `deleteAsset` só inicia esse commit
   após uma reconciliação completa do alvo, guard existente falha com
   `ASSET_HAS_TRANSACTIONS`, e guard ausente permite continuar. A publicação
   das Rules que exigem guard em novas Transactions vem antes da auditoria de
   rollout e da UI de delete. Não se tenta enumerar subcoleções dentro do
   callback como mecanismo de atomicidade.

O guard é necessário porque o SDK Web atual não oferece uma query reversa
owner-scoped que possa ser usada como read set completo do `runTransaction`.
Sem ele, uma checagem prévia teria uma janela de corrida entre a última leitura
e o delete. Se a reconciliação não puder provar cobertura dos dados legados, o
delete permanece fechado; não há fallback permissivo.

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
- `src/data/firestore/parsers/asset-usage-parser.ts` e converter/paths do guard,
  se o contrato técnico exigir módulos separados.
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
8. [007-09-persistir-taxas-em-transactions.md](../tasks/007-assets-transactions/007-09-persistir-taxas-em-transactions.md)
   — compatibilizar Transaction V2, taxa fixa opcional e UI da operação.
9. [007-08-executar-gates-e-handoff.md](../tasks/007-assets-transactions/007-08-executar-gates-e-handoff.md)
   — gates, evidências, revisão, rollout e handoff 008/009.

O núcleo acima é o histórico da entrega original. A emenda é sequencial e
preserva esses arquivos concluídos:

10. `007-10-normalizar-crud-e-guarda-de-referencias.md` — atualizar contrato,
    erros, estratégia de consulta, guard e critérios de rollout.
11. `007-11-implementar-edicao-e-exclusao-atomicas.md` — repository, converter,
    paths e vínculo de uso em novas Transactions.
12. `007-12-abrir-rules-e-provar-lifecycle-de-asset.md` — Rules, reconciliação
    legada e Emulator para colisão, corrida, vínculo e exclusão.
13. `007-13-implementar-crud-na-ui-de-assets.md` — edição, exclusão condicionada,
    mensagens claras e preservação dos estados de Quotes.
14. `007-14-executar-gates-rollout-e-handoff.md` — gates finais, rollout,
    rollback e handoff sem iniciar outra fase.

## Estratégia de testes e validação

### Domínio e persistência

- Parser: campos exatos, normalização, enum, identidade, decimal, taxa fixa,
  data real, Timestamp com nanos, IDs e compatibilidade de documento legado sem
  `fee`.
- Reducer: buy/sell em ordem, mesmo dia, backfill, empate por ID, frações,
  overflow de escala, venda maior que saldo e concorrência.
- Repository: UID interno, archive gate, Asset registry atômico, referência
  owner-scoped, taxa normalizada, ID repetido com payload igual/diferente, erro
  ambíguo sem overwrite; edição com mesmo ID, colisão de identidade, delete
  bloqueado por guard e delete atômico sem filhos.

### Emulator Rules

Provar com projeto demo e fixtures sintéticas:

- archive/restore owner; delete físico negado inclusive Portfolio legada;
- leitura/listagem owner e isolamento A/B/anônimo;
- Asset válido, campo extra, enum/moeda/identity inválidos, registry órfão e
  tentativa cross-user;
- Asset e registry permitidos somente no vínculo atômico; edição exige troca
  coerente dos registries e delete exige guard ausente;
- guard de uso create-only, Transaction sem guard negada, Asset com Transaction
  vinculada não pode ser deletado, Asset sem Transaction pode ser deletado e
  Asset/registry desaparecem juntos;
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

1. Revisar o contrato, o guard e a matriz de transições antes de abrir qualquer
   `update`/`delete` de Asset. O delete de Transaction continua negado.
2. Rodar auditoria owner-scoped de Transactions em todas as Portfolios e criar
   guards faltantes antes de publicar a permissão de delete; falha ou cobertura
   inconclusiva mantém delete fechado.
3. Publicar repository/Rules que exigem guard em novas Transactions; somente
   depois publicar a permissão de update e delete atômicos e então a UI.
4. Usar fixtures sintéticas para Asset sem uso, com uso em Portfolio ativa e
   arquivada, colisão, corrida, cross-user e tentativa de remover somente um
   lado do par.
5. Não adicionar índice sem evidência: as consultas planejadas usam igualdade
   simples por subcoleção; se a auditoria revelar limite operacional, parar e
   registrar bloqueio em vez de abrir delete permissivo.
6. Rollback de código remove as ações da UI e volta Rules para negar update/delete;
   não desfaz edições já confirmadas, não remove guards, não restaura Asset e não
   equivale a purge. Suspeita de inconsistência exige reabrir a auditoria antes
   de qualquer nova habilitação.

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
| Edição deixar registry antigo, novo ou Asset divergente | Um único `runTransaction`, `getAfter()` nas Rules, ID/createdAt imutáveis e testes de falha sem commit. |
| Delete correr com nova Transaction | Guard create-only no mesmo write da Transaction, guard lido no delete e Rules negando Transaction sem guard; auditoria legada antes do rollout. |
| Scan não encontrar uma Transaction legada | Enumerar Portfolios ativas e arquivadas por owner, bloquear delete quando a cobertura for inconclusiva e registrar contagem sanitizada. |
| Guard ser removido para liberar delete | Rules negam update/delete do guard; Asset delete exige guard ausente no estado pós-commit e o par Asset/registry coerente. |
| Identidade mudar enquanto Quotes carregam | `assetId` permanece estável; UI invalida resultados de Quote do Asset editado e refaz leitura, sem persistir provider ou preço. |
| Taxa ser confundida com percentual ou total | V2 persiste somente valor monetário fixo opcional `{currency, decimal}`; não calcula total, conversão, base ou arredondamento. |
| Rules serem tratadas como filtro | Query owner-scoped, testes cross-user e parser/repository sem confiar em filtro de cliente. |
| UI sugerir patrimônio fictício | Sem total, posição, cotação ou performance; revisão visual contra escopo. |
| SDK Firestore vazar para Server Component | Implementação client-only confinada a repository; documentação Next 16 e build/typecheck. |

## Handoffs

- **008 — Quotes/BRAPI:** pode mapear provider fora de Asset e sem alterar
  identidade; a emenda 007 é a dona do CRUD. A UI da emenda limpa a cotação
  local do Asset editado e aciona o loader já integrado em 008; `008-06` valida
  o refetch no smoke. A integração continua usando o mesmo `assetId` e não
  converte preço para float nem usa `number` como representação monetária.
- **009 — Positions/Allocation:** deve derivar posição exclusivamente de
  Transaction + Asset + Quotes; nenhum Position mutável deve virar fonte de
  verdade nem substituir o ledger.
- **012 — History/Snapshots:** pode materializar leitura derivada com versão e
  consistência explícitas; não substituir ledger.

## Premissas e decisões pendentes

- `007` foi fornecido pelo contexto da solicitação e permanece ticker fixo; a
  emenda acrescenta 007-10 a 007-14 sem reescrever o histórico 007-01 a 007-09.
- Asset user-scoped e Transaction portfolio-scoped preservam contratos 005.
- BRL continua base de Portfolio, mas V1 não calcula FX; `unitPrice.currency`
  e `fee.currency` são armazenadas e exibidas.
- Taxa significa valor monetário fixo absoluto, opcional na entrada e
  normalizado como `null` quando ausente ou zero; percentual, base de cálculo,
  total e conversão cambial continuam fora de escopo.
- O guard `assetUsages/{assetId}` é uma decisão técnica desta emenda: ele é
  monotônico, create-only e não contém posição, contador ou payload de
  Transaction. Sem a reconciliação legada, a permissão de delete permanece
  bloqueada.
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
