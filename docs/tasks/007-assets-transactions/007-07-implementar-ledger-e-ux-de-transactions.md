# 007-07 — Implementar ledger e UX de Transactions

- **Ticker:** `007`
- **Número:** `07`
- **Status:** `pending`

## Objetivo

Entregar `/portfolios/[portfolioId]/transactions` com ledger determinístico e
formulário mínimo de buy/sell, sem apresentar cálculo patrimonial fictício.

## Dependências

- 007-02 reducer, 007-04 repository e 007-05 Rules concluídos.
- 007-06 catálogo disponível para seleção de Asset.
- Docs locais Next 16 lidas antes de editar parâmetros dinâmicos.

## Escopo

- Criar rota protegida e link acessível a partir do detalhe de Portfolio.
- Carregar Assets owner-scoped e transações da Portfolio, com estados loading,
  empty, erro/retry e read-only para Portfolio arquivada.
- Formulário exige Asset, buy/sell, quantidade, preço decimal, currency e data.
- Manter intenção/ID durante operação, bloquear concorrência e reconciliar erro
  ambíguo relendo ledger.
- Exibir evento por ordem total e informar que não há edição/delete, saldo,
  total ou rentabilidade nesta fase.
- Cobrir acessibilidade, responsividade e mensagem sem UID/path/stack trace.

## Fora de escopo

- Realtime, edição, exclusão, taxas, caixa, posição, cotação ou paginação sem
  cursor comprovadamente correto.

## Critérios de aceite

- Buy válido aparece após refresh; sell inválido não aparece.
- Portfolio arquivada conserva histórico, mas não oferece novo write.
- Asset de outro usuário não pode ser selecionado nem aceito pelo repository.
- Ordem permanece estável após refresh e empate de data.
- Usuário entende limites do ledger sem ver números derivados não implementados.

## Arquivos prováveis

- `src/app/(app)/(protected)/portfolios/[portfolioId]/transactions/page.tsx`
- `src/components/transaction/*`
- `src/components/portfolio/portfolio-detail.tsx`
- `src/proxy.ts` se matcher exigir ajuste

## Validação

Manual de buy/sell, backfill, venda inválida, archive/restore, refresh, erro,
cross-user, teclado e viewport; depois lint, typegen, TypeScript, build,
Rules Emulator e diff check.

## Registro de execução

- **Arquivos alterados:** preencher ao executar.
- **Decisões/desvios:** registrar ordenação e mensagem de correção futura.
- **Comandos/resultados/evidências:** preencher ao executar.
- **Riscos residuais:** custo/limite de leitura completa do ledger.
