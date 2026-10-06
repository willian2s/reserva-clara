# 011-08 — Registrar ADRs, gates e handoff

- **Ticker:** `011`
- **Número:** `08`
- **Status:** `pending`

## Objetivo e resultado esperado

Converter os achados das subtarefas anteriores em decisões arquiteturais
rastreáveis, reconciliar o roadmap canônico e entregar um handoff sem lacunas
para as fases 012–016.

## Requisitos cobertos

- ADRs para decisões relevantes e supersession explícita do legado.
- Dependências, riscos, premissas, gates e decisões abertas visíveis.
- Preservação do histórico 001–010.
- Roadmap executável antes de voltar a features normais.
- Coerência entre spec, overview, subtarefas e roadmap.

## Escopo

### Incluído

- Criar/revisar ADRs listadas na spec 011.
- Marcar cada decisão como proposed/accepted/superseded com evidência.
- Conferir e manter o roadmap canônico sincronizado com as fases 011–021 e o
  histórico 001–010; a sincronização inicial foi antecipada nesta revisão.
- Consolidar gates C0–C11, riscos residuais e primeiras tarefas elegíveis.
- Produzir handoff para 012/013/014/015/016, distinguindo o baseline técnico e
  as perguntas abertas da 011 das decisões de Produto/UX/UI/frontend que cabem
  à 012.

### Excluído

- Implementar qualquer decisão.
- Marcar ADR histórica como superseded antes do cutover quando ela ainda
  descreve produção.
- Fingir que decisão aberta foi resolvida sem dados/experimento.

## Dependências

- 011-01 a 011-07 concluídas.
- Roadmap canônico já sincronizado; a subtarefa deve validar coerência final,
  não aguardar uma permissão de edição.

## Arquivos e símbolos prováveis

- `docs/decisions/**` para novas ADRs.
- `docs/roadmap/reserva-clara-roadmap.md` para sincronização autorizada.
- Spec/overview/subtarefas 011 e artefatos em `docs/architecture/011/**`.

## Passos de implementação

1. Revisar inventários, decisões e experimentos das tarefas anteriores.
2. Criar as ADRs 1–15 listadas na spec, agrupando apenas quando a decisão e
   consequências forem realmente inseparáveis.
3. Registrar alternativas, evidências, consequências e gatilho de revisão.
4. Distinguir decisões aceitas de hipóteses/experimentos pendentes.
5. Conferir o roadmap sincronizado, preservando fases 001–010 e mapeando o
   planejamento antigo como superseded.
6. Conferir fases 011–021, dependências, gates e ordem crítica.
7. Registrar risco residual C0 e blockers para 012–016.
8. Consolidar para a 012 o baseline frontend, gaps, jornadas a revisitar,
   restrições React/Vite, dependências UX/API e capacidades provisórias; deixar
   explícito que requisitos, DTOs e contratos podem mudar antes do freeze.
9. Atualizar status/checklist apenas para subtarefas realmente concluídas.
10. Produzir handoff com primeira fase/task elegível e decisões pendentes.

## Testes e comandos de validação

- Conferência bidirecional ADR ↔ spec ↔ roadmap ↔ artefato de discovery.
- Validar links, ticker, numeração, estados e termos superseded/accepted.
- Checklist das 19 perguntas do pedido original contra documentação final.
- Confirmar que nenhum ADR afirma mudança produtiva ainda não executada.
- `git diff --check` e inspeção do diff documental.

## Definição de pronto

- Decisões estruturais têm ADR e owner/gatilho de revisão.
- Histórico não foi reescrito e supersession é temporalmente correta.
- Roadmap canônico está sincronizado com spec, overview e handoff.
- Gates e handoffs indicam o que pode começar em paralelo e o que bloqueia; o
  handoff para a 012 não exige UX final, protótipos, design system final,
  arquitetura frontend completa ou contratos HTTP definitivos na 011.
- Nenhum código, deploy, banco, segredo ou configuração externa foi alterado.

## Riscos e cuidados

- Não aceitar ADR genérica que esconda decisões distintas.
- Não marcar Vercel/Firestore como removidos antes da 021.
- Não usar número de fase futura como se já estivesse executada.
- Não reabrir a sequência antiga nem executar novamente a sincronização já
  realizada; registrar qualquer divergência concreta entre os documentos.
