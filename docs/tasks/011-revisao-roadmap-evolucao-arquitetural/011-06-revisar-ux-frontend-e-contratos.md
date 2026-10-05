# 011-06 — Revisar UX, arquitetura frontend e contratos iniciais

- **Ticker:** `011`
- **Número:** `06`
- **Status:** `pending`

## Objetivo e resultado esperado

Estabelecer o plano da revisão completa do frontend e produzir capacidades/
contratos HTTP iniciais deliberadamente provisórios. O resultado deve orientar
a fase 012 e permitir que UX altere DTOs antes do freeze por slice.

## Requisitos cobertos

- Revisão de navegação, IA, dashboards, carteiras, ativos e transações.
- Estrutura por feature/domínio, components/hooks/services/HTTP/state/cache.
- Validação TypeScript/runtime e estados de UI.
- Design system, responsividade, mobile, acessibilidade e microcopy.
- API independente de framework e contratos ajustáveis após UX.

## Escopo

### Incluído

- Auditoria de jornadas 001–010 e inventário de componentes duplicados.
- Princípios de arquitetura frontend e critérios para escolher bibliotecas.
- Mapa tela/capacidade/API e exemplos de sucesso/erro.
- Política de freeze por vertical slice e geração de cliente/OpenAPI.
- Backlog da fase 012 com experimentos/protótipos.

### Excluído

- Implementar React/Vite, router, componentes ou API.
- Produzir design visual final sem validação.
- Congelar endpoints de Assets/Transactions/Dashboards nesta fase.

## Dependências

- 011-01; arquitetura inicial da 011-03; segurança da 011-05 para auth/erros.

## Arquivos e símbolos prováveis

- Leitura: telas/componentes/hooks atuais, globals/UI components, read models,
  repositories e Quote route contracts.
- Saída provável: `docs/architecture/011/frontend-ux-contract-discovery.md`.

## Passos de implementação

1. Mapear jornadas e problemas das telas atuais.
2. Auditar IA, navegação, mobile, acessibilidade e feedback.
3. Classificar componentes/design tokens para preservar/revisar/substituir.
4. Definir princípios de organização por feature e boundaries de UI/infra.
5. Definir responsabilidades de auth, HTTP, runtime validation, cache/state.
6. Mapear capacidades necessárias da API por jornada, não endpoints finais.
7. Definir Problem Details/códigos e estados partial/stale/unavailable.
8. Definir quando cada contrato congela e como manter N/N-1.
9. Criar backlog verificável da fase 012 e critérios de UX/a11y.

## Testes e comandos de validação

- Walkthrough de login → Portfolio → Asset → Transaction → Dashboard.
- Cenários loading/error/empty/partial/offline/session expired.
- Checklist WCAG, teclado, zoom 200%, 320 px e touch targets.
- Revisão de cada capacidade contra inventários e arquitetura alvo.
- `git diff --check`.

## Definição de pronto

- Todos os fluxos 001–010 aparecem no mapa futuro.
- A arquitetura frontend tem responsabilidades claras sem biblioteca prematura.
- Contratos são provisórios e possuem regra de freeze por slice.
- Mudanças de UX podem alterar DTOs sem quebrar invariantes de domínio.
- A fase 012 tem backlog pequeno e testável.

## Riscos e cuidados

- Não reduzir a tarefa a trocar `next/link` por outro router.
- Não preservar UI atual apenas por custo afundado.
- Não criar state manager global sem necessidade observada.
- Não deixar acessibilidade para uma auditoria final.
