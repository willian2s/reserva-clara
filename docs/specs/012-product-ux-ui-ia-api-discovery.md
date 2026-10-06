# 012 — Product, UX/UI, Information Architecture & Provisional API Discovery

## Status

`pending`

## Ticker

`012`

## Contexto e objetivo

A fase 011 concluiu o baseline documental da migração e entregou o handoff de
frontend, UX e contratos provisórios. A aplicação real ainda é um único Next.js
com dados patrimoniais acessados por repositories Firestore no browser; as telas
de Portfolio, Asset, Transaction, Quotes e dashboards cresceram
incrementalmente, sem validação consolidada de arquitetura da informação,
acessibilidade ou jornadas.

Esta fase deve descobrir e justificar como o produto ajuda o usuário a entender
e gerenciar seu patrimônio antes que as verticais sejam implementadas no novo
stack. Não é uma modernização visual mecânica nem uma implementação de Vite,
ASP.NET Core, API, banco, migração ou deploy.

O resultado deve conectar Produto/UX/UI/IA às capacidades provisórias da API,
sem congelar URLs, DTOs ou OpenAPI antes dos protótipos e dos critérios de
acessibilidade da slice correspondente.

> A antiga proposta de fase 012, “Snapshots & Wealth History”, foi sucedida
> pelo rebaseline oficial 011–021. Este documento planeja a fase 012 atual de
> Product, UX/UI, IA e descoberta de API; histórico de snapshots não entra nesta
> fase.

## Requisitos e critérios de aceite

### Requisitos

- Confirmar o aceite independente de C1 antes da execução dos experimentos e
  manter C0 limitado a dev/testes com dados sintéticos/descartáveis.
- Cobrir as jornadas de login/sessão, shell/navegação, Portfolio, Asset,
  Transaction, Quotes, Portfolio detail, consolidado e estados transversais das
  fases 001–010.
- Avaliar a IA atual sem presumir que `/dashboard` seja a melhor entrada; decidir
  o que manter, simplificar, reorganizar, substituir, remover ou dividir.
- Produzir protótipos responsivos e walkthroughs com sucesso, vazio, loading,
  refresh, erro, parcial, stale, unavailable, offline, conflito, sessão expirada
  e modo somente leitura quando aplicável.
- Validar teclado, foco, leitor de tela, contraste, 320 px e zoom de 200%, além
  de linguagem financeira que não confunda custo, patrimônio conhecido, aporte ou
  performance histórica inexistente.
- Definir princípios de shell, navegação, design system, componentes,
  formulários, estado de servidor, estado de formulário, sessão e recovery sem
  introduzir dependência produtiva nesta fase.
- Decidir a política de lifecycle de Asset referenciado sem trocar `assetId`,
  reescrever Transactions, fazer cascade ou permitir mutação silenciosa.
- Mapear capacidades provisórias da API por intenção de produto, erros
  sanitizados, retry/idempotência e compatibilidade N/N-1; preservar owner
  derivado do token, IDs opacos, decimais como strings e estados financeiros
  discriminados.
- Entregar pacotes de decisão por slice e handoff acionável para 013–019.

### Critérios de aceite da fase

1. C1 foi aceito formalmente, ou a execução está explicitamente marcada como
   bloqueada; nenhuma evidência usa dados reais ou writes fora do escopo de C0.
2. Existe mapa de jornadas e IA aprovado, com decisão justificada sobre a entrada
   global versus carteiras e sobre a navegação pública/aplicada.
3. Cada jornada crítica possui protótipo ou artefato equivalente, cenários,
   estados, copy, ações e dependências de dados registrados.
4. A matriz de acessibilidade cobre teclado, foco, contraste, leitor de tela,
   320 px e zoom de 200%, com achados priorizados e critérios observáveis.
5. Os conceitos “custo de aquisição remanescente”, “patrimônio conhecido”,
   “stale”, “unavailable”, “partial” e “sem performance histórica” não são
   semanticamente confundidos.
6. A decisão de Asset usado, os fluxos de Transaction e a política de sessão
   expirada contemplam conflito, resultado desconhecido e não repetição cega de
   writes não idempotentes.
7. A arquitetura frontend recomendada separa UI, casos de uso/capabilities,
   cliente HTTP, autenticação e domínio, sem Firestore/PostgreSQL/BRAPI no
   browser alvo e sem store global de negócio obrigatório.
8. O catálogo provisório de capacidades, erros e estados da API é rastreável aos
   protótipos; nenhum endpoint, DTO final ou schema de persistência foi congelado
   por inércia da UI legada.
9. Cada pacote de freeze informa intenção, dados, estados, erros, retry,
   acessibilidade, dependências e decisão aberta; o freeze HTTP definitivo fica
   para a implementação da vertical em 017–019.
