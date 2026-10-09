# ADR 022 — Backend Go, PostgreSQL vazio e descomissionamento do Firestore

- **Status:** `proposed` — decisões confirmadas pelo maintainer em 2026-10-09;
  aceite condicionado à conclusão da task 002-15 do CrownPilot (backend Go em
  produção naquele projeto). A representação decimal (seção 3) está condicionada
  também ao [anexo 022-A](anexos/adr-022-a-experimento-decimal.md).
- **Ticker relacionado:** `011` (baseline arquitetural), redigida durante a `012`
- **Substitui, a partir do aceite:**
  - a [ADR 019](019-migracao-write-fence-reconciliacao-e-retencao.md),
    **integralmente**;
  - os trechos dependentes de .NET das ADRs 007, 008, 011, 013 e 018
    (seção 1.1);
  - os trechos de migração das ADRs 007, 009, 010, 012, 018, 020 e 021
    (seção 1.2);
  - na ADR 013, a janela de clock skew de 60 s e a revogação em todo write
    financeiro (seção 2.4);
  - nas ADRs 009 e 018, o caráter “candidato” da RLS (seção 2.7c);
  - na ADR 020, a abertura do fornecedor e da região de hosting (seção 2.7b).

  As ADRs 007–021 não são editadas. Esta ADR registra as substituições.
- **Referência externa:** ADR 005 do CrownPilot
  (`crownpilot-app/docs/decisions/005-go-react-vite-firebase-postgresql.md`).

## Contexto

A fase 011 registrou a arquitetura alvo React/Vite → ASP.NET Core/.NET →
EF Core → PostgreSQL/Supabase nas ADRs 007–021, todas `proposed`. Nada do
backend foi implementado. O maintainer decidiu usar Go no backend, com as
decisões de stack aceitas no CrownPilot.

Os dados atuais no Firestore são apenas de teste e podem ser descartados. Não há
dados reais a preservar, portanto não há fatos patrimoniais a transportar,
reconciliar ou reter. A troca de linguagem não reabre as decisões de produto,
domínio, segurança e concorrência da 011, exceto onde esta ADR diz o contrário.

## 1. Substituições nas ADRs 007–021

### 1.1 Trechos dependentes de .NET

Nenhuma ADR dependia totalmente de .NET.

| ADR | Trecho substituído | Passa a valer |
| --- | --- | --- |
| 007 | Item 1: “ASP.NET Core/.NET → Application/Domain → Infrastructure/EF Core”. | API Go (`net/http`) → capacidades/domínio → adapters `pgx`/`sqlc` → PostgreSQL/Supabase. |
| 008 | Diagrama “Infrastructure → EF Core”; EF Core e ASP.NET Core na lista do Domain; “controllers finos”; “projetos e analyzers”. | Pacotes Go sob `internal/` (seção 2.1), handlers finos e `depguard` (seção 2.8). O Domain continua sem HTTP, banco, Firebase e BRAPI. |
| 011 | `System.Decimal`; `BigInteger`; experimento com Npgsql; golden master “TS↔C#”. | `math/big`, `text` + `CHECK`, anexo 022-A e golden master da seção 3.4. A string canônica e os limites 30+18 continuam. |
| 013 | Migração do hot path para JwtBearer. | Firebase Admin Go em todas as rotas (seção 2.4). |
| 018 | Npgsql; migrations EF Core; “pooling transacional aceitável” do documento de modelo. | `pgx`/`sqlc`, `goose` forward-only e Session pooler (seções 2.5–2.7). |

As ADRs 009, 010, 012, 014, 015, 016, 017, 020 e 021 eram independentes de
linguagem. A ADR 016 só menciona “tabelas EF”, sem efeito normativo.

### 1.2 Trechos que dependiam da migração de dados

