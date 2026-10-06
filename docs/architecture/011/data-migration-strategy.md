# 011 — Estratégia de migração e reconciliação

- **Ticker:** `011`
- **Escopo:** desenho repetível do migrador Firestore → PostgreSQL.
- **Estado:** plano de discovery; nenhuma exportação, carga ou conexão foi executada.

## Princípios operacionais

1. Firestore é a única autoridade até o write fence do cutover. PostgreSQL é
   alvo de cópia/rehearsal, não destino de dual-write.
2. Cada execução tem `migration_batch_id`, snapshot identificável, versão do
   transformador e manifesto. A mesma entrada produz o mesmo resultado ou a
   mesma quarentena.
3. Nenhum dado financeiro é descartado, arredondado ou corrigido silenciosamente.
   Divergência interrompe promoção ou vai para quarentena com código e evidência
   sanitizada.
4. Relatórios operacionais mostram contagens, códigos, tamanhos e hashes por
   owner pseudonimizado. Não mostram UID, IDs reais, tokens ou payload financeiro.
5. A promoção ocorre por owner e somente depois de staging completo, FKs válidas,
   digest reconciliado e aprovação do gate. Não há cutover por tabela: Portfolio,
   Asset e Transaction têm invariantes cruzados.

## Componentes e permissões

| Componente | Função | Autoridade/permissão |
| --- | --- | --- |
| Extractor | Ler export/snapshot Firestore sem modificar origem | Somente leitura; acesso aos arquivos de entrada controlado. |
| Validator/Transformer | Validar schema, normalizar formas permitidas e gerar quarentena | Sem acesso de escrita ao runtime; versão registrada no manifesto. |
| Staging schema | Receber linhas candidatas, erros e hashes por batch | Isolado do schema patrimonial; pode ser truncado por batch. |
| Loader | Promover linhas válidas na ordem Owner → Portfolio → Asset → Transaction | Papel de migration, transação por unidade de promoção e sem uso no startup. |
| Reconciler | Comparar fonte, staging e destino; recalcular ledger | Read-only no destino após carga; relatórios sanitizados. |
| Runtime API | Operar após cutover | Não acessa Firestore e não possui permissões de migration. |

O schema patrimonial deve ser privado no PostgreSQL/Supabase. Não existe
dependência de Supabase Auth ou Data API; somente API ASP.NET Core e migration
job acessam o banco. O runtime não recebe papel dono do schema.

## Pipeline repetível

### 1. Extract

- Capturar um snapshot consistente ou export equivalente das cinco superfícies
  atuais: owners, Portfolios, Assets, Transactions e os registries
  `assetIdentities`/`assetUsages`.
- Preservar path, document ID, Timestamp bruto, campos presentes/ausentes e uma
  versão do extrator em artefato de entrada controlado.
- Não usar os parsers que convertam Timestamp para `Date` como única fonte da
  migração; Transaction precisa de segundos e nanos. O conteúdo bruto não entra
  em logs.

### 2. Validate

Validar antes de qualquer escrita no schema alvo:

- namespace/path e ownership; UID do path é a única origem do owner;
- IDs não vazios e ausência de colisões `(owner, tipo, id)`;
- schemas fechados e tipos de Timestamp;
- compatibilidade legada conhecida: `archivedAt` ausente ou explicitamente
  `null` equivale a ativo e `fee` ausente ou explicitamente `null` equivale a
  nulo. O código `LEGACY_DEFAULT_APPLIED` é usado somente para ausência; o
  `null` explícito é um valor válido e não deve gerar falsa divergência;
- campos desconhecidos, asset sem identidade coerente, Portfolio inválida,
  decimal fora do limite, data não civil, timestamp inválido e enums fora do
  conjunto aceito;
- referências de Transaction para Portfolio/Asset do mesmo owner;
- duplicidade de identidade canônica e divergência entre registry e Asset;
- uso de Asset por Transaction independentemente da presença de `assetUsages`;
- ledger ordenável e resultado do reducer, incluindo `SELL` acima do saldo.

Falhas são linhas de quarentena, não defaults genéricos. Um documento com
`fee` ausente ou nulo é compatível; uma fee presente e não nula, mas inválida,
não é convertida para nula. O mesmo vale para `archivedAt`: ausência e `null`
são estados ativos válidos, mas um Timestamp presente e malformado é inválido.

### 3. Transform

Produzir uma representação canônica, sem alterar o fato:

- manter `owner_uid`, IDs e referências como texto opaco;
- recomputar a identidade do Asset a partir de
  `(symbol, market, assetType, currency)` e comparar com `identityKey`;
- manter `effectiveDate` como `date` e `createdAt` como `(seconds, nanos)`;
- manter quantity, unit price e fee como strings decimais canônicas; nenhum
  `float`, `double`, `number` ou arredondamento; manter também as moedas de
  `UnitPrice` e `Fee` como campos do mesmo fato;
- retirar `assetIdentities` e `assetUsages` da carga de domínio, mas preservar
  seus resultados de auditoria no relatório do batch;
