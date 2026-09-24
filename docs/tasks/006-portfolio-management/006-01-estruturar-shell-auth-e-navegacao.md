# 006-01 — Estruturar shell, AuthGate e navegação

- **Ticker:** `006`
- **Número:** `01`
- **Status:** `completed`

## Objetivo

Criar fronteira reutilizável de UX autenticada para dashboard e Portfolio,
preservando `/login`, `/dashboard`, Firebase browser-only e a separação de host
da fase 003.

## Resultado esperado

`/dashboard`, `/portfolios` e `/portfolios/[portfolioId]` ficam no grupo
protegido, compartilham um único listener de Auth e exibem navegação mínima para
Dashboard e Carteiras. Usuário anônimo não vê conteúdo protegido antes do
redirect.

## Escopo incluído

- Ler documentação local `node_modules/next/dist/docs/` antes de editar a árvore
  App Router; se ausente, registrar limitação e validar contra checks disponíveis.
- Extrair/adaptar `DashboardGate` para `AuthGate` com `children`, estados
  `checking`, `authenticated` e `redirecting`, cleanup e loading acessível.
- Criar `(protected)/layout.tsx` e mover dashboard sem alterar URL pública.
- Criar shell simples com links reais somente para Dashboard e Carteiras.
- Alterar `/dashboard` para CTA de entrada em `/portfolios`, sem consultar
  Firestore ou exibir patrimônio.
- Atualizar `src/proxy.ts` para matcher e bridge público/app de
  `/portfolios/:path*`.
- Garantir que troca de identidade remonte/limpe subtree protegido.

## Escopo excluído

- Listagem, formulário, CRUD ou import direto de Firestore em páginas.
- Logout, AuthProvider global, sessão server-side, Firebase Admin ou autorização
  fora das Rules.
- Links interativos para Assets, Transactions, Metas ou funcionalidades futuras.
- Mudança em `firestore.rules`, schema ou dependências.

## Dependências

- Spec 006 e contratos de Auth das fases 001/004.
- `src/components/auth/dashboard-gate.tsx`, `src/proxy.ts` e route groups atuais.
- Documentação local Next 16 disponível ou limitação registrada.

## Arquivos e símbolos prováveis

- `src/components/auth/auth-gate.tsx`.
- `src/components/auth/dashboard-gate.tsx`, somente para extração/remoção sem
  listener duplicado.
- `src/app/(app)/(protected)/layout.tsx`.
- `src/app/(app)/(protected)/dashboard/page.tsx`.
- `src/proxy.ts`.

## Passos de implementação futura

1. Confirmar sintaxe atual de route groups, layouts e `children` na documentação
   instalada do Next 16.
2. Criar `AuthGate` como única assinatura de `onAuthStateChanged` dentro do
   grupo protegido; não passar UID para componentes de Portfolio.
3. Renderizar somente status não sensível durante restauração/redirect.
4. Mover dashboard para grupo protegido e preservar `/dashboard` como destino
   pós-login.
5. Adicionar navegação acessível para `/dashboard` e `/portfolios`.
6. Atualizar matcher/redirects do proxy e testar hosts público, app, local,
   preview e desconhecido.
7. Confirmar por inspeção que páginas Server não importam Firebase.

## Testes e validação

```bash
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
```

Validar manualmente acesso anônimo direto às três rotas, sessão restaurada,
troca de conta e ausência de listener duplicado observável. Testar assets e
redirects Host sem interceptar `/brand/*` ou `/_next/*`.

## Definição de pronto

- Um único `AuthGate` protege as três rotas sem colocar `/login` atrás do gate.
- Dashboard mantém URL e CTA para `/portfolios`.
- Proxy cobre a nova árvore e mantém destinos fixos.
- Shell não exibe UID, e-mail, dados financeiros ou links sem destino.
- Firebase permanece em Client boundary; gates passam.

## Riscos e cuidados

- AuthGate é UX, não autorização; não colocar dados sensíveis no HTML inicial.
- Não manter `DashboardGate` e `AuthGate` ativos simultaneamente no dashboard.
- Não assumir assinatura de `params`/layouts Next 16 sem documentação local.
- Não criar sidebar grande ou menu para fases futuras.

## Evidência esperada ao concluir

Registrar status, arquivos, decisão sobre transição de `DashboardGate`, comandos,
matriz de hosts/auth, resultado dos gates e riscos residuais nesta task. Atualizar
overview somente após definição de pronto.

## Registro de execução

### Status

`completed`.

### Arquivos alterados

- `src/components/auth/auth-gate.tsx` — novo gate Client compartilhado.
- `src/components/auth/dashboard-gate.tsx` — removido após extração do contrato.
- `src/app/(app)/(protected)/layout.tsx` — novo grupo protegido, shell e navegação.
- `src/app/(app)/(protected)/dashboard/page.tsx` — dashboard movido sem alterar URL e com CTA para `/portfolios`.
- `src/app/(app)/dashboard/page.tsx` — removido após movimentação para o grupo protegido.
- `src/proxy.ts` — matcher e bridge público/app para `/portfolios`.

### Decisões e desvios

- `DashboardGate` foi removido, não mantido como wrapper, para evitar listener duplicado.
- `AuthGate` controla renderização do shell e dos `children`; conteúdo protegido só aparece após autenticação confirmada.
- Subtree protegido recebe `key` interno derivado da identidade autenticada para remontar na troca de conta. UID não é exibido nem passado a páginas de Portfolio.
- Route groups, layouts, `children` e proxy foram conferidos na documentação local instalada em `node_modules/next/dist/docs/`. Não houve desvio de API.
- Nenhuma alteração foi feita em Firebase initializer, Rules, schema, dependências ou páginas de Portfolio.

### Comandos executados

- `npm run lint` — passou.
- `npm exec next typegen` — passou.
- `npx tsc --noEmit` — primeira execução encontrou referência stale em `.next/dev/types/validator.ts` após remoção da rota antiga; após regenerar tipos, passou.
- `npm run build` — primeira execução reproduziu a mesma referência stale gerada; após regenerar tipos, compilação, TypeScript e geração de páginas passaram.
- `git diff --check` — passou.
- `npm run lint` — rerun final após todos os arquivos de código; passou.

### Resultados e evidências

- Build Next 16.3.5 reconheceu `/dashboard` preservada por route group e `/login`; não houve import Firebase em Server Components.
- `AuthGate` possui estados `checking`, `authenticated` e `redirecting`, cleanup de `onAuthStateChanged`, loading com `role="status"`, `aria-live` e `aria-busy`.
- Shell contém somente links para Dashboard e Carteiras; dashboard não consulta Firestore nem exibe valores financeiros.
- Proxy mantém matcher restrito e adiciona `/portfolios/:path*` tanto ao matcher quanto à ponte público/app; assets e `/_next/*` não entram no matcher.
- Revisão independente classificou implementação como pronta, sem bloqueadores.

### Matriz de hosts/auth

- Por inspeção: público redireciona `/portfolios` para origem app; app, localhost e preview permanecem same-origin; host desconhecido continua 404; matcher não cobre assets.
- Por inspeção: anônimo recebe somente loading/redirect, sem shell ou `children`; sessão autenticada monta shell; troca de identidade remonta subtree.
- Browser não estava disponível nesta execução; sessão restaurada, troca de conta e redirects reais permanecem validação manual residual.

### Riscos residuais

- `AuthGate` é somente UX; autorização continua nas Firebase Rules e não foi alterada.
- Matriz manual em browser para auth, hosts e assets ainda precisa ser executada nas subtarefas de validação operacional.