| ADR | Trecho | Passa a valer |
| --- | --- | --- |
| 007 | Itens 3–5: Firestore autoridade até C10, cópias de rehearsal, remoção após C11. | O PostgreSQL é autoridade patrimonial desde o primeiro write no backend Go. O Firestore é descomissionado conforme a seção 4. |
| 009 | Item 3: IDs atuais preservados como texto opaco. | IDs novos de Portfolio, Asset e Transaction em **UUIDv7**, gerados no Go (seção 2.5). Os itens 1, 2, 4 e 5 (owner do `sub`, UID opaco, chaves compostas, RLS como defesa adicional) continuam. |
| 010 | Auditoria de colisões/órfãos, export sanitizado, volumetria de legado e quarentena. | Não se aplicam. O modelo lógico e a unique constraint de identidade de Asset continuam. |
| 012 | Itens 2 e 4: par `seconds`/`nanoseconds` como fonte canônica; extratores do Timestamp bruto. | Timestamps em **`timestamptz`**. A ordem total continua `effective_date`, `created_at`, ID, todos ascendentes, com o UUIDv7 como desempate. **A redução de nanossegundos para microssegundos é aceita.** `effective_date` continua `date`. |
| 018 | Item 5: backup/PITR como pré-condição de cutover. | Backup/PITR é condição **antes do primeiro dado real**. |
| 020 | Go/no-go de cutover, rehearsal e janela de migração. | Go-live sem carga de dados (seção 5). |
| 021 | “`assetId` é preservado na migração”. | Não se aplica. O `assetId` continua estável durante a vida do fato. |

## 2. Stack

| # | Decisão (ADR 005 do CrownPilot) | Em relação ao CrownPilot | Reserva Clara |
| --- | --- | --- | --- |
| 2.1 | Processo único, imagem OCI, Go `1.27.2`, `cmd/` + `internal/` | ajuste | Layout por capacidade com `internal/domain` compartilhado; dois comandos. |
| 2.2 | `net/http` + `ServeMux` | igual | Porta local `5081`; `PORT` em hosting. |
| 2.3 | OpenAPI spec-first JSON, `oapi-codegen`, `openapi-typescript` | ajuste | Freeze por slice com `x-reserva-clara-freeze: provisional`; decimais como string; `openapi-typescript` só candidato para a 017. |
| 2.4a | Firebase Admin Go, três variáveis de ambiente | igual | Os nomes já existem em `.env.example`. |
| 2.4b | Revogação seletiva por rota | ajuste | Lista inicial: excluir Asset, exclusão de conta, ações de incidente. |
| 2.4c | Clock skew do SDK | igual | 300 s fixos do SDK aceitos. |
| 2.5 | `pgx` + `sqlc` | igual | Decimais `text` → `string`; UUIDv7 gerado no Go; `timestamptz`. |
| 2.6 | `goose` forward-only com expand/contract | igual | Somente SQL; nenhum fato patrimonial em migration. |
| 2.7a | Session pooler do Supabase | igual | — |
| 2.7b | Render + Supabase na Virgínia | igual | Render na Virgínia e Supabase em `us-east-1`. |
| 2.7c | RLS só via SQL de segurança e teste de catálogo | igual | Adotada agora. |
| 2.8 | `depguard` (+ `go list` para lacunas) | ajuste | Regras do Reserva Clara + `forbidigo` contra ponto flutuante no Domain. |
| — | Porta `5080`/`5089`, `openapi-check.mjs`, `DELETE /api/v1/me`, `provider_unavailable` do Clash Royale, `auth_time` da spec 002 | n/a | Artefatos do CrownPilot. |

### 2.1 Processo, toolchain e layout

Um módulo Go, toolchain `1.27.2`, imagem OCI e dois binários. O layout é por
capacidade, com domínio compartilhado:

```text
cmd/reserva-clara-api/        composição e lifecycle da API
cmd/reserva-clara-migrate/    job goose (schema); nunca no startup
internal/domain/              value objects compartilhados: Decimal, Money,
                              CivilDate, IDs, erros
internal/portfolio/           casos de uso + ports da capacidade
internal/asset/
internal/ledger/              Transaction, reducer, idempotência
internal/valuation/           positions, allocation, dashboards (derivados)
internal/quote/               casos de uso de Quote + port do provider
internal/httpapi/             handlers, middleware, DTOs, Problem Details
internal/platform/postgres/   pgx, sqlc, transação, SET LOCAL
internal/platform/firebase/   adapter Firebase Admin Go (somente Auth)
internal/platform/brapi/      adapter BRAPI
internal/observability/       slog, request ID, métricas, redaction
api/openapi/                  fonte OpenAPI + pacote de embed
database/migrations/          SQL goose
database/security/            roles, grants, RLS e policies
```

Correspondência com a ADR 008:

