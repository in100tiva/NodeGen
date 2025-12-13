# 🔧 Correção Rápida - Tela Preta no Vercel

## Problema
A aplicação está com tela preta e erro: `Could not find Convex client!`

## Solução em 3 Passos

### 1️⃣ Obter a URL do Convex

Execute no terminal:
```bash
npx convex dev --once
```

Ou acesse: [dashboard.convex.dev](https://dashboard.convex.dev) → Seu Projeto → Settings → URL

Copie a URL que termina com `.convex.cloud`

Exemplo: `https://cautious-buzzard-249.convex.cloud`

### 2️⃣ Configurar no Vercel

1. Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecione seu projeto
3. Vá para **Settings** → **Environment Variables**
4. Clique em **Add Variable**
5. Adicione:
   ```
   Nome: VITE_CONVEX_URL
   Valor: https://seu-deployment.convex.cloud
   ```
6. Marque: **Production**, **Preview** e **Development**
7. Clique em **Save**

### 3️⃣ Fazer Redeploy

1. Vá para **Deployments**
2. Clique nos `...` do último deployment
3. Clique em **Redeploy**
4. Aguarde o deploy completar
5. Abra a aplicação

✅ **Pronto!** A aplicação deve carregar normalmente.

## Ainda não funcionou?

Veja a documentação completa: [docs/VITE_CONVEX_URL_SETUP.md](docs/VITE_CONVEX_URL_SETUP.md)
