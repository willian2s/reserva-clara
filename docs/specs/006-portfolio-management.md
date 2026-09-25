# 006 — Portfolio Management

- **Status:** `pending`
- **Ticker:** `006`

## Contexto

As fases 001–005 estão concluídas. O produto está publicado em Vercel, usa
`reservaclara.com.br` como superfície pública e `app.reservaclara.com.br` como
origem da aplicação. Firebase Auth com Google funciona no browser. Firestore
`(default)` está ativo e as Rules de Portfolio foram publicadas e validadas com
fixtures sintéticas.

O baseline desta fase foi inspecionado na `main`, alinhada a `origin/main`, com
working tree limpo e HEAD `78f7b56` (`docs(sdd): concluir fundação Firestore
005`). Não existem arquivos em `.opencode/rules/`. O checkout usa Next.js
`16.3.5`, React `19.2.8`, TypeScript strict, Tailwind 4, shadcn `base-nova`,
Base UI, Firebase Web `12.19.0` e npm.

A documentação local de Next.js indicada em `AGENTS.md`,
`node_modules/next/dist/docs/`, não está presente neste checkout. Nenhuma API de
Next.js é implementada nesta execução de planejamento. A implementação futura
deve ler essa documentação depois de instalar dependências e antes de editar
rotas, layouts ou parâmetros dinâmicos.

## Objetivo

Entregar a primeira experiência patrimonial real sem inventar dados financeiros:
usuário autenticado deve listar suas carteiras, criar uma carteira BRL, abrir
uma carteira, renomeá-la e excluí-la conforme a política de lifecycle. Após
refresh ou nova sessão, a carteira deve continuar disponível no Firestore do
mesmo usuário.

Uma carteira vazia é válida. A fase não calcula saldo, patrimônio,
rentabilidade, posição ou qualquer outro valor derivado.

## Requisitos

### Produto e experiência

1. Usuário autenticado visualiza somente suas carteiras.
2. Usuário sem carteira vê empty state em português, entende o que é uma
   carteira e recebe CTA claro para criar a primeira.
3. Usuário pode criar múltiplas carteiras; não existe modelo de carteira única,
   carteira padrão ou seleção global.
4. Usuário pode abrir uma carteira por URL estável, inclusive após refresh.
5. Usuário pode renomear carteira usando os mesmos invariantes do domínio.
6. Usuário pode excluir carteira com confirmação explícita e acessível.
7. Dashboard continua uma entrada mínima e aponta para Carteiras; não mostra
   métricas patrimoniais fictícias.
8. Listagem mostra somente dados reais disponíveis: nome, BRL e, se mantido,
   data de criação. Não mostra saldo `R$ 0,00`, retorno, valor ou gráfico.

### Dados, ownership e segurança

9. Reutilizar `Portfolio`, value objects, parser, converter e repository da
   fase 005. UI não chama SDK Firestore nem constrói paths.
10. `name` deve passar por `parsePortfolioName`: trim, 1–100 caracteres Unicode.
    Input vazio, whitespace ou acima do limite não chega ao SDK.
11. Create envia sempre `baseCurrency: BASE_CURRENCY` (`BRL`); não existe
    seletor de moedas não funcional nem edição de moeda.
12. Ownership continua derivado internamente de `auth.currentUser.uid`.
13. Ausência, ID inválido, permissão negada e ID de outro usuário não podem
    produzir mensagens que revelem se o documento existe.
14. Firestore Rules continuam default deny, owner-scoped e com schema fechado.
    Nenhuma mudança é esperada em `firestore.rules`.

### Estados e operações

15. Auth em restauração não mostra empty state, formulário acionável ou erro de
    permissão prematuro.
16. Após Auth confirmado, listagem mostra loading, conteúdo, vazio ou erro;
    erro tem retry e mensagem sanitizada.
17. Create trata nome inválido, double submit, loading, erro, sucesso e
    navegação definida. Falha de persistência não repete automaticamente nem
    oferece retry cego do mesmo create; oferece reconciliação pela listagem.
18. Rename trata nome atual, nome inválido, nome normalizado igual, loading,
    erro e sucesso.
19. Delete trata confirmação, cancelamento, loading, erro, sucesso e retorno à
    coleção. Não promete undo.

### Design, acessibilidade e operação

