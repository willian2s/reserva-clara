# 006-06 — Validar Rules e isolamento

- **Ticker:** `006`
- **Número:** `06`
- **Status:** `pending`

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
