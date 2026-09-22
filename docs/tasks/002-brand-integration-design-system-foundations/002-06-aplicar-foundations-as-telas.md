# 002-06 — Aplicar foundations às telas

- **Ticker:** `002`
- **Número:** `06`
- **Status:** `completed`

## Objetivo e resultado esperado

Aplicar marca e foundations às telas reais da fase 001. `/login` deve usar asset
oficial e `/dashboard` deve deixar de parecer shell genérico, mantendo fluxo de
autenticação, conteúdo não sensível e fronteiras Server/Client.

## Requisitos cobertos

- `/login` e `/dashboard` consomem tokens e typography foundations.
- Assets oficiais visíveis onde branding é necessário.
- Tagline oficial preservada.
- Button/Card e estados de auth coerentes.
- Nenhuma alteração da arquitetura de autenticação.

## Escopo incluído

- `src/app/login/page.tsx`: substituir branding textual principal pelo lockup
  oficial adequado, preservar tagline, heading, Card e textos pt-BR.
- Ajustar composição, spacing e superfície do login para light mode e mobile.
- `src/components/auth/google-sign-in.tsx`: alterar somente classes/feedback
  visual necessários para consumir Button/tokens; preservar listener, popup,
  status, retry, mensagens e `router.replace`.
- `src/components/auth/dashboard-gate.tsx`: aplicar shell visual, typography,
  marca/mark se necessário e estados de loading/redirect sem dados privados.
- `src/app/dashboard/page.tsx`: ajustar composição somente se necessário para a
  apresentação, sem mover Firebase para Server Component.

## Escopo excluído

- Redesenho de auth, novos providers, logout, sessão ou autorização.
- Patrimônio real, saldo, cards de investimento, gráficos, navegação de domínio
  ou dados fictícios.
- Migração da rota `/` ou criação de landing page.
- Novos componentes fora de Button/Card/Input/Label.

## Dependências

- `002-01` a `002-05` concluídas.
- `docs/specs/001-primeira-vertical-autenticacao.md` e decisão 001.
- Assets e regras da `002-04`.

## Arquivos e símbolos prováveis

- `src/app/login/page.tsx`: `LoginPage`.
- `src/components/auth/google-sign-in.tsx`: `GoogleSignIn`, status messages.
- `src/app/dashboard/page.tsx`: `DashboardPage`.
- `src/components/auth/dashboard-gate.tsx`: `DashboardGate`.

## Passos de implementação

1. Inserir asset oficial com alt correto e dimensões estáveis no login.
2. Preservar exatamente tagline, heading acessível, CTA e mensagens de auth.
3. Trocar classes arbitrárias por tokens semânticos e foundations, sem alterar
   contratos de props ou estado.
4. Aplicar logo/mark e shell discreto ao dashboard autenticado e aos estados de
   loading/redirect.
5. Confirmar que a rota segue Server Component e Firebase permanece somente nas
   ilhas Client existentes.
6. Confirmar que `/dashboard` ainda não comunica autorização de dados privados.

## Testes e comandos de validação

- `npm run lint`
- `npm exec next typegen`
- `npx tsc --noEmit`
- `npm run build`
- Smoke manual `/login` e `/dashboard` em mobile/desktop.
- Fluxo fase 001: sessão ausente, sessão restaurada, login, cancelamento, erro,
  popup bloqueado e retry.
- Inspeção de heading, alt, CTA, status live e ausência de dados fictícios.

## Definição de pronto

- Login é reconhecivelmente Reserva Clara e usa asset oficial diretamente.
- Dashboard usa foundations e não é mais visualmente genérico, sem virar produto
  financeiro antes da hora.
- Tagline, textos e estados auth permanecem funcionais.
- Nenhum import Firebase novo chega ao layout ou às páginas Server.
- `/` permanece explicitamente fora do escopo.

## Riscos e cuidados

- Não renderizar logo com texto duplicado ou alt redundante.
- Não usar Emerald como indicador de login bem-sucedido por hábito financeiro.
- Não adicionar saldo, gráfico ou widget fictício para “preencher” dashboard.
- Não interpretar a melhoria visual como autorização server-side.

## Evidências de execução

- **Arquivos alterados:**
  - `src/app/login/page.tsx`
  - `src/components/auth/google-sign-in.tsx`
  - `src/components/auth/dashboard-gate.tsx`
- **Decisões:** o login usa o lockup oficial
  `/brand/logo-horizontal.png` com dimensões estáveis e tagline preservada; o
  dashboard usa o mesmo lockup em um shell autenticado discreto e o mark oficial
  durante loading/redirect. O conteúdo autenticado permanece não sensível e sem
  dados fictícios.
- **Correção visual:** removida a faixa decorativa superior do login, que criava
  uma superfície cinza inesperada acima do conteúdo; o layout permanece limpo e
  centralizado sem alterar a composição funcional.
- **Preservado:** listener Firebase, popup Google, estados, mensagens, retry,
  `router.replace` e fronteiras Client/Server existentes. `dashboard/page.tsx`
  continua Server Component e apenas renderiza `DashboardGate`.
- **Comandos executados:**
  - `npm run lint`
  - `npm exec next typegen`
  - `npx tsc --noEmit`
  - `npm run build`
  - `git diff --check`
- **Resultados:** todos os comandos concluíram com sucesso; typegen gerou os
  tipos de rota e não houve alterações fora dos três arquivos da implementação.
- **Smoke manual:** não executado neste ambiente; permanece como verificação
  visual independente em mobile/desktop e nos estados reais do Firebase.
- **Riscos residuais:** a validação visual final e o fluxo real com popup,
  cancelamento e bloqueio dependem de ambiente de navegador e configuração
  Firebase válida; permanecem cobertos pelas subtarefas de validação seguintes.
