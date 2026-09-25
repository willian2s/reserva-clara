# 006-04 — Implementar renomeação

- **Ticker:** `006`
- **Número:** `04`
- **Status:** `completed`

## Objetivo

Adicionar rename simples em `/portfolios/[portfolioId]/settings`, reutilizando
exatamente o contrato de nome da fase 005 e sem permitir alteração da moeda base.

## Resultado esperado

Usuário pode editar nome válido em settings, recebe sucesso na mesma rota e vê
erro recuperável para input/persistência. Nome equivalente após trim não provoca
write.

## Escopo incluído

- Rota canônica `/portfolios/[portfolioId]/settings` com Server Component de
  composição e Client Component interativo.
- Formulário de rename em settings com `Label`, `Input` e botão explícito.
- Detalhe patrimonial sem formulário ou ação de rename/delete, com link explícito
  e acessível para settings.
- Valor inicial igual ao nome persistido, sem perder edição local durante
  carregamento.
- Validar com `parsePortfolioName`; não duplicar limite/regra em regex da UI.
- Chamar `updatePortfolio(portfolioId, { name })` somente após validação.
- Tratar nome vazio, whitespace, limite, Unicode, nome igual após trim, loading,
  erro e sucesso.
- Desabilitar submit durante update e impedir double submit.
- Atualizar estado local com retorno do repository e anunciar feedback via
  `role=status`/`aria-live`.
- Não expor erro Firebase, path, UID ou stack trace.

## Escopo excluído

- Edição de `baseCurrency` ou novo campo no schema.
- Delete, archive, Transactions ou formulário global.
- Chamada Firestore direta ou upsert.

## Dependências

- 006-03 detalhe concluído.
- `parseUpdatePortfolioInput`, `parsePortfolioName` e `updatePortfolio` da fase 005.
- Tokens e componentes UI existentes.

## Arquivos e símbolos prováveis

- `src/app/(app)/(protected)/portfolios/[portfolioId]/settings/page.tsx`.
- `src/components/portfolio/portfolio-settings.tsx` e hook compartilhado de
  leitura owner-scoped em `src/components/portfolio/`.
- `src/components/portfolio/portfolio-detail.tsx` somente para contexto
  patrimonial e link de administração.
- `src/domain/portfolio.ts` somente para reutilização, sem alteração esperada.

## Passos de implementação futura

1. Criar rota settings com `PageProps` assíncrono conforme documentação local
   Next 16 e manter page como composição Server.
2. Reutilizar hook Client de `getPortfolio` no detalhe e settings, com loading,
   indisponibilidade, retry e proteção contra respostas obsoletas.
3. Separar estado de valor digitado, mensagem de validação e pending em settings.
4. Normalizar nome pelo parser no submit.
5. Se normalizado igual ao atual, não chamar repository; informar que nada mudou.
6. Usar update orientado a domínio, aplicar retorno ao estado e permanecer em
   settings em sucesso.
7. Preservar nome anterior quando persistência falhar e oferecer retry.
8. Associar erro ao input e sucesso a região live.

## Testes e validação

```bash
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
```

Manual: detalhe sem formulário/ações administrativas; link acessível para
settings; nome válido, vazio, whitespace, 101 caracteres, Unicode, mesmo nome,
nome com espaços externos, duplo clique, erro/retry, refresh e alteração
persistida em settings. Confirmar que baseCurrency permanece BRL e não é
editável.

## Definição de pronto

- Rename fica somente em settings, usa `updatePortfolio` e invariantes existentes.
- `/portfolios/[portfolioId]` mostra somente contexto patrimonial e link para
  administração.
- Nome igual após trim não gera escrita.
- Estado pending bloqueia concorrência e feedback é acessível.
- Erro não perde valor persistido nem mostra detalhes internos.
- Nenhum campo/domínio/Rule foi ampliado.

## Riscos e cuidados

- Não criar segunda validação divergente de `parsePortfolioName`.
- `updatePortfolio` não faz upsert; tratar `PortfolioNotFoundError` como acesso
  indisponível sem revelar estado global.
- Não usar cor Emerald como significado financeiro; sucesso deve ter texto.

## Evidência esperada ao concluir

Registrar arquivos, casos de input, comportamento de no-op, comandos, resultados
e riscos residuais. Marcar somente 006-04 ao concluir.

## Registro de execução

### Status

`completed`.

### Arquivos alterados

- `src/app/(app)/(protected)/portfolios/[portfolioId]/settings/page.tsx` — rota
  canônica Server para settings, com `PageProps` assíncrono de Next 16.
- `src/components/portfolio/portfolio-settings.tsx` — carregamento owner-scoped,
  formulário de rename, validação, mutação, estados de pending/erro/sucesso e
  atualização local pelo retorno do repository.
