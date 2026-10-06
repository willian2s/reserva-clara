# 011-06 — Preparar handoff de UX, arquitetura frontend e contratos provisórios

- **Ticker:** `011`
- **Número:** `06`
- **Status:** `pending`

## Objetivo e resultado esperado

Preparar o handoff técnico para a descoberta de Produto, UX/UI, arquitetura de
informação e frontend da fase 012. O resultado consolida o baseline técnico atual,
os acoplamentos já encontrados, os problemas conhecidos, as restrições da futura
arquitetura React/Vite e as perguntas que a 012 precisa investigar.

Esta subtarefa não executa a descoberta substantiva da 012. Pode registrar
capacidades e contratos HTTP deliberadamente provisórios para orientar a
investigação, mas não fecha decisões de produto, UX/UI, arquitetura frontend,
DTOs ou endpoints.

## Requisitos cobertos

- Inventário descritivo de navegação, IA, dashboards, carteiras, ativos e
  transações atuais, sem revisão substantiva de UX/UI.
- Baseline técnico de estrutura por feature/domínio, components/hooks/services,
  HTTP, state/cache e validação.
- Acoplamentos Next.js já encontrados em 011-01 e problemas conhecidos da
  arquitetura frontend atual.
- Jornadas que obrigatoriamente precisam ser revisitadas na 012 e suas
  dependências com capacidades da API.
- API independente de framework e contratos ajustáveis após a descoberta da 012.

## Escopo

### Incluído

- Registro descritivo das jornadas 001–010, componentes e estados já
  observados, sem redesenhar seus fluxos.
- Consolidação do baseline de frontend e dos acoplamentos Next.js inventariados
  em 011-01.
- Problemas conhecidos de arquitetura frontend, restrições técnicas relevantes
  para React/Vite e hipóteses que ainda dependem da 012.
- Lista de jornadas, perguntas e pontos de investigação obrigatórios para a
  012, incluindo dependências entre UX e API.
- Mapa preliminar de jornada/capacidade/API, exemplos ilustrativos de sucesso/
  erro e taxonomia de estados, todos deliberadamente provisórios.
- Regra de freeze por vertical slice e condições de compatibilidade N/N-1, sem
  congelar contratos nesta fase.
- Backlog verificável da fase 012, com perguntas e experimentos a executar lá.

### Excluído

- Implementar React/Vite, router, componentes ou API.
- Redesenhar a navegação ou definir nova arquitetura de informação.
- Produzir protótipos finais ou decisões definitivas de design system.
- Fazer avaliação completa de UX, redesenhar dashboards ou redefinir os fluxos
  de Portfolio, Asset e Transaction.
- Fechar DTOs, congelar endpoints ou decidir definitivamente a arquitetura de
  estado/cache/frontend.
- Fazer validação definitiva de acessibilidade da nova UI.
- Executar qualquer outra descoberta de Produto/UX/UI que pertença à 012.

## Dependências

- 011-01 é a entrada mínima e fornece o baseline frontend.
- 011-02, 011-03 e 011-05 fornecem, respectivamente, contexto de domínio,
  limites de camadas e restrições de identidade/erros; a subtarefa pode começar
  após 011-01, mas fecha o handoff com esses insumos disponíveis.
- 011-07 depende deste handoff; a fase 012 recebe o resultado sem que a 011-06
  antecipe sua descoberta.

## Arquivos e símbolos prováveis

- Leitura: telas/componentes/hooks atuais, globals/UI components, read models,
  repositories e Quote route contracts.
- Saída provável: `docs/architecture/011/frontend-ux-contract-discovery.md`.

## Passos de implementação

1. Consolidar o inventário de rotas, componentes, estados e acoplamentos Next.js
   produzido em 011-01.
2. Registrar as jornadas atuais e os problemas já conhecidos, sem redesenhar
   navegação, IA, dashboards ou formulários.
3. Classificar restrições técnicas, boundaries de UI/infra e pontos que a futura
   arquitetura React/Vite precisará resolver.
4. Identificar as jornadas, hipóteses e perguntas que obrigatoriamente serão
   revisitadas na 012, incluindo mobile, acessibilidade e feedback.
5. Mapear dependências entre jornadas e capacidades da API, mantendo exemplos,
   Problem Details e estados partial/stale/unavailable como material provisório.
