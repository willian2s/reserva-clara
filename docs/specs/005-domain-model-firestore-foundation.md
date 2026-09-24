# 005 — Domain Model & Firestore Foundation

## Status

`completed`

## Ticker

`005`

## Contexto

As fases 001 (Authentication), 002 (Brand Integration & Design System
Foundations), 003 (Public Landing & App Separation) e 004 (Production
Deployment) estão concluídas. O fluxo produtivo validado é:

```text
landing → app → Google Sign-In → dashboard
```

Esta spec foi planejada sobre `main`, alinhada a `origin/main`, com working tree
limpo e HEAD `8cc5a5b` (`docs(sdd): concluir deployment de produção`). Alguns
hashes registrados em documentação histórica das fases anteriores não
correspondem ao HEAD atual; o estado da branch, não esses hashes antigos, é a
referência operacional.

O checkout usa Next.js `16.3.5`, React `19.2.8`, TypeScript strict, App Router,
Tailwind 4, Firebase Web `12.19.0` e npm. Não há arquivos em
`.opencode/rules/`. A documentação local do Next indicada por `AGENTS.md`, em
`node_modules/next/dist/docs/`, não está disponível neste checkout; esta fase
não alterou APIs Next nem layouts.

O Firebase Web já é inicializado uma vez em `src/lib/firebase/client.ts`, com
sete variáveis `NEXT_PUBLIC_FIREBASE_*`, e exporta `auth` e `firebaseApp`. O
login Google usa `signInWithPopup`, `onAuthStateChanged` e
`router.replace("/dashboard")`. `DashboardGate` observa Auth no browser,
redireciona anônimos para `/login` e renderiza somente shell não sensível. Ele é
UX/client routing, não autorização de dados.

`getFirestore`, converter, parser de documentos, camada de persistência, modelo
de domínio, `firebase.json`, `.firebaserc`, `firestore.rules` e configuração de
Emulator Suite foram implementados nesta fase. `firestore.indexes.json` não foi
criado porque nenhuma query composta exige índice. O pacote `firebase` existente
foi reutilizado; `firebase-tools` e `@firebase/rules-unit-testing` foram fixados
como dependências de desenvolvimento para os testes locais.

Documentação oficial Firebase/Firestore consultada em 2026-09-23 confirma que
subcoleções podem ser organizadas sob documentos, Security Rules precisam ser
restritivas por caminho e identidade, regras não filtram consultas, tipos
Firestore incluem `Timestamp` e números, conversores não substituem validação
de runtime, o Emulator Suite é o caminho local para testar Rules e índices
compostos devem ser criados somente quando uma query real exigir. A localização
do banco é decisão de provisionamento com consequência permanente e não será
escolhida por inferência.

## Objetivo

Definir e implementar uma fundação de domínio e
persistência Firestore pequena, segura, testável e orientada a ownership, sem
construir features de carteira/transações.

Após a execução, a aplicação tem:

- contrato inicial de domínio e invariantes documentados;
- ownership enraizado no Firebase Auth `uid`;
- estrutura para múltiplas carteiras por usuário;
- Firestore Web acoplado à inicialização Firebase existente, sem segundo
  `initializeApp`;
- camada orientada ao domínio entre React e Firestore;
- conversão e validação runtime de documentos, com falha explícita em dados
  inválidos;
- Rules versionadas com default deny e isolamento entre usuários comprovado no
  Emulator Suite;
- checkpoint humano separado para criação do banco e escolha de região;
- produção validada somente depois de Rules testadas e publicadas;
- base pronta para 006, sem UI de carteiras nem conteúdo patrimonial no
  dashboard atual.

## Escopo

### Incluído na execução da fase 005

- decisão agrupada de hierarquia, ownership, precisão e fonte da verdade
  registrada nesta spec;
- contrato mínimo de `Portfolio` e value objects necessários para impedir
  números ambíguos em fases seguintes;
- contratos futuros de `Asset` e `Transaction`, sem CRUD de suas features;
- inicialização Firestore Web reutilizando `firebaseApp` existente;
- funções orientadas ao domínio para criar, listar, consultar, editar e remover
  carteiras, sem componente visual consumidor;
- `FirestoreDataConverter`/parsers explícitos para documentos implementados;
- `firestore.rules` para namespace de usuário e `Portfolio`;
- `firebase.json`, `.firebaserc` e configuração mínima do Emulator Suite quando
  o projeto Firebase for confirmado pelo checkpoint humano;
- testes locais de Rules com fixtures fictícias, usuários A/B e anônimo;
- ativação do banco, deploy das Rules e smoke de produção somente após
  aprovação humana e sem dados patrimoniais pessoais;
- gates técnicos e documentação/evidências.

### Excluído

