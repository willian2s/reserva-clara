# 012-07 — Prototipar e preparar freeze de Portfolio

- **Ticker:** `012`
- **Número:** `07`
- **Status:** `pending`

## Objetivo e resultado esperado

Prototipar a primeira slice de referência: listar ativas/arquivadas, criar,
renomear, arquivar, restaurar, abrir, deep link, vazio, conflito, erro e modo
somente leitura. Resultado: pacote de decisão de Portfolio, sem implementar a
slice.

## Requisitos cobertos

Portfolio lifecycle, IA, estados, a11y, UX mobile e freeze por slice.

## Escopo incluído e excluído

Incluído: intenção, ações, pré-condições, estados, copy, a11y e capability
provisória. Excluído: endpoint final, EF, migration, E2E implementado ou write
no novo stack.

## Dependências

`012-03` a `012-06`; domínio `src/domain/portfolio.ts` e telas `portfolio/*`.

## Arquivos e símbolos prováveis

`docs/architecture/012/slices/portfolio.md`, `PortfolioList`, `PortfolioDetail`,
`PortfolioSettings`, `PortfolioCreateForm`.

## Passos de implementação

1. Criar alternativas de listagem e detalhe em protótipo responsivo.
2. Walkthrough de lifecycle e recovery com carteira arquivada.
3. Definir payload conceitual, erros, retry e dependências de leitura/comando.
4. Verificar critérios de freeze e registrar questões para 017.

## Testes e comandos de validação

Walkthrough em teclado, 320 px, zoom 200%, estados e deep link; validar que
archive não é apresentado como delete.

## Definição de pronto

Pacote de Portfolio contém protótipo, matriz de estados, a11y, copy,
capabilities provisórias e owner de revisão; OpenAPI permanece provisório.

## Riscos e cuidados

Não congelar o contrato HTTP antes do protótipo e não confundir carteira
arquivada legível com carteira mutável.
