# 005-09 — Publicar Rules e validar produção

- **Ticker:** `005`
- **Número:** `09`
- **Status:** `pending`

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
