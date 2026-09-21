# 001 — Primeira vertical de autenticação

- **Status geral:** in_progress
- **Spec:** [001-primeira-vertical-autenticacao.md](../../specs/001-primeira-vertical-autenticacao.md)
- **Progresso:** 3/4 subtarefas concluídas

## Objetivo

Entregar fluxo mínimo de autenticação Google com Firebase Web entre `/login` e
`/dashboard`, mantendo Server Components fora da interação e sem introduzir
infraestrutura de sessão ou autorização fora do escopo.

## Checklist

- [x] [001-01-estruturar-login-ui.md](001-01-estruturar-login-ui.md)
- [x] [001-02-integrar-google-popup.md](001-02-integrar-google-popup.md)
- [x] [001-03-criar-dashboard-guard.md](001-03-criar-dashboard-guard.md)
- [ ] [001-04-validar-fluxo-e2e.md](001-04-validar-fluxo-e2e.md)

## Observações

- Dependência central: Firebase Web já está configurado em
  `src/lib/firebase/client.ts`.
- `signInWithPopup` foi escolhido por menor fluxo; mobile significa browsers
  comuns, não WebViews ou ambientes que bloqueiam popup.
- Guard do dashboard é somente UX. Não adicionar dados privados até existir
  sessão server-side e autorização real.
- Não há test runner no repositório; usar lint, type-check, build e validação
  manual documentada na spec.
- O destino `/dashboard` e seu guard foram implementados; prova manual com
  Firebase e browsers permanece pendente na subtarefa 001-04.