- `src/components/portfolio/use-portfolio.ts` — leitura Client compartilhada por
  detalhe e settings, com loading, indisponibilidade, retry e generation guard.
- `src/components/portfolio/portfolio-detail.tsx` — remoção do formulário de
  rename e inclusão de link explícito para settings; contexto patrimonial fica
  separado da administração.
- `docs/specs/006-portfolio-management.md`,
  `docs/tasks/006-portfolio-management/006-00-overview.md` e este arquivo —
  rotas, ownership de UX e evidências revisados sem alterar contratos de domínio
  ou repository.

### Decisões e desvios

- A causa da revisão foi a mudança de requisito UX: ações administrativas não
  podem permanecer no detalhe patrimonial. O formulário foi movido, não
  duplicado, para `PortfolioSettings` em `/settings`; detalhe ficou sem rename e
  sem delete.
- Page de settings permanece Server Component de composição; componentes Client
  chamam `getPortfolio`/`updatePortfolio` pelo repository, mantendo ownership
  derivado da sessão e sem SDK Firestore direto na UI.
- `usePortfolio` consolida leitura one-shot, retry e proteção contra respostas
  tardias para evitar duplicar acesso e estados entre detalhe e settings.
- Rename continua usando somente `parsePortfolioName` e `updatePortfolio`; nome
  normalizado igual ao persistido encerra submit sem write e atualiza o estado de
  sucesso com o objeto retornado.
- Draft local é separado do Portfolio carregado. Nome persistido inicializa o
  input somente quando carteira muda; retry/loading do mesmo ID não sobrescreve
  edição local.
- `PortfolioNotFoundError` durante update converge para estado indisponível com
  mensagem sanitizada; demais falhas mostram retry implícito pelo mesmo formulário
  e preservam carteira/nome persistidos.
- `baseCurrency` não entra no formulário nem no payload de update.
- 006-05 permanece `pending`; delete não foi implementado e seu planejamento foi
  apontado para settings.
- Após revisão independente, a operação pending passou a carregar versão de rota:
  respostas tardias são descartadas e o formulário não fica bloqueado em retorno
  `A → B → A`; o `finally` limpa somente a operação que terminou.

### Comandos executados

Resultados abaixo referem-se à revisão atual, após mover rename para settings:

- `npm run lint` — passou.
- `npm exec next typegen` — passou.
- `npx tsc --noEmit` — passou.
- `npm run build` — passou; build reconheceu `/portfolios/[portfolioId]` e
  `/portfolios/[portfolioId]/settings`.
- `git diff --check` — passou.
- `JAVA_HOME=$(/usr/libexec/java_home -v 21) npm run test:rules` — passou; 5
  testes, 0 falhas, usando Firestore Emulator no projeto demo.

### Resultados e evidências

- Esta revisão mantém `Label`, `Input`, botão explícito, `aria-invalid`,
  `aria-describedby`, `role="alert"` e `role="status"`/`aria-live` na rota de
  settings.
- `parsePortfolioName` continua antes de `updatePortfolio`; vazio, whitespace,
  limite Unicode e nome inválido não chegam ao repository. Nome válido é enviado
  normalizado após trim.
- Ref de submissão e estado de operação bloqueiam double submit; input e botão
  ficam disabled durante update. No-op não grava e informa nada alterado.
- Sucesso aplica objeto retornado por `updatePortfolio` ao estado de settings e
  ao input, permanecendo na rota. Falha operacional exibe somente mensagem
  genérica e permite novo submit.
- Detalhe continua com nome, BRL/data reais e contexto patrimonial, sem formulário
  ou ação administrativa; link para Configurações da carteira é explícito e
  operável por teclado.
- Settings exibe `baseCurrency` real somente para leitura e oferece retry
  sanitizado para indisponibilidade/leitura.
- Validação manual da rota settings foi confirmada pelo usuário como aprovada;
  casos individuais da matriz não foram discriminados no relato.
- Revisão independente final após correção de concorrência: sem blockers, high,
  medium ou low findings.

### Evidência preservada da execução anterior

- A execução anterior registrou gates técnicos, revisão independente sem findings
  e a implementação de parser, no-op, pending, feedback e atualização pelo
  retorno do repository. Essa evidência permanece histórica da implementação
  anterior no detalhe e não é apresentada como validação da nova rota.
- O relato manual anterior informou sucesso, mas não discriminou casos da matriz.
  Após a mudança de rota, validação manual em browser para settings, teclado,
  retry, Unicode e persistência após refresh permanece pendente.

### Riscos residuais

- Casos individuais de link do detalhe, teclado, double click, retry real, Unicode
  e persistência após refresh não foram discriminados no relato manual recebido.
- Não há runner automatizado de UI no projeto; lint, typecheck e build não
  substituem smoke autenticado.
