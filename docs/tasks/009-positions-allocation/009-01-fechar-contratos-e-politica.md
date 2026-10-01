# 009-01 — Fechar contratos e política

- **Ticker:** `009`
- **Número:** `01`
- **Status:** `pending`

## Objetivo e resultado esperado

Transformar a direção do roadmap em contratos revisáveis para Position, Market
Position, Allocation e composição read-side. O resultado é uma decisão
documentada e testável sobre matemática, taxas, moedas, arredondamento,
zeragem, frescor e estados parciais antes de abrir os reducers.

## Requisitos cobertos

- Critérios 1–24 da spec 009, especialmente fonte da verdade, contrato de
  Position, média ponderada, moeda-base, Quote stale/unavailable e separação de
  Target Allocation.

## Escopo incluído

- Fechar tipos, campos, unions de estado e códigos de erro necessários.
- Fechar fórmula de buy/sell, semântica de `investedAmount` e `averageCost`.
- Fechar política de fee, moeda, precisão, half-up e overflow.
- Fechar formato/status de Allocation e diagnósticos sanitizados.
- Definir seams de dependência para testes do leitor.

## Escopo excluído

- Implementar reducer ou aritmética.
- Alterar `Transaction`, `Asset`, `Quote`, Firestore Rules ou schemas.
- Criar tela, rota, persistência, target allocation, FX ou dashboard.

## Dependências

- `docs/specs/007-assets-transactions.md` e ADR 006.
- `docs/specs/008-quotes-brapi.md` e handoff 008-06.
- Nenhuma decisão adicional de infraestrutura é necessária.

## Arquivos e símbolos prováveis

- `docs/specs/009-positions-allocation.md`.
- `src/domain/position-engine.ts`, `market-position.ts`, `allocation.ts`.
- `src/domain/errors.ts`, `src/domain/index.ts`.
- Tipos `Position`, `MarketPosition`, `AllocationResult` e respectivos
  resultados/diagnósticos.

## Passos de implementação

1. Registrar o baseline real e comparar cada contrato com a implementação atual.
2. Escrever tipos derivados sem importar Firebase, React ou provider.
3. Formalizar média ponderada, fees, moedas e política de arredondamento.
4. Definir comportamento para posição zerada, quote ausente/stale e Allocation
   sem denominador.
5. Revisar que nenhum tipo introduz target, performance, FX ou persistência.
6. Atualizar a spec somente com decisões confirmadas e registrar premissas
   residuais, sem iniciar a implementação dos reducers.

## Testes e comandos de validação

- Revisão estática dos contratos e links.
- Se houver apenas documentação, validar `git diff --check`.
- Antes de liberar a subtarefa para implementação, executar `npm run lint` e
  `npm exec next typegen && npx tsc --noEmit` quando os tipos forem criados.

## Definição de pronto

- Fórmulas, estados, moedas, escalas e erros estão explícitos na spec.
- Position não é documento nem autoridade de escrita.
- Allocation atual está separada de target allocation.
- 009-02 pode implementar sem decisão matemática bloqueante.

## Riscos e cuidados

- Não deixar arredondamento por evento implícito.
- Não ignorar fee incompatível nem transformar Quote unavailable em zero.
- Não aceitar `number` como representação financeira.
- Não resolver decisões de caixa, FX, histórico ou trusted boundary nesta fase.
