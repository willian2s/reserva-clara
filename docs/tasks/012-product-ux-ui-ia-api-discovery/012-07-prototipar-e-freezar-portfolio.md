# 012-07 — Prototipar e preparar freeze de Portfolio

- **Ticker:** `012`
- **Número:** `07`
- **Status:** `completed`

## Objetivo e resultado esperado

Prototipar a primeira slice de referência: listar ativas/arquivadas, criar,
renomear, arquivar, restaurar, abrir, deep link, vazio, conflito, erro e modo
somente leitura. Resultado: pacote de decisão de Portfolio, sem implementar a
slice.

## Requisitos cobertos

Portfolio lifecycle, IA, estados, a11y, UX mobile e freeze por slice.

## Escopo incluído e excluído

Incluído: intenção, ações, pré-condições, estados, copy, a11y e capability
provisória. Excluído: endpoint final, EF, migration, E2E implementado ou write
no novo stack.

## Dependências

`012-03` a `012-06`; domínio `src/domain/portfolio.ts` e telas `portfolio/*`.

## Arquivos e símbolos prováveis

`docs/architecture/012/slices/portfolio.md`, `PortfolioList`, `PortfolioDetail`,
`PortfolioSettings`, `PortfolioCreateForm`.

## Passos de implementação

1. Criar alternativas de listagem e detalhe em protótipo responsivo.
2. Walkthrough de lifecycle e recovery com carteira arquivada.
3. Definir payload conceitual, erros, retry e dependências de leitura/comando.
4. Verificar critérios de freeze e registrar questões para 017.

## Testes e comandos de validação

Walkthrough em teclado, 320 px, zoom 200%, estados e deep link; validar que
archive não é apresentado como delete.

## Definição de pronto

Pacote de Portfolio contém protótipo, matriz de estados, a11y, copy,
capabilities provisórias e owner de revisão; OpenAPI permanece provisório.

## Riscos e cuidados

Não congelar o contrato HTTP antes do protótipo e não confundir carteira
arquivada legível com carteira mutável.

## Registro da execução

### Status e resultado

`completed` — o pacote de decisão de Portfolio foi produzido em
`docs/architecture/012/slices/portfolio.md`, acompanhado de um protótipo HTML
responsivo independente em `portfolio-prototype.html`. O pacote cobre lista de
ativas/arquivadas, vazio, criação, abertura, deep link, rename, archive,
restore, conflito, erro, resultado desconhecido, somente leitura, a11y, copy,
capabilities provisórias e owner de revisão. Nenhum endpoint, DTO, OpenAPI,
EF, migration, E2E ou write produtivo foi implementado.

### Arquivos alterados

- `docs/architecture/012/slices/portfolio.md` — pacote de decisão, protótipo
  descrito, matriz de estados, walkthrough, copy, a11y, capabilities
  conceituais, freeze semântico, handoff e riscos.
- `docs/architecture/012/slices/portfolio-prototype.html` — protótipo local
  responsivo com as alternativas A/B, fixtures sintéticas e estados de lista e
  detalhe.
- este arquivo — status, execução, decisões, evidências e riscos residuais.
- `docs/tasks/012-product-ux-ui-ia-api-discovery/012-00-overview.md` — checklist,
  progresso e observação da conclusão desta subtarefa.

### Decisões e desvios

- A execução permaneceu documental e sem writes, conforme a spec 012 e o escopo
  da subtarefa. O HTML é um protótipo standalone, não código de produção nem
  contrato de integração.
- Foi escolhida a lista com grupos persistentes de ativas e arquivadas como
  alternativa de referência; o filtro com grupos permanece alternativa para
  validação posterior com volume sintético.
- O freeze semântico trata carteira arquivada como somente leitura para
  operações e metadata writes; restaurar é a exceção explícita de lifecycle.
  Isso é um desvio deliberado do comportamento legado que ainda permite rename
  de arquivada e deve ser validado/enforced em 017.
- Payloads, capabilities e erros foram registrados como conceitos de intenção,
  não como URLs, DTOs ou OpenAPI. Versionamento, idempotência e reconciliação
  física permanecem para 014/015/016/017.
- O walkthrough foi documental com fixtures sintéticas. Não foi declarado
  resultado de navegador, leitor de tela, contraste, 320 px ou zoom 200%; esses
  critérios continuam evidência necessária para 013/017.
- O protótipo usa uma coleção sintética com IDs estáveis: archive/restore mutam
  o mesmo item, deep links resolvem o lifecycle atual e `F-EMPTY` não expõe
  recursos fora da fixture vazia.
