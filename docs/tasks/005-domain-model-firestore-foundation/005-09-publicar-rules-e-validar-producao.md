# 005-09 — Publicar Rules e validar produção

- **Ticker:** `005`
- **Número:** `09`
- **Status:** `completed`

## Objetivo

Publicar Rules já testadas no projeto confirmado e provar ownership em produção
com fixtures sintéticas e contas de teste autorizadas.

## Resultado esperado

Rules publicadas no alvo correto, smoke de owner/anônimo/cross-user executado
sem dados pessoais, e rollback reproduzível conhecido.

## Requisitos cobertos

- Rules publicadas e validadas em produção;
- owner próprio permitido;
- anônimo e cross-user negados;
- nenhuma proteção dependente de DashboardGate;
- ausência de seed pessoal/credencial.

## Escopo incluído

- revisar diff final de `firestore.rules` e target `.firebaserc`;
- salvar referência sanitizada da Rules anterior para rollback;
- executar deploy somente de Rules, com comando oficial atual;
- usar uma ou duas contas de teste autorizadas e Portfolio sintético mínimo;
- testar owner read/write, anônimo read/write e A→B read/write;
- remover fixture temporária usando operação permitida e verificar ausência;
- registrar status de publicação, smoke, limites e rollback.

## Escopo excluído

- deploy de Functions/Admin/Storage/Indexes;
- dados financeiros reais, tokens, UIDs, e-mails ou screenshots sensíveis;
- habilitar paths de Asset/Transaction futuros;
- mudar região, Auth provider, authorized domains ou Dashboard.

## Dependências

- 005-07 verde;
- 005-08 database/região aprovados e ativos;
- acesso humano de deploy e contas de teste;
- camada repository/converter de 005-05/04.

## Arquivos e símbolos prováveis

- `firestore.rules`;
- `.firebaserc`, `firebase.json`;
- `src/lib/firebase/client.ts` e repository de Portfolio;
- evidências em `docs/tasks/005-domain-model-firestore-foundation/evidences/`
  somente se diretório for permitido e sem conteúdo sensível.

## Passos de implementação futura

1. Confirmar manualmente projeto/ambiente antes do deploy.
2. Executar smoke local final e revisar Rules.
3. Publicar somente Rules.
4. Confirmar publicação no Console/CLI sem registrar tokens.
5. Executar matriz sintética owner/anônimo/A→B.
6. Limpar fixtures e verificar que exclusão não deixou subcollection.
7. Se falhar, restaurar Rules anterior e repetir smoke de rollback.

## Testes e comandos de validação

```bash
firebase deploy --only firestore:rules
```

O comando deve ser confirmado na CLI instalada. Validar por cliente Web/teste
autorizado, não por Admin. Nenhuma evidência deve conter credentials, UIDs ou
conteúdo patrimonial.

## Definição de pronto

- deploy apontou ao project/database aprovados;
- owner válido permitido e todos os denies obrigatórios provados;
- fixture sintética removida;
- Rules anterior e procedimento de rollback registrados;
- configuração/deploy/HTTP/Firestore smoke estão rotulados separadamente.

## Riscos e cuidados

- Firebase Admin/emulator disabled pode contornar Rules; não usar para aceite.
- Não executar comando se target não estiver confirmado.
- Não deixar fixture permanente por falta de delete; parar e corrigir processo.
- Não chamar produção validada somente porque Console mostra “deployed”.

## Execução e evidências

- **Data:** 2026-09-24.
- **Status:** `completed`; deploy e smoke produtivo foram concluídos com uma
  conta autorizada e fixture sintética temporária.
- **Target:** `.firebaserc` aponta ao projeto Auth/Web confirmado no checkpoint de
  `005-08`; `firebase.json` publica somente `firestore.rules` e mantém Emulator
  local separado no script `test:rules`.
- **Referência de rollback:** `evidences/005-09-firestore.rules.before-deploy`
  guarda cópia sanitizada das Rules vigentes antes de qualquer deploy. Arquivo
  foi adicionado ao diff desta execução e deve ser incluído no commit que
  transportar esta evidência.
- **Pré-validação local:** `JAVA_HOME=$(/usr/libexec/java_home -v 21) npm run
  test:rules` passou com 5 testes e 0 falhas no projeto demo do Emulator; a
  matriz cobre owner, anônimo, cross-user, schema inválido e paths futuros.
- **Gates:** `npm run lint`, `npm exec next typegen`, `npx tsc --noEmit` e
  `npm run build` passaram nessa ordem.
- **CLI:** `npm exec -- firebase --version` passou e confirmou Firebase CLI
  `15.31.0`; após autenticação autorizada, `firebase deploy
  --only firestore:rules` compilou e liberou `firestore.rules` no projeto
  configurado. Deploy publicou somente Rules.
- **Database:** `npm exec -- firebase firestore:databases:list --project
  <target-confirmado>` retornou database `(default)` em `STANDARD`/
  `FIRESTORE_NATIVE`; project ID não foi registrado nesta evidência.
- **Produção:** publicação confirmada pelo CLI. Smoke via Firebase Web SDK no
  browser passou: owner create/read/update `PASS`; cross-user read/write em
  namespace sintético diferente `DENIED`; anônimo read/write `DENIED`; cleanup
  `PASS`. Nenhum UID, token, e-mail ou conteúdo patrimonial foi registrado.
- **Evidência sanitizada:** `evidences/005-09-production-smoke.md`.
- **Rollback conhecido:** restaurar a cópia sanitizada com
  `cp docs/tasks/005-domain-model-firestore-foundation/evidences/005-09-firestore.rules.before-deploy firestore.rules`,
  executar `firebase deploy --only firestore:rules`, repetir smoke produtivo e
  registrar resultado sanitizado. Não há rollback a executar nesta tentativa,
  pois deploy atual foi concluído sem erro.

## Arquivos alterados

- `docs/tasks/005-domain-model-firestore-foundation/evidences/005-09-firestore.rules.before-deploy`
- `docs/tasks/005-domain-model-firestore-foundation/evidences/005-09-production-smoke.md`
- `docs/tasks/005-domain-model-firestore-foundation/005-09-publicar-rules-e-validar-producao.md`
- `docs/tasks/005-domain-model-firestore-foundation/005-00-overview.md`

## Decisões e desvios

- Não alterei `firestore.rules`, `.firebaserc`, `firebase.json` ou código da
  aplicação: Rules locais já estavam testadas e target foi confirmado em
  `005-08`.
- Não usei Admin, Emulator para aceite produtivo, dados pessoais, UIDs, tokens,
  contas ou screenshots.
- Usei uma conta autorizada para owner/anônimo e namespace sintético diferente
  para provar negação cross-user; segunda identidade não foi necessária para a
  decisão de ownership por `request.auth.uid` versus `userId` do path.

## Riscos residuais e bloqueios

- O cross-user foi testado contra path sintético diferente, não contra uma
  segunda sessão autenticada real; se requisito operacional exigir A→B com duas
  contas, repetir matriz com segunda conta antes de ampliar o aceite.
- O hash/estado remoto das Rules não foi obtido; publicação foi confirmada pelo
  CLI e comportamento pelo cliente Web. As evidências aguardam inclusão no
  commit da execução antes de serem consideradas preservadas no histórico.
