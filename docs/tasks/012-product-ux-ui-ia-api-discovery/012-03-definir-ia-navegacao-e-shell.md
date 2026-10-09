# 012-03 — Definir IA, navegação e shell

- **Ticker:** `012`
- **Número:** `03`
- **Status:** `completed`

## Objetivo e resultado esperado

Transformar as jornadas aprovadas em arquitetura da informação, navegação e shell
conceituais independentes de Next, cobrindo deep links, back/forward, 404, host,
foco, filtros e retorno após login.

## Requisitos cobertos

UX-02, separação público/app e critérios de navegação da 012.

## Escopo incluído e excluído

Incluído: árvore de rotas conceituais, hierarquia, navegação ativa, shell,
parâmetros opacos e host policy. Excluído: implementação de router, proxy,
hosting, autorização ou URL HTTP definitiva.

## Dependências

`012-02`; `src/proxy.ts`, layout protegido e handoff 011-06.

## Arquivos e símbolos prováveis

`docs/architecture/012/information-architecture.md`,
`src/app/(app)/(protected)/layout.tsx`, `src/lib/host-routing.ts`, páginas atuais.

## Passos de implementação

1. Desenhar alternativas de entrada global e carteiras.
2. Definir superfícies pública, autenticação e aplicação.
3. Mapear rotas, deep links, 404, filtros, retorno e foco.
4. Registrar modelo SPA/history e biblioteca de router apenas como decisão
   candidata para 013.

## Testes e comandos de validação

Walkthrough de teclado e URL em protótipo, incluindo host não permitido e query
string; validar links e `git diff --check`.

## Definição de pronto

IA navegável e justificada, com política de host separada de autorização e
handoff claro para a fundação frontend.

## Riscos e cuidados

Não copiar route groups do Next por inércia nem tratar redirect visual como
controle de acesso.

## Registro da execução

### Status e resultado

`completed` — a IA conceitual, a separação de superfícies e o shell aplicado
foram definidos em `docs/architecture/012/information-architecture.md`.
Carteiras foi promovida a entrada autenticada padrão, Visão geral permanece como
consolidado, e foram registrados deep links, history, filtros, foco, 404,
retorno após login e host policy sem congelar URLs, router, DTOs ou autorização.

### Arquivos alterados

- `docs/architecture/012/information-architecture.md` — novo artefato de IA,
  navegação, shell, host policy e handoff.
- `docs/architecture/012/information-architecture-prototype.html` — protótipo
  standalone, independente de Next, para walkthrough de host/path/query, login,
  deep link, foco, navegação ativa e history.
- este arquivo — status, decisões, evidências, validações e riscos.
- `docs/tasks/012-product-ux-ui-ia-api-discovery/012-00-overview.md` — checklist
  e progresso da fase.

### Decisões e desvios

- A implementação foi deliberadamente documental: a spec 012 proíbe código de
  produção, escolha definitiva de router e URL HTTP nesta fase.
- O baseline atual de Next, `src/proxy.ts` e `host-routing.ts` foi usado como
  evidência e não como arquitetura alvo. Foram registrados como gaps futuros a
  perda potencial de query string em redirects, o 404 aplicado apontando para
  dashboard e a ausência de retorno pós-login/foco ativo.
- Filtros, busca e paginação foram mapeados como estado conceitual deferido até
  volume sintético e tarefa medida; não foi criado contrato de query ou API.
- O retorno seguro do app foi alinhado à decisão de Carteiras como entrada padrão,
  sem alterar `src/app/not-found.tsx`.
- Para atender à evidência de walkthrough sem criar código de produção, foi
  criado um protótipo HTML autocontido. Ele é um artefato de discovery e não
  uma implementação do shell alvo.

### Comandos executados e resultados

- Conferência de ticker, formato e seleção — passou: spec, pasta, overview e
  todas as subtarefas usam `012`; `012-03` foi selecionada explicitamente.
