# 010-04 — Criar apresentação patrimonial

- **Ticker:** `010`
- **Número:** `04`
- **Status:** `pending`

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
