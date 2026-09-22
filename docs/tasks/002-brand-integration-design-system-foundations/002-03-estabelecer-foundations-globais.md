# 002-03 — Estabelecer foundations globais

- **Ticker:** `002`
- **Número:** `03`
- **Status:** `pending`

## Objetivo e resultado esperado

Consolidar regras globais de typography, spacing, radius, borders, shadows e
focus sobre tokens já estabelecidos. Ao final, a aplicação tem uma linguagem
visual discreta e previsível sem criar uma escala paralela ou dark mode.

## Requisitos cobertos

- Hierarquia de títulos, subtítulos, body, labels, captions e valores financeiros.
- Legibilidade e alinhamento de números com `tabular-nums`.
- Reuso da escala Tailwind existente.
- Radius consistente para cards, buttons, inputs e futuros dialogs/popovers.
- Borders sutis, sombras moderadas e focus-visible acessível.
- Direção visual de clareza, confiança, sobriedade e baixa densidade agressiva.

## Escopo incluído

- Formalizar classes/aliases globais derivados dos tokens semânticos.
- Definir aplicação tipográfica: body regular, headings semibold/bold,
  interface medium/semibold, labels/captions sem excesso de peso.
- Manter spacing Tailwind; não criar escala custom sem necessidade concreta.
- Fixar regra de radius: cards `rounded-xl`, controls `rounded-lg`, dialogs e
  popovers futuros `rounded-lg`/equivalente sem pill arbitrário.
- Preferir `border-border` para separação, sem border dupla ou contraste agressivo.
- Manter cards sem sombra forte; reservar `shadow-sm` para superfícies que
  realmente precisem de elevação.
- Unificar `focus-visible` com ring perceptível e compatível com light background.

## Escopo excluído

- Alteração específica de Button/Card/Input/Label, que ocorre em `002-05`.
- Criação de classes de gráfico, data visualization ou layout de dashboard.
- Animações decorativas, glow, gradientes, glassmorphism ou sombras exageradas.
- Dark mode, media query de preferência ou ThemeProvider.
- Alteração de conteúdo de `/login` ou `/dashboard`.

## Dependências

- `002-01` Inter.
- `002-02` tokens semânticos.
- Spec 002.

## Arquivos e símbolos prováveis

- `src/app/globals.css`: `@layer base`, aliases de font, radius e regras globais.
- Classes base atuais `border-border`, `outline-ring/50`, `bg-background` e
  `text-foreground`.

## Passos de implementação

1. Traduzir a hierarquia tipográfica da spec para tokens/classes já suportados.
2. Confirmar `tabular-nums` como convenção para valores e percentuais futuros.
3. Reaproveitar `--spacing`/utilities Tailwind em vez de declarar escala nova.
4. Aplicar radius, border e shadow somente onde a função visual justificar.
5. Tornar foco perceptível em light mode sem depender de Emerald de baixo
   contraste.
6. Conferir que base global não adiciona comportamento Client nem ativa dark.

## Testes e comandos de validação

- `npm run lint`
- `npm exec next typegen`
- `npx tsc --noEmit`
- `npm run build`
- Inspeção visual de hierarquia e foco em `/login` e `/dashboard`.
- Navegação por teclado nos controles existentes.

## Definição de pronto

- Há regra documentada e aplicada para cada foundation prevista.
- Spacing continua na escala Tailwind existente.
- Cards, controls e futuras superfícies não dependem de sombras fortes.
- Foco é visível em teclado sobre fundo light.
- Nenhuma animação/decorativo fora de função entra na base.

## Riscos e cuidados

- Não confundir `font-heading` com uma segunda família; Inter continua única.
- Não transformar `rounded-full` ou glow em padrão global.
- Não usar opacidade que faça foco, border ou texto desaparecerem.
- Não alterar regras `.dark` como se dark mode fosse requisito desta fase.