- CRUD visual de carteiras, formulário de transação, ativos, cotações, BRAPI,
  QuoteService, posições, preço médio, valor de mercado, rentabilidade,
  alocação real, rebalanceamento, aportes, snapshots reais, metas e reserva de
  emergência;
- criação automática de carteira ou seed em produção;
- `Firebase Admin`, service account, sessão server-side, cookies de sessão,
  Cloud Functions, jobs, queues, Redis, Analytics, App Check ou integração
  bancária/corretora;
- alteração da landing, do login Google, do `DashboardGate`, da topologia de
  hosts ou do contrato de rotas;
- alteração de Firestore Console, Rules publicadas, banco real, deploy,
  collections/documentos reais ou dependências nesta execução de planejamento;
- perfil Google duplicado, token OAuth, e-mail, nome ou foto persistidos sem
  requisito explícito;
- índices compostos preventivos, catálogo global complexo e framework de
  repository genérico.

## Requisitos e critérios de aceite

### Requisitos funcionais e de domínio

1. Firebase Auth `uid` é raiz única de ownership. Usuário não autenticado não
   pode ler ou escrever patrimônio.
2. A hierarquia suporta qualquer quantidade de carteiras por usuário e não usa
   nome, ticker ou índice de array como identidade.
3. `Portfolio` possui somente contrato mínimo de produto: `name`,
   `baseCurrency`, `createdAt` e `updatedAt`; `id` é o document ID. V1 usa
   `BRL`, sem implementar FX.
4. Transações são fonte da verdade para evolução patrimonial futura. Posições,
   preço médio, valor de mercado e alocação corrente não são autoritativos nem
   documentos mutáveis nesta fase.
5. `Asset` representa identidade de ativo, não posição nem participação em uma
   carteira. A identidade futura é user-scoped e combina dimensões de mercado,
   símbolo, tipo e moeda; ticker sozinho não é identidade.
6. Valores persistidos não usam `number` decimal ingênuo: dinheiro usa
   unidades menores inteiras seguras; quantidade e preço unitário usam decimal
   canônico serializado; alocação usa basis points.
7. Timestamps técnicos usam Firestore `Timestamp`/server timestamp. Data de
   negócio de transação é string ISO estrita `YYYY-MM-DD`, sem timezone local.
8. Dados lidos do Firestore passam por converter e parser runtime. Documento
   faltante, campo desconhecido, tipo incorreto ou valor inválido gera erro
   explícito; não há fallback silencioso.
9. Componentes React não importam `collection`, `doc`, `getDoc`, `setDoc` ou
   `query`. Acesso passa por funções orientadas ao domínio.
10. Rules usam default deny, paths explícitos e `uid` do path. Wildcard futuro
    não abre acesso a entidades ainda não implementadas.
11. Testes locais provam leitura/escrita própria válida, isolamento A/B,
    anônimo negado, documento inválido negado e caminhos futuros negados.
12. Firestore real só é ativado após decisão humana de região; Rules só são
    publicadas após Emulator Suite verde e revisão do alvo Firebase.

### Critérios de aceite da futura execução

- modelo de domínio, ownership, fonte da verdade e hierarquia estão
  documentados e implementados nos contratos aprovados;
- `users/{uid}` é namespace sem perfil persistido em 005, e não há PII Google
  duplicada;
- `users/{uid}/portfolios/{portfolioId}` suporta múltiplas carteiras, com
  create/list/get/update/delete orientados ao domínio e sem UI;
- Firestore Web usa o app Firebase já inicializado, sem novo `initializeApp`,
  nova env ou Firebase Admin;
- converters/parsers rejeitam dados inválidos antes de chegarem à UI;
- `firestore.rules` permite apenas owner autenticado no Portfolio válido,
  nega anônimo/cross-user e mantém caminhos desconhecidos fechados;
- Emulator Suite comprova todos os casos de isolamento e schema previstos;
- não há `firestore.indexes.json` sem query que exija índice composto;
- região do banco foi escolhida conscientemente por humano, ou execução parou
  antes do provisionamento e registrou o bloqueio;
- Rules foram publicadas somente após checkpoint, smoke de produção usou
  fixtures sintéticas e o rollback foi registrado;
- nenhum dado patrimonial pessoal, secret, service account ou token foi
  versionado;
- DashboardGate continua descrito e usado apenas como UX; a proteção real é
  Firestore Security Rules;
- `npm run lint`, `npm exec next typegen`, `npx tsc --noEmit` e `npm run build`
  passam nessa ordem, além dos testes de Rules;
- documentação e evidências distinguem contrato local, teste emulador,
  configuração Console, publicação e smoke produtivo;
- fase 006 pode implementar experiência de criação/listagem/edição de carteiras
  sem remodelar ownership ou persistência.

## Entidades e limites