- gerar um hash canônico por linha para detectar repetição e divergência. O
  hash é de comparação, não substitui o valor original nem é logado com payload.

O transformador deve ser puro em relação à entrada e ter fixtures para:
documentos legados sem `archivedAt`/`fee`, decimal no limite, Timestamp com nanos,
mesmo microssegundo com nanos diferentes, ID invertendo a ordem lexicográfica,
duplicidade de identity e ledger inválido.

### 4. Stage

Cada linha de staging carrega, no mínimo, `migration_batch_id`, tipo lógico,
owner pseudonimizado no relatório, chave de destino, representação canônica,
hash, status e código de erro. O artefato bruto fica separado e com acesso
restrito; não se replica payload financeiro em logs.

Staging é isolado por batch. Uma execução falha não mistura linhas com outra e
um batch incompleto nunca é promovido. A limpeza de staging é permitida somente
depois de retenção e evidência de reconciliação.

### 5. Load

A ordem é:

```text
Owner → Portfolio → Asset → Transaction → índices/constraints verificadas
```

O loader usa as chaves compostas do modelo relacional:

- mesma chave e mesmo hash: no-op idempotente;
- mesma chave e hash diferente: conflito bloqueante/quarentena;
- nova chave: insert;
- nenhuma operação de UPDATE/DELETE sobre Transaction;
- FKs são verificadas antes da promoção do owner e não há `ON DELETE CASCADE`
  patrimonial.

Falha parcial deixa o batch não promovido. O loader pode recomeçar com o mesmo
`migration_batch_id`; não deve depender de ordem de retorno do Firestore nem de
IDs novos gerados pelo destino.

## Reconciliação por owner

Um owner só é elegível para promoção quando todos os itens abaixo passam:

| Controle | Evidência esperada |
| --- | --- |
| Cardinalidade | Contagem de Owners, Portfolios, Assets e Transactions válida; inválidos e defaults separados. |
| Identidade | Conjunto de IDs opacos coincide por entidade e owner; nenhuma colisão. |
| Ownership | Toda Portfolio/Asset/Transaction aponta ao owner do path; nenhuma FK cross-owner. |
| Asset identity | Tuplas canônicas coincidem e unique constraint não produz colisão; registries órfãos aparecem somente como anomalia. |
| Lifecycle | `archivedAt` e referências históricas preservados; Portfolio arquivada não recebe fatos novos. |
| Decimal | Strings canônicas coincidem byte a byte; limites e sinais passaram sem arredondamento. |
| Tempo/ordem | `effectiveDate`, seconds, nanos e ID produzem a mesma ordenação total. |
| Ledger | Digest ordenado por Portfolio e reducer reproduzem saldo/posição; SELL inválido nunca é escondido. |
| Integridade | Todas as FKs passam; uso real de Asset é maior ou igual ao registry e bloqueia delete. |
| Repetição | Reexecutar o mesmo batch não muda contagens, hashes ou fatos. |

O digest é calculado sobre uma serialização canônica versionada e ordenada por
chave. Para Transaction, a ordem inclui os quatro componentes do ledger. O
relatório publica somente digest, contagem e código de divergência; a evidência
detalhada fica restrita ao operador autorizado.

Positions e totais são verificações derivadas, não novas linhas de destino. O
reconciliador executa o mesmo reducer sobre o export e sobre as Transactions
carregadas; uma divergência não é resolvida gravando Position.

## Política de inválidos e quarentena

| Classe | Exemplo | Ação |
| --- | --- | --- |
| Default compatível | Portfolio sem `archivedAt`; Transaction sem `fee` | Transformar para `NULL`, registrar `LEGACY_DEFAULT_APPLIED` somente para o campo ausente e reconciliar. |
| Nulo explícito | `archivedAt: null` ou `fee: null` | Transformar para `NULL` sem quarentena e sem classificar como default ausente. |
| Corrigível sem mudar fato | Forma de entrada decimal que o parser canônico normaliza sem arredondar | Normalizar somente se a regra já for contrato; guardar forma/origem no artefato de auditoria. |
| Estrutural | Campo desconhecido, Timestamp ilegível, ID vazio, enum inválido | Quarentenar; não carregar nem inventar valor. |
| Referencial | Portfolio/Asset ausente ou de outro owner | Quarentenar o fato e bloquear promoção do owner. |
| Integridade patrimonial | Duplicate identity, SELL negativo, Transaction duplicada divergente | Quarentenar, emitir divergência bloqueante e exigir decisão explícita. |
| Registry legado | `assetIdentity` órfão ou usage ausente | Não copiar registry/usage; registrar anomalia e usar FK/ledger como evidência. |

Quarentena não é descarte. Cada item tem código estável, batch, chave de
origem protegida, motivo e decisão pendente. Não se deve editar o fato original
para fazê-lo caber no schema novo.

## Ambientes, seeds e migrations

