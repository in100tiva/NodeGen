# 🔧 Corrigir Erro de SignIn em Produção

## Problema

Após a autenticação com GitHub, a tela fica preta e aparece o erro:
```
[CONVEX A(auth:signIn)] [Request ID: ...] Server Error
```

## Possíveis Causas

### 1. Variável `SITE_URL` não configurada ou incorreta

O Convex Auth precisa da variável `SITE_URL` para funcionar corretamente.

**Solução:**
1. Acesse: https://dashboard.convex.dev
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Certifique-se de estar na aba **Production**
5. Verifique se existe a variável `SITE_URL`
6. Se não existir ou estiver incorreta, configure:
   - **Name**: `SITE_URL`
   - **Value**: `https://cautious-buzzard-249.convex.site`
   
   ⚠️ **IMPORTANTE**: 
   - Use a URL do HTTP Actions (termina com `.convex.site`)
   - Use `https://` (não `http://`)
   - Não adicione trailing slash no final

### 2. Variáveis `AUTH_GITHUB_ID` ou `AUTH_GITHUB_SECRET` não configuradas

**Solução:**
1. No Convex Dashboard → **Settings** → **Environment Variables** → **Production**
2. Verifique se existem:
   - `AUTH_GITHUB_ID`
   - `AUTH_GITHUB_SECRET`
3. Se não existirem, configure-as com os valores do seu GitHub OAuth App

### 3. URL de Callback incorreta no GitHub OAuth App

**Solução:**
1. Acesse: https://github.com/settings/developers
2. Selecione seu OAuth App
3. Verifique o campo **Authorization callback URL**
4. Deve ser exatamente:
   ```
   https://cautious-buzzard-249.convex.site/api/auth/callback/github
   ```
   
   ⚠️ **IMPORTANTE**: 
   - Deve terminar com `/callback/github`
   - Use `https://` (não `http://`)
   - Use `.convex.site` (não `.convex.cloud`)

### 4. Problema com o callback após autenticação

O erro pode ocorrer quando o callback do GitHub retorna, mas o Convex não consegue processar.

**Solução:**
1. Verifique os logs do Convex:
   - Acesse: https://dashboard.convex.dev
   - Vá em **Logs**
   - Procure por erros relacionados a `auth:signIn`

2. Verifique se o callback está sendo chamado:
   - Abra o DevTools do navegador
   - Vá na aba **Network**
   - Procure por requisições para `/api/auth/callback/github`
   - Verifique se há erros (status 500, 400, etc.)

## Verificação Rápida

Execute no terminal para verificar a configuração:

```bash
# Verificar variáveis de ambiente no Convex
npx convex env list
```

Você deve ver:
- `AUTH_GITHUB_ID` ✅
- `AUTH_GITHUB_SECRET` ✅
- `SITE_URL` ✅

## Teste de Diagnóstico

1. **Verificar configuração via código:**
   - A página de login agora verifica automaticamente a configuração
   - Se houver problemas, uma mensagem amarela aparecerá no topo

2. **Verificar logs do servidor:**
   - Acesse: https://dashboard.convex.dev → **Logs**
   - Procure por erros relacionados a autenticação
   - Verifique se há mensagens de warning sobre variáveis não configuradas

3. **Verificar callback URL:**
   - Após clicar em "Continuar com GitHub"
   - Verifique no console do navegador se há erros
   - Verifique na aba Network se o callback está sendo chamado

## Solução Passo a Passo

1. **Configure todas as variáveis de ambiente no Convex Dashboard:**
   ```
   SITE_URL = https://cautious-buzzard-249.convex.site
   AUTH_GITHUB_ID = seu_client_id
   AUTH_GITHUB_SECRET = seu_client_secret
   ```

2. **Verifique a URL de callback no GitHub:**
   ```
   https://cautious-buzzard-249.convex.site/api/auth/callback/github
   ```

3. **Aguarde alguns segundos** após configurar as variáveis (o Convex precisa processar)

4. **Faça deploy novamente** (se necessário):
   ```bash
   npx convex deploy
   ```

5. **Teste novamente** o login

## Se Ainda Não Funcionar

1. **Limpe o cache do navegador** e tente novamente
2. **Verifique se está usando a URL correta** do deployment (`.convex.cloud` para o frontend, `.convex.site` para o callback)
3. **Verifique os logs detalhados** no Convex Dashboard
4. **Teste em modo anônimo/privado** do navegador para descartar problemas de cache

## Notas Importantes

- A variável `SITE_URL` deve apontar para a URL do HTTP Actions (`.convex.site`)
- A variável `VITE_CONVEX_URL` (usada no frontend) deve apontar para a URL do deployment (`.convex.cloud`)
- Essas são URLs diferentes e ambas são necessárias!

## Checklist Final

- [ ] `SITE_URL` configurada no Convex Dashboard (Production)
- [ ] `AUTH_GITHUB_ID` configurada no Convex Dashboard (Production)
- [ ] `AUTH_GITHUB_SECRET` configurada no Convex Dashboard (Production)
- [ ] URL de callback no GitHub OAuth App está correta
- [ ] Aguardou alguns segundos após configurar as variáveis
- [ ] Testou novamente o login
- [ ] Verificou os logs do Convex para erros adicionais
