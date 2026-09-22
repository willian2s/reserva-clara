# 002-07 — Validar acessibilidade

- **Ticker:** `002`
- **Número:** `07`
- **Status:** `completed`

## Objetivo e resultado esperado

Provar que foundations, componentes e telas atendem contraste, teclado, foco,
legibilidade e comunicação redundante de estados antes dos checks finais.

## Requisitos cobertos

- Contraste de foreground/background e estados relevantes.
- Focus-visible perceptível.
- Navegação por teclado e tamanho de alvo.
- Disabled, loading, error e feedback de auth.
- Dados financeiros não dependentes somente de cor.
- Alt e legibilidade dos assets.

## Escopo incluído

- Validar combinações `background/foreground`, `primary/primary-foreground`,
  `secondary/secondary-foreground`, `muted/muted-foreground`,
  `accent/accent-foreground`, `destructive`, `positive` e `negative`.
- Testar Button, Input, Label e Card em estados previstos.
- Testar tab order, foco visível, teclado, viewport estreito e zoom razoável.
- Verificar `aria-invalid`, `aria-describedby`, `role=status`, `role=alert`,
  `aria-live`, `aria-busy` e mensagens atuais de auth.
- Verificar sinais/textos/ícones junto de cores para erro, ganho e perda.
- Registrar falhas concretas e ajustar token semântico, não brand token, quando
  contraste exigir.

## Escopo excluído

- Criar suíte automatizada ou instalar ferramenta de acessibilidade.
- Alterar fluxo Firebase ou adicionar componentes de feedback não previstos.
- Validar dark mode, gráficos ou conteúdo financeiro real.
- Marcar task como concluída com análise somente visual sem teclado/contraste.

## Dependências

- `002-01` a `002-06` implementadas.
- Browser com DevTools/leitor de tela disponível quando possível.
- Matriz WCAG da spec 002.

## Arquivos e símbolos prováveis

- `src/app/globals.css`: tokens e base focus.
- `src/components/ui/button.tsx`, `card.tsx`, `input.tsx`, `label.tsx`.
- `src/app/login/page.tsx`, `src/components/auth/google-sign-in.tsx`.
- `src/components/auth/dashboard-gate.tsx`.

## Passos de implementação

1. Testar combinações de contraste em light mode contra critérios WCAG AA.
2. Navegar somente com teclado por login, CTA, estados de erro e qualquer link.
3. Confirmar que foco não some em backgrounds brand/off-white.
4. Acionar disabled, loading, cancelamento, popup bloqueado e erro de auth;
   verificar anúncio e retry.
5. Verificar alt e ausência de duplicação de leitura nos logos.
6. Registrar resultado, ajustes necessários e bloqueios reais.

## Testes e comandos de validação

- Matriz manual de contraste e foco em browser.
- Leitor de tela disponível ou inspeção de árvore acessível.
- Teclado sem mouse em `/login` e `/dashboard`.
- Viewport mobile, zoom e orientação disponível.
- `npm run lint` como smoke após correções.

## Definição de pronto

- Combinações relevantes atendem critérios registrados ou possuem mitigação
  documentada.
- Foco é sempre perceptível e teclado alcança controles na ordem esperada.
- Estados disabled/error/loading têm comunicação visual e semântica.
- Ganho/perda/erro não dependem somente de cor.
- Logo e mensagens não criam ruído para leitor de tela.
- Qualquer bloqueio permanece registrado e impede marcar concluída.

## Riscos e cuidados

- Emerald oficial pode falhar como texto sobre branco; não forçar cor da marca em
  papel inadequado.
- Slate oficial pode não servir para texto normal; usar derivação sem alterar
  `--brand-slate-gray`.
- Não aceitar foco apenas por mudança sutil de background.
- Não confundir contraste de screenshot com contraste computado real.

## Resultado da validação

### Contraste

Matriz light mode calculada a partir dos valores efetivamente definidos em
`src/app/globals.css`, usando WCAG AA:

