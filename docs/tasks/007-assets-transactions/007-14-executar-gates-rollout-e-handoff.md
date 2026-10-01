# 007-14 — Executar gates, rollout e handoff

- **Ticker:** `007`
- **Número:** `14`
- **Status:** `completed`

## Objetivo e resultado esperado

Fechar a emenda de lifecycle com evidência técnica, reconciliação de dados,
smoke autorizado, rollback e handoff, sem iniciar Quotes ou Positions.

## Requisitos cobertos

- Spec 007, critérios 12–12d, 24–31 e gates finais.
- Handoff 008 preservando Asset como identidade e 009 preservando ledger.

## Escopo incluído

- Testes de domínio, repository, Rules, regressão, lint, typegen, TypeScript,
  build e diff check.
- Auditoria sanitizada das Transactions legadas antes de habilitar delete.
- Ordem obrigatória: exigir guard em novas Transactions, executar auditoria
  completa, só então habilitar Rules/repository/UI de delete.
- Smoke autenticado com Asset sintético sem uso, com uso e conflito de edição.
- Rollout gradual, rollback de código/Rules e riscos residuais.

## Escopo excluído

- Deploy produtivo, seed, Console sem checkpoint, purge, archive de Asset,
  Quotes adicionais, Position ou dashboard.

## Dependências

- `007-10` a `007-13` concluídas e revisadas.
- Checkpoint humano para auditoria, smoke e publicação.

## Definição de pronto

- Gates passam ou falhas têm impacto explícito.
- Delete com uso é bloqueado e delete sem uso remove somente o par Asset/registry.
- Não há Transaction órfã, cascade ou segredo nas evidências.
- Overview chega a `14/14` somente após smoke autorizado e revisão.

## Testes e comandos de validação

```bash
npm run test:domain
JAVA_HOME=$(/usr/libexec/java_home -v 21) npm run test:rules
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
git diff --check
```

## Riscos e cuidados

- Não declarar auditoria, smoke ou rollout sem confirmação autorizada.
- Rollback de código/Rules não restaura dados nem desfaz edição; documentar isso.

## Execução

- **Status:** `completed`; os gates técnicos passaram, o usuário confirmou os
  testes autenticados de editar e excluir e autorizou o fechamento em ambiente
  de desenvolvimento sem usuários. Não houve dados legados, deploy produtivo,
  publicação de Rules ou alteração de ambiente nesta execução.
- **Arquivos alterados:** este arquivo e o overview 007; nenhuma alteração de
  código, Rules, dados ou ambiente foi feita nesta execução.
- **Decisões e desvios:** o fechamento foi limitado ao ambiente de
  desenvolvimento conforme checkpoint humano do usuário; não foi declarado
  rollout produtivo. O rollback documentado remove as ações da UI e
  retorna Rules para negar update/delete, sem desfazer edições confirmadas,
  remover guards ou restaurar Assets. Nenhum handoff novo foi iniciado.
- **Comandos executados:** `npm run test:domain`, `npm run test:rules`,
  `npm run lint`, `npm exec next typegen`, `npx tsc --noEmit`, `npm run build`
  e `git diff --check`.
- **Resultados e evidências:** 7 testes de domínio e 19 testes do Emulator de
  Rules passaram; lint, geração de tipos, TypeScript, build e diff check também
  passaram. O usuário confirmou que os testes autenticados de editar e excluir
  foram executados com sucesso. A confirmação não detalhou individualmente os
  cenários sem uso, com uso e conflito; eles não são atribuídos além dessa
  evidência manual agregada.
- **Riscos residuais:** não há runner automatizado de UI. Deploy produtivo,
  publicação de Rules e auditoria de dados produtivos permanecem fora desta
  execução e exigem novo checkpoint caso o ambiente deixe de ser somente de
  desenvolvimento.
