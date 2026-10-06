# ADR 013 — ID Token, autorização, revogação e CORS

- **Status:** `proposed`
- **Ticker relacionado:** `011`
- **Decisão:** 7 de 15 da spec 011

## Contexto

O Firebase Web continuará cuidando do login, mas o novo backend precisa falhar
fechado e não pode confundir guard de UX, CORS ou host routing com autorização.

## Decisão proposta

- A API aceita somente Firebase ID Token Bearer do projeto/ambiente correto.
- Valida assinatura, `RS256`, issuer, audience, `exp`, `iat`, `sub` e clock skew
  inicial de 60 segundos; Google access token não é aceito.
- `CurrentOwner` vem somente do `sub` verificado; recursos de outro owner e
  inexistentes usam `404` indistinguível quando a operação é owner-scoped.
- Reads comuns usam validade criptográfica; writes financeiros e ações sensíveis
  exigem política de revogação/disabled e falham fechado se a checagem necessária
  estiver indisponível.
- CORS é allowlist exata por ambiente, sem wildcard e sem credenciais de cookie.
- A 014 pode iniciar com Firebase Admin e só migrar hot path para JwtBearer após
  evidência de rotação, latência e paridade; não há fallback inseguro.

## Evidência e alternativas

O [fluxo normativo](../architecture/011/identity-security.md#3-fluxos-normativos),
a matriz de claims e o threat model fornecem a evidência de discovery. Supabase
Auth, UID no body, wildcard CORS e tratar AuthGate como segurança foram rejeitados.

## Consequências e revisão

Há custo operacional de revogação e configuração por ambiente. A decisão será
revisada na 014 com testes negativos de token, A/B cross-user, refresh, CORS,
headers e logs sanitizados.

## Referências

- [ADR 001 — autenticação no cliente](001-autenticacao-google-popup.md)
- [Identidade e segurança 011](../architecture/011/identity-security.md)
