# 007-10 — Normalizar CRUD e guarda de referências

- **Ticker:** `007`
- **Número:** `10`
- **Status:** `completed`

## Objetivo e resultado esperado

Fechar o contrato da emenda de lifecycle de Asset antes de abrir novas writes:
edição preservando `assetId`, exclusão somente sem Transactions vinculadas e
guard monotônico `assetUsages/{assetId}` para impedir corrida entre uso e
exclusão. Resultado: repository, Rules, Emulator e UI terão invariantes estáveis.

## Requisitos cobertos

- Spec 007, critérios 12, 12a–12d, 24–25 e os riscos de concorrência.
- Handoff 008: `assetId` permanece estável e Quotes não decidem exclusão.

## Escopo incluído

- Consolidar `AssetUpdateInput`, erros sanitizados de conflito e
  `ASSET_HAS_TRANSACTIONS`.
- Formalizar o schema owner-scoped de `assetUsages/{assetId}` e sua criação
  atômica na primeira Transaction.
- Documentar reconciliação das Transactions legadas em Portfolios ativas e
  arquivadas antes de habilitar delete.
- Registrar mensagens, transições válidas, rollback e critérios para manter
  delete fechado diante de auditoria inconclusiva.

## Escopo excluído

- Implementar update/delete no repository, Rules, Emulator ou UI.
- Alterar Transaction para permitir edição/exclusão, criar cascade ou arquivar
  Asset.
- Alterar Quotes, Position, patrimônio ou cálculo financeiro.

## Dependências

- `007-01` a `007-09` concluídas.
- `docs/specs/007-assets-transactions.md` atualizado com a emenda.
- Contratos atuais de `Asset`, `Transaction`, registry e paths preservados.

## Arquivos e símbolos prováveis

- `docs/specs/007-assets-transactions.md`.
- `docs/tasks/007-assets-transactions/007-00-overview.md` e esta subtarefa.
- `src/domain/asset.ts`, `src/domain/errors.ts` e
  `src/data/firestore/errors.ts`, se o contrato exigir tipos novos.
- `src/data/firestore/paths.ts` e documentação de Rules para o guard.

## Passos de implementação

1. Definir input de edição sem aceitar `id` ou `identityKey` como autoridade.
2. Definir erro de colisão de identidade e erro estável de Asset referenciado.
3. Fechar invariantes de `id`, `createdAt`, `updatedAt`, registry e guard.
4. Documentar reconciliação owner-scoped, cobertura de Portfolios arquivadas e
   bloqueio conservador quando a cobertura for inconclusiva.
5. Registrar que o guard não é posição, contador, histórico ou payload financeiro.

## Testes e comandos de validação

```bash
npm run test:domain
npm run lint
npm exec next typegen
npx tsc --noEmit
git diff --check
```

## Definição de pronto

- Contrato de edição/exclusão e guard está documentado sem ambiguidade.
- `assetId` e `createdAt` são invariantes; `identityKey` é sempre derivada.
- Delete com uso, auditoria inconclusiva ou guard inconsistente permanece
  fechado.
- Nenhum código de persistência, Rule ou UI é aberto antecipadamente.

## Riscos e cuidados

- Não confiar em uma leitura prévia do catálogo para decidir exclusão.
- Não remover Transaction nem registry de forma parcial.
- Não introduzir `number`, posição, contador de saldo ou arquivamento implícito.

## Execução

- **Arquivos alterados nesta emenda:** `docs/specs/007-assets-transactions.md`,
  `docs/roadmap/reserva-clara-roadmap.md`, `007-00-overview.md`, este arquivo e
  as novas subtarefas `007-11` a `007-14`.
- **Decisões e desvios:** a emenda permanece no ticker `007`; a 008 não será
  usada para implementar CRUD de Asset. O guard create-only e a reconciliação
  conservadora foram adotados para preservar o ledger e bloquear delete quando
  a ausência de uso não puder ser provada.
- **Comandos executados:** `npm run test:domain`, `npm run lint`, `npm exec next
  typegen`, `npx tsc --noEmit` e `git diff --check`.
- **Resultados e evidências:** 6 testes de domínio passaram; lint, typegen,
  TypeScript e diff check passaram. Spec 007, spec 008 e roadmap registram a
  separação de escopo, invariantes, rollout/rollback, handoff e os critérios
  para 007-11 a 007-14. Nenhum código, Rule ou dado foi alterado nesta
  subtarefa.
- **Riscos residuais:** as operações ainda não estão disponíveis na aplicação;
  repository, Rules, testes do Emulator e UI permanecem para as subtarefas
  seguintes. A auditoria de Transactions legadas é pré-condição para abrir
  delete.
