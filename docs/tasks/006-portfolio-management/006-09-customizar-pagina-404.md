# 006-09 — Customizar página 404

- **Ticker:** `006`
- **Número:** `09`
- **Status:** `completed`

## Objetivo

Substituir 404 padrão do Next por tela customizada, clara e acessível, sem
antecipar detalhe de Portfolio nem criar links para funcionalidades futuras.

## Resultado esperado

Rota inexistente exibe mensagem de indisponibilidade, código 404 visual e link
funcional para a superfície adequada da origem atual: Dashboard na aplicação e
início na superfície pública.

## Escopo incluído

- Criar `src/app/not-found.tsx` como Server Component.
- Reutilizar tokens, tipografia e `buttonVariants` existentes.
- Exibir heading hierárquico, texto curto, código 404 e retorno dinâmico para a
  aplicação ou `/` na superfície pública.
- Não importar Firebase, Firestore ou APIs client-only.

## Escopo excluído

- Implementação de `/portfolios/[portfolioId]`.
- Tratamento client-only de ausência de Portfolio.
- Alterações de comportamento em proxy, AuthGate, Rules ou dependências. O helper
  compartilhado de classificação de host pode ser extraído sem mudar o contrato.

## Dependências

- 006-01 concluída para tokens e shell visual.
- Documentação local Next 16 para convenção `not-found.tsx`.

## Arquivos e símbolos prováveis

- `src/app/not-found.tsx`.
- `src/lib/host-routing.ts` — helper compartilhado quando necessário para manter
  decisão de superfície única.

## Passos de implementação futura

1. Confirmar convenção local de `not-found.tsx`.
2. Criar tela Server Component sem dados sensíveis.
3. Validar link, heading, contraste e responsividade pelos gates existentes.

## Testes e validação

```bash
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
```

Validar manualmente rota inexistente em localhost, superfície pública e origem
app; confirmar que link `/` mantém origem e que `/brand/*` e `/_next/*` não são
interceptados pelo proxy.

## Definição de pronto

- 404 padrão substituído por tela customizada.
- Heading, mensagem e código 404 acessíveis.
- Retorno dinâmico funciona para aplicação e superfície pública sem expor dados sensíveis.
- Server Component não importa Firebase/Firestore.
- Gates passam.

## Riscos e cuidados

- `/` tem comportamento definido pelo host; identificar superfície pela requisição
  para evitar enviar usuário autenticado da aplicação à landing pública.
- `headers()` torna 404 host-aware renderizada por requisição, sem prerender/cache
  estático. Trade-off aceito para manter retorno correto entre app, preview, local
  e superfície pública; 404 é tráfego excepcional.
- Tela 404 não pode ser confundida com autorização ou ausência de Portfolio.

## Evidência esperada ao concluir

Registrar arquivo, decisão visual, comandos, resultado dos gates, matriz manual e
riscos residuais. Marcar somente esta task no overview quando pronta.

## Registro de execução

### Status

`completed`.

### Arquivos alterados

- `src/app/not-found.tsx` — tela 404 Server Component com retorno host-aware.
- `src/lib/host-routing.ts` — classificação e normalização de host compartilhadas.
- `src/proxy.ts` — reutiliza helper sem alterar comportamento de routing.
- `docs/specs/006-portfolio-management.md` — ordem inclui 006-09.

### Decisões e desvios

- `src/app/not-found.tsx` foi escolhido em vez de `global-not-found.tsx`: usa layout,
  tema e tokens existentes sem habilitar API experimental.
- Host app, local e preview retornam para `/dashboard`; superfície pública retorna
  para `/`. Classificação permanece centralizada no helper usado pelo proxy.
- `headers()` torna 404 dinâmica por requisição. Trade-off aceito porque mantém
  retorno correto por superfície e 404 é fluxo excepcional.
- Código 404 usa `text-primary` para contraste adequado; nenhum dado sensível ou
  API Firebase/Firestore foi adicionado.

### Comandos executados

- `npm run lint` — passou.
- `npm exec next typegen` — passou.
- `npx tsc --noEmit` — passou.
- `npm run build` — passou; build confirmou `/_not-found` dinâmica.
- `git diff --check` — passou.

### Resultados e evidências

- Tela customizada contém heading, código 404, mensagem curta e link acessível.
- Link preserva superfície pública e direciona usuário da aplicação ao Dashboard.
- `normalizeHostname` e `classifyHost` preservam casos de porta, IPv6, ponto final,
  localhost e preview usados pelo proxy.
- Revisão independente final aprovou implementação sem bloqueadores.

### Matriz manual

- Por inspeção: hosts `public`/`www` retornam `/`; `app`, local e preview retornam
  `/dashboard`; host desconhecido permanece responsabilidade do proxy.
- Por inspeção: `/_next/*` e `/brand/*` não entram no matcher do proxy.
- Browser não estava disponível nesta execução; validação visual manual permanece
  residual para smoke operacional.

### Riscos residuais

- `headers()` adiciona renderização request-time ao 404; custo documentado e aceito.
- Validação manual em browser para hosts, assets, teclado e responsividade ainda
  precisa ser executada na validação operacional.
