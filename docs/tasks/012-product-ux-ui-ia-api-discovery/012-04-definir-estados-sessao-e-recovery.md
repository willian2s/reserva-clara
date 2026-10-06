# 012-04 — Definir estados, sessão e recovery

- **Ticker:** `012`
- **Número:** `04`
- **Status:** `pending`

## Objetivo e resultado esperado

Definir taxonomia transversal de leitura/comando e o fluxo de login restaurado,
logout, sessão expirada, refresh único, usuário desabilitado, offline e retorno à
origem.

## Requisitos cobertos

UX-05, UX-09, OBS-01 e critérios de recovery/autorização da 011.

## Escopo incluído e excluído

Incluído: `loading`, `refreshing`, `ready`, `empty`, `partial`, `stale`,
`unavailable`, `offline`, `conflict`, `unauthorized` e resultado desconhecido.
Excluído: validação real de token, CORS, rate limit e backend da 014.

## Dependências

`012-02`, `012-03`, `AuthGate`, `GoogleSignIn` e ADR 013 da 011.

## Arquivos e símbolos prováveis

`docs/architecture/012/state-and-session-recovery.md`,
`src/components/auth/auth-gate.tsx`, `src/components/auth/google-sign-in.tsx`.

## Passos de implementação

1. Modelar transições de leitura e comando com último dado válido.
2. Simular 401 em read, write idempotente e write não idempotente.
3. Definir um refresh, signOut em falha e retorno sem loop.
4. Mapear mensagens, foco e ações de recovery por estado.

## Testes e comandos de validação

Tabletop de sessão e recovery com matriz de retry; verificar que unavailable não
vira zero e write não idempotente não é repetido cegamente.

## Definição de pronto

Taxonomia e fluxos aprovados, com política de retry, foco, copy e dependências
para 014/013 registradas.

## Riscos e cuidados

Não colocar token em localStorage, não tratar AuthGate como autorização e não
prometer escrita offline sem reconciliação.
