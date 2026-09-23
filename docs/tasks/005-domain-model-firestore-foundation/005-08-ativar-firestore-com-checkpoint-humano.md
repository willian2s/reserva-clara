# 005-08 — Ativar Firestore com checkpoint humano

- **Ticker:** `005`
- **Número:** `08`
- **Status:** `pending`

## Objetivo

Confirmar projeto Firebase e, somente após decisão humana explícita, criar o
database Firestore com região escolhida conscientemente.

## Resultado esperado

Database correto está ativo, ou task permanece `blocked` com opções,
repercussões e motivo registrados. Nenhuma região é escolhida automaticamente.

## Requisitos cobertos

- distinguir código versionado, Emulator, Console e produção;
- checkpoint humano de região/location;
- mesmo projeto do Auth;
- nenhum Admin/service account/seed pessoal.

## Escopo incluído

- confirmar project ID do Firebase Web/Auth sem copiá-lo para logs públicos;
- verificar se Firestore default database já existe;
- apresentar opções regional/multi-region, latência, custo, residência,
  disponibilidade e irreversibilidade;
- obter aprovação humana de região e database mode;
- criar/ativar database no Firebase Console somente após aprovação;
- configurar `.firebaserc` para projeto confirmado, sem credenciais;
- registrar estado `configurado` versus `validado`.

## Escopo excluído

- escolher região por proximidade ao Brasil;
- criar collections/documents, seed ou perfil de usuário;
- publicar Rules ou executar deploy;
- alterar env, Auth, Vercel ou Cloudflare;
- avançar com aprovação implícita/ambígua.

## Dependências

- 005-07 Rules/emulator verde;
- acesso humano ao Firebase Console;
- decisão humana de localização;
- `firebase.json` versionado com target correto, se criado.

## Arquivos e símbolos prováveis

- Firebase Console, somente com intervenção humana;
- `.firebaserc`;
- `firebase.json`;
- `.env.example` apenas para confirmar `projectId`, sem alteração;
- evidência sanitizada da subtarefa.

## Passos de implementação futura

1. Parar antes de clicar em criação/ativação.
2. Apresentar tabela de opções e consequências permanentes.
3. Receber aprovação explícita de projeto, database e região.
4. Criar database somente no projeto confirmado.
5. Configurar alias local sem incluir token/service account.
6. Verificar estado Console e conexão emulator/local sem criar dado produtivo.
7. Se aprovação faltar, marcar `blocked`, não `[x]`.

## Testes e comandos de validação

- confirmar project target com comando não destrutivo;
- `firebase firestore:databases:list` ou equivalente oficial atual;
- não executar `deploy` nesta subtarefa;
- revisar `git diff --check` e ausência de secrets.

## Definição de pronto

- aprovação humana registrada com região escolhida e motivo;
- database correto criado, ou bloqueio concreto registrado;
- `.firebaserc` não contém segredo;
- nenhum documento patrimonial pessoal foi criado;
- rollback/limitações da região estão documentados.

## Riscos e cuidados

- Região é difícil/impossível de mudar depois; nunca assumir.
- Console configurado não significa Rules publicadas ou app validado.
- Proteger project ID de vazamento operacional desnecessário.
- Se Console mostrar database inesperado, parar e investigar antes de usar.
