# 005-03 — Integrar Firestore Web

- **Ticker:** `005`
- **Número:** `03`
- **Status:** `completed`

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

## Execução e evidências

- **Data:** 2026-09-24.
- **Implementado:** `src/lib/firebase/client.ts` agora define boundary client com
  `"use client"`, importa `getFirestore` e exporta `db` criado a partir do
  mesmo `firebaseApp` usado por `auth`.
- **Singleton confirmado:** fluxo existente com `getApps()` e
  `initializeApp(firebaseConfig)` foi preservado; `getFirestore(firebaseApp)` não
  cria segundo Firebase App.
- **Boundary confirmado:** nenhum Server Component, layout ou landing importa
  `client.ts`/Firestore; módulo permanece alcançado somente pelos componentes
  client-side de Auth até a camada de dados das próximas subtarefas.
- **Emulator:** nenhuma conexão automática ou env de emulator foi adicionada;
  setup explícito permanece separado para a subtarefa 005-07.
- **Comandos executados:** `npm run lint`; `npm exec next typegen`; `npx tsc
  --noEmit`; `npm run build`; inspeção estrutural de imports Firestore; `git diff
  --check`.
- **Resultados:** todos os gates passaram; Next.js 16.3.5 compilou e gerou as
  rotas existentes (`/`, `/dashboard`, `/login` e `/_not-found`); nenhuma nova
  dependência, env, credencial, Rule, configuração de emulator ou acesso de
  dados foi criado.

## Arquivos alterados

- `src/lib/firebase/client.ts`
- `docs/tasks/005-domain-model-firestore-foundation/005-00-overview.md`
- `docs/tasks/005-domain-model-firestore-foundation/005-03-integrar-firestore-web.md`

## Decisões e desvios

- `db` foi escolhido como nome exportado, seguindo convenção Firestore Web e o
  contrato esperado pelas próximas subtarefas.
- `"use client"` explicita que inicialização Auth/Firestore pertence ao boundary
  browser-only existente; não houve alteração em login, Auth, DashboardGate ou
  rotas.
- Não houve desvio de escopo: SDK `firebase` existente foi reutilizado, sem
  dependência ou variável de ambiente nova.

## Riscos residuais e bloqueios

- Valores reais de configuração Firebase não são exercitados pelos gates; conexão
  com banco, Rules e isolamento aguardam as subtarefas de converter, repository e
  Emulator.
- Ativação do Firestore e escolha de região continuam checkpoint humano da
  subtarefa 005-08; nenhuma operação real foi executada.
