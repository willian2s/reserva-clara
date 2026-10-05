# 011-02 — Mapear domínio, dados e riscos atuais

- **Ticker:** `011`
- **Número:** `02`
- **Status:** `pending`

## Objetivo e resultado esperado

Documentar contratos de domínio, modelo Firestore, queries, ownership,
integrações, invariantes e dívidas atuais. O resultado deve separar princípios
de produto preserváveis de mecanismos específicos do Firestore/Next.

## Requisitos cobertos

- Mapear `domain`, `server`, `data`, Firebase Auth/Admin, Firestore e BRAPI.
- Identificar entidades, value objects, invariantes, precisão e ordenação.
- Mapear documentos, paths, referências, ownership, Rules e queries.
- Inventariar riscos de segurança, integridade, escala, observabilidade e dados.
- Definir o checkpoint C0 para a fragilidade de `SELL` direto.

## Escopo

### Incluído

- Portfolio, Asset, Transaction, Quote, Position, Allocation e dashboards.
- Repositories, parsers/converters, Rules, read-side, QuoteService/cache.
- Dados legados previstos (`archivedAt`/`fee` ausentes) e necessidade de
  volumetria/anomalias sanitizadas.
- Classificação preservar/corrigir/substituir/remover.

### Excluído

- ERD final e DDL, tratados em 011-04.
- Implementação de boundary temporário para `SELL`.
- Leitura ou cópia de segredo/valor financeiro para documentação.

## Dependências

- Código, specs e ADRs 005–010.
- Pode ocorrer em paralelo com 011-01.

## Arquivos e símbolos prováveis

- Leitura: `src/domain/**`, `src/data/**`, `src/server/**`, `firestore.rules`,
  `firebase.json`, `tests/**`, `scripts/**`, specs/ADRs 005–010.
- Símbolos: `parseDecimalString`, `reducePositions`, `compareTransactions`,
  repositories Firestore, `createQuotesPostHandler`, `QuoteService`.
- Saída provável: `docs/architecture/011/domain-data-inventory.md`.

## Passos de implementação

1. Catalogar entidades, VOs, enums, serviços e read models.
2. Registrar invariantes e sua camada atual de enforcement.
3. Desenhar paths/documentos Firestore e relações implícitas.
4. Listar operações/queries, scans e ordenações em memória.
5. Mapear auth/ownership e diferenças entre Rules, Admin e repository.
6. Documentar BRAPI, cache, timeout, retry, lotes e limites por processo.
7. Levantar volumetria/anomalias sem persistir dados sensíveis.
8. Definir opções e deadline para C0: risco aceito em ambiente confiável,
   suspensão de writes ou bridge transitório sem dual-write.
9. Revisar o mapa contra testes e decisões históricas.

## Testes e comandos de validação

- Conferência de cada path contra `src/data/firestore/paths.ts` e Rules.
- Matriz invariante → código → teste → lacuna.
- Verificação dos limites decimal/timestamp em código e fixtures.
- Busca por acesso Firestore/Admin/BRAPI fora dos boundaries catalogados.
- `git diff --check` nos artefatos documentais.

## Definição de pronto

- Modelo atual e ownership estão completos e revisados.
- Invariantes preserváveis e dívidas estão separados.
- Risco de `SELL`, precisão, legado, credencial local e cache estão explícitos.
- Há insumo suficiente para arquitetura, ERD e migração.
- Nenhum dado sensível ou código de produção foi alterado.

## Riscos e cuidados

- Rules não provam saldo agregado; não documentar garantia inexistente.
- `assetUsages` não é posição nem contador.
- Não assumir que timestamps PostgreSQL preservam nanossegundos.
- Não registrar UID, IDs reais, tokens ou payload financeiro no inventário.