20. Reutilizar Inter, tokens, `Button`, `Card`, `Input` e `Label` de 002. Não
    criar sidebar de roadmap, estética de trading ou verde como sinônimo de
    performance.
21. Experiência funciona em mobile, tablet e desktop, sem tabela larga ou ação
    descoberta somente por hover.
22. Headings, labels, foco, teclado, mensagens associadas, regiões live,
    disabled, contraste e confirmação são verificáveis.
23. Gates técnicos, Rules Emulator Suite, validação manual e smoke produtivo
    autenticado devem ser executados sem registrar UID, token, nome pessoal ou
    conteúdo sensível.

## Critérios de aceite

- Usuário autenticado consegue visualizar suas carteiras.
- Usuário sem carteira recebe empty state claro e CTA para criar a primeira.
- Usuário consegue criar carteira válida, e ela persiste após refresh/relogin.
- Múltiplas carteiras podem coexistir e aparecem owner-scoped.
- Usuário consegue abrir `/portfolios/[portfolioId]`.
- Usuário consegue abrir `/portfolios/[portfolioId]/settings` para administrar
  a carteira sem misturar ações administrativas ao contexto patrimonial.
- Usuário consegue renomear carteira com nome válido.
- Usuário consegue excluir carteira conforme hard delete de 006 e confirmação.
- Input inválido não chega ao Firestore.
- Loading, erro, sucesso e sessão ausente têm tratamento compreensível.
- Nenhuma informação financeira fictícia é exibida.
- Acesso a carteira de outro usuário é impossível e indistinguível de ausência.
- Anônimo não acessa dados; AuthGate é somente UX e Rules são autorização.
- UI não constrói paths Firestore e repository/domain da 005 são reutilizados.
- Rules permanecem default deny; testes relevantes passam.
- Mobile/desktop e teclado são validados.
- `npm run lint`, `npm exec next typegen`, `npx tsc --noEmit` e `npm run build`
  passam na ordem do repositório; `npm run test:rules` continua verde.
- Deployment produtivo saudável e smoke autenticado passam.
- Nenhuma feature de 007 é antecipada.

## Comportamento atual encontrado

### Auth e rotas

- `src/app/(app)/dashboard/page.tsx` apenas renderiza `DashboardGate`.
- `src/components/auth/dashboard-gate.tsx` assina `onAuthStateChanged`,
  redireciona anônimo para `/login` e renderiza shell hardcoded depois da
  confirmação. Não recebe `children` e não é boundary de autorização.
- `src/components/auth/google-sign-in.tsx` usa popup Google e
  `router.replace("/dashboard")` após a sessão ser observada.
- `src/app/(app)/layout.tsx` fornece metadata `noindex` e apenas retorna
  `children`.
- `src/proxy.ts` é o único dono de host routing; matcher cobre `/`,
  `/login/:path*` e `/dashboard/:path*`. A nova árvore `/portfolios` exigirá
  atualização conjunta do matcher e da ponte público/app.

### Domínio e acesso a dados

- `src/domain/portfolio.ts` define `Portfolio`, inputs fechados e
  `parsePortfolioName`, que retorna nome trimado com 1–100 caracteres.
- `src/domain/value-objects.ts` exporta `BASE_CURRENCY` e mantém `BRL` como
  moeda base V1.
- `src/data/firestore/portfolio-repository.ts` já implementa
  `createPortfolio`, `getPortfolio`, `listPortfolios`, `updatePortfolio` e
  `deletePortfolio`. O UID é lido de `auth.currentUser`; não é argumento.
- `getPortfolio` retorna `null` quando ausente; update lança
  `PortfolioNotFoundError`; delete remove apenas o documento pai.
- `src/data/firestore/paths.ts` deriva `users/{uid}/portfolios` internamente e
  valida segmentos.
- `src/data/firestore/converters/portfolio-converter.ts` usa server timestamps
  e `src/data/firestore/parsers/portfolio-parser.ts` valida runtime o schema
  fechado antes da UI.

### Rules e testes

- `firestore.rules:43-57` permite CRUD somente ao owner autenticado, exige
  Portfolio válido, BRL e timestamps server-side.
- `firestore.rules:5-9` mantém default deny; Transactions, Assets,
  allocationTargets e snapshots continuam fechados.
- `tests/firestore.rules.test.mjs` cobre CRUD owner, listagem, isolamento A/B,
  anônimo, schema inválido, timestamps e caminhos futuros.
