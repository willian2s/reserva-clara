# ADR 007 — Topologia alvo e autoridade única dos dados

- **Status:** `proposed`
- **Ticker relacionado:** `011`
- **Decisão:** 1 de 15 da spec 011

## Contexto

As fases 001–010 foram construídas com Next.js, acesso patrimonial ao Firestore
no browser e um Route Handler para Quotes. A próxima etapa precisa criar uma
fronteira confiável sem apagar o histórico nem manter duas autoridades
permanentes.

## Decisão proposta

1. O alvo é React/TypeScript/Vite → ASP.NET Core/.NET → Application/Domain →
   Infrastructure/EF Core → PostgreSQL gerenciado no Supabase.
2. Firebase Authentication permanece no browser como identidade; BRAPI continua
   atrás de um adapter no backend.
3. Firestore permanece autoridade patrimonial até o write fence. PostgreSQL só
   se torna autoridade após C10, o primeiro write patrimonial aceito.
4. Não haverá dual-write normal. Cópias de rehearsal, staging e migração final
   são controladas, reconciliadas e não são uma segunda autoridade.
5. Next/Firestore patrimonial só serão removidos depois de paridade, cutover,
   soak e C11.

## Evidência e alternativas

O desenho está sustentado pela [spec 011](../specs/011-revisao-roadmap-evolucao-arquitetural.md#4-abordagem-escolhida-e-princípios-da-transformação),
pelo [modelo de migração](../architecture/011/data-migration-strategy.md#princípios-operacionais)
e pelos gates C0–C11 em [qualidade e cutover](../architecture/011/quality-environments-cutover.md#9-checkpoints-c0c11-e-gono-go).

Manter Firestore como autoridade definitiva, fazer dual-write ou migrar tudo em
um big-bang foram rejeitados por split-brain, rollback ilusório e risco de
perder invariantes cruzados.

## Consequências e revisão

O rollout será incremental, mas exige disciplina sobre autoridade por owner e
um ponto de não retorno explícito. A topologia será revisada em C2, C7, C10 e
C11, com evidência de execução integrada. Até lá, `proposed` não significa que
qualquer serviço novo já exista.

## Referências

- [011-08 — ADRs e handoff](../architecture/011/adr-register-and-handoff.md)
- [ADR 003 — separação por host](003-separacao-host-publico-app.md), histórica até o cutover.
- [ADR 004 — Cloudflare/Vercel](004-cloudflare-proxied-vercel.md), histórica até o cutover.
