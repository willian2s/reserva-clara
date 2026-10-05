# 011-02 — Mapear domínio, dados e riscos atuais

- **Ticker:** `011`
- **Número:** `02`
- **Status:** `completed`

## Objetivo e resultado esperado

Documentar contratos de domínio, modelo Firestore, queries, ownership,
integrações, invariantes e dívidas atuais. O resultado deve separar princípios
de produto preserváveis de mecanismos específicos do Firestore/Next.

## Requisitos cobertos

- Mapear `domain`, `server`, `data`, Firebase Auth/Admin, Firestore e BRAPI.
- Identificar entidades, value objects, invariantes, precisão e ordenação.
- Mapear documentos, paths, referências, ownership, Rules e queries.
- Inventariar riscos de segurança, integridade, escala, observabilidade e dados.
- Definir o checkpoint C0 para a fragilidade de `SELL` direto.

## Escopo

### Incluído

- Portfolio, Asset, Transaction, Quote, Position, Allocation e dashboards.
- Repositories, parsers/converters, Rules, read-side, QuoteService/cache.
- Dados legados previstos (`archivedAt`/`fee` ausentes) e necessidade de
  volumetria/anomalias sanitizadas.
- Classificação preservar/corrigir/substituir/remover.

### Excluído

- ERD final e DDL, tratados em 011-04.
- Implementação de boundary temporário para `SELL`.
- Leitura ou cópia de segredo/valor financeiro para documentação.

## Dependências

- Código, specs e ADRs 005–010.
- Pode ocorrer em paralelo com 011-01.

## Arquivos e símbolos prováveis

- Leitura: `src/domain/**`, `src/data/**`, `src/server/**`, `firestore.rules`,
  `firebase.json`, `tests/**`, `scripts/**`, specs/ADRs 005–010.
- Símbolos: `parseDecimalString`, `reducePositions`, `compareTransactions`,
  repositories Firestore, `createQuotesPostHandler`, `QuoteService`.
- Saída provável: `docs/architecture/011/domain-data-inventory.md`.

## Passos de implementação

1. Catalogar entidades, VOs, enums, serviços e read models.
2. Registrar invariantes e sua camada atual de enforcement.
3. Desenhar paths/documentos Firestore e relações implícitas.
4. Listar operações/queries, scans e ordenações em memória.
5. Mapear auth/ownership e diferenças entre Rules, Admin e repository.
6. Documentar BRAPI, cache, timeout, retry, lotes e limites por processo.
7. Levantar volumetria/anomalias sem persistir dados sensíveis.
8. Definir opções e deadline para C0: risco aceito em ambiente confiável,
   suspensão de writes ou bridge transitório sem dual-write.
9. Revisar o mapa contra testes e decisões históricas.

## Testes e comandos de validação

- Conferência de cada path contra `src/data/firestore/paths.ts` e Rules.
- Matriz invariante → código → teste → lacuna.
- Verificação dos limites decimal/timestamp em código e fixtures.
- Busca por acesso Firestore/Admin/BRAPI fora dos boundaries catalogados.
- `git diff --check` nos artefatos documentais.

## Definição de pronto

- Modelo atual e ownership estão completos e revisados.
- Invariantes preserváveis e dívidas estão separados.
- Risco de `SELL`, precisão, legado, credencial local e cache estão explícitos.
- Há insumo suficiente para arquitetura, ERD e migração.
- Nenhum dado sensível ou código de produção foi alterado.

## Riscos e cuidados

- Rules não provam saldo agregado; não documentar garantia inexistente.
- `assetUsages` não é posição nem contador.
- Não assumir que timestamps PostgreSQL preservam nanossegundos.
- Não registrar UID, IDs reais, tokens ou payload financeiro no inventário.

## Escopo confirmado e método

Este inventário cobre somente o estado atual TypeScript/Next.js + Firestore e
separa contratos de produto/domínio de mecanismos de persistência. A análise foi
feita por leitura estática de `src/domain/**`, `src/data/**`, `src/server/**`,
`firestore.rules`, `firebase.json`, testes, scripts e specs/ADRs 005–010. Não
houve leitura de banco, export, segredo, UID real ou payload financeiro; portanto
nenhuma volumetria produtiva é afirmada abaixo.

As linhas citadas são referências do checkout analisado e devem ser atualizadas
se o código mudar antes do desenho relacional da 011-04.

## Resumo executivo

- `Transaction` é o fato patrimonial e o ledger é append-only. `Position`,
  `MarketPosition`, Allocation e dashboards são read models reconstruíveis e não
  existem como documentos autoritativos.
