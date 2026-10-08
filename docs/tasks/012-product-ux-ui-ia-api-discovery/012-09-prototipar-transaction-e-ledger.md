# 012-09 — Prototipar Transaction e ledger

- **Ticker:** `012`
- **Número:** `09`
- **Status:** `completed`

## Objetivo e resultado esperado

Executar UX-07 e UX-08 para o formulário e histórico de `buy`/`sell`, definindo
precisão, taxa, data civil, saldo insuficiente, carteira arquivada, conflito,
retry, resultado desconhecido e append-only.

## Requisitos cobertos

Transaction/ledger, UX de precisão, idempotência, paginação/filtros e integridade
do `SELL` no boundary futuro.

## Escopo incluído e excluído

Incluído: formulário, histórico, mensagens, estados e necessidade de query.
Excluído: write confiável, locks, reducer C#, API/EF e testes concorrentes reais.

## Dependências

`012-04`, `012-05`, `012-08`, `transaction-form.tsx`, domínio Transaction e ADRs
014/016 da 011.

## Arquivos e símbolos prováveis

`docs/architecture/012/slices/transaction-ledger.md`, `TransactionForm`,
`TransactionLedger`, `parseTransactionInput`, `createTransaction` legado.

## Passos de implementação

1. Testar compra, venda, taxa opcional, decimal extremo e data inválida.
2. Modelar saldo insuficiente, archive, conflito e timeout pós-submit.
3. Definir chave idempotente, reconciliação e foco por erro.
4. Medir necessidade conceitual de paginação/filtros com fixtures pequenas,
   médias e grandes.

## Testes e comandos de validação

Walkthrough sem mouse e com resultado desconhecido; conferir strings canônicas,
ausência de optimistic/offline write e retry não cego.

## Definição de pronto

Pacote de Transaction com jornada, estados, copy, regras de retry/idempotência,
queries provisórias e dependências para 015/016/018.

## Riscos e cuidados

Não usar `number`/`Date` como fonte financeira, não permitir edição/exclusão de
fato e não snapshotar a fragilidade do SDK como contrato futuro.

## Registro da execução

### Status e resultado

`completed` — UX-07 e UX-08 foram documentados em
`docs/architecture/012/slices/transaction-ledger.md`, com protótipo standalone
em `docs/architecture/012/slices/transaction-ledger-prototype.html`. O pacote
define compra/venda, precisão decimal, taxa fixa opcional, data civil, saldo
insuficiente, carteira arquivada, conflito, idempotência, resultado desconhecido,
append-only, queries provisórias, filtros e paginação conceitual.

### Arquivos alterados

- `docs/architecture/012/slices/transaction-ledger.md` — pacote de decisão,
  fixtures, jornada, estados, copy, retry/idempotência, queries, acessibilidade e
  handoff.
- `docs/architecture/012/slices/transaction-ledger-prototype.html` — protótipo
  local com cenários de compra, venda, taxa, precisão, data inválida, saldo,
  archive, conflito, idempotência, resultado desconhecido, filtros e cursor.
- este arquivo — status, decisões, evidências, validações, riscos e handoff.
- `docs/tasks/012-product-ux-ui-ia-api-discovery/012-00-overview.md` — checklist,
  progresso e observação da conclusão.

Nenhum arquivo de produção, endpoint, dependência, segredo ou configuração
externa foi alterado.

### Decisões e desvios

- A execução permaneceu documental, conforme a fronteira da spec 012; o HTML é
  fixture standalone e não componente de produção, API ou persistência.
- A linguagem principal foi alinhada à 012-05: **Registrar operação** e
  **Histórico de operações**. A V1 mantém somente Compra/Venda e não cria novos
  tipos de Transaction.
- Decimais são strings canônicas, sem expoente, com limites de 30 dígitos
  inteiros e 18 fracionários; zero em quantidade/preço é inválido e zero/vazio
  em taxa vira ausência. A data não usa timezone e `createdAt` permanece somente
  metadado de ordenação.
- O protótipo semeia um ledger de saldo `2,5` para `F-INSUFFICIENT`, um fato com
  payload divergente para `F-CONFLICT` e o mesmo payload para `F-IDEMPOTENT`.
  Conflito bloqueia replay até uma nova chave; reconciliação desconhecida mantém
  a chave original.
