# 006-04 — Implementar renomeação

- **Ticker:** `006`
- **Número:** `04`
- **Status:** `pending`

## Objetivo

Adicionar rename simples no detalhe, reutilizando exatamente o contrato de nome
da fase 005 e sem permitir alteração da moeda base.

## Resultado esperado

Usuário pode editar nome válido, recebe sucesso no mesmo detalhe e vê erro
recuperável para input/persistência. Nome equivalente após trim não provoca write.

## Escopo incluído

- Formulário de rename no detalhe com `Label`, `Input` e botão explícito.
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

- `src/components/portfolio/portfolio-detail.tsx` ou componente de rename
  separado em `src/components/portfolio/`.
- `src/domain/portfolio.ts` somente para reutilização, sem alteração esperada.

## Passos de implementação futura

1. Separar estado de valor digitado, mensagem de validação e pending.
2. Normalizar nome pelo parser no submit.
3. Se normalizado igual ao atual, não chamar repository; informar que nada mudou.
4. Usar update orientado a domínio e permanecer na rota em sucesso.
5. Preservar nome anterior quando persistência falhar e oferecer retry.
6. Associar erro ao input e sucesso a região live.

## Testes e validação

```bash
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
```

Manual: nome válido, vazio, whitespace, 101 caracteres, Unicode, mesmo nome,
nome com espaços externos, duplo clique, erro/retry, refresh e alteração
persistida. Confirmar que baseCurrency permanece BRL.

## Definição de pronto

- Rename usa `updatePortfolio` e invariantes existentes.
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
