# 004-08 — Validar previews e segurança

- **Ticker:** `004`
- **Número:** `08`
- **Status:** `completed`

## Objetivo e resultado esperado

Provar que previews Vercel continuam úteis, same-origin e não indexáveis, e
fechar verificações mínimas de segurança sem ampliar o escopo para hardening ou
infraestrutura nova.

## Requisitos cobertos

- Preview de branch/PR e hostname `.vercel.app`.
- `noindex` e ausência de redirect para produção.
- Estratégia Firebase sem wildcard.
- Secrets versionados, `.env.local`, env scopes e BRAPI.
- Dashboard não sensível e proxy não tratado como autorização.

## Escopo incluído

- Abrir preview real quando disponível.
- Validar `/`, `/login`, `/dashboard`, assets, metadata, robots e CTA same-origin.
- Confirmar `X-Robots-Tag` centralizado e noindex de app/preview.
- Confirmar se auth preview foi deliberadamente não validado ou testado em
  hostname exato autorizado.
- Inspecionar git/status/arquivos ignorados e configuração Vercel sem ler
  valores.
- Conferir logs compartilháveis sem token, UID ou dados.

## Escopo excluído

- Autorizar wildcard `*.vercel.app`.
- Criar Firebase não produtivo, staging customizado, WAF, CSP, rate limiting,
  App Check, analytics ou observabilidade externa.
- Alterar `src/proxy.ts` só para tornar preview autenticado.
- Publicar dados privados no dashboard.

## Dependências

- 004-02 preview/deploy Git disponível.
- 004-03 strategy de variables registrada.
- 004-06 topologia de produção e 004-07 auth produtivo sem regressão.
- Acesso ao preview e aos painéis sem necessidade de compartilhar credenciais.

## Arquivos e símbolos prováveis

- `src/proxy.ts`: classe preview e `X-Robots-Tag`.
- `src/app/(marketing)/layout.tsx`, `(app)/layout.tsx`: metadata.
- `.gitignore`, `.env.example`, `package.json`, `src/lib/firebase/client.ts`.
- Vercel Preview/Deployments/Environment Variables/Logs.

## Passos de implementação

1. Obter URL de preview de branch/PR sem copiar token de acesso.
2. Testar landing, login e dashboard same-origin, sem redirect para produção.
3. Confirmar `noindex` por head e header, assets e CTA relativo.
4. Se OAuth preview não tiver hostname exato autorizado, registrar como
   deliberadamente não validado e não tentar ampliar allowlist.
5. Se houver preview estável autorizado, testar apenas esse hostname e registrar
   sua justificativa, sem aceitar o restante dos `.vercel.app`.
6. Inspecionar `git status`, `.gitignore`, arquivos env e histórico para ausência
   de segredo, token, BRAPI ou credencial.
7. Inspecionar dashboard e proxy para confirmar ausência de autorização falsa.

## Testes e comandos de validação

```bash
git status --short
git diff --check
```

Também usar GET/HEAD/browser no preview e inspeção de configuração Vercel sem
exportar env. Confirmar assets, `robots`, canonical pública apenas onde o
contrato da fase 003 prevê e ausência de loops.

## Definição de pronto

- Preview de branch/PR responde same-origin e permanece noindex.
- Landing e app não dependem de DNS produtivo para revisão.
- Política de auth preview está explícita, segura e testada somente quando
  autorizada por hostname exato.
- Nenhum segredo, token, `.env.local` ou BRAPI versionado/exposto.
- Dashboard segue shell não sensível e proxy segue routing, não autorização.

## Riscos e cuidados

- Configurar env Preview pode fazer login parecer disponível e falhar por
  domínio; separar claramente renderização de OAuth.
- URL `.vercel.app` pode ser pública; noindex não é controle de acesso.
- Canonical fixa da landing em preview não equivale a indexação permitida; header
  e robots devem ser conferidos.
- Não compartilhar screenshots com email/UID da conta de teste.

## Evidências da execução

- **Data:** 2026-09-23.
- **Escopo confirmado:** não existe branch `staging` nem deployment Preview
  separado neste checkout. Modelo efetivo permanece Vercel Preview de branch/PR;
  não foi criada branch ou PR somente para fabricar evidência.
