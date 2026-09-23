# 004-03 — Configurar environment variables

- **Ticker:** `004`
- **Número:** `03`
- **Status:** `pending`

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
