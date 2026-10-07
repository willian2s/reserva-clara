# 012-02 — Mapear jornadas e problemas de produto

- **Ticker:** `012`
- **Número:** `02`
- **Status:** `completed`

## Objetivo e resultado esperado

Executar UX-01 com walkthroughs da entrada até a compreensão patrimonial e
produzir mapa de tarefas, perfis/cenários, dores e decisão sobre o que preservar,
simplificar, reorganizar, substituir, remover ou dividir.

## Requisitos cobertos

Jornadas 001–010, UX-01 e comparação entre dashboard global e carteiras.

## Escopo incluído e excluído

Incluído: login, shell, Portfolio, Asset, Transaction, Quotes, detalhe e
consolidado com carteiras vazias/arquivadas e falhas. Excluído: pesquisa com
dados reais, implementação e freeze de API.

## Dependências

`012-01`; inventário 011-06 e telas atuais em `src/components/**`.

## Arquivos e símbolos prováveis

`docs/architecture/012/journeys-and-product-findings.md`, `GlobalDashboard`,
`PortfolioList`, `PortfolioDetail`, `TransactionLedger`, `AssetCatalog`.

## Passos de implementação

1. Definir tarefas observáveis para três perfis hipotéticos e fixtures sintéticas.
2. Percorrer login → carteira → operação → leitura patrimonial.
3. Comparar entrada pelo dashboard global e pela lista de carteiras.
4. Registrar fricções, linguagem, ações ausentes e decisão por fluxo.

## Testes e comandos de validação

Walkthrough documentado com cenários de sucesso, vazio e erro; conferir links e
`git diff --check`. Nenhuma conclusão deve depender de patrimônio real.

## Definição de pronto

Mapa de jornadas aprovado, decisão de entrada justificada e backlog priorizado
com evidência e perguntas ainda abertas.

## Riscos e cuidados

Não confundir preferência do planejador com pesquisa de usuário e não preservar
uma tela apenas por existir no Next.

## Registro da execução

### Status e resultado

`completed` — UX-01 foi executado como walkthrough heurístico documental com
três perfis hipotéticos e fixtures sintéticas. O mapa compara dashboard global e
lista de carteiras, registra sucesso, vazio, erro, parcial, stale, unavailable,
arquivado/read-only e conflito, e recomenda Carteiras como entrada autenticada
principal, mantendo o dashboard como Visão geral. Não foram usados dados reais,
writes patrimoniais ou pesquisa com usuários.

### Arquivos alterados

- este arquivo — status, decisões, evidências, validações, riscos e handoff.
- `docs/architecture/012/journeys-and-product-findings.md` — mapa de jornadas,
  walkthroughs, decisão de entrada, achados, backlog e perguntas abertas.

### Decisões e desvios

- A evidência é um walkthrough heurístico, não pesquisa com usuários; todas as
  conclusões foram marcadas como hipótese sujeita a protótipo e validação.
- O comportamento atual foi usado como baseline observável, não como aprovação
  da UI legada; fluxos foram classificados como preservar, simplificar,
  reorganizar, substituir, remover ou dividir.
- A decisão de entrada é conceitual: Carteiras é o workspace inicial e o
  dashboard é Visão geral; URLs, router, DTOs, endpoints e API não foram
  congelados.

### Comandos executados e resultados

- `functions.glob`/`functions.read` — passaram na conferência da spec 012,
  overview, subtarefas, AGENTS.md, handoff 011, roadmap e matriz de gate.
- Exploração read-only de `src/app/**` e `src/components/**` — passou; foram
  registrados os comportamentos observáveis sem dados reais ou writes.
- Conferência de ticker — passou: spec, pasta, overview e subtarefas usam
  `012`; a subtarefa selecionada é `012-02`.
- Conferência do overview — passou: há uma única seção `## Checklist` com 13
  itens, um por subtarefa; somente `012-01` e `012-02` estão marcados como
  concluídos.
- Conferência de dependências — passou: `012-01` está `completed` com aceite
  independente de C1 e C0 permanece restrito a dev/testes.
- Walkthrough documental — passou para três perfis e fixtures `F-EMPTY`,
  `F-CLARA`, `F-MULTI` e `F-CONFLICT`, cobrindo sucesso, vazio, erro, parcial,
  stale, unavailable, arquivado/read-only e conflito.
- `git diff --check` — passou após a criação do artefato e atualização dos
  registros.
- Lint, typecheck, build e testes de código — não executados: somente Markdown
  foi alterado e a spec 012 dispensa esses comandos quando não há código.

### Resultados e evidências

- `docs/architecture/012/journeys-and-product-findings.md` contém os três
  perfis, tarefas observáveis, fixtures, walkthroughs, comparação de entradas,
  decisão por fluxo, backlog priorizado e perguntas abertas.
- O walkthrough observou login, shell, Portfolio, Asset, Transaction, Quotes,
  detalhe e consolidado, com estados e ações presentes/ausentes ligados aos
  arquivos atuais.
- A decisão de entrada é justificada pela redução do beco sem saída no estado
  vazio e pela proximidade da lista de carteiras com a primeira tarefa; o risco
  de ausência de pesquisa real está explícito.
- `docs/architecture/012/decision-matrix.md` e `012-01` confirmam o gate C1 e
  as condições de C0; nenhum dado real ou write foi usado.

### Riscos residuais e bloqueios

- Não há pesquisa com usuários reais; a decisão Carteiras versus Visão geral é
  hipótese heurística e deve ser validada por protótipo/tarefa observável.
- Acessibilidade detalhada, sessão/recovery, design system, lifecycle de Asset,
  Transaction e Quotes permanecem dependências das subtarefas seguintes.
- Não há testes React/E2E; os achados de estados e linguagem ainda precisam de
  protótipo responsivo e critérios de a11y.

### Handoff

- Consumir este artefato em `012-03` para a IA conceitual e o shell, sem
  congelar URL ou router.
- Usar o backlog e as perguntas abertas como entrada para `012-04`–`012-10`;
  cada subtarefa deve validar sua própria evidência e não assumir que a UI atual
  foi aprovada.
- Não avançar automaticamente para `012-03` ou qualquer outra subtarefa.
