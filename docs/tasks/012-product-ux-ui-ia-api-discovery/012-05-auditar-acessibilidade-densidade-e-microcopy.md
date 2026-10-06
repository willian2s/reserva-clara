# 012-05 — Auditar acessibilidade, densidade e microcopy

- **Ticker:** `012`
- **Número:** `05`
- **Status:** `pending`

## Objetivo e resultado esperado

Executar UX-03, UX-04, UX-09 e A11Y-01 em protótipos representativos, produzindo
matriz WCAG, achados priorizados e vocabulário financeiro aprovado.

## Requisitos cobertos

320 px, zoom 200%, teclado, foco, contraste, leitor de tela, números longos,
partial/stale/unavailable e distinção de custo/patrimônio/performance.

## Escopo incluído e excluído

Incluído: telas e fluxos críticos, estados difíceis e copy. Excluído: declarar
conformidade total, instalar runner a11y ou alterar componentes em produção.

## Dependências

`012-02`, `012-04` e baseline `src/app/globals.css`/componentes financeiros.

## Arquivos e símbolos prováveis

`docs/architecture/012/accessibility-and-language-matrix.md`,
`financial-copy.ts`, `KnownAmountCard`, `QuoteCoverageCard`, `PositionTable`.

## Passos de implementação

1. Montar fixtures com textos longos, valores extensos e estados parciais.
2. Avaliar foco, tabulação, anúncios, contraste, zoom e viewport.
3. Testar termos e mensagens com cenários sem histórico de performance.
4. Priorizar bloqueadores e critérios para os protótipos das slices.

## Testes e comandos de validação

Checklist manual de teclado/leitor de tela/320 px/200%; registrar evidências e
`git diff --check`.

## Definição de pronto

Matriz com achado, severidade, evidência, recomendação e critério observável;
glossário aprovado e termos ambíguos identificados.

## Riscos e cuidados

Não usar cor como único significado, não chamar custo de aporte/performance e
não transformar a cobertura de Quotes em cobertura patrimonial.
