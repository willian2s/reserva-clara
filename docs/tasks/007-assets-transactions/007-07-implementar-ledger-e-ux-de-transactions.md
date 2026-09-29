# 007-07 — Implementar ledger e UX de Transactions

- **Ticker:** `007`
- **Número:** `07`
- **Status:** `completed`

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

- **Arquivos alterados:**
  - `src/app/(app)/(protected)/portfolios/[portfolioId]/transactions/page.tsx` —
    rota dinâmica protegida usando o contrato `PageProps` do Next 16.
  - `src/components/transaction/transaction-ledger.tsx` — carregamento
    owner-scoped de Assets/Transactions, loading/empty/error/retry, ordenação
    determinística, histórico arquivado read-only e reconciliação.
  - `src/components/transaction/transaction-form.tsx` — formulário acessível
    de buy/sell com validação de domínio, ID de intenção estável, bloqueio de
    concorrência, reconciliação explícita e mensagens sanitizadas.
  - `src/components/portfolio/portfolio-detail.tsx` — link acessível para o
    ledger no detalhe da Portfolio.

- **Decisões/desvios:**
  - A rota não exigiu ajuste em `src/proxy.ts`: o matcher existente
    `/portfolios/:path*` já cobre `/transactions`.
  - A UI mantém `transactionId` e payload durante erro ambíguo; não repete o
    write automaticamente. A ação de verificação relê o ledger pelo mesmo ID e
    uma tentativa posterior reutiliza a mesma intenção.
  - A lista reutiliza `listTransactions` e `sortTransactions`, exibindo
    `effectiveDate`, Asset, tipo, quantidade e preço/moeda sem derivar saldo,
    posição, total ou rentabilidade. Eventos são explicitamente append-only.
  - A data civil é formatada com timezone UTC, sem converter o valor de
    `YYYY-MM-DD` pelo timezone local do navegador.
  - Após revisão de linguagem, a UI usa termos simples — “operações”,
    “histórico”, “ativo”, “compra” e “venda” — mantendo nomes técnicos apenas
    em rotas, contratos e módulos internos.
  - `node_modules/next/dist/docs/` não estava disponível neste checkout; foram
    seguidos os padrões já existentes de Next 16 para `await props.params`, e a
    rota passou por typegen, TypeScript e build.

- **Comandos/resultados/evidências:**
  - `npm run test:domain` — 5 testes aprovados, 0 falhas.
  - `npm run test:rules` — 13 testes do Emulator aprovados, 0 falhas.
  - `npm run lint` — concluído sem erros ou warnings.
  - `npm exec next typegen && npx tsc --noEmit` — concluído sem erros.
  - `npm run build` — concluído; a saída confirmou a rota dinâmica
    `/portfolios/[portfolioId]/transactions` e o Proxy.
  - `git diff --check` — concluído sem erros.
  - Ajuste posterior de linguagem — `lint`, typegen, TypeScript, build e
    `git diff --check` repetidos e aprovados.
  - Revisão independente — nenhum blocker; foram corrigidos os apontamentos
    de campos obrigatórios e exemplo decimal incompatível.
  - Validação manual em browser não foi executada neste ambiente; a rota e os
    fluxos permanecem preparados para o smoke autenticado previsto no handoff.

- **Riscos residuais:**
  - `listTransactions` e a validação de venda leem o ledger completo; o custo e
    limite operacional para carteiras grandes continuam exigindo aggregate ou
    snapshot em fase futura.
  - Security Rules não agregam o ledger contra SDK direto; um `sell`
    schema-válido escrito diretamente continua sendo o limite deliberado já
    documentado na spec.
  - Não há runner automatizado de UI; teclado, viewport e o fluxo autenticado
    precisam da validação manual prevista, sem alterar o escopo desta
    subtarefa.
