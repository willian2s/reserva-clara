# 011 — Revisão do Roadmap e Evolução Arquitetural

- **Status geral:** in_progress
- **Spec:** [011-revisao-roadmap-evolucao-arquitetural.md](../../specs/011-revisao-roadmap-evolucao-arquitetural.md)
- **Progresso:** 1/8 subtarefas concluídas

## Objetivo

Executar o discovery que prepara a transformação incremental do Reserva Clara de
Next.js + Firestore para React/TypeScript/Vite → ASP.NET Core/.NET → EF Core →
PostgreSQL/Supabase, mantendo Firebase Authentication e isolando BRAPI no
backend, sem iniciar a implementação da nova stack.

## Checklist

- [x] [011-01-inventariar-frontend-e-next.md](011-01-inventariar-frontend-e-next.md)
- [ ] [011-02-mapear-dominio-dados-e-riscos.md](011-02-mapear-dominio-dados-e-riscos.md)
- [ ] [011-03-desenhar-arquitetura-alvo-e-camadas.md](011-03-desenhar-arquitetura-alvo-e-camadas.md)
- [ ] [011-04-modelar-postgresql-e-migracao.md](011-04-modelar-postgresql-e-migracao.md)
- [ ] [011-05-definir-identidade-e-seguranca.md](011-05-definir-identidade-e-seguranca.md)
- [ ] [011-06-revisar-ux-frontend-e-contratos.md](011-06-revisar-ux-frontend-e-contratos.md)
- [ ] [011-07-planejar-testes-ambientes-e-cutover.md](011-07-planejar-testes-ambientes-e-cutover.md)
- [ ] [011-08-registrar-adrs-e-handoff.md](011-08-registrar-adrs-e-handoff.md)

## Observações

- Dependências: fases 001–010 concluídas; a arquitetura alvo e a permanência de
  Firebase Authentication/BRAPI já estão decididas.
- 011 é uma fase de discovery e documentação. Não cria Vite, .NET, schema,
  migration, endpoint, infraestrutura ou deploy.
- As tarefas 01 e 02 podem ser investigadas em paralelo; as demais fecham
  progressivamente arquitetura, dados, segurança, produto e operação.
- O risco de `SELL` acima do saldo via SDK Firestore direto deve receber uma
  decisão de contenção em C0, sem introduzir dual-write.
- A atualização do roadmap canônico está bloqueada pela política atual de
  edição. A revisão persistida está na spec e deve ser sincronizada quando a
  permissão para `docs/roadmap/**` estiver disponível.
- 011-01 concluída com inventário de rotas, layouts, hosts, acoplamentos Next,
  auth/dados, UX/a11y, testabilidade, matriz de destino e riscos residuais.
- A baseline técnica permaneceu verde; não houve alteração de código. A próxima
  subtarefa elegível é 011-02.