- `npm run test:rules` usa Firebase Emulator com projeto demo e fixtures
  sintéticas; não acessa produção.

### UI e marca

- Componentes disponíveis em `src/components/ui`: `Button`, `Card`, `Input` e
  `Label`, todos base-nova/Base UI.
- Não há Dialog, Dropdown, Toast, tabela, formulário de Portfolio, hook ou
  state manager.
- `src/app/globals.css` fornece Inter, tokens semânticos light, foco,
  `rounded-control`, `rounded-card` e estados separados de accent/positive.
- `public/brand/` possui logos oficiais; as telas autenticadas já usam
  `/brand/logo-horizontal.png` e `/brand/logo-mark.png`.

## Abordagem escolhida

### Rotas e navegação

Rotas canônicas:

```text
/dashboard
/portfolios
/portfolios/[portfolioId]
/portfolios/[portfolioId]/settings
```

Organização prevista, preservando URLs por route groups:

```text
src/app/
  (app)/
    layout.tsx
    login/page.tsx
    (protected)/
      layout.tsx
      dashboard/page.tsx
      portfolios/page.tsx
      portfolios/[portfolioId]/page.tsx
      portfolios/[portfolioId]/settings/page.tsx
```

`(protected)/layout.tsx` compõe `AuthGate` e um shell de navegação mínimo com
links somente para Dashboard e Carteiras. `/login` permanece fora do gate.
`/dashboard` mantém o destino pós-login e oferece CTA para `/portfolios`, sem
duplicar a query.

`src/proxy.ts` deve adicionar `/portfolios/:path*` ao matcher e à regra de
redirect público → app. Localhost e previews continuam same-origin; hosts
desconhecidos continuam 404. Nenhuma regra de host vai para páginas ou
componentes.

### Auth e fetching

`AuthGate` observa Auth uma vez no grupo protegido e renderiza loading até a
primeira emissão. Com usuário confirmado, renderiza children; sem usuário,
redireciona para `/login` sem renderizar conteúdo de Portfolio. Ao trocar de
identidade, o subtree protegido deve ser reinicializado para não manter lista ou
detalhe da conta anterior. Nenhum UID é exibido ou aceito como input.

Páginas Server Component somente compõem a árvore. Componentes client de
Portfolio chamam funções do repository depois que o gate montou a experiência.
Não criar contexto global nem duplicar `onAuthStateChanged` em cada página.

Leituras são one-shot. Listagem ordena em memória por `createdAt` decrescente,
com `id` como desempate determinístico, sem ordenação customizável pelo usuário,
paginação ou índice composto. Create/rename atualizam o estado com o retorno do
repository; rename permanece em settings; delete retorna à coleção e provoca
nova leitura ao montar.

### Empty → create → detail

1. AuthGate confirma sessão.
2. `/portfolios` chama `listPortfolios()` e mostra loading até a promessa
   resolver.
3. Lista vazia mostra que nenhuma carteira existe, explica que ela organiza um
   conjunto de patrimônio e apresenta `Criar primeira carteira`.
4. Formulário pede somente nome. `BRL` aparece como informação fixa
   “Moeda base: BRL — fixa nesta versão”; não há selector.
5. Submit chama `parsePortfolioName` e, somente se válido, envia nome normalizado
   com `BASE_CURRENCY` para `createPortfolio`.
6. Durante o write, botão e campos relevantes ficam disabled e submissões
   concorrentes são ignoradas.
7. Sucesso navega para `/portfolios/{id}` com `router.push`; detalhe confirma a
   carteira por `getPortfolio()` após refresh sem depender de estado em memória.
8. Falha de leitura da lista oferece retry. Falha de persistência do create
   mostra mensagem sanitizada e ação para verificar carteiras/voltar à lista;
   não repete o mesmo create, pois o repository usa auto ID e não fornece
   idempotência quando o write pode ter persistido sem leitura de confirmação.

### Detail, settings, rename e delete

Detalhe mostra nome, BRL, data de criação quando útil e texto explícito de que a
carteira ainda não possui recursos patrimoniais nesta fase. Não mostra saldo,
rentabilidade, posições ou cards financeiros vazios.
O detalhe não contém formulários nem ações administrativas; oferece link explícito
e acessível para `/portfolios/{id}/settings`.

