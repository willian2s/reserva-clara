# 010-04 — Criar apresentação patrimonial

- **Ticker:** `010`
- **Número:** `04`
- **Status:** `completed`

## Correções da revisão independente

- `PositionCard` agora diferencia cotação indisponível de cotação incompatível,
  sem exibir código de provider no segundo caso; também explica quando o valor
  contextual está fora da moeda-base e dos totais.
- `useDashboardRead` transforma exceções síncronas da leitura em rejeições,
  invalida respostas pendentes ao mudar `scopeKey` e agenda uma leitura do novo
  escopo sem alterar a API existente de `read`/mensagem.
- `AllocationList` permite quebra de valores longos em larguras de 320 px.
- O harness puro cobre as novas mensagens centralizadas de moeda e cotação.

## Evidências da correção

- `npm run test:financial-presentation`: 6/6 testes aprovados.
- `npm run lint`: aprovado.
- `npm exec next typegen`: aprovado.
- `npx tsc --noEmit`: aprovado após o typegen.
- `npm run build`: aprovado.
- `git diff --check`: aprovado.

## Fora desta subtarefa

A montagem das rotas e dashboards de carteira/global, além do gate final da fase,
continua dependente das subtarefas 010-05, 010-06 e 010-07; não foi alterada aqui.

## Objetivo e resultado esperado

Criar formatadores, estado de carregamento/atualização e componentes visuais
mínimos compartilhados pelos dois dashboards, mantendo matemática fora do React
e tornando estados completos, parciais, stale e unavailable acessíveis.

## Requisitos cobertos

- Critérios 17–18, 28–39, 41–46 e 49 da spec 010, na parte compartilhada.

## Escopo incluído

- Formatação pt-BR de dinheiro, decimal, percentual e timestamps a partir de
  contratos canônicos.
- Copy centralizada para status de total, Quote e gaps sanitizados.
- Peças para cards de métricas, cobertura, composição e item de posição.
- Estado/hook ou reducer reutilizável de `loading | ready | refreshing | error`
  com preservação da última leitura e descarte de resposta concorrente.
- Barras/listas responsivas e acessíveis, sem dependência de gráfico.
- Testes puros de formatação e transições de estado possíveis no harness atual.

## Escopo excluído

- Fazer I/O ou montar a rota global/detalhe completa.
- Criar design system financeiro genérico ou adicionar biblioteca pesada.
- Calcular totais, Allocation, diferença ou posição no componente.
- Introduzir teste React obrigatório nesta fase.

## Dependências

- 010-01 a 010-03 concluídas e contratos estabilizados.
- Tokens/componentes em `src/components/ui` e `.financial-value` existentes.

## Arquivos e símbolos prováveis

- `src/components/financial/financial-format.ts`.
- `src/components/financial/known-amount-card.tsx`.
- `src/components/financial/position-card.tsx`.
- `src/components/financial/allocation-list.tsx`.
- `src/components/dashboard/use-dashboard-read.ts` ou reducer equivalente.
- `src/components/ui/card.tsx` e `button.tsx` apenas por composição.
- testes puros e script/harness existentes ou compartilhados.

## Passos de implementação

1. Implementar formatação de strings decimais sem usar `number` para gerar o
   valor financeiro exibido.
2. Mapear Quote codes e razões de gap para mensagens pt-BR sanitizadas.
3. Criar cards que recebem valores prontos e sempre expõem status textual.
4. Criar lista de composição com rótulo, valor e percentual textual; qualquer
   barra visual é redundante e possui alternativa acessível.
5. Criar card de posição com metadados, custo, valor e Quote timestamp/status.
6. Implementar estado de request com `requestId`, mounted guard, refresh visível
   e preservação da última leitura em falha posterior.
7. Validar foco, headings internos, overflow e ausência de informação apenas em
   cor/hover.
8. Cobrir formatação limite, sinal negativo, percentuais nulos e transições.

## Testes e comandos de validação

```bash
npm run test:domain
npm run test:dashboard-read
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
git diff --check
```