- `internal/domain` corresponde ao Domain e importa somente stdlib;
- cada capacidade corresponde ao Application dela e define seus ports;
- `httpapi` corresponde à API, e `platform/*` corresponde à Infrastructure;
- os adapters concretos são montados somente em `cmd/*`.

A API e o job goose podem ser a mesma imagem com entrypoints diferentes. O
startup é fail-closed.

### 2.2 Roteamento HTTP

`net/http` + `ServeMux`, padrões de método e path do Go 1.22+ e middlewares como
funções sobre `http.Handler`. `chi` fica como alternativa avaliada. A porta
local canônica é **`5081`**; em hosting, vale `PORT`.

### 2.3 OpenAPI

Spec-first, fonte única `api/openapi/v1.json`, `oapi-codegen` para Go,
artefatos gerados versionados, CI falhando em drift e `/openapi/v1.json` servido
por `go:embed` a partir da fonte inalterada.

1. **Freeze por slice (ADR 016):** uma capacidade ainda não congelada é marcada
   com `x-reserva-clara-freeze: provisional`. A checagem N/N-1 do CI ignora
   operações com essa marca. O freeze remove a marca.
2. **Decimais:** `type: string` com `pattern` canônico; `type: number` é
   proibido. O DTO gerado é `string`, e a conversão para o value object acontece
   no handler ou no caso de uso.
3. **IDs:** `type: string`, `format: uuid`.
4. **Cliente TypeScript:** `openapi-typescript` é apenas candidato. A decisão é
   da 017.
5. **Problem Details:** códigos da ADR 016, mais `authentication_unavailable`
   (`503`).
6. **`/docs`:** Swagger UI somente em Local e Staging, consumindo
   `/openapi/v1.json`. Fica desabilitado em Preview e Production.

### 2.4 Identidade Firebase

**2.4a Credenciais.** Firebase Admin Go SDK com credencial em memória a partir
de `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL` e
`FIREBASE_ADMIN_PRIVATE_KEY`, via
`option.WithAuthCredentialsJSON(option.ServiceAccount, …)`. Também valem a
conversão de `\n`, a validação tudo-ou-nada antes do listener (fora de Local),
a ausência de arquivo JSON e a redaction. Depois do descomissionamento do
Firestore, a service account do runtime fica só com a permissão de ler usuários
do Firebase Auth, necessária para a checagem de revogação.

**2.4b Revogação.** `VerifyIDToken` é o padrão em todas as rotas autenticadas.
`VerifyIDTokenAndCheckRevoked` é aplicado por wrapper declarado na composição da
rota, **somente em ações destrutivas e de conta**:

- excluir Asset;
- futura exclusão de conta;
- ações de incidente.

Criar Transaction, todas as operações de Portfolio e as demais operações de
Asset (criar, retirar do catálogo, reativar) usam `VerifyIDToken`. Uma rota nova
só entra na lista por decisão registrada. Token revogado ou usuário desabilitado
→ `401` indistinguível. Firebase indisponível durante a checagem → `503`
`authentication_unavailable`, sem detalhe do provider.

Isto substitui a exigência da ADR 013 de checar revogação em todo write
financeiro. Motivo: o app registra patrimônio, mas não movimenta dinheiro, e
checar revogação em todo write acoplaria a disponibilidade dos writes ao
Firebase.

**2.4c Clock skew.** Vale a tolerância fixa de 300 s do SDK Go (`v4.22.0`,
`auth/token_verifier.go`, `clockSkewSeconds = 300`) sobre `exp` e `iat`. Isto
substitui a janela de 60 s e o teste de fronteira de 60 s da ADR 013. Motivo:
evitar código próprio de validação de token. Com tokens de 1 hora, a diferença
é um risco marginal aceito. As demais validações da ADR 013 (assinatura `RS256`,
issuer, audience, `sub`, projeto exato) são feitas pelo SDK.

**2.4d JwtBearer.** Não se aplica: `VerifyIDToken` já verifica a assinatura
localmente com certificados em cache. Com o Emulator, o SDK não exige `RS256`,
o que só é permitido em Local.

### 2.5 Persistência: `pgx` + `sqlc`

- **Decimais:** colunas `text` → `string`/`pgtype.Text` (seção 3).
- **IDs:** colunas `uuid` com UUIDv7 **gerado no Go**. A plataforma Supabase usa
  PostgreSQL 17 como padrão e não há anúncio oficial de PostgreSQL 18 para
  projetos hospedados. `uuidv7()` nativo só existe a partir do PostgreSQL 18.
  O PostgreSQL local do Docker Compose usa a mesma major do projeto Supabase.
