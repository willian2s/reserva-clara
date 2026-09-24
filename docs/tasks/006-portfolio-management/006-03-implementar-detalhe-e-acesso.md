# 006-03 — Implementar detalhe e acesso

- **Ticker:** `006`
- **Número:** `03`
- **Status:** `pending`

## Objetivo

Criar página canônica de carteira com deep link, refresh e leitura owner-scoped,
sem revelar existência de documento de outro usuário.

## Resultado esperado

`/portfolios/[portfolioId]` carrega uma carteira do usuário autenticado por
`getPortfolio()`, mostra shell vazio honesto e trata ausência, ID inválido,
permission denied e falha de leitura com o mesmo estado de indisponibilidade.

## Escopo incluído

- Criar rota dinâmica Server Component e Client boundary conforme documentação
  local Next 16.
- Receber somente `portfolioId` como segmento de URL; não aceitar UID/query como
  ownership.
- Chamar `getPortfolio(portfolioId)` uma vez após AuthGate.
- Mostrar nome, BRL, data real de criação quando útil e mensagem de que recursos
  patrimoniais entram em fases futuras.
- Oferecer link de retorno para `/portfolios` e retry manual.
- Mapear `null`, `DomainError`, `PortfolioNotFoundError`, falha de permissão e
  `FirestoreOperationError` para “Não foi possível acessar esta carteira.”.
- Preservar estado de loading e impedir flash de detalhe anterior após troca de
  identidade/ID.

## Escopo excluído

- `notFound()` baseado em consulta client-only ou mensagens distintas para
  ausente/cross-user.
- Rename, delete, Transactions, Assets, saldo ou seleção global.
- Consulta direta ao SDK, path manual ou log de ID/UID.

## Dependências

- 006-01 e 006-02.
- `getPortfolio`, parser/converter e erros da fase 005.
- Documentação local Next 16 para params e composição Server/Client.

## Arquivos e símbolos prováveis

- `src/app/(app)/(protected)/portfolios/[portfolioId]/page.tsx`.
- `src/components/portfolio/portfolio-detail.tsx`.
- Helpers locais de erro/estado somente se houver duplicação real.

## Passos de implementação futura

1. Ler guia local de dynamic segments e layouts Next 16 antes de escrever a rota.
2. Manter page como composição Server e importar somente componente Client de
   Portfolio.
3. Validar segmento por repository/domínio; não normalizar silenciosamente IDs.
4. Fazer fetch one-shot e controlar mounted/pending state.
5. Renderizar conteúdo mínimo, heading hierárquico e navegação de retorno.
6. Unificar estados indisponíveis e testar ID aleatório, inválido e pertencente
   a outra conta.

## Testes e validação

```bash
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
```

Manual: abrir carteira própria, refresh, abrir duas carteiras distintas, ID
aleatório, segmento inválido, tentativa cross-user, anônimo, retry após falha e
back/keyboard. Confirmar que todas as falhas de acesso têm mesma mensagem e que
não há saldo/valor fictício.

## Definição de pronto

- URL dinâmica funciona em navegação direta e refresh.
- `getPortfolio()` é única via de leitura e ownership permanece no repository.
- Carteira ausente/inacessível não revela existência cross-user.
- Detalhe mostra somente campos reais do contrato 005.
- Loading, retry, retorno e sessão ausente são acessíveis.

## Riscos e cuidados

- Não usar `portfolioId` para construir path Firestore na UI.
- Não renderizar children privados antes de AuthGate confirmar sessão.
- Não confundir `null` do repository com prova de que ID não existe globalmente.
- Não assumir API de params Next 16 sem documentação instalada.

## Evidência esperada ao concluir

Registrar rota efetiva, estados, mensagens, comandos, matriz de acesso e riscos
residuais. Atualizar progresso somente desta subtarefa.