- **URL fornecida para Preview:**
  `https://reserva-clara-qpsulpzs2-willian-silvas-projects-de9e4638.vercel.app`.
  A URL respondeu, mas Deployment Protection exigiu Vercel SSO antes de entregar
  o HTML da aplicação.
- **Checkpoint humano inicial:** responsável acessou a URL com autorização
  Vercel. `/` e `/login` abriram; `/dashboard` e login ficaram bloqueados pela
  configuração Firebase do Preview. Nenhum valor de environment, token, UID ou
  identidade foi solicitado ou registrado.
- **Erro sanitizado:** tentativa de login no Preview exibiu “Não foi possível
  entrar agora. Verifique sua conexão e tente novamente.” Responsável associou
  o erro à ausência do hostname Preview em Firebase Authorized Domains. O código
  bruto não foi registrado; essa associação não autoriza wildcard.
- **Decisão humana posterior:** autorizar somente o hostname exato deste
  deployment para repetir o teste OAuth; não adicionar `*.vercel.app` nem outros
  hostnames.
- **Resultado humano final:** hostname exato foi autorizado e login Google
  concluiu com sucesso no Preview; `/dashboard` abriu e exibiu shell esperado.
  Nenhum email, UID, token, cookie ou valor de configuração foi registrado.
- **Vercel:** `https://reserva-clara.vercel.app/` respondeu `200` em `/`,
  `/login` e `/dashboard`, com `server: Vercel` e `X-Robots-Tag: noindex,
  nofollow`. Esse hostname é o deployment Production/main registrado em
  004-02, portanto não foi contado como Preview de branch/PR.
- **Metadata:** `/` retornou title da landing e canonical pública prevista;
  `/login` e `/dashboard` retornaram title de app e `robots: noindex,
  nofollow`, sem canonical pública.
- **Same-origin/assets:** landing manteve CTA relativo `/login`, sem CTA
  absoluto; logos transformados por `/_next/image` e chunks `/_next/static/*`
  responderam `200`. `/login` entregou `Acesse sua conta`; `/dashboard`
  entregou somente o estado inicial de verificação de sessão.
- **Firebase/preview auth:** 004-03 registra os sete nomes de configuração em
  Production/Preview, sem valores; 004-05/004-07 confirmam somente o domínio
  produtivo `app.reservaclara.com.br`. OAuth em hostname dinâmico `.vercel.app`
  foi validado somente no hostname exato autorizado, sem wildcard.
- **Segurança local:** `.env.local` é ignorado por `.gitignore`; somente
  `.env.example` é versionado. `git grep` não encontrou BRAPI, Firebase Admin,
  credenciais ou padrões de chave em código versionado; dashboard segue shell
  não sensível e `src/proxy.ts` contém routing/robots, não autorização.
- **Git remoto:** `main` é única branch remota observada; nenhuma referência
  `refs/pull/*/head` foi retornada. Isso não invalida a URL de deployment
  fornecida pelo usuário, mas impede confirmar sua origem Branch/PR pelo clone.
