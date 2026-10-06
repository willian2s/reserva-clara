# 012-09 — Prototipar Transaction e ledger

- **Ticker:** `012`
- **Número:** `09`
- **Status:** `pending`

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
