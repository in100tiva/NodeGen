# Configuração da VITE_CONVEX_URL no Vercel

## Problema

Se você está vendo uma tela preta e o erro:
```
Could not find Convex client! `useMutation` must be used in the React component tree under `ConvexProvider`.
```

Isso significa que a variável de ambiente `VITE_CONVEX_URL` não está configurada no Vercel.

## Como Obter a URL do Convex

### Método 1: Usando o CLI do Convex (Recomendado)

Execute no seu terminal local:

```bash
npx convex dev --once
```

Procure por uma linha como:
```
Deployment URL: https://cautious-buzzard-249.convex.cloud
```

Essa é a URL que você precisa!

### Método 2: Pelo Dashboard do Convex

1. Acesse [dashboard.convex.dev](https://dashboard.convex.dev)
2. Selecione seu projeto
3. Vá para **Settings** → **URL & Deploy Key**
4. Copie a **Deployment URL** (ex: `https://cautious-buzzard-249.convex.cloud`)

## Configurar no Vercel

1. Acesse o [Dashboard do Vercel](https://vercel.com/dashboard)
2. Vá para o seu projeto
3. Clique em **Settings** → **Environment Variables**
4. Adicione uma **nova variável**:

```
Nome: VITE_CONVEX_URL
Valor: https://cautious-buzzard-249.convex.cloud
```

**Importante:**
- Configure para **Production**, **Preview** e **Development**
- Use a URL do SEU deployment Convex (não copie o exemplo acima)
- A URL deve terminar com `.convex.cloud`

## Fazer Redeploy

Após configurar a variável:

1. Vá para **Deployments** no Vercel
2. Clique nos três pontos (`...`) no último deployment
3. Clique em **Redeploy**

A aplicação deve carregar normalmente agora!

## Verificar se Está Funcionando

Após o deploy, abra o Console do navegador (F12):
- ✅ **Sucesso**: Nenhum erro sobre `ConvexProvider`
- ❌ **Erro**: Ainda aparece o erro? Verifique se a URL está correta e se fez o redeploy

## Troubleshooting

### A URL está configurada mas ainda dá erro

1. Verifique se a URL está **exatamente** correta (sem espaços ou caracteres extras)
2. Confirme que a variável está configurada para **Production**
3. Faça um **novo deploy** (não apenas revalidar o cache)
4. Limpe o cache do navegador (Ctrl+Shift+Delete)

### Como saber se a URL está correta?

A URL do Convex sempre tem este formato:
```
https://<nome-do-deployment>.convex.cloud
```

Exemplo: `https://cautious-buzzard-249.convex.cloud`

Não confunda com:
- ❌ `CONVEX_SITE_URL` (usada para HTTP routes, ex: `https://cautious-buzzard-249.convex.site`)
- ❌ URL local de desenvolvimento (ex: `http://localhost:3210`)