- `Portfolio` é owner-scoped, multi-carteira, com base `BRL`, archive/restore e
  ledger filho. `Asset` é catálogo owner-scoped compartilhável entre Portfolios;
  ticker, BRAPI e `assetId` não são intercambiáveis.
- O domínio protege decimais canônicos com até 30 dígitos inteiros e 18
  fracionários, `bigint`/racionais e ordenação por data civil, timestamp completo
  e ID. `Transaction.createdAt` mantém segundos e nanos no parser Web; o reader
  Admin de Asset materializa `Timestamp` em `Date`.
- Rules, parsers e repositories cobrem ownership, schema, referências,
  archive, unicidade e append-only, mas Rules não reduzem o ledger. Um cliente
  autenticado que ignore o repository ainda pode gravar um `SELL` acima do saldo.
- As leituras patrimoniais carregam coleções/ledgers completos e filtram ou
  ordenam em memória. Isso é aceitável como baseline pequena, não como promessa
  de escala para PostgreSQL.
- Quotes são transitórias, server-side e independentes do ledger. BRAPI tem
  cache, deduplicação, timeout, retry e stale-if-error por processo; não há quota
  ou coordenação distribuída.

## Catálogo de domínio e read-side

| Conceito | Forma atual | Invariantes/semântica preservável | Camada principal |
| --- | --- | --- | --- |
| `Portfolio` | `src/domain/portfolio.ts`; ID opaco, nome, `baseCurrency`, `archivedAt`, timestamps | Nome entre 1 e 100 caracteres após trim; base V1 fixa em `BRL`; archive/restore não muda ID nem filhos; carteira arquivada é legível, mas não aceita nova Transaction | Domain + parser/converter + Rules/repository |
| `Asset` | `src/domain/asset.ts`; `symbol`, `market`, `assetType`, `currency`, `identityKey`, timestamps | Símbolo/mercado normalizados em uppercase; enum fechado; identidade canônica `(symbol, market, assetType, currency)` é owner-scoped; `assetId` é estável e não representa posição | Domain + registry `assetIdentities` + Rules/repository |
| `Transaction` | `src/domain/transaction.ts`; `buy`/`sell`, `assetId`, quantity, unit price, fee, data civil, timestamp | Quantidade/preço positivos; fee nula ou não negativa; referência ao Asset do mesmo owner; append-only; correção futura por fato compensatório; venda não pode deixar quantidade negativa no reducer confiável | Domain + repository/transaction + converter + Rules parciais |
| `Quote` | `src/domain/quote.ts`; resultado `available`/`unavailable` | Transitória; provider atual `brapi`; `fresh`/`stale` explícitos; moeda deve coincidir; indisponível nunca vira zero; `symbolChanged` não altera Asset | Domain + `src/server/quotes/**` |
| `Position` | `src/domain/position-engine.ts`; quantity, custo investido, custo médio, closed | Derivada de Asset + ledger; não persistida; redução agrupa por `assetId`, rejeita referência ausente/moeda incompatível e `SELL` insuficiente | Domain/read-side |
| `MarketPosition` | `src/domain/market-position.ts` | Só para posição aberta com Quote disponível e moeda compatível; market value e diferença são derivados; stale é propagado | Domain/read-side |
| `Allocation` | `src/domain/allocation.ts` | Composição corrente em moeda-base; `empty`/`complete`/`partial`; valores indisponíveis ficam fora do denominador e são diagnosticados; não é target allocation | Domain/read-side |
| Dashboards | `src/domain/portfolio-summary.ts` + `src/data/positions/{portfolio-read,dashboard-read}.ts` | Totais conhecidos são explicitamente `empty`/`complete`/`partial`; Portfolio arquivada fica fora do global; cobertura conta unidades, não percentual monetário | Read-side client-only |

### Value objects, enums e precisão

Em `src/domain/value-objects.ts` estão `CurrencyCode`, `BaseCurrencyCode`,
`DocumentId`, `CivilDate`, `TimestampParts`, `DecimalString`,
`PositiveDecimalString`, `UnitPrice`, `Fee`, `MoneyMinor` e `BasisPoints`.
`AssetType` aceita `stock`, `etf`, `fii`, `fund`, `bond`, `crypto` e `other`.
`TransactionKind` persistido aceita somente `buy` e `sell`; nomes futuros são
reservados, mas não abertos em Rules.

O input decimal aceita sinal e normaliza zeros finais; a forma persistida aceita
somente a gramática canônica sem expoente, zeros à esquerda ou zeros finais.
O limite é de 30 dígitos inteiros e 18 fracionários. Quantidade e preço são
positivos; fee é não negativa e zero vira `null`. A aritmética usa `bigint`,
racionais reduzidos e arredondamento half-up somente na materialização pública.
`MoneyMinor.amountMinor` ainda é `number` inteiro seguro, fora do caminho
principal de quantidade/preço do ledger e deve ser reavaliado ao ampliar o
modelo de caixa.

