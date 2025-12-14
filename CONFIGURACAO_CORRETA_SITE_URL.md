# ✅ Configuração Correta do SITE_URL

## Problema Identificado

Você está tendo três erros diferentes:

1. **404 ao usar `.convex.site` como SITE_URL**: 
   - `GET https://cautious-buzzard-249.convex.site/?code=... 404`
   - Isso acontece porque `.convex.site` é para HTTP Actions, não para servir o frontend

2. **404 ao usar produção `.convex.site`**:
   - `GET https://wry-avocet-85.convex.site/?code=... 404`
   - Mesmo problema - essa URL não serve o frontend

3. **Server Error ao usar domínio customizado**:
   - `[CONVEX A(auth:signIn)] Server Error` quando usa `https://nodegen.in100tiva.com/`
   - Isso pode ser trailing slash ou configuração incorreta

## Solução Correta

### 1. Configurar SITE_URL no Convex Dashboard

**SITE_URL deve ser a URL do seu frontend (onde o usuário acessa o site):**

```
SITE_URL = https://nodegen.in100tiva.com
```

⚠️ **IMPORTANTE**:
- ✅ Use `https://nodegen.in100tiva.com` (sem trailing slash `/`)
- ❌ NÃO use `https://nodegen.in100tiva.com/` (com trailing slash)
- ❌ NÃO use URLs `.convex.site` (essas são para HTTP Actions)
- ❌ NÃO use URLs `.convex.cloud` (essas são para o deployment)

### 2. Configurar Callback URL no GitHub OAuth App

O callback URL no GitHub deve apontar para o **endpoint do Convex Auth** (não para o frontend):

```
https://wry-avocet-85.convex.site/api/auth/callback/github
```

⚠️ **IMPORTANTE**:
- ✅ Use a URL de produção do Convex (`.convex.site`)
- ✅ Deve terminar com `/api/auth/callback/github`
- ❌ NÃO use a URL do frontend (`https://nodegen.in100tiva.com`)

### 3. Resumo das URLs

| Variável/Configuração | Valor Correto | Explicação |
|----------------------|---------------|------------|
| **SITE_URL** (Convex Dashboard) | `https://nodegen.in100tiva.com` | URL do frontend onde o usuário acessa |
| **Callback URL** (GitHub OAuth App) | `https://wry-avocet-85.convex.site/api/auth/callback/github` | Endpoint do Convex Auth |
| **VITE_CONVEX_URL** (Vercel) | `https://wry-avocet-85.convex.cloud` | URL do deployment Convex para o frontend |

## Passo a Passo

### 1. Configurar SITE_URL no Convex

1. Acesse: https://dashboard.convex.dev
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Selecione a aba **Production**
5. Configure ou atualize:
   - **Name**: `SITE_URL`
   - **Value**: `https://nodegen.in100tiva.com` (sem trailing slash)

### 2. Verificar Callback URL no GitHub

1. Acesse: https://github.com/settings/developers
2. Selecione seu OAuth App
3. Verifique o campo **Authorization callback URL**
4. Deve ser: `https://wry-avocet-85.convex.site/api/auth/callback/github`
5. Se estiver diferente, atualize e salve

### 3. Aguardar e Testar

1. Aguarde alguns segundos após configurar `SITE_URL` (o Convex precisa processar)
2. Limpe o cache do navegador
3. Teste o login novamente

## Por que isso funciona?

1. **SITE_URL = URL do frontend**: O Convex Auth usa isso para redirecionar o usuário de volta para o seu site após a autenticação
2. **Callback URL = Endpoint do Convex**: O GitHub redireciona para o endpoint do Convex Auth, que processa a autenticação
3. **Fluxo correto**:
   - Usuário clica em "Login com GitHub" no frontend (`https://nodegen.in100tiva.com`)
   - É redirecionado para GitHub
   - GitHub redireciona para `https://wry-avocet-85.convex.site/api/auth/callback/github`
   - Convex Auth processa e redireciona de volta para `https://nodegen.in100tiva.com` (usando SITE_URL)

## Verificação

Execute no terminal:

```bash
# Verificar variáveis de ambiente
npx convex env list
```

Você deve ver:
- `SITE_URL` = `https://nodegen.in100tiva.com` ✅
- `AUTH_GITHUB_ID` ✅
- `AUTH_GITHUB_SECRET` ✅

## Se Ainda Não Funcionar

1. **Verifique se não há trailing slash** em `SITE_URL`
2. **Verifique os logs do Convex**: https://dashboard.convex.dev → Logs
3. **Teste em modo anônimo** do navegador
4. **Verifique se o GitHub OAuth App está ativo**
