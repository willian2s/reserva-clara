# 007-06 — Implementar catálogo de Assets

- **Ticker:** `007`
- **Número:** `06`
- **Status:** `completed`

## Objetivo

Entregar `/assets` protegido, simples e acessível para listar e criar
identidades de Asset sem misturar cotação ou posição.

## Dependências

- 007-03 persistência Asset concluída.
- 007-05 Rules de Asset/registry verdes.
- Documentação local Next 16 lida antes de criar/alterar rotas.

## Escopo

- Incluir `/assets/:path*` no matcher/bridge quando necessário.
- Criar página/componentes Client seguindo loading/error/retry de Portfolio.
- Formulário com symbol, market, assetType e currency; mostrar normalização e
  resultado existente quando identidade já estiver cadastrada.
- Listar somente Assets reais do owner, com empty state e mensagens sanitizadas.
- Reaproveitar AuthGate, shell, Button/Card/Input/Label e acessibilidade atual.

## Fora de escopo

- Editar/deletar Asset, logo de empresa, provider, preço, posição ou busca global.

## Critérios de aceite

- Anônimo não vê dados nem formulário acionável.
- Submit inválido não toca Firestore; double submit não cria duplicata.
- Mesma identidade retorna Asset existente; erro de persistência oferece
  reconciliação sem retry cego.
- Mobile, teclado, foco e live regions são verificáveis.
- Server Components não importam SDK Firestore.

## Arquivos prováveis

- `src/app/(app)/(protected)/assets/page.tsx`
- `src/components/asset/*`
- `src/app/(app)/(protected)/layout.tsx`
- `src/proxy.ts`

## Validação

Manual local/preview com sessão sintética/autorizada, seguido de lint, typegen,
TypeScript, build e `git diff --check`.

## Registro de execução

### Arquivos alterados

- `src/app/(app)/(protected)/assets/page.tsx` — página Server Component que
  delega a UI ao catálogo Client.
- `src/components/asset/asset-catalog.tsx` — carregamento, retry, empty state,
  listagem owner-scoped e reconciliação do catálogo.
- `src/components/asset/asset-create-form.tsx` — formulário acessível, validação
  antes do Firestore, preview da identidade e proteção contra double submit.
- `src/app/(app)/(protected)/layout.tsx` — link de navegação para `/assets`.
- `src/proxy.ts` — matcher e redirecionamento do host público para `/assets`.

### Decisões e desvios

- A rota foi criada dentro do grupo protegido existente e reutiliza `AuthGate`;
  a autorização continua sendo responsabilidade das Rules e do repository.
- A identidade exibida é derivada por `parseAssetInput` e
  `createAssetIdentityKey`, sem duplicar regra de normalização na persistência.
- O formulário consulta a listagem atual antes do write para informar quando a
  identidade já existia. Em erro ambíguo, bloqueia novo submit e oferece apenas
  uma leitura explícita do catálogo para reconciliação, sem retry cego.
- O catálogo mantém somente os Assets devolvidos por `listAssets`; registry,
  cotação e posição não são exibidos.
- Não foram adicionados testes de UI porque o repositório não possui runner de
  componentes; os gates existentes e o build foram executados.

### Comandos, resultados e evidências

```bash
npm run test:domain
npm run test:rules
npm run lint
npm exec next typegen && npx tsc --noEmit
npm run build
git diff --check
```

- `test:domain`: 5 testes aprovados, 0 falhas.
- `test:rules`: 13 testes do Emulator aprovados, 0 falhas.
- `lint`: concluído sem erros ou warnings.
- `next typegen` e TypeScript strict: concluídos sem erros.
- `build`: concluído; a saída confirmou a rota dinâmica `/assets` e o Proxy.
- `git diff --check`: concluído sem erros.
- Revisão independente: aprovada sem blockers, high ou medium; confirmou a
  reconciliação discriminada, retry de leitura e estados ARIA por campo.
- Validação manual local/autorizada: usuário confirmou sucesso em todos os
  testes do fluxo do catálogo.

### Riscos residuais

- Não existe teste automatizado de UI nem sessão sintética para validar
  visualmente teclado, viewport e fluxo autenticado em browser.
- `AuthGate` é client-only e não é boundary server-side; ownership e isolamento
  continuam dependendo das Rules/repositories existentes.
- `listAssets` valida todo o catálogo e pode exigir várias leituras à medida que
  o número de Assets crescer; não foi criado aggregate ou índice sem query real.

### Investigação da falha reportada

- A mensagem é emitida por `AssetCatalog` quando `listAssets()` rejeita a
  leitura; o componente sanitiza a exceção e não exibe o código Firebase.
- `listAssets()` faz duas queries owner-scoped em paralelo: `users/{uid}/assets`
  e `users/{uid}/assetIdentities`. A segunda é necessária porque o repository
  valida o vínculo bidirecional Asset↔registry antes de devolver o catálogo.
- A configuração local encontrada aponta para o mesmo projeto indicado em
  `.firebaserc`, e `src/lib/firebase/client.ts` não conecta o SDK ao Emulator.
  Portanto, `npm run dev` usa o Firestore configurado nesse projeto, não as
  Rules locais.
- O histórico confirma que o último deploy documentado de Rules ocorreu na
  subtarefa 005-09. A subtarefa 007-05 abriu Assets/registry localmente, mas
  registra explicitamente `Deploy produtivo` fora do escopo e nenhum deploy
  produtivo executado. O commit-base desse deploy (`38a5082`) ainda contém
  `allow read, write: if false` no match de Assets. Assim, no ambiente
  configurado, a causa reproduzível é `permission-denied` enquanto as Rules de
  007 não forem publicadas; o catch do catálogo transforma esse erro na
  mensagem reportada.
- `README.md` continua o README padrão e não instrui a configurar o
  `.env.local`; `.env.example` contém somente nomes vazios. Isso não explica
  uma sessão autenticada que chega à tela, mas é uma causa alternativa para
  configuração Firebase ausente/incorreta e precisa ser descartada no console.
- Não alterei `client.ts`, Rules, env ou README: a correção operacional segura
  é publicar `firestore.rules` no projeto correto, com checkpoint/autorização
  humano(a), fora do escopo desta subtarefa. O teste local abaixo comprova que
  o contrato necessário pela UI está permitido pelas Rules versionadas.

### Próximo diagnóstico operacional

- O primeiro ambiente manual estava bloqueado por Rules 007 não publicadas; a
  validação foi concluída com sucesso após a regularização do ambiente.
- Se o erro persistir após publicar as Rules, é necessário o erro original do
  console (especialmente `permission-denied`, `failed-precondition` ou
  `auth/invalid-api-key`), além da URL/ambiente, para separar Rules não
  publicadas de configuração Firebase incorreta.
