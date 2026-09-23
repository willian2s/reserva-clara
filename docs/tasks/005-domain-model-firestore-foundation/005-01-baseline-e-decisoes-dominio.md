# 005-01 — Baseline e decisões de domínio

- **Ticker:** `005`
- **Número:** `01`
- **Status:** `completed`

## Objetivo

Consolidar baseline da `main`, limites da fase, hierarquia Firestore, ownership,
fonte da verdade e decisões de precisão antes de qualquer código.

## Resultado esperado

Spec revisada contra o checkout atual, decisões duráveis registradas na spec e
lista de bloqueios/checkpoints pronta para execução.

## Requisitos cobertos

- R1–R6, R10 e R12 da spec;
- classificação de User/Profile, Portfolio, Asset, Transaction, allocation,
  Snapshot, Goal e Emergency Reserve;
- diferença DashboardGate/Rules e ausência de PII de Auth.

## Escopo incluído

- confirmar `main`, working tree, versão Firebase/Next e ausência de configuração
  Firestore;
- revisar docs 001–004 e referências Firebase oficiais atuais;
- fechar namespace `users/{uid}`, Portfolio mínimo, ledger futuro e value objects;
- confirmar que `users/{uid}` não vira documento em 005;
- registrar alternativas, riscos, região como checkpoint e ausência de índice
  composto.

## Escopo excluído

- alterar `src/`, Console, Rules, env, dependências ou produção;
- escolher região automaticamente;
- criar ADR separado para cada detalhe pequeno;
- definir schema completo de Transaction, Goal ou Emergency Reserve.

## Dependências

- `AGENTS.md`;
- `docs/specs/005-domain-model-firestore-foundation.md`;
- estado real da `main` e docs concluídas das fases anteriores.

## Arquivos e símbolos prováveis

- `docs/specs/005-domain-model-firestore-foundation.md`;
- `docs/tasks/005-domain-model-firestore-foundation/005-00-overview.md`;
- `src/lib/firebase/client.ts` e `AGENTS.md`, somente para inspeção;
- documentação oficial Firestore data model, Rules, locations e emulator.

## Passos de implementação futura

1. Capturar branch/HEAD/status sem registrar secrets.
2. Reconfirmar ausência de `firebase.json`, `.firebaserc`, Rules, indexes e
   acesso Firestore em `src/`.
3. Revisar contratos descritos na spec contra docs Firebase atuais.
4. Atualizar spec/overview se evidência concreta exigir ajuste.
5. Parar e marcar bloqueio se ownership, precisão ou fonte da verdade divergir
   de decisão já aprovada.

## Testes e comandos de validação

- `git status --short --branch`;
- inspeção de paths com Glob/Grep;
- `git diff --check` após documentação;
- nenhum comando externo que altere Firebase.

## Definição de pronto

- baseline factual atualizado;
- cada entidade tem classificação explícita;
- hierarchy, `users/{uid}`, money/quantity/percentage/date/IDs e source of truth
  estão sem ambiguidade;
- blockers de região/Console/contas de teste estão separados de decisões de
  código;
- overview continua com checklist/progresso coerentes.

## Riscos e cuidados

- Não transformar hashes históricos de docs 004 em baseline atual.
- Não registrar project ID, UID, env value ou conta de teste.
- Não antecipar regra por wildcard futuro.
- Se decisão estrutural mudar, revisar spec antes de 005-02.

## Execução e evidências

- **Data:** 2026-09-23.
- **Baseline confirmado:** branch `main`, tracking `origin/main`, HEAD
  `8cc5a5bc24e77f4cc5cace951a51aa1d6d5bd7da` (`docs(sdd): concluir deployment
  de produção`). O status inicial não tinha alterações tracked; os artefatos da
  fase 005 estavam presentes como arquivos não rastreados, sem registrar segredo.
  O histórico não contém commit anterior para os paths da fase 005; a tentativa
  anterior disponível era somente esse conjunto de documentos não rastreados.
- **Versões confirmadas:** Next.js `16.3.5`, React `19.2.8`, TypeScript `5`
  e Firebase Web `12.19.0`, conforme `package.json`.
- **Configuração ausente confirmada:** não existem `firebase.json`, `.firebaserc`,
  `firestore.rules`, `firestore.indexes.json` nem arquivos em
  `.opencode/rules/`.
- **Código confirmado sem Firestore:** `src/lib/firebase/client.ts` exporta o
  app singleton e `auth`; não há `getFirestore`, imports de Firestore, chamadas
  Firestore ou acesso a coleção/documento em `src/`. Não houve alteração em
  `src/`, `public/`, `package.json`, `package-lock.json` ou env.
- **Referências revisadas:** `AGENTS.md`, specs e overviews das fases 001–004,
  decisões `001`, `003` e `004`, além das tasks e contratos da fase 005. As
  referências oficiais Firebase/Firestore registradas na spec foram conferidas
  novamente: modelo hierárquico/subcoleções, tipos `Timestamp`, Rules por
  identidade/path e sem filtragem, Emulator Suite, regiões, índices compostos
  sob demanda e `FirestoreDataConverter` sem validação runtime suficiente.
- **Contratos confirmados na spec:** ownership em `users/{uid}` sem documento de
  perfil; `Portfolio` em `users/{uid}/portfolios/{portfolioId}` com contrato
  mínimo e base `BRL`; `Asset` e `Transaction` apenas como contratos futuros;
  transações como fonte da verdade; dinheiro em minor units, decimais canônicos,
  basis points, datas civis ISO e timestamps técnicos; IDs independentes de
  nome/ticker/array; `DashboardGate` somente UX; Rules como autorização real.
- **Validações executadas:** `git status --short --branch`, `git rev-parse
  HEAD`, `git log --oneline`, `git diff --stat`, `git diff --check`, Glob/Grep
  de configuração e acesso Firestore, e consulta das referências oficiais.
  Não foram executados gates de código (`npm run lint`, typegen, typecheck ou
  build), pois esta subtarefa altera somente documentação e não instala nem
  altera dependências.

## Arquivos alterados

- `docs/tasks/005-domain-model-firestore-foundation/005-01-baseline-e-decisoes-dominio.md`
- `docs/tasks/005-domain-model-firestore-foundation/005-00-overview.md`

Nenhuma decisão estrutural divergiu da spec; não houve refactor nem criação de
configuração real. A ausência de Firestore/configuração/Rules/indexes permanece
intencional e adequada ao escopo.

## Riscos residuais e bloqueios

- `005-02` a `005-07` continuam `pending` e não foram avançadas nesta execução.
- `005-08` permanece bloqueada até checkpoint humano sobre projeto, existência do
  database e região; nenhuma região foi inferida ou escolhida.
- `005-09` e `005-10` dependem, respectivamente, de Emulator/Rules aprovados,
  ativação humana e evidências separadas de publicação/smoke. Não há Rules,
  Emulator, banco real, coleção, documento ou deploy neste checkout.
- Antes de abrir entidades filhas, fases futuras ainda devem revisar semântica de
  delete/cascade de Portfolio e idempotência de Transaction.
