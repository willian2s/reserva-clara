# 011-04 — Modelar PostgreSQL e estratégia de migração

- **Ticker:** `011`
- **Número:** `04`
- **Status:** `pending`

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
