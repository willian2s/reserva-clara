# 004-03 — Configurar environment variables

- **Ticker:** `004`
- **Número:** `03`
- **Status:** `completed`

## Objetivo e resultado esperado

Configurar a aplicação Web Firebase por ambiente na Vercel, sem copiar valores
reais para documentação, e produzir novo deployment que permita validar landing,
login e dashboard no hostname Vercel.

## Requisitos cobertos

- Variáveis `NEXT_PUBLIC_FIREBASE_*` de `.env.example`.
- Separação Production, Preview e Development.
- Redeploy após mudança de variables.
- Nenhum secret, token BRAPI ou valor env versionado.
- Preview útil sem prometer OAuth para hostname dinâmico.

## Escopo incluído

- Confirmar projeto Firebase Web correto com responsável humano.
- Configurar os nomes previstos: `API_KEY`, `AUTH_DOMAIN`, `PROJECT_ID`,
  `STORAGE_BUCKET`, `MESSAGING_SENDER_ID`, `APP_ID` e `MEASUREMENT_ID`.
- Usar o valor oficial da aplicação Web Firebase; se measurement ID não existir,
  registrar somente que não foi fornecido, sem inventar valor.
- Definir escopo por ambiente conforme estratégia 004.
- Recriar deployment depois de salvar variables.
- Validar que config chega ao browser somente pela aplicação esperada, sem
  registrar conteúdo.

## Escopo excluído

- Solicitar, exibir ou salvar valores reais em docs, logs, screenshots ou chat.
- Alterar `.env.example`, `src/lib/firebase/client.ts`, package ou lockfile.
- Autorizar domínios Firebase, habilitar provider ou testar popup nominal; tasks
  004-05 e 004-07.
- Adicionar BRAPI ou qualquer variável além das necessárias.

## Dependências

- 004-01 concluída.
- 004-02 conectou projeto Vercel.
- Humano com acesso ao projeto Firebase e Vercel; agente não precisa receber os
  valores.

## Arquivos e símbolos prováveis

- `.env.example` como contrato de nomes.
- `src/lib/firebase/client.ts` como consumidor.
- Vercel Project Settings → Environment Variables.
- Deployment logs e URL `.vercel.app`.

## Passos de implementação

1. Humano confirma o projeto Firebase Web que corresponde ao `projectId` atual.
2. Cadastrar variáveis em Production; limitar Development/Preview ao que for
   necessário para cada ambiente.
3. Para Preview, usar configuração pública somente se o responsável aceitar o
   uso do projeto; isso não adiciona Authorized Domains dinâmicos.
4. Não usar `.env.local` como fonte de documentação nem colar valores no
   repositório.
5. Salvar variables e disparar novo deployment; changes não retroagem deployment
   anterior.
6. Conferir build/runtime logs e abrir URL Vercel.
7. Registrar somente nomes, ambientes e status de validação, nunca valores.

## Testes e comandos de validação

- Vercel: sete names, scopes e deployment posterior à alteração.
- URL Vercel: `/`, `/login`, `/dashboard`, metadata `noindex`, assets e ausência
  de erro imediato no console.
- `npm run lint`, `npm exec next typegen`, `npx tsc --noEmit`, `npm run build`
  continuam sendo gates locais, não substituto do redeploy.
- Confirmar que `git status` não mostra `.env.local` ou arquivo novo de env.

## Definição de pronto

- Production deployment novo usa variables do escopo correto.
- Landing, login e dashboard carregam no hostname Vercel sem erro de config.
- Nenhum valor real aparece em docs, logs compartilhados ou git.
- Preview strategy está registrada: auth não é assumida em hostname efêmero.
- 004-04 pode começar sem alterar código.

## Riscos e cuidados

- `NEXT_PUBLIC_*` é embutida/exposta no browser por contrato; não chamar isso de
  secret e não adicionar credenciais privadas.
- Alterar variables sem redeploy deixa deployment anterior inválido; registrar
  ID/horário sem valores.
- Projeto Firebase errado pode parecer configuração válida; conferir origem com
  responsável e não corrigir por tentativa.
- Erro `auth/invalid-api-key` ou equivalente antes de Authorized Domains bloqueia
  task; não vazar código bruto para usuário final.

## Evidências da execução