- Conferência do overview — passou: existe uma única seção `## Checklist` com
  13 itens, exatamente um por subtarefa; `012-01` e `012-02` estavam concluídas
  antes desta execução.
- Conferência de dependências — passou: `012-02` está `completed` e entrega a
  decisão heurística de Carteiras como entrada e Visão geral como resumo.
- Exploração read-only de `src/app/**`, `src/proxy.ts`,
  `src/lib/host-routing.ts` e do handoff 011 — passou; nenhuma alteração de
  código foi necessária.
- Walkthrough de URL e shell no protótipo standalone — passou na
  autoverificação headless: 19 checks `PASS`, 0 `FAIL`, cobrindo host
  desconhecido, query de filtro, ID opaco, Carteiras como entrada, deep link sem
  sessão, retorno único após login, foco no título, item ativo, refresh, Back,
  Forward, landing pública, `www` canônico, query não permitida e 404 de
  rota/recurso.
- Comando de autoverificação — `chromium --headless --no-sandbox --disable-gpu
  --virtual-time-budget=3000 --dump-dom
  "file:///home/willian/develop/pessoal/reserva-clara/docs/architecture/012/information-architecture-prototype.html?selfTest=1"
  | node -e '...'` — passou; 19 `PASS`, 0 `FAIL`.
- Roteiro de walkthrough de teclado, 404, estados financeiros e viewport está
  documentado no artefato; a validação humana com leitor de tela, 320 px e zoom
  permanece evidência posterior de acessibilidade, não é declarada como feita.
- `git diff --check` — passou após a criação do artefato e dos registros.
- Lint, typecheck, build e testes de código — não executados: não houve alteração
  em `src/` nem código de produção; a spec dispensa esses comandos nesta fase.

### Resultados e evidências

- `information-architecture.md` contém a árvore de superfícies pública,
  autenticação e aplicação; mapa de rotas conceituais; decisão comparada de
  entrada; shell e navegação ativa; regras de history/deep link; filtros;
  política de foco; 404; host policy e handoff para 013, 014 e 017–019.
- `information-architecture-prototype.html` fornece uma superfície executável
  local para validar as transições mínimas, sem dependências npm, Next, API ou
  dados patrimoniais.
- O documento separa explicitamente host routing de autorização e preserva IDs
  opacos, contexto de carteira, archive/read-only, partial/stale/unavailable e
  reconciliação de resultado desconhecido.
- A validação de links foi feita contra os arquivos locais referenciados durante
  a conferência do artefato; não há endpoint, URL definitiva ou dependência npm
  nova para validar.

### Riscos residuais e bloqueios

- Não há bloqueio de execução. A decisão Carteiras versus Visão geral continua
  hipótese heurística sem pesquisa com usuários reais e requer protótipo
  responsivo/tarefa observável.
- Foco, 404, filtros e retorno pós-login ainda não possuem testes React/E2E; o
  smoke test do protótipo não substitui a validação humana com teclado, leitor de
  tela, 320 px e zoom 200%, que fica para 012-04/012-05, 012-06 e 013.
- A política de host pode mudar com hosting, mas não pode ser promovida a
  boundary de autorização; o router, nomes físicos de query params e contratos
  HTTP permanecem decisões posteriores.

### Handoff

- `012-04` deve transformar retorno pós-login, sessão expirada, refresh único e
  resultado desconhecido em estados e recovery testáveis.
- `012-05`/`012-06` devem validar foco, navegação ativa, 320 px, zoom 200%,
  leitor de tela, contraste e descoberta de diagnósticos.
- `012-07` consome Carteiras como workspace e `012-09` consome o contexto de
  carteira e o vocabulário “Registrar operação”.
- `013` deve comparar router/history e construir o shell sem transportar route
  groups ou host policy como autorização.
- `014` deve fechar a fronteira entre Auth UX, host/CORS/redirect e autorização
  por token; `017–019` devem derivar capabilities das tarefas aprovadas.
- Não avançar automaticamente para `012-04` ou qualquer outra subtarefa.
