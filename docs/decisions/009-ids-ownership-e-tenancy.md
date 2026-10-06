# ADR 009 — IDs, ownership Firebase e tenancy no PostgreSQL

- **Status:** `proposed`
- **Ticker relacionado:** `011`
- **Decisão:** 3 de 15 da spec 011

## Contexto

Ownership hoje é derivado do namespace Firestore e do usuário autenticado. A
migração precisa preservar referências sem aceitar `ownerId` do cliente ou
permitir referências cross-owner.

## Decisão proposta

1. O `sub` do Firebase ID Token verificado é a única origem de `CurrentOwner`.
   Body, query, header, email e UID informado pelo cliente são ignorados ou
   rejeitados.
2. Firebase UID é uma chave opaca, imutável e única em `Owner`.
3. IDs atuais de Portfolio, Asset e Transaction permanecem texto opaco; não
   serão convertidos automaticamente para sequenciais ou UUIDs.
4. Chaves e FKs de recursos são compostas por owner e ID. Toda query de recurso
   usa os dois componentes.
5. RLS é defesa em profundidade candidata, nunca substituto de CurrentOwner,
   autorização, FKs ou permissões.

## Evidência e alternativas

O [modelo relacional](../architecture/011/relational-model.md#erd-lógico),
o [baseline de identidade](../architecture/011/identity-security.md#5-currentowner-tenancy-e-autorização)
e os testes de ownership existentes sustentam a preservação. Aceitar owner do
request ou usar ID global sem owner foi rejeitado por risco de isolamento.

## Consequências e revisão

As queries e contratos não podem receber tenancy como dado de negócio. A
validação de claims, testes A/B e eventual RLS serão provados na 014/016; até
essa evidência o estado permanece `proposed`.

## Referências

- [ADR 001 — autenticação Google](001-autenticacao-google-popup.md), preservada no cliente.
- [Identidade e segurança 011](../architecture/011/identity-security.md)