ID inválido, `null`, erro de permission-denied e falha de leitura convergem para
“Não foi possível acessar esta carteira.” com voltar para `/portfolios` e retry.
Não usar `notFound()` baseado em consulta client-only nem revelar existência
cross-user.

Settings carrega a carteira por `getPortfolio`, exibe nome e `baseCurrency` reais e
trata loading, indisponibilidade e falha de leitura com estado sanitizado e retry.
Renomear existe somente em `/portfolios/{id}/settings` e usa o mesmo
`parsePortfolioName`. Nome normalizado igual ao atual não faz write e informa que
nada mudou. Nome válido chama `updatePortfolio`, mantém o usuário em settings,
atualiza o estado com o retorno e anuncia sucesso. Falha permite retry sem expor
exception. `baseCurrency` é somente leitura.

Excluir ficará em `/portfolios/{id}/settings`, nunca no detalhe. Primeiro clique
abre confirmação inline com nome da carteira, explicação de que a ação é
permanente e instrução para digitar exatamente o nome atual. O botão `Deletar
permanentemente` permanece disabled até o texto coincidir; `Cancelar` fecha a
confirmação. Após a segunda etapa, ações ficam disabled, `deletePortfolio` é
chamado e, no sucesso, usa `router.replace("/portfolios")`. Não usar cascade,
undo ou confirmação baseada somente em clique único.

### Delete e compatibilidade com 007

006 adota hard delete porque somente documentos pai de Portfolio existem e os
paths filhos continuam negados. A operação é irreversível e remove apenas o
documento pai.

Antes de 007 abrir Transactions, o lifecycle deve mudar: uma carteira com
filhos não poderá ser hard-deletada; deverá ser arquivada por contrato próprio.
Enquanto archive não estiver pronto, delete com filhos deve ser rejeitado e 007
fica bloqueada. Essa é uma transição operacional, não uma segunda política de
produto. O archive exige domínio, parser/converter, repository, Rules e testes
coordenados. Não adicionar `archivedAt` agora “por precaução”.

O mecanismo de enforcement da transição é estrutural: Rules não conseguem
enumerar genericamente todas as subcoleções para decidir delete com segurança.
Por isso, a primeira task de lifecycle de 007 deve remover `allow delete` de
Portfolio antes de abrir qualquer path filho e substituir a operação por
`archivePortfolio`. A partir dessa transição, delete físico fica negado para
carteiras vazias ou com filhos; archive preserva o documento pai e seu ledger.
Não depender de `exists()` para um ID desconhecido, contador mantido somente no
cliente ou pre-check não atômico.

Esse é gate bloqueante de início de 007, não somente risco residual. A primeira
subtarefa de 007 deve permanecer `pending`/`blocked` até existir evidência de
archive implementado e testado, remoção do delete físico nas Rules e teste
negativo do Emulator. A função `deletePortfolio` e a Rule de delete não podem
permanecer com o contrato atual enquanto Transactions forem abertas. A
evidência obrigatória inclui diff atômico de domínio/parser/converter/repository/
Rules/testes e decisão sobre lista, detalhe e restore. Nenhum write de
Transaction pode ser liberado antes desse conjunto.

### Erros

Mapeamento local, sem framework global:

| Origem | Mensagem de UI |
| --- | --- |
| `DomainError` de nome | “Informe um nome entre 1 e 100 caracteres.” |
| Sessão ausente | “Sua sessão terminou. Entre novamente para continuar.” |
| List/read indisponível | “Não foi possível carregar suas carteiras. Tente novamente.” |
| Detail ausente, inválido, cross-user ou permission denied | “Não foi possível acessar esta carteira.” |
| Create com persistência não confirmada | “Não foi possível confirmar a criação. Verifique suas carteiras antes de tentar criar novamente.” |
| Rename | “Não foi possível renomear a carteira agora. Tente novamente.” |
| Delete | “Não foi possível excluir a carteira agora. Tente novamente.” |

Não exibir stack trace, Firebase code bruto, path, UID, token ou conteúdo do
documento. Logs opcionais devem registrar somente operação e categoria sanitizada.

## Alternativas descartadas

