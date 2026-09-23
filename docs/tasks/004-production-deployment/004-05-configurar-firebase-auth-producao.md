# 004-05 — Configurar Firebase Auth produção

- **Ticker:** `004`
- **Número:** `05`
- **Status:** `pending`

## Objetivo e resultado esperado

Preparar Firebase Authentication para Google popup na origem produtiva app,
mantendo a decisão 001 e a allowlist mínima de Authorized Domains.

## Requisitos cobertos

- Google provider habilitado.
- `app.reservaclara.com.br` em Authorized Domains.
- Avaliação técnica de público, `www`, localhost e previews.
- Popup OAuth, `authDomain` e erros de domínio não autorizado.
- Nenhum Firebase Admin, redirect flow ou sessão server-side.

## Escopo incluído

- Humano confirma projeto Firebase correto e provider Google ativo.
- Consultar documentação oficial atual sobre Web Google Sign-In, popup,
  Authorized Domains, `authDomain` e Google OAuth.
- Adicionar/verificar `app.reservaclara.com.br`.
- Conferir `localhost` para desenvolvimento.
- Testar se origem pública realmente executa Firebase; só adicionar público ou
  `www` se evidência/documentação exigir.
- Definir política de preview sem wildcard e registrar qualquer bloqueio.

## Escopo excluído

- Firebase Admin, Firestore, Security Rules, App Check, Storage ou backend.
- Google Cloud OAuth customizado sem exigência documentada.
- `signInWithRedirect`, fallback de popup, AuthProvider ou cookies.
- Inserir domínio Vercel dinâmico em massa.
- Registrar projeto ID, client ID, keys, tokens ou dados de conta de teste.

## Dependências

- 004-03 variables configuradas para o projeto correto.
- 004-04 app HTTPS validado.
- Usuário com acesso Firebase Console e provider Google.
- Conta Google de teste disponível para 004-07; não registrar identidade.

## Arquivos e símbolos prováveis

- `src/lib/firebase/client.ts`: `authDomain` e config Web.
- `src/components/auth/google-sign-in.tsx`: `GoogleAuthProvider`,
  `signInWithPopup`, erros e `router.replace`.
- Firebase Console Authentication → Sign-in method/Settings/Authorized Domains.
- Documentação oficial Firebase/Google consultada na data da execução.

## Passos de implementação

1. Humano confirma que Firebase Web app e Vercel variables pertencem ao mesmo
   projeto, sem colar valores no registro.
2. Confirmar Google como provider ativo e política de consentimento atual.
3. Adicionar/verificar `app.reservaclara.com.br` em Authorized Domains.
4. Preservar `localhost` se já existir; não adicionar público/`www` antes de
   observar necessidade no navegador.
5. Para previews, não cadastrar wildcard. Se houver hostname estável autorizado,
   registrar exatamente qual foi usado sem aceitar qualquer `.vercel.app`.
6. Confirmar se `authDomain` Firebase padrão é suficiente; só mudar por
   instrução oficial e alteração aprovada.
7. Abrir `/login` em app produtivo e observar erro sanitizado, sem ainda marcar
   fluxo nominal como aprovado se popup não for concluído.

## Testes e comandos de validação

- Console: provider Google ativo, domains mínimos e projeto correto.
- Browser: origem efetiva do popup é `app.reservaclara.com.br`.
- DevTools: ausência de `auth/unauthorized-domain` no cenário autorizado; se
  ocorrer, registrar diagnóstico sanitizado e bloquear aceite.
- Host público não deve inicializar Firebase para renderizar landing.
- Preview dinâmico: registrar explicitamente `OAuth não testado/bloqueado` se
  não houver autorização exata.

## Definição de pronto

- Google provider ativo no projeto correto.
- `app.reservaclara.com.br` autorizado e validado pelo menos até abertura do
  fluxo.
- Público/`www` só adicionados com justificativa observável.
- Nenhum wildcard de preview foi criado.
- `authDomain` não foi alterado por suposição.
- Cenários pendentes e intervenção necessária estão registrados para 004-07.

## Riscos e cuidados

- Authorized Domains é allowlist de origem, não autorização do dashboard.
- Preview com env correto pode continuar falhando por domínio não autorizado;
  isso é política deliberada, não motivo para wildcard.
- Popup bloqueado, WebView e browsers com restrição de storage continuam
  limitações da decisão 001; não redesenhar nesta task.
- Contas Firebase/Google de produção podem criar usuários reais; usar conta de
  teste autorizada e não apagar usuário como rollback.

## Checkpoint humano

Somente responsável com acesso ao Firebase Console pode habilitar/verificar
provider e Authorized Domains. A task não pode ser marcada `[x]` com base em
intenção ou screenshot sem teste da origem efetiva.
