# 🔧 Como Corrigir o Erro "redirect_uri mismatch"

## Problema

Você está vendo este erro do GitHub:
> "The `redirect_uri` is not associated with this application."

Isso acontece porque a **Callback URL** configurada no GitHub OAuth App não corresponde à URL que o Convex está usando.

## Solução Passo a Passo

### 1️⃣ Descobrir a URL Real do Convex

A URL do Convex depende do ambiente:

**Para Desenvolvimento Local:**
- Se você está rodando `npm run dev` ou `vite`, a URL é: `http://localhost:3000`
- Mas o Convex pode estar usando uma URL diferente!

**Para descobrir a URL correta:**

1. Abra o terminal onde está rodando `npx convex dev`
2. Procure por uma linha que mostra algo como:
   ```
   Deployment URL: https://seu-projeto.convex.site
   ```
   ou
   ```
   Site URL: http://localhost:3000
   ```

3. **OU** verifique no Convex Dashboard:
   - Acesse: https://dashboard.convex.dev
   - Selecione seu projeto
   - Veja o nome do deployment no topo (ex: `wry-avocet-85`)
   - A URL será: `https://wry-avocet-85.convex.site`
   - **OU** vá em **Settings** → **URL & Deploy Key** e procure por informações de URL

### 2️⃣ Atualizar a Callback URL no GitHub

1. Acesse: https://github.com/settings/developers
2. Clique no seu OAuth App
3. Role até **"Authorization callback URL"**
4. **SUBSTITUA** pela URL correta:

   **Para desenvolvimento local:**
   ```
   http://localhost:3000/auth/github/callback
   ```

   **Para produção (se já deployou):**
   ```
   https://seu-projeto.convex.site/auth/github/callback
   ```
   
   ⚠️ **IMPORTANTE**: Use a URL **EXATA** que aparece no Convex Dashboard!

5. Clique em **"Update application"**

### 3️⃣ Verificar se Está Funcionando

1. Reinicie o servidor Convex (se necessário)
2. Tente conectar o GitHub novamente
3. O erro deve desaparecer!

## URLs Comuns do Convex

- **Desenvolvimento**: `http://localhost:3000` (se estiver rodando localmente)
- **Produção**: `https://[seu-projeto].convex.site` (substitua `[seu-projeto]` pelo nome do seu projeto)

## Dica: Verificar a URL Usada pelo Código

Você pode adicionar um log temporário para ver qual URL está sendo usada:

```typescript
// Em convex/github.ts, adicione temporariamente:
console.log("Site URL:", process.env.CONVEX_SITE_URL);
console.log("Redirect URI:", redirectUri);
```

Depois verifique os logs no terminal do Convex para ver qual URL está sendo gerada.

## Checklist

- [ ] Descobri a URL correta do Convex (Dashboard ou terminal)
- [ ] Atualizei a Callback URL no GitHub OAuth App
- [ ] A URL no GitHub corresponde EXATAMENTE à URL do Convex + `/auth/github/callback`
- [ ] Reiniciei o servidor Convex
- [ ] Testei novamente a conexão

## Ainda Não Funciona?

Se ainda estiver com problemas:

1. Verifique se não há espaços extras na URL do GitHub
2. Verifique se está usando `http://` vs `https://` corretamente
3. Certifique-se de que a porta está correta (geralmente `:3000` para desenvolvimento)
4. Tente criar um novo OAuth App no GitHub com a URL correta desde o início