- **Local:** PostgreSQL real descartável, export sintético e migrations do mesmo
  assembly que será testado; sem SQLite/EF InMemory.
- **Test:** banco PostgreSQL isolado por execução, fixtures determinísticas de
  limite, falha parcial, import repetido, FKs, locks e restore.
- **Staging:** cópia sanitizada ou sintética, sem dados produtivos por
  conveniência; rehearsal completo e schema privado.
- **Produção:** export autorizado, backup/PITR verificado, seed desativado e
  janela de freeze aprovada.

EF Core/Npgsql controla o schema por migrations revisadas. O job de migration é
separado do startup e usa papel próprio. Migrations de schema não são um método
de apagar ou reescrever fatos; alterações destrutivas exigem política de
retenção, backup e aceite operacional separado.

## Rehearsal, freeze e cutover

### Antes do freeze

1. Executar pré-cópias repetíveis para staging.
2. Medir duração de extract/validate/load/reconcile e tamanho de quarentena.
3. Resolver colisões e divergências; nenhuma divergência inexplicada passa do
   gate C8.
4. Provar backup/restore e a versão compatível da API/frontend PostgreSQL.

### Freeze e fence

1. Anunciar janela e bloquear writes patrimoniais no app/Rules antigos.
2. Confirmar que não há requests de write em voo; o fence precisa ser
   observável, não apenas uma flag de UI.
3. Extrair delta final com a mesma versão do transformador.
4. Validar, transformar, staging e load final.
5. Reconciliar por owner, IDs, FKs, decimals, tempo, ledger e derivados.

### Read-only e primeiro write

1. Promover o lote reconciliado e iniciar API/frontend alvo em read-only.
2. Executar smoke de auth, ownership, Portfolio, Asset, Transaction, Quotes e
   dashboard sem expor payload em logs.
3. Trocar hosts/origens somente após smoke e observabilidade mínima.
4. Habilitar writes PostgreSQL. Este é o primeiro write da nova autoridade; não
   existe dual-write normal nem retorno automático ao Firestore.

Cutover por tabela é proibido. Cutover por owner só será considerado se houver
fence forte por owner e uma autoridade inequívoca; a baseline prefere janela
global por causa das FKs cruzadas.

## Rollback e point of no return

### Antes do primeiro write PostgreSQL

O rollback é simples: parar o novo stack, descartar ou preservar o batch para
diagnóstico, remover staging conforme retenção e reabrir Firestore após remover
o fence. Nenhum dado novo do PostgreSQL é autoridade.

### Depois do primeiro write PostgreSQL

O point of no return é o primeiro write patrimonial aceito no PostgreSQL. A
partir dele:

- PostgreSQL é a única autoridade;
- Firestore não é reaberto como destino;
- rollback de aplicação significa voltar para uma versão compatível com
  PostgreSQL;
- falha de dados usa restore/PITR ou forward fix no PostgreSQL;
- qualquer reverse migration para Firestore exigiria projeto separado, nova
  reconciliação e aprovação explícita; não é runbook de emergência.

O go/no-go deve registrar backup restaurável, migration version, batch/delta,
digest por owner, quarentena aceita (ou zero), smoke, métricas e responsáveis.
Sem isso, permanece read-only ou o cutover é abortado.

## Tabletop e plano de testes

O plano de implementação 016/020 deve executar em PostgreSQL real:

- aplicar migrations em banco vazio e verificar reexecução;
- testar PK/FK/unique/check, `RESTRICT`, archive e permissões append-only;
- gravar os limites decimal e temporal do modelo 011;
- importar duas vezes e comparar contagens/digests;
- interromper o loader em cada entidade e retomar o mesmo batch;
- tentar archive concorrente com insert de Transaction e provar que o caso de
  uso bloqueia a Portfolio, revalida lifecycle e não deixa write após archive;
- gerar cada classe de quarentena sem perda silenciosa;
- executar duas cargas concorrentes e validar locks/idempotência;
- restaurar backup/PITR em banco descartável e repetir reconciliação;
- comparar planos dos índices de Portfolio, Asset lifecycle e ledger;
- provar que anon/browser não alcançam schema patrimonial.

Os testes atuais TypeScript continuam sendo golden masters do comportamento,
mas não provam constraints, locks ou tipos PostgreSQL. A ausência de banco,
export e migrador nesta fase é intencional e está registrada como risco, não
como evidência de execução.

## Handoff para 015/016/020

- **015:** fechar o Value Object C# e o harness TS↔C# para decimal string,
  TimestampParts e idempotência; decidir divergências somente com fixtures.
- **016:** implementar DbContext, migrations, roles, staging e loader conforme
  este modelo; provar Npgsql/PostgreSQL real antes de aceitar `numeric` ou
  `timestamptz` alternativos.
- **020:** executar auditoria sanitizada, rehearsals, freeze, write fence,
  reconciliação e go/no-go; manter o limite honesto de rollback.

Nenhum componente desta subtarefa cria banco, migration, conexão Supabase,
export real ou dados reais.
