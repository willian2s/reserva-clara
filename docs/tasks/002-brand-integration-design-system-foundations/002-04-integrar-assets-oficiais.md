# 002-04 — Integrar assets oficiais

- **Ticker:** `002`
- **Número:** `04`
- **Status:** `completed`

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

## Contrato operacional de uso

- Lockups informativos usam `alt="Reserva Clara"`; `logo-mark.png` ao lado de
  nome já visível usa `alt=""`. Mark sem nome equivalente recebe
  `alt="Reserva Clara"`.
- Manter clear-space mínimo de uma altura do mark renderizado em cada lado do
  asset; nenhum texto, controle ou borda invade essa área.
- Larguras mínimas de renderização: horizontal `180px`, compact `140px`, stacked
  `128px` e mark `32px`. Mark em controle mantém alvo interativo mínimo de
  `44px`.
- Limites são operacionais: preservar proporção original, não distorcer e não
  reduzir abaixo deles; validação visual confirma legibilidade no contexto real.

## Arquivos alterados

- `src/app/layout.tsx`: `metadata.icons` aponta para os seis favicons oficiais
  PNG em `/brand/`, com MIME e dimensões explícitos, e para
  `/brand/app-icon-light.png` como `apple-touch-icon` V1.
- `src/app/favicon.ico`: removido para eliminar autoridade concorrente.
- `docs/specs/002-brand-integration-design-system-foundations.md`: clear-space,
  larguras mínimas e alvo interativo operacionalizados.
- `public/brand/*`: nenhum arquivo alterado, copiado ou duplicado.

## Decisões e desvios

- Todos os favicons `16`, `32`, `48`, `64`, `128` e `256` foram declarados como
  `rel="icon"`; `app-icon-light.png` foi declarado como `apple-touch-icon`.
- V1 continua light-only: `app-icon-dark.png`, logos dark e variantes off-white
  não foram referenciados no layout.
- Logos de tela não foram renderizados nesta subtarefa, conforme escopo que
  reserva adaptação de `/login` e `/dashboard` para `002-06`. O contrato de
  variante, alt, proporção, clear-space e tamanho mínimo permanece nesta task e
  na spec.

## Comandos executados

- `npm run lint`
- `npm exec next typegen`
- `npx tsc --noEmit`
- `npm run build`
- `sips -g pixelWidth -g pixelHeight ...` e `file --brief --mime-type ...` nos
  assets oficiais
- `npm run start` com requisições HTTP aos assets e inspeção do `<head>` de
  `/login`
- Chrome headless com perfil limpo (`--user-data-dir`) para inspeção fresca do
  `<head>` de `/login`
- `git diff --check`

## Resultados e evidências

- Lint, geração de tipos, typecheck e build concluíram sem erros; build gerou
  `/`, `/login`, `/dashboard` e `/_not-found` estáticos.
- Dimensões reais confirmadas: favicons `16x16`, `32x32`, `48x48`, `64x64`,
  `128x128`, `256x256`; app icon `512x512`; todos com MIME `image/png`.
- Também confirmadas dimensões dos lockups: horizontal `979x285`, compact
  `609x172`, stacked `719x463` e mark `512x512`, todos `image/png`.
- Servidor local retornou `200` e `image/png` para os seis favicons e
  `app-icon-light.png`.
- `<head>` renderizado contém seis links `rel="icon"` em `/brand/...` e um
  `rel="apple-touch-icon"` para `/brand/app-icon-light.png`; não contém
  `/favicon.ico`.
- Perfil Chrome limpo reproduziu os mesmos sete links e confirmou
  `legacy favicon present: False`.
- Chrome headless emitiu apenas warnings locais de `CVDisplayLink` do ambiente
  macOS; a inspeção DOM terminou com sucesso.
- `git diff --check` passou e somente `src/app/layout.tsx` e a remoção de
  `src/app/favicon.ico`, além dos registros SDD em `docs/`, ficaram alterados;
  `public/brand/` permaneceu intacto.

## Riscos residuais

- Uso visual de lockups, alt efetivo e validação de contraste em superfícies
  reais permanecem em `002-06`, `002-07` e `002-09`.