- **Data da execução:** 2026-09-23.
- **Estrutura SDD:** spec, pasta, overview e nove subtarefas usam ticker `004`;
  overview contém uma única seção `## Checklist`, com um item por subtarefa.
  Execução restrita a `004-03`.
- **Contrato local:** `.env.example` contém exatamente os sete nomes previstos;
  `src/lib/firebase/client.ts` consome os sete nomes; `.gitignore` ignora
  `.env*` e preserva somente `.env.example`. Nenhum valor foi lido, exibido ou
  registrado.
- **Confirmação humana:** usuário confirmou no Chrome que a página carrega corretamente,
  os deployments estão funcionais, as chaves estão corretas e funcionando, e o
  login/redirecionamento funcionam corretamente no navegador. Nenhum valor real,
  token ou conteúdo de `.env.local` foi solicitado ou registrado.
- **Variables no Vercel:** confirmação textual do usuário registra os
  sete nomes previstos, todos com escopo `Production and Preview` e status
  configurado: `NEXT_PUBLIC_FIREBASE_API_KEY`,
  `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`,
  `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`,
  `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID` e
  `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`. Nenhum valor foi registrado.
- **Deployment inicial:** usuário esclareceu que variables foram configuradas
  durante a conexão do projeto, antes do deployment inicial; portanto o
  deployment `Production`/`main` já iniciou com essa configuração. Não houve
  alteração posterior de variables que exigisse redeploy adicional nesta task.
- **Development:** não foi listado como escopo Vercel para essas variables;
  desenvolvimento local continua usando `.env.local` ignorado.
- **Resultado remoto:** configuração efetiva foi validada por comportamento no
  deployment; a confirmação não registra valores, identificadores de projeto ou
  conteúdo de console.
- **Regra de redeploy:** qualquer alteração posterior de variables exigirá novo
  deployment; nesta execução, variables já estavam presentes no deployment
  inicial.
- **Documentação oficial consultada em 2026-09-23:**
  [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
  confirma escopos Production/Preview/Development e que alterações só chegam a
  novos deployments; [Vercel Environments](https://vercel.com/docs/deployments/environments)
  confirma deployment Production após push em `main`, Preview para branches não
  produtivas e redeploy após alteração de variables; [Firebase Web setup](https://firebase.google.com/docs/web/setup)
  confirma que os valores devem vir da configuração da aplicação Web registrada.

## Arquivos alterados

- `docs/tasks/004-production-deployment/004-03-configurar-environment-variables.md`
- `docs/tasks/004-production-deployment/004-00-overview.md`

## Decisões e desvios

- Nenhum código, dependência, lockfile, `.env.local`, variável remota ou serviço
  externo foi alterado pelo agente.
- A confirmação humana comprova os sete nomes em Production/Preview,
  deployment inicial funcional com variables presentes e login/redirecionamento
  no navegador; task pode ser marcada como concluída sem registrar valores.
- Regra residual preservada: qualquer alteração futura de variables exigirá novo
  deployment; configuração não retroage deployments anteriores.
- Preview permanece documentado como útil para landing/metadata/assets;
  autenticação em hostname efêmero não foi assumida nem autorizada.

## Comandos executados e resultados

- `git status --short --branch` — `main...origin/main`, sem alterações antes da
  atualização documental.
- `npm run lint` — passou.
- `npm exec next typegen` — passou; tipos gerados.
- `npx tsc --noEmit` — passou.
- `npm run build` — passou; Next `16.3.5` gerou `/`, `/login`, `/dashboard` e
  `ƒ Proxy (Middleware)`. O comando detectou `.env.local`; o agente não
  inspecionou, exibiu ou registrou seu conteúdo.
- `git diff --check` — passou.
- Inspeção pós-gates — nenhum arquivo de código, dependência, lockfile ou env
  versionado alterado.

## Riscos residuais

- ID/horário do deployment não foram registrados, por não terem sido informados;
  evidência de aceite é confirmação humana funcional e configuração presente no
  deployment inicial.
- Development não possui variables Vercel registradas nesta evidência; ambiente
  local depende de `.env.local` ignorado.
- OAuth em hostname Preview dinâmico continua não assumido; isso pertence à
  estratégia de preview e às tasks posteriores.