| Entidade | Classificação em 005 | Ownership e contrato futuro |
| --- | --- | --- |
| User/Profile | Namespace necessário agora; documento de perfil fora | `users/{uid}` expressa ownership. Não criar documento nem duplicar nome/e-mail/foto Auth. Perfil só entra com requisito próprio. |
| Portfolio | Necessária agora, sem UI | `users/{uid}/portfolios/{portfolioId}`. Documento mínimo, base `BRL`, timestamps técnicos. |
| Asset | Contrato preparado para 007 | `users/{uid}/assets/{assetId}`. Catálogo privado do usuário, compartilhável entre suas carteiras; sem catálogo global. |
| Transaction | Contrato preparado para 007; Rules/CRUD fora | `users/{uid}/portfolios/{portfolioId}/transactions/{transactionId}`. Eventos são fonte da verdade e, após criados, tendem a ser append-only. |
| Target allocation | Contrato preparado para 009; fora da implementação | Intenção do usuário, não posição derivada. Caminho futuro provável `.../allocationTargets/{targetId}`. Percentuais em basis points. |
| Snapshot | Contrato preparado para 012; fora da implementação | Derivado persistido para histórico, provável `.../snapshots/{snapshotId}`. Nunca substitui transações. |
| Goal | Explicitamente fora; fase 013 | Provável entidade user-scoped `users/{uid}/goals/{goalId}`, com relação opcional a portfolio; não antecipar schema agora. |
| Emergency Reserve | Explicitamente fora; fase 014 | Provável dado user-scoped, ainda sem decidir documento/coleção; não criar campo em Portfolio. |

### Fonte da verdade e derivados

- Firebase Auth é fonte da verdade da identidade e do `uid`.
- `Portfolio` é configuração de carteira fornecida pelo usuário.
- `Asset` futuro é identidade/catálogo user-scoped; não é posição.
- `Transaction` futura é fonte da verdade de entradas, saídas e operações.
- Posição por ativo, quantidade atual, custo médio, valor de mercado,
  rentabilidade e alocação corrente serão calculados a partir de transações,
  ativos e cotações. Nenhum deles vira documento autoritativo em 005.
- Target allocation é intenção persistida, distinta de alocação calculada.
- Snapshot futuro é fotografia derivada para histórico/gráficos e pode ficar
  inconsistente com nova transação até o próximo cálculo; não substitui o
  ledger.

## Modelo conceitual escolhido

### Portfolio

Contrato Firestore inicial:

```text
users/{uid}/portfolios/{portfolioId}
  name: string                 // 1–100 caracteres após trim
  baseCurrency: "BRL"          // ISO 4217 uppercase; V1 fixa BRL
  createdAt: Timestamp          // server timestamp na criação
  updatedAt: Timestamp          // server timestamp em toda escrita
```

`id` vem do document ID gerado pelo Firestore e não é duplicado como campo.
`uid` não é duplicado no documento porque o path já expressa ownership. Não há
`status`, `archivedAt`, preferências, corretora, saldo, valor patrimonial ou
qualquer campo de posição. A exclusão própria fica disponível enquanto a fase
005 não abre subcoleções patrimoniais; antes de 007, a semântica deve ser
revisada para não confundir exclusão de documento pai com cascata de
subcoleções.

Moeda base é unidade de apresentação/consolidação da carteira. Moeda de ativo
e moeda de preço são atributos da identidade/preço do ativo. Conversão entre
moedas não existe nesta fase e não deve ser inferida pela igualdade de moedas.

### Asset e distinções necessárias

Quando 007 chegar, identidade deve viver em `users/{uid}/assets/{assetId}`,
fora da carteira, para que o mesmo ativo possa aparecer em várias carteiras do
mesmo usuário sem duplicação. O contrato conceitual mínimo é:

```text
assetId: auto ID
symbol: uppercase string
market: mercado/exchange normalizado
assetType: enum extensível
currency: ISO 4217 uppercase
```

O trecho acima é contrato futuro, não arquivo ou collection de 005. `market` e
`symbol` juntos não precisam ser document ID. Provider de cotação não faz parte
da identidade principal; 008 pode manter referência de provider em adapter ou
subcoleção de integração, por exemplo `quoteSources`, sem contaminar o domínio
Asset nem usar BRAPI como autoridade.

Participação do ativo em uma carteira é inferida por transações com `assetId`.
Não criar `position`, `portfolioAsset` ou snapshot de posição mutável em 005.

### Transaction e extensibilidade

Path futuro:

```text
users/{uid}/portfolios/{portfolioId}/transactions/{transactionId}
```

