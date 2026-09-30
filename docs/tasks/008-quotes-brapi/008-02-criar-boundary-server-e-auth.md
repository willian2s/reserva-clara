# 008-02 — Criar boundary server e autenticação

- **Ticker:** `008`
- **Número:** `02`
- **Status:** `pending`

## Objetivo e resultado esperado

Criar boundary Node autenticado para `POST /api/quotes`, verificando Firebase ID
token e lendo Assets somente no namespace do UID verificado. Resultado: API não
aceita UID/símbolo arbitrário, não expõe credenciais e possui host policy pronta
para receber QuoteService.

## Requisitos cobertos

- Spec 008, critérios 1–6, 13, 18–19 e 24–26.
- Segurança da 005/007: AuthGate é UX; ownership precisa ser verificado no
  boundary confiável.

## Escopo incluído

- Adicionar Firebase Admin server-only e inicialização singleton com credenciais
  `FIREBASE_ADMIN_*`.
- Verificar `Authorization: Bearer` e converter falhas em `401` sanitizado.
- Criar reader server-side de Assets por UID e IDs validados, sem importar
  repositories Web ou `src/lib/firebase/client.ts`.
- Criar `src/app/api/quotes/route.ts` com runtime Node, validação de body
  `{assetIds}`, limite de 20 e delegação preparada para QuoteService.
- Atualizar `src/proxy.ts` para incluir `/api/quotes` e bloquear host público;
  manter auth obrigatória nos hosts permitidos.
- Adicionar testes de parser/auth/ownership com verifier, reader e service fake.

## Escopo excluído

- Chamada real à BRAPI, mapping final em adapter, cache e UI.
- Sessão SSR, alteração dos repositories client-only ou migração de AuthGate.
- Nova coleção Firestore, Rules, índice ou escrita de dados.

## Dependências

- `008-01` concluída.
- Firebase project e credenciais Admin disponíveis apenas em ambiente autorizado
  para smoke; testes automatizados usam fakes/Emulator.

## Arquivos e símbolos prováveis

- `package.json`, `package-lock.json`: `firebase-admin`.
- `.env.example`: `FIREBASE_ADMIN_PROJECT_ID`,
  `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`.
- `src/server/firebase-admin.ts`: `verifyIdToken`, singleton app/auth/db.
- `src/server/data/asset-reader.ts`: `listOwnedAssets` ou equivalente.
- `src/app/api/quotes/route.ts`: `POST`, parsing de body e status HTTP.
- `src/proxy.ts`: matcher e host policy.
- `tests/quotes-route.test.mjs` ou harness equivalente com fakes.

## Passos de implementação

1. Instalar/configurar Admin SDK sem importar módulo server em client code.
2. Validar env no primeiro uso e falhar como `NOT_CONFIGURED`, sem expor valor.
3. Verificar bearer token e derivar UID; nunca aceitar `uid` do JSON.
4. Validar lista de IDs, deduplicar mantendo ordem, rejeitar body desconhecido e
   lote acima do limite.
5. Ler `users/{verifiedUid}/assets/{assetId}` com Admin, converter Timestamp
   Admin para o parser de domínio e retornar somente Assets encontrados.
6. Mapear ausência/cross-user para resultado sanitizado, sem consultar BRAPI.
7. Conectar route ao contrato de serviço por uma composição simples, sem
   GenericRepository ou service locator.
8. Atualizar matcher e provar que host público não funciona como proxy.

## Testes e comandos de validação

- `401` sem/contra token; `400` body inválido; `BATCH_LIMIT` acima de 20.
- UID do body ignorado; Asset de outro owner não é retornado nem enviado ao
  provider fake.
- Imports de `firebase-admin`/secrets não aparecem em client components.
- Executar:

```bash
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
```

## Definição de pronto

- Route handler Node autenticado e tipado existe.
- Reader só acessa Assets do UID verificado e não usa Web SDK.
- Host público é bloqueado; app/local/preview continuam sujeitos a token.
- Testes cobrem auth, validação, ownership e ausência de chamada downstream.
- Nenhuma Rule ou dado Firestore foi alterado.

## Riscos e cuidados

- Admin SDK bypassa Rules; compensar com path derivado do token, IDs validados e
  leitura mínima.
- Não aceitar URL, provider, símbolo ou UID enviado pelo cliente.
- Não usar credencial JSON, private key ou ID token em logs, erros, fixtures ou
  response.
- Não confundir proteção deste endpoint com autorização geral de `/assets` ou
  `/portfolios`.
