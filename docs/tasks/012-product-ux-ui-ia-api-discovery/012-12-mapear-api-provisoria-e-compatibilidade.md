# 012-12 — Mapear API provisória e compatibilidade

- **Ticker:** `012`
- **Número:** `12`
- **Status:** `pending`

## Objetivo e resultado esperado

Consolidar API-01–API-04 a partir dos protótipos: catálogo de capabilities,
intenção, dados mínimos, estados, erros, retry, owner, IDs, compatibilidade N/N-1
e fronteiras com Application/Domain/Persistence.

## Requisitos cobertos

API provisória de Portfolio, Asset, Transaction, valuation e Quotes; Problem
Details/códigos sanitizados; freeze por slice e ADR 016.

## Escopo incluído e excluído

Incluído: mapa de capabilities, exemplos conceituais de sucesso/erro e matriz
consumer/provider. Excluído: URLs/DTOs completos obrigatórios, OpenAPI final,
controllers, EF, schema, endpoint ou compatibilidade implementada.

## Dependências

`012-07` a `012-11`, ADRs 009, 011–014, 016 e `frontend-ux-contract-discovery.md`.

## Arquivos e símbolos prováveis

`docs/architecture/012/provisional-api-capabilities.md`, ADR 016, capacidades
`portfolio/*`, `asset/catalog`, `transaction/*`, `valuation/*`, `quote/read`.

## Passos de implementação

1. Mapear cada ação de protótipo a query/command orientado por intenção.
2. Definir dados mínimos, sem owner controlável, IDs opacos e strings decimais.
3. Mapear 401/404/409/422/429/503, partial/stale/unavailable e retry.
4. Simular consumidor N/N-1 e identificar versão/adapter necessário.

## Testes e comandos de validação

Tabletop de erros e compatibilidade com payloads sintéticos; conferir que nenhum
exemplo expõe UID, token, payload financeiro ou detalhe BRAPI.

## Definição de pronto

Catálogo é rastreável aos protótipos, ADR 016 tem revisão e cada slice informa o
que pode congelar agora e o que aguarda 014–019.

## Riscos e cuidados

Não derivar API de tabelas/Firestore, não tratar `/api/quotes` como padrão geral
e não congelar contrato global antes de uma vertical.
