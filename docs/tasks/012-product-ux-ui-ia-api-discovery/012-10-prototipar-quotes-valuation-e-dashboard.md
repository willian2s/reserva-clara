# 012-10 — Prototipar Quotes, valuation e dashboard

- **Ticker:** `012`
- **Número:** `10`
- **Status:** `completed`

## Objetivo e resultado esperado

Definir como o usuário interpreta Quotes, posições, alocação, valor conhecido e
consolidado, cobrindo fresh/stale/unavailable, timeout, rate limit, moeda
incompatível, parcial, arquivada fora do global e refresh.

## Requisitos cobertos

UX-03, UX-04, OBS-01, `valuation/portfolio`, `valuation/global` e `quote/read`
como capacidades provisórias.

## Escopo incluído e excluído

Incluído: hierarquia, copy, gaps, estados, refresh e telemetria percebida.
Excluído: BRAPI, cache, posições C#, read model persistido, performance final e
contratos do endpoint legado.

## Dependências

`012-05`, `012-07`, `012-09`, componentes financeiros, `portfolio-summary.ts` e
handoff de Quotes/Positions da 011.

## Arquivos e símbolos prováveis

`docs/architecture/012/slices/valuation-and-dashboard.md`, `GlobalDashboard`,
`PortfolioDetail`, `KnownAmountCard`, `QuoteCoverageCard`, `PositionTable`.

## Passos de implementação

1. Prototipar detalhe e consolidado com dados sintéticos parciais.
2. Testar stale, unavailable, timeout, moeda incompatível e carteira indisponível.
3. Definir linguagem para custo, patrimônio conhecido e ausência de histórico.
4. Encaminhar queries, limites e métricas para 019 sem persistir Position.

## Testes e comandos de validação

Walkthrough de compreensão e recuperação; confirmar que indisponível não vira
zero, stale não parece fresh e arquivadas não entram no consolidado.

## Definição de pronto

Pacote de leitura com protótipos, estados, copy, gaps, refresh e capability
provisória, rastreável aos invariantes de domínio.

## Riscos e cuidados

Não chamar cotação de garantia, não exibir performance histórica sem snapshots e
não transformar um read model em fonte autoritativa.

## Registro da execução

### Status e resultado

`completed` — o pacote semântico de Quotes, valuation e dashboard foi produzido em
[`docs/architecture/012/slices/valuation-and-dashboard.md`](../../architecture/012/slices/valuation-and-dashboard.md), acompanhado de um protótipo HTML standalone em
[`valuation-and-dashboard-prototype.html`](../../architecture/012/slices/valuation-and-dashboard-prototype.html).
O pacote cobre Visão geral e detalhe, hierarquia, fixtures sintéticas, patrimônio
conhecido, custo de aquisição remanescente, allocation, cobertura de cotações,
fresh/stale/unavailable, timeout, rate limit, moeda incompatível, parcial,
carteira indisponível, arquivada fora do global, refresh, telemetria percebida,
capabilities provisórias e handoff para 019. Não houve alteração de produção,
endpoint, cache, BRAPI, persistência ou contrato HTTP.

### Arquivos alterados

- `docs/architecture/012/slices/valuation-and-dashboard.md` — freeze semântico,
  hierarquia, copy, estados, queries, limites, refresh, telemetria, a11y,
  handoff e riscos.
- `docs/architecture/012/slices/valuation-and-dashboard-prototype.html` — protótipo
  local responsivo com alternância de superfície e nove cenários sintéticos,
  tabela semântica, diagnóstico visível, foco e refresh simulado.
- este arquivo — status, execução, decisões, evidências, riscos e handoff.
- `docs/tasks/012-product-ux-ui-ia-api-discovery/012-00-overview.md` — item do
  checklist, progresso e observação da conclusão.

Nenhum arquivo em `src/`, endpoint legado, dependência, segredo ou configuração
externa foi alterado.

### Decisões e desvios

- A execução permaneceu documental e standalone, conforme o limite da spec 012.
  O HTML simula dados localmente e não é componente de produção, fonte de dados,
  contrato ou persistência.
- A Visão geral foi mantida como consolidado nomeado, não como entrada
  autenticada obrigatória: Carteiras continua sendo o workspace recomendado.
  O consolidado usa somente carteiras ativas; detalhe arquivado é legível,
  somente leitura e não oferece Registrar operação.
- A hierarquia coloca patrimônio conhecido, custo de aquisição remanescente e
  estado antes de distribuição, posições e diagnósticos. `partial`, `stale` e
  `unavailable` são expostos com texto e ação; indisponível nunca vira zero.
- A cobertura é explicitamente contagem de cotações, não percentual patrimonial.
  Stale continua utilizável, porém datada; timeout/rate limit/moeda incompatível
  permanecem causas distintas e não prometem preço ou conversão cambial.
- Capabilities, queries, limites e erros são intenções provisórias encaminhadas
  a 019/016/015. Não foram congelados URL, DTO, OpenAPI, lote 20, cache, TTL,
  provider ou Position persistida.
- O walkthrough é heurístico com fixtures descartáveis. Não foi declarado
  resultado de navegador, leitor de tela, contraste, 320 px ou zoom de 200%.

### Comandos executados e resultados