- **Tempo:** `timestamptz` com resolução de microssegundos. O valor é reduzido a
  microssegundos antes de persistir, para que memória e banco coincidam. A
  comparação de payload da idempotência usa só a forma persistida.
- **Ordem do ledger:** `ORDER BY effective_date, created_at, transaction_id`.
  A comparação de `uuid` no PostgreSQL é determinística.
- **Concorrência (ADR 014):** o lock `SELECT … FOR UPDATE` da Portfolio e o
  `INSERT … ON CONFLICT DO NOTHING` + comparação de payload canônico ficam
  explícitos em SQL.
- **Contexto RLS:** `SELECT set_config('app.current_owner', $1, true)`
  parametrizado dentro da transação.
- Mocks de `pgx`/`sqlmock` não são evidência de banco.

### 2.6 Migrations: `goose`

Job separado e somente migrations SQL (sem migrations Go). As migrations são
forward-only em Preview/Staging/Production e `down` existe só em Local.
Mudanças destrutivas usam expand/contract em releases separadas, e cada
migration precisa ser compatível com a versão anterior da aplicação. Rollback de
dados é feito por backup/restore. Nenhuma migration insere, altera ou apaga
fatos patrimoniais. Seeds são só sintéticos e nunca rodam em produção. A tabela
de versão do goose fica no schema privado.

### 2.7 Supabase, região e RLS

**2.7a Session pooler.** Session pooler no Supabase dev e em todos os ambientes
hospedados. Conexão direta só no PostgreSQL local do Docker Compose. O
transaction pooler fica fora do corte. O `pgxpool` precisa caber no limite do
plano.

**2.7b Hosting e região.** API no **Render, região Virgínia**, e PostgreSQL no
**Supabase, `us-east-1`**. Isto antecipa a ADR 020 apenas no fornecedor e na
região da API e do banco. Antes do primeiro dado real:

- a transferência internacional de dados patrimoniais precisa constar na
  política de privacidade;
- backup/PITR precisa estar ativo e com restore provado, e o custo de PITR no
  plano Supabase precisa estar confirmado.

**2.7c RLS.** Adotada agora, no modelo do CrownPilot:

- `database/security/` é a única fonte de `ENABLE ROW LEVEL SECURITY` e de
  policies;
- o auto-RLS do Supabase fica desligado;
- um teste de catálogo (`pg_class.relrowsecurity`) falha se qualquer tabela do
  schema patrimonial estiver sem RLS. Ele roda no CI contra PostgreSQL local e é
  gate antes de Staging;
- toda request autenticada, inclusive leitura, abre transação para o
  `SET LOCAL`;
- o papel de runtime não tem `BYPASSRLS`, ownership de tabela nem DDL.

A RLS é defesa adicional e não substitui `CurrentOwner`, queries owner-scoped
nem FKs compostas (ADR 009).

### 2.8 Regras de dependência

`depguard` é a regra principal:

- `internal/domain` → somente stdlib;
- capacidades → `internal/domain` e capacidades na direção permitida
  (`valuation` → `ledger` → `asset`/`portfolio`), sem `platform/*`;
- `httpapi` → capacidades, nunca `platform/postgres` diretamente.

`forbidigo` proíbe `float32`/`float64`, `strconv.ParseFloat`, `math/big.Float`
e `json.Number` em `internal/domain` e `internal/ledger`. `go list` só onde
`depguard` não alcança.

### 2.9 Testes

`go test`, `golangci-lint`, PostgreSQL real local via Docker Compose e fuzzing
nativo (`testing.F`) para a gramática decimal. O papel do reducer TS está na
seção 3.4.

## 3. Precisão decimal (trechos .NET da ADR 011)

### 3.1 Representação

- **Domain:** value object próprio sobre `math/big`. `big.Int` em escala fixa
  para soma, subtração e comparação; `big.Rat` para divisão, custo médio e
  alocação. A materialização em 18 casas arredonda metade para longe do zero e
  normaliza `-0` para `0`.
- **PostgreSQL:** `text` + `CHECK` autoritativo, mapeado como `string` no
  `sqlc`. `numeric(48,18)` não é representação autoritativa.
