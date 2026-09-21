# 001-01 — Estruturar login UI

- **Ticker:** `001`
- **Número:** `01`
- **Status:** `pending`

## Objetivo e resultado esperado

Criar casca visual da rota `/login` e limitar a futura interação a um
componente Client pequeno. Ao final, a página deve comunicar claramente a marca
e a ação Google em desktop/mobile, sem ainda introduzir provider, sessão ou
autenticação improvisada.

## Requisitos cobertos

- Rota `/login`.
- Branding “Reserva Clara” e “Seu patrimônio, com clareza.”.
- CTA “Continuar com Google”.
- UX limpa, sem valores, gráficos ou widgets fictícios.
- Responsividade e fundamentos de acessibilidade.
- Preservação de Server Components.

## Escopo incluído

- Criar `src/app/login/page.tsx` como Server Component.
- Criar a fronteira Client do CTA em componente específico de auth, por exemplo
  `src/components/auth/google-sign-in.tsx`, com apresentação e contrato simples
  para ser conectado na subtarefa seguinte.
- Reutilizar `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`
  e `Button` existentes.
- Definir semântica, foco, largura responsiva, espaçamento e estrutura de
  mensagens/estado que não quebrem layout quando auth for conectada.
- Manter textos em pt-BR e não alterar layout global sem necessidade.

## Escopo excluído

- Imports ou chamadas de Firebase Authentication.
- `GoogleAuthProvider`, popup, listener, redirect, AuthProvider ou contexto.
- `/dashboard`, middleware/proxy, sessão customizada, Firestore e logout.
- Dependências, configuração, `package.json` e lockfile.

## Dependências

- Componentes UI existentes em `src/components/ui`.
- Tokens Tailwind em `src/app/globals.css`.
- Decisão [001-autenticacao-google-popup.md](../../decisions/001-autenticacao-google-popup.md).

## Arquivos e símbolos prováveis

- `src/app/login/page.tsx`: export default `LoginPage`.
- `src/components/auth/google-sign-in.tsx`: componente Client de CTA/presentação.
- Reutilização: `Button`, `Card`, `CardHeader`, `CardTitle`, `CardDescription`,
  `CardContent`.

## Passos de implementação

1. Criar segmento `src/app/login` e página server-side.
2. Compor uma única área principal centrada, com largura fluida para mobile e
   limite confortável em desktop.
3. Exibir nome, tagline, heading acessível e CTA com texto exato.
4. Garantir foco visível, botão real, disabled visualmente claro e área de toque
   adequada.
5. Reservar região de status/erro sem inserir mensagem decorativa ou conteúdo
   financeiro.
6. Manter a página sem `"use client"`; deixar somente componente interativo com
   essa diretiva.

## Testes e comandos de validação

- Abrir `/login` em viewport desktop e mobile.
- Navegar até CTA somente com teclado e confirmar foco visível.
- Verificar heading, nome acessível do botão e leitura das mensagens planejadas.
- `npm run lint -- src/app/login/page.tsx src/components/auth/google-sign-in.tsx`.

## Definição de pronto

- `/login` renderiza sem erro e sem alterar `/`.
- Branding e CTA exigidos aparecem sem conteúdo fictício.
- Página permanece Server Component; ilha Client fica limitada ao CTA.
- Layout não transborda em viewport mobile e mantém foco/semântica básicos.
- Lint dos arquivos alterados passa.

## Riscos e cuidados

- Não importar `auth` antecipadamente em página server-side.
- Não criar um componente genérico de formulário ou provider para resolver uma
  única ação.
- Não deixar botão simular login com navegação fake; comportamento real entra na
  subtarefa 02.
- Preservar classes e variantes existentes do shadcn/base-nova.
