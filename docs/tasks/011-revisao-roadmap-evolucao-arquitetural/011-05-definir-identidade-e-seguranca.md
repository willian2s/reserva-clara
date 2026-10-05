# 011-05 — Definir identidade, autenticação e segurança

- **Ticker:** `011`
- **Número:** `05`
- **Status:** `pending`

## Objetivo e resultado esperado

Definir o fluxo Firebase Authentication → ID Token → ASP.NET Core e o modelo de
autorização/tenancy, incluindo threat model, erros, CORS, secrets, logs e defesa
em profundidade no PostgreSQL.

## Requisitos cobertos

- Firebase permanece no frontend para experiência de autenticação.
- Backend valida token e estabelece identidade/autorização.
- Ownership nunca é aceito do cliente.
- Segurança, privacidade, rate limit e cross-user A/B.
- Configuração por ambiente e ausência de Supabase Auth.

## Escopo

### Incluído

- Assinatura, algoritmo, issuer, audience, exp/iat/sub e clock skew.
- JwtBearer/Firebase Admin, refresh e política de revogação.
- `CurrentOwner`, resource authorization e 401/403/404.
- CORS, CSP/security headers, rate limits e proxy trust.
- Roles/schema/RLS candidata, secrets e logging sanitizado.
- Threat model dos fluxos atuais e alvo.

### Excluído

- Implementar autenticação/API.
- Migrar para Supabase Auth, cookies de sessão ou outro IdP.
- Definir account deletion futura além dos impactos de segurança.

## Dependências

- 011-02, 011-03 e insumos de tenancy da 011-04.

## Arquivos e símbolos prováveis

- Leitura: `src/lib/firebase/client.ts`, auth components,
  `src/server/firebase-admin.ts`, Quote route/reader, Rules, `.env.example`,
  proxy e testes de route/rules.
- Saída provável: `docs/architecture/011/identity-security.md` e threat model.

## Passos de implementação

1. Desenhar fluxos de login, refresh, request, 401 e logout.
2. Definir validações obrigatórias do Firebase ID Token.
3. Comparar JwtBearer e Firebase Admin por operação/revogação.
4. Definir CurrentOwner derivado somente de `sub` verificado.
5. Definir autorização owner-scoped e resposta contra enumeração.
6. Definir CORS por ambiente, sem wildcard/credentials desnecessários.
7. Definir rate limits por IP/owner/endpoint e proteção BRAPI.
8. Avaliar RLS com conexão/pooling real como defesa em profundidade.
9. Definir secret management, redaction e telemetria permitida.
10. Revisar risco do arquivo de credencial local sem ler/divulgar conteúdo.

## Testes e comandos de validação

- Matriz de token: válido, expirado, outro projeto/audience/issuer, alg errado,
  malformado, usuário disabled/revogado conforme política.
- Casos cross-user A/B em API e banco.
- Testes planejados de CORS, rate limit, logs e pooling/RLS.
- Threat-model walkthrough e abuse cases.
- `git diff --check`.

## Definição de pronto

- Fluxo e trust boundaries estão explícitos.
- UID/email do request nunca definem owner.
- Revogação, refresh e erros têm política clara.
- CORS/secrets/logging/RLS têm requisitos testáveis.
- Nenhum token, segredo ou identificador real entrou na documentação.

## Riscos e cuidados

- Não confundir Google access token com Firebase ID Token.
- Bearer reduz CSRF por cookies, mas aumenta importância de XSS/CSP.
- Logout não é revogação instantânea de todos os tokens.
- CORS não substitui autenticação/autorização.