| Alternativa | Motivo |
| --- | --- |
| `/portfolio` singular | Não representa bem uma coleção com múltiplas carteiras e não prepara a hierarquia futura tão claramente. |
| Somente `/dashboard` | Mistura entrada da aplicação com CRUD e não oferece URL estável para uma carteira. |
| Listar portfolios dentro do dashboard | Duplica leitura, estado e apresentação; dashboard 006 não deve virar dashboard patrimonial. |
| Portfolio selecionado somente em memória | Perde deep link, refresh e contexto necessário para 007. |
| `onSnapshot` | Não há colaboração ou requisito de atualização instantânea; adiciona listeners e custo sem benefício comprovado. |
| AuthProvider/contexto global | Um único consumidor de auth compartilhado nesta vertical não justifica nova camada global; `AuthGate` no route group é suficiente. |
| `/portfolios/new` | Cria rota especial desnecessária e conflita semanticamente com possível document ID `new`. |
| Dialog/Dropdown e dependência nova | Componentes não existem no catálogo atual; confirmação inline é suficiente e mais simples para carteira vazia. |
| Archive desde 006 | Exigiria `archivedAt`/status, parser, Rules e política de restore sem requisito atual. |
| Cascade client-side | Delete Firestore não é recursivo; falhas parciais criariam órfãos e não haveria atomicidade ou autoridade de servidor. |
| Cascade como lifecycle padrão | Destrói ledger financeiro e histórico; purge futuro, se necessário, exige operação server-side administrativa separada, não CRUD da UI. |

## Arquivos, módulos e contratos afetados

### Alterações esperadas na implementação futura

- `src/proxy.ts`: matcher e bridge para `/portfolios`.
- `src/app/(app)/(protected)/layout.tsx`: AuthGate e navegação mínima.
- `src/app/(app)/(protected)/dashboard/page.tsx`: CTA para Carteiras, mantendo
  destino `/dashboard`.
- `src/app/(app)/(protected)/portfolios/page.tsx`: entrada Server da listagem.
- `src/app/(app)/(protected)/portfolios/[portfolioId]/page.tsx`: entrada Server
  do detalhe; parâmetros dinâmicos devem seguir a documentação local Next 16.
- `src/app/(app)/(protected)/portfolios/[portfolioId]/settings/page.tsx`: entrada
  Server das configurações administrativas; parâmetros dinâmicos devem seguir a
  documentação local Next 16.
- `src/components/auth/auth-gate.tsx`: listener compartilhado, loading e
  redirect de UX.
- `src/components/portfolio/*`: componentes Client para listagem, formulário,
  detalhe patrimonial, configurações, rename, delete e mensagens locais.

### Reutilização sem alteração esperada

- `src/domain/portfolio.ts`, `src/domain/value-objects.ts` e `src/domain/errors.ts`;
- `src/data/firestore/portfolio-repository.ts`, `paths.ts`, converter, parser e
  errors;
- `src/lib/firebase/client.ts`, sem novo initializer;
- `firestore.rules` e `tests/firestore.rules.test.mjs`, salvo evidência concreta
  de incompatibilidade;
- `src/components/ui/button.tsx`, `card.tsx`, `input.tsx`, `label.tsx`;
- `src/app/globals.css`, `src/app/layout.tsx`, assets de `public/brand/` e
  `package.json`/lockfile.

### Contratos técnicos

- UI importa funções orientadas a Portfolio, nunca `collection`, `doc`,
  `getDocs`, `getDoc`, `setDoc` ou `query`.
- `BASE_CURRENCY` é a origem do valor BRL no formulário; domínio permanece
  autoridade final.
- `portfolioId` é document ID gerado pelo Firestore e usado somente como
  segmento de URL/repository.
- AuthGate é guard de UX; Rules são autorização.
- Nenhuma nova dependência, schema, índice composto, provider de auth, sessão
  server-side, Server Action ou Firebase Admin entra em 006.

## Riscos e mitigação