`effectiveDate` é data civil `YYYY-MM-DD`, independente de timezone. A ordenação
total de Transactions é `effectiveDate ASC`, `createdAt.seconds ASC`,
`createdAt.nanoseconds ASC`, `id ASC` (`compareTransactions`). Não se deve
substituir isso por `Date` de precisão menor ou pela ordem de retorno do banco.

## Modelo Firestore atual

### Paths, documentos e relações

As funções canônicas estão em `src/data/firestore/paths.ts`:

```text
users/{uid}                                      # namespace, sem documento de perfil
├── portfolios/{portfolioId}
│   └── transactions/{transactionId}
├── assets/{assetId}
├── assetIdentities/{identityKey}
└── assetUsages/{assetId}
```

| Documento/path | Campos persistidos observados | Relações e significado |
| --- | --- | --- |
| `portfolios/{portfolioId}` | `name`, `baseCurrency: BRL`, `archivedAt` opcional/`null`, `createdAt`, `updatedAt` | O path contém owner; Portfolio é pai lógico das Transactions; archive preserva filhos e impede novos writes |
| `assets/{assetId}` | `symbol`, `market`, `assetType`, `currency`, `identityKey`, `createdAt`, `updatedAt` | Catálogo owner-scoped; pode ser usado por várias carteiras do mesmo owner |
| `assetIdentities/{identityKey}` | `assetId` | Registry técnico de unicidade; não é entidade de produto nem posição |
| `assetUsages/{assetId}` | `assetId`, `createdAt` | Guard monotônico create-only de que houve referência; não é contador, posição ou saldo |
| `transactions/{transactionId}` sob Portfolio | `kind`, `assetId`, `quantity`, `unitPrice`, `fee`, `effectiveDate`, `createdAt` | Ledger portfolio-scoped; `assetId` referencia Asset do mesmo owner; somente criação pública |

`assetIdentities` substitui uma unique constraint que Firestore não oferece.
`assetUsages` evita uma decisão de delete baseada apenas em scan fora do commit;
ambos são mecanismos Firestore, não conceitos que devem ser transportados
literalmente para o domínio relacional.

Também existem matches explícitos em `firestore.rules` para namespaces futuros,
todos deny-only no estado atual. Eles fazem parte do inventário de superfície,
mas não são documentos atuais:

| Path futuro bloqueado | Estado atual | Disposição |
| --- | --- | --- |
| `users/{uid}/goals/{goalId}` | `allow read, write: if false` | Não abrir nesta fase; possível entidade posterior |
| `users/{uid}/emergencyReserve` | `allow read, write: if false` | Não abrir nesta fase; schema ainda inexistente |
| `.../allocationTargets/{targetId}` | `allow read, write: if false` | Target allocation não é Allocation derivada |
| `.../snapshots/{snapshotId}` | `allow read, write: if false` | Snapshot futuro não substitui Transaction |
| qualquer subpath desconhecido | default deny | Nenhuma abertura por wildcard |

Os testes de Rules também verificam esses paths futuros e subpaths desconhecidos;
eles não devem ser confundidos com tabelas/coleções a migrar na 011-04.

### Ownership e enforcement atual

1. Repositories Web obtêm `auth.currentUser.uid` internamente e constroem paths
   com esse UID (`portfolio-repository.ts`, `asset-repository.ts` e
   `transaction-repository.ts`). O formulário não fornece owner.
2. `firestore.rules` usa default-deny, exige `request.auth.uid == userId` e
   permite somente paths explícitos. Rules validam schema fechado, timestamps
   server-side, referências, archive, registry/usage coerentes e append-only.
3. `AuthGate` não é autorização de dados; a autorização patrimonial atual é a
   combinação de Rules e paths owner-scoped.
4. O Route Handler de Quotes usa Firebase Admin, que bypassa Rules por natureza.
   Ele valida o Bearer ID Token, deriva o UID verificado e o `asset-reader`
   monta somente `users/{uid-verificado}/assets/{assetId}`. Essa exceção é
   estreita e não deve virar padrão de acesso patrimonial.
5. Rules não são filtro. Uma query deve ser owner-scoped antes de executar; não
   se deve consultar uma coleção ampla e esperar que Rules removam documentos.

## Invariantes: código, teste e lacuna