10. O handoff identifica decisões para 013, 014, 015, 016, 017, 018 e 019,
    riscos residuais, owners de revisão e evidências necessárias.

## Comportamento atual encontrado

- Rotas principais: `/login`, `/dashboard`, `/assets`, `/portfolios`,
  `/portfolios/[portfolioId]`, `/portfolios/[portfolioId]/transactions` e
  `/portfolios/[portfolioId]/settings`.
- O shell protegido usa `AuthGate`, links de `next/link`, logo não clicável,
  navegação sem item ativo explícito e não apresenta logout visível.
- A entrada pós-login é o dashboard global, mas não há validação de que essa é a
  melhor primeira tarefa para todos os perfis.
- Portfolio suporta criar, renomear, arquivar, restaurar e ler; arquivada mantém
  histórico e bloqueia novos lançamentos.
- Asset é owner-scoped, reutilizável entre carteiras e identificado por
  `symbol`, `market`, `assetType` e `currency`; edição e exclusão são feitas no
  catálogo global, com bloqueio de exclusão quando há Transactions.
- Transaction aceita `buy`/`sell`, quantidade, preço, moeda, data civil e taxa
  opcional; o formulário usa máscara brasileira, idempotência/reconciliação
  client-side e não permite editar/excluir fatos.
- Positions, allocation e dashboards são derivados; `partial`, `stale`,
  `unavailable` e valores conhecidos já aparecem em componentes financeiros, mas
  a taxonomia não é transversal nem automatizada por testes de UI.
- Quotes são buscadas por `POST /api/quotes` no Route Handler Next; o browser
  ainda lê Firestore diretamente e compõe vários read models client-side.
- Não há testes React, componentes, E2E ou acessibilidade automatizada; existem
  testes `node:test` de domínio, posições, dashboard, Quotes e Rules, além de
  lint, typecheck após typegen e build.
- Os contratos atuais de repositories, Firestore Rules e `/api/quotes` são
  baseline legado, não o contrato alvo. A autoridade patrimonial continua sendo
  o ledger até o cutover futuro.

## Abordagem escolhida

1. Trabalhar em discovery documental e prototipação progressiva, começando pelo
   gate C1, pelas jornadas e pela IA, e só depois pelos contratos provisórios.
2. Usar Portfolio como primeira slice de referência, Assets/Transactions como
   unidade de integridade e Quotes/Positions/Dashboards como slice de leitura
   posterior.
3. Tratar a IA como orientada a tarefas, testando carteiras como espaço de
   trabalho e o consolidado como resumo, sem assumir essa recomendação antes do
   experimento.
4. Recomendar SPA com navegação por history, parâmetros opacos e host policy
   fora do router; a biblioteca concreta e o fallback de hosting ficam para 013/020.
5. Organizar o frontend por feature/capability; manter estado de formulário e
   interação local, estado de servidor em cache de memória isolado por owner e
   evitar store global de negócio. TanStack Query ou alternativa equivalente é
   apenas candidata até o spike comparativo.
6. Manter Firebase Web apenas para Auth no alvo, com ID Token para a API; o
   browser não acessa Firestore/PostgreSQL/Admin/BRAPI.
7. Preservar strings decimais, datas civis, timestamps com precisão, IDs opacos,
   archive/restore, append-only e a distinção entre stale, unavailable e partial.
8. Congelar na 012 intenção, semântica, estados, erros e políticas de retry por
   slice; deixar URLs, DTOs completos, OpenAPI final, paginação física e schema
   EF/PostgreSQL para as fases de implementação.

## Alternativas descartadas

| Alternativa | Motivo |
| --- | --- |
| Transportar App Router, repositories Firestore e `src/proxy.ts` para Vite | Preserva acoplamento ao Next, ao banco no browser e confunde host routing com autorização. |
| Redesenhar apenas cores, cards e tipografia | Não resolve IA, linguagem, estados, acessibilidade, formulários ou compreensão patrimonial. |
| Congelar API global a partir das telas/repositórios atuais | Orienta o contrato por schema Firestore e overfetch antes de validar a intenção. |
| Escolher store global ou cache persistente por hábito | Mistura sessão, estado de servidor, formulário e owners, aumentando acoplamento e risco de vazamento. |
| Permitir hard delete/cascade ou trocar `assetId` após uso | Quebra histórico, referências e reconciliação; contradiz o ledger como fonte da verdade. |
| Implementar offline/optimistic writes financeiros na descoberta | Não existe ainda contrato confiável para reconciliação de writes e concorrência. |
| Implementar Vite/.NET, banco, migrations ou deploy nesta fase | Anteciparia decisões e violaria a fronteira da 012 e os gates C2–C7. |
| Retomar “Snapshots & Wealth History” como fase 012 | É proposta histórica sucedida; snapshots exigem semântica de aportes/caixa e pertencem ao backlog pós-migração. |

