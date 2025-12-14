# Configuração de Autenticação GitHub OAuth

Este guia explica como configurar a autenticação GitHub OAuth para o NodeGen Studio usando Convex Auth.

## Pré-requisitos

1. Conta no GitHub
2. Projeto Convex configurado
3. Deploy do Convex feito (para obter a URL de callback)

## Passo 1: Criar GitHub OAuth App

1. Acesse [GitHub Developer Settings](https://github.com/settings/developers)
2. Clique em "New OAuth App"
3. Preencha os campos:
   - **Application name**: `NodeGen Studio` (ou o nome que preferir)
   - **Homepage URL**: 
     - Desenvolvimento: `http://localhost:5173`
     - Produção: URL da sua aplicação na Vercel (ex: `https://seu-app.vercel.app`)
   - **Authorization callback URL**: 
     - Desenvolvimento: `http://localhost:5173/api/auth/callback/github`
     - Produção: `https://[seu-projeto].convex.site/api/auth/callback/github`
       - Substitua `[seu-projeto]` pela URL do seu projeto Convex
       - Exemplo: `https://fast-horse-123.convex.site/api/auth/callback/github`

4. Clique em "Register application"
5. **IMPORTANTE**: Copie o **Client ID** e gere um **Client Secret**

## Passo 2: Configurar Variáveis de Ambiente no Convex

1. Acesse o [Convex Dashboard](https://dashboard.convex.dev)
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Adicione as seguintes variáveis:

### Para Desenvolvimento Local

Execute no terminal:

```bash
npx convex env set AUTH_GITHUB_ID <seu_client_id>
npx convex env set AUTH_GITHUB_SECRET <seu_client_secret>
```

### Para Produção (Vercel)

1. No Convex Dashboard, vá em **Settings** → **Environment Variables**
2. Certifique-se de que está na aba **Production**
3. Adicione:
   - `AUTH_GITHUB_ID`: Seu Client ID do GitHub
   - `AUTH_GITHUB_SECRET`: Seu Client Secret do GitHub

## Passo 3: Atualizar GitHub OAuth App para Produção

Após fazer deploy na Vercel:

1. Volte ao GitHub OAuth App
2. Edite a aplicação
3. Atualize:
   - **Homepage URL**: URL da sua aplicação na Vercel
   - **Authorization callback URL**: `https://[seu-projeto].convex.site/api/auth/callback/github`
4. Salve as alterações

## Passo 4: Verificar Instalação

1. Certifique-se de que as dependências estão instaladas:
   ```bash
   npm install
   ```

2. As dependências necessárias são:
   - `@convex-dev/auth`
   - `@auth/core`

3. Verifique se o arquivo `convex/auth.ts` está configurado corretamente

## Passo 5: Testar Localmente

1. Inicie o servidor Convex:
   ```bash
   npm run convex:dev
   ```

2. Em outro terminal, inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

3. Acesse `http://localhost:5173`
4. Você deve ver a tela de login
5. Clique em "Continuar com GitHub"
6. Autorize a aplicação no GitHub
7. Você deve ser redirecionado de volta e estar autenticado

## Troubleshooting

### Erro: "AUTH_GITHUB_ID não configurado"

- Verifique se as variáveis de ambiente estão configuradas no Convex Dashboard
- Certifique-se de que está usando o ambiente correto (dev/prod)

### Erro: "redirect_uri_mismatch"

- Verifique se a URL de callback no GitHub OAuth App corresponde exatamente à URL do Convex
- A URL deve ser: `https://[seu-projeto].convex.site/api/auth/callback/github`
- Não deve ter trailing slash ou caracteres extras

### Erro: "Not authenticated" ao acessar a aplicação

- Verifique se o fluxo de autenticação está funcionando
- Verifique os logs do Convex Dashboard para erros
- Certifique-se de que o `convex/http.ts` está exportando as rotas de autenticação

### A tela de login não aparece

- Verifique se `index.tsx` está usando `Authenticated` e `Unauthenticated`
- Verifique se o `ConvexProvider` está envolvendo a aplicação
- Verifique os logs do console do navegador

## Estrutura de Arquivos

- `convex/auth.ts` - Configuração do Convex Auth com GitHub provider
- `convex/http.ts` - Rotas HTTP para autenticação
- `components/LoginPage.tsx` - Tela de login
- `hooks/useAuth.ts` - Hook para usar autenticação
- `index.tsx` - Configuração do ConvexProvider com Authenticated/Unauthenticated

## Notas Importantes

1. **Separação de OAuth**: O GitHub OAuth para autenticação de usuário é diferente do OAuth para tokens de API do GitHub (usado nos nodes GitHub). Ambos podem coexistir.

2. **URLs de Callback**: 
   - Desenvolvimento: usa `localhost`
   - Produção: usa a URL do Convex (`.convex.site`)

3. **Segurança**: Nunca commite o Client Secret no código. Sempre use variáveis de ambiente.

4. **Múltiplos Ambientes**: Você pode ter diferentes GitHub OAuth Apps para desenvolvimento e produção, ou usar o mesmo com múltiplas URLs de callback.
