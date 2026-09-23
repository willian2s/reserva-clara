# 004-02 — Conectar Vercel e publicar preview

- **Ticker:** `004`
- **Número:** `02`
- **Status:** `pending`

## Objetivo e resultado esperado

Conectar o repositório a um único projeto Vercel e obter deployment acessível no
hostname Vercel antes de alterar DNS público. Registrar configuração efetiva,
branch, ambientes, deploy automático, previews, logs e rollback inicial.

## Requisitos cobertos

- Projeto único Vercel e framework Next.js.
- Branch `main` como produção.
- Framework detection, install/build/output defaults.
- Production, Preview e Development.
- Deploy Git, previews de branch/PR, logs e rollback.
- Ausência de `vercel.json` desnecessário.

## Escopo incluído

- Importar/conectar repositório existente no projeto Vercel autorizado.
- Confirmar que o projeto não cria segundo app ou repositório.
- Registrar valores efetivos exibidos pela Vercel, sem impor defaults
  artificialmente.
- Confirmar deployment inicial e URL `.vercel.app`.
- Confirmar que não há domínio customizado ativo antes do gate de DNS.
- Fazer checkpoint para aprovação humana antes de prosseguir.

## Escopo excluído

- Alteração Cloudflare, DNS, domínios oficiais ou Firebase.
- Environment variables com valores reais; isso é 004-03.
- Criação de `vercel.json`, workflow CI ou configuração customizada sem causa.
- Marcar produção saudável antes do redeploy com env e smoke da task 03.

## Dependências

- 004-01 concluída.
- Usuário com acesso ao repositório e à equipe/projeto Vercel.
- Decisão humana sobre nome do projeto e permissões, sem registrar token.

## Arquivos e símbolos prováveis

- `package.json`, `package-lock.json`, `next.config.ts` para detecção.
- Projeto Vercel, configurações Git/Environments/Domains/Deployments/Logs.
- `docs/tasks/004-production-deployment/004-02-*.md` para evidências não
  sensíveis.

## Passos de implementação

1. Humano autoriza integração do repositório com Vercel.
2. Criar ou selecionar um único projeto para `reserva-clara`.
3. Confirmar framework Next.js e root directory.
4. Manter install, build e output defaults salvo erro comprovado; registrar o
   valor efetivo e não criar `vercel.json`.
5. Definir `main` como Production Branch e confirmar comportamento de push/PR.
6. Criar deployment de validação sem apontar domínios oficiais.
7. Inspecionar build logs e status da deployment; registrar ID/URL pública, não
   tokens.
8. Confirmar procedimento de rollback para deployment anterior.

## Testes e comandos de validação

- Painel Vercel: projeto, framework, branch, environments e deployment.
- Abrir URL `.vercel.app` e verificar resposta básica da landing.
- Conferir build logs sem valores de env.
- Criar, se permitido, preview de branch/PR e confirmar URL gerada.
- Não considerar OAuth funcional sem task 03/05.

## Definição de pronto

- Repositório conectado a exatamente um projeto Vercel.
- `main` configurada como produção ou divergência justificada.
- Deployment Vercel acessível, com build saudável ou bloqueio registrado.
- Previews e auto-deploy documentados.
- Logs e rollback localizados.
- Nenhum domínio público ou DNS foi alterado.

## Riscos e cuidados

- Primeiro deploy pode ser Production por regra atual da Vercel; confirmar na
  documentação e no painel antes de expor domínio.
- Não colar token Vercel em task ou log.
- Um domínio pode já pertencer a outro projeto/equipe; não reassociar à força
  sem autorização humana e snapshot.
- Deployment sem Firebase env não prova login; não transformar essa limitação em
  correção de código.