| Combinação | Contraste | Resultado |
| --- | ---: | --- |
| `foreground` sobre `background` | 16.37:1 | aprovado |
| `primary-foreground` sobre `primary` | 16.37:1 | aprovado |
| `secondary-foreground` sobre `secondary` | 14.05:1 | aprovado |
| `muted-foreground` sobre `muted` | 7.43:1 | aprovado |
| `accent-foreground` sobre `accent` | 6.86:1 | aprovado |
| `destructive` sobre `background` | 7.70:1 | aprovado |
| `positive-foreground` sobre `positive` | 6.64:1 | aprovado |
| `negative-foreground` sobre `negative` | 8.05:1 | aprovado |

O `brand-slate-gray` permanece reservado para borda/input. Não foi usado como
texto normal. O foco usa `ring` derivado do navy; a composição de 50% sobre o
off-white resulta em aproximadamente 3.33:1 contra o entorno, acima do mínimo
de 3:1 para indicador.

### Teclado, foco e alvos

- O seletor global `:focus-visible` cobre links, botões, inputs e controles
  navegáveis.
- Button e Input têm foco explícito com borda/ring e offset; o botão de auth
  apresenta foco perceptível no Chromium headless.
- A navegação por Tab no `/login` alcançou `Continuar com Google`; o dashboard
  não possui controles interativos adicionais no estado atual.
- O CTA de auth tem `min-height: 48px`; Button padrão tem 40px e os tamanhos de
  ícone partem de 24px, atendendo ao tamanho mínimo de alvo usado nesta fase.
- Disabled remove interação por ponteiro, usa cursor/grayscale/opacidade e o
  botão de auth também fica `disabled` durante checking/signing-in.

### Estados e semântica

- `Input` preserva `aria-invalid` e `aria-describedby` via props e aplica
  tratamento visual de erro.
- Google auth expõe `aria-busy`, descrição associada, `role="status"` para
  checking/cancelamento/sucesso e `role="alert"` com `aria-live="assertive"`
  para erro, incluindo popup bloqueado e retry textual.
- Dashboard expõe loading/redirect com `aria-busy`, `role="status"` e
  `aria-live="polite"`.
- Logo horizontal informativo usa `alt="Reserva Clara"`; logo mark usado como
  decoração durante loading usa `alt=""`.
- Não há dados financeiros reais nesta fase; os tokens `positive`/`negative`
  permanecem separados e qualquer uso futuro deverá manter texto/sinal além da
  cor.

## Arquivos alterados

- `docs/tasks/002-brand-integration-design-system-foundations/002-07-validar-acessibilidade.md`
- `docs/tasks/002-brand-integration-design-system-foundations/002-00-overview.md`

Não foram necessários ajustes em código de produção: os tokens, foco,
componentes e estados existentes atenderam aos critérios verificados.

## Decisões e desvios

- A validação foi mantida light-only, conforme escopo da task e da spec; o bloco
  `.dark` não foi exercitado.
- Não foi instalada ferramenta de acessibilidade nem criada suíte automatizada,
  conforme escopo excluído.
- Foi usada inspeção de árvore/DOM acessível e navegação Tab em Chromium
  disponível no ambiente. Não houve leitor de tela dedicado disponível.

## Comandos executados e evidências

- `npm run lint` — aprovado, sem erros.
- `npm exec next typegen` — aprovado, tipos de rotas gerados.
- `npx tsc --noEmit` — aprovado, sem erros de TypeScript.
- `npm run build` — aprovado; `/`, `/dashboard`, `/login` e `/_not-found`
  prerenderizados.
- `npm start` + `curl http://localhost:3000/login` — aprovado; página servida.
- Chromium headless com DOM/DevTools Protocol — `/login` carregou, CTA foi o
  controle alcançado por Tab, foco computado ficou visível e o alvo mediu 48px.
- Script pontual de cálculo WCAG sobre os tokens acima — todas as combinações
  registradas ficaram acima dos limites aplicáveis.

## Riscos residuais

- A experiência com leitor de tela não foi reproduzida com hardware/software
  dedicado; a árvore acessível foi verificada por atributos DOM e regiões live.
- Popup bloqueado, cancelamento e erro de auth foram verificados por inspeção
  dos caminhos e mensagens implementados, mas não simulados interativamente sem
  alterar o fluxo Firebase.
