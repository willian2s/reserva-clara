# 005-05 — Criar acesso de dados de Portfolio

- **Ticker:** `005`
- **Número:** `05`
- **Status:** `completed`

## Objetivo

Expor operações de Portfolio orientadas ao domínio, derivando ownership do
usuário autenticado e mantendo chamadas Firestore fora de React.

## Resultado esperado

API pequena com `createPortfolio`, `getPortfolio`, `listPortfolios`,
`updatePortfolio` e `deletePortfolio`, sem generic repository ou UI.

## Requisitos cobertos

- camada de acesso a dados;
- múltiplas carteiras;
- ownership por Auth `uid`;
- ausência de acesso cross-user por input;
- preparação direta para fase 006.

## Escopo incluído

- referências de `users/{uid}/portfolios`;
- `requireAuthenticatedUid`/equivalente na fronteira de persistência;
- operações com converter/parser;
- listagem owner-scoped com query simples suportada pelo índice automático;
- server timestamps em create/update;
- delete próprio somente no escopo sem subcoleções abertas, com risco
  documentado para 007.

## Escopo excluído

- componentes, hooks, formulário ou UI de carteira;
- Transaction/Asset, cálculo financeiro, pagination prematura ou real-time
  listener;
- aceitar `uid` fornecido por formulário/query;
- regra de autorização substituída por `DashboardGate`.

## Dependências

- 005-03 Firestore Web;
- 005-04 converter/parser;
- 005-02 domínio;
- Rules de 005-06 podem ser implementadas em paralelo, mas smoke completo espera
  ambas.

## Arquivos e símbolos prováveis

- `src/data/firestore/portfolio-repository.ts`;
- `src/data/firestore/paths.ts`;
- `src/domain/portfolio.ts`;
- `src/lib/firebase/client.ts` (`auth`, `db`).

## Passos de implementação futura

1. Derivar UID de `auth.currentUser` no momento da operação.
2. Construir path fixo com UID autenticado, nunca path de input arbitrário.
3. Implementar create/list/get/update/delete usando converter.
4. Validar inputs antes do SDK e traduzir falhas sem expor dados.
5. Confirmar que componentes não importam SDK Firestore diretamente.
6. Testar retry/ausência de sessão e integração com emulator quando disponível.

## Testes e comandos de validação

```bash
npm run lint
npm exec next typegen
npx tsc --noEmit
```

No emulator, testar duas identidades sintéticas e ausência de sessão; não usar
conta pessoal nem produção.

## Definição de pronto

- API pública é orientada a Portfolio e preparada para 006;
- nenhuma função recebe owner arbitrário da UI;
- conversor/parser sempre são usados;
- listagem/query não exige índice composto;
- repository não é importado por landing/layout Server Component;
- gates e testes disponíveis passam.

## Riscos e cuidados

- Delete de documento pai não remove subcoleções futuras; 007 deve revisar antes
  de abrir Transactions.
- Auto ID é suficiente para Portfolio, mas não para idempotência de Transaction.
- Não adicionar listener realtime sem requisito de fase.

## Execução e evidências

- **Data:** 2026-09-24.
- **Implementado:** repository owner-scoped com `createPortfolio`,
  `getPortfolio`, `listPortfolios`, `updatePortfolio` e `deletePortfolio`;
  UID é lido de `auth.currentUser` em cada operação e não é aceito como input.
- **Paths e validação:** referências usam exclusivamente
  `users/{uid}/portfolios`; IDs e inputs são validados antes das operações SDK.
  Listagem usa leitura direta da coleção, sem índice composto.
- **Writes e segurança:** create/update usam server timestamps dos mapeadores
  existentes; update usa `updateDoc` após validar existência, evitando upsert;
  falhas SDK são traduzidas para erro sanitizado. Delete remove somente o
  documento pai e não promete cascata de subcoleções futuras.
- **Comandos executados:** `npm run lint`; `npm exec next typegen`; `npx tsc
  --noEmit`; `npm run build`; `git diff --check`.
- **Resultados:** todos os gates passaram; smoke sintético sem Firebase
  produtivo não foi adicionado porque não há runner/configuração de emulator
  aprovada nesta subtarefa.

## Arquivos alterados

- `src/data/firestore/errors.ts`
- `src/data/firestore/paths.ts`
- `src/data/firestore/portfolio-repository.ts`
- `docs/tasks/005-domain-model-firestore-foundation/005-00-overview.md`
- `docs/tasks/005-domain-model-firestore-foundation/005-05-criar-acesso-de-dados-de-portfolio.md`

## Decisões e desvios

- `getPortfolio` retorna `null` para documento ausente, enquanto documentos
  existentes passam pelo converter/parser; update diferencia ausência com erro
  explícito.
- `updateDoc` foi escolhido em vez de `setDoc(..., { merge: true })` para
  impedir upsert acidental. O payload passa pelo mapeador e converter de update;
  leitura prévia e posterior usam converter/parser.
- Não foram criados UI, hooks, repository genérico, Rules, emulator,
  configuração ou índices.

## Riscos residuais e bloqueios

- `deletePortfolio` não remove subcoleções; antes de abrir Transactions em 007,
  exclusão/arquivamento deverá ser revisado.
- Regras Firestore e isolamento cross-user aguardam 005-06/005-07; este
  repository apenas enraíza paths no Auth e não substitui Rules.
- Comportamento real de server timestamps e falhas de permissão aguardam
  Emulator Suite, ativação do banco e Rules das subtarefas seguintes.
