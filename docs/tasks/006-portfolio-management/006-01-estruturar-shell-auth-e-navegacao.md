# 006-01 — Estruturar shell, AuthGate e navegação

- **Ticker:** `006`
- **Número:** `01`
- **Status:** `pending`

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
