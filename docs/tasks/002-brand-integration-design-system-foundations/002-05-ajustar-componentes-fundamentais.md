# 002-05 — Ajustar componentes fundamentais

- **Ticker:** `002`
- **Número:** `05`
- **Status:** `completed`

## Objetivo e resultado esperado

Alinhar Button, Card, Input e Label às foundations sem trocar a arquitetura
base-nova/Base UI. Ao final, os quatro componentes compartilham tokens,
tipografia, radius, borders e comportamento de estados previsível.

## Requisitos cobertos

- Componentes fundamentais coerentes entre si.
- Estados default, hover, active, focus-visible, disabled, loading quando
  consumidor já exigir e error quando aplicável.
- Uso de tokens semânticos sem hex arbitrário.
- Focus perceptível e feedback não dependente somente de cor.
- Preservação dos contratos e variantes existentes do shadcn.

## Escopo incluído

- `button.tsx`: primary/secondary/outline/ghost/destructive/link, hover/active,
  disabled, focus e tamanho de toque coerente.
- `card.tsx`: surface, foreground, border/radius e sombra discreta; manter
  subcomponentes e `data-slot`.
- `input.tsx`: border/input, placeholder, focus, disabled e `aria-invalid`;
  manter Base UI primitive e `data-slot`.
- `label.tsx`: peso/cor/spacing e estados disabled coerentes; manter associação
  nativa e compatibilidade com `peer`/`group`.
- Loading visual somente por `disabled`/`aria-busy` do consumidor existente;
  não criar spinner ou API genérica sem uso.

## Escopo excluído

- Novos componentes Field, Alert, Spinner, Badge, Dialog ou Form.
- Mudança de contratos públicos, nomes de variants, Base UI ou CVA.
- Alteração da lógica `GoogleSignIn`/`DashboardGate`.
- Cores inline, dark mode ou estados financeiros dentro dos componentes base.

## Dependências

- `002-02` tokens.
- `002-03` foundations globais.
- Componentes atuais e `components.json` como fonte de verdade.

## Arquivos e símbolos prováveis

- `src/components/ui/button.tsx`: `buttonVariants`, `Button`.
- `src/components/ui/card.tsx`: `Card`, `CardHeader`, `CardTitle`,
  `CardDescription`, `CardContent`, `CardFooter`.
- `src/components/ui/input.tsx`: `Input`.
- `src/components/ui/label.tsx`: `Label`.

## Passos de implementação

1. Mapear cada classe atual para token semanticamente correto.
2. Unificar ring/focus-visible de Button e Input com `ring` e offset adequado.
3. Ajustar disabled para impedir interação e permanecer visualmente distinguível.
4. Aplicar border/radius/shadow definidos à Card sem duplicar separadores.
5. Confirmar `aria-invalid` e classes destructive para Input sem depender só da
   cor; erro textual fica no consumidor real.
6. Testar variants existentes e uso no `GoogleSignIn` após a alteração.

## Testes e comandos de validação

- `npm run lint`
- `npm exec next typegen`
- `npx tsc --noEmit`
- `npm run build`
- Teste manual de cada variant do Button e estados do Input.
- Navegação por teclado e inspeção de foco.
- Verificação de que `data-slot`, props e imports Base UI não regrediram.

## Definição de pronto

- Button, Card, Input e Label usam tokens e regras comuns.
- Todos os estados previstos têm comportamento visual e semântico verificável.
- Variants existentes continuam compilando e sendo consumíveis.
- Nenhum hex arbitrário foi introduzido nos componentes.
- A lógica de auth e boundaries permanecem inalteradas.

## Riscos e cuidados

- Não substituir componentes gerados por outra variante shadcn; repositório usa
  `base-nova`.
- Não ocultar foco para obter aparência minimalista.
- Não tratar opacity isolada como comunicação suficiente de disabled/error.
- Não adicionar API de loading que nenhum consumidor usa.

## Arquivos alterados

- `src/components/ui/button.tsx`: variants, estados, foco, radius, tipografia e
  tamanhos de controle alinhados aos tokens semânticos.
- `src/components/ui/card.tsx`: surface, border, radius, sombra discreta e
  hierarquia do título ajustados; subcomponentes e `data-slot` preservados.
- `src/components/ui/input.tsx`: altura/radius compartilhados, tipografia,
  foco, disabled e estado `aria-invalid` ajustados com tokens semânticos.
- `src/components/ui/label.tsx`: tipografia, foreground e estados disabled
  derivados de `group`/`peer` ajustados.

## Decisões e desvios

- Reutilizados `rounded-control`, `rounded-card`, `border-border`, `ring` e os
  aliases tipográficos existentes; nenhum token novo, hex ou API pública foi
  criado.
- O tamanho default do Button passou para `h-10` e o `lg` para `h-11`; os
  tamanhos compactos explícitos e os nomes das variants foram preservados.
- O carregamento continua sendo responsabilidade do consumidor: `GoogleSignIn`
  segue usando `disabled` e `aria-busy`, sem spinner ou prop nova.
- A primeira tentativa de build foi bloqueada por configuração Firebase
  ausente; após disponibilização de `.env.local` no ambiente, o build foi
  repetido com sucesso. Nenhum componente foi alterado para contornar o erro.
- Após validação manual, o Button recebeu `cursor-pointer`; o estado disabled
  mantém `cursor-not-allowed` e `pointer-events-none`.

## Comandos executados

- `npm run lint`
- `npm exec next typegen`
- `npx tsc --noEmit`
- `npm run build`
- `git diff --check`
- Revisão independente do diff por agente de review.
- Reteste completo após ajuste de cursor: `npm run lint`,
  `npm exec next typegen`, `npx tsc --noEmit`, `npm run build` e
  `git diff --check`.

## Resultados e evidências

- `npm run lint`: passou sem erros.
- `npm exec next typegen`: `Types generated successfully`.
- `npx tsc --noEmit`: passou sem erros; o build também concluiu a etapa de
  TypeScript antes do prerender.
- `git diff --check`: passou sem whitespace inválido.
- `npm run build`: passou; compilou e prerenderizou `/`, `/login`, `/dashboard`
  e `/_not-found`.
- Reteste do cursor: `cursor-pointer` está presente no Button e o override
  `disabled:cursor-not-allowed` permanece preservado.
- Review independente não encontrou achados concretos no diff e confirmou a
  preservação de CVA, Base UI, `cn`, `data-slot`, variants e contratos.

## Riscos residuais

- Inspeção visual interativa, teclado e matriz completa de acessibilidade ficam
  para as subtarefas `002-07` e `002-09`.
