# 🚀 Configuração Rápida do GitHub OAuth

## ⚡ Passos Rápidos

### 1️⃣ Criar OAuth App no GitHub (2 minutos)

1. Acesse: https://github.com/settings/developers
2. Clique em **"New OAuth App"**
3. Preencha:
   - **Name**: `NodeGen Studio`
   - **Homepage URL**: `http://localhost:3000`
   - **Callback URL**: `http://localhost:3000/auth/github/callback`
4. Clique em **"Register application"**
5. **COPIE** o **Client ID** e **Client Secret**

### 2️⃣ Configurar no Convex (1 minuto)

**Opção A - Dashboard (Mais fácil):**
1. Acesse: https://dashboard.convex.dev
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Adicione apenas estas 2 variáveis:
   - `GITHUB_CLIENT_ID` = (cole o Client ID)
   - `GITHUB_CLIENT_SECRET` = (cole o Client Secret)
   
   ⚠️ **NÃO** adicione `CONVEX_SITE_URL` - ela é built-in e já existe automaticamente!
5. Clique em **Save**

**Opção B - Terminal:**
```bash
npx convex env set GITHUB_CLIENT_ID "seu_client_id"
npx convex env set GITHUB_CLIENT_SECRET "seu_client_secret"
```

⚠️ **NÃO** configure `CONVEX_SITE_URL` - ela já existe automaticamente!

### 3️⃣ Reiniciar Convex

```bash
# Pare o servidor (Ctrl+C) e reinicie:
npx convex dev
```

### 4️⃣ Testar

1. Adicione um nó GitHub no canvas
2. Clique em **"Conectar GitHub"**
3. Autorize no GitHub
4. Pronto! ✅

## ❌ Problemas Comuns

**"GITHUB_CLIENT_ID não configurado"**
→ Verifique se adicionou a variável no Convex Dashboard e reiniciou o servidor

**"redirect_uri_mismatch"**
→ Verifique se a Callback URL no GitHub é exatamente: `http://localhost:3000/auth/github/callback`

**Variáveis não funcionam**
→ Reinicie o servidor Convex após adicionar variáveis

## 📚 Documentação Completa

Veja `docs/GITHUB_OAUTH_SETUP.md` para detalhes completos.