- **HTTP:** string canônica no JSON; JSON number em campo decimal → `400`.
- **Parsing:** a gramática canônica é validada antes de qualquer `SetString`,
  sempre em base 10.

### 3.2 Condição de aceite

A representação só é aceita depois que o experimento do
[anexo 022-A](anexos/adr-022-a-experimento-decimal.md) passar sem divergência,
como exige a ADR 011. Até lá, nenhuma coluna muda para `numeric` e nenhum
conversor é tratado como lossless.

### 3.3 Onde o frontend calcula hoje

O cálculo vive em `src/domain/*`, mas é executado no browser:

| Onde | O que calcula |
| --- | --- |
| `src/data/positions/portfolio-projection.ts` | `reducePositions` (quantidade, custo médio em racionais), market position e `calculateAllocation` |
| `src/data/positions/dashboard-read.ts` | divisão de racionais e `materializeDecimalRational` para percentuais do dashboard global |
| `src/data/positions/portfolio-read.ts` | composição de posições com Quotes por Portfolio |
| `src/data/firestore/transaction-repository.ts` | `reduceTransactionQuantity` (saldo de `SELL` antes do write) e `sortTransactions` |
| `src/components/transaction/transaction-ledger.tsx` | `sortTransactions` |
| `src/components/transaction/transaction-form.tsx` | `parseTransactionInput`: gramática, limites e sinais de decimal |
| `src/components/financial/financial-format.ts` | formatação de strings decimais para exibição, sem aritmética |

### 3.4 Golden master: backend como única autoridade de cálculo

O backend Go é a única autoridade de cálculo. Posições, custo médio, alocação,
percentuais, ordenação do ledger e checagem de saldo chegam prontos pela API.

- **Durante o port:** o reducer TS atual é o oráculo. As fixtures (entrada e
  saída esperada) são geradas a partir dele e congeladas no repositório. O Go é
  testado contra essas fixtures, sem tolerância numérica.
- **Depois:** o reducer TS e os read models do browser são removidos junto com o
  legado.
- **O frontend mantém só:**
  - o **parser de input**, para validar a gramática do decimal por UX, com um
    contrato de fixtures **permanente e restrito ao parser** (o mesmo conjunto
    valida o parser TS e o parser Go);
  - o **formatter de exibição**, sem aritmética.

## 4. Substituição integral da ADR 019

| ADR 019 | Passa a valer |
| --- | --- |
| Extract/validate/transform/stage/load/reconcile | Não há migração de dados. O PostgreSQL começa vazio, só com o schema do goose. |
| Firestore autoridade até C10; PostgreSQL cópia não autoritativa | O PostgreSQL é autoridade patrimonial desde o primeiro write no backend Go. O Firestore nunca é fonte para o PostgreSQL. |
| Quarentena, colisões, digest, reconciliação por owner | Não se aplicam. A reconciliação por request (idempotência e resultado desconhecido) das slices da 012 continua. |
| Cutover global, write fence, C9 read-only, C10 PONR | Go-live sem carga de dados (seção 5). Rollback de aplicação = imagem Go anterior compatível com o schema (expand/contract) ou restore. |
| Retenção do legado antes de C11 | Não se aplica. Os dados de teste são descartados. |

**Descomissionamento do Firestore:**

1. Até a primeira slice em Go entrar em uso, o Firestore segue disponível para
   os testes da fase 012, sem usuário real.
2. Quando a primeira slice em Go estiver em uso (provavelmente Portfolio), as
   escritas no Firestore são desligadas (Rules `deny` em escrita).
3. O banco Firestore é removido do projeto Firebase, junto com `firestore.rules`
   e a configuração de emulator de Firestore no repositório.
4. O projeto Firebase permanece somente para Authentication, e a service account
   do runtime fica sem permissões de Firestore.

## 5. Gates das fases 011 e 012

Os gates continuam definidos na spec 011 e na matriz da 012. Esta tabela
registra o que muda.

