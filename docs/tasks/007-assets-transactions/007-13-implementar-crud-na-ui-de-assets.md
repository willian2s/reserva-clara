# 007-13 — Implementar CRUD na UI de Assets

- **Ticker:** `007`
- **Número:** `13`
- **Status:** `completed`

## Objetivo e resultado esperado

Expor edição e exclusão segura no catálogo de Assets, com confirmação clara,
mensagens distintas e preservação de cotações, identidade e ledger.

## Requisitos cobertos

- Spec 007, experiência de catálogo e critérios 12d, 29.
- Handoff 008: a UI desta subtarefa limpa o resultado local e aciona o loader
  de Quotes existente após editar pelo mesmo `assetId`; 008-06 somente valida
  esse comportamento no smoke.

## Escopo incluído

- Ações editar/excluir por item, formulário preenchido e confirmação explícita.
- Mensagem de bloqueio quando houver Transactions vinculadas.
- Estados loading, erro, conflito, sucesso, foco, teclado, mobile e live region.
- Remoção visual somente após confirmação do repository.
- Limpeza do resultado local do Asset editado e acionamento do loader de Quotes
  já integrado em 008; não alterar `quote-client`, `QuoteService` ou a política
  de cache.

## Escopo excluído

- Alterar ledger, excluir Transactions, cascade, archive de Asset ou cálculo de
  posição/patrimônio.

## Dependências

- `007-12` concluída, com Rules locais/emuladas e guard provados; publicação em
  ambiente autorizado permanece requisito para eventual rollout produtivo.
- `007-11` fornece update/delete owner-scoped.

## Definição de pronto

- Usuário entende por que um Asset com operações não pode ser excluído.
- Edição mantém o item e suas Transactions associados pelo mesmo ID.
- Falhas não escondem o catálogo nem deixam estado otimista incorreto.

## Testes e comandos de validação

```bash
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
git diff --check
```

## Riscos e cuidados

- Não exibir `identityKey`, UID, token ou detalhes do Firestore.
- Não transformar exclusão bloqueada em arquivamento silencioso.

## Execução

- **Status:** `completed`; o catálogo agora permite editar e excluir Assets com
  confirmação explícita, mensagens sanitizadas e atualização somente após a
  confirmação do repository.
- **Arquivos alterados:** `src/components/asset/asset-catalog.tsx` e
  `src/components/asset/asset-edit-form.tsx`, além deste arquivo e do overview
  007.
- **Decisões e desvios:** a edição usa formulário inline preenchido com os
  quatro campos editáveis e chama `updateAsset` pelo mesmo `assetId`; conflitos
  de identidade, Asset ausente e falhas genéricas recebem mensagens distintas.
  A exclusão exige confirmação inline, chama `deleteAsset` somente após a ação
  explícita e mantém o item visível em qualquer falha, incluindo
  `ASSET_HAS_TRANSACTIONS` e reconciliação inconclusiva. Após editar, o
  resultado local da cotação é removido por `assetId` e o loader existente é
  acionado novamente com o catálogo atualizado; `quote-client`, `QuoteService`
  e a política de cache não foram alterados. Handlers de mutação invalidam
  cargas concorrentes do catálogo para impedir que uma reconciliação antiga
  reverta a UI. Nenhuma identidade técnica, UID ou detalhe do Firestore é
  exibido.
- **Comandos executados:** `npm run test:domain`, `npm run test:rules`,
  `npm run lint`, `npm exec next typegen`, `npx tsc --noEmit`, `npm run build`
  e `git diff --check`.
- **Resultados e evidências:** 7 testes de domínio e 19 testes do Emulator de
  Rules passaram. Lint, geração de tipos do Next, TypeScript, build e diff
  check também passaram. A revisão independente confirmou o vínculo por ID,
  confirmação, bloqueio de exclusão, invalidação de Quotes e a proteção contra
  race de carga do catálogo. Smoke autenticado executado pelo usuário confirmou
  que as funções de editar e excluir estão operacionais.
- **Riscos residuais:** não há runner automatizado de UI; permanecem apenas as
  validações exploratórias detalhadas do fechamento da 007-14.