O contrato inicial de execução de 007 deve começar com os tipos necessários
para evolução básica: `buy`, `sell`, `contribution` e `withdrawal`. A forma
discriminada deve permitir que `income`/`dividend`, `fee`, `tax`, `transfer`,
`reversal` ou `adjustment` sejam adicionados sem reinterpretar registros
existentes. Não abrir Rules para todos esses tipos em 005.

Invariantes futuras:

- `buy`/`sell` referenciam `assetId`, quantidade positiva e preço unitário;
- `contribution`/`withdrawal` carregam valor monetário positivo e não exigem
  ativo;
- custos/impostos são campos explícitos, não ocultos em preço ou quantidade;
- `effectiveDate` é data de negócio; `createdAt` registra chegada do documento;
- operações têm document ID independente do ticker e não usam índice de array;
- transação é evento fonte da verdade. Correção preferencial é evento
  compensatório, não mutação silenciosa do histórico;
- 007 precisa decidir idempotência antes de permitir retry automático, pois auto
  ID sozinho não evita duplicação de write.

## Representação e invariantes de valores

| Conceito | Representação escolhida | Invariante/conversão |
| --- | --- | --- |
| Dinheiro | `{ currency, amountMinor }`, com `amountMinor` inteiro seguro | Moeda determina escala ISO. V1 BRL usa centavos. Validar `Number.isSafeInteger` no app e tipo inteiro/limites nas Rules. Direção vem do tipo da operação; não persistir decimal. |
| Preço unitário | `{ currency, decimal }`, decimal canônico como string sem expoente | Não usar floating point. Aceitar escala maior que moeda quando mercado exigir. Multiplicação/rounding fica para 007/009 com política explícita. |
| Quantidade | `DecimalString` canônica | Permite frações. Sem expoente, NaN, Infinity, sinal indevido ou zeros ambíguos. Cálculo futuro não usa `number` ingênuo. |
| Percentual/alocação | `basisPoints: integer` | `10000` representa 100%; intervalo 0–10000 e soma futura de targets deve ser 10000. Apresentação divide por 100 somente na borda de UI. |
| Data de negócio | `YYYY-MM-DD` | Data civil sem timezone/localização; parser valida calendário real e não converte via `new Date(string)` de forma ambígua. |
| Timestamp técnico | Firestore `Timestamp` no documento, `Date`/instant no domínio | `createdAt`/`updatedAt` usam server timestamp. Parser rejeita string/número/nulo. |

Não adicionar biblioteca decimal agora: 005 não calcula posições nem totais. A
introdução futura só é justificada quando 007/009 precisarem de operações
decimais com escala variável e houver prova de que inteiros escalados locais
não cobrem o caso. Até lá, strings protegem o armazenamento e tornam a
necessidade explícita.

## IDs e ownership

- Firebase Auth `uid` é a única raiz de ownership; Auth identity não é replicada
  em cada documento.
- `portfolioId`, `assetId` e `transactionId` usam auto IDs Firestore, gerados
  por `doc(collectionRef)` no limite de persistência. Não derivar IDs de nome,
  ticker ou posição de array.
- Identity de Asset é composta por campos (`symbol`, `market`, `assetType`,
  `currency`) e pode ter referências externas; não usar ticker sozinho como
  chave global.
- Auto IDs não resolvem idempotência. Antes de writes de Transaction, 007 deve
  definir operação repetível ou chave de idempotência.
- Documentos não carregam `uid` por padrão: o path e Rules já impedem escolha de
  owner arbitrário. Campo de ownership só entra se uma query futura provar
  benefício que a hierarquia não oferece.

## Hierarquia Firestore e autorização

### Hierarquia versionada/proposta

```text
users/{uid}                                      # namespace; sem doc em 005
  portfolios/{portfolioId}                       # 005
    transactions/{transactionId}                 # 007
    allocationTargets/{targetId}                 # 009
    snapshots/{snapshotId}                       # 012
  assets/{assetId}                               # 007
  goals/{goalId}                                 # 013, provável
  emergencyReserve                               # 014, provável; não decidir schema agora
```

`users/{uid}` não precisa existir como documento para suas subcoleções existirem
e não receberá perfil mínimo em 005. Isso minimiza PII, não cria acoplamento com
Google Profile e preserva a função do path como namespace. Um futuro requisito
de preferências poderá criar um documento nessa rota com Rules próprias; até lá
leitura/escrita direta de `users/{uid}` permanece negada.

Rules da fase 005 devem:

1. negar por padrão todo caminho;
2. exigir `request.auth != null`;
3. comparar `request.auth.uid == userId` capturado no path;
4. permitir apenas schema de Portfolio implementado, com campos permitidos,
   tipos, `baseCurrency == "BRL"`, timestamps server-side e `createdAt`
   imutável em update;
5. negar root profile e subcoleções futuras ainda não implementadas;
6. não usar `allow read, write: if request.auth != null`.

