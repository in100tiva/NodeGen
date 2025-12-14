# 🔧 Solução para Erro "Server Error" no signIn

## Problema

Ao tentar fazer login, aparece o erro:
```
[CONVEX A(auth:signIn)] [Request ID: ...] Server Error
```

## Causa Raiz

O erro ocorre porque a variável de ambiente **`SITE_URL`** não está configurada no Convex Dashboard ou está configurada incorretamente.

O Convex Auth **requer** que `SITE_URL` esteja configurada para funcionar corretamente. Sem ela, o `signIn` falha com "Server Error".

## Solução

### 1. Configurar SITE_URL no Convex Dashboard

1. Acesse: https://dashboard.convex.dev
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Certifique-se de estar na aba **Production** (não Development)
5. Verifique se existe a variável `SITE_URL`
6. Se não existir ou estiver incorreta, configure:
   - **Name**: `SITE_URL`
   - **Value**: `https://cautious-buzzard-249.convex.site`
   
   ⚠️ **IMPORTANTE**: 
   - Use a URL do HTTP Actions (termina com `.convex.site`)
   - Use `https://` (não `http://`)
   - Não adicione trailing slash no final
   - **NÃO** use `.convex.cloud` - use `.convex.site`

### 2. Verificar outras variáveis necessárias

Certifique-se de que também estão configuradas:
- `AUTH_GITHUB_ID` - Client ID do GitHub OAuth App
- `AUTH_GITHUB_SECRET` - Client Secret do GitHub OAuth App

### 3. Verificar URL de Callback no GitHub

1. Acesse: https://github.com/settings/developers
2. Selecione seu OAuth App
3. Verifique o campo **Authorization callback URL**
4. Deve ser exatamente:
   ```
   https://cautious-buzzard-249.convex.site/api/auth/callback/github
   ```

### 4. Aguardar e testar

1. Após configurar `SITE_URL`, aguarde alguns segundos (o Convex precisa processar)
2. Faça deploy novamente se necessário:
   ```bash
   npx convex deploy
   ```
3. Teste o login novamente

## Verificação Rápida

Execute no terminal para verificar as variáveis:

```bash
# Verificar variáveis de ambiente no Convex
npx convex env list
```

Você deve ver:
- `SITE_URL` ✅ (deve ser `https://cautious-buzzard-249.convex.site`)
- `AUTH_GITHUB_ID` ✅
- `AUTH_GITHUB_SECRET` ✅

## Por que isso acontece?

O Convex Auth usa `SITE_URL` para:
- Gerar URLs de callback OAuth
- Redirecionar usuários após autenticação
- Gerar links mágicos (se usar email)

Sem `SITE_URL`, o Convex Auth não consegue processar o fluxo de autenticação e retorna "Server Error".

## Diferença entre URLs

| Variável | Uso | Valor Exemplo |
|----------|-----|---------------|
| `SITE_URL` | ✅ **Convex Auth** - URL base da aplicação | `https://cautious-buzzard-249.convex.site` |
| `CONVEX_SITE_URL` | Built-in do Convex (HTTP Actions URL) | `https://cautious-buzzard-249.convex.site` |
| `VITE_CONVEX_URL` | Frontend - URL do deployment | `https://cautious-buzzard-249.convex.cloud` |

**IMPORTANTE**: 
- `SITE_URL` e `CONVEX_SITE_URL` devem usar `.convex.site`
- `VITE_CONVEX_URL` deve usar `.convex.cloud`

## Checklist Final

- [ ] `SITE_URL` configurada no Convex Dashboard (Production)
- [ ] Valor é `https://cautious-buzzard-249.convex.site` (termina com `.convex.site`)
- [ ] Usei `https://` (não `http://`)
- [ ] Não há trailing slash no final
- [ ] `AUTH_GITHUB_ID` configurada
- [ ] `AUTH_GITHUB_SECRET` configurada
- [ ] URL de callback no GitHub está correta
- [ ] Aguardei alguns segundos após configurar
- [ ] Testei novamente o login

## Se Ainda Não Funcionar

1. **Verifique os logs do Convex:**
   - Acesse: https://dashboard.convex.dev → **Logs**
   - Procure por erros relacionados a `auth:signIn` ou `SITE_URL`

2. **Limpe o cache do navegador** e tente novamente

3. **Verifique se está usando a URL correta** do deployment

4. **Teste em modo anônimo/privado** do navegador

5. **Verifique se o GitHub OAuth App está ativo** e não foi desabilitado