| Gate | O que deixa de ser necessário | O que permanece |
| --- | --- | --- |
| C0 — risco contido | Aceitação temporária, análise de risco sobre dado existente e qualquer contenção ou bridge no legado. | Nenhum dado real entra no Firestore; o legado não recebe usuário real; o backend Go não replica a fragilidade do `SELL`. Saída: escritas no Firestore desligadas (seção 4). |
| C1 — discovery | — | Aceito (histórico). |
| C4 — compatibilidade | Compatibilidade de IDs legados e de Timestamp Firestore. | Fixtures congeladas do reducer TS para decimal, data civil, ordem, erros e reducer; contrato de fixtures do parser. |
| C5 — Portfolio | Dry-run e reconciliação de migração de Portfolio. | Jornada, owner A/B, archive, a11y, E2E. |
| C7 — paridade | — | BRAPI, posições, dashboards, UX, a11y, performance. |
| C8 — rehearsal | O gate inteiro como rehearsal de migração. | Backup/restore provado como condição do go-live. |
| C9 — read-only | O gate inteiro. | Smoke de auth/owner/fluxos no ambiente final antes de usuários. |
| C10 — PONR | O PONR de dados e a proibição de reabrir o Firestore. | Registro do go-live; o PostgreSQL é autoridade única. |
| C11 — retirement | Retenção e arquivamento do Firestore. | Remover Next/Firestore do código, apagar o banco Firestore, revogar credenciais, scans e soak. |
| 012 (matriz, C0 ativo) | — | As restrições da 012 (sem dado real, sem write fora do escopo) continuam. |

C2, C3 e C6 não dependiam de dados reais e não mudam.

## 6. Pendências

Itens que ainda dependem de ação ou de definição. Nenhum reabre as decisões
acima.

1. **Condição de aceite da ADR:** conclusão da task 002-15 do CrownPilot.
2. **Condição de aceite da representação decimal:** execução do anexo 022-A, na
   015/016.
3. **Antes do primeiro dado real:** custo de PITR confirmado no plano Supabase;
   restore provado; política de privacidade com a transferência internacional.
4. **Papel IAM exato** da service account do runtime (leitura de usuários do
   Firebase Auth) — a confirmar na 014.
5. **Origem do `created_at`:** gerado no Go (coerente com o UUIDv7 gerado no Go)
   ou `now()` do PostgreSQL — a definir na 016.
6. **Versão do PostgreSQL do projeto Supabase:** confirmar a major no projeto
   criado e alinhar o Docker Compose. Uma migração futura para `uuidv7()` nativo
   no PostgreSQL 18 exigiria decisão registrada.
7. **Cliente TS:** decisão na 017 (`openapi-typescript` é candidato).
8. **Sincronização** da spec 011, do roadmap e de `docs/architecture/011/`: uma
   única task, criada depois do aceite desta ADR.

## Alternativas rejeitadas

| Alternativa | Motivo |
| --- | --- |
| Frontend e backend calculando, com golden master TS↔Go permanente | Toda regra seria mantida duas vezes, e a UI poderia mostrar um número que a API não confirma. Contraria o critério “cálculos não vivem em componentes” da fase 019. |
| Janela de 60 s no adapter sobre o SDK | Exigiria validação de token própria; o ganho é marginal com tokens de 1 hora. |
| Revogação em todo write financeiro | Acoplaria a disponibilidade dos writes ao Firebase; o app não movimenta dinheiro. |
| Layout literal por camada (`internal/application`, `internal/infrastructure`) | Concentraria todas as capacidades num pacote grande e foge do idioma Go; as regras da ADR 008 são preservadas pelo `depguard`. |
| `uuidv7()` nativo do PostgreSQL | Requer PostgreSQL 18, sem anúncio oficial na plataforma Supabase. |
| Par `seconds`/`nanoseconds` | Existia para preservar o Timestamp do Firestore, que não será migrado. |
| `shopspring/decimal` no Domain | `Div` arredonda para `DivisionPrecision` global (16 por padrão). |
| Inteiros em unidade mínima | 48 dígitos não cabem em `int64` nem em 128 bits. |
| `float64`, `big.Float` | Binário/arredondamento implícito. |
| `cockroachdb/apd` | Viável, mas não representa racional exato e adiciona dependência. |
| `numeric(48,18)` autoritativo | Arredonda silenciosamente além de 18 casas e não devolve a forma canônica. |
| Fornecedor de hosting aberto até a 020 | Antecipado para alinhar com o CrownPilot. |

## Consequências

### Positivas

