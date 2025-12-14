# Correção: Configurar Variáveis de Ambiente AUTH_GITHUB

## Problema
O `client_id` está aparecendo como `undefined` na URL de autorização do GitHub porque as variáveis de ambiente `AUTH_GITHUB_ID` e `AUTH_GITHUB_SECRET` não estão configuradas no Convex.

## Solução

Você precisa configurar as variáveis de ambiente `AUTH_GITHUB_ID` e `AUTH_GITHUB_SECRET` no Convex.

### Opção 1: Usar o mesmo GitHub OAuth App (Recomendado)

Se você já tem um GitHub OAuth App configurado (que já tem `GITHUB_CLIENT_ID`), pode usar os mesmos valores:

```bash
# Configure usando os mesmos valores do GITHUB_CLIENT_ID existente
npx convex env set AUTH_GITHUB_ID Ov23liZUmIsColaYMHFp
npx convex env set AUTH_GITHUB_SECRET 88c6d8576afb184b35c26193c7ce285736007248
```

**IMPORTANTE**: Você precisa atualizar a **Authorization callback URL** no GitHub OAuth App para incluir:
- `https://cautious-buzzard-249.convex.cloud/api/auth/callback/github` (para autenticação de usuário)

Você pode ter múltiplas URLs de callback no mesmo OAuth App.

### Opção 2: Usar o Convex Dashboard

1. Acesse: https://dashboard.convex.dev/d/cautious-buzzard-249
2. Vá em **Settings** → **Environment Variables**
3. Clique em **Add Variable**
4. Adicione:
   - **Name**: `AUTH_GITHUB_ID`
   - **Value**: `Ov23liZUmIsColaYMHFp` (ou o Client ID do seu GitHub OAuth App)
5. Clique em **Add Variable** novamente e adicione:
   - **Name**: `AUTH_GITHUB_SECRET`
   - **Value**: `88c6d8576afb184b35c26193c7ce285736007248` (ou o Client Secret do seu GitHub OAuth App)

### Opção 3: Criar um novo GitHub OAuth App (Opcional)

Se preferir ter um OAuth App separado para autenticação:

1. Acesse [GitHub Developer Settings](https://github.com/settings/developers)
2. Clique em **New OAuth App**
3. Preencha:
   - **Application name**: `NodeGen Studio Auth` (ou qualquer nome)
   - **Homepage URL**: `http://localhost:3000` (ou sua URL de produção)
   - **Authorization callback URL**: `https://cautious-buzzard-249.convex.cloud/api/auth/callback/github`
4. Clique em **Register application**
5. Copie o **Client ID** e gere um **Client Secret**
6. Configure no Convex usando os comandos acima com os novos valores

## Verificar Configuração

Após configurar, você pode verificar se as variáveis estão corretas:

```bash
npx convex env ls
```

Você deve ver ambas as variáveis listadas:
- `AUTH_GITHUB_ID`
- `AUTH_GITHUB_SECRET`

## Atualizar GitHub OAuth App

**CRÍTICO**: Certifique-se de que seu GitHub OAuth App tem a URL de callback correta:

1. Acesse [GitHub Developer Settings](https://github.com/settings/developers)
2. Clique no seu OAuth App
3. Em **Authorization callback URL**, certifique-se de que inclui:
   - `https://cautious-buzzard-249.convex.cloud/api/auth/callback/github`
   - Você pode ter múltiplas URLs (separadas por vírgula ou uma por linha, dependendo da interface)

## Testar

Após configurar:

1. Recarregue a página do seu app
2. Tente fazer login novamente
3. O `client_id` deve aparecer corretamente na URL do GitHub

## Nota sobre URLs

O Convex usa duas URLs diferentes para autenticação:
- **Autenticação de usuário** (Convex Auth): `/api/auth/callback/github`
- **Tokens de API do GitHub** (para nodes): `/auth/github/callback`

Ambas precisam estar configuradas no GitHub OAuth App se você estiver usando ambos os recursos.
