# 003-04 — Estabelecer metadata e SEO básico

- **Ticker:** `003`
- **Número:** `04`
- **Status:** `completed`

## Objetivo e resultado esperado

Separar a metadata pública da metadata da aplicação, tornando a landing
indexável e compartilhável no domínio canônico, enquanto `/login`, `/dashboard`,
localhost e previews não são tratados como conteúdo público indexável.

## Requisitos cobertos

- Title e description da landing.
- Canonical pública absoluta.
- Open Graph mínimo e locale pt-BR.
- Favicon/app icon oficiais existentes.
- `noindex`/`nofollow` para app.
- `X-Robots-Tag` para local/preview.

## Escopo incluído

- Metadata Server Component em `(marketing)` para title, description,
  canonical, `openGraph`, `siteName`, `locale`, `type` e, se validado, imagem
  oficial existente.
- Metadata de `(app)` com `robots: noindex, nofollow`.
- Preservação/checagem dos icons já declarados no root layout.
- Header `X-Robots-Tag: noindex, nofollow` em local/preview no ponto central de
  host routing, sem duplicar checks em páginas.
- Inspeção de `<head>` gerado e URLs absolutas.

## Escopo excluído

- Sitemap, analytics, consentimento/cookies, JSON-LD amplo, verification tags e
  projeto completo de SEO.
- Canonical dinâmica por `headers()` ou domínio recebido.
- Criação/alteração de assets de branding.
- Metadata de dados privados, sessão server-side ou autorização.

## Dependências

- 003-01 com route groups e proxy.
- 003-02 com copy final da landing.
- `src/app/layout.tsx` e metadata da fase 002.
- Documentação Metadata API da linha Next.js 16.

## Arquivos e símbolos prováveis

- `src/app/(marketing)/layout.tsx` ou `page.tsx`: metadata pública.
- `src/app/(app)/layout.tsx`: robots da aplicação.
- `src/app/layout.tsx`: icons e metadata compartilhada.
- `src/proxy.ts`: header de robots em local/preview.
- `public/brand/favicon-*.png`, `app-icon-light.png` e, apenas se adequado,
  `logo-horizontal.png` para Open Graph.

## Passos de implementação

1. Definir title/description sem claims não comprovados, mantendo a tagline e o
   posicionamento de patrimônio/clareza.
2. Definir canonical e `openGraph.url` explicitamente para
   `https://reservaclara.com.br/`; não colocar essa canonical no root layout
   global, pois seria herdada pelo app.
3. Definir `openGraph.locale` como `pt_BR`, `type` como `website` e reutilizar
   somente asset oficial validado para imagem; não usar gráficos de docs/brand.
4. Se houver imagem Open Graph, usar URL absoluta ou declarar `metadataBase`
   somente no segmento `(marketing)`; nunca deixar URL relativa sem base.
5. Aplicar `noindex,nofollow` no layout da superfície `(app)` e confirmar que
   isso não é apresentado como segurança.
6. Adicionar `X-Robots-Tag` no proxy para localhost e `*.vercel.app`, mantendo
   o header ausente ou público no domínio canônico.
7. Confirmar que icons/favicons existentes continuam presentes e que não há
   `src/app/favicon.ico` concorrente.

## Testes e comandos de validação

- `npm run lint`
- `npm exec next typegen`
- `npx tsc --noEmit`
- `npm run build`
- Inspecionar HTML/head de landing, login e dashboard.
- Verificar canonical, `og:title`, `og:description`, `og:url`, locale, icons e
  robots.
- Verificar header `X-Robots-Tag` com Host localhost/preview simulado.

## Definição de pronto

- Landing tem metadata pública, canonical única e Open Graph básico coerente.
- App não herda canonical pública e expõe noindex/nofollow.
- Localhost/previews têm noindex no response header.
- Icons oficiais continuam carregando sem alteração de assets.
- Nenhuma URL de preview ou app é declarada como canonical pública.

## Riscos e cuidados

- Metadata aninhada é shallow-merged; definir objetos completos quando um
  segmento substituir `openGraph` ou `robots`.
- Não usar `metadataBase` público no root se isso fizer app herdar canonical.
- Não confundir `robots` com autorização.
- Uma imagem OG inadequada pode ser pior que não ter imagem; validar
  `logo-horizontal.png` antes de adotá-la e não inventar um card financeiro.
- Não marcar preview como indexável mesmo que o HTML da landing seja válido.

## Registro da implementação

### Status

`completed`

### Arquivos alterados

- `src/app/(marketing)/layout.tsx`: metadata estática da landing com title,
  description, canonical absoluta e Open Graph `website` em `pt_BR`.
- `src/app/(app)/layout.tsx`: metadata própria da aplicação com title,
  description e `robots: noindex, nofollow`.
- `docs/tasks/003-public-landing-app-separation/003-04-estabelecer-metadata-seo.md`:
  registro desta implementação.
- `docs/tasks/003-public-landing-app-separation/003-00-overview.md`: checklist e
  progresso atualizados.

### Decisões e desvios

- A metadata foi definida em layouts dos route groups para impedir que a
  canonical pública seja herdada pela aplicação. O root layout permaneceu com
  os favicons e Apple icon oficiais já declarados.
- `openGraph.images` não foi incluído: não há card OG dedicado validado, e não
  foi inventada arte nem usado asset inadequado como substituto.
- O `X-Robots-Tag` de localhost e preview já estava centralizado em
  `src/proxy.ts`, conforme 003-01; foi validado sem duplicar checks em páginas ou
  layouts.
- A primeira tentativa usou `LayoutProps<"/login">` no layout do grupo app, mas
  o typegen desta topologia aceita somente `"/"`; o layout passou a tipar
  `children` com `ReactNode`, sem alterar contrato de rota.

### Comandos executados

```bash
git diff --check
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
```

Também foi executado smoke HTTP com `npm start -- --hostname 127.0.0.1
--port 3117` e parser HTML com headers `Host` simulando produção, app,
localhost e preview.

### Resultados e evidências

- A primeira execução encadeada parou no typecheck por `LayoutProps<"/login">`;
  após a correção de tipo, lint, typegen, typecheck e build passaram na ordem
  exigida.
- O build reconheceu `/`, `/login`, `/dashboard` e `ƒ Proxy (Middleware)`.
- No host público, `/` retornou `200` com title, description, canonical
  `https://reservaclara.com.br/`, `og:url` igual à canonical, locale `pt_BR`,
  tipo `website`, site name e ícones oficiais.
- No host app, `/login` e `/dashboard` retornaram `200`, sem canonical ou OG
  público, com `<meta name="robots" content="noindex, nofollow">`.
- Localhost e `foo.vercel.app` retornaram `X-Robots-Tag: noindex, nofollow`;
  o host público não retornou esse header. Público `/login` retornou `307` para
  `https://app.reservaclara.com.br/login`.
- Não existe `src/app/favicon.ico`; os seis favicons PNG e o Apple icon do root
  continuaram presentes.
- Revisão independente da subtarefa aprovou implementação sem achados blocker,
  major ou minor.

### Riscos residuais

- A landing local/preview mantém canonical estática pública, mas recebe
  `X-Robots-Tag: noindex, nofollow`; canonical dinâmica por host está
  explicitamente fora do escopo.
- Não foi adotada imagem OG dedicada; compartilhamento usa metadata textual e
  os ícones oficiais permanecem disponíveis.
- DNS, TLS, deploy e validação OAuth em domínio produtivo continuam fora desta
  subtarefa.
