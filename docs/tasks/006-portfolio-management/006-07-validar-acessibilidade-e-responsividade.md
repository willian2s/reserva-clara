# 006-07 — Validar acessibilidade e responsividade

- **Ticker:** `006`
- **Número:** `07`
- **Status:** `completed`

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

## Registro de execução

### Status

`completed` — implementação, gates e validação manual confirmadas pelo usuário.

### Arquivos alterados

- `src/app/(app)/(protected)/layout.tsx` — skip link, alvo principal focável e
  targets de toque mínimos na navegação.
- `src/components/portfolio/portfolio-list.tsx` — headings semânticos, link de
  carteira com affordance persistente/target ampliado e quebra de nomes longos.
- `src/components/portfolio/portfolio-create-form.tsx` — lock mantido durante
  navegação após criação, evitando double submit.
- `src/components/portfolio/portfolio-detail.tsx` — quebra de nomes longos no
  detalhe.
- `src/components/portfolio/portfolio-settings.tsx` — quebra de nomes longos em
  settings e confirmação de exclusão.
- Este arquivo e `006-00-overview.md` — status, evidências e confirmação registrados.

### Decisões e desvios

- `CardTitle`, que renderiza `div`, não foi alterado globalmente; listagem passou
  a usar `h2` explícito para evitar impacto no login e preservar escopo mínimo.
- Skip link usa `main#main-content` com `tabIndex={-1}`, permitindo transferência
  de foco por navegação de fragmento sem componente Client novo.
- Nomes aceitos pelo domínio podem ter 100 caracteres Unicode; `break-words` e
  `overflow-wrap:anywhere` evitam overflow em cards, detalhe e confirmação.
- Create mantém `submittingRef`, estado disabled e anúncio live até `router.push`
  iniciar navegação. Nenhum token, hex ou dependência nova foi introduzido.
- Sem alteração em Rules, domínio, repository ou design tokens.

### Comandos executados

```bash
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
git diff --check
JAVA_HOME=$(/usr/libexec/java_home -v 21) npm run test:rules
```

### Resultados e evidências

- Auditoria estática confirmou H1/H2/H3 coerentes em listagem, detalhe e
  settings; labels, `aria-invalid`, `aria-describedby`, `role=alert`,
  `role=status`/`aria-live`, disabled e confirmação inline permanecem associados
  aos fluxos.
- Skip link e foco global usam tokens existentes. Navegação principal e links de
  carteira receberam área mínima `min-h-11`; link de carteira mantém sublinhado
  sem depender de hover.
- Overflow foi mitigado para nomes longos em listagem, detalhe, settings e
  confirmação de delete. Nenhum controle depende somente de cor.
- Create não libera submit concorrente entre persistência bem-sucedida e
  navegação para detalhe.
- `npm run lint`, typegen, TypeScript, build e `git diff --check` passaram.
- Rules Emulator passou com 5 testes, 5 aprovados e 0 falhas; Rules sem alteração.
- Revisão independente pós-correção aprovou implementação sem bloqueadores de
  código; apontou somente limitação de validação manual.

### Matriz de validação

| Área | Evidência disponível | Resultado |
| --- | --- | --- |
| Headings, landmarks e navegação | Inspeção de código; `main`, `nav`, H1/H2/H3 e skip link | Aprovado estaticamente |
| Labels, ARIA e mensagens | Inspeção de formulários, estados e regiões live | Aprovado estaticamente |
| Foco e teclado | Foco visível global e foco inline de confirmação inspecionados | Confirmado manualmente |
| Double submit/disabled | Refs, estados e lock durante navegação inspecionados | Aprovado estaticamente |
| Mobile/tablet/desktop, zoom/orientação | Classes responsivas e quebra de conteúdo inspecionadas | Confirmado manualmente |
| Contraste/tokens | Tokens semânticos existentes inspecionados; sem hex novo | Confirmado manualmente |
| Árvore acessível/leitor de tela | Validação manual confirmada pelo usuário | Confirmado manualmente |

### Riscos residuais

- Browser e leitor de tela não foram identificados no relato; evidência manual
  baseia-se na confirmação do usuário de que todos os cenários solicitados
  funcionaram.
- Smoke autenticado e validação produtiva pertencem a 006-08.
- Revisão visual real pode revelar diferenças de target/contraste que lint,
  typecheck, build e inspeção estática não medem.

### Confirmação manual

- Usuário confirmou: “Tudo funcionando”, cobrindo validação manual solicitada de
  teclado, foco, estados, responsividade, zoom/orientação, contraste e árvore
  acessível/leitor de tela.