| Risco | Mitigação |
| --- | --- |
| Flash de empty state antes de Auth | Gate compartilhado aguarda `onAuthStateChanged`; fetch inicia somente depois. |
| Estado de conta anterior após troca de sessão | Remontar subtree protegido por identidade e limpar estados no unmount. |
| Cross-user revelar existência | Repository deriva UID; detail usa mensagem única para ausente/inacessível; Rules continuam owner-scoped. |
| Create persiste mas read falha | Não repetir create; mostrar erro genérico e oferecer reconciliação pela listagem. |
| Double submit duplica carteira | Ref e estado de pending desabilitam submit durante cada mutação. |
| Delete sem cascade no futuro | Hard delete restrito a 006; antes de 007, remover delete nas Rules e usar archive estrutural, sem tentar enumerar filhos. |
| Lista crescer além de leitura simples | Registrar limite; não introduzir paginação/realtime sem requisito e query real. |
| Dynamic route incompatível com Next 16 | Ler docs locais instaladas antes da implementação e rodar typegen antes de tsc. |
| UI virar dashboard financeiro fictício | Revisão visual contra fora de escopo; somente nome, BRL e timestamps reais. |
| Proxy não cobrir rota nova | Atualizar matcher e matriz Host na mesma subtarefa de navegação; testar público/app/local/preview. |
| Firestore Rules alterada sem necessidade | Inspecionar diff; manter arquivo intacto e somente rerodar Emulator. Se mudança surgir, tratar atomicamente. |
| Hard delete sem recuperação | Confirmação em duas etapas, mensagem permanente, fixture sintética em smoke e rollback de dados não prometido. |

## Estratégia de testes e validação

### Rules e camada de dados

Manter `firestore.rules` inalterada salvo incompatibilidade concreta. Executar
`JAVA_HOME=$(/usr/libexec/java_home -v 21) npm run test:rules` no projeto demo,
confirmando CRUD owner, listagem owner-scoped, anônimo, A/B, schema e paths
futuros. Não usar `withSecurityRulesDisabled`, produção ou fixtures pessoais.

Não criar framework de testes UI/E2E. Validar domínio por reutilização do parser
e a camada de dados pelos testes de Rules existentes e smoke manual autorizado.
Qualquer teste puro novo precisa justificar runner; ausência de runner React não
é motivo para instalar dependência.

### Gates técnicos

Executar nesta ordem:

```bash
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
git diff --check
```

`npm run test:rules` é gate adicional e deve usar JDK 21 conforme setup atual.
Build não substitui prova de Auth, ownership, acessibilidade ou produção.

### Matriz manual local/preview

- Auth restaurando: nenhum empty state/formulário acionável prematuro.
- Anônimo em `/dashboard`, `/portfolios` e detalhe: redirect para `/login`, sem
  shell ou dados.
- Owner sem carteira: empty state, CTA, criação válida e detalhe.
- Owner com duas carteiras: listagem independente, abrir cada uma e refresh.
- Nome vazio, whitespace, 101 caracteres e Unicode no limite: mensagem e nenhum
  write inválido.
- Create: loading, double click, erro/retry e sucesso.
- Rename em `/portfolios/[portfolioId]/settings`: nome atual, inválido, igual
  após trim, loading, erro e sucesso; detalhe sem formulário ou ação de rename.
- Delete em `/portfolios/[portfolioId]/settings`: abrir confirmação, cancelar,
  teclado, confirmar, erro e retorno à lista.
- ID aleatório, ID inválido e ID pertencente a outra conta: mesma experiência
  indisponível, sem vazamento.
- Mobile, tablet, desktop, zoom, teclado, foco, live regions e contraste.
- Host público/app/local/preview e assets sem redirect indevido após inclusão do
  matcher `/portfolios/:path*`.

### Produção

Após gates e revisão humana, publicar o deployment normal da `main` na Vercel.
Executar smoke autenticado no host app com fixture sintética mínima: listar,
criar, refresh, abrir, acessar settings, renomear, excluir e verificar ausência. Remover fixture
ao final. Repetir cenário anônimo e, se duas contas de teste estiverem
autorizadas, verificar tentativa A→B; não registrar identidade, UID, token ou
nome da fixture.

Se Rules e schema permanecerem sem alteração, não executar deploy de Rules por
causa da fase 006. Registrar explicitamente “Rules sem alteração; Emulator
reexecutado”. Rollback de UI usa deployment Vercel anterior; rollback não
recupera hard delete.

## Ordem das subtarefas