| Invariante | Código/enforcement atual | Evidência de teste | Lacuna/risco para o alvo |
| --- | --- | --- | --- |
| Owner não é escolhido pelo cliente | paths + `auth.currentUser`; Rules; token verificado em Quotes | `tests/firestore.rules.test.mjs`, `tests/quotes-route.test.mjs` | Repositories dependem de singleton browser; API alvo deve derivar `CurrentOwner` do token |
| Portfolio é BRL, nome válido e archive preservado | `portfolio.ts`, parser/converter e Rules | Rules cobrem archive/restore e legado | Constraint/API PostgreSQL ainda inexistentes |
| Asset tem identidade única por owner | `createAssetIdentityKey`, `assetIdentities`, `runTransaction`, `getAfter` | Rules cobrem colisão, órfão e troca atômica | Registry deve virar unique constraint; dados órfãos legados ainda não foram medidos |
| Asset usado não é apagado | `assetUsages`, reconciliação e delete transacional | Rules e testes de lifecycle | **Lacuna:** Transaction legada sem usage pode deixar delete direto via SDK permissivo; auditar/backfill/fence antes de confiar no guard |
| Transaction referencia Asset e Portfolio ativos | repository, `exists`, `existsAfter` e `isActivePortfolioAfter` | Rules cobrem referência/carteira arquivada | Rules não garantem saldo agregado |
| Transaction é append-only | converter rejeita update; Rules só permitem create | Rules cobrem update/delete negados | Papel runtime relacional e proteção contra mutação ainda não existem |
| `SELL` não deixa saldo negativo | reducer no repository e `reduceTransactionQuantity`/`reducePosition` | `domain`, `position`, `positions-read` | Cliente pode ignorar repository e gravar SELL schema-válido; risco C0 imediato |
| Decimal é exato/canônico | parsers, Rules e `decimal-reducer.ts` | `domain.test.mjs`, Rules com limites/formatos | Representação C# / PostgreSQL e testes de limite ainda precisam de decisão 011-04/015 |
| Ordem é determinística | `compareTransactions` usa data, segundos, nanos e ID | testes de backfill/tie em domínio/posição | `timestamptz` ou conversão inadequada pode perder nanos |
| Posições não são fonte autoritativa | ausência de coleção; reducers/read-side | `position.test.mjs`, `positions-read.test.mjs` | Ledger completo pode não escalar; materialização futura deve ser derivada/reconstruível |
| Quote indisponível não é zero | Quote/MarketPosition/summary discriminados | testes de adapter/service/read/dashboard | Rate limit e observabilidade multi-instância ainda não existem |
| Retry não duplica Transaction | comparação de payload quando o mesmo ID é reapresentado | cobertura de conflito no domínio/Rules; não há teste de repository Web completo | O ID é opcional no repository: sem reservar e reutilizar `transactionId`, cada retry pode gerar novo documento |

## Operações, queries e custo observado

| Operação | Implementação e leitura | Scan/ordenação atual | Consequência para PostgreSQL |
| --- | --- | --- | --- |
| Get Portfolio | `getDoc` por path owner-scoped | O(1) documental | PK composta por owner + ID; resposta deve manter archive |
| Listar Portfolios | `getDocs` de toda a coleção; filtro `archivedAt` em memória | Scan de todas as Portfolios; sem ordenação explícita | Índice por owner/lifecycle e ordem só se UX exigir; não copiar filtro como regra de segurança |
| Criar/editar/archive/restore Portfolio | `setDoc`/`updateDoc`; archive altera apenas `archivedAt`/`updatedAt` | Leitura prévia e releitura posterior | Constraints de base/moeda/timestamps e concorrência devem ser explícitas |
| Listar Assets | `getDocs` de `assets` e `assetIdentities`; valida coerência e ordena por ID | Carrega dois catálogos inteiros; busca registry com `.find` por Asset | Unique owner + identidade; consulta de catálogo deve ter índice/ordem justificados |
| Encontrar identidade | `findAssetIdForIdentity` carrega todo `assets` e procura em memória | Scan completo de Assets | Deve desaparecer quando unique constraint resolver lookup |
| Criar/editar Asset | `runTransaction` lê registry/Asset e troca par atomicamente; tenta até 3 vezes em inconsistência | Leitura do catálogo antes do commit em alguns caminhos | Uma transação/constraint relacional substitui registry e retry ad hoc |
| Reconciliar/delete Asset | Lista todas as Portfolios e consulta cada `transactions` com `where(assetId == ...)`; depois lê par Asset/registry/usage | Scan por Portfolio e leitura de ledger; falha fecha delete | FK `ON DELETE RESTRICT`/unique pode substituir guard; migração deve auditar histórico antes |
| Listar Transactions | `getDocs` da subcoleção inteira e `sortTransactions` em memória | Scan completo + ordenação por data/timestamp/ID | Índice owner + Portfolio + ordem; paginação não pode perder ordem nem mudar semântica |
| Criar Transaction | Dentro de `runTransaction`, lê Portfolio, Asset, ID candidato, usage e ledger inteiro; reduz ledger antes do write | Custo cresce com tamanho do ledger; retry otimista do SDK; idempotência só ocorre quando o mesmo ID é reservado/reutilizado | API precisa transação/lock/idempotency key e proteção contra dois SELL concorrentes |
| Ler Portfolio dashboard | `getPortfolio` + ledger inteiro + catálogo inteiro + Quotes em lotes de 20 | Recomputa tudo no cliente; só posições abertas pedem Quote | Read queries por slice; não persistir Position como verdade sem evidência |
| Ler dashboard global | Lista Portfolios/Assets uma vez, filtra ativos, lê um ledger por Portfolio, deduplica Quotes | O(P + A + soma dos ledgers), Quotes sequenciais em lotes de 20 | Query/read model backend deve preservar partial/stale e excluir arquivadas |
| Quotes | Route deduplica IDs, limita 20, lê Assets do owner, service faz cache/in-flight | Uma chamada por **cache key/símbolo** que não esteja em cache ou in-flight; Assets com a mesma chave podem compartilhar a chamada | Rate/quota e cache compartilhado são decisões operacionais, não assumidas |

