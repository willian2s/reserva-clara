# 010-05 — Entregar dashboard da carteira

- **Ticker:** `010`
- **Número:** `05`
- **Status:** `completed`

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
- Patrimônio conhecido e Valor investido das posições abertas.
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

## Registro de execução

- **Status:** `completed`
- **Arquivos alterados:** `src/components/portfolio/use-portfolio-dashboard.ts`,
  `src/components/portfolio/portfolio-detail.tsx`,
  `src/components/financial/position-table.tsx`,
  `src/components/dashboard/use-dashboard-read.ts`,
  `src/components/dashboard/dashboard-refresh-button.tsx` e
  `src/app/(app)/(protected)/layout.tsx`.
- **Decisões:** o detalhe passou a consumir uma única leitura composta de
  `readPortfolioPositions`, com repositories e Quote client reais injetados no
  hook. O estado compartilhado preserva a última leitura durante refresh e
  falha posterior, enquanto o `requestId` descarta respostas obsoletas. A UI
  exibe somente posições abertas, usa `KnownAmountCard`, `AllocationList`,
  `QuoteCoverageCard` e `PositionTable`, preserva indisponibilidade/moeda
  incompatível sem imputar zero e mostra o estado/timestamp da cotação. A
  atualização normal fica centralizada no botão do topo, com feedback de
  atualização e bloqueio contra cliques repetidos; o detalhe mantém apenas
  retry contextual para erros, e o cleanup limpa o estado global ao trocar de
  carteira. As
  posições abertas usam uma tabela resumida em desktop e linhas empilhadas em
  mobile, reduzindo a densidade técnica sem perder os diagnósticos essenciais.
  O estado e os diagnósticos da cotação continuam disponíveis no card de
  cobertura, nos gaps da composição e em detalhes recolhidos por ativo, sem
  poluir cada linha da tabela.
  Carteira arquivada permanece consultável com copy explícita de leitura
  corrente e sem sugestão de nova operação.
- **Desvios:** não houve alteração funcional de requisitos. A nomenclatura
  visual `Valor investido` foi aprovada pelo produto como
  `Valor investido`, com a descrição mantendo o significado de custo de
  aquisição. Não foram modificados schema, Rules, repositories, ledger, rotas,
  matemática patrimonial ou persistência. O diagnóstico da composição continua
  resumido por quantidade no componente compartilhado; os motivos sanitizados
  permanecem visíveis nos cards e nos gaps dos totais.
- **Comandos executados:** `npm run test:positions-read`,
  `npm run test:dashboard-read`, `npm run test:financial-presentation`,
  `npm run lint`, `npm exec next typegen`, `npx tsc --noEmit`, `npm run build` e
  `git diff --check`.
- **Resultados e evidências:** todos os comandos concluíram com código zero.
  Passaram 9 testes de read-side individual, 8 de read-side global e 6 de
  apresentação; lint, typegen, TypeScript, build Next.js 16.3.5 e diff check
  também passaram. A revisão independente não encontrou blockers ou majors e
  aprovou as correções de archive, troca de `portfolioId` e tabela responsiva.
- **Riscos residuais:** não há runner React nem smoke automatizado; permanece
  pendente a validação manual de teclado, zoom, contraste, largura de 320 px e
  fixtures visuais de archive/empty/partial/refresh, prevista para o fechamento
  da fase em 010-07.
- **Ajuste visual posterior:** a coluna `Quantidade` foi centralizada no
  cabeçalho e nas células da tabela para melhorar a separação visual em relação
  ao custo médio.
- **Ajuste visual da referência:** a tabela de posições passou a apresentar
  `Ativo`, `Valor atualizado`, `Valor investido`, `Quantidade` e `% do
  patrimônio`, usando os `AllocationEntry` já derivados. P&L, rentabilidade e
  TWR não foram adicionados porque permanecem fora do escopo desta spec.
- **Ajuste de nomenclatura:** por solicitação do produto, os cards aparecem na
  ordem `Valor investido | Patrimônio`; a descrição do primeiro mantém explícito
  que o valor é o custo de aquisição remanescente das posições abertas.
- **Ajuste de densidade:** composição corrente e cobertura das cotações ficam
  recolhidas em uma seção opcional, sem desaparecerem do read-side ou dos
  diagnósticos disponíveis ao usuário. Essa seção aparece abaixo da tabela de
  posições e antes das ações finais da carteira.