- Filtros de Asset, tipo e intervalo de data são demonstrados; a janela grande
  usa cursor simulado derivado da tupla completa de ordenação. Limiares e forma
  física continuam provisórios para 016/018.
- A ordem de teclado do protótipo é título/status → formulário → histórico e
  filtros, alinhada ao fluxo primário documentado; a ordem física não congela a
  futura composição da tela.

### Comandos executados e resultados

- Conferência da spec, overview, subtarefa, `AGENTS.md`, dependências 012-04,
  012-05/012-08, ADRs 006/012/014/016 e componentes/domínio Transaction —
  passou; ticker `012`, C1 aceito, C0 restrito a fixtures sintéticas.
- Conferência do overview — passou: uma única seção `## Checklist`, 13 itens,
  exatamente um por subtarefa; somente `012-09` foi selecionada.
- `git diff --check` — passou.
- `git diff --no-index --check /dev/null docs/architecture/012/slices/transaction-ledger.md`
  e o mesmo comando para `transaction-ledger-prototype.html` — passaram.
- Compilação do JavaScript inline com `node`/`vm.Script` — passou.
- Assertions estruturais do protótipo para fixtures, taxa, filtros, cursor,
  ordenação, ARIA e nova chave — passaram.
- Mock comportamental com `node`/`vm` — passou para foco de saldo insuficiente,
  conflito, idempotência canônica (`2,50`), zero em quantidade/preço, taxa zero,
  separador inválido, resultado desconhecido/reconciliação e cursor grande. A
  primeira execução do mock falhou porque o mock não implementava
  `removeAttribute`; o mock foi corrigido e a execução final passou.
- Revisões independentes intermediárias — BLOQUEADAS por achados do protótipo;
  foco, taxa, fixtures, idempotência, ordenação, cursor, Asset, ARIA e teclado
  foram corrigidos, sem ocultar os achados.
- Revisão independente final do subagente `review` — **APROVADO**, sem
  bloqueadores ou correções obrigatórias remanescentes.
- Lint, typecheck, build e testes de código — não executados: somente Markdown e
  HTML standalone de discovery foram alterados, e a spec 012 dispensa esses
  comandos quando não há código de produção.

### Resultados e evidências

- O pacote registra as mensagens canônicas de validação, saldo insuficiente,
  archive, conflito, resultado desconhecido e confirmação, com foco por erro e
  sem optimistic/offline write.
- A igualdade de idempotência ignora `createdAt`, compara payload canônico e não
  considera moeda de taxa quando não há taxa. O mesmo ID/payload não duplica;
  payload divergente não sobrescreve.
- A ordenação preserva `effectiveDate`, segundos, nanos e ID; o histórico de
  volume grande anuncia filtros ativos e cursor simulado.
- O protótipo não oferece editar/excluir fatos e não usa `number`/`Date` como
  fonte financeira ou temporal da jornada.

### Riscos residuais e bloqueios

- Não há bloqueio documental de execução.
- Ainda não houve validação real em navegador, leitor de tela, contraste, 320 px,
  zoom de 200% ou teste concorrente; isso permanece handoff para 013/015/016/018.
- A taxa ainda precisa de política definitiva para moeda compatível e rounding
  no contrato futuro; o protótipo não converte nem arredonda silenciosamente.
- O repository legado client-side não é boundary confiável para `SELL` concorrente;
  lock, reducer transacional, reconciliação autoritativa e enforcement ficam em
  016/018.

### Handoff

- `013` deve tornar formulário, diagnósticos, foco, filtros e estados testáveis
  em runtime e responsivos.
- `015` deve preservar precisão decimal, data civil, timestamps e golden masters.
- `016` deve fechar capabilities, erros sanitizados, cursores, compatibilidade e
  política de taxa sem copiar o protótipo como DTO.
- `018` deve implementar boundary confiável, idempotência, concorrência, saldo de
  `SELL`, resultado desconhecido, reconciliação e append-only.
- `017` deve integrar a jornada à carteira ativa/arquivada sem reabrir operação
  arquivada; `019` deve consumir fatos sem confundi-los com posição ou performance.

Não avançar automaticamente para `012-10` ou qualquer outra subtarefa.
