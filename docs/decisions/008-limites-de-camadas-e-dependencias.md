# ADR 008 — Limites de camadas e regras de dependência

- **Status:** `proposed`
- **Ticker relacionado:** `011`
- **Decisão:** 2 de 15 da spec 011

## Contexto

A migração não deve transformar tabelas EF em API nem transportar Firebase,
HTTP ou BRAPI para as regras financeiras. O domínio atual contém invariantes
úteis que precisam sobreviver à troca de runtime.

## Decisão proposta

```text
Frontend → API → Application → Domain
                         ↘ Infrastructure → EF Core → PostgreSQL
```

- **Frontend:** UX, sessão Firebase e cliente HTTP; nunca banco ou BRAPI.
- **API:** transporte, autenticação de borda, Problem Details e controllers
  finos; não contém regra patrimonial.
- **Application:** casos de uso, autorização contextual, validação de entrada,
  ports e composição transacional.
- **Domain:** invariantes, value objects, reducers e resultados; não referencia
  EF Core, PostgreSQL, Supabase, Firebase, ASP.NET Core, HTTP ou BRAPI.
- **Infrastructure:** implementa persistência, identidade externa, BRAPI,
  observabilidade e demais adapters.

Dependências apontam para abstrações internas. Não será introduzido
`GenericRepository`, microservice ou mensageria sem dois usos e evidência.

## Evidência e alternativas

O [desenho de arquitetura 011-03](../tasks/011-revisao-roadmap-evolucao-arquitetural/011-03-desenhar-arquitetura-alvo-e-camadas.md)
e a sequência Produto/UX/UI → casos de uso → API Contract → Application →
Domain → Persistence sustentam a proposta. CRUD orientado ao banco e regra em
controllers foram rejeitados por acoplamento e testabilidade ruim.

## Consequências e revisão

As slices podem evoluir verticalmente sem contaminar o Domain com detalhes de
framework. A composição concreta de ports, projetos e analyzers será revisada
na 013/015, com regra de dependência automatizada antes do C4.

## Referências

- [Arquitetura alvo](../specs/011-revisao-roadmap-evolucao-arquitetural.md#4-abordagem-escolhida-e-princípios-da-transformação)
- [ADR 007](007-topologia-alvo-e-autoridade-dos-dados.md)
