# 012-11 — Realizar spike de frontend e data layer

- **Ticker:** `012`
- **Número:** `11`
- **Status:** `pending`

## Objetivo e resultado esperado

Comparar, em spike descartável e sem dados reais, opções para router, cliente
HTTP, estado de servidor, cache, invalidação, validação runtime e estado local de
formulário/sessão.

## Requisitos cobertos

UX-10, ADR 015 e boundaries React/Vite previstos para 013.

## Escopo incluído e excluído

Incluído: uma leitura e um formulário contra API falsa, isolamento por owner,
refresh, erro e invalidação. Excluído: criar app Vite produtivo, instalar
dependência definitiva, integrar Firebase/API real ou migrar componentes.

## Dependências

`012-04`, `012-06`, `012-07`, `012-09` e `012-10`.

## Arquivos e símbolos prováveis

`docs/architecture/012/frontend-data-layer-decision.md`, ADR 015,
`src/components/*` como referência, `src/data/*` como legado a substituir.

## Passos de implementação

1. Definir critérios de comparação: testabilidade, bundle, auth, cache,
   invalidação, owner isolation e complexidade.
2. Comparar history router e organização por capability/feature.
3. Comparar cache de servidor em memória com estado local e formulário local.
4. Registrar recomendação e o que permanece para 013/017.

## Testes e comandos de validação

Spike deve provar troca de owner limpa cache, refresh preserva último dado e
comando confirmado invalida leitura; validar artefato e `git diff --check`.

## Definição de pronto

ADR 015 revisada com decisão baseada em critérios e limitações, sem afirmar que a
stack produtiva já existe.

## Riscos e cuidados

Não persistir cache patrimonial em localStorage, não criar store global de
negócio e não importar Firestore no frontend alvo.