## Arquivos, módulos e contratos afetados

### Documentação nova ou revisada

- Esta spec, o overview e as subtarefas em `docs/tasks/012-product-ux-ui-ia-api-discovery/`.
- Artefatos de discovery sob `docs/architecture/012/`, incluindo mapa de jornadas,
  IA, matriz a11y, protótipos/links, decisões frontend e catálogo provisório de
  capacidades.
- Revisão das ADRs `015` (frontend/data layer), `016` (HTTP/compatibilidade) e
  `021` (lifecycle de Asset), mantendo `proposed` quando faltar evidência de
  implementação.

### Código e módulos inspecionados; não alterar como parte desta fase

- `src/app/(app)/(protected)/layout.tsx`, páginas protegidas e `src/proxy.ts`.
- `src/components/auth/*`, `dashboard/*`, `portfolio/*`, `asset/*`,
  `transaction/*` e `financial/*`.
- `src/domain/{portfolio,asset,transaction,position-engine,market-position,allocation,portfolio-summary}.ts`.
- `src/data/firestore/*`, `src/data/positions/*`, `src/data/quotes/quote-client.ts`.
- `src/app/api/quotes/route.ts` e `src/server/quotes/*`.
- `src/app/globals.css`, `src/components/ui/*` e `package.json`.

### Contratos preservados ou encaminhados

- `Transaction` é fato; Position, valuation, allocation e dashboard são
  reconstruções derivadas.
- Owner vem do token verificado; o cliente não escolhe `uid`, `ownerId` ou
  provider; recurso de outro owner pode ser indistinguível de inexistente.
- IDs de Portfolio, Asset e Transaction permanecem opacos e estáveis.
- Decimal, moeda, data civil e precisão temporal não podem ser reduzidos a
  `number`, `double` ou `Date` como fonte autoritativa.
- Quotes são externas, backend-only no alvo; stale não é fresh e unavailable não
  é zero.
- C0 continua restrito a dev/testes sintéticos até a saída definida na 011.

## Riscos e mitigação

| Risco | Mitigação |
| --- | --- |
| Redesign baseado apenas na implementação atual | Walkthroughs com tarefas e perfis, comparação de alternativas e decisão rastreável. |
| Protótipos sem estados financeiros difíceis | Fixtures sintéticas com partial, stale, unavailable, moeda incompatível, nomes longos e erros. |
| Contrato orientado pela tela antiga | Mapear intenção → capability; revisar API somente depois do protótipo e manter URLs/DTOs provisórios. |
| Escolha prematura de router, cache ou biblioteca | Spike comparável e critérios de testabilidade, isolamento por owner, invalidação, bundle e complexidade. |
| Confusão entre custo, patrimônio, aporte e performance | Teste de linguagem, termos proibidos e copy explícita; não introduzir histórico sem fonte confiável. |
| Repetição de Transaction após 401 ou timeout | Resultado desconhecido, chave idempotente estável e reconciliação explícita; nunca retry cego não idempotente. |
| Asset usado editado ou apagado de modo destrutivo | Decisão de archive/retire e estabilidade de ID na 012; enforcement e locks ficam em 016/018. |
| Declaração falsa de conformidade a11y | Registrar achados, severidade e evidência por viewport/tecnologia; implementação e testes automatizados ficam em 013+. |
| C0 evoluir para uso real | Gate inicial, owner maintainer, dados descartáveis e bloqueio explícito de staging/produção/cutover. |
| Escopo visual infinito | Limitar a jornadas 001–010, critérios de aceite e pacotes de freeze; deixar gráficos e otimizações para slices futuras. |

## Estratégia de testes e validação

- Revisão independente do aceite de C1 e conferência do limite C0 antes da
  execução de qualquer experimento.
- Walkthroughs documentados para login/sessão, shell, Portfolio, Asset,
  Transaction, Quotes, detalhe e consolidado, usando somente fixtures sintéticas.
- Avaliação heurística e testes de protótipo com tarefas observáveis, incluindo
  localização, compreensão, recuperação de erro e confirmação de ação.
- Auditoria de teclado sem mouse, foco inicial e após erro, leitor de tela,
  contraste, viewport de 320 px, zoom de 200% e nomes/números longos.
- Testes de copy para diferenciar custo, patrimônio conhecido, dados parciais,
  stale/unavailable e ausência de performance histórica.
