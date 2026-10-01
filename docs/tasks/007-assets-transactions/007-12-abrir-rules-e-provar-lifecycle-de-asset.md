# 007-12 — Abrir Rules e provar lifecycle de Asset

- **Ticker:** `007`
- **Número:** `12`
- **Status:** `completed`

## Objetivo e resultado esperado

Permitir somente as transições atômicas aprovadas nas Firestore Rules e provar
ownership, registry, guard e concorrência no Emulator.

## Requisitos cobertos

- Spec 007, critérios 12, 12a–12c e 24–27.
- Isolamento owner-scoped, anônimo, cross-user e default deny.

## Escopo incluído

- Update de Asset somente com registry coerente e `createdAt` imutável.
- Delete conjunto de Asset e registry somente com guard ausente.
- Guard create-only e Transaction sem guard negada.
- Fixtures sintéticas para uso em Portfolio ativa/arquivada, colisão, corrida e
  tentativa de remover apenas um lado do par.

## Escopo excluído

- UI, deploy/Console, mudança de Transaction append-only ou cascade.

## Dependências

- `007-11` concluída.
- Auditoria/reconciliação legada definida e executável.

## Definição de pronto

- Tentativas isoladas, cross-user, registry órfão e guard removido falham.
- Edição válida e delete sem uso passam somente no conjunto atômico esperado.
- `npm run test:rules` cobre o novo contrato sem regressar os 13 casos atuais.

## Testes e comandos de validação

```bash
JAVA_HOME=$(/usr/libexec/java_home -v 21) npm run test:rules
npm run lint
npm exec next typegen
npx tsc --noEmit
git diff --check
```

## Riscos e cuidados

- Rules não devem ser tratadas como filtro nem como substituto da reconciliação.
- Falha ou cobertura inconclusiva mantém delete fechado.

## Execução

- **Status:** `completed`; Rules de update/delete atômicos de Asset, registry e
  `assetUsages` foram abertas com `getAfter()`, e Transaction nova agora exige
  guard existente ou criado no mesmo commit. O guard permanece create-only e a
  reconciliação legada existente em 007-11 pode criá-lo para um Asset existente;
  update/delete do guard continuam negados.
- **Arquivos alterados:** `firestore.rules`,
  `tests/firestore.rules.test.mjs`, este arquivo e
  `docs/tasks/007-assets-transactions/007-00-overview.md`.
- **Decisões e desvios:** a edição sem troca de identidade mantém o registry
  coerente; a edição com troca exige remoção do registry antigo, criação do novo
  e update do Asset no mesmo commit. Delete exige Asset e registry coerentes,
  ambos removidos no commit, e ausência do guard antes e depois. A criação do
  guard é permitida tanto no primeiro write de Transaction quanto em uma
  reconciliação legada owner-scoped, pois Rules não enumeram Transactions de
  outras subcoleções para provar retrospectivamente um vínculo. Não foi feito
  deploy, auditoria de dados produtivos ou alteração de UI.
- **Comandos executados:** `npm run test:rules`, `npm run test:domain`,
  `npm run lint`, `npm exec next typegen`, `npx tsc --noEmit`,
  `npm run build` e `git diff --check`.
- **Resultados e evidências:** 19 testes do Emulator passaram, incluindo os 13
  casos anteriores, update com preservação de ID/criação, colisão, registry
  inconsistente, delete de um lado, delete com uso em guard, guard
  create-only, Transaction sem guard, uso em Portfolio arquivada, corrida
  atômica e concorrência real entre delete e primeira Transaction, ownership
  cross-user e acesso anônimo. Os 7 testes de domínio, lint, typegen,
  TypeScript, build e diff check também passaram.
- **Riscos residuais:** nenhuma auditoria produtiva foi executada nesta sessão;
  o rollout continua dependente da reconciliação owner-scoped antes de expor a
  UI de delete. Um cliente autenticado pode criar um guard válido para um Asset
  existente fora de uma Transaction, comportamento mantido para suportar a
  reconciliação legada e que pode bloquear delete, nunca liberá-lo. O limite
  deliberado de Rules para não agregar o ledger permanece vigente.
