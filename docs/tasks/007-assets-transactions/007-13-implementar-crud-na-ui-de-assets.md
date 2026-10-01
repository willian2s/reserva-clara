# 007-13 — Implementar CRUD na UI de Assets

- **Ticker:** `007`
- **Número:** `13`
- **Status:** `pending`

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

- `007-12` concluída e Rules publicadas no ambiente autorizado.
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

- **Status:** `pending`; UI permanece somente de criação/listagem até as
  camadas confiáveis estarem prontas.
- **Riscos residuais:** não há runner de UI; smoke autenticado será necessário
  no fechamento.
