# ADR 018 — Supabase PostgreSQL, schema, roles, pooling e backups

- **Status:** `proposed`
- **Ticker relacionado:** `011`
- **Decisão:** 12 de 15 da spec 011

## Contexto

Supabase é o PostgreSQL gerenciado escolhido, mas suas APIs Data API/Auth não
fazem parte do alvo. Migrations, runtime, pooling e backup têm riscos diferentes
e não podem compartilhar permissões por conveniência.

## Decisão proposta

1. Schema patrimonial é privado e acessível somente pela API e migration job;
   browser nunca recebe anon key, connection string ou credencial.
2. Runtime usa papel mínimo sem DDL/migration e sem UPDATE/DELETE de Transaction;
   migration usa papel separado. Seeds são sintéticos e nunca automáticos em
   produção.
3. Migrations são revisadas, forward-only quando necessário e executadas por job
   controlado, nunca no startup.
4. Pooling, locks e `SET LOCAL`/RLS, se adotada, serão provados com PostgreSQL
   real e conexões compatíveis; RLS não substitui CurrentOwner.
5. Backup/PITR e restore são pré-condição operacional para cutover.

## Evidência e alternativas

O [modelo EF/Supabase](../architecture/011/relational-model.md#ef-core-npgsql-schema-e-ambientes)
e a estratégia de [migração e permissões](../architecture/011/data-migration-strategy.md#componentes-e-permissões)
definem a separação. Supabase Auth/Data API, schema público e migration no
startup foram rejeitados.

## Consequências e revisão

Há operação adicional de roles, jobs e restore. A proposta será revisada na
016 com Npgsql/PostgreSQL real e na 020 com backup, pooling, RLS (se adotada) e
restore reproduzível.

## Referências

- [ADR 009 — tenancy](009-ids-ownership-e-tenancy.md)
- [Qualidade e cutover 011](../architecture/011/quality-environments-cutover.md#5-postgresql-migrations-e-restore)