- Tabletop de 401 em read, write idempotente e write não idempotente; verificar
  um único refresh, logout e retorno à origem.
- Spike descartável de leitura e formulário com API falsa para comparar data
  layer, cache, invalidação, auth provider, isolamento por owner e testabilidade.
- Matriz capability → intenção → dados → estado → erro → retry → dependência,
  revisada contra os protótipos antes do freeze de cada slice.
- Validação documental de links, tickers, checklist e ausência de afirmações de
  implementação futura como se fossem executadas.
- Comandos de documentação: `git diff --check`; inspeção de Markdown e links.
  Os comandos de código da baseline (`npm run lint`, `npm exec next typegen &&
  npx tsc --noEmit`, `npm run build` e testes existentes) só são necessários se
  uma tarefa alterar código, o que não é esperado na 012.

## Ordem das subtarefas

1. `012-01-confirmar-gate-e-escopo.md` — C1, C0, evidências e matriz de decisões.
2. `012-02-mapear-jornadas-e-problemas-de-produto.md` — UX-01 e tarefas centrais.
3. `012-03-definir-ia-navegacao-e-shell.md` — UX-02 e navegação conceitual.
4. `012-04-definir-estados-sessao-e-recovery.md` — UX-05, estados e reautenticação.
5. `012-05-auditar-acessibilidade-densidade-e-microcopy.md` — UX-03, UX-04,
   UX-09 e A11Y-01.
6. `012-06-revisar-design-system-e-componentes.md` — tokens, primitives e
   boundaries visuais.
7. `012-07-prototipar-e-freezar-portfolio.md` — primeira slice de referência.
8. `012-08-decidir-lifecycle-de-asset.md` — UX-06 e ADR 021.
9. `012-09-prototipar-transaction-e-ledger.md` — UX-07/UX-08 e integridade.
10. `012-10-prototipar-quotes-valuation-e-dashboard.md` — UX-03/UX-04/OBS-01.
11. `012-11-realizar-spike-frontend-e-data-layer.md` — UX-10 e ADR 015.
12. `012-12-mapear-api-provisoria-e-compatibilidade.md` — API-01–API-04 e ADR 016.
13. `012-13-consolidar-freezes-e-handoff.md` — pacotes finais e handoff 013–019.

As subtarefas 02 e 05 podem compartilhar evidências depois que 01 liberar a
execução; 06 pode ocorrer em paralelo à consolidação de estados. 07 deve
preceder os freezes de API de Portfolio. 08 e 09 são dependentes entre si para
explicar referências e operações. 10 depende da linguagem aprovada. 11 e 12
dependem dos protótipos; 13 fecha somente com todas as evidências.

## Premissas explícitas

- O ticker da fase solicitada é `012`; não existe arquivo 012 anterior neste
  checkout e nenhuma tarefa existente será sobrescrita.
- C1 pode ser aceito depois deste planejamento; enquanto isso, a execução das
  subtarefas fica `pending`/bloqueada pelo gate, sem simular evidência.
- A fase não cria código de produção, dependência npm, protótipo executável
  obrigatório, banco, migration, endpoint, deploy, Rules ou configuração externa.
- “IA” neste documento significa arquitetura da informação, não inteligência
  artificial generativa.
- Firebase Authentication permanece a identidade; a decisão futura não pode
  transformar AuthGate, host routing ou CORS em autorização de dados.
- A 013 pode preparar tooling em paralelo apenas se não congelar requisitos,
  DTOs, URLs ou decisões que a 012 ainda possa alterar.
- OpenAPI e contratos HTTP finais serão congelados por vertical em 017–019, após
  os pacotes de decisão desta fase e os gates de autenticação/compatibilidade.
- Não há pesquisa com usuários reais disponível; quando não houver validação
  externa, a spec registra a hipótese, o experimento e o risco residual.

## Handoff esperado

- **013:** IA, shell, router conceitual, organização por feature, data layer,
  estados, design system, validação e requisitos de testes.
- **014:** jornada de sessão, refresh único, logout, CORS/host, erros sanitizados
  e limites entre Auth UX e autorização.
- **015:** invariantes, formatos canônicos, erros e fixtures/golden masters que a
  UI não pode degradar.
- **016:** queries orientadas por jornadas, lifecycle, ordenação, precisão e
  requisitos de constraints sem copiar coleções Firestore.
- **017:** pacote de freeze da slice Portfolio com protótipo, estados, a11y e
  capability provisória.
- **018:** decisão de Asset referenciado, Transaction append-only, idempotência,
  conflito, resultado desconhecido e concorrência esperada na UX.
- **019:** estados e hierarquia de Quotes, valuation, posições, partial/stale/
  unavailable, dashboards, telemetria e performance percebida.
