# 012-03 — Definir IA, navegação e shell

- **Ticker:** `012`
- **Número:** `03`
- **Status:** `pending`

## Objetivo e resultado esperado

Transformar as jornadas aprovadas em arquitetura da informação, navegação e shell
conceituais independentes de Next, cobrindo deep links, back/forward, 404, host,
foco, filtros e retorno após login.

## Requisitos cobertos

UX-02, separação público/app e critérios de navegação da 012.

## Escopo incluído e excluído

Incluído: árvore de rotas conceituais, hierarquia, navegação ativa, shell,
parâmetros opacos e host policy. Excluído: implementação de router, proxy,
hosting, autorização ou URL HTTP definitiva.

## Dependências

`012-02`; `src/proxy.ts`, layout protegido e handoff 011-06.

## Arquivos e símbolos prováveis

`docs/architecture/012/information-architecture.md`,
`src/app/(app)/(protected)/layout.tsx`, `src/lib/host-routing.ts`, páginas atuais.

## Passos de implementação

1. Desenhar alternativas de entrada global e carteiras.
2. Definir superfícies pública, autenticação e aplicação.
3. Mapear rotas, deep links, 404, filtros, retorno e foco.
4. Registrar modelo SPA/history e biblioteca de router apenas como decisão
   candidata para 013.

## Testes e comandos de validação

Walkthrough de teclado e URL em protótipo, incluindo host não permitido e query
string; validar links e `git diff --check`.

## Definição de pronto

IA navegável e justificada, com política de host separada de autorização e
handoff claro para a fundação frontend.

## Riscos e cuidados

Não copiar route groups do Next por inércia nem tratar redirect visual como
controle de acesso.
