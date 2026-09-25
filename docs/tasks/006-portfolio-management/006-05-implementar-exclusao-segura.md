# 006-05 — Implementar exclusão segura

- **Ticker:** `006`
- **Número:** `05`
- **Status:** `completed`

## Objetivo

Implementar hard delete de Portfolio somente em
`/portfolios/[portfolioId]/settings`, com confirmação explícita, feedback
acessível e sem cascade client-side.

## Resultado esperado

Usuário identifica carteira em settings, pode cancelar a exclusão sem efeito e,
após segunda confirmação, remove o documento próprio via `deletePortfolio` e
retorna à lista. Falhas permanecem recuperáveis.

## Escopo incluído

- Ação de delete visível e operável por teclado em settings.
- Confirmação inline em duas etapas, sem depender de hover ou clique único.
- Mostrar nome atual, instrução de digitação exata e texto de permanência.
- Exigir que o usuário digite exatamente o nome normalizado exibido; manter o
  botão `Deletar permanentemente` disabled até coincidir.
- Botões `Cancelar` e `Deletar permanentemente`, foco e ordem de tabulação
  coerentes.
- Desabilitar ações durante delete e impedir double submit.
- Chamar somente `deletePortfolio(portfolioId)` do repository.
- Em sucesso, `router.replace("/portfolios")` e nova leitura da lista ao montar.
- Em erro, preservar detalhe e oferecer retry com mensagem sanitizada.
- Documentar que, em 006, hard delete remove pai somente enquanto não há filhos;
  com filhos a operação deve ser rejeitada, nunca cascade. Não há undo.

## Escopo excluído

- Cascade manual, batch client-side, Cloud Functions, Admin SDK ou archive em
  006. Archive é política futura e precisa de task própria antes de 007.
- Campo `archivedAt`, `status`, confirmação global ou restauração.
- Delete em massa ou ação oculta somente em menu/hover.
- Alteração de `firestore.rules`, converter, parser ou schema sem incompatibilidade
  concreta.

## Dependências

- 006-03 detalhe concluído; 006-04 pode estar concluída para manter composição
  de ações consistente.
- `deletePortfolio` e Rules CRUD owner-scoped da fase 005.
- Componentes Button/Card/Label/Input e foco global existentes.

## Arquivos e símbolos prováveis

- `src/components/portfolio/portfolio-settings.tsx` ou componente local de
  confirmação em settings.
- `src/data/firestore/portfolio-repository.ts` somente se uma falha concreta do
  contrato atual aparecer; não refatorar oportunisticamente.

## Passos de implementação futura

1. Renderizar confirmação inline em settings após primeiro acionamento e mover
   foco para o input; devolver foco ao trigger ao cancelar.
2. Exibir nome atual e instrução clara; comparar com nome normalizado sem expor
   ID ou path.
3. Manter `Deletar permanentemente` disabled até a comparação exata passar.
4. Bloquear controles enquanto a operação está pendente.
5. Executar delete owner-scoped, sem pré-check usado como autorização.
6. Tratar sucesso, erro, cancelamento e navegação.
7. Reconfirmar que nenhum path de subcollection é tocado.

## Testes e validação

```bash
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
```

Manual em settings: abrir confirmação, foco no input, nome incorreto, nome exato,
cancelar, teclado, confirmar, double click, erro/reconciliação, retorno à lista,
refresh e tentativa de delete cross-user. Confirmar ausência do documento próprio no smoke
autorizado e ausência de qualquer operação em Transactions.

## Definição de pronto

- Dois passos explícitos em settings identificam a carteira; digitação exata habilita ação
  permanente somente após confirmação do alvo.
- Cancelar não escreve nem remove dados.
- Delete usa repository existente, fica owner-scoped e não faz cascade.
- Pending, erro e sucesso são comunicados por texto/ARIA, não só cor.
- Hard delete está documentado como válido somente antes de filhos.

## Riscos e cuidados

- Delete é irreversível; não prometer undo ou recuperação por rollback de código.
- Firestore não remove subcollections automaticamente; não abrir Transaction
  path nem simular limpeza.