1. [006-01-estruturar-shell-auth-e-navegacao.md](../tasks/006-portfolio-management/006-01-estruturar-shell-auth-e-navegacao.md) — criar grupo protegido, AuthGate, navegação mínima, dashboard CTA e bridge de host.
2. [006-02-implementar-listagem-e-criacao.md](../tasks/006-portfolio-management/006-02-implementar-listagem-e-criacao.md) — entregar listagem owner-scoped, estados e formulário de criação BRL.
3. [006-03-implementar-detalhe-e-acesso.md](../tasks/006-portfolio-management/006-03-implementar-detalhe-e-acesso.md) — entregar URL dinâmica, leitura one-shot e estado de acesso indisponível.
4. [006-04-implementar-renomeacao.md](../tasks/006-portfolio-management/006-04-implementar-renomeacao.md) — entregar rename em settings com invariantes e feedback.
5. [006-05-implementar-exclusao-segura.md](../tasks/006-portfolio-management/006-05-implementar-exclusao-segura.md) — entregar confirmação em settings, hard delete e retorno seguro.
6. [006-06-validar-regras-e-isolamento.md](../tasks/006-portfolio-management/006-06-validar-regras-e-isolamento.md) — revalidar Rules, repository boundary e matriz de ownership.
7. [006-07-validar-acessibilidade-e-responsividade.md](../tasks/006-portfolio-management/006-07-validar-acessibilidade-e-responsividade.md) — provar UX mobile/desktop e teclado sem ampliar design system.
8. [006-08-executar-gates-deploy-e-smoke.md](../tasks/006-portfolio-management/006-08-executar-gates-deploy-e-smoke.md) — gates finais, deployment Vercel, smoke produtivo e handoff 007.
9. [006-09-customizar-pagina-404.md](../tasks/006-portfolio-management/006-09-customizar-pagina-404.md) — substituir 404 padrão por tela global customizada.

## Premissas explícitas

- `006` foi informado no pedido e não é número gerado por data.
- `/portfolios` é escolha nova; não há contrato anterior de `/portfolio` a
  preservar.
- Auth continua client-only nesta fase. AuthGate evita flashes e duplicação de
  listeners, mas não cria autorização server-side.
- BRL é fixa no contrato 005; formulário não oferece escolha de moeda.
- `createdAt` é dado técnico real; sua exibição é opcional se não melhorar
  clareza. Nenhum valor financeiro será calculado.
- Repository 005 é suficiente para V1. Nenhum `GenericRepository`, serviço
  global, query composta ou state manager será criado.
- Rules, schema, `.firebaserc`, Firebase Console, Vercel e dependências não
  serão alterados nesta execução de planejamento.
- Hard delete é aceitável somente enquanto paths filhos permanecem fechados. A
  política futura escolhida é archive; antes de abrir filhos, delete físico deve
  ser removido das Rules, e o gate não pode ser pulado.
- Teste produtivo futuro usará conta autorizada e fixture sintética removível;
  esta execução não cria carteira real nem faz deploy.

## Decisões pendentes e checkpoints

Não há decisão de produto bloqueante para implementar o plano. Permanecem
checkpoints operacionais da execução futura:

- disponibilidade da documentação local Next 16 após `npm ci`;
- browser e conta(s) Google de teste autorizadas para smoke;
- confirmação de deployment Vercel saudável antes do smoke;
- revisão humana antes de qualquer operação produtiva ou criação de fixture.

Nenhum checkpoint autoriza alterar Rules, Console, Vercel ou produção durante
esta execução de planejamento.

## Referências

- `AGENTS.md` e ausência de `.opencode/rules/`.
- `docs/specs/001-primeira-vertical-autenticacao.md` a
  `docs/specs/005-domain-model-firestore-foundation.md`.
- `docs/decisions/001-autenticacao-google-popup.md`,
  `docs/decisions/003-separacao-host-publico-app.md` e
  `docs/decisions/004-cloudflare-proxied-vercel.md`.
- `docs/tasks/005-domain-model-firestore-foundation/005-00-overview.md` e tasks
  005-01 a 005-10.
- `src/domain/portfolio.ts`, `src/domain/value-objects.ts`.
- `src/data/firestore/portfolio-repository.ts`, `paths.ts`, converter, parser e
  errors.
- `src/lib/firebase/client.ts`, `src/components/auth/*`, `src/proxy.ts`.
- `src/app/(app)/*`, `src/components/ui/*`, `src/app/globals.css` e
  `components.json`.
- `firestore.rules`, `tests/firestore.rules.test.mjs`, `package.json`.
- Firebase data model, Security Rules e Emulator Suite já registrados na spec
  005; nenhuma dúvida nova exigiu consulta oficial nesta fase de planejamento.