Rules são a autorização real mesmo com Auth browser-only. `DashboardGate`,
`src/proxy.ts`, `noindex` e host routing não protegem documentos.

## Camada de acesso a dados

Organização provável, ajustável somente se a implementação encontrar padrão
melhor já existente:

```text
src/
  domain/
    portfolio.ts
    value-objects.ts
  data/
    firestore/
      converters/portfolio-converter.ts
      portfolio-repository.ts
  lib/firebase/
    client.ts
```

Responsabilidades:

- `domain`: tipos de domínio, inputs, invariantes e erros; sem imports de React;
- `lib/firebase/client.ts`: mantém inicialização única e passa a exportar
  Firestore criado com `getFirestore(firebaseApp)`; não chamar `initializeApp`
  novamente;
- `data/firestore`: referências de path, converter, parser e persistência;
- componentes React: chamam funções como `createPortfolio`, `getPortfolio`,
  `listPortfolios` e `updatePortfolio`, sem SDK Firestore direto;
- ownership é derivado internamente de `auth.currentUser.uid` ou contexto
  autenticado controlado pela camada, nunca de `uid` digitado pela UI;
- ausência de usuário gera erro de autenticação antes da operação. Rules
  continuam autoridade final contra cliente adulterado.

Não criar `GenericRepository<T>`, service locator, container, use case factory
ou abstração para entidades ainda inexistentes. Uma função orientada a
Portfolio é suficiente nesta fase.

`FirestoreDataConverter` organiza serialização e tipos do SDK, mas não valida
runtime sozinho. O parser deve checar `DocumentSnapshot.exists()`, document ID,
keys, strings, limites, Timestamp e value objects; documento inválido deve
falhar com erro sanitizado sem incluir conteúdo patrimonial em logs.

## Firebase e ambiente Firestore

- Reutilizar as variáveis públicas atuais. `NEXT_PUBLIC_FIREBASE_PROJECT_ID` já
  é parte do config Web; nenhuma env de Firestore adicional é necessária.
- Não adicionar `NEXT_PUBLIC_FIREBASE_USE_EMULATOR` automaticamente. Testes
  usam setup explícito e não devem trocar produção para emulator por flag
  esquecida.
- Criar futuramente `firebase.json` somente com Rules e Emulator Suite
  necessários. `.firebaserc` deve apontar ao projeto Firebase já usado pelo
  Auth, após confirmação humana, sem service account no repositório.
- Não criar `firestore.indexes.json` agora. Query de listagem de Portfolio usa
  campos simples/índice automático; índice composto só entra após query real e
  erro/documentação do Firestore.
- Criação/ativação do banco Firestore é checkpoint humano. Não escolher região
  automaticamente por localização do usuário: comparar região single-region e
  multi-region, latência para usuários/hosting, custo, residência e
  irreversibilidade antes de confirmar no Console.
- Deploy futuro deve publicar somente Rules/arquivos revisados para o projeto
  confirmado. Rollback usa Rules anteriores versionadas e smoke pós-rollback;
  não há migração de dados em 005.

## Alternativas descartadas

| Alternativa | Motivo |
| --- | --- |
| Collections raiz `portfolios`/`transactions` com `uid` no documento | Ownership depende de campo repetido em toda Rule/query; aumenta risco cross-user, exportação por usuário e paths artificiais. |
| `users/{uid}/portfolios/{portfolioId}` com `uid` replicado | O path já prova owner; duplicação cria divergência sem benefício concreto. |
| Criar `users/{uid}` com nome/e-mail/foto do Google | Não há requisito; duplica Auth, aumenta PII e custo de manutenção. |
| Asset dentro de cada Portfolio | Duplica identidade quando ativo aparece em carteiras múltiplas e dificulta provider mapping futuro. |
| Catálogo global de Asset | Exige governança, schema e autorização compartilhada sem requisito V1. Catálogo privado user-scoped é suficiente. |
| `position` mutável como fonte de verdade | Repetiria transações, dificulta correção histórica e contradiz princípio de ledger. |
| `number` decimal para dinheiro/quantidade | Floating point e serialização ingênua não garantem precisão financeira. |
| Decimal string para todo dinheiro | Preserva precisão, mas piora Rules, ordenação e apresentação para valores monetários simples; minor units inteiras são menores e suficientes para dinheiro V1. |
| Biblioteca decimal na 005 | Nenhuma operação patrimonial é implementada; dependência seria prematura. Reavaliar com caso concreto em 007/009. |
| Perfil obrigatório ou carteira criada no primeiro login | Acopla Auth à persistência, cria dados sem intenção do usuário e invade fase 006. |
| Rules abertas para todos os paths futuros | Wildcard autenticado permite acesso antes de schema/teste e viola default deny. |
| Generic repository framework | Uma única entidade persistida não justifica abstração; funções de domínio são mais auditáveis. |
| Zod ou validator externo agora | Parsers explícitos cobrem contrato pequeno sem dependência nova; reavaliar quando schemas crescerem. |
| Índices compostos preventivos | Nenhuma query da fase exige índice; criar depois da query real reduz configuração e risco operacional. |

