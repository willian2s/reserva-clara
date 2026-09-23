# 004-08 — Validar previews e segurança

- **Ticker:** `004`
- **Número:** `08`
- **Status:** `pending`

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
