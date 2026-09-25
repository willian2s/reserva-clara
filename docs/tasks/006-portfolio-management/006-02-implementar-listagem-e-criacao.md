# 006-02 — Implementar listagem e criação

- **Ticker:** `006`
- **Número:** `02`
- **Status:** `completed`

## Objetivo

Entregar `/portfolios` com listagem owner-scoped, empty state, loading, erro,
retry e criação de múltiplas carteiras usando exclusivamente repository e
invariantes da fase 005.

## Resultado esperado

Usuário autenticado sem carteiras entende próximo passo e cria a primeira.
Usuário com uma ou mais carteiras vê cards com dados reais e pode iniciar nova
criação. Sucesso navega para o detalhe da carteira criada.

## Escopo incluído

- Criar Server Component de rota e Client boundary mínima para operações.
- Chamar `listPortfolios()` uma vez após AuthGate confirmar sessão.
- Modelar estados `loading`, `ready`, `empty` e `error` com retry manual.
- Renderizar cards/lista responsivos com nome, `BRL` e data real quando útil.
- Ordenar em memória por `createdAt` decrescente e `id` como desempate, sem
  ordenação configurável, paginação ou índice composto.
- Formulário com único input de nome, `Label`, `Input`, mensagem associada e
  texto fixo “Moeda base: BRL — fixa nesta versão”.
- Validar por `parsePortfolioName`, enviar nome normalizado e `BASE_CURRENCY` a
  `createPortfolio`.
- Desabilitar submit durante operação, impedir double submit e mapear erros para
  mensagem sanitizada.
- Após sucesso usar `router.push` para `/portfolios/{id}`. Falha de leitura da
  lista pode ter retry; falha de persistência do create deve oferecer
  reconciliação pela lista, nunca reenviar automaticamente o mesmo input.

## Escopo excluído

- Detalhe, rename e delete.
- `getDocs`/`collection`/paths Firestore em componentes.
- Saldo, patrimônio, retorno, cards financeiros, moeda editável ou carteira
  padrão.
- React Query, SWR, Redux, Zustand, realtime ou formulário externo.

## Dependências

- 006-01 concluída.
- `Portfolio`, `parsePortfolioName`, `BASE_CURRENCY` e repository 005.
- `Button`, `Card`, `Input`, `Label` e tokens da fase 002.

## Arquivos e símbolos prováveis

- `src/app/(app)/(protected)/portfolios/page.tsx`.
- `src/components/portfolio/portfolio-list.tsx`.
- `src/components/portfolio/portfolio-create-form.tsx` ou composição menor
  equivalente, sem framework de forms.
- `src/components/portfolio/portfolio-error.tsx` somente se houver repetição
  comprovada; não criar framework global.

## Passos de implementação futura

1. Compor rota sem importar SDK Firebase.
2. Aguardar montagem pós-AuthGate antes de chamar repository.
3. Implementar fetch one-shot e cleanup para não atualizar estado desmontado.
4. Implementar empty state com explicação “Seu patrimônio, com clareza.” sem
   linguagem de trading/corretora.
5. Reutilizar parser para validação e converter `DomainError` em texto curto.
6. Usar estado/ref de pending para bloquear concorrência.
7. Atualizar UI com retorno de create somente antes da navegação; não confiar em
   estado local para refresh.

## Testes e validação

```bash
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
```

Matriz manual: sessão restaurando sem empty flash; lista vazia; uma/múltiplas
carteiras; refresh; nome vazio, whitespace, 101 caracteres e Unicode; double
click; erro de leitura/retry; falha de persistência com reconciliação sem novo
write cego; create bem-sucedido; ausência de SDK/path em `src/app` e
`src/components/portfolio`.

## Definição de pronto

- Listagem usa `listPortfolios()` e nenhuma chamada Firestore aparece na UI.
- Empty state tem CTA funcional e texto sobre o próximo passo.
- Nome inválido não chama repository/SDK; nome válido é trimado pelo domínio.
- BRL é fixa e não há números financeiros inventados.
- Múltiplas carteiras funcionam; create bem-sucedido abre detalhe por ID.
- Loading, erro, retry e disabled são acessíveis.

