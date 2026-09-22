# 003-02 — Estruturar landing V1

- **Ticker:** `003`
- **Número:** `02`
- **Status:** `pending`

## Objetivo e resultado esperado

Substituir o template Create Next App por uma landing Server Component,
reconhecivelmente Reserva Clara, enxuta e suficiente para explicar o produto
sem inventar dados, prova social ou promessas de rentabilidade.

## Requisitos cobertos

- `/` sem resíduos do template.
- Posicionamento amplo sobre patrimônio e longo prazo.
- Header, hero, proposta de valor, explicação, CTA final e footer.
- Reuso de Inter, tokens, assets e componentes da fase 002.
- Ausência de Firebase/Firestore na superfície pública.

## Escopo incluído

- Composição de `src/app/(marketing)/page.tsx` e, se necessário, pequenos
  componentes locais em `src/components/marketing/` com responsabilidade real.
- Header com lockup oficial e entrada para a aplicação.
- Hero com H1 “Seu patrimônio, com clareza.”, texto de posicionamento e CTA.
- Três benefícios curtos: visão do todo, organização contínua e decisões
  conscientes, sem números ou estado financeiro.
- Explicação simples em organizar, acompanhar e decidir.
- CTA final e footer mínimos.
- Uso de `logo-horizontal.png`, `logo-compact.png` ou `logo-mark.png` conforme
  espaço, respeitando alt, proporção e regras de `docs/brand/brand.md`.

## Escopo excluído

- Host routing, redirects ou leitura de headers.
- Login, Firebase, Firestore, dashboard financeiro ou qualquer dado real/falso.
- Gráficos `docs/brand/patrimonio.png` e `docs/brand/consolidacao.png`.
- Depoimentos, métricas, pricing, planos, parceiros, certificações, prêmios,
  analytics e formulário de captura.
- Nova paleta, novo componente UI genérico ou dark mode.

## Dependências

- 003-01 concluída, com a rota de marketing disponível.
- `docs/brand/brand.md`, boards visuais e `docs/specs/002-*`.
- `src/app/globals.css`, `Button`, `Card` e assets existentes.

## Arquivos e símbolos prováveis

- `src/app/(marketing)/page.tsx`: página Server Component.
- `src/components/ui/button.tsx` e `card.tsx`: reuso sem alteração de contrato.
- `src/app/globals.css`: tokens/fontes existentes, sem hex em JSX.
- `public/brand/logo-horizontal.png`, `logo-compact.png`, `logo-mark.png`.
- `src/app/page.tsx`: resíduo a remover depois da migração.

## Passos de implementação

1. Remover a composição Create Next App e definir a hierarquia semântica
   `header`, `nav`, `main`, seções com H2 e `footer`.
2. Escrever copy em pt-BR que explique organização, acompanhamento e construção
   de patrimônio com visão de longo prazo, sem restringir o produto a uma única
   capacidade.
3. Compor hero e benefícios com bastante espaço, hierarquia forte, borders
   sutis e superfícies da foundation; não criar hero de SaaS genérico.
4. Reutilizar os assets oficiais sem recriar logo em texto/CSS, preservando
   proporções, clear space, dimensão mínima e alt adequado.
5. Usar `Button`/`Card` somente onde o elemento semântico e o contrato forem
   apropriados; CTA deve continuar sendo link real.
6. Confirmar que o módulo não importa Firebase, `GoogleSignIn`,
   `DashboardGate` ou APIs de browser.
7. Remover referências a `next.svg`, `vercel.svg`, links externos do template e
   classes `dark:*` da landing.

## Testes e comandos de validação

- `npm run lint`
- `npm exec next typegen`
- `npx tsc --noEmit`
- `npm run build`
- Inspeção de HTML para ausência de copy/links do template e presença de H1,
  tagline, logo oficial e CTA.
- Busca estrutural para confirmar que a landing não importa Firebase ou auth.

## Definição de pronto

- `/` renderiza somente a landing oficial planejada.
- A copy comunica patrimônio, clareza, organização e longo prazo.
- A página não contém números, gráficos, claims comerciais ou prova social
  inventados.
- Assets, Inter, tokens e fundamentos da fase 002 são reutilizados.
- A página é Server Component e funciona sem configuração Firebase.
- A task deixa ajustes finos de responsividade/acessibilidade para 003-05 e
  mantém CTA/navegação verificáveis em 003-03.

## Riscos e cuidados

- Não transformar os boards com gráficos em dados de produto.
- Não usar Emerald como sinônimo de lucro/sucesso; ele é acento de marca.
- Não adicionar seções apenas para aumentar altura da página.
- Não introduzir client island por animação, menu ou efeito sem requisito real.
- Não alterar `/login` ou `/dashboard` para acomodar a landing.
