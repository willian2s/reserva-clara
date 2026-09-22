# 003-04 — Estabelecer metadata e SEO básico

- **Ticker:** `003`
- **Número:** `04`
- **Status:** `pending`

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