Não há `firestore.indexes.json` nem query composta registrada. Isso não prova
ausência de limite de escala: prova somente que o checkout atual não configurou
índice composto e que os repositories fazem scans client-side.

## Quotes, BRAPI e limites por processo

O fluxo atual é:

```text
POST /api/quotes { assetIds }
  → Firebase Admin verifica Firebase ID Token
  → AssetReader lê apenas Assets do UID verificado
  → QuoteService aplica mapping/cache/retry
  → BrapiAdapter chama endpoint fixo BRAPI server-side
  → QuoteResult[] sanitizados, por Asset
```

O mapping aceita somente `market=B3`, `currency=BRL` e `assetType` em
`stock|etf|fii`. `fund`, `bond`, `crypto` e `other` retornam
`UNSUPPORTED_ASSET`. A chave de cache é versionada por provider, endpoint e
símbolo, sem UID e sem `assetId`; `symbolChanged` fica na Quote e não altera a
identidade local.

O domínio compartilhado ainda contém constantes e funções específicas da BRAPI
(`QUOTE_PROVIDER`, endpoint, mapping e chave de cache em `src/domain/quote.ts`).
Isso não significa que o browser chama o provider: a chamada upstream e a
credencial estão confinadas a `src/server/quotes/**`. Porém, o contrato/mapping
BRAPI também é importável pelo read-side client e pode chegar ao bundle; é um
acoplamento a classificar na arquitetura alvo, onde o domínio deve preferir um
port/contrato externo neutro e o adapter deve ficar em Infrastructure.

Valores observados em `QUOTE_CACHE_POLICY` (`src/domain/quote.ts`):

| Limite/política | Valor |
| --- | ---: |
| Fresh TTL | 60 s |
| Stale-if-error | 300 s |
| Timeout upstream | 3 s |
| Retries | 1, somente falhas transitórias |
| Backoff implementado | mínimo configurado, 100 ms; máximo contratual 250 ms não é usado pelo service |
| Lote máximo | 20 Assets |
| Concorrência upstream | 1 por processo |
| Cache máximo | 500 entradas, eviction pela inserção mais antiga |

O cache e a fila de upstream são process-local (`quote-service.ts`). Cold start,
redeploy e múltiplas instâncias não compartilham estado. Não existe rate limit
distribuído, métrica de quota ou promessa de cache global. O body BRAPI, tokens,
credenciais e payload financeiro não devem aparecer em resposta/log. **Somente
erros** atravessam o boundary com códigos sanitizados como `TIMEOUT`,
`RATE_LIMITED`, `PROVIDER_UNAVAILABLE` ou `INVALID_PROVIDER_RESPONSE`; uma Quote
disponível retorna os campos contratuais de `Quote` (preço decimal, provider
symbol, `quotedAt`, `fetchedAt` e `freshness`), não o payload bruto do provider.

## Dados legados, volumetria e anomalias

### Compatibilidade observada

- Portfolio legado sem `archivedAt` é interpretado pelo parser como ativo
  (`null`); novas escritas incluem o campo.
- Transaction legada sem `fee` é aceita pelo parser como `fee: null`; novas
  escritas incluem `fee`.
- Asset não possui variante legada explícita no parser; qualquer campo ausente,
  extra, timestamp incompatível ou `identityKey` divergente falha.
- `assetUsages` não é um campo legado da Transaction. A auditoria/reconciliação
  atual existe justamente porque Transactions históricas podem anteceder o
  guard; até que todas as referências sejam auditadas e os guards faltantes
  sejam criados, a ausência de usage não prova ausência de Transaction e o
  delete por SDK não deve ser tratado como seguro.