- **Documentação oficial consultada:** [Vercel Git deployments](https://vercel.com/docs/git),
  consultada em 2026-09-23, confirma deployment automático em push de branch e
  deployment único por PR para revisão.

## Arquivos alterados

- `docs/tasks/004-production-deployment/004-08-validar-previews-e-seguranca.md`
- `docs/tasks/004-production-deployment/004-00-overview.md`

Nenhum arquivo de código, dependência, lockfile, `.env.local`, configuração
Vercel ou environment variable foi alterado pelo agente. Firebase Authorized
Domains foi alterado pelo responsável, conforme checkpoint humano abaixo.

## Decisões e desvios

- Não foi criada staging branch, PR ou allowlist Firebase para obter URL de
  preview. Isso preserva contrato Vercel branch/PR e política sem wildcard.
- A URL de branch/PR fornecida foi testada sem tentar contornar Deployment
  Protection ou solicitar credenciais.
- Não foi adicionada autorização Firebase para hostname dinâmico sem decisão
  explícita. Após checkpoint, foi autorizado somente hostname exato, com revisão
  e remoção futura recomendadas; nunca `*.vercel.app`.
- Após checkpoint humano, ficou decidido autorizar somente
  `reserva-clara-qpsulpzs2-willian-silvas-projects-de9e4638.vercel.app` em
  Firebase Authorized Domains. A autorização foi executada pelo responsável e
  precisa ser revalidada/removida quando deployment expirar.
- O deployment `reserva-clara.vercel.app` foi validado somente como hostname
  Vercel Production/main; sua resposta noindex serve como evidência do contrato
  implementado, não substitui smoke de Preview real.
- Task concluída: acesso autorizado removeu bloqueio SSO; `/`, `/login` e
  `/dashboard` foram acessados, hostname exato foi autorizado no Firebase e
  login Google concluiu. Smoke adicional não foi necessário após confirmação
  humana final. Não há correção de código indicada.

## Comandos executados e resultados

- `git status --short --branch` — `main...origin/main`; sem alterações antes
  desta atualização.
- `git diff --check` — passou antes da atualização documental.
- `git check-ignore -v .env.local` — `.env.local` ignorado por `.env*`;
  `git ls-files` confirmou somente `.env.example` entre arquivos env.
- `git branch --all` e `git ls-remote --heads origin` — somente `main` observada;
  `git ls-remote --refs origin 'refs/pull/*/head'` não retornou referência.
- `curl -I --max-redirs 0 https://reserva-clara.vercel.app/{,login,dashboard}` —
  `200` nos três paths, sem `Location`, `X-Robots-Tag: noindex, nofollow`.
- `curl -I --max-redirs 0 https://reserva-clara-qpsulpzs2-willian-silvas-projects-de9e4638.vercel.app/{,login,dashboard}` —
  `302` nos três paths para `vercel.com/sso-api`; resposta inclui
  `X-Robots-Tag: noindex`, `X-Frame-Options: DENY` e cookie SSO HttpOnly. O
  nonce e o cookie não foram registrados.
- GET da URL protegida — redirecionou para a página SSO; `200` final não foi
  contado como resposta da aplicação. HTML, metadata, CTA e assets do app não
  ficaram observáveis sem sessão autorizada.
- Browser com sessão Vercel autorizada — responsável confirmou `/` e `/login`
  acessíveis no Preview; após autorização do hostname exato, login concluiu e
  `/dashboard` abriu com shell esperado. Nenhum valor foi copiado.
- GET/parser HTML no hostname Vercel Production — title, canonical/robots, CTA relativo,
  conteúdo de login/dashboard e assets confirmados conforme evidências acima.
- `git grep` sanitizado para BRAPI, chaves, Firebase Admin e Firestore — sem
  ocorrência em código versionado; ocorrências restantes estão em documentação
  de escopo/decisões, sem segredo.
- `npm run lint` — passou.
- `npm exec next typegen` — passou.
- `npx tsc --noEmit` — passou.
- `npm run build` — passou; Next.js 16.3.5 compilou `/`, `/login`,
  `/dashboard` e Proxy. O build detectou `.env.local`; seu conteúdo não foi
  lido, exibido ou registrado.

## Resultados e evidências

- Contrato local e hostname Vercel disponível: aprovado.
- Segurança mínima de repositório, env ignorado, ausência de BRAPI/Admin e
  dashboard não sensível: aprovada.
- Preview de branch/PR real: `/` e `/login` acessíveis após SSO; `/dashboard`
  acessível após autorização do hostname exato; login Google concluído. OAuth
  Preview validado somente para esse hostname, sem wildcard.

## Riscos residuais

- Deployment de branch/PR está protegido por SSO. Smoke humano passou em `/`,
  `/login` e `/dashboard`; OAuth foi autorizado somente no hostname exato.
  Revisar/remover esse domínio quando deployment efêmero deixar de ser usado.
- Hostname autorizado é deployment específico, não wildcard; revisar validade
  após expiração ou novo deployment. Evidência direta de headers/metadata do
  Preview ficou dependente do checkpoint humano autenticado.
- `reserva-clara.vercel.app` permanece sujeito à proteção/configuração Vercel
  observada em 004-02; não é controle de acesso e não foi usado como evidência
  de OAuth.
- Logs de painel Vercel não foram reexportados nesta execução; evidências
  anteriores permanecem sanitizadas e sem token, UID ou dado de conta.
