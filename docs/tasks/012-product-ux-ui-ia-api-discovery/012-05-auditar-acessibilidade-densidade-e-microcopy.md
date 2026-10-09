# 012-05 — Auditar acessibilidade, densidade e microcopy

- **Ticker:** `012`
- **Número:** `05`
- **Status:** `completed`

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

## Registro da execução

### Status e resultado

`completed` — a auditoria documental de UX-03, UX-04, UX-09 e A11Y-01 foi
concluída em `docs/architecture/012/accessibility-and-language-matrix.md`. O
artefato contém fixtures sintéticas, matriz WCAG com 15 achados priorizados,
critérios observáveis para teclado/foco/leitor de tela/contraste/320 px/zoom de
200%, densidade do consolidado, glossário aprovado e termos ambíguos. Não houve
uso de dados reais, writes ou alteração de componentes em produção.

### Arquivos alterados

- `docs/architecture/012/accessibility-and-language-matrix.md` — matriz,
  fixtures, achados, glossário, copy de estados, roteiro manual e handoff.
- este arquivo — status, decisões, evidências, validações, riscos e handoff.
- `docs/tasks/012-product-ux-ui-ia-api-discovery/012-00-overview.md` — checklist,
  progresso e observação da conclusão desta subtarefa.

### Decisões e desvios

- A execução permaneceu documental, conforme o limite explícito da spec 012:
  não foi instalado runner de acessibilidade e nenhum componente de produção foi
  alterado.
- O vocabulário aprovado usa **Registrar operação**, **posição aberta**,
  **custo de aquisição remanescente**, **patrimônio conhecido**, **cobertura das
  cotações**, **stale**, **unavailable**, **partial** e **sem performance
  histórica** com significados separados. “Cadastrar posição”, “evento”,
  “lançamento”, “valor investido” sem qualificador e “diferença nominal” foram
  registrados como termos que exigem revisão ou contexto.
- Os achados são evidência estática rastreável ao baseline e não foram
  promovidos a falhas de conformidade confirmadas. A validação humana com
  navegador e tecnologia assistiva ficou como critério para os protótipos de
  017–019 e fundação 013.
- A matriz não redefine a IA ou os estados de `012-03`/`012-04`; transforma suas
  regras de foco, anúncio, partial/stale/unavailable e recovery em critérios
  observáveis de acessibilidade e linguagem.

### Comandos executados e resultados

- Conferência da spec, overview, subtarefa selecionada, `AGENTS.md` e
  dependências `012-02`/`012-04` — passou; C1 aceito, C0 restrito a
  dev/testes e fixtures sintéticas.
- Conferência de ticker — passou: spec, pasta, overview e as 13 subtarefas usam
  `012`; a subtarefa `012-05` foi selecionada explicitamente pelo caminho
  informado.
- Conferência do overview — passou: existe uma única seção `## Checklist` com
  13 itens, exatamente um por subtarefa; somente o item `012-05` foi alterado
  nesta execução.
- Inspeção read-only de `globals.css`, shell protegido, dashboard, detalhe de
  carteira, ledger, `financial-copy.ts`, `KnownAmountCard`,
  `QuoteCoverageCard`, `PositionTable`, 404 e teste de apresentação financeira —
  passou; as linhas de evidência estão registradas na matriz.
- Walkthrough documental das fixtures `A11Y-LONG`, `A11Y-PARTIAL`,
  `A11Y-STALE`, `A11Y-NO-PERFORMANCE` e `A11Y-KEYBOARD` — passou como revisão
  estática de critérios e copy; não é execução de runtime.
- `git diff --check` — passou após a criação da matriz e atualização dos
  registros.
- Lint, typecheck, build e testes de código — não executados: somente Markdown
  foi alterado, e a spec 012 dispensa esses comandos quando não há código.
- Contraste, viewport de 320 px, zoom de 200% e leitor de tela — não executados
  em runtime; a matriz registra o procedimento, evidência exigida e risco
  residual sem declarar conformidade.
- Revisão independente do subagente `review` — **APROVADO**; confirmou formato
  SDD, dependências, cobertura dos requisitos, 15 achados, glossário, links,
  honestidade sobre a validação manual pendente e ausência de alterações de
  produção. Nenhum bloqueador ou correção obrigatória foi apontado.

### Resultados e evidências

- A matriz registra 15 achados: foco/`aria-current`, anúncios de estados,
  diagnósticos recolhidos, semântica da tabela, contraste, reflow, densidade,
  ordem do ledger, escopo de refresh, vocabulário, semântica financeira,
  empty/404 e números longos.
- Os critérios separam custo de aquisição remanescente, patrimônio conhecido,
  cobertura de cotação, aporte e ausência de performance histórica; `unavailable`
  nunca é zero e cobertura nunca é percentual patrimonial.
- O roteiro exige transcript de anúncios, ordem de foco, pares de contraste,
  evidência de reflow e confirmação de compreensão para cada slice, sempre com
  fixtures descartáveis.
- Os testes existentes de `financial-presentation` foram usados como evidência
  positiva limitada para decimais extensos, moeda e preservação de snapshot;
  nenhum teste foi interpretado como prova de a11y visual ou assistiva.

### Riscos residuais e bloqueios

- Não há bloqueio documental de execução. Ainda falta protótipo executável com
  navegador, leitor de tela, medição de contraste e viewport/zoom real; portanto,
  esta entrega não declara conformidade WCAG.
- A implementação atual ainda não marca navegação ativa, não expõe logout no
  shell, usa termos inconsistentes de operação e mantém informações relevantes
  em `<details>`; as recomendações foram encaminhadas às slices/fundação sem
  alterar produção nesta fase.
- A compreensão do vocabulário permanece hipótese heurística sem pesquisa com
  usuários reais.

### Handoff

- `013` deve tornar foco de rota, headings, live regions, semântica de tabela,
  contraste e reflow testáveis.
- `017` deve consumir o vocabulário e os critérios de vazio, arquivada,
  patrimônio conhecido e 320 px/200%.
- `018` deve usar “Registrar operação”, manter ordem de formulário e tratar
  conflito/resultado desconhecido sem retry cego.
- `019` deve preservar a distinção textual e assistiva entre cobertura de
  cotações, patrimônio conhecido, partial/stale/unavailable e sem performance.
- Não avançar automaticamente para `012-06` ou qualquer outra subtarefa.
