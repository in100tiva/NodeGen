# 🔧 Como Corrigir o Erro 500 no Callback do GitHub OAuth

## Problema

Após configurar corretamente a `redirect_uri` no GitHub OAuth App, você está vendo um erro 500 quando o GitHub redireciona para o callback:

```
GET https://wry-avocet-85.convex.site/api/auth/callback/github?code=... 500 (Internal Server Error)
{"code":"[Request ID: ...] Server Error"}
```

## Causas Possíveis

O erro 500 geralmente acontece por uma destas razões:

1. **Variáveis de ambiente não configuradas** - `AUTH_GITHUB_ID` ou `AUTH_GITHUB_SECRET` estão faltando
2. **Variáveis de ambiente incorretas** - Os valores estão errados ou vazios
3. **Problema na configuração do Convex Auth** - O provider GitHub não está sendo inicializado corretamente

## Solução Passo a Passo

### Passo 1: Verificar Variáveis de Ambiente no Convex

1. Acesse: https://dashboard.convex.dev
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Verifique se as seguintes variáveis estão configuradas:
   - `AUTH_GITHUB_ID` - Deve ter um valor (não vazio)
   - `AUTH_GITHUB_SECRET` - Deve ter um valor (não vazio)

### Passo 2: Verificar se os Valores Estão Corretos

1. No Convex Dashboard, clique no ícone de olho (👁️) ao lado de cada variável para ver o valor
2. Verifique se:
   - `AUTH_GITHUB_ID` corresponde ao **Client ID** do seu GitHub OAuth App
   - `AUTH_GITHUB_SECRET` corresponde ao **Client Secret** do seu GitHub OAuth App

### Passo 3: Verificar Configuração via Query

Use a query `checkAuthConfig` para verificar se tudo está configurado:

```typescript
// No console do navegador ou no código React
const config = useQuery(api.auth.checkAuthConfig);
console.log(config);
```

Isso mostrará:
- Se as variáveis estão configuradas
- Quais variáveis estão faltando
- O tamanho dos valores (para verificar se não estão vazios)

### Passo 4: Reconfigurar Variáveis (se necessário)

Se as variáveis estiverem faltando ou incorretas:

**Via Terminal:**
```bash
npx convex env set AUTH_GITHUB_ID <seu_client_id>
npx convex env set AUTH_GITHUB_SECRET <seu_client_secret>
```

**Via Dashboard:**
1. No Convex Dashboard → Settings → Environment Variables
2. Clique em **"Add"** para adicionar novas variáveis
3. Ou clique no ícone de edição para atualizar existentes

### Passo 5: Verificar Logs do Convex

1. No Convex Dashboard, vá em **Logs**
2. Procure por erros relacionados a autenticação
3. Procure por mensagens que mencionam `AUTH_GITHUB_ID` ou `AUTH_GITHUB_SECRET`
4. Verifique se há avisos sobre variáveis não configuradas

### Passo 6: Aguardar Propagação

Após configurar ou atualizar as variáveis de ambiente:
1. Aguarde alguns segundos para o Convex processar as mudanças
2. Tente fazer login novamente

## Verificação Rápida

Execute esta verificação para diagnosticar o problema:

```typescript
// No console do navegador
const config = await fetch('https://wry-avocet-85.convex.site/api/auth/checkAuthConfig')
  .then(r => r.json());
console.log(config);
```

Ou use a query no código:

```typescript
const config = useQuery(api.auth.checkAuthConfig);
if (!config?.configured) {
  console.error('Variáveis faltando:', config?.missing);
}
```

## Checklist

- [ ] `AUTH_GITHUB_ID` está configurada no Convex Dashboard
- [ ] `AUTH_GITHUB_SECRET` está configurada no Convex Dashboard
- [ ] Os valores correspondem ao GitHub OAuth App
- [ ] As variáveis não estão vazias
- [ ] Verifiquei os logs do Convex para erros
- [ ] Aguardei alguns segundos após configurar as variáveis
- [ ] Tentei fazer login novamente

## Ainda Não Funciona?

Se ainda estiver com erro 500:

1. **Verifique os logs do Convex** para ver a mensagem de erro completa
2. **Crie um novo GitHub OAuth App** e use novos valores
3. **Verifique se está usando o deployment correto** (dev vs prod)
4. **Tente fazer deploy novamente** do código Convex:
   ```bash
   npx convex deploy
   ```

## Diferença entre Variáveis

Este projeto usa **duas configurações diferentes** de GitHub OAuth:

1. **Autenticação de Usuário** (Convex Auth):
   - Variáveis: `AUTH_GITHUB_ID` e `AUTH_GITHUB_SECRET`
   - Callback: `/api/auth/callback/github`
   - Usado para: Login de usuários no aplicativo

2. **Tokens de API do GitHub** (para nodes):
   - Variáveis: `GITHUB_CLIENT_ID` e `GITHUB_CLIENT_SECRET`
   - Callback: `/auth/github/callback`
   - Usado para: Obter tokens de API para usar nos nodes GitHub

**Para o erro atual**, você precisa verificar as variáveis do tipo 1 (`AUTH_GITHUB_ID` e `AUTH_GITHUB_SECRET`).
