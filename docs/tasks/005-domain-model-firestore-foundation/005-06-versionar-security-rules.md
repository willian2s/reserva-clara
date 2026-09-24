# 005-06 — Versionar Security Rules

- **Ticker:** `005`
- **Número:** `06`
- **Status:** `completed`

## Objetivo

Criar Rules versionadas, default deny e owner-scoped para o único documento
implementado na fundação: Portfolio.

## Resultado esperado

`firestore.rules` permite somente usuário autenticado no próprio namespace,
valida schema mínimo e mantém root profile, paths futuros e wildcard desconhecido
fechados.

## Requisitos cobertos

- anônimo sem read/write;
- A lê/escreve próprio Portfolio válido;
- A não lê/escreve B;
- schema inválido rejeitado;
- DashboardGate não usado como autorização;
- default deny para Asset/Transaction/Snapshot futuros.

## Escopo incluído

- `rules_version = '2'` e serviço Firestore;
- helper de ownership comparando `request.auth.uid` ao `{userId}` do path;
- create/read/update/delete de Portfolio conforme contrato;
- `keys().hasOnly/hasAll`, tipos, tamanho de nome, BRL e Timestamp;
- `createdAt` imutável no update e `updatedAt` server-side;
- negação explícita do documento `users/{uid}` e paths não implementados;
- teste de query/listagem apenas no namespace owner.

## Escopo excluído

- regras de Transaction, Asset, allocation, Snapshot, Goal ou Reserve;
- wildcard autenticado que abra qualquer documento;
- deploy em Firebase Console;
- validações de domínio que Rules não conseguem provar com segurança;
- App Check, claims, roles ou compartilhamento.

## Dependências

- 005-02 contrato/invariantes;
- 005-04 tabela de parser/DTO;
- contrato de path desta spec;
- Emulator Suite de 005-07 para provar server timestamp.

## Arquivos e símbolos prováveis

- `firestore.rules`;
- tabela Portfolio em `docs/specs/005-domain-model-firestore-foundation.md`;
- futuro `firebase.json` como referência de Rules;
- testes de Rules da subtarefa 07.

## Passos de implementação futura

1. Escrever default deny antes de qualquer allow específico.
2. Adicionar match owner-scoped de Portfolio.
3. Validar fields permitidos, tipos e invariantes que Rules suportam.
4. Exigir server timestamps compatíveis com `request.time`.
5. Negar root user e subpaths futuros por ausência de allow explícito.
6. Revisar delete e registrar que não existe cascata de subcollection.
7. Rodar emulador e revisar diff antes de qualquer Console.

## Testes e comandos de validação

```bash
firebase emulators:exec --only firestore "node --test <rules-test-command>"
```

Casos obrigatórios: owner valid create/update/delete/read, A→B read/write,
cross-user. Substituir placeholder pelo script aprovado em 005-07.

## Definição de pronto

- Rules compilam no Emulator Suite;
- nenhum allow depende apenas de `request.auth != null`;
- ownership é path-based;
- schema aceito é o mesmo do converter/parser;
- caminhos desconhecidos continuam negados;
- não houve publicação real.

## Riscos e cuidados

- Rules não filtram resultados: queries devem ser naturalmente owner-scoped.
- Não usar `resource.data` em create onde não existe documento.
- Não relaxar Timestamp para permitir cliente forjar `createdAt`.
- Antes de 007, revisar exclusão e filhos para evitar órfãos.

## Execução e evidências

- **Data:** 2026-09-24.
- **Implementado:** `firestore.rules` com `rules_version = '2'`, default deny
  explícito, ownership por `request.auth.uid` e `{userId}`, acesso separado de
  `get/list` para Portfolio próprio e create/update/delete owner-scoped.
- **Schema:** Portfolio aceita somente `name`, `baseCurrency`, `createdAt` e
  `updatedAt`; exige string não vazia após trim, tamanho máximo de 100, `BRL` e
  Firestore `timestamp`. Campos extras, ausentes, tipos incorretos e moeda
  diferente são rejeitados.
- **Timestamps:** create exige `createdAt` e `updatedAt` iguais a
  `request.time`; update exige `createdAt` imutável e `updatedAt` server-side.
  Delete não usa `resource.data` e não promete cascata de subcoleções.
- **Paths fechados:** `users/{uid}`, Asset, Goal, Reserve, Transaction,
  allocationTargets, Snapshot e wildcard desconhecido permanecem negados. Não
  houve uso de `DashboardGate`, deploy ou alteração de produção.
- **Validação de Rules:** `firebase-tools@13.35.1 emulators:exec` com projeto
  demo temporário compilou as Rules e encerrou o Firestore Emulator com sucesso.
  Configuração temporária foi removida. A tentativa com `firebase-tools@latest`
  não iniciou porque o ambiente possui Java 17 e a versão atual exige Java 21;
  a validação aprovada usou a CLI compatível disponível.
- **Gates:** `npm run lint`; `npm exec next typegen`; `npx tsc --noEmit`;
  `npm run build`; `git diff --no-index --check /dev/null firestore.rules` —
  todos passaram, sem diagnóstico de whitespace.

## Arquivos alterados

- `firestore.rules`
- `docs/tasks/005-domain-model-firestore-foundation/005-00-overview.md`
- `docs/tasks/005-domain-model-firestore-foundation/005-06-versionar-security-rules.md`

## Decisões e desvios

- Default deny recursivo vem antes dos matches específicos; regras futuras só
  poderão abrir acesso com schema e ownership próprios.
- `get/list` exigem ownership do path, permitindo query somente no namespace do
  usuário autenticado. Nenhum allow depende apenas de autenticação.
- A expressão de `name` rejeita valor composto apenas por whitespace e permite
  whitespace interno, inclusive newline, mantendo compatibilidade com o parser
  que normaliza `trim()` antes de expor o domínio.
- Não foram criados `firebase.json`, testes comportamentais ou dependências;
  configuração e matriz owner/A/B/anônimo pertencem à subtarefa 005-07.

## Riscos residuais e bloqueios

- 005-07 ainda precisa provar no Emulator Suite owner create/read/update/delete,
  query/list, anônimo, cross-user, schema inválido, timestamps e paths futuros.
- CLI atual do Firebase exige Java 21, ausente no ambiente local; 005-07 deve
  confirmar versão de CLI/JDK aprovada para execução reproduzível.
- Delete de Portfolio continua sem cascata; antes de abrir filhos em 007,
  exclusão/arquivamento deve ser revisado.
