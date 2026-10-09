# 012-06 — Revisar design system e componentes

- **Ticker:** `012`
- **Número:** `06`
- **Status:** `completed`

## Objetivo e resultado esperado

Revisar tokens, primitives, shell, formulários, alertas, empty/error/retry,
dialogs, tabelas/listas e componentes financeiros à luz das jornadas e da matriz
de acessibilidade.

## Requisitos cobertos

Design system, componentes reutilizáveis, consistência visual, feedback,
responsividade e boundaries de UI.

## Escopo incluído e excluído

Incluído: inventário, critérios de reuso e decisão de preservar/adaptar/substituir.
Excluído: catálogo completo implementado, gráficos, otimização de bundle ou
geração de componentes shadcn.

## Dependências

`012-04` e `012-05`; `src/app/globals.css` e `src/components/ui/*`.

## Arquivos e símbolos prováveis

`docs/architecture/012/design-system-and-components.md`, tokens CSS,
`Button`, `Card`, `Input`, `Label`, `financial/*`.

## Passos de implementação

1. Inventariar tokens e padrões efetivamente usados.
2. Relacionar componentes a jornadas, estados e critérios a11y.
3. Definir primitives e boundaries de apresentação versus domínio.
4. Registrar lacunas e dependências para 013/017/019.

## Testes e comandos de validação

Matriz componente → estado → critério a11y → slice; conferir links e `git diff --check`.

## Definição de pronto

Decisão de design system documentada, sem biblioteca produtiva escolhida por
hábito, e inventário acionável para o spike frontend.

## Riscos e cuidados

Preservar a identidade útil sem carregar automaticamente o design system legado;
não mover regra financeira para componentes visuais.

## Registro da execução

### Status e resultado

`completed` — o inventário e a decisão documental foram produzidos em
`docs/architecture/012/design-system-and-components.md`. O artefato cobre tokens,
primitives existentes, estados, componentes financeiros, matriz componente →
estado → critério a11y → slice, critérios de reuso, boundaries e handoff para
013/017/018/019. Nenhum componente produtivo, dependência, endpoint, segredo ou
configuração externa foi alterado.

### Arquivos alterados

- `docs/architecture/012/design-system-and-components.md` — novo inventário,
  decisões preservar/adaptar/substituir, matriz acionável, boundaries, lacunas,
  handoff e roteiro de validação.
- este arquivo — status, decisões, evidências, validações e riscos residuais.
- `docs/tasks/012-product-ux-ui-ia-api-discovery/012-00-overview.md` — checklist,
  progresso e observação da conclusão desta subtarefa.

### Decisões e desvios

- A execução permaneceu documental, conforme a fronteira da spec 012 e o escopo
  explícito desta subtarefa; não foram gerados componentes, gráficos, runner a11y
  ou dependência produtiva.
- Tokens semânticos, `Button`, `Card`, `Input`, `Label`, formatação decimal e
  copy financeira foram preservados. Shell, feedback, formulários, tabela/listas
  e estados financeiros receberam recomendações de adaptação, sem alterar o
  baseline.
- `Field`, status de leitura, `EmptyState`, `ErrorState`/retry e confirmação
  destrutiva foram definidos como primitives para a fundação 013, não como
  implementação antecipada. A decisão entre HTML nativo e Base UI permanece
  sujeita ao spike comparável de 013; nenhuma biblioteca foi escolhida por hábito.
- A fronteira adotada separa primitives de UI, feature UI, capability/data layer,
  domínio e autenticação. A UI não calcula posição, alocação, patrimônio,
  idempotência, owner ou autorização.
- “Registrar operação”, “posição aberta”, “custo de aquisição remanescente”,
  “patrimônio conhecido” e “cobertura das cotações” foram tratados como contrato
  de apresentação alinhado a 012-05; não foi introduzida promessa de performance
  histórica.

### Comandos executados e resultados

- Conferência da spec, overview, subtarefa selecionada, `AGENTS.md`, 012-04,
  012-05 e artefatos de arquitetura — passou; C1 aceito, C0 restrito a
  dev/testes e fixtures sintéticas.
