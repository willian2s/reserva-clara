# 003-03 — Integrar CTA e navegação

- **Ticker:** `003`
- **Número:** `03`
- **Status:** `completed`

## Objetivo e resultado esperado

Fechar o contrato de navegação entre landing e aplicação com links same-origin,
permitindo que o mesmo CTA funcione em localhost, preview e produção sem
hardcode de domínio ou lógica de hostname nos componentes.

## Requisitos cobertos

- CTA principal para `/login`.
- Entradas equivalentes no header e nos CTAs contextuais, sem redundância no
  footer.
- Ponte pública→app centralizada no proxy.
- Preservação dos redirects relativos da autenticação.
- Navegação acessível por teclado e sem dependência de JavaScript.

## Escopo incluído

- Revisar os links da landing criada em 003-02.
- Definir nome acessível e texto consistente, preferencialmente “Acessar a
  aplicação” ou “Entrar na aplicação”.
- Confirmar `href="/login"` no CTA e na navegação equivalente.
- Confirmar que o proxy faz a ponte apenas quando o host exige.
- Verificar que `GoogleSignIn` continua indo para `/dashboard` e
  `DashboardGate` continua voltando para `/login` na origem atual.

## Escopo excluído

- `returnTo`, query de redirecionamento, deep-linking ou fallback para popup.
- URLs absolutas de produção em JSX/TSX.
- Alteração da arquitetura Firebase, sessão, autorização ou logout.
- Client-side hostname detection, router custom ou analytics de clique.

## Dependências

- 003-01 com matriz de host implementada.
- 003-02 com header, hero e footer existentes.
- Contratos da fase 001 em `GoogleSignIn` e `DashboardGate`.

## Arquivos e símbolos prováveis

- `src/app/(marketing)/page.tsx` e eventuais componentes marketing.
- `src/proxy.ts`: destinos e status da ponte.
- `src/components/auth/google-sign-in.tsx:83`:
  `router.replace("/dashboard")`.
- `src/components/auth/dashboard-gate.tsx:44`:
  `router.replace("/login")`.

## Passos de implementação

1. Garantir que o CTA primário, entrada do header e CTA final usam o mesmo
   caminho relativo `/login` e texto acessível coerente.
2. Garantir que link de marca permanece em `/` e não aponta para domínio
   produtivo fixo.
3. Testar navegação direta no host público: `/login` deve retornar 307 para o
   app; no app, o mesmo caminho deve renderizar login.
4. Testar localhost/preview e confirmar que o CTA não sai para produção.
5. Inspecionar a URL após clique e rejeitar qualquer implementação que derive
   destino de query string ou aceite open redirect.
6. Não alterar `GoogleSignIn`/`DashboardGate` salvo regressão concreta de path;
   se houver, registrar antes de corrigir na task responsável.

## Testes e comandos de validação

- Navegação por teclado e ativação com Enter/Space conforme elemento semântico.
- `curl -I`/browser para público e app verificando `Location` e status.
- Browser em `localhost` e preview simulado para confirmar same-origin.
- Busca de `reservaclara.com.br`, `app.reservaclara.com.br` e `returnTo` em
  componentes da landing; ocorrências permitidas ficam somente na política
  central/documentação.
- `npm run lint` e `npm exec next typegen` após mudanças de rota/links.

## Definição de pronto

- Todo CTA de entrada aponta para `/login` relativo.
- Produção futura chega ao app por uma única ponte centralizada.
- Localhost e preview não dependem de domínio produtivo.
- Login/dashboard conservam redirects relativos e comportamento da fase 001.
- Links têm nomes acessíveis, foco visível e não exigem JavaScript para seguir.

## Riscos e cuidados

- Link relativo em produção depende da regra de host; não remover o redirect do
  proxy para “simplificar” o componente.
- Não usar botão semântico para navegação quando um link é suficiente.
- Não tratar status 307 como autorização ou como prova de login.
- Não criar query de destino sem decisão explícita; ela está fora do escopo.

## Registro da implementação

### Status

`completed`

### Arquivos alterados

- `src/app/(marketing)/page.tsx`: ajuste dos CTAs e nomes acessíveis para
  “Entrar”; os destinos permanecem `/login` relativos e o footer mantém apenas
  marca e tagline.

### Decisões e desvios

- O header mantém o rótulo visual curto “Entrar” em viewport estreito para
  preservar o layout existente; seu `aria-label` também é “Entrar”.
- O footer não repete CTA de login, conforme ajuste editorial solicitado para
  reduzir redundância; header, hero e CTA final continuam entradas semânticas
  para `/login` com o rótulo “Entrar”.
- `src/proxy.ts` não precisou de alteração: já centraliza a ponte público→app,
  usa destinos fixos e preserva localhost/preview same-origin.
- `GoogleSignIn` e `DashboardGate` não foram alterados; os redirects relativos
  existentes continuam sendo `/dashboard` e `/login`.

### Comandos executados

```bash
git diff --check
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
```

Também foi executado smoke HTTP com `npm start -- --hostname 127.0.0.1
--port 3103` e `curl` usando headers `Host`, além de buscas estruturais por
domínios produtivos, `returnTo` e `href="/login"` na landing.

### Resultados e evidências

- `git diff --check`, lint, geração de tipos, typecheck e build passaram nessa
  ordem.
- Landing contém três links `href="/login"`: header, hero e CTA final; não
  contém CTA redundante no footer, domínio produtivo nem `returnTo`.
- Smoke observou público `/login` como `307` para
  `https://app.reservaclara.com.br/login`, app `/login` como `200`, localhost
  `/` como `200` com `X-Robots-Tag: noindex, nofollow`, preview `/login` como
  `200` same-origin com o mesmo header e host desconhecido como `404`.
- Query `returnTo` não foi transportada no redirect público→app.

### Riscos residuais

- Navegação por teclado e validação visual detalhada permanecem na task 003-05.
- DNS, TLS, configuração produtiva e OAuth em domínio real permanecem fora da
  fase 003.