6. Registrar a regra de que a 012 pode alterar requisitos, DTOs e contratos
   provisórios antes do freeze por vertical slice.
7. Entregar backlog, perguntas abertas e critérios de investigação para a 012.
8. Conferir que nenhum redesign, protótipo final, decisão definitiva ou freeze
   de contrato foi produzido nesta subtarefa.

## Testes e comandos de validação

- Conferência das jornadas e acoplamentos registrados contra o inventário
  011-01 e a arquitetura alvo da 011.
- Revisão das perguntas, restrições e dependências UX/API contra 011-02, 011-03
  e 011-05.
- Verificação de que os exemplos de capacidade/erro estão marcados como
  provisórios e não fecham DTOs ou endpoints.
- `git diff --check`.

## Definição de pronto

- O baseline atual do frontend e os acoplamentos Next.js relevantes estão
  consolidados sem exigir nova descoberta do sistema atual.
- Problemas conhecidos, restrições técnicas e jornadas obrigatórias para a 012
  estão registrados.
- As dependências entre UX e API e as capacidades provisórias estão explícitas.
- Contratos são provisórios e possuem regra de freeze por slice; a 012 pode
  alterar requisitos, DTOs e contratos sem quebrar invariantes de domínio.
- A fase 012 tem backlog, perguntas e experimentos pequenos e testáveis.
- Não há redesign, protótipo final, decisão definitiva de UI/IA/design system,
  arquitetura frontend completa ou contrato HTTP final produzido pela 011-06.

## Riscos e cuidados

- Não reduzir a tarefa a trocar `next/link` por outro router.
- Não preservar UI atual apenas por custo afundado; registrar a questão para a
  descoberta da 012.
- Não criar state manager global sem necessidade observada nem escolher uma
  biblioteca antes da 012.
- Não transformar o baseline em auditoria final de UX/a11y.

## Registro da revisão documental

### Status

`pending`

O status permanece pendente porque esta alteração delimita a subtarefa e seu
handoff; ela não executa a descoberta de Produto/UX/UI da fase 012.

### Arquivos alterados

- `docs/specs/011-revisao-roadmap-evolucao-arquitetural.md`
- `docs/tasks/011-revisao-roadmap-evolucao-arquitetural/011-00-overview.md`
- `docs/tasks/011-revisao-roadmap-evolucao-arquitetural/011-01-inventariar-frontend-e-next.md`
- `docs/tasks/011-revisao-roadmap-evolucao-arquitetural/011-03-desenhar-arquitetura-alvo-e-camadas.md`
- `docs/tasks/011-revisao-roadmap-evolucao-arquitetural/011-06-revisar-ux-frontend-e-contratos.md`
- `docs/tasks/011-revisao-roadmap-evolucao-arquitetural/011-08-registrar-adrs-e-handoff.md`
- `docs/roadmap/reserva-clara-roadmap.md`

Nenhum arquivo de produção, banco, deploy, segredo ou configuração externa foi
alterado.

### Decisões e desvios

- 011-06 foi convertida de revisão substantiva para baseline e handoff técnico.
- A 012 continua sendo a responsável por Produto, UX/UI, IA, arquitetura
  frontend, protótipos e mudanças em requisitos, DTOs e contratos provisórios.
- A regra de freeze por vertical slice foi preservada, mas nenhum endpoint, DTO
  ou contrato HTTP final é decidido na 011.
- O checklist da fase permanece com 011-06 pendente; a correção documental não
  conta como conclusão da subtarefa.

### Comandos executados e resultados

- `git diff --check` — passou.
- `functions.grep`/`functions.read` — passaram na validação documental de
  tickers, links, ordem, dependências e seção única `## Checklist` com oito
  itens.
- Revisão independente `review` — **APROVADO** após corrigir a nota histórica
  de sincronização do roadmap e explicitar a dependência 012 → 013.
- Não foram executados lint, typecheck, build ou testes de aplicação: a mudança
  é exclusivamente documental e não altera código.

### Resultados e evidências

- O diff documental entre spec, overview, 011-06, tarefas relacionadas e roadmap
  mantém a fronteira 011 → 012 explícita.

### Riscos residuais

- A descoberta de Produto/UX/UI, IA, frontend e contratos ajustados continua
  pendente na 012.
- Capacidades e exemplos registrados na 011-06 podem mudar após protótipos e
  validação da 012; nenhum consumidor deve tratá-los como contrato congelado.