- IDs atuais são document IDs opacos. Não foi observada regra que dependa do
  formato do ID, e a migração deve preservá-los sem convertê-los em sequenciais.
- O parser Web de Transaction preserva `Timestamp.seconds` e `nanoseconds`.
  `portfolio-parser` e `asset-parser` convertem Timestamp para `Date`; o
  `asset-reader` Admin também converte para `Date`, portanto não deve ser usado
  como evidência de preservação de nanos de Transaction.

### O que não foi medido

Não há acesso autorizado a export ou banco sanitizado nesta execução. Logo não
há contagens de owners, Portfolios, Assets, Transactions, tamanho de ledger,
distribuição de `effectiveDate`, documentos sem `fee`/`archivedAt`, órfãos,
ledger negativo, duplicidade de identidade, timestamps inválidos ou anomalias.
Também não existe migrador, staging, quarentena ou relatório de reconciliação no
workspace atual. O aceite de volumetria da 011 exige uma execução posterior
somente leitura e sanitizada.

### Plano de auditoria sem dado sensível

Antes de 011-04/020, um export/reconciliador deve produzir apenas por owner
pseudonimizado e por ambiente:

1. contagens de documentos e ledgers, min/max de tamanho e distribuição de
   campos legados;
2. contagens de inválidos por código/campo, órfãos de registry/usage,
   referências quebradas, identities duplicadas e sequência negativa;
3. hashes estáveis de registros canônicos e totais agregados necessários à
   reconciliação, sem imprimir payload, UID, ID real, token ou valor financeiro;
4. amostras sintéticas equivalentes aos limites decimal/temporal e aos casos
   `archivedAt`/`fee` ausentes;
5. quarentena explícita para inválidos: nenhum fato deve ser descartado ou
   corrigido silenciosamente.

O arquivo local ignorado `firebase-adminsdk-keys.json` é mencionado pela spec e
está no `.gitignore`. A inspeção desta subtarefa verificou apenas nomes de
arquivos rastreados/histórico por padrão de nome; não abriu o arquivo nem
registrou conteúdo. Não há evidência documental suficiente nesta inspeção para
concluir exposição ou dispensar rotação.

## Riscos e classificação de destino

| Item | Classificação | Motivo/ação necessária |
| --- | --- | --- |
| Transaction como fato, ledger append-only e correção compensatória | Preservar | Contrato de produto; portar com golden masters e enforcement de escrita confiável |
| IDs de Portfolio/Asset/Transaction e ownership verificado | Preservar | Referências e isolamento dependem deles; IDs devem ser texto opaco no alvo |
| Decimais canônicos, `bigint`/racionais, data civil e ordem total | Preservar/corrigir | Preservar semântica; provar armazenamento C#/PostgreSQL sem perder nanos/escala |
| Archive/restore e BRL V1 | Preservar | Archive não é cascade; manter leitura histórica e bloqueio de novos writes |
| Position/MarketPosition/Allocation/dashboards derivados | Preservar conceitualmente | Reimplementar como query/read model; não criar segunda autoridade |
| Parser/converter e erros sanitizados | Adaptar | Reusar invariantes e matriz de campos, substituir Firebase Timestamp/SDK |
| Firestore repositories e acesso browser ao patrimônio | Substituir | Cliente alvo usa HTTP; API deriva owner e executa transação/autorização |
| `assetIdentities` | Substituir | Unique constraint owner-scoped no PostgreSQL, após auditoria de colisões |
| `assetUsages` | Substituir/remover | FK/restrict e política de lifecycle podem provar referência; manter compatibilidade somente durante migração se necessário |
| Rules como autorização e schema principal | Substituir | API/Application + constraints/defesa no banco; Rules ficam legado até cutover |
| SELL validado só pelo repository | Corrigir imediatamente | Boundary atual é frágil; decisão C0 obrigatória antes de avanço operacional |
| Scan integral/ordenação em memória | Corrigir/substituir | Derivar queries/índices reais e limites; não prometer paginação sem preservar ordem |
| QuoteService/cache process-local | Preservar inicialmente/corrigir operacionalmente | Preservar estados e resiliência; medir quota/latência antes de cache distribuído |
| Next Route Handler/Firebase Admin para Quotes | Substituir após paridade | Responsabilidade vai para ASP.NET Core/Infrastructure; BRAPI permanece backend-only |
| Dados inválidos/legados | Quarentenar/corrigir por política | Não descartar ou reescrever fatos sem evidência e decisão de migração |

## Checkpoint C0 — fragilidade de `SELL`