## Arquivos, módulos e contratos afetados

### Alterações realizadas na execução

- `src/lib/firebase/client.ts`: exportar Firestore da mesma instância Firebase;
- `src/domain/*`: tipos de domínio/value objects e contratos futuros
  documentados/necessários;
- `src/data/firestore/*`: converter, parser, paths e repository de Portfolio;
- `firebase.json`: Rules/emulator, somente após confirmação do projeto;
- `.firebaserc`: alias do projeto Firebase confirmado, sem credenciais;
- `firestore.rules`: Rules versionadas para namespace e Portfolio;
- testes locais de Rules e fixture mínima fictícia;
- `package.json`/lockfile: scripts e dependências de desenvolvimento para
  `@firebase/rules-unit-testing`, Firebase CLI e teste reproduzível de Rules.

### Reutilização sem alteração esperada

- `src/components/auth/google-sign-in.tsx`: popup, listener e estados;
- `src/components/auth/dashboard-gate.tsx`: UX de Auth, nunca autorização;
- `src/app/layout.tsx`, route groups, `src/proxy.ts`, landing e metadata;
- `.env.example`: nomes atuais permanecem suficientes;
- nenhum Firebase Admin, route handler ou sessão server-side.

### Contratos técnicos

- módulo Firestore Web só roda no browser/client boundary existente;
- Server Components não importam SDK Firestore Web nem repository client-only;
- `auth`/`firebaseApp` continuam singletons por `getApps()`;
- persistência nunca aceita owner vindo de input de formulário;
- IDs são document IDs Firestore, não campos calculados;
- errors de parser não viram objetos parcialmente válidos;
- Rules e parser defendem camadas diferentes: Rules contra cliente malicioso,
  parser contra dado corrompido/incompatível.

## Riscos e mitigação

| Risco | Mitigação |
| --- | --- |
| DashboardGate confundido com autorização | Manter dashboard sem dados; documentar e testar Rules como boundary real. |
| Rules abertas por wildcard futuro | Default deny, paths explícitos, teste de caminho desconhecido e revisão de diff antes deploy. |
| Rules validam schema diferente do parser | Derivar tabela de campos/tipos única, testar ambos com mesmos fixtures e evitar campos não cobertos. |
| `serverTimestamp` não casar com `request.time` | Implementar writes com sentinel SDK, testar no emulator e não relaxar para qualquer Timestamp. |
| Exclusão de Portfolio não cascata subcoleções | 005 só abre Portfolio; antes de 007, revisar delete/archival e nunca prometer cascata implícita. |
| Auto ID duplica retry de transação | Decidir idempotência no início de 007, antes de abrir writes de Transaction. |
| Precisão decimal mal convertida na UI | Value objects canônicos, sem `parseFloat` para persistência; adicionar política de rounding antes de posição/quote. |
| Região escolhida sem reversão | Parar no checkpoint humano; apresentar single/multi-region, custo, latência e residência. |
| CLI aponta ao projeto Firebase errado | `.firebaserc`/`--project` revisado, project id comparado ao Auth sem registrar valor em docs/logs, deploy somente após confirmação. |
| Testes alteram produção | Emulator Suite com project id demo e fixtures sintéticas; nenhuma seed automática produtiva. |
| Nova dependência aumenta superfície | Preferir Node test runner + biblioteca oficial de Rules; justificar qualquer pacote no diff e manter lockfile coerente. |
| SDK Firestore importado em Server Component | Imports confinados a client/data layer, lint/build e inspeção estrutural antes de aceitar. |
| Mudança futura de moeda base | Base BRL explícita e imutável no update V1; FX e multi-currency exigem decisão própria. |

## Estratégia de testes e validação

### Rules e persistência

Usar Local Emulator Suite, `@firebase/rules-unit-testing` e o runner nativo
`node:test` ou equivalente mínimo aprovado, em vez de introduzir framework
genérico sem necessidade. A execução realizada:

1. carregar `firestore.rules` em projeto de emulator fictício;
2. criar fixtures sintéticas mínimas com usuários `user-a` e `user-b`, sem
   patrimônio real;
3. provar create/read/update/delete válido de Portfolio por A;
4. provar que A não lê nem escreve `users/user-b/...`;
5. provar anônimo sem read/write;
6. provar schema inválido, campo extra, moeda inválida e timestamp inválido
   rejeitados;
