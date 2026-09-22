# 002-09 — Validar visual final

- **Ticker:** `002`
- **Número:** `09`
- **Status:** `pending`

## Objetivo e resultado esperado

Realizar validação visual final da fase 002 em `/login` e `/dashboard`,
confirmando marca, hierarquia, densidade, assets e ausência das estéticas
explicitamente proibidas.

## Requisitos cobertos

- Aplicação reconhecivelmente Reserva Clara.
- Assets oficiais e paleta preservada.
- Inter e hierarquia tipográfica.
- Light mode.
- Cards discretos, borders sutis, números legíveis e foco/feedback claros.
- Regressão funcional da vertical de auth.

## Escopo incluído

- Comparar telas com `docs/brand/` e regras da spec 002.
- Validar desktop e mobile nos browsers disponíveis.
- Validar estados normal, loading, cancelado, erro, popup bloqueado,
  autenticado e redirect do fluxo existente.
- Confirmar visual sem trading aesthetic, excesso de verde, gradiente decorativo,
  glow, glassmorphism, sombra exagerada, animação desnecessária ou template SaaS
  genérico.
- Confirmar favicon em janela limpa e branding em HTML carregado.
- Registrar screenshots/evidências disponíveis sem incluir dados ou credenciais.

## Escopo excluído

- Validar ou redesenhar `/` template.
- Criar dados financeiros, gráficos, nova navegação ou dark mode.
- Substituir validação de acessibilidade ou checks técnicos da `002-07`/`002-08`.
- Marcar subtarefas anteriores como concluídas retroativamente sem evidência.

## Dependências

- `002-07` e `002-08` concluídas.
- Ambiente Firebase e conta de teste, quando necessário para estados auth.
- Browsers desktop/mobile disponíveis.

## Arquivos e símbolos prováveis

- `/login`: `src/app/login/page.tsx`, `GoogleSignIn` e UI base.
- `/dashboard`: `DashboardPage`, `DashboardGate` e UI base.
- `src/app/layout.tsx`, `globals.css`, `public/brand/*`.
- `docs/brand/brand.md` e boards visuais.

## Passos de implementação

1. Abrir `/login` e `/dashboard` em desktop e viewport mobile.
2. Conferir logo/mark, tagline, Inter, background, cards, controls, borders,
   focus, spacing e hierarquia.
3. Reexecutar estados auth relevantes sem alterar fluxo.
4. Conferir favicon/app icon com cache limpo.
5. Comparar com direção visual oficial e registrar desvios concretos.
6. Se houver desvio, devolver correção à task responsável; não fazer ajuste
   improvisado nesta validação.

## Testes e comandos de validação

- Chrome, Safari e Firefox desktop quando disponíveis.
- Safari iOS e Chrome Android quando disponíveis.
- Viewport estreito, zoom e teclado.
- Fluxo manual Google já aprovado na fase 001.
- Conferência final de `npm run lint`, `npm exec next typegen`,
  `npx tsc --noEmit` e `npm run build` sem repetir correções fora de escopo.

## Definição de pronto

- `/login` e `/dashboard` passam matriz visual e funcional.
- Branding, assets, Inter e light mode aparecem corretamente.
- Direção visual não contém os padrões proibidos pela spec.
- Favicon oficial aparece após limpeza de cache.
- Desvios, limitações e screenshots/evidências estão registrados.
- Overview pode ser marcado 9/9 somente depois desta task e de todas as
  anteriores concluídas.

## Riscos e cuidados

- Não usar screenshot bonita para esconder falha de teclado, contraste ou auth.
- Não confundir `logo-light` com suporte dark.
- Não aprovar `/` como branded; rota continua follow-up conhecido.
- Não registrar dados pessoais, tokens Firebase ou credenciais nas evidências.
