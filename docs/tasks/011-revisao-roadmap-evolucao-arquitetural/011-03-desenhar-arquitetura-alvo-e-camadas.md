# 011-03 — Desenhar arquitetura alvo e limites das camadas

- **Ticker:** `011`
- **Número:** `03`
- **Status:** `completed`

## Objetivo e resultado esperado

Definir a arquitetura lógica alvo, responsabilidades e dependências entre
frontend, API, Application, Domain e Infrastructure. O resultado deve impedir
que controllers, EF Core, Firebase ou BRAPI contaminem regras de negócio.

## Requisitos cobertos

- Arquitetura React/Vite → ASP.NET Core → EF Core → PostgreSQL/Supabase.
- Limites API/Application/Domain/Infrastructure.
- Integrações externas isoladas no backend.
- Casos de uso, DTOs, validação, autorização, erros e contratos.
- Estratégia incremental por vertical slice e walking skeleton antecipado.

## Escopo

### Incluído

- Diagramas de contexto, containers e dependências.
- Responsabilidades e regras de referência entre projetos/camadas.
- Ports necessários para persistência, identity, clock e Quotes.
- Fluxos de comando/query e política de transação.
- Ordem 013–019 refinada por slices.

### Excluído

- Criar solution/projetos .NET ou app Vite.
- Escolher GenericRepository, microservices ou mensageria.
- Fechar todos os endpoints antes do discovery de UX.

## Dependências

- 011-01 e 011-02 concluídas.

## Arquivos e símbolos prováveis

- Leitura: inventários 011, `src/domain/**`, `src/server/**`, `src/data/**`.
- Saída provável: `docs/architecture/011/target-architecture.md`, diagramas e
  matriz de dependências.

## Passos de implementação

1. Desenhar contexto e containers alvo, incluindo hosts e trust boundaries.
2. Definir responsabilidades e dependências permitidas por camada.
3. Mapear capacidades atuais para Domain/Application/Infrastructure/API.
4. Separar regras de domínio, orchestration, persistence e transport.
5. Definir formato de commands/queries/use cases sem impor framework pesado.
6. Definir composição de transações e owner context.
7. Planejar walking skeleton autenticado na 014.
8. Planejar slices Portfolio, Assets/Transactions e Quotes/Dashboards.
9. Registrar decisões abertas versus já tomadas.

## Testes e comandos de validação

- Revisão de dependências com cenários representativos de read/write.
- Walkthrough de login, create Portfolio, concurrent SELL e Quotes.
- Checklist para provar que Domain não depende de EF/HTTP/Firebase/BRAPI.
- Revisão contra requisitos da spec e inventários 01/02.
- `git diff --check`.

## Definição de pronto

- Diagramas e responsabilidades não têm ciclos ou owners ambíguos.
- Cada capacidade atual tem destino ou descarte explícito.
- O primeiro E2E autenticado ocorre antes das features financeiras.
- A ordem por slices e seus gates está definida.
- Decisões irreversíveis candidatas a ADR estão listadas.

## Riscos e cuidados

- Evitar arquitetura em camadas apenas nominal com regra nos controllers.
- Não introduzir abstração sem dois usos concretos.
- Não transformar detalhes Firestore em conceitos de Domain.
- Não congelar contratos HTTP finais antes da 012 e do protótipo correspondente;
  a 011-06 registra somente capacidades e contratos provisórios.

## Registro da execução

### Status

`completed`

### Arquivos alterados

- `docs/specs/011-revisao-roadmap-evolucao-arquitetural.md`
- `docs/roadmap/reserva-clara-roadmap.md`
- `docs/tasks/011-revisao-roadmap-evolucao-arquitetural/011-00-overview.md`
- `docs/tasks/011-revisao-roadmap-evolucao-arquitetural/011-01-inventariar-frontend-e-next.md`
- `docs/tasks/011-revisao-roadmap-evolucao-arquitetural/011-02-mapear-dominio-dados-e-riscos.md`
- `docs/tasks/011-revisao-roadmap-evolucao-arquitetural/011-08-registrar-adrs-e-handoff.md`
- `docs/context/2026-09-29-chat-summary.md`
- este arquivo

### Decisões e desvios

- A sequência de desenho ficou explícita como Produto/UX/UI → casos de uso →
  API Contract → Application → Domain → Persistence.
- O modelo de persistência não define automaticamente a API; controllers ficam
  finos e regras permanecem em Application/Domain.
- Foram registrados os boundaries de Domain, Application, Infrastructure, API,
  frontend, Firebase e BRAPI sem introduzir tecnologias ou padrões novos.
- A Fase 011 foi delimitada como discovery/redução de incertezas, com critérios
  de encerramento que não exigem especificar o sistema inteiro.
- Desvio controlado: não foi criado um arquivo de arquitetura separado; a
  decisão foi registrada nos artefatos canônicos já existentes (spec e roadmap)
  para manter a revisão pontual solicitada.

### Comandos executados

- `git diff --check`
- validação documental dos tickers, subtarefas, headings oficiais 011–021 e
  checklist do overview
- revisão independente do diff documental por agente `review`

### Resultados e evidências

- A spec e o roadmap apresentam uma única sequência oficial pós-010, com as
  propostas antigas marcadas como histórico/superseded.
- C0 registra a alternativa A escolhida para a integridade do `SELL`, com motivo,
  escopo permitido, owner, critério de saída e proibição de replicar a falha;
  alternativas B/C permanecem documentadas como opções não escolhidas.
- O gate 021 agora valida o sistema funcionando e inclui autenticação,
  PostgreSQL/EF Core, BRAPI, contratos, cutover, testes, deploy,
  observabilidade, segurança e remoção do legado.
- A revisão independente encontrou e foi corrigida a inconsistência que ainda
  dizia que o roadmap estava bloqueado/não sincronizado; o contexto histórico
  também foi marcado como superseded.
- Nenhum arquivo de código, banco, deploy, segredo ou configuração externa foi
  alterado.

### Riscos residuais

- C0 foi decidido como **A — aceitação temporária restrita a dev/testes**. O
  projeto não possui usuários ativos; portanto só são permitidos dados
  sintéticos/descartáveis, sem writes patrimoniais em staging/produção ou dados
  reais. O owner operacional é o maintainer do projeto, e a saída ocorre antes
  do primeiro usuário ativo, dado real, staging/produção ou cutover.
- A 012 ainda precisa realizar a descoberta de produto/UX/UI; portanto os
  contratos da API continuam provisórios.