- UI não é autorização; Rules devem bloquear manipulação manual.
- Antes de 007, lifecycle precisa bloquear início da fase até archive ser
  implementado e `allow delete` ser removido das Rules. A partir da transição,
  delete físico é rejeitado estruturalmente para qualquer Portfolio; não tentar
  descobrir filhos por pre-check client-side.

## Evidência esperada ao concluir

Registrar arquivos, fluxo de confirmação, comandos, matriz de cancelamento/delete,
resultado e risco residual de irreversibilidade. Atualizar somente 006-05 no
overview.

## Registro de execução

### Status

`completed`.

### Arquivos alterados

- `src/components/portfolio/portfolio-settings.tsx` — ação de exclusão somente
  em settings, confirmação inline em duas etapas, foco, estados de pending/erro,
  bloqueio de concorrência e retorno por `router.replace`.

### Decisões e desvios

- Confirmação exige digitação exata do nome normalizado exibido; o botão
  `Deletar permanentemente` permanece disabled até coincidir.
- Cancelamento limpa confirmação e devolve foco ao trigger. Foco inicial é
  aplicado ao input por `ref`/`useEffect`.
- Exclusão chama somente `deletePortfolio(portfolioId)`, sem leitura adicional,
  pre-check, cascade, SDK ou path na UI. Erros ficam na confirmação com mensagem
  sanitizada e input preservado para retry.
- Durante delete, formulário de rename, confirmação e navegação administrativa
  ficam bloqueados; estado textual `role=status` anuncia pending e erro usa
  `role=alert`/`aria-live`.
- Ao trocar `portfolioId`, confirmação, nome digitado e mensagens são invalidados
  antes de permitir nova confirmação; operação pendente mantém bloqueio até seu
  encerramento. Trigger expõe `aria-expanded`/`aria-controls` e foco de cancelar
  retorna após o fechamento renderizado. Após delete confirmado, o lock permanece
  até a navegação para evitar segunda submissão durante `router.replace`.
- Hard delete continua válido somente enquanto Portfolio não possuir filhos; a
  transição para archive e remoção futura de `allow delete` nas Rules permanece
  gate bloqueante de 007.

### Comandos executados

- `npm run lint` — passou.
- `npm exec next typegen` — passou.
- `npx tsc --noEmit` — passou.
- `npm run build` — passou; build reconheceu `/portfolios/[portfolioId]/settings`.
- `git diff --check` — passou.
- `JAVA_HOME=$(/usr/libexec/java_home -v 21) npm run test:rules` — passou; 5
  testes, 0 falhas, Rules sem alteração; Emulator reexecutado.

### Resultados e evidências

- A ação administrativa existe somente no Client Component de settings; detalhe,
  repository, schema, converter, parser e Rules não foram alterados.
- Fluxos implementados: abrir confirmação, nome incorreto disabled, nome exato,
  cancelar sem write, teclado/tab order, foco, double submit, falha recuperável
  sem perda de input e sucesso com `router.replace("/portfolios")`.
- Operação mantém ownership no repository existente e remove somente documento
  pai conforme contrato 006; nenhum caminho de subcoleção ou Transaction é tocado.
- Usuário confirmou validação manual autenticada funcionando em settings, incluindo
  fluxo de confirmação, cancelamento, exclusão e retorno à lista.
- Revisão independente encontrou risco de confirmação stale em troca de rota e
  trigger reabrível, além de janela de dupla submissão após sucesso; riscos foram
  corrigidos, com os gates técnicos e Rules Emulator reexecutados sem falhas.

### Riscos residuais

- Validação manual autenticada de foco, teclado, erro real, double click e
  ausência do documento após delete permanece pendente; projeto não possui runner
  automatizado de UI.
- Exclusão é irreversível e não oferece undo. Gate de archive/007 continua
  bloqueado até mudança coordenada de domínio, repository, Rules e testes.
- Navegação global do shell não recebe estado pending desta subtarefa; saída por
  navegação externa durante request permanece risco residual não coberto pelo
  bloqueio local.
