# 005-03 — Integrar Firestore Web

- **Ticker:** `005`
- **Número:** `03`
- **Status:** `pending`

## Objetivo

Adicionar Firestore Web ao app Firebase já inicializado, sem duplicar
`initializeApp`, sem nova env e sem alterar Auth/login/rotas.

## Resultado esperado

Uma instância Firestore exportada a partir do mesmo `firebaseApp`, disponível
somente à camada de dados client-side.

## Requisitos cobertos

- Firebase inicializado uma vez;
- compatibilidade com Auth browser-only;
- ausência de Firebase Admin, secrets e env inventada;
- preservação de Next.js 16/App Router e DashboardGate como UX.

## Escopo incluído

- importar `getFirestore` do SDK Web;
- exportar `db`/nome equivalente de `src/lib/firebase/client.ts`;
- confirmar comportamento quando `getApps()` já contém app;
- revisar boundary de imports para não puxar Firestore a Server Components;
- documentar setup de emulator separado do runtime produtivo.

## Escopo excluído

- repository, Rules, Console, banco, deploy ou UI;
- Firebase Admin, sessão server-side ou cookies;
- `NEXT_PUBLIC_FIREBASE_USE_EMULATOR` e qualquer env nova;
- alteração de Google Sign-In e DashboardGate.

## Dependências

- 005-02 para tipos, embora Firestore possa ser inicializado antes do repository;
- `src/lib/firebase/client.ts` atual;
- documentação local Next deve ser rechecada antes de editar `src/`.

## Arquivos e símbolos prováveis

- `src/lib/firebase/client.ts`: `firebaseConfig`, `firebaseApp`, `auth`;
- `src/data/firestore/*`: somente imports no limite de dados, se necessário;
- `.env.example`: inspeção; não deve mudar.

## Passos de implementação futura

1. Reabrir guia local Next/Firebase disponível no ambiente de execução.
2. Preservar `getApps()`/`initializeApp` atual.
3. Criar Firestore com `getFirestore(firebaseApp)` após app singleton.
4. Exportar instância com nome claro e impedir inicializador paralelo.
5. Procurar imports Firestore em landing, layouts e Server Components.
6. Rodar gates antes de qualquer operação real.

## Testes e comandos de validação

```bash
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
```

Inspecionar bundle/imports e confirmar que `/` responde sem precisar de Firestore
ou dados.

## Definição de pronto

- Auth continua funcional e singleton;
- Firestore Web compila e não inicializa segundo app;
- nenhuma nova env/dependência/credencial foi adicionada sem aprovação;
- nenhum Server Component importa módulo client-only de persistência;
- gates técnicos passam.

## Riscos e cuidados

- Não chamar `initializeApp` em `data/`.
- Não importar `db` na landing ou no root layout.
- Não conectar emulator automaticamente em produção.
- Se Firebase config estiver incompleta, registrar bloqueio sem alterar env.