Validação manual mínima: teclado, anúncio de loading/refresh/error, zoom 200%,
largura 320 px e desktop, nomes longos e contraste sem depender de cor.

## Definição de pronto

- Valores e percentuais são formatados deterministicamente em pt-BR.
- Componentes não contêm matemática patrimonial nem I/O.
- Partial/stale/unavailable são textuais e semanticamente distintos.
- Refresh preserva a última leitura e ignora resposta obsoleta.
- Peças funcionam em mobile/desktop sem tabela larga ou overflow.

## Riscos e cuidados

- `Intl.NumberFormat` não deve receber decimal arbitrário via `Number` e perder
  precisão; formatar a string ou usar estratégia exata validada.
- Percentual visual não pode virar fonte do valor textual.
- Não usar verde/vermelho como única distinção de sinal.
- Não duplicar `AssetQuote` sem avaliar reutilização da copy de erros.
- Não generalizar componentes além dos requisitos concretos da fase.

## Registro de execução

- **Status:** `completed`
- **Arquivos alterados:** `src/components/financial/financial-format.ts`,
  `src/components/financial/financial-copy.ts`,
  `src/components/financial/known-amount-card.tsx`,
  `src/components/financial/quote-coverage-card.tsx`,
  `src/components/financial/allocation-list.tsx`,
  `src/components/financial/position-card.tsx`,
  `src/components/dashboard/dashboard-read-state.ts`,
  `src/components/dashboard/use-dashboard-read.ts`,
  `src/components/asset/asset-quote.tsx`,
  `tests/financial-presentation.test.mjs`,
  `scripts/run-financial-presentation-tests.mjs` e `package.json`.
- **Decisões:** formatadores operam sobre strings canônicas, com agrupamento e
  arredondamento exatos para centavos, sem converter valores financeiros para
  `number`; percentuais são razões textuais e `null` permanece indisponível.
  Timestamps de Quote são apresentados em pt-BR no fuso `America/Sao_Paulo`.
  Copy de status, códigos de Quote e gaps foi centralizada. Os componentes
  recebem contratos/valores prontos, exibem estados textuais e não fazem I/O ou
  matemática patrimonial. O reducer preserva a última leitura durante refresh e
  erro, descarta `requestId` obsoleto, protege unmount e o hook invalida mudança
  de `scopeKey` (incluindo limpeza da leitura anterior).
- **Desvios:** nenhum requisito foi alterado. Não foi introduzido teste React,
  gráfico, biblioteca pesada, rota ou integração de dashboard, conforme o
  escopo da subtarefa; a composição usa lista acessível sem barra autoritativa.
- **Comandos executados:** `npm run test:financial-presentation`,
  `npm run test:domain`, `npm run test:positions`,
  `npm run test:positions-read`, `npm run test:dashboard-read`,
  `npm run test:quotes-adapter`, `npm run test:quotes-service`,
  `npm run test:quotes-route`, `npm run lint`, `npm exec next typegen`,
  `npx tsc --noEmit`, `npm run build` e `git diff --check`.
- **Resultados e evidências:** o harness da subtarefa passou 6/6 testes,
  incluindo limites, sinal negativo, percentuais nulos, copy de moeda/cotação,
  preservação da última leitura e respostas obsoletas. Os harnesses existentes
  passaram com 14 testes de domínio, 4 de posições, 9 de read-side individual,
  8 de read-side global, 7 do adapter de Quotes, 8 do serviço e 8 da rota.
   Lint, typegen, TypeScript, build Next.js 16.3.5 e `git diff --check` passaram.
  A revisão independente final não encontrou bloqueadores; confirmou a
  distinção de estados de Quote, `scopeKey`/unmount/`requestId`, overflow mobile,
  copy centralizada e ausência de conversão financeira para `number`.
- **Riscos residuais:** não há teste automatizado de renderização React nem
  smoke manual de teclado, zoom, contraste e largura de 320 px nesta execução;
  esses gates permanecem para as telas 010-05/010-06 e o fechamento 010-07.
  A integração efetiva do hook e das peças nas duas rotas também permanece
  fora desta subtarefa.
