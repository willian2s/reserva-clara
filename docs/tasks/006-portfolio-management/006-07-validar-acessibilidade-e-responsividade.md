# 006-07 — Validar acessibilidade e responsividade

- **Ticker:** `006`
- **Número:** `07`
- **Status:** `pending`

## Objetivo

Provar que listagem, formulário, detalhe, rename e confirmação de delete são
claros, operáveis e coerentes com foundations de marca em mobile, tablet e
desktop.

## Resultado esperado

Fluxos essenciais funcionam com teclado e viewport estreito, estados são
anunciados e nenhum controle depende somente de cor, hover ou pointer.

## Escopo incluído

- Revisar landmarks, H1/H2, ordem de headings e nomes de navegação.
- Confirmar `Label` associado ao nome, `aria-invalid`, `aria-describedby` e
  mensagens próximas ao campo.
- Confirmar `role=status`/`aria-live` para loading, sucesso e operações;
  `role=alert` quando falha exigir atenção.
- Confirmar disabled durante fetch/create/rename/delete e ausência de double
  submit.
- Validar foco ao abrir/cancelar confirmação inline e foco visível global.
- Validar targets de toque, quebra de cards/formulário, overflow, zoom e
  orientação em mobile/tablet/desktop.
- Confirmar contraste dos tokens existentes, sem introduzir hex arbitrário,
  Emerald como performance ou cor como único significado.
- Validar leitura por árvore acessível/leitor de tela disponível e registrar
  limitações reais.

## Escopo excluído

- Instalar ferramenta de a11y, Playwright ou runner E2E pesado.
- Criar Dialog, Toast, Sidebar, dark mode ou novo catálogo sem necessidade.
- Alterar marca, tokens globais ou Auth architecture sem falha concreta.

## Dependências

- 006-01 a 006-06 concluídas.
- Foundations 002 e componentes Base UI atuais.
- Browser/viewport disponíveis para validação manual.

## Arquivos e símbolos prováveis

- `src/components/portfolio/*`.
- `src/app/(app)/(protected)/layout.tsx` e páginas protegidas.
- `src/app/globals.css` somente se correção de token semanticamente necessária.
- `src/components/ui/*` somente se regressão concreta em componente existente.

## Passos de implementação futura

1. Validar sem mouse os fluxos de criação, navegação, rename e delete.
2. Exercitar loading/erro/sucesso e confirmar anúncios sem duplicação.
3. Medir/observar foco, contraste, targets, overflow e headings em viewport
   `390x844`, tablet e desktop.
4. Corrigir somente a camada responsável, sem refactor oportunista.
5. Reexecutar lint e gates se houver correção.
6. Registrar browsers indisponíveis e não declarar cobertura que não ocorreu.

## Testes e validação

- Navegação completa por teclado e Enter/Space em links/botões.
- Inspeção de árvore acessível e leitor de tela disponível.
- Viewports mobile, tablet e desktop; zoom razoável e orientação.
- Matriz manual da spec: auth restoring, empty, list, create, detail, rename,
  delete/cancel/error/retry.
- `npm run lint` após qualquer ajuste.

## Definição de pronto

- Headings, labels, mensagens, foco e live regions são verificáveis.
- Confirmação de delete é compreensível e cancelável por teclado.
- Cards e formulário cabem em mobile sem tabela larga/overflow.
- Contraste e estados não dependem somente de cor.
- Limitações de browser/leitor ficam registradas sem esconder falha.

## Riscos e cuidados

- Não aprovar screenshot bonita sem testar teclado e estado de erro.
- Não usar `aria-live` em bloco que reescreve conteúdo excessivamente sem
  necessidade; mensagens devem ser curtas e estáveis.
- Não usar hover para revelar rename/delete.
- Leitor de tela dedicado pode não estar disponível; registrar evidência real.

## Evidência esperada ao concluir

Registrar matriz por viewport/browser, foco/teclado/ARIA/contraste, arquivos
ajustados, comandos, resultado e limitações residuais. Atualizar somente 006-07.
