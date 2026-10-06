# 012-13 — Consolidar freezes e handoff

- **Ticker:** `012`
- **Número:** `13`
- **Status:** `pending`

## Objetivo e resultado esperado

Consolidar as decisões da fase em pacotes de freeze por slice e produzir handoff
executável para 013–019, com riscos residuais, owners, dependências e critérios
de revisão.

## Requisitos cobertos

Critérios 9 e 10 da spec, documentação final, ordem, checkpoints e handoff.

## Escopo incluído e excluído

Incluído: revisar artefatos 012, atualizar ADRs sem promover evidência ausente,
matriz de decisões e handoff. Excluído: implementação de qualquer decisão,
alteração de produção, banco, deploy ou cutover.

## Dependências

Todas as subtarefas 012-01 a 012-12 concluídas e C1 aceito.

## Arquivos e símbolos prováveis

`docs/architecture/012/adr-register-and-handoff.md`, pacotes em
`docs/architecture/012/slices/`, ADRs 015/016/021, spec e overview 012.

## Passos de implementação

1. Conferir que cada jornada tem protótipo, estados, a11y, copy e capability.
2. Separar decisões aceitas, recomendações, hipóteses e pendências.
3. Montar handoff específico para 013, 014, 015, 016, 017, 018 e 019.
4. Atualizar overview para `completed` somente após a revisão independente de
   todos os artefatos e marcar cada subtarefa concluída de forma rastreável.

## Testes e comandos de validação

Executar conferência bidirecional spec ↔ overview ↔ subtarefas ↔ architecture,
validar links/tickers/checklist, `git diff --check` e inspeção de ausência de
segredos/dados reais.

## Definição de pronto

Handoff revisado, pacotes versionados, checklist/progresso coerentes, ADRs com
status temporal correto e nenhuma implementação futura apresentada como feita.

## Riscos e cuidados

Não marcar a fase concluída apenas por criar arquivos, não congelar OpenAPI final
e não reabrir features normais antes do gate 021.
