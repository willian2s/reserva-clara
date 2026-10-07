# 012-01 — Confirmar gate e escopo de discovery

- **Ticker:** `012`
- **Número:** `01`
- **Status:** `blocked`

## Objetivo e resultado esperado

Confirmar a entrada operacional da fase, o aceite independente de C1, o limite
de C0 e a matriz de evidências. Resultado: plano de discovery liberado ou
explicitamente bloqueado, com decisões abertas e owners de revisão.

## Requisitos cobertos

- Critérios 1 e 10 da spec 012.
- Gate C1, contenção C0 e regra de não usar dados reais.

## Escopo incluído e excluído

Incluído: revisar handoff 011, registrar pré-condições, matriz manter/alterar,
experimentos e critérios de freeze. Excluído: protótipo, código, API, banco,
migração, deploy e aceite fictício de C1.

## Dependências

`docs/architecture/011/adr-register-and-handoff.md`, revisão independente de C1,
spec 012 e roadmap canônico.

## Arquivos e símbolos prováveis

`docs/architecture/012/decision-matrix.md`, overview/spec 012, C0/C1, ADRs 015,
016 e 021, handoff `frontend-ux-contract-discovery.md`.

## Passos de implementação

1. Conferir que 011 está documentalmente concluída e que C1 tem aceite formal.
2. Registrar C0, dados permitidos, owner e condição de saída.
3. Classificar decisões como preservar, experimentar, decidir na 012 ou deferir.
4. Publicar matriz de evidências, dependências e bloqueios.

## Testes e comandos de validação

Conferir links/tickers/statuses e executar `git diff --check`; não executar
experimentos com dados reais nem declarar C1 aceito sem evidência independente.

## Definição de pronto

Gate e escopo têm evidência, owners, bloqueios e critérios explícitos; a próxima
subtarefa elegível é a descoberta de jornadas.

## Riscos e cuidados

Não transformar o planejamento em aceite operacional, não ampliar C0 para
staging/produção e não tratar ADRs `proposed` como decisões implementadas.

## Registro da execução

### Status e resultado

`blocked` — o gate C1 está documentalmente pronto para revisão independente,
mas não há aceite formal independente neste checkout. C0 foi confirmado como
ativo somente em dev/testes com dados sintéticos/descartáveis. A execução de
UX-01 e das demais experiências da 012 permanece bloqueada até o aceite de C1.

### Arquivos alterados

- `docs/architecture/012/decision-matrix.md` — matriz de gate, limites de C0,
  classificações de decisão, evidências, freeze, owners e bloqueios.
- este arquivo — status, resultado, evidências, decisões, validações e riscos.
- `docs/tasks/012-product-ux-ui-ia-api-discovery/012-00-overview.md` —
  observação do bloqueio; checklist e progresso permanecem inalterados.

### Decisões e desvios

- C1 não foi promovido a aceito: o handoff 011 afirma apenas “pronto para
  revisão independente”.
- C0 permanece restrito a dev/testes, fixtures sintéticas/descartáveis e owner
  maintainer; staging, produção, dados reais, migração, deploy e cutover ficam
  fora.
- Invariantes patrimoniais e boundaries de segurança foram classificados como
  preservados; IA, jornadas, a11y, shell, lifecycle de Asset e arquitetura
  frontend continuam dependentes de evidência da 012.
- URLs, DTOs, OpenAPI, schema e implementação foram deferidos; nenhuma ADR
  `proposed` foi tratada como decisão implementada.
- Desvio operacional: a subtarefa não libera a próxima tarefa porque o critério
  de entrada independente de C1 ainda não foi satisfeito.

### Comandos executados e resultados

- `functions.glob`/`functions.read` — passaram na conferência do ticker `012`,
  spec, overview, 13 subtarefas, AGENTS.md, roadmap, handoff 011 e ADRs
  relevantes.
- Conferência manual da seção `## Checklist` — passou: existe uma única seção
  no overview, com 13 itens, um por subtarefa, todos ainda `[ ]`.
- Conferência documental de status e dependências — passou; C1 ficou explícito
  como `blocked`, sem aceite fictício.
- `git diff --check` — passou.
- Primeira validação inline de contagem — falhou por incluir o arquivo de
  overview na glob de subtarefas; foi um erro do verificador, não do conteúdo.
  O comando foi corrigido para excluir `012-00-overview.md`.
- Validação de links/tickers/statuses — passou para os arquivos alterados e
  referências normativas da matriz.
- Lint, typecheck, build e testes de código — não executados: a subtarefa altera
  somente Markdown e a spec 012 dispensa esses comandos quando não há código.

### Resultados e evidências

- A matriz documenta C0 ativo e C1 pronto para revisão, mas não aceito.
- A matriz separa preservar, experimentar, decidir na 012 e deferir, com owner
  e evidência de saída para cada grupo.
- Os limites de dados e ambientes impedem usar dados reais ou executar writes
  patrimoniais fora de C0.
- Os critérios de freeze exigem protótipo, estados críticos, a11y,
  responsividade, erros, retry, dependências e decisões abertas por slice.
- Revisão independente `review` — **APROVADO**, sem bloqueadores ou achados;
  confirmou ticker, checklist 0/13, C0 restrito, C1 sem aceite fictício,
  owners, evidências, bloqueios, freeze e ausência de escopo produtivo.

### Riscos residuais e bloqueios

- **Bloqueio atual:** falta registrar o aceite independente de C1 com revisor,
  escopo, evidência, data e condições.
- A fragilidade histórica de `SELL` continua aceita somente no C0 restrito; não
  foi exercitada nem corrigida nesta subtarefa.
- Não há pesquisa com usuários reais; decisões de Produto/UX dependerão de
  walkthroughs e fixtures sintéticas, com hipóteses e risco residual explícitos.
- ADRs 015, 016 e 021 permanecem `proposed` e dependem das evidências futuras
  da 012 e das slices 017–019.

### Handoff

- Após o aceite independente de C1, a próxima subtarefa é `012-02`, para UX-01,
  mantendo a restrição de C0.
- `012-03` em diante não deve ser iniciada automaticamente nesta entrega.
- A 013 pode preparar somente tooling não acoplado, sem congelar capacidades,
  DTOs ou contratos que a 012 ainda possa alterar.
