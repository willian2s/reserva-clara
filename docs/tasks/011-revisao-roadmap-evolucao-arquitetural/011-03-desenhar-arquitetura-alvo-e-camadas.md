# 011-03 — Desenhar arquitetura alvo e limites das camadas

- **Ticker:** `011`
- **Número:** `03`
- **Status:** `pending`

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
- Não congelar contratos HTTP antes da subtarefa 06.
