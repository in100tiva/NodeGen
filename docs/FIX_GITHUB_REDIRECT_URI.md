# 🔧 Como Corrigir o Erro "redirect_uri mismatch" do GitHub

## Problema

Você está vendo este erro ao tentar conectar o GitHub:
> "The `redirect_uri` is not associated with this application."

Isso acontece porque a **Callback URL** configurada no GitHub OAuth App não corresponde à URL que o Convex está usando.

## Solução Rápida

### Passo 1: Descobrir a URL Correta do Convex

A URL do callback deve ser a URL do Convex HTTP Actions (termina com `.convex.site`).

**Opção A: Via Convex Dashboard**
1. Acesse: https://dashboard.convex.dev
2. Selecione seu projeto
3. Vá em **Settings** → **URL & Deploy Key** (ou procure por informações de URL)
4. Procure por **"Site URL"** ou **"HTTP Actions URL"** (pode estar listada lá)
5. A URL será algo como: `https://wry-avocet-85.convex.site`
6. **OU** veja o nome do deployment no topo do dashboard (ex: `wry-avocet-85`) e use: `https://wry-avocet-85.convex.site`

**Opção B: Via Código (Query de Teste)**
1. No seu projeto, você pode usar a query `testGitHubConfig`:
   ```typescript
   const config = useQuery(api.testGitHub.testGitHubConfig);
   console.log(config);
   ```
2. Isso mostrará a `callbackUrl` que você precisa usar

**Opção C: Via Terminal**
1. Execute `npx convex dev` (se estiver em desenvolvimento)
2. Procure por uma linha que mostra:
   ```
   Site URL: https://wry-avocet-85.convex.site
   ```

### Passo 2: Atualizar a Callback URL no GitHub

1. Acesse: https://github.com/settings/developers
2. Clique no seu **OAuth App** (ou crie um novo se não tiver)
3. Role até **"Authorization callback URL"**
4. **SUBSTITUA** pela URL correta:

   ```
   https://wry-avocet-85.convex.site/auth/github/callback
   ```
   
   ⚠️ **IMPORTANTE**: 
   - Substitua `wry-avocet-85` pelo nome do SEU projeto Convex
   - A URL deve terminar com `.convex.site` (não `.convex.cloud`)
   - Deve incluir `/auth/github/callback` no final
   - Use `https://` (não `http://`)

5. Clique em **"Update application"**

### Passo 3: Verificar se Está Funcionando

1. Tente conectar o GitHub novamente no seu aplicativo
2. O erro deve desaparecer!

## Diferença entre URLs do Convex

| Tipo | URL | Uso |
|------|-----|-----|
| **Deployment URL** | `https://xxx.convex.cloud` | ✅ Use no `VITE_CONVEX_URL` (frontend) |
| **HTTP Actions URL** | `https://xxx.convex.site` | ✅ Use no GitHub OAuth Callback |

## Checklist

- [ ] Descobri a URL correta do Convex (termina com `.convex.site`)
- [ ] Atualizei a Callback URL no GitHub OAuth App
- [ ] A URL no GitHub corresponde EXATAMENTE à URL do Convex + `/auth/github/callback`
- [ ] Usei `https://` (não `http://`)
- [ ] Testei novamente a conexão

## Ainda Não Funciona?

Se ainda estiver com problemas:

1. **Verifique se não há espaços extras** na URL do GitHub
2. **Verifique se está usando `https://`** (não `http://`)
3. **Certifique-se de que a URL termina com `.convex.site`** (não `.convex.cloud`)
4. **Tente criar um novo OAuth App** no GitHub com a URL correta desde o início
5. **Verifique os logs do Convex** para ver qual URL está sendo gerada

## Exemplo Completo

Se a URL do seu Convex for `https://wry-avocet-85.convex.site`, então:

1. **No GitHub OAuth App**, configure:
   - **Authorization callback URL**: `https://wry-avocet-85.convex.site/auth/github/callback`

2. **No Convex Dashboard**, as variáveis devem estar:
   - `GITHUB_CLIENT_ID` = (seu Client ID)
   - `GITHUB_CLIENT_SECRET` = (seu Client Secret)
   - `CONVEX_SITE_URL` = (não precisa configurar manualmente - é built-in)

3. **No código**, o Convex automaticamente usará `CONVEX_SITE_URL` para gerar a URL de callback.

## Debug

Se quiser ver qual URL está sendo gerada, adicione logs temporários ou use a query `testGitHubConfig`:

```typescript
// No frontend
const config = useQuery(api.testGitHub.testGitHubConfig);
console.log("Callback URL que deve ser usada:", config?.callbackUrl);
```