## Riscos e cuidados

- `auth.currentUser` pode não estar pronto fora do gate; não chamar repository
  durante restauração.
- Create faz write seguido de read no repository; falha posterior pode deixar
  documento persistido. A UI não deve duplicar por retry automático ou retry
  manual cego; deve permitir verificar a listagem antes de novo submit deliberado.
- Não usar `toLocaleString` para criar qualquer valor financeiro; data técnica
  pode ser formatada apenas para apresentação.
- Não registrar nome da fixture, UID ou conteúdo em logs/evidências.

## Evidência esperada ao concluir

Registrar arquivos, mapeamento de estados, comandos, matriz de create/listagem,
resultado e riscos residuais. Marcar somente esta task no overview quando pronta.

## Registro de execução

### Status

`completed`.

### Arquivos alterados

- `src/app/(app)/(protected)/portfolios/page.tsx` — rota Server Component sem SDK.
- `src/components/portfolio/portfolio-list.tsx` — leitura one-shot, estados, ordenação e cards.
- `src/components/portfolio/portfolio-create-form.tsx` — validação, criação BRL, feedback e reconciliação.

### Decisões e desvios

- Repository permanece única fronteira de dados; componentes não importam Firebase SDK nem constroem paths.
- Carga inicial usa guard contra Strict Mode e request ID contra resultados obsoletos; cleanup impede atualização após unmount.
- Falha de create exige reconciliação bem-sucedida antes de liberar novo submit, evitando duplicação quando write pode ter persistido.
- Empty state só aparece em `ready` com lista vazia; loading e erro não sugerem ausência de carteiras nem deixam create acionável.
- Cards mostram somente nome, moeda BRL e data real. Nenhum saldo, patrimônio ou retorno foi adicionado.
- Rota de detalhe permanece responsabilidade de 006-03; `router.push` segue o contrato mesmo enquanto destino ainda não existe.

### Comandos executados

- `npm run lint` — primeira execução falhou pela regra `react-hooks/set-state-in-effect`; inicialização foi reagendada via microtask e o gate final passou.
- `npm exec next typegen` — passou.
- `npx tsc --noEmit` — passou.
- `npm run build` — passou; build reconheceu `/portfolios`.
- `git diff --check` — passou.

### Resultados e evidências

- Estados implementados: `loading`, `ready`, `empty` e `error` com retry manual.
- Listagem ordena `createdAt` decrescente e `id` crescente como desempate determinístico.
- Formulário usa um único `Input`, `Label`, `parsePortfolioName`, `BASE_CURRENCY` e texto fixo de BRL.
- Nome inválido não chama repository; erro de campo e erro operacional têm regiões e atributos ARIA separados.
- Double submit bloqueado por ref/estado; falha de persistência mostra reconciliação, sem retry cego.
- Inspeção estrutural confirmou ausência de `collection`, `getDocs`, `getDoc`, query ou paths Firestore na rota/componentes.
- Revisão independente final aprovou subtarefa sem bloqueadores.

### Matriz de create/listagem

- Lista vazia: empty state explicativo e CTA `Criar primeira carteira`.
- Lista com dados: cards responsivos com nome, BRL e data de criação.
- Loading: mensagem live e formulário desabilitado.
- Erro de leitura: mensagem sanitizada e `Tentar novamente`; create desabilitado até reconciliação da lista.
- Nome vazio, whitespace ou fora do limite: mensagem de domínio e nenhum write.
- Create válido: envia nome normalizado e BRL; sucesso navega para `/portfolios/{id}`.
- Falha pós-write: submit fica bloqueado até `listPortfolios()` concluir com sucesso.

### Riscos residuais

- `/portfolios/[portfolioId]` ainda não existe; navegação após create chega a 404 até 006-03 implementar detalhe.
- Smoke autenticado e validação manual de browser, teclado e mobile permanecem pendentes.
- Não foi executado `npm run test:rules`; esta subtarefa não alterou Rules, parser, converter ou repository.
