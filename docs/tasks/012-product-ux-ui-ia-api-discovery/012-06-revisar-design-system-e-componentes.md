# 012-06 — Revisar design system e componentes

- **Ticker:** `012`
- **Número:** `06`
- **Status:** `pending`

## Objetivo e resultado esperado

Revisar tokens, primitives, shell, formulários, alertas, empty/error/retry,
dialogs, tabelas/listas e componentes financeiros à luz das jornadas e da matriz
de acessibilidade.

## Requisitos cobertos

Design system, componentes reutilizáveis, consistência visual, feedback,
responsividade e boundaries de UI.

## Escopo incluído e excluído

Incluído: inventário, critérios de reuso e decisão de preservar/adaptar/substituir.
Excluído: catálogo completo implementado, gráficos, otimização de bundle ou
geração de componentes shadcn.

## Dependências

`012-04` e `012-05`; `src/app/globals.css` e `src/components/ui/*`.

## Arquivos e símbolos prováveis

`docs/architecture/012/design-system-and-components.md`, tokens CSS,
`Button`, `Card`, `Input`, `Label`, `financial/*`.

## Passos de implementação

1. Inventariar tokens e padrões efetivamente usados.
2. Relacionar componentes a jornadas, estados e critérios a11y.
3. Definir primitives e boundaries de apresentação versus domínio.
4. Registrar lacunas e dependências para 013/017/019.

## Testes e comandos de validação

Matriz componente → estado → critério a11y → slice; conferir links e `git diff --check`.

## Definição de pronto

Decisão de design system documentada, sem biblioteca produtiva escolhida por
hábito, e inventário acionável para o spike frontend.

## Riscos e cuidados

Preservar a identidade útil sem carregar automaticamente o design system legado;
não mover regra financeira para componentes visuais.
