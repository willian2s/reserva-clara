# 011-04 — Modelar PostgreSQL e estratégia de migração

- **Ticker:** `011`
- **Número:** `04`
- **Status:** `completed`

## Objetivo e resultado esperado

Produzir o modelo relacional lógico, matriz Firestore→PostgreSQL e desenho do
migrador/reconciliador. O resultado deve preservar fatos, IDs, ownership,
precisão e ordem sem copiar artefatos Firestore por inércia.

## Requisitos cobertos

- Entidades, tabelas, chaves, FKs, constraints, índices e tipos.
- EF Core/Npgsql e migrations controladas.
- Dados existentes, seed/test data e ambientes local/test/prod.
- Estratégia sem dual-write, com staging, rehearsal, freeze e reconciliação.
- Supabase como PostgreSQL gerenciado, sem dependência de Auth/Data API.

## Escopo

### Incluído

- ERD para owner, Portfolio, Asset e Transaction.
- Decisões candidatas para decimal e timestamps lossless.
- Substituição de `assetIdentities` e `assetUsages`.
- Queries críticas e índices iniciais.
- Pipeline extract/validate/transform/stage/load/reconcile.
- Política de inválidos, rollback e point of no return.

### Excluído

- Criar banco, migration EF, DDL ou conexão Supabase.
- Copiar dados reais.
- Modelar features futuras como Goals/Snapshots sem requisito atual.

## Dependências

- 011-02 e 011-03.

## Arquivos e símbolos prováveis

- Leitura: Firestore paths/repositories/parsers/converters/Rules, domain VOs,
  reducers e fixtures.
- Saídas prováveis: `docs/architecture/011/relational-model.md`, ERD e
  `docs/architecture/011/data-migration-strategy.md`.

## Passos de implementação

1. Criar matriz documento/campo → tabela/coluna/constraint.
2. Decidir chaves owner-scoped preservando IDs opacos.
3. Modelar unicidade de Asset e restrições de lifecycle/referência.
4. Modelar append-only, idempotência e ordenação de Transaction.
5. Avaliar numeric/texto canônico e tipo C# com fixtures de limite.
6. Resolver preservação de segundos/nanos e `effectiveDate` civil.
7. Derivar índices das queries, sem indexar especulativamente.
8. Desenhar roles/schema privado, pooling e migrations separadas do startup.
9. Desenhar migração repetível, quarentena e reconciliação por owner.
10. Definir rollback antes/depois do primeiro write PostgreSQL.

## Testes e comandos de validação

- Exemplos sintéticos para legado sem `archivedAt`/`fee`.
- Casos de limite decimal e timestamps com mesmo microssegundo.
- Revisão de todas as FKs e unique constraints contra invariantes.
- Tabletop de import repetido, falha parcial, quarentena e restore.
- Plano de testes com PostgreSQL real, não EF InMemory/SQLite.
- `git diff --check`.

## Definição de pronto

- ERD e matriz cobrem todo o modelo atual.
- IDs, ownership, decimal, timestamps, append-only e índices têm decisão ou
  experimento explícito antes da implementação.
- O migrador é repetível e não exige dual-write.
- O point of no return e limites de rollback estão claros.
- Supabase é tratado como PostgreSQL privado.

## Riscos e cuidados

- `System.Decimal` pode não cobrir 30+18 dígitos.
- `timestamptz` isolado pode perder nanossegundos.
- Não expor schema patrimonial à anon key/Data API.
- Não corrigir ledger inválido silenciosamente durante transformação.

## Registro da execução

### Status

`completed`

### Arquivos alterados

- `docs/architecture/011/relational-model.md` — ERD lógico, tabelas, matriz
  Firestore→PostgreSQL, tipos, constraints, FKs, índices e decisões de precisão.
- `docs/architecture/011/data-migration-strategy.md` — pipeline repetível,
  staging, quarentena, reconciliação, rehearsal, freeze, cutover e rollback.
- `docs/tasks/011-revisao-roadmap-evolucao-arquitetural/011-04-modelar-postgresql-e-migracao.md` —
  registro de status, decisões, evidências e riscos.
- `docs/tasks/011-revisao-roadmap-evolucao-arquitetural/011-00-overview.md` —
  checklist e progresso da fase.
- Nenhum banco, migration EF, DDL, conexão Supabase, export real, dado real ou
  arquivo de produção foi criado/alterado.

### Decisões e desvios

- O owner é representado pelo Firebase UID opaco em tabela própria; Portfolio,
  Asset e Transaction preservam IDs Firestore como texto e usam FKs compostas
  owner-scoped.
- `assetIdentities` foi substituído por unique constraint em Asset e
  `assetUsages` por referência real via Transaction + `ON DELETE RESTRICT`; os
  artefatos continuam apenas como evidência de auditoria da migração.
- A representação canônica escolhida para decimal é `text`, com gramática,
  limites e checks explícitos, porque o contrato de 30+18 dígitos não cabe com
  segurança em `System.Decimal`. `numeric(48,18)` ficou como alternativa a
  provar, não como decisão implícita.
