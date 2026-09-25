# 006-06 — Validar Rules e isolamento

- **Ticker:** `006`
- **Número:** `06`
- **Status:** `completed`

## Objetivo

Provar que a experiência reutiliza a fronteira de dados da fase 005 e não abriu
acesso novo, path desconhecido ou cross-user ao adicionar UI de Portfolio.

## Resultado esperado

Rules permanecem default deny e owner-scoped; Emulator Suite e inspeção
estrutural confirmam CRUD, listagem, rename, delete, anônimo, schema inválido e
paths futuros. Qualquer incompatibilidade fica bloqueada, não mascarada.

## Escopo incluído

- Revisar diff de `firestore.rules`, parser, converter, paths e repository.
- Confirmar que UI importa somente funções de `portfolio-repository.ts`.
- Executar testes existentes do Emulator com projeto demo e fixtures sintéticas.
- Cobrir/revalidar owner CRUD, owner list, A/B, anônimo, timestamps, schema,
  campo extra e paths futuros.
- Inspecionar que `users/{uid}` direto, Assets, Transactions, allocationTargets,
  snapshots e desconhecidos continuam negados.
- Validar que ausência/permission denied no detalhe usa mensagem indistinguível.
- Alterar Rules/testes somente se uma incompatibilidade concreta da experiência
  for comprovada, de forma atômica e com revisão explícita; expectativa é zero
  alteração.

## Escopo excluído

- Deploy de Rules, alteração Firebase Console ou seed produtivo.
- `withSecurityRulesDisabled`, Admin SDK, bypass de Rules ou UID fornecido pela
  UI.
- Abrir qualquer path da fase 007.
- Criar novo framework de testes.

## Dependências

- 006-01 a 006-05 implementadas.
- `firebase.json`, `.firebaserc`, `firestore.rules` e testes 005 disponíveis.
- JDK 21 para Firebase CLI atual.

## Arquivos e símbolos prováveis

- `firestore.rules`.
- `tests/firestore.rules.test.mjs`.
- `src/data/firestore/portfolio-repository.ts`.
- `src/data/firestore/paths.ts`, parser e converter.
- `src/components/portfolio/*` e páginas protegidas para inspeção de imports.

## Passos de implementação futura

1. Executar status/diff e confirmar target demo para testes.
2. Rodar Emulator antes de qualquer ação produtiva.
3. Fazer busca estrutural por imports SDK em `src/app` e componentes visuais.
4. Exercitar matriz owner/anônimo/A/B e schema.
5. Se Rules permanecerem idênticas, registrar isso explicitamente e não publicar
   novamente Rules por causa da fase.
6. Se houver alteração inevitável, parar, atualizar contrato/testes juntos e
   exigir revisão antes do deploy futuro.

## Testes e validação

```bash
JAVA_HOME=$(/usr/libexec/java_home -v 21) npm run test:rules
```

Também executar os gates do repository conforme subtarefa 006-08. Usar somente
fixtures sintéticas; não registrar project ID produtivo, UID, token ou nomes.

## Definição de pronto

- Emulator passa sem falhas e sem tocar produção.
- Owner CRUD/list e isolamento A/B continuam aprovados.
- Anônimo, schema inválido e paths futuros continuam negados.
- Nenhum componente constrói path ou importa SDK Firestore.
- Rules permanecem inalteradas ou qualquer desvio está registrado e revisado.

## Riscos e cuidados

- Build/lint não prova authorization; Emulator é gate separado.
- Rules não filtram consultas; listagem deve usar namespace derivado do owner.
- Smoke cross-user de produção da fase 005 usou namespace sintético; duas contas
  reais só entram se disponíveis e autorizadas para a matriz 006.
- Não declarar archive futuro implementado nesta fase.

## Evidência esperada ao concluir

Registrar comandos, quantidade de testes, resultado, diff de Rules, inspeção de
imports, cenários cross-user/anônimo e riscos residuais. Overview só avança este
item após prova completa.

## Arquivos alterados

- `docs/tasks/006-portfolio-management/006-06-validar-regras-e-isolamento.md`
  — registro desta validação.
- `docs/tasks/006-portfolio-management/006-00-overview.md` — checklist e
  progresso.
- `firestore.rules`, `tests/firestore.rules.test.mjs`, parser, converter, paths,
  repository e UI — sem alterações.

## Decisões e desvios

- Rules permaneceram inalteradas; nenhum deploy de Rules foi executado.
- Nenhuma incompatibilidade concreta foi encontrada; não houve alteração de
  contrato ou teste.
- Autenticação Firebase em componentes de Auth permanece existente e esperada;
  componentes de Portfolio não importam SDK Firestore nem constroem paths.
- Smoke produtivo e validação manual de browser permanecem fora desta subtarefa,
  destinados aos gates 006-07/006-08.

## Comandos executados

```bash
JAVA_HOME=$(/usr/libexec/java_home -v 21) npm run test:rules
npm run lint
npm exec next typegen && npx tsc --noEmit
npm run build
git diff --check
```

## Resultados e evidências

- Emulator Suite passou: 5 testes, 5 aprovados, 0 falhas, projeto demo
  `demo-reserva-clara`, sem acesso à produção.
- Owner CRUD/listagem passou, incluindo create/read/list/update/delete e
  timestamps server-side; update preserva `createdAt`.
- Isolamento A/B passou para read, list, create, update e delete; cada owner
  listou somente sua fixture sintética.
- Anônimo falhou conforme esperado em read e write.
- Schema inválido negado em 6 casos: campo ausente, campo extra, moeda USD,
  timestamp cliente, tipo de timestamp inválido e nome em branco.
- Paths raiz, futuros e desconhecidos negados em read/write: `users/{uid}`,
  `assets`, `goals`, `emergencyReserve`, `transactions`, `allocationTargets`,
  `snapshots` e path desconhecido.
- `firestore.rules` sem diff; SHA-256 no working tree e em `HEAD` coincidente:
  `9261f12eefdadcf171c8e0526df7c518fbce18df421ac406755e7db26fd067e5`.
- Inspeção estrutural confirmou imports de Portfolio somente de funções do
  `portfolio-repository.ts`; nenhuma ocorrência de SDK Firestore ou helpers de
  path em `src/app` e `src/components/portfolio`.
- Detalhe e settings convergem ausência, falha de leitura e permission denied
  para `Não foi possível acessar esta carteira.`.
- Lint, typegen, TypeScript, build e `git diff --check` passaram.

## Riscos residuais

- Não há testes de UI/repository dedicados nem smoke produtivo nesta subtarefa;
  gates 006-07/006-08 permanecem necessários.
- Hard delete continua válido somente enquanto não houver subcoleções; archive e
  remoção futura de `allow delete` seguem gate bloqueante de 007.