O fato técnico é inequívoco: `transaction-repository.ts` reduz o ledger antes de
gravar, mas `firestore.rules` valida somente schema, owner, Asset, usage e
Portfolio ativa. Rules não agregam a coleção. Portanto, um SDK que escreva
diretamente um documento `sell` schema-válido pode ultrapassar o saldo.

Opções registráveis para C0:

| Opção | Uso | Consequência |
| --- | --- | --- |
| A — aceitar risco por prazo curto | Somente ambiente confiável, sem evidência de usuário não confiável, com monitoramento e data de expiração explícita | Não é garantia de integridade; bloqueia tratar o ledger como protegido |
| B — suspender writes financeiros | Desabilitar create de Transaction/SELL até o boundary confiável | Interrompe a funcionalidade, mas contém o risco de integridade |
| C — bridge transitório server-side | Roteia writes para endpoint confiável que valida saldo, concorrência e idempotência, sem dual-write | Exige implementação e operação temporárias; Firestore continua única autoridade até fence |

**Recomendação desta análise:** como a volumetria, população e confiabilidade
dos clientes não foram comprovadas, usar B se houver qualquer usuário não
confiável; usar A somente com owner humano explícito, allowlist de ambiente e
prazo curto; escolher C apenas se a continuidade de writes for indispensável.
Nenhuma opção autoriza dual-write. O deadline é **antes de C1 e antes de
qualquer novo write patrimonial fora do fluxo confiável**; o responsável pelo
go/no-go deve registrar opção, ambiente, data de expiração, evidência de
monitoramento e plano de rollback. A decisão não foi executada nesta subtarefa
de documentação e permanece risco/gate residual do overview.

## Evidências cruzadas e lacunas

| Requisito de validação da subtarefa | Evidência |
| --- | --- |
| Cada path conferido contra paths/Rules | `src/data/firestore/paths.ts` e matches explícitos em `firestore.rules`; coberto também por `tests/firestore.rules.test.mjs` |
| Matriz invariante → código → teste → lacuna | Tabela acima; testes puros em `tests/domain.test.mjs`, `position.test.mjs`, `positions-read.test.mjs`, `dashboard-read.test.mjs`, `quotes-*.test.mjs` e Rules no Emulator |
| Decimal/timestamp | `value-objects.ts`, `decimal-reducer.ts`, parsers/converters e fixtures com nanos/limites; perda potencial Admin→`Date` registrada |
| Acesso Firestore/Admin/BRAPI fora dos boundaries | Busca estática encontrou SDK Firestore nos repositories/parsers/converters e Admin somente em `src/server/**`/Route Handler; chamada BRAPI/credencial somente em `src/server/quotes/**`, mas constantes/contratos BRAPI também estão em `src/domain/quote.ts` compartilhado; nenhum acesso novo foi criado |
| Volumetria/anomalias sanitizadas | Não executada por falta de acesso de leitura autorizado; plano sanitizado e lacuna explícita registrados |
| Histórico 005–010 | Spec 011, specs 005/007/008/009 e ADRs 005/006 conferidos; princípios foram separados dos mecanismos sucedidos |

## Arquivos alterados

- `docs/tasks/011-revisao-roadmap-evolucao-arquitetural/011-02-mapear-dominio-dados-e-riscos.md` — status, inventário, matriz de invariantes, paths, queries, integrações, riscos, C0, evidências e handoff documental.
- Nenhum arquivo de produção, Rules, banco, deploy, configuração externa,
  segredo ou dado foi alterado.
- Não foi criado `docs/architecture/**`: a política de edição registrada em
  011-01 restringe a escrita desta sessão a `docs/specs/**` e `docs/tasks/**`;
  o inventário completo permanece nesta subtarefa.

## Decisões e desvios

- O modelo atual confirma que `assetIdentities` e `assetUsages` são compensações
  técnicas do Firestore, não entidades de domínio a copiar automaticamente.
- O inventário recomenda tratar `SELL` como risco de C0 e não como garantia das
  Rules. Não foi implementado boundary temporário, pois isso está explicitamente
  fora do escopo desta subtarefa.
- Nenhuma volumetria foi inventada. A ausência de acesso a dados sanitizados é
  uma lacuna operacional para 011-04/020, com plano de auditoria sem payload.
- Cache BRAPI process-local, limite de retry/backoff e conversão Admin de
  Timestamp foram documentados como fatos, sem antecipar decisão de biblioteca,
  RLS, tipo PostgreSQL ou cache distribuído.
- O inventário explicita que o contrato BRAPI compartilhado ainda é um
  acoplamento do domínio/client e que a cardinalidade upstream é por cache key,
  não necessariamente por Asset.