- Timestamps usam pares `seconds`/`nanoseconds`; `effectiveDate` permanece
  `date`. `timestamptz` isolado e conversão por `Date` não são considerados
  lossless.
- Transaction é append-only por permissões do papel runtime, FKs restritivas e
  fatos compensatórios; idempotência exige ID estável ou idempotency key.
- Os índices foram derivados das consultas atuais de lifecycle, identidade,
  referências e ordem do ledger. Position e demais read models não foram
  persistidos.
- O pipeline não implementa importação: extract/validate/transform/stage/load/
  reconcile, quarentena e point of no return foram desenhados para 016/020.
  A ausência de PostgreSQL real e export autorizado impede declarar os
  experimentos de Npgsql, nanos, locks, restore e volumetria como executados.
- Desvio controlado: a saída foi criada em `docs/architecture/011/**`, conforme
  os arquivos prováveis da subtarefa, sem alterar a spec ou iniciar a stack alvo.

### Comandos executados

- `git diff --check` — passou.
- `git diff --no-index --check /dev/null docs/architecture/011/*.md` — passou
  para os dois artefatos novos (sem whitespace error).
- `npm run test:domain` — passou, 14 testes.
- `npm run test:positions` — passou, 4 testes.
- `npm run test:positions-read` — passou, 9 testes.
- `npm run test:dashboard-read` — passou, 8 testes.
- `npm run test:financial-presentation` — passou, 6 testes.
- `npm run test:quotes-adapter` — passou, 7 testes.
- `npm run test:quotes-service` — passou, 8 testes.
- `npm run test:quotes-route` — passou, 8 testes.
- `npm run test:rules` — passou, 19 testes no Firestore Emulator; mensagens
  `PERMISSION_DENIED` são os casos negativos esperados.
- `npm run lint` — passou.
- `npm exec next typegen && npx tsc --noEmit` — passou; typegen e typecheck sem
  erros.
- `npm run build` — passou; Next.js 16.3.5 compilou as rotas atuais.
- Exploração read-only dos paths, parsers, converters, repositories, reducers,
  Rules, fixtures e subtarefas dependentes — confirmou campos, ownership,
  precisão, ordem, legado e lacunas sem abrir segredo ou dado real.

### Resultados e evidências

- O ERD cobre Owner, Portfolio, Asset e Transaction, incluindo FKs compostas
  que impedem referência cross-owner.
- A matriz cobre campos atuais, defaults legados sem `archivedAt`/`fee`,
  registries Firestore e a substituição por constraints/FKs.
- A ordenação `effective_date`, seconds, nanos e ID está explícita, assim como
  os casos de limite decimal e temporal que devem ser provados em PostgreSQL.
- O migrador é reexecutável por batch, não faz dual-write, bloqueia conflitos,
  preserva inválidos em quarentena e reconcilia IDs, FKs, hashes, ledger e
  derivados por owner.
- O rollback antes do primeiro write PostgreSQL e o limite irreversível após
  esse write estão separados e não prometem reabrir Firestore.
- Supabase foi tratado como PostgreSQL privado acessado somente pela API/job;
  anon key, Data API e Auth não fazem parte do modelo.
- A validação técnica do workspace permaneceu verde; como a alteração é
  documental, os testes comprovam ausência de regressão no baseline atual, não
  a futura implementação PostgreSQL.

### Riscos residuais

- Ainda não há export sanitizado/volumetria: colisões de identity, órfãos,
  `SELL` inválido, ausência de usage, tamanho de ledger e seletividade dos
  índices precisam de auditoria antes de 016/020.
- O mapeamento `text` ↔ PostgreSQL/Npgsql e os checks decimais precisam do
  experimento com PostgreSQL real; não aceitar `System.Decimal` por conveniência.
- A preservação de nanos de Portfolio/Asset depende de extrair Timestamp bruto;
  caminhos que já materializaram `Date` devem ser identificados ou quarentenados.
- Append-only, idempotência, concorrência de `SELL`, pooling, RLS se adotada,
  backup/restore e permissões ainda não foram implementados nem provados.
- C0 continua limitado à aceitação temporária em dev/testes com dados
  sintéticos; nenhum write real, staging/produção ou cutover é permitido antes
  do boundary confiável e dos gates definidos.

### Revisão independente

- A revisão `review` encontrou e foi incorporada antes do encerramento:
  - `UnitPrice` e `Fee` são objetos com moeda e decimal; o modelo passou a
    preservar `unit_price_currency`/`unit_price_decimal` e
    `fee_currency`/`fee_decimal`.
  - `archivedAt: null` e `fee: null` são estados válidos; a matriz e a política
    de quarentena agora distinguem `null` explícito de campo ausente.
  - o lifecycle concorrente foi explicitado: Application transacional bloqueia
    a Portfolio com `FOR UPDATE`, revalida archive e serializa archive/restore
    contra insert de Transaction, com trigger/check apenas como defesa opcional.
- A revisão subsequente não deixou findings pendentes; a inspeção documental e
  `git diff --check` foram repetidos após as correções. Os testes de código já
  haviam passado e não foram afetados por mudanças exclusivamente documentais.
