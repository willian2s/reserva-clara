# 010-05 — Entregar dashboard da carteira

- **Ticker:** `010`
- **Número:** `05`
- **Status:** `pending`

## Objetivo e resultado esperado

Substituir o placeholder de `/portfolios/[portfolioId]` por uma visão
patrimonial real da carteira, incluindo totais honestos, composição, posições
abertas, Quote freshness, atualização manual e contexto de archive.

## Requisitos cobertos

- Critérios 6–18, 34–46 e 49 da spec 010.

## Escopo incluído

- Conectar a rota ao `PortfolioDashboardRead` com repositories e Quote client
  reais no client.
- Loading inicial, ready, empty, partial, refreshing e erro/retry.
- Header com nome, moeda-base e estado ativa/arquivada.
- Patrimônio conhecido e custo investido das posições abertas.
- Composição do valor conhecido e diagnósticos dos itens excluídos.
- Lista de posições abertas com Asset, quantidade, custo médio, custo, valor,
  freshness e timestamp.
- Ação “Atualizar dados” e preservação da última leitura.
- Links para operações, settings, Assets e lista de carteiras.
- Banner read-only para carteira arquivada e copy de valorização corrente.

## Escopo excluído

- Consolidado entre carteiras.
- Formulário de Transaction embutido, edição de Asset ou restore inline.
- Posições fechadas como holdings, performance, gráfico histórico ou target.
- Alterar o archive gate do repository/Rules.

## Dependências

- 010-01 a 010-04 concluídas.
- Facade/read model individual enriquecido e componentes compartilhados.
- Repositories `getPortfolio`, `listTransactions`, `listAssets` e `fetchQuotes`.

## Arquivos e símbolos prováveis

- `src/components/portfolio/portfolio-detail.tsx`.
- `src/components/portfolio/use-portfolio-dashboard.ts`.
- `src/components/financial/*`.
- `src/app/(app)/(protected)/portfolios/[portfolioId]/page.tsx` apenas se a
  montagem precisar mudar sem alterar a convenção de params.
- testes puros do estado; não há runner React configurado.

## Passos de implementação

1. Substituir `usePortfolio` pela leitura patrimonial sem duplicar o fetch do
   Portfolio.
2. Montar estados inicial, erro fatal, vazio, completo e parcial.
3. Exibir cards de patrimônio/custo com copy conforme o status.
4. Renderizar composição somente sobre entries conhecidas e listar gaps ao lado.
5. Renderizar posições abertas em cards responsivos e ordenar deterministicamente.
6. Sinalizar stale/unavailable e timestamps com texto e `<time>`.
7. Implementar refresh protegido contra concorrência e falha posterior.
8. Tratar carteira arquivada sem permitir escrita e sem sugerir snapshot.
9. Preservar navegação existente e validar foco/teclado/zoom/mobile.

## Testes e comandos de validação

```bash
npm run test:positions-read
npm run test:dashboard-read
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
git diff --check
```

Smoke manual com fixtures sintéticas: carteira ausente, sem operações, posição
fresh, stale, unavailable, moeda divergente, ledger inválido, refresh falho e
carteira arquivada.

## Definição de pronto

- O placeholder foi removido e a rota mostra dados derivados reais.
- Nenhum unavailable aparece como zero ou entra na composição.
- Empty, partial, stale, erro e archive têm linguagem e ações corretas.
- Refresh mantém conteúdo válido e respostas concorrentes não vencem.
- Links e responsividade existentes continuam funcionais.

## Riscos e cuidados

- Não fazer uma leitura separada de Portfolio além do read-side composto.
- Não chamar diferença nominal de rendimento/performance.
- Não esconder posição sem Quote só porque não há `MarketPosition`.
- Não permitir ação patrimonial em carteira arquivada.
- Não expor mensagens internas de domínio/Firebase/provider.
