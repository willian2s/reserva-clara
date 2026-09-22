# 002 — Brand Integration & Design System Foundations

- **Status geral:** in_progress
- **Spec:** [002-brand-integration-design-system-foundations.md](../../specs/002-brand-integration-design-system-foundations.md)
- **Progresso:** 3/9 subtarefas concluídas

## Objetivo

Transformar identidade visual Reserva Clara em foundations reutilizáveis de
tipografia, tokens, assets, componentes e acessibilidade, usando `/login` e
`/dashboard` como primeiros consumidores sem alterar arquitetura de auth.

## Checklist

- [x] [002-01-integrar-inter.md](002-01-integrar-inter.md)
- [x] [002-02-estabelecer-tokens-semanticos.md](002-02-estabelecer-tokens-semanticos.md)
- [x] [002-03-estabelecer-foundations-globais.md](002-03-estabelecer-foundations-globais.md)
- [ ] [002-04-integrar-assets-oficiais.md](002-04-integrar-assets-oficiais.md)
- [ ] [002-05-ajustar-componentes-fundamentais.md](002-05-ajustar-componentes-fundamentais.md)
- [ ] [002-06-aplicar-foundations-as-telas.md](002-06-aplicar-foundations-as-telas.md)
- [ ] [002-07-validar-acessibilidade.md](002-07-validar-acessibilidade.md)
- [ ] [002-08-validar-checks-tecnicos.md](002-08-validar-checks-tecnicos.md)
- [ ] [002-09-validar-visual-final.md](002-09-validar-visual-final.md)

## Observações

- Dependências centrais: `docs/brand/brand.md`, assets em `public/brand/`,
  `globals.css`, layout, shadcn/base-nova e telas concluídas da fase 001.
- V1 é light-only; `.dark` pode permanecer dormente, sem toggle ou provider.
- `/` permanece template fora desta fase; registrar follow-up se escopo mudar.
- Não adicionar dados privados, Firebase Admin, sessão server-side ou novo
  catálogo de componentes.
- Marcar subtarefa e progresso somente após sua própria definição de pronto;
  tarefas de validação permanecem desmarcadas enquanto houver bloqueio.
- `002-01` concluída: Inter integrada no layout, aliases tipográficos corrigidos
  e checks técnicos aprovados.
- `002-02` concluída: brand tokens oficiais e semantic tokens light integrados em
  `globals.css`; contraste derivado registrado na task. Validação visual ampla
  permanece nas subtarefas próprias.
- `002-03` concluída: foundations globais de tipografia, radius, foco e aliases
  financeiros integradas em `globals.css`; spacing e shadows continuam opt-in
  na escala Tailwind. Validação visual e teclado permanecem nas subtarefas
  próprias.
