# 010-06 — Entregar dashboard global

- **Ticker:** `010`
- **Número:** `06`
- **Status:** `completed`

## Objetivo e resultado esperado

Substituir o card estático de `/dashboard` por um consolidado das carteiras
ativas com patrimônio conhecido, custo investido, distribuição, resumo de
posições, Assets sem cotação e atualização manual resiliente.

## Requisitos cobertos

- Critérios 19–33 e 40–46 da spec 010.

## Escopo incluído

- Conectar `GlobalDashboardRead` às implementations reais dos repositories e
  Quote client.
- Loading, empty sem carteira, empty sem posição, ready, partial, refreshing e
  erro fatal/retry.
- Métricas globais de valor, custo, carteiras, posições e Quote coverage.
- Distribuição do valor conhecido entre carteiras, com links de detalhe.
- Entradas de carteira indisponível sem imputar zero.
- Resumo das posições abertas preservando Portfolio + Asset.
- Lista deduplicada de Assets sem cotação e carteiras afetadas.
- Atualização manual com última leitura preservada.
- Responsividade e acessibilidade nos padrões da aplicação.

## Escopo excluído

- Carteiras arquivadas no total ou loading de seus ledgers.
- Agregação de custo médio/quantidade do mesmo Asset entre carteiras.
- Ranking, recomendação, performance, target allocation ou histórico.
- Paginação/read model persistido; limites de escala seguem para 021.

## Dependências

- 010-01 a 010-05 concluídas.
- Leitor global testado e componentes compartilhados estabilizados.
- `listPortfolios`, `listAssets`, `listTransactions` e `fetchQuotes` reais.

## Arquivos e símbolos prováveis

- `src/app/(app)/(protected)/dashboard/page.tsx`.
- `src/components/dashboard/global-dashboard.tsx`.
- `src/components/dashboard/use-global-dashboard.ts`.
- `src/components/financial/*`.
- `src/data/positions/dashboard-read.ts` apenas para integração, sem mover
  matemática ao componente.

## Passos de implementação

1. Transformar a page em composição fina de um Client Component.
2. Conectar dependências reais uma única vez por refresh.
3. Implementar estado sem carteiras ativas com CTA para `/portfolios`.
4. Exibir patrimônio/custo com rótulo completo ou conhecido/parcial.
5. Mostrar contagens e coverage sem sugerir cobertura monetária percentual.
6. Renderizar breakdown por carteira e separar entradas indisponíveis.
7. Renderizar resumo de posições por carteira, sem consolidar custo entre elas.
8. Deduplicar visualmente Assets sem cotação preservando carteiras afetadas.
9. Implementar refresh, retry e proteção contra resposta obsoleta.
10. Validar que arquivadas não aparecem nem são carregadas.

## Testes e comandos de validação

```bash
npm run test:dashboard-read
npm run test:positions-read
npm run test:quotes-route
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
git diff --check
```

Smoke manual: sem carteira, só arquivadas, carteiras sem posições, duas
carteiras compartilhando Asset, stale, unavailable, carteira com ledger inválido,
zero conhecido parcial, refresh concorrente, mobile e teclado.

## Definição de pronto

- `/dashboard` mostra somente o consolidado de carteiras ativas.
- Totais e breakdown reconciliam e estado parcial é inequívoco.
- Falha de uma carteira não derruba as demais nem aparece como zero.
- Asset compartilhado não perde a relação com cada carteira na UI.
- Empty, refresh, retry, acessibilidade e responsividade foram validados.

## Riscos e cuidados

- Não chamar distribuição conhecida de distribuição total quando parcial.
- Não somar MarketPositions novamente no React.
- Não mostrar carteira arquivada por reutilização indevida da listagem geral.
- Não serializar dados financeiros em Server Component ou logs.
- Não adicionar paginação improvisada que esconda posições sem indicação.

## Registro de execução

- **Status:** `completed`
- **Arquivos alterados:** `src/app/(app)/(protected)/dashboard/page.tsx`,
  `src/components/dashboard/global-dashboard.tsx`,
  `src/components/dashboard/use-global-dashboard.ts`,
  `src/components/dashboard/dashboard-refresh-button.tsx` e
  `src/components/financial/position-table.tsx`.
- **Decisões:** a página passou a compor um Client Component que injeta uma única
  leitura global real por refresh. O consolidado exibe métricas derivadas,
  distribuição com links, carteiras indisponíveis sem valor zero, posições com
  identidade carteira/ativo e Assets sem cotação deduplicados com carteiras
  afetadas. Estados loading, empty, parcial, refreshing e erro/retry preservam a
  última leitura pelo hook compartilhado; o botão de atualização também aparece
   no dashboard global. Posições desconhecidas por carteiras indisponíveis são
   qualificadas como conhecidas, sem afirmar ausência.
- **Ajuste visual posterior:** a dashboard global passou a seguir a mesma
  estrutura da dashboard de carteira: cards de valor na mesma ordem, tabela
  responsiva de posições por carteira, composição/cobertura recolhidas e
  diagnósticos preservados. A tabela recebeu `ariaLabel` contextual para
  distinguir cada carteira em leitores de tela.
- **Desvios:** nenhum requisito foi alterado. Não foram modificados read-side,
  contratos, persistência, Rules, repositories, Quotes ou matemática financeira.
  Não há runner React configurado, portanto a validação automatizada permanece nos
  harnesses read-side/apresentação e nos gates técnicos.
- **Comandos executados:** `npm run test:dashboard-read`,
  `npm run test:positions-read`, `npm run test:financial-presentation`,
  `npm run lint`, `npm exec next typegen`, `npx tsc --noEmit`, `npm run build` e
  `git diff --check`.
- **Resultados e evidências:** dashboard read passou 8/8 testes, positions read
  passou 9/9 e apresentação financeira passou 6/6. Lint, Next typegen,
  TypeScript, build Next.js 16.3.5 e diff check concluíram com código zero. A
  revisão independente não encontrou blockers; apontou e foi corrigida a
  distinção entre zero posições e posições não verificáveis em carteira
  indisponível, além da nomenclatura do custo investido.
- **Riscos residuais:** smoke manual de estados, teclado, zoom, contraste,
  largura de 320 px, refresh concorrente e fixtures visuais permanece para
  010-07. O dashboard continua client-only sob o AuthGate, que não é boundary de
  autorização server-side.
