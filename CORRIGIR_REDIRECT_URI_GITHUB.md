# 🔧 Como Corrigir o Erro "redirect_uri is not associated with this application"

## Problema

Ao tentar fazer login com GitHub, você vê este erro:
> **"Be careful! The `redirect_uri` is not associated with this application."**

Isso acontece porque a **Authorization callback URL** configurada no GitHub OAuth App não corresponde à URL que o Convex Auth está usando.

## Solução Passo a Passo

### Passo 1: Descobrir a URL Correta de Callback

A URL de callback para autenticação de usuário (Convex Auth) é:
```
https://[seu-projeto].convex.site/api/auth/callback/github
```

**Opção A: Via Código (Query) - RECOMENDADO**
1. Abra o console do navegador (F12)
2. No console, execute:
   ```javascript
   // A query já está sendo executada na página de login
   // Se você ver o erro de redirect_uri, a URL correta já aparece na mensagem de erro!
   ```
3. **OU** se você estiver no código React, use:
   ```typescript
      const config = useQuery(api.auth.checkAuthConfig);
      console.log("Callback URL:", config?.callbackUrl);
   ```
4. Isso mostrará a URL exata que você precisa configurar no GitHub

**Opção B: Via Página de Login (Mais Fácil)**
1. Tente fazer login com GitHub
2. Quando aparecer o erro de `redirect_uri`, a página de login mostrará automaticamente a URL correta que você precisa configurar
3. Copie essa URL e use no GitHub OAuth App

**Opção C: Via Convex Dashboard**
1. Acesse: https://dashboard.convex.dev
2. Selecione seu projeto
3. Vá em **Settings** → **URL & Deploy Key**
4. Procure por **"Site URL"** ou **"HTTP Actions URL"** (pode estar listada lá)
5. A URL será algo como: `https://wry-avocet-85.convex.site`
6. A URL completa de callback será: `https://wry-avocet-85.convex.site/api/auth/callback/github`

**Opção D: Via Terminal**
1. Execute `npx convex dev` (se estiver em desenvolvimento)
2. Procure por uma linha que mostra:
   ```
   Site URL: https://wry-avocet-85.convex.site
   ```
   ou
   ```
   HTTP Actions URL: https://wry-avocet-85.convex.site
   ```
3. A URL completa de callback será: `https://wry-avocet-85.convex.site/api/auth/callback/github`

**Opção E: Pelo Nome do Deployment**
Se você sabe o nome do seu deployment (ex: `wry-avocet-85`), a URL será:
```
https://wry-avocet-85.convex.site/api/auth/callback/github
```
Você pode ver o nome do deployment no topo do Convex Dashboard ou na URL quando acessa o dashboard.

### Passo 2: Atualizar a Callback URL no GitHub OAuth App

1. Acesse: https://github.com/settings/developers
2. Clique no seu **OAuth App** (ou crie um novo se não tiver)
3. Role até **"Authorization callback URL"**
4. **SUBSTITUA** pela URL correta que você descobriu no Passo 1:

   ```
   https://wry-avocet-85.convex.site/api/auth/callback/github
   ```
   
   ⚠️ **IMPORTANTE**: 
   - Substitua `wry-avocet-85` pelo nome do SEU projeto Convex
   - A URL deve terminar com `.convex.site` (não `.convex.cloud`)
   - Deve incluir `/api/auth/callback/github` no final (não `/auth/github/callback`)
   - Use `https://` (não `http://`)
   - Não adicione trailing slash no final

5. Clique em **"Update application"**

### Passo 3: Verificar se Está Funcionando

1. Aguarde alguns segundos para o GitHub processar a atualização
2. Tente fazer login com GitHub novamente no seu aplicativo
3. O erro deve desaparecer!

## Diferença entre URLs do Convex

| Tipo | URL | Uso |
|------|-----|-----|
| **Deployment URL** | `https://xxx.convex.cloud` | ✅ Use no `VITE_CONVEX_URL` (frontend) |
| **HTTP Actions URL** | `https://xxx.convex.site` | ✅ Use no GitHub OAuth Callback |

## Diferença entre Callbacks

Este projeto usa **dois tipos diferentes** de OAuth GitHub:

1. **Autenticação de Usuário** (Convex Auth):
   - URL: `https://xxx.convex.site/api/auth/callback/github`
   - Usa: `AUTH_GITHUB_ID` e `AUTH_GITHUB_SECRET`
   - Gerenciado por: `@convex-dev/auth`

2. **Tokens de API do GitHub** (para nodes):
   - URL: `https://xxx.convex.site/auth/github/callback`
   - Usa: `GITHUB_CLIENT_ID` e `GITHUB_CLIENT_SECRET`
   - Gerenciado por: `convex/http.ts`

**Para o erro atual**, você precisa configurar a URL do tipo 1 (`/api/auth/callback/github`).

## Checklist

- [ ] Descobri a URL correta do Convex (termina com `.convex.site`)
- [ ] Atualizei a Callback URL no GitHub OAuth App
- [ ] A URL no GitHub corresponde EXATAMENTE à URL do Convex + `/api/auth/callback/github`
- [ ] Usei `https://` (não `http://`)
- [ ] Não há trailing slash no final
- [ ] Testei novamente a conexão

## Ainda Não Funciona?

Se ainda estiver com problemas:

1. **Verifique se não há espaços extras** na URL do GitHub
2. **Verifique se está usando `https://`** (não `http://`)
3. **Certifique-se de que a URL termina com `.convex.site`** (não `.convex.cloud`)
4. **Verifique se o caminho é `/api/auth/callback/github`** (não `/auth/github/callback`)
5. **Tente criar um novo OAuth App** no GitHub com a URL correta desde o início
6. **Verifique os logs do Convex** para ver qual URL está sendo gerada
7. **Aguarde alguns minutos** após atualizar - o GitHub pode levar um tempo para processar

## Exemplo Completo

Se a URL do seu Convex for `https://wry-avocet-85.convex.site`, então:

1. **No GitHub OAuth App**, configure:
   - **Authorization callback URL**: `https://wry-avocet-85.convex.site/api/auth/callback/github`

2. **No Convex Dashboard**, as variáveis devem estar:
   - `AUTH_GITHUB_ID` = (seu Client ID)
   - `AUTH_GITHUB_SECRET` = (seu Client Secret)
   - `CONVEX_SITE_URL` = (não precisa configurar manualmente - é built-in)

3. **No código**, o Convex Auth automaticamente usará `CONVEX_SITE_URL` para gerar a URL de callback.

## Debug

Se quiser ver qual URL está sendo gerada, use a query `checkAuthConfig`:

```typescript
// No frontend
const config = useQuery(api.auth.checkAuthConfig);
console.log("Site URL:", config?.siteUrl);
console.log("Callback URL que deve ser usada:", config?.callbackUrl);
```

Isso mostrará exatamente qual URL você precisa configurar no GitHub OAuth App.
