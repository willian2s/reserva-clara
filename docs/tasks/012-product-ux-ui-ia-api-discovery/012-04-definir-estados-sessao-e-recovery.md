# 012-04 — Definir estados, sessão e recovery

- **Ticker:** `012`
- **Número:** `04`
- **Status:** `completed`

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

## Registro da execução

### Status e resultado

`completed` — a taxonomia transversal e a política de sessão/recovery foram
documentadas em `docs/architecture/012/state-and-session-recovery.md`. O artefato
cobre último dado válido, loading/refreshing/ready/empty/partial/stale/
unavailable/offline, conflito, não autorizado e resultado desconhecido; também
registra o tabletop de 401 para read, write idempotente e write não idempotente,
refresh único, signOut, usuário desabilitado e retorno à origem sem loop.

### Arquivos alterados

- `docs/architecture/012/state-and-session-recovery.md` — novo artefato de
  taxonomia, estados compostos, fluxos de sessão, matriz de retry, copy, foco,
  walkthrough e handoff para 013/014/017–019.
- este arquivo — status, decisões, evidências, validações e riscos residuais.
- `docs/tasks/012-product-ux-ui-ia-api-discovery/012-00-overview.md` — checklist,
  progresso e observação da conclusão desta subtarefa.

Nenhum arquivo de produção, endpoint, dependência, segredo ou configuração
externa foi alterado.

### Decisões e desvios

- A implementação foi deliberadamente documental, conforme a fronteira da spec
  012; `AuthGate` e `GoogleSignIn` foram tratados como baseline observável, não
  alterados como se fossem boundary de autorização.
- Estados de leitura e de comando foram separados. `refreshing`, `stale` e
  `offline` podem ser overlays do snapshot, enquanto `conflict`, `unauthorized`
  e resultado desconhecido conduzem a recovery explícito.
- A política escolhida permite exatamente um refresh forçado por ciclo e repete
  somente read idempotente ou write com chave de idempotência estável. Write não
  idempotente não recebe replay cego; perda de rede após dispatch vira resultado
  desconhecido.
- A intenção de retorno é interna, allowlisted e consumida uma vez. Não foram
  definidos endpoint, DTO, TTL final, biblioteca de cache, armazenamento de
  sessão ou implementação de router.

### Comandos executados e resultados

- `functions.glob`/`functions.read` — passaram na conferência da spec 012,
  overview, subtarefa, `AGENTS.md`, dependências 012-02/03, handoff 011, ADR 013,
  `AuthGate`, `GoogleSignIn` e Firebase client.
- Conferência de ticker — passou: spec, pasta, overview e subtarefas usam `012`;
  a subtarefa `012-04` foi selecionada explicitamente pelo caminho informado.
- Conferência do overview — passou antes da edição: há uma única seção
  `## Checklist`, com 13 itens, exatamente um por subtarefa; 012-01/02/03 estavam
  concluídas e somente 012-04 foi selecionada.
- Conferência de dependências — passou: 012-02 e 012-03 estão `completed`, C1 foi
  aceito e C0 permanece limitado a dev/testes com fixtures sintéticas.
- Tabletop documental — passou nos oito cenários descritos no artefato e na tabela
  de evidências, incluindo 401 em read, write idempotente/não idempotente,
  refresh único, signOut falho, usuário desabilitado, offline, conflito e retorno
  único à origem. A evidência é uma simulação documental, não uma execução de
  runtime.
- Conferência de links, headings e taxonomia — passou por inspeção dos arquivos
  locais e das referências relativas no novo artefato.
- `git diff --check` — passou após a documentação e os registros finais.
- Verificação de whitespace do arquivo novo com `git diff --no-index --check` —
  passou sem apontamentos; como o artefato é novo e não rastreado, a conferência
  foi feita explicitamente contra `/dev/null`.
- Revisão independente do subagente `review` — **APROVADO** após corrigir a
  evidência observável dos oito casos do tabletop e separar a copy de offline
  pré-dispatch do resultado desconhecido pós-dispatch.
- Lint, typecheck, build e testes de código — não executados: somente Markdown foi
  alterado e a spec 012 dispensa esses comandos quando não há código.

### Resultados e evidências

- `state-and-session-recovery.md` contém tabela de estados, regras de composição,
  ciclo de sessão, limite explícito de refresh, intenção interna, matriz de retry,
  recovery de comandos, copy/foco/ações, walkthrough e handoff.
- A matriz demonstra uma única tentativa de `getIdToken(true)`, no máximo um retry
  autorizado e nenhum retry cego de write não idempotente.
- O documento preserva snapshot/último dado válido em refresh e falha, distingue
  `partial`, `stale`, `unavailable` e `offline`, e declara que indisponibilidade
  nunca vira zero.
- O retorno pós-login valida intenção interna, consome-a uma vez e cai em
  Carteiras quando inválida; refresh, logout e usuário desabilitado não criam loop.
- O handoff encaminha reconciliação por chave/status para 014/018 e a validação
  de foco, teclado, leitor de tela, 320 px e zoom 200% para 012-05/012-06/013,
  sem declarar essa validação como executada.

### Riscos residuais e bloqueios

- Não há bloqueio de execução. Ainda não existem cliente HTTP, API ou testes
  React/E2E para provar o comportamento em runtime.
- A capacidade definitiva de consultar o resultado de comando desconhecido,
  inclusive para Transaction, depende de 014/018; até lá não há promessa de
  retry seguro ou escrita offline.
- TTL de stale, armazenamento final da intenção e telemetria permanecem abertos
  para a fundação frontend/API; não podem introduzir token em `localStorage` nem
  transformar AuthGate em autorização.
- A validação humana de acessibilidade e responsividade permanece pendente nas
  subtarefas seguintes.

### Handoff

- `013` deve separar estado de sessão, servidor, formulário e navegação e tornar
  snapshot, foco e live regions testáveis.
- `014` deve provar `401`/`503`, revogação/disabled, CORS, claims, refresh único,
  retry idempotente e reconciliação sem redirect de API.
- `017–019` devem consumir os estados no contexto de Portfolio, Transaction,
  Quotes, valuation e dashboard, preservando append-only, precisão e ausência de
  performance histórica.
- Não avançar automaticamente para `012-05` ou qualquer outra subtarefa.
