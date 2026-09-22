# 002-02 — Estabelecer tokens semânticos

- **Ticker:** `002`
- **Número:** `02`
- **Status:** `completed`

## Objetivo e resultado esperado

Separar identidade de significado de interface em `src/app/globals.css`,
preservando contratos shadcn/base-nova e criando base light para features reais.
Ao final, valores de marca ficam em `--brand-*`, enquanto componentes usam
tokens semânticos e não hex inline.

## Requisitos cobertos

- Paleta oficial preservada exatamente.
- Mapeamento de background, foreground, card, popover, primary, secondary,
  muted, accent, destructive, border, input e ring.
- Distinção explícita entre brand colors, estados de interface e estados
  financeiros.
- `positive`/`negative` para ganhos/perdas e `destructive` para erro.
- Nenhum token especulativo `success`/`warning` sem consumidor concreto.
- Compatibilidade com Tailwind 4 CSS-first e shadcn base-nova.

## Escopo incluído

- Definir variáveis `--brand-deep-navy`, `--brand-emerald`,
  `--brand-slate-gray`, `--brand-cool-gray` e `--brand-off-white`.
- Atualizar valores light de `:root` conforme a tabela da spec.
- Adicionar aliases `positive`, `positive-foreground`, `negative` e
  `negative-foreground` apenas porque domínio financeiro já prevê esses usos.
- Manter nomes existentes em `@theme inline` e adicionar somente aliases
  necessários para os novos tokens.
- Manter tokens gerados de sidebar/chart apenas como compatibilidade, sem criar
  semântica de gráfico antecipada.
- Registrar qualquer ajuste de contraste dos valores derivados sem alterar
  `--brand-*`.

## Escopo excluído

- Uso de tokens em JSX nesta subtarefa; aplicação visual fica nas tasks seguintes.
- Dark mode funcional ou redesign do bloco `.dark`.
- `tailwind.config.*`, nova biblioteca de tokens ou CSS-in-JS.
- Novos estados `success`, `warning` ou aliases que não tenham consumidor.
- Alteração de componentes, auth, fontes ou assets.

## Dependências

- `002-01` concluída para evitar alias de fonte autorreferente.
- Spec 002 e estado atual de `components.json` e `globals.css`.

## Arquivos e símbolos prováveis

- `src/app/globals.css`: `@theme inline`, `:root`, bloco `.dark` e base layer.
- Classes consumidoras existentes em `src/components/ui/*` para conferir
  compatibilidade, sem necessariamente editar nesta task.

## Passos de implementação

1. Registrar brand tokens somente na camada global.
2. Mapear semântica light preservando nomes públicos shadcn.
3. Garantir que `primary` não seja alias de `positive` e que Emerald não vire
   indicador automático de valorização.
4. Adicionar `positive`/`negative` com foreground acessível e documentar usos.
5. Verificar se `border`, `input` e `ring` oferecem distinção perceptível no
   fundo light.
6. Conferir compilação das classes `bg-*`, `text-*`, `border-*` e `ring-*` sem
   introduzir hex em componentes.

## Testes e comandos de validação

- `npm run lint`
- `npm exec next typegen`
- `npx tsc --noEmit`
- `npm run build`
- Inspeção do CSS compilado para aliases semanticamente nomeados.
- Verificação manual de foreground/background previstos na matriz WCAG da spec.

## Definição de pronto

- Paleta oficial permanece byte-a-byte igual nos brand tokens.
- Todos os tokens semânticos usados por Button/Card/Input compilam.
- `positive`/`negative` têm significado financeiro separado de primary/destructive.
- Não há hex novo em TSX dos componentes.
- Nenhum suporte dark é ativado.
- Ajustes e evidências de contraste estão registrados na task.

## Riscos e cuidados

- Não usar `--brand-emerald` como `text-positive` apenas por coincidência visual.
- Não eliminar tokens gerados por shadcn sem confirmar que não quebrará
  base-nova.
- Não resolver contraste alterando cor oficial; ajustar papel semântico.
- Não inserir `success`/`warning` por completude abstrata.

## Arquivos alterados

- `src/app/globals.css`: brand tokens oficiais, semântica light shadcn/base-nova,
  aliases Tailwind para estados financeiros e valores derivados de contraste.

## Decisões e desvios

- `primary` usa Deep Navy; `accent` usa Emerald; nenhum dos dois é alias de
  `positive`.
- `positive` e `negative` usam valores semânticos derivados, separados de
  `destructive`; `negative` usa tom berry-red distinto do vermelho de erro. Não
  foram adicionados `success` ou `warning`.
- `muted-foreground` usa `oklch(0.4 0.03 255)` (fallback compilado
  `#3D4958`) para superar AA sem alterar Slate Gray oficial.
- `input` usa Slate Gray oficial para manter borda de campo perceptível; `border`
  permanece Cool Gray sutil e `ring` usa Deep Navy.
- `.dark`, tokens chart/sidebar e componentes TSX permaneceram sem alteração.

## Comandos executados

- `npm run lint`
- `npm exec next typegen`
- `npx tsc --noEmit`
- `npm run build`
- `git diff --check`
- Inspeção do CSS compilado em `.next/static/chunks/*.css`.
- Cálculo manual de contraste WCAG para papéis light derivados.

## Resultados e evidências

- Lint, geração de tipos, typecheck e build concluíram sem erros; build gerou
  `/`, `/login`, `/dashboard` e `/_not-found` estáticos.
- CSS compilado contém os cinco valores oficiais em `--brand-*`, aliases
  `--positive`/`--negative` e utilities semânticas `text-positive`.
- Valores oficiais permaneceram byte-a-byte iguais: `#0D1B2A`, `#10B981`,
  `#64748B`, `#E5E7EB` e `#F7F8FA`.
- Contraste calculado: Deep Navy/Off White `16.37:1`, derived muted/Cool Gray
  `7.40:1`, Slate/Input/Off White `4.48:1`, Navy/Emerald `6.86:1`, white/
  positive `7.06:1` e white/negative `8.09:1`.
- Nenhum componente TSX ou asset foi alterado; nenhum hex novo foi introduzido
  em componentes.

## Riscos residuais

- Validação visual interativa e matriz completa de acessibilidade permanecem nas
  subtarefas 002-07 e 002-09; checks automatizáveis desta subtarefa passaram.
