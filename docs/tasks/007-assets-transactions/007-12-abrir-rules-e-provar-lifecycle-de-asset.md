# 007-12 — Abrir Rules e provar lifecycle de Asset

- **Ticker:** `007`
- **Número:** `12`
- **Status:** `pending`

## Objetivo e resultado esperado

Permitir somente as transições atômicas aprovadas nas Firestore Rules e provar
ownership, registry, guard e concorrência no Emulator.

## Requisitos cobertos

- Spec 007, critérios 12, 12a–12c e 24–27.
- Isolamento owner-scoped, anônimo, cross-user e default deny.

## Escopo incluído

- Update de Asset somente com registry coerente e `createdAt` imutável.
- Delete conjunto de Asset e registry somente com guard ausente.
- Guard create-only e Transaction sem guard negada.
- Fixtures sintéticas para uso em Portfolio ativa/arquivada, colisão, corrida e
  tentativa de remover apenas um lado do par.

## Escopo excluído

- UI, deploy/Console, mudança de Transaction append-only ou cascade.

## Dependências

- `007-11` concluída.
- Auditoria/reconciliação legada definida e executável.

## Definição de pronto

- Tentativas isoladas, cross-user, registry órfão e guard removido falham.
- Edição válida e delete sem uso passam somente no conjunto atômico esperado.
- `npm run test:rules` cobre o novo contrato sem regressar os 13 casos atuais.

## Testes e comandos de validação

```bash
JAVA_HOME=$(/usr/libexec/java_home -v 21) npm run test:rules
npm run lint
npm exec next typegen
npx tsc --noEmit
git diff --check
```

## Riscos e cuidados

- Rules não devem ser tratadas como filtro nem como substituto da reconciliação.
- Falha ou cobertura inconclusiva mantém delete fechado.

## Execução

- **Status:** `pending`; nenhuma Rule foi aberta nesta etapa de planejamento.
- **Riscos residuais:** a decisão final depende de evidência do Emulator e da
  compatibilidade do guard com os writes existentes.
