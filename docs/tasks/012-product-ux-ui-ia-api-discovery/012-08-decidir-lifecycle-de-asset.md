# 012-08 — Decidir lifecycle de Asset

- **Ticker:** `012`
- **Número:** `08`
- **Status:** `pending`

## Objetivo e resultado esperado

Executar UX-06 e revisar a ADR 021 para decidir como o produto comunica criação,
edição, archive/retire e tentativa de exclusão de Asset referenciado.

## Requisitos cobertos

Estabilidade de `assetId`, identidade econômica, histórico, referências,
duplicidade e decisão de produto para Asset usado.

## Escopo incluído e excluído

Incluído: protótipo de catálogo, estados de referência e política de identidade.
Excluído: FK, locks, enforcement, migração e implementação de comandos.

## Dependências

`012-02`, `012-05`, `012-07`, ADR 021 e `src/components/asset/*`.

## Arquivos e símbolos prováveis

`docs/architecture/012/slices/asset-lifecycle.md`,
`docs/decisions/021-lifecycle-de-asset-referenciado.md`, `AssetCatalog`,
`AssetCreateForm`, `AssetEditForm`.

## Passos de implementação

1. Testar editar, duplicidade, arquivar/retirar e apagar Asset não usado/usado.
2. Decidir se identidade usada é imutável ou exige correção explícita auditada.
3. Definir mensagens, histórico legível e capability provisória.
4. Encaminhar enforcement para 016/018 sem copiar registries Firestore.

## Testes e comandos de validação

Walkthrough de conflitos e referências com fixtures sintéticas; validar que não
há troca de ID, cascade ou mutação silenciosa.

## Definição de pronto

ADR 021 revisada com decisão/hipótese, impacto em 017/018 e pacote de estados e
copy do lifecycle.

## Riscos e cuidados

Não tratar `assetUsages` como autoridade, não remover contexto histórico e não
prometer correção automática de fatos antigos.
