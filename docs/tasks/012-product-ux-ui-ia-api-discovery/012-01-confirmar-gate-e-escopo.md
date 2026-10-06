# 012-01 — Confirmar gate e escopo de discovery

- **Ticker:** `012`
- **Número:** `01`
- **Status:** `pending`

## Objetivo e resultado esperado

Confirmar a entrada operacional da fase, o aceite independente de C1, o limite
de C0 e a matriz de evidências. Resultado: plano de discovery liberado ou
explicitamente bloqueado, com decisões abertas e owners de revisão.

## Requisitos cobertos

- Critérios 1 e 10 da spec 012.
- Gate C1, contenção C0 e regra de não usar dados reais.

## Escopo incluído e excluído

Incluído: revisar handoff 011, registrar pré-condições, matriz manter/alterar,
experimentos e critérios de freeze. Excluído: protótipo, código, API, banco,
migração, deploy e aceite fictício de C1.

## Dependências

`docs/architecture/011/adr-register-and-handoff.md`, revisão independente de C1,
spec 012 e roadmap canônico.

## Arquivos e símbolos prováveis

`docs/architecture/012/decision-matrix.md`, overview/spec 012, C0/C1, ADRs 015,
016 e 021, handoff `frontend-ux-contract-discovery.md`.

## Passos de implementação

1. Conferir que 011 está documentalmente concluída e que C1 tem aceite formal.
2. Registrar C0, dados permitidos, owner e condição de saída.
3. Classificar decisões como preservar, experimentar, decidir na 012 ou deferir.
4. Publicar matriz de evidências, dependências e bloqueios.

## Testes e comandos de validação

Conferir links/tickers/statuses e executar `git diff --check`; não executar
experimentos com dados reais nem declarar C1 aceito sem evidência independente.

## Definição de pronto

Gate e escopo têm evidência, owners, bloqueios e critérios explícitos; a próxima
subtarefa elegível é a descoberta de jornadas.

## Riscos e cuidados

Não transformar o planejamento em aceite operacional, não ampliar C0 para
staging/produção e não tratar ADRs `proposed` como decisões implementadas.
