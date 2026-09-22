# 002-01 — Integrar Inter

- **Ticker:** `002`
- **Número:** `01`
- **Status:** `completed`

## Objetivo e resultado esperado

Substituir Geist pela tipografia oficial Inter no root layout, usando o contrato
`next/font` compatível com Next.js 16 e expondo uma variável CSS única para a
aplicação. Ao final, body, headings e interface resolvem para Inter sem fonte
principal duplicada.

## Requisitos cobertos

- Inter como tipografia oficial.
- Headings semibold/bold, body regular e interface medium/semibold.
- `font-sans` e `font-heading` mapeados para Inter.
- Preservação do layout Server Component e do `lang="pt-BR"`.
- V1 sem dark mode ou provider de tema.

## Escopo incluído

- Atualizar `src/app/layout.tsx` para importar `Inter` de `next/font/google`.
- Configurar subset `latin`, `display: "swap"` e variável `--font-inter`.
- Remover carregamento de Geist Sans; remover Geist Mono se não houver uso real
  que justifique segunda família.
- Preparar aliases `--font-sans` e `--font-heading` para a variável Inter em
  `src/app/globals.css`.
- Confirmar fallback técnico para `font-mono` sem tratá-lo como tipografia de
  produto.

## Escopo excluído

- Alteração de família da marca, fonte local ou novos pesos fora do necessário.
- Alteração de layout estrutural, auth, telas ou componentes UI.
- Download manual, cópia ou versionamento de arquivos de fonte.
- Dark mode, `next-themes` ou lógica Client.

## Dependências

- `AGENTS.md` e documentação local de `next/font`.
- Spec 002 e estado atual de layout/globals.
- Nenhum asset ou dependência adicional.

## Arquivos e símbolos prováveis

- `src/app/layout.tsx`: imports Geist/Inter, variáveis aplicadas no `<html>`.
- `src/app/globals.css`: bloco `@theme inline`, aliases `--font-sans`,
  `--font-heading` e `--font-mono`.

## Passos de implementação

1. Remover imports e instâncias Geist que não tenham consumidor real.
2. Criar instância Inter com configuração documentada pelo Next atual.
3. Aplicar variável Inter no `<html>` sem transformar layout em Client Component.
4. Corrigir autorreferência atual de `--font-sans` e manter `font-heading`
   apontando para a mesma família.
5. Conferir classes existentes `font-sans`, `font-heading` e `font-mono` após a
   mudança, sem alterar a página `/` além do efeito global previsto.

## Testes e comandos de validação

- `npm run lint`
- `npm exec next typegen`
- `npx tsc --noEmit`
- `npm run build`
- Inspeção de HTML/CSS gerado para `--font-inter`, ausência de Geist Sans e
  aplicação de Inter em `/login` e `/dashboard`.
- Confirmar que o build não dispara request de fonte do browser para Google em
  runtime.

## Definição de pronto

- Inter é única família principal carregada pelo layout.
- `font-sans` e `font-heading` resolvem para Inter sem autorreferência.
- Layout continua Server Component, `lang="pt-BR"` permanece e nenhuma ilha
  Client nova aparece.
- Fallback mono está definido ou ausência de uso real está documentada.
- Checks técnicos da subtarefa passam.

## Riscos e cuidados

- `next/font/google` depende de download/cache no build; se falhar por CI sem
  rede, manter task bloqueada e registrar decisão sobre `next/font/local`.
- Não manter Geist e Inter simultaneamente por conveniência.
- Não usar `@import` CSS ou `<link>` externo para contornar o loader.
- Não declarar task concluída apenas porque CSS contém o nome Inter; validar
  fonte computada e build.

## Arquivos alterados

- `src/app/layout.tsx`: substituído Geist por Inter, com `display: "swap"`,
  subset `latin` e variável `--font-inter` no `<html>`.
- `src/app/globals.css`: aliases `font-sans` e `font-heading` apontam para
  `var(--font-inter)`; `font-mono` usa fallback técnico do sistema.

## Decisões e desvios

- Geist Sans e Geist Mono foram removidas. `font-mono` permanece disponível
  somente como fallback técnico para uso residual do template `/`.
- Nenhum desvio de escopo. Layout continua Server Component e `lang="pt-BR"`
  foi preservado.

## Comandos executados

- `npm run lint`
- `npm exec next typegen`
- `npx tsc --noEmit`
- `npm run build`
- Inspeção de CSS/HTML produzido em `.next`.

## Resultados e evidências

- Lint, geração de tipos, typecheck e build concluíram sem erros.
- Build Next.js 16.3.5 gerou `@font-face` local para `Inter`, sem URL externa
  Google no CSS/HTML produzido.
- CSS gerado contém `--font-sans: var(--font-inter)`,
  `--font-heading: var(--font-inter)`, `.font-sans` e `.font-heading` usando
  `var(--font-inter)`, além do fallback `.font-mono`.
- HTML prerenderizado de `/login` e `/dashboard` contém classe de variável
  Inter e `lang="pt-BR"`; nenhum carregamento Geist foi encontrado no artefato
  de produção.
- Validação manual confirmada: fonte computada é Inter, com fallback gerado
  pelo `next/font` quando Inter não está disponível.

## Riscos residuais

- Nenhum risco técnico adicional identificado.
