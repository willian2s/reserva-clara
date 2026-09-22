# 002-07 — Validar acessibilidade

- **Ticker:** `002`
- **Número:** `07`
- **Status:** `pending`

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
