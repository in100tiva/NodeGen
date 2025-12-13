# Guia de Deploy do Convex em Produção

Este guia explica como fazer upload das funções do Convex para produção.

## Pré-requisitos

1. Conta no [Convex](https://www.convex.dev/)
2. Convex CLI instalado (já instalado via `npm install convex`)

## Passo 1: Configurar o Projeto Convex

Se ainda não configurou o projeto, execute:

```bash
npx convex dev
```

Este comando irá:
- Abrir o navegador para fazer login no Convex
- Criar ou conectar a um projeto Convex
- Gerar a pasta `convex/_generated/` com os tipos TypeScript
- Fazer push das funções para o ambiente de desenvolvimento

## Passo 2: Verificar a Configuração

Após executar `npx convex dev`, será criado um arquivo `.env.local` (ou `.env`) com variáveis como:

```
CONVEX_DEPLOYMENT=your-deployment-url
```

## Passo 3: Deploy para Produção

### Opção A: Deploy Manual

Para fazer deploy das funções para produção, execute:

```bash
npx convex deploy
```

Este comando:
- Faz deploy para o deployment de **produção** por padrão
- Verifica os tipos TypeScript antes de fazer deploy
- Gera os arquivos em `convex/_generated/`

### Opção B: Deploy com Build do Frontend

Se você quiser fazer deploy do Convex e build do frontend juntos:

```bash
npx convex deploy --cmd "npm run build" --cmd-url-env-var-name VITE_CONVEX_URL
```

### Opção C: Deploy para Preview (Pull Requests)

Para fazer deploy em um ambiente de preview (útil para PRs):

1. Configure uma **Preview Deploy Key** no Convex Dashboard
2. Defina a variável de ambiente `CONVEX_DEPLOY_KEY` com a chave
3. Execute:

```bash
npx convex deploy --preview-create nome-do-preview
```

## Passo 4: Configurar Variáveis de Ambiente

No Convex Dashboard, configure as variáveis de ambiente necessárias:

1. Acesse: https://dashboard.convex.dev/
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Adicione as variáveis necessárias, como:
   - `CONVEX_SITE_URL` (URL do seu site em produção)
   - Outras variáveis que suas funções precisam

## Passo 5: Integração com Vercel (Opcional)

Se você quiser fazer deploy automático do Convex quando fizer deploy na Vercel:

1. No Convex Dashboard, vá em **Settings** → **Deploy Keys**
2. Crie uma **Production Deploy Key**
3. Na Vercel, adicione a variável de ambiente `CONVEX_DEPLOY_KEY` com essa chave
4. Adicione um script no `package.json`:

```json
{
  "scripts": {
    "deploy": "convex deploy && vercel deploy --prod"
  }
}
```

Ou configure um hook de build na Vercel para executar `npx convex deploy` automaticamente.

## Estrutura das Funções

Suas funções estão em:
- `convex/openrouter.ts` - Funções relacionadas ao OpenRouter
- `convex/executionEngine.ts` - Motor de execução de workflows

## Comandos Úteis

- `npx convex dev` - Desenvolvimento local com watch
- `npx convex deploy` - Deploy para produção
- `npx convex deploy --dry-run` - Ver o que seria deployado sem fazer deploy
- `npx convex logs` - Ver logs das funções em produção
- `npx convex dashboard` - Abrir o dashboard do Convex

## Troubleshooting

### Erro: "No deployment configured"
Execute `npx convex dev` primeiro para configurar o projeto.

### Erro: "Module not found: ./_generated/server"
Execute `npx convex dev` ou `npx convex deploy` para gerar os arquivos.

### Erro de autenticação
Verifique se você está logado: `npx convex auth login`

## Próximos Passos

1. Execute `npx convex dev` para configurar o projeto (se ainda não fez)
2. Execute `npx convex deploy` para fazer deploy para produção
3. Configure as variáveis de ambiente no Convex Dashboard
4. Teste suas funções em produção