- Archive possui diálogo com nome atual, cancelamento, Escape, foco inicial e
  retorno ao originador. Criação/rename preservam o formulário em conflito ou
  resultado desconhecido e exigem revisão explícita antes de nova submissão.

### Comandos executados e resultados

- Conferência da spec, overview, subtarefa, `AGENTS.md`, dependências 012-03 a
  012-06 e baseline de Portfolio — passou; C1 aceito, C0 restrito a dev/testes
  e fixtures sintéticas.
- Conferência de ticker — passou: spec, pasta, overview e as 13 subtarefas usam
  `012`; a subtarefa `012-07` foi selecionada explicitamente pelo caminho
  informado.
- Conferência do overview antes da edição — passou: uma única seção `##
  Checklist`, 13 itens, exatamente um por subtarefa; somente 012-07 foi
  selecionada.
- Conferência de dependências — passou: 012-03, 012-04, 012-05 e 012-06 estão
  `completed`, e os artefatos de IA, recovery, a11y e design system estão
  disponíveis.
- Inspeção read-only do domínio, repositories e componentes legados de Portfolio
  — passou; lifecycle, payloads atuais, read-only, erros e divergências foram
  incorporados como decisões ou riscos do pacote.
- `git diff --check` — passou.
- `git diff --no-index --check /dev/null docs/architecture/012/slices/portfolio.md`
  — passou para o arquivo novo.
- `git diff --no-index --check /dev/null
  docs/architecture/012/slices/portfolio-prototype.html` — passou para o
  protótipo novo.
- Lint, typecheck, build e testes de código — não executados: somente artefatos
  documentais/standalone de discovery foram alterados, e a spec 012 indica que
  esses comandos só são necessários quando uma tarefa altera código de
  produção.
- Walkthrough real em navegador, teclado, leitor de tela, 320 px e zoom 200% —
  não executado; o roteiro e os critérios observáveis estão registrados para a
  validação de 013/017.
- Extração do JavaScript inline e `node --check /tmp/opencode/portfolio-prototype.js`
  — passou.
- Validação estrutural final do protótipo — passou: IDs/lifecycle, `F-EMPTY`,
  archive/restore, diálogo, recovery de conflito/resultado desconhecido,
  timestamp stale e deep links.
- Revisão independente final do subagente `review` — **APROVADO**; não apontou
  correções obrigatórias. Confirmou SDD, links, lifecycle, foco, recovery,
  estados e ausência de freeze HTTP prematuro.

### Resultados e evidências

- `portfolio.md` registra decisões congeladas de intenção: Carteiras como
  workspace, grupos persistentes, archive distinto de delete, restore,
  deep-link seguro e read-only explícito.
- A matriz cobre `loading`, `ready`, `empty`, somente arquivadas, `refreshing`,
  `partial`, `stale`, erro/offline, `unavailable`, `conflict`, `resultado
  desconhecido` e `unauthorized`, com ação, foco e recovery.
- O protótipo local permite alternar as duas alternativas de lista e simular
  `F-EMPTY`, `F-CLARA`, `F-MULTI`, erro, conflito e resultado desconhecido, sem
  chamar API ou persistir dados.
- O pacote separa view model conceitual de DTO/OpenAPI e encaminha owners e
  decisões abertas para 013–017, preservando os invariantes de owner, ID opaco,
  histórico e não repetição cega. As correções da revisão independente foram
  integradas e aprovadas na revisão final.

### Riscos residuais e bloqueios

- Não há bloqueio documental de execução. Read-only para rename em carteira
  arquivada diverge do baseline e precisa de decisão/enforcement na 017.
- Não houve pesquisa com usuários reais nem validação runtime com navegador,
  leitor de tela, contraste, 320 px ou zoom 200%; o protótipo permanece hipótese
  de discovery e não declaração WCAG.
- Concorrência, chave de idempotência, reconciliação de resultado desconhecido,
  URLs, DTOs, paginação e OpenAPI continuam abertos conforme o freeze por slice.

### Handoff

- `013` deve validar primitives, foco, status, confirmação, reflow e semântica
  assistiva.
- `017` deve implementar a slice, testar a alternativa escolhida, decidir
  restore no card versus configurações e provar archive/read-only/conflito.
- `014–016` devem fechar auth/recovery, formatos, compatibilidade e concorrência
  sem copiar o protótipo como contrato físico.
- Não avançar automaticamente para `012-08` ou qualquer outra subtarefa.
