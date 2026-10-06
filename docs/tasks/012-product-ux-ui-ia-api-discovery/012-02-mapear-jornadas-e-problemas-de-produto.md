# 012-02 — Mapear jornadas e problemas de produto

- **Ticker:** `012`
- **Número:** `02`
- **Status:** `pending`

## Objetivo e resultado esperado

Executar UX-01 com walkthroughs da entrada até a compreensão patrimonial e
produzir mapa de tarefas, perfis/cenários, dores e decisão sobre o que preservar,
simplificar, reorganizar, substituir, remover ou dividir.

## Requisitos cobertos

Jornadas 001–010, UX-01 e comparação entre dashboard global e carteiras.

## Escopo incluído e excluído

Incluído: login, shell, Portfolio, Asset, Transaction, Quotes, detalhe e
consolidado com carteiras vazias/arquivadas e falhas. Excluído: pesquisa com
dados reais, implementação e freeze de API.

## Dependências

`012-01`; inventário 011-06 e telas atuais em `src/components/**`.

## Arquivos e símbolos prováveis

`docs/architecture/012/journeys-and-product-findings.md`, `GlobalDashboard`,
`PortfolioList`, `PortfolioDetail`, `TransactionLedger`, `AssetCatalog`.

## Passos de implementação

1. Definir tarefas observáveis para três perfis hipotéticos e fixtures sintéticas.
2. Percorrer login → carteira → operação → leitura patrimonial.
3. Comparar entrada pelo dashboard global e pela lista de carteiras.
4. Registrar fricções, linguagem, ações ausentes e decisão por fluxo.

## Testes e comandos de validação

Walkthrough documentado com cenários de sucesso, vazio e erro; conferir links e
`git diff --check`. Nenhuma conclusão deve depender de patrimônio real.

## Definição de pronto

Mapa de jornadas aprovado, decisão de entrada justificada e backlog priorizado
com evidência e perguntas ainda abertas.

## Riscos e cuidados

Não confundir preferência do planejador com pesquisa de usuário e não preservar
uma tela apenas por existir no Next.