- Conferência de ticker — passou: spec, pasta, overview e as 13 subtarefas usam
  `012`; a subtarefa `012-06` foi selecionada explicitamente pelo caminho
  informado.
- Conferência do overview — passou antes da edição: existe uma única seção
  `## Checklist`, com 13 itens, exatamente um por subtarefa; somente 012-06 foi
  selecionada.
- Conferência de dependências — passou: 012-04 e 012-05 estão `completed`, C1
  está aceito e não há dependência documental bloqueante.
- Inspeção read-only — passou para `globals.css`, `src/components/ui/*`,
  `src/components/financial/*`, shell, dashboard, Portfolio, Asset, Transaction,
  testes financeiros e ADR 015; o inventário e as evidências estão no artefato.
- Matriz documental — passou: cada boundary/primitiva da matriz possui estado,
  critério observável, slice e ação de preservar/adaptar/substituir.
- `git diff --check` — passou; também foi executado `git diff --no-index --check
  /dev/null docs/architecture/012/design-system-and-components.md` para cobrir o
  arquivo novo.
- Validação estrutural em Python — passou após corrigir um primeiro comando com
  caminho digitado incorretamente (`012-product-ux-ui-ia-discovery` em vez de
  `012-product-ux-ui-ia-api-discovery`): uma seção `## Checklist`, 13 itens,
  progresso consistente e todos os links relativos do artefato existentes.
- Lint, typecheck, build e testes de código — não executados: somente Markdown
  foi alterado e a spec 012 dispensa esses comandos quando não há código.
- Validação manual de navegador, contraste, 320 px, zoom 200% e leitor de tela —
  não executada; permanece critério para 013 e protótipos 017–019.
- Revisão independente do subagente `review` — **APROVADO**; confirmou formato
  SDD, dependências, cobertura do artefato, links, honestidade da evidência e
  ausência de decisão prematura de biblioteca/API. Nenhum bloqueador ou correção
  obrigatória foi apontado.

### Resultados e evidências

- `design-system-and-components.md` documenta os tokens de marca, semânticos,
  estados financeiros, tipografia, raios, foco e componentes UI efetivamente
  usados.
- A matriz cobre shell, ações, campos, estados de leitura, empty/error/retry,
  diálogo, tabela/lista, cards financeiros, alocação e Transaction, incluindo
  `loading`, `refreshing`, `partial`, `stale`, `unavailable`, `offline`,
  `conflict` e resultado desconhecido quando aplicável.
- O documento preserva o snapshot e explicita que indisponibilidade não é zero,
  cobertura não é percentual patrimonial e custo não é aporte/performance.
- As lacunas encaminham contratos e testes para 013, a slice Portfolio para 017,
  integridade e reconciliação para 018 e Quotes/valuation/dashboard para 019.

### Riscos residuais e bloqueios

- Não há bloqueio documental de execução. Ainda não existem primitives
  compartilhadas de status/empty/error/dialog nem testes React/E2E para provar os
  contratos em runtime.
- A validação de contraste, foco, leitor de tela, 320 px e zoom 200% continua
  pendente; esta entrega não declara conformidade WCAG.
- A tabela ARIA customizada, diagnósticos em `<details>`, copy de “Valor
  investido” e nomenclatura de operação permanecem gaps do baseline até as slices
  ou a fundação corrigirem-nos.
- Router, cache, biblioteca de componentes, TTL de stale e contratos HTTP
  definitivos continuam decisões abertas, conforme ADR 015 e a spec 012.

### Handoff

- `013` deve transformar as primitives conceituais, boundaries, foco, live
  regions, tabela e critérios de reuso em uma fundação testável, comparando
  alternativas sem escolher biblioteca por inércia.
- `017` deve consumir a hierarquia de Carteiras, empty/archived/read-only,
  custo, patrimônio conhecido e requisitos responsivos.
- `018` deve consumir “Registrar operação”, Field/feedback, append-only, conflito
  e resultado desconhecido sem retry cego.
- `019` deve consumir cards/listas e status de Quotes, valuation e Visão geral,
  mantendo cobertura, patrimônio conhecido, partial/stale/unavailable e ausência
  de performance histórica semanticamente separados.
- Não avançar automaticamente para `012-07` ou qualquer outra subtarefa.
