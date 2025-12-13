# ❌ Erro: URL Incorreta Configurada

## O Problema

Você está vendo este erro:
```
Invalid deployment address: "https://wry-avocet-85.convex.site" ends with .convex.site
```

## Por Que Aconteceu?

Você configurou a URL errada no Vercel:
- ❌ **Errado**: `https://xxx.convex.site`
- ✅ **Correto**: `https://xxx.convex.cloud`

### Diferença entre as URLs:

| URL | Uso |
|-----|-----|
| `.convex.cloud` | URL do deployment (use no `VITE_CONVEX_URL`) |
| `.convex.site` | URL para HTTP Actions (backend routes) |

## A Solução

### 1. Sua URL Correta

Baseado no seu projeto, a URL correta é:
```
https://cautious-buzzard-249.convex.cloud
```

### 2. Corrigir no Vercel

1. Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecione seu projeto NodeGen
3. **Settings** → **Environment Variables**
4. Encontre `VITE_CONVEX_URL`
5. Clique no ícone de **editar** (lápis)
6. **Altere o valor para**:
   ```
   https://cautious-buzzard-249.convex.cloud
   ```
7. Clique em **Save**

### 3. Fazer Redeploy

1. Vá para **Deployments**
2. Clique nos `...` do último deployment
3. **Redeploy**
4. Aguarde completar

✅ **Pronto!** A aplicação deve funcionar agora.

## Como Verificar Se Está Correto

Após fazer o redeploy, abra o Console do navegador (F12):

- ✅ **Sucesso**: Aplicação carrega normalmente
- ❌ **Ainda erro**: Verifique se salvou a URL correta

## URLs do Seu Projeto

Para referência futura:

```
Deployment URL (Frontend): https://cautious-buzzard-249.convex.cloud
HTTP Actions URL (Backend): https://cautious-buzzard-249.convex.site
```

Use a primeira (`.cloud`) no `VITE_CONVEX_URL`!