- mesma stack, hosting e região do CrownPilot;
- sem migrador, staging, digest, rehearsal, write fence nem janela de cutover;
- o PostgreSQL nasce como autoridade única, sem PONR de dados;
- uma única implementação de cálculo financeiro (Go), com fixtures congeladas do
  comportamento atual;
- `math/big` espelha o modelo exato do TS;
- forward-only + expand/contract dá base ao N/N-1 e ao rollback de aplicação.

### Negativas

- perde-se DI, OpenAPI e migrations integrados do .NET;
- o value object decimal, o parser e o formatter são código próprio, e o parser
  existe em TS e em Go com contrato de fixtures permanente;
- preview e cálculo offline de posições exigem ida ao servidor;
- **decimais em `text` impedem ordenar, filtrar e agregar por valor no SQL**
  (`ORDER BY`, `WHERE quantity > …`, `SUM`) sem uma coluna gerada (`numeric`)
  ou cast explícito. A ordem lexicográfica do texto não é a numérica (`"10"` <
  `"9"`). Qualquer necessidade dessas exige coluna gerada com índice próprio e
  prova de que ela não é usada como valor autoritativo;
- timestamps passam a ter resolução de microssegundos;
- UUIDv7 expõe o instante aproximado de criação do recurso no próprio ID;
- tokens com até 300 s além do `exp` são aceitos;
- um token revogado continua aceito em writes não destrutivos até expirar
  (no máximo 1 hora + 300 s);
- RLS exige transação também nas leituras;
- dados patrimoniais ficam fora do Brasil;
- ao desligar as escritas do Firestore na primeira slice Go, as telas legadas
  das capacidades ainda não portadas deixam de aceitar writes;
- os dados de teste do Firestore são descartados;
- spec, roadmap e documentos da 011 ficam desatualizados até a task de
  sincronização.

## Riscos

| Risco | Mitigação |
| --- | --- |
| `-0` ou arredondamento divergente do TS | formatter próprio e casos do anexo 022-A |
| Decimal como `number` no OpenAPI | `pattern` obrigatório e `forbidigo` no Domain |
| Parser TS e Go divergirem | contrato de fixtures permanente do parser no CI |
| Valor de `created_at` em memória diferente do persistido | redução a microssegundos antes de persistir; idempotência compara a forma persistida |
| Rota destrutiva nova sem revogação | lista declarada por rota, entrada só por decisão registrada, teste de composição |
| Tabela nova sem RLS | teste de catálogo no CI, gate antes de Staging |
| Usuário real entrar no legado antes do descomissionamento | C0 revisado; escritas desligadas na primeira slice Go |
| `numeric` arredondar silenciosamente | `text` + `CHECK` autoritativo; `numeric` só como coluna gerada |
| Transferência internacional sem aviso | política de privacidade antes do primeiro dado real |
| PITR indisponível ou caro no plano | confirmação de custo e restore provado antes do primeiro dado real |

## Referências

- [ADR 007](007-topologia-alvo-e-autoridade-dos-dados.md),
  [008](008-limites-de-camadas-e-dependencias.md),
  [009](009-ids-ownership-e-tenancy.md),
  [010](010-modelo-relacional-e-registros-firestore.md),
  [011](011-precisao-decimal-e-representacao.md),
  [012](012-precisao-temporal-e-ordenacao.md),
  [013](013-identidade-autorizacao-revogacao-e-cors.md),
  [018](018-supabase-postgresql-roles-pooling-e-backups.md),
  [019](019-migracao-write-fence-reconciliacao-e-retencao.md),
  [020](020-hosting-ambientes-observabilidade-e-cicd.md),
  [021](021-lifecycle-de-asset-referenciado.md)
- [Anexo 022-A — experimento decimal](anexos/adr-022-a-experimento-decimal.md)
- [Modelo relacional 011](../architecture/011/relational-model.md)
- [Identidade e segurança 011](../architecture/011/identity-security.md)
- [Qualidade e cutover 011](../architecture/011/quality-environments-cutover.md)
- [Matriz de decisões 012](../architecture/012/decision-matrix.md)
- ADR 005 do CrownPilot (repositório `crownpilot-app`)
- Supabase, padrão PostgreSQL 17 na plataforma:
  <https://supabase.com/changelog/46080-self-hosted-supabase-upgrading-from-pg-15-to-17-breaking-change>;
  discussão sobre PostgreSQL 18: <https://github.com/orgs/supabase/discussions/42681>
