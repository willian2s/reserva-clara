# 005-08 — Ativar Firestore com checkpoint humano

- **Ticker:** `005`
- **Número:** `08`
- **Status:** `completed`

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

## Checkpoint humano

Antes da aprovação, o target local do Emulator permanecia separado do projeto
Auth/Web. Após a aprovação, o database foi criado manualmente no projeto
confirmado; o alias produtivo agora está separado do projeto demo usado pelos
testes locais.

Checkpoint humano recebido em 2026-09-24: projeto Auth/Web confirmado pelo
responsável, `Native mode`, região `southamerica-east1` e autorização explícita
para criar o database. Justificativa informada para região: residência no Brasil
e latência para usuários. Aprovação foi consumida somente no Console, sem
fallback automático.

| Opção | Latência | Custo | Residência | Disponibilidade | Repercussão |
| --- | --- | --- | --- | --- | --- |
| Regional em `southamerica-east1` | Potencialmente menor para usuários no Brasil | Preço regional conforme Console | Brasil | Confirmar no Console/projeto | Domínio regional de falha; localização não migra depois da criação |
| Regional em outra localização elegível | Depende da distância dos usuários/hosting | Preço regional conforme Console | País/região escolhidos | Confirmar no Console/projeto | Pode aumentar latência e impor residência fora do Brasil; não migra depois |
| Multi-region elegível | Maior disponibilidade, latência depende do conjunto | Custo normalmente maior; confirmar tabela atual | Conjunto de regiões da opção | Confirmar elegibilidade e quotas | Residência distribuída; não migra depois |

As opções são apenas comparação, não recomendação automática. Console deve
confirmar localizações, preço, quotas, residência/regulação e disponibilidade da
conta antes da decisão.

| Database mode | Consequência |
| --- | --- |
| Native mode | Compatível com Firebase Web, Rules versionadas e Emulator desta fase; exige aprovação explícita antes da criação |
| Datastore mode | Não corresponde ao contrato Firestore Web/Rules desta fase; exigiria replanejamento, não pode ser escolhido por fallback |

Criar database é decisão permanente: localização e mode não são alterados in
situ; mudança futura exige novo database, migração e revisão de Rules, custos,
residência e downtime. Aprovação necessária, em mensagem explícita, contendo:

1. confirmação de que project ID Web/Auth é o mesmo alvo, sem registrar o valor
   em documentação pública;
2. localização exata e justificativa de latência, custo, residência e
   disponibilidade;
3. database mode;
4. autorização para clicar em criação no Firebase Console.

## Execução e evidências

- **Data:** 2026-09-24.
- **Estado:** `completed`; Firestore produtivo está `configurado`, mas ainda não
  está `validado` por smoke de produção.
- **Aprovação humana:** recebida para projeto Auth/Web confirmado, `Native mode`,
  `southamerica-east1` e criação do database. Justificativa: residência no
  Brasil e latência para usuários. A aprovação não foi tratada como criação
  automática.
- **Verificação de target:** `.env.local` ignorado contém project ID; comparação
  sanitizada mostrou divergência inicial em relação ao alias demo local. Após a
  criação, `.firebaserc` aponta ao projeto confirmado, sem registrar o valor em
  evidências textuais ou logs.
- **Verificação inicial de database:** `npm exec -- firebase
  firestore:databases:list` usando o project ID do `.env.local` terminou com exit
  1 antes da autenticação; resposta não listou databases. Isso não foi tratado
  como prova de ausência.
- **Confirmação no Console:** evidência visual fornecida pelo responsável mostra
  database `(default)` pronto para uso, sem collections/documentos, no projeto
  Auth/Web confirmado. Configuração registrada: Standard, Firestore nativo,
  `southamerica-east1`, modo produtivo, backups programados desativados e
  atualizações em tempo real ativadas.
- **Pré-verificação de localização:** `npm exec -- firebase firestore:locations`
  com o project ID desserializado de `.env.local` terminou com exit 1 por falta de
  autenticação (`Failed to authenticate, have you run firebase login?`). Não foi
  possível validar elegibilidade via CLI.
- **Arquivos de configuração:** `.firebaserc` aponta para o projeto Auth/Web
  confirmado e não contém credencial. O script `test:rules` continua fixando o
  projeto demo; `firebase.json` contém Rules/Emulator locais. Nenhum env foi
  alterado.
- **Console/provisionamento:** database default criado manualmente após aprovação
  explícita. Nenhuma collection, documento, seed, Rules deploy, Admin ou service
  account foi criado/usado; nenhum token ou credencial foi exposto ou registrado.
- **Validação local:** `JAVA_HOME=$(/usr/libexec/java_home -v 21) npm run
  test:rules` passou com 5 testes e 0 falhas, somente no Emulator demo. A
  tentativa sem `JAVA_HOME` falhou antes da execução porque Firebase CLI exige
  Java 21.
- **Gates:** `npm run lint`, `npm exec next typegen`, `npx tsc --noEmit`, `npm
  run build` e `git diff --check` passaram. `npm exec -- firebase --version`
  confirmou Firebase CLI 15.31.0.
- **Deploy:** não executado, conforme escopo.
- **CLI:** não autenticada neste ambiente; criação foi feita pelo responsável no
  Console. O comando de criação não foi executado pelo agente.

## Arquivos alterados

- `.firebaserc`
- `docs/tasks/005-domain-model-firestore-foundation/005-08-ativar-firestore-com-checkpoint-humano.md`
- `docs/tasks/005-domain-model-firestore-foundation/005-00-overview.md`

## Decisões e desvios

- Não foi escolhida região por proximidade ao Brasil nem qualquer fallback de
  database mode pelo agente; a região foi escolhida e justificada pelo
  responsável humano por residência no Brasil e latência para usuários.
- O alias demo continua explícito no script de testes; `.firebaserc` agora aponta
  ao projeto Auth/Web confirmado para comandos produtivos.
- Status `configurado` não significa `validado`: Rules ainda não foram
  publicadas e nenhum smoke produtivo foi executado nesta subtarefa.

## Riscos residuais e bloqueios

- Database não pode trocar localização ou mode in situ; eventual mudança exige
  novo database, migração, revisão de Rules e janela operacional.
- CLI permanece sem autenticação local; validação produtiva e publicação de Rules
  pertencem a `005-09`, com conta e smoke aprovados.
- Nenhum documento produtivo foi criado; tela do Console mostra database vazio.
