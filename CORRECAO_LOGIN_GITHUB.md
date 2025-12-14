# Correção Completa: Erro 404 no Login GitHub

## Problemas Identificados

1. ❌ **URL errada no GitHub OAuth App**: Está como `githu` (erro de digitação) ao invés de `github`
2. ❌ **URL de deployment incorreta**: O app está tentando usar `wry-avocet-85.convex.site` mas o deployment atual é `cautious-buzzard-249.convex.cloud`
3. ⚠️ **Variáveis de ambiente**: Podem não estar configuradas no deployment correto

## Solução Passo a Passo

### Passo 1: Corrigir URL no GitHub OAuth App

1. Acesse: https://github.com/settings/developers
2. Clique no seu OAuth App (Client ID: `Ov23liZUmIsColaYMHFp`)
3. No campo **Authorization callback URL**, corrija:
   - ❌ **ERRADO**: `https://cautious-buzzard-249.convex.cloud/api/auth/callback/githu`
   - ✅ **CORRETO**: `https://cautious-buzzard-249.convex.cloud/api/auth/callback/github`
   
   **IMPORTANTE**: Certifique-se de escrever `github` completo (não `githu`)
4. Clique em **Update application**

### Passo 2: Verificar/Criar arquivo .env.local

O app precisa de `VITE_CONVEX_URL` configurada. Crie ou atualize o arquivo `.env.local` na raiz do projeto:

```bash
VITE_CONVEX_URL=https://cautious-buzzard-249.convex.cloud
```

**IMPORTANTE**: 
- Use `.convex.cloud` (NÃO `.convex.site`)
- Use o deployment atual: `cautious-buzzard-249` (NÃO `wry-avocet-85`)

### Passo 3: Reiniciar o servidor de desenvolvimento

Após criar/atualizar o `.env.local`:

```bash
# Pare o servidor (Ctrl+C)
# Inicie novamente
npm run dev
```

### Passo 4: Verificar variáveis de ambiente no Convex

As variáveis `AUTH_GITHUB_ID` e `AUTH_GITHUB_SECRET` já foram configuradas no deployment de desenvolvimento. Se você estiver usando produção, configure também:

```bash
# Para verificar quais variáveis estão configuradas
npx convex env ls

# Se necessário, configurar novamente (já estão configuradas, mas pode repetir)
npx convex env set AUTH_GITHUB_ID Ov23liZUmIsColaYMHFp
npx convex env set AUTH_GITHUB_SECRET 88c6d8576afb184b35c26193c7ce285736007248
```

### Passo 5: Testar

1. Recarregue a página do app (F5)
2. Tente fazer login novamente
3. Agora deve funcionar!

## Resumo das URLs Corretas

### Deployment Convex Atual
- **URL**: `https://cautious-buzzard-249.convex.cloud`
- **Dashboard**: https://dashboard.convex.dev/d/cautious-buzzard-249

### GitHub OAuth App
- **Client ID**: `Ov23liZUmIsColaYMHFp`
- **Authorization callback URL**: `https://cautious-buzzard-249.convex.cloud/api/auth/callback/github`

### Variáveis de Ambiente
- `VITE_CONVEX_URL`: `https://cautious-buzzard-249.convex.cloud` (no `.env.local`)
- `AUTH_GITHUB_ID`: `Ov23liZUmIsColaYMHFp` (no Convex)
- `AUTH_GITHUB_SECRET`: `88c6d8576afb184b35c26193c7ce285736007248` (no Convex)

## Se Ainda Não Funcionar

1. **Limpe o cache do navegador** (Ctrl+Shift+Delete)
2. **Verifique o console do navegador** para erros
3. **Verifique os logs do Convex** no dashboard
4. **Certifique-se de que o `convex dev` está rodando** em outro terminal