7. provar `users/{uid}` direto e paths futuros de assets/transactions/
   snapshots negados em 005;
8. provar listagem sob `users/{uid}/portfolios` no owner e ausência de acesso
   cross-user;
9. encerrar emulator e limpar fixtures sem tocar produção.

### Gates técnicos

Na ordem de `AGENTS.md`:

```bash
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
```

O script reproduzível `npm run test:rules` foi adicionado e executado. Build e
typecheck não provam ownership; a inspeção confirmou que landing, layouts e
Server Components não carregam Firestore.

### Produção e evidências

Após checkpoint de região, deploy aprovado e Rules emuladas:

- usar conta(s) de teste autorizada(s) e dados sintéticos mínimos;
- confirmar owner lê/escreve seu Portfolio;
- confirmar anônimo recebe negação e A não acessa B, sem registrar UID, token ou
  conteúdo financeiro;
- remover fixture temporária conforme delete permitido e verificar ausência;
- guardar apenas status, caminho sanitizado, ambiente, timestamp e resultado;
- se qualquer camada Console/deploy estiver apenas configurada, rotular como
  `configurado`, não `validado`.

## Compatibilidade com fases 006–014

| Fase | Handoff da fundação |
| --- | --- |
| 006 — Carteiras | Usa `Portfolio` e repository já owner-scoped para create/list/edit; constrói UI, sem remodelar path. Deve decidir UX de exclusão/arquivamento antes de abrir filhos. |
| 007 — Ativos + Transações | Cria Asset user-scoped e Transaction sob Portfolio; mantém auto IDs, decimal strings, data civil e ledger; abre Rules/schema em mudança própria. |
| 008 — Cotações + BRAPI | Adiciona adapter/provider mapping separado da identidade Asset; não torna provider parte do domínio principal nem persiste preço como float. |
| 009 — Posições + Alocação | Deriva posições do ledger; target allocation usa basis points e caminho filho; não cria `position` autoritativo. |
| 010 — Dashboard patrimonial real | Consulta repositories/serviços derivados; DashboardGate continua UX e cada read passa por Rules. |
| 011 — Planejamento de aportes | Calcula recomendação a partir de posições/targets; não regrava transação como recomendação. |
| 012 — Histórico + Snapshots | Persiste snapshots derivados sob Portfolio; mantém transactions como fonte da verdade e define consistência/versionamento. |
| 013 — Metas financeiras | Pode usar coleção user-scoped com relação opcional a Portfolio; adiciona schema/Rules somente com requisito. |
| 014 — Reserva de emergência | Pode usar dado user-scoped próprio; não sobrecarrega Portfolio com saldo ou regra de reserva em 005. |

## Ordem das subtarefas

1. [005-01-baseline-e-decisoes-dominio.md](../tasks/005-domain-model-firestore-foundation/005-01-baseline-e-decisoes-dominio.md) — consolidar baseline, limites e decisões.
2. [005-02-definir-contratos-e-invariantes.md](../tasks/005-domain-model-firestore-foundation/005-02-definir-contratos-e-invariantes.md) — implementar contratos Portfolio/value objects e preparar contratos futuros sem features.
3. [005-03-integrar-firestore-web.md](../tasks/005-domain-model-firestore-foundation/005-03-integrar-firestore-web.md) — adicionar Firestore à inicialização Firebase existente.
4. [005-04-criar-converters-e-validacao-runtime.md](../tasks/005-domain-model-firestore-foundation/005-04-criar-converters-e-validacao-runtime.md) — converter documentos e rejeitar dados inválidos.
5. [005-05-criar-acesso-de-dados-de-portfolio.md](../tasks/005-domain-model-firestore-foundation/005-05-criar-acesso-de-dados-de-portfolio.md) — criar funções owner-scoped sem chamadas Firestore em React.
6. [005-06-versionar-security-rules.md](../tasks/005-domain-model-firestore-foundation/005-06-versionar-security-rules.md) — escrever Rules default deny e schema mínimo de Portfolio.
7. [005-07-configurar-emulator-e-testes-de-rules.md](../tasks/005-domain-model-firestore-foundation/005-07-configurar-emulator-e-testes-de-rules.md) — configurar testes locais e provar isolamento.
8. [005-08-ativar-firestore-com-checkpoint-humano.md](../tasks/005-domain-model-firestore-foundation/005-08-ativar-firestore-com-checkpoint-humano.md) — decidir região e ativar banco somente com aprovação.
9. [005-09-publicar-rules-e-validar-producao.md](../tasks/005-domain-model-firestore-foundation/005-09-publicar-rules-e-validar-producao.md) — publicar Rules e executar smoke sintético de ownership.
10. [005-10-fechar-gates-e-documentacao.md](../tasks/005-domain-model-firestore-foundation/005-10-fechar-gates-e-documentacao.md) — executar gates, consolidar evidências e encerrar handoff para 006.

