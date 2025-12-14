# Correção: URL do Convex na Vercel

## Problema

O erro que você está vendo:
```
Invalid deployment address: "https://wry-avocet-85.convex.site" ends with .convex.site
```

Isso acontece porque a variável de ambiente `VITE_CONVEX_URL` na Vercel está configurada com uma URL que termina em `.convex.site` em vez de `.convex.cloud`.

## Diferença entre as URLs

| Tipo | URL | Uso |
|------|-----|-----|
| **Deployment URL** | `https://xxx.convex.cloud` | ✅ Use esta no `VITE_CONVEX_URL` |
| **HTTP Actions URL** | `https://xxx.convex.site` | ❌ NÃO use esta no `VITE_CONVEX_URL` |

## Solução Automática (Já Implementada)

O código agora corrige automaticamente URLs que terminam com `.convex.site` para `.convex.cloud`. Isso permite que o projeto funcione mesmo se a URL estiver incorreta na Vercel.

**Mas você ainda deve corrigir a variável na Vercel para evitar avisos no console!**

## Como Corrigir na Vercel

### Passo 1: Obter a URL Correta

Execute no terminal local:
```bash
npx convex dev --once
```

Procure por:
```
Deployment URL: https://wry-avocet-85.convex.cloud
```

**OU** acesse o [Dashboard do Convex](https://dashboard.convex.dev):
1. Selecione seu projeto
2. Vá em **Settings** → **URL & Deploy Key**
3. Copie a **Deployment URL** (deve terminar com `.convex.cloud`)

### Passo 2: Atualizar na Vercel

1. Acesse o [Dashboard do Vercel](https://vercel.com/dashboard)
2. Vá para seu projeto
3. Clique em **Settings** → **Environment Variables**
4. Encontre a variável `VITE_CONVEX_URL`
5. Clique em **Edit**
6. Altere o valor de:
   - ❌ `https://wry-avocet-85.convex.site` (ERRADO)
   - ✅ `https://wry-avocet-85.convex.cloud` (CORRETO)
7. Certifique-se de que está configurada para **Production**, **Preview** e **Development**
8. Clique em **Save**

### Passo 3: Fazer Redeploy

1. Vá para **Deployments** no Vercel
2. Clique nos três pontos (`...`) no último deployment
3. Clique em **Redeploy**

## Verificação

Após o redeploy, abra o Console do navegador (F12):
- ✅ **Sucesso**: Não deve aparecer mais o erro sobre `.convex.site`
- ✅ **Aviso**: Pode aparecer um aviso sobre correção automática (isso é normal até você atualizar na Vercel)

## Por que isso aconteceu?

O Convex fornece duas URLs diferentes:
- **`.convex.cloud`**: Para o deployment principal (usado pelo frontend)
- **`.convex.site`**: Para HTTP Actions (rotas HTTP do backend)

É fácil confundir as duas, especialmente porque ambas aparecem no dashboard do Convex.

## Prevenção

Sempre verifique que a URL termina com `.convex.cloud` antes de configurar no Vercel. O código agora valida e corrige automaticamente, mas é melhor configurar corretamente desde o início.
