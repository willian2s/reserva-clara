# 005-06 — Versionar Security Rules

- **Ticker:** `005`
- **Número:** `06`
- **Status:** `pending`

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