## Premissas explícitas e decisões pendentes

- `005` foi fornecido explicitamente e é preservado como ticker; não gerar
  número sequencial.
- O mesmo projeto Firebase usado pelo Auth é o alvo Firestore; project ID e
  credenciais não são registrados em docs/logs.
- Database Firestore foi criado após checkpoint humano; região e modo estão
  registrados em `005-08`, sem conteúdo patrimonial.
- A recomendação é namespace sem documento `users/{uid}` e sem perfil; revisão
  humana pode alterar isso antes da implementação se surgir requisito real.
- BRL é base V1 por coerência com produto; FX e multi-currency ficam adiados.
- A decisão agrupada de domínio/Firestore está registrada nesta spec e foi
  revisada antes da implementação.
- Região, custo/residência, disponibilidade de contas de teste e método de
  publicação foram tratados como checkpoints humanos; Rules foram publicadas
  somente após Emulator verde e smoke sintético.
- Não foram criados dados patrimoniais pessoais, seed produtivo, Firebase Admin,
  service account, secret versionado ou índice composto.

## Referências consultadas

- `AGENTS.md` e regras do repositório; não havia `.opencode/rules/`.
- `docs/specs/001-primeira-vertical-autenticacao.md` a
  `docs/specs/004-production-deployment.md` e overviews/tasks concluídas.
- `docs/decisions/001-autenticacao-google-popup.md`,
  `docs/decisions/003-separacao-host-publico-app.md` e
  `docs/decisions/004-cloudflare-proxied-vercel.md`.
- `src/lib/firebase/client.ts`, componentes de auth, App Router, `.env.example`,
  `package.json` e placeholders em `src/domain`, `src/services`, `src/types`.
- Firebase Cloud Firestore data model:
  https://firebase.google.com/docs/firestore/data-model
- Firebase Firestore structure/data types:
  https://firebase.google.com/docs/firestore/manage-data/structure-data
  e https://firebase.google.com/docs/firestore/manage-data/data-types
- Firebase add data/server timestamps:
  https://firebase.google.com/docs/firestore/manage-data/add-data
- Firebase Security Rules structure/conditions/query:
  https://firebase.google.com/docs/firestore/security/rules-structure
  e https://firebase.google.com/docs/firestore/security/rules-conditions
  e https://firebase.google.com/docs/firestore/security/rules-query
- Firebase Firestore Rules testing:
  https://firebase.google.com/docs/firestore/security/test-rules-emulator
- Firebase Local Emulator Suite / Firestore:
  https://firebase.google.com/docs/emulator-suite/connect_firestore
- Firebase JavaScript setup e Firestore Web SDK:
  https://firebase.google.com/docs/web/setup
- Firestore locations:
  https://firebase.google.com/docs/firestore/locations
- Firestore indexes:
  https://firebase.google.com/docs/firestore/query-data/indexing
- `FirestoreDataConverter` API:
  https://firebase.google.com/docs/reference/js/firestore_.firestoredataconverter
- Next.js local docs check: `node_modules/next/dist/docs/` ausente; não há
  mudança Next planejada. Contrato anterior consultado:
  https://nextjs.org/docs/app/api-reference/file-conventions/proxy

## Estado final da execução

- **Data:** 2026-09-24.
- **Status:** `completed`; as 10 subtarefas foram concluídas e o overview está
  em `10/10`.
- **Rules local:** `JAVA_HOME=$(/usr/libexec/java_home -v 21) npm run
  test:rules` passou com 5 testes e 0 falhas, somente no projeto demo do
  Emulator Suite.
- **Gates:** `npm run lint`, `npm exec next typegen`, `npx tsc --noEmit`,
  `npm run build` e `git diff --check` passaram nessa ordem.
- **Produção:** evidências de `005-08` e `005-09` registram database configurado
  após checkpoint humano, Rules publicadas e smoke sintético owner/anônimo/
  cross-user com fixture removida. Configuração, publicação e smoke permanecem
  distinguidos.
- **Fronteiras:** landing, layouts e Server Components não importam Firestore;
  React não acessa SDK Firestore diretamente. Não há UI financeira, seed pessoal,
  Firebase Admin, service account, secret versionado ou `firestore.indexes.json`.
- **Handoff 006:** iniciar experiência de Portfolio sobre contratos e repository
  existentes. Revisar delete/cascade antes de abrir subcoleções patrimoniais;
  idempotência de Transaction permanece decisão de 007.
- **Riscos residuais:** smoke cross-user produtivo usou uma conta autorizada
  contra namespace sintético diferente, não duas sessões reais; hash remoto das
  Rules não foi registrado. Nenhum risco bloqueia handoff 006.
