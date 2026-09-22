# 002-04 — Integrar assets oficiais

- **Ticker:** `002`
- **Número:** `04`
- **Status:** `pending`

## Objetivo e resultado esperado

Tornar Reserva Clara visualmente reconhecível usando diretamente os assets
oficiais de `public/brand/`, com variante adequada ao contexto e favicon oficial
sem conflito com o arquivo padrão atual.

## Requisitos cobertos

- Uso direto de logos, mark, app icons e favicons existentes.
- Regras de variante horizontal, compact, stacked, light, dark, off-white e
  monocromática.
- Substituição do favicon padrão atual.
- Alt, proporção, dimensões e ausência de layout shift relevante.
- V1 light sem usar assets dark para fingir suporte dark.

## Escopo incluído

- Integrar URLs `/brand/...` em componentes Server quando as telas forem
  adaptadas em `002-06`; preparar contratos de uso nesta task.
- Usar `logo-horizontal.png` como lockup padrão em superfície clara, com
  `logo-compact.png`, `logo-stacked.png` ou `logo-mark.png` apenas quando a
  composição exigir.
- Declarar metadata de icons apontando para `favicon-16` até `favicon-256` e
  `app-icon-light.png`, validando MIME/tamanho real.
- Remover `src/app/favicon.ico` como fonte concorrente.
- Registrar alt e clear-space/tamanho mínimo operacional conforme tabela da spec.

## Escopo excluído

- Alterar, otimizar, renomear, copiar ou recriar assets em `public/brand/`.
- Criar SVG/CSS de logo, filtros, recolor, gradiente ou ícone Lucide para marca.
- Implementar dark mode ou trocar automaticamente asset por preferência do sistema.
- Redesenhar `/login` e `/dashboard`, reservado para `002-06`.

## Dependências

- `002-02` tokens e `002-03` foundations globais.
- Documentação local de public folder, metadata icons e Server Components.
- Assets atuais listados na spec.

## Arquivos e símbolos prováveis

- `src/app/layout.tsx`: `metadata.icons`.
- `src/app/favicon.ico`: remoção da autoridade antiga.
- `public/brand/*`: leitura direta, sem alteração.
- `next/image` nas páginas/componentes Server da task seguinte.

## Passos de implementação

1. Confirmar existência e dimensões reais de cada asset antes de declarar
   `width`, `height`, `sizes` ou `type`.
2. Configurar metadata de icons com URLs `/brand/...` e remover favicon padrão
   concorrente.
3. Confirmar que `/brand/` é caminho público e não `/public/brand/`.
4. Documentar escolha de variante por contexto e alt sem duplicar wordmark.
5. Verificar contraste da variante sobre o fundo real, preservando proporção e
   clear space.

## Testes e comandos de validação

- `npm run lint`
- `npm exec next typegen`
- `npx tsc --noEmit`
- `npm run build`
- Inspecionar `<head>` renderizado e links de favicon/app icon.
- Abrir URLs dos assets e confirmar status/MIME.
- Validar em janela anônima/limpa para reduzir falso positivo de cache.

## Definição de pronto

- Metadata aponta para assets oficiais e não há favicon padrão concorrente.
- Pelo menos um lockup oficial está pronto para `/login` e uma variante
  compacta/mark está definida para espaço reduzido.
- Nenhum asset foi alterado ou duplicado.
- Regras de alt, variante, fundo e tamanho estão registradas.
- Build e inspeção de head passam.

## Riscos e cuidados

- `public` recebe URL a partir da raiz; não usar `/public/brand/...`.
- Cache antigo pode ocultar troca de favicon; validar com janela limpa.
- Variantes `*-dark` e `logo-light` são para superfícies escuras reais, não para
  ativar dark mode.
- `logo-horizontal-off-white.png` e `logo-compact-off-white.png` só devem ser
  usadas quando fundo embutido coincidir com a superfície.