- A ausência de `assetUsages` em Transactions legadas é uma lacuna de integridade:
  exige auditoria/backfill e fence antes de permitir delete confiável.
- A idempotência depende de reservar/reutilizar o mesmo `transactionId`; o
  parâmetro opcional do repository não elimina duplicação quando omitido.
- A escolha C0 continua sujeita ao go/no-go humano antes de C1; a recomendação
  conservadora é suspender writes quando o ambiente não for confiável.

## Comandos executados e resultados

### Inspeção

- `functions.glob` em `src/domain/**`, `src/data/**`, `src/server/**`,
  `tests/**`, `scripts/**`, specs 005–010 e ADRs 005/006 — **passou**; limites
  e módulos foram catalogados.
- `functions.grep` por acessos Firestore/Admin/BRAPI, paths, invariantes,
  legado e testes — **passou**; acessos ficaram restritos aos boundaries
  catalogados.
- `git ls-files`/histórico por padrões de nome de credencial — **sem ocorrência
  rastreada encontrada**; o arquivo ignorado não foi aberto e isso não constitui
  auditoria completa de exposição.

### Gates técnicos e regressão

Os comandos abaixo foram executados no fechamento desta subtarefa:

- `npm run test:domain` — **passou**, 14 testes.
- `npm run test:positions` — **passou**, 4 testes.
- `npm run test:positions-read` — **passou**, 9 testes.
- `npm run test:dashboard-read` — **passou**, 8 testes.
- `npm run test:quotes-adapter` — **passou**, 7 testes.
- `npm run test:quotes-service` — **passou**, 8 testes.
- `npm run test:quotes-route` — **passou**, 8 testes.
- `npm run test:rules` — **passou**, 19 testes no Firestore Emulator; os logs
  esperados de `PERMISSION_DENIED` correspondem aos casos negativos.
- `npm run lint` — **passou**.
- `npm exec next typegen && npx tsc --noEmit` — **passou**; typegen e
  typecheck sem erros.
- `npm run build` — **passou**; Next 16.3.5 compilou e gerou as rotas atuais.
- `git diff --check` — **passou**.
- Revisão independente `review` — **APROVADO**, sem findings pendentes após
  conferir paths future deny-only, BRAPI, usage legado, idempotência, cache,
  checklist e dados sensíveis.

## Resultado e aceite

O inventário do domínio, documentos, paths, ownership, Rules, repositories,
read-side, BRAPI/cache, precisão, ordenação, legado e riscos está completo para
o estado observado. Princípios preserváveis foram separados dos mecanismos a
substituir, e o risco de `SELL` direto está explícito com alternativas e deadline
de C0. Os gates técnicos passaram sem alteração de código de produção.

## Riscos residuais

- C0 ainda não foi operacionalmente decidido: `SELL` direto permanece possível
  fora do repository até suspensão ou boundary confiável.
- Transactions legadas sem `assetUsages` podem enfraquecer o bloqueio de delete
  de Asset; nenhum backfill/auditoria foi executado nesta sessão.
- Volumetria e anomalias reais não foram observadas; tamanho de ledger, dados
  legados e necessidade de índices continuam desconhecidos.
- Perda de nanos em qualquer caminho que use `Date`/`timestamptz` permanece uma
  hipótese técnica a provar com fixtures e PostgreSQL real.
- Admin SDK bypassa Rules no caminho de Quotes; a futura API deve manter
  ownership derivado de token e não ampliar o reader estreito atual.
- O contrato `src/domain/quote.ts` ainda carrega detalhes BRAPI para consumidores
  compartilhados; a arquitetura alvo deve separar contrato externo de adapter
  sem permitir chamada ou segredo no frontend.
- Sem um `transactionId` reservado e reutilizado, retry do repository pode criar
  novo documento; a API alvo deve exigir idempotency key.
- Scans completos e cache process-local podem degradar com múltiplas instâncias;
  não há evidência suficiente para introduzir read model persistido ou Redis.

## Handoff

- `011-03` deve usar esta matriz para definir ports e separar Domain/Application/
  Infrastructure/API; `SELL`, ownership e read-side são os casos de walkthrough.
- `011-04` deve transformar registry/usage em constraints/FKs candidatas,
  preservar IDs/ordenação e executar auditoria de volumetria/anomalias sem
  payload sensível.
- `011-05` deve formalizar `CurrentOwner`, o caminho Admin/API e a política de
  logs/secrets; `AuthGate` permanece somente UX.
- `011-07` deve incluir C0, testes concorrentes de `SELL`, reconciliação, cache
  multi-instância, restore e o limite honesto de rollback após PostgreSQL write.
- A revisão independente aprovou este inventário; não avançar automaticamente
  para 011-03 nesta sessão.