- Conferência da spec, overview, subtarefa, `AGENTS.md`, dependências `012-05`,
  `012-07`, `012-09`, baseline de 011 e componentes/domínio financeiro — passou;
  C1 aceito, C0 restrito a dev/testes e fixtures sintéticas.
- Conferência de ticker — passou: spec, pasta, overview e as 13 subtarefas usam
  `012`; a subtarefa `012-10` foi selecionada explicitamente pelo caminho
  informado.
- Conferência do overview — passou antes da edição: uma única seção `## Checklist`
  com 13 itens, exatamente um por subtarefa; somente `012-10` foi alterado nesta
  execução.
- `git diff --check` — passou.
- `git diff --no-index --check /dev/null docs/architecture/012/slices/valuation-and-dashboard.md`
  e o mesmo comando para o protótipo — passaram.
- Extração do JavaScript inline e `node --check
  /tmp/opencode/valuation-and-dashboard-prototype.js` — passou.
- Assertions estruturais do protótipo — passaram para as superfícies, nove
  cenários, copy de zero/partial/stale/unavailable, tabela com cabeçalhos e
  refresh por escopo.
- Matriz comportamental em mock DOM — passou para global/detalhe, Clara/Aurora,
  carteira indisponível, partial sem valor conhecido, stale com contagem por
  carteira, moeda incompatível separada de unavailable, arquivada fora do global,
  detalhe arquivado e allocation de 100% no detalhe unitário.
- `npm run test:positions-read` — passou: 9/9.
- `npm run test:dashboard-read` — passou: 8/8.
- `npm run test:financial-presentation` — passou: 6/6.
- `npm run test:domain` — passou: 14/14.
- `npm run test:quotes-service` — passou: 8/8.
- `npm run test:quotes-adapter` — passou: 7/7.
- `npm run test:quotes-route` — passou: 8/8.
- Lint, typecheck e build — não executados: somente Markdown e HTML standalone de
  discovery foram alterados; a spec 012 dispensa esses comandos quando não há
  código de produção alterado.
- Walkthrough real em navegador, teclado, leitor de tela, contraste, viewport de
  320 px e zoom de 200% — não executado; critérios e evidência exigida ficam no
  handoff para 013/019.
- Revisão independente final do subagente `review` — **APROVADO**; confirmou
  isolamento dos modelos global/detalhe, consistência das fixtures, foco,
  announcer, layout mobile, SDD, links, escopo documental e honestidade sobre a
  validação de acessibilidade ainda pendente.

### Resultados e evidências

- O documento registra a ordem Visão geral → distribuição/atenção → detalhe →
  diagnóstico e separa explicitamente custo, patrimônio conhecido, cotação,
  cobertura, stale, unavailable, partial e ausência de performance histórica.
- O protótipo alterna `F-READY`, `F-PARTIAL`, `F-STALE`, `F-TIMEOUT`,
  `F-RATE-LIMITED`, `F-CURRENCY`, `F-PORTFOLIO-UNAVAILABLE`, `F-ARCHIVED` e
  `F-REFRESH` em Visão geral e detalhe.
- O modelo sintético separa o consolidado de Clara/Aurora do detalhe selecionado;
  o detalhe unitário calcula allocation de 100%, totais conhecidos somente com
  linhas compatíveis e cobertura pelo número real de rows.
- A tabela mantém posição/ledger legíveis quando o valor corrente está
  indisponível; o diagnóstico identifica timeout, rate limit ou moeda
  incompatível e declara que a lacuna não foi considerada zero.
- A fixture arquivada não aparece no consolidado ativo e, no detalhe, exibe
  somente leitura sem Registrar operação. A fixture de carteira indisponível
  mantém a entrada no diagnóstico global e não a transforma em carteira vazia.
- O refresh simulado mantém snapshot e anuncia escopo; o pacote encaminha
  request identity, duração agrupada e causa redigida como telemetria percebida,
  sem preço, quantidade, ID, UID, token ou payload financeiro.

### Riscos residuais e bloqueios

- Não há bloqueio documental de execução.
- Não houve pesquisa com usuários, execução real com navegador/tecnologia
  assistiva, medição de contraste, teste concorrente nem medição de payload e
  performance. O protótipo é hipótese de discovery, não declaração WCAG.
- O baseline de produção ainda modela apenas `loading/ready/refreshing/error` de
  forma transversal e mantém diagnósticos importantes em `<details>`; 013/019
  precisam tornar partial/stale/unavailable, foco, live region e tabela
  testáveis.
- Frescor/TTL, política stale-if-error, retry de rate limit, conversão cambial,
  paginação, lote/cache, formato HTTP e reconciliação continuam decisões de
  implementação. O read model não é fonte autoritativa.

### Handoff

- `013` deve validar foco, live regions, tabela, densidade, 320 px, zoom de 200%
  e leitor de tela.
- `015/016` devem preservar formatos canônicos, owner, estados discriminados,
  queries orientadas por intenção, erros sanitizados e compatibilidade sem copiar
  o HTML como DTO.
- `017/018` devem integrar lifecycle arquivado e ledger append-only sem tratar
  Position como write ou apagar fatos.
- `019` deve fechar a implementação da slice, query/limites, frescor, retry,
  telemetria e contrato somente após validar as evidências do protótipo.
- Não avançar automaticamente para `012-11` ou qualquer outra subtarefa.
