# Guia de Configuração do GitHub OAuth

Este guia explica como configurar a integração GitHub OAuth no Convex.

## Passo 1: Criar OAuth App no GitHub

1. Acesse https://github.com/settings/developers
2. Clique em **"New OAuth App"** (ou **"New GitHub App"** se preferir, mas OAuth App é mais simples)
3. Preencha os campos:
   - **Application name**: `NodeGen Studio` (ou qualquer nome)
   - **Homepage URL**: 
     - Para desenvolvimento: `http://localhost:3000`
     - Para produção: sua URL do Convex (ex: `https://seu-projeto.convex.site`)
   - **Authorization callback URL**: 
     - Para desenvolvimento: `http://localhost:3000/auth/github/callback`
     - Para produção: `https://seu-projeto.convex.site/auth/github/callback`
     - **IMPORTANTE**: Esta URL deve corresponder ao `CONVEX_SITE_URL` configurado no Convex
4. Clique em **"Register application"**
5. **ANOTE** o **Client ID** e **Client Secret** que aparecem na próxima tela

## Passo 2: Configurar Variáveis de Ambiente no Convex

### Opção A: Via Dashboard (Recomendado)

1. Acesse o [Convex Dashboard](https://dashboard.convex.dev)
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Adicione as seguintes variáveis:

   ```
   GITHUB_CLIENT_ID = seu_client_id_aqui
   GITHUB_CLIENT_SECRET = seu_client_secret_aqui
   CONVEX_SITE_URL = http://localhost:3000  (para desenvolvimento)
   ```

   Para produção, use:
   ```
   CONVEX_SITE_URL = https://seu-projeto.convex.site
   ```

5. Clique em **Save**

### Opção B: Via CLI

Execute os seguintes comandos no terminal:

```bash
# Navegue até a pasta do projeto
cd "c:\Users\in100\OneDrive\Documentos\projetos\Estudo\projeto-06-NodeGen"

# Configure as variáveis de ambiente
npx convex env set GITHUB_CLIENT_ID "seu_client_id_aqui"
npx convex env set GITHUB_CLIENT_SECRET "seu_client_secret_aqui"
```

⚠️ **NÃO** configure `CONVEX_SITE_URL` manualmente - ela é built-in e já está disponível automaticamente!

## Passo 3: Verificar Configuração

1. Reinicie o servidor Convex:
   ```bash
   npx convex dev
   ```

2. Verifique se as variáveis foram carregadas corretamente. Você pode criar uma query temporária para testar:

```typescript
// convex/testGitHub.ts (temporário, pode deletar depois)
import { query } from "./_generated/server";

export const testGitHubConfig = query({
  handler: async (ctx) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const hasSecret = !!process.env.GITHUB_CLIENT_SECRET;
    return {
      hasClientId: !!clientId,
      clientIdLength: clientId?.length || 0,
      hasSecret: hasSecret,
      siteUrl: process.env.CONVEX_SITE_URL || "não configurado"
    };
  },
});
```

3. Chame essa query no frontend para verificar:
```typescript
const config = useQuery(api.testGitHub.testGitHubConfig);
console.log(config);
```

## Passo 4: Testar a Integração

1. Adicione um nó GitHub no canvas
2. Clique em **"Conectar GitHub"**
3. Você deve ser redirecionado para o GitHub para autorizar
4. Após autorizar, você será redirecionado de volta e o status deve mudar para "Autorizado"

## Troubleshooting

### Erro: "GITHUB_CLIENT_ID não configurado"
- Verifique se a variável foi adicionada no Convex Dashboard
- Certifique-se de que reiniciou o servidor Convex após adicionar as variáveis
- Verifique se não há espaços extras no nome da variável

### Erro: "redirect_uri_mismatch"
- Verifique se a URL de callback no GitHub OAuth App corresponde exatamente ao `CONVEX_SITE_URL`
- Para desenvolvimento: `http://localhost:3000/auth/github/callback`
- Certifique-se de que não há barras extras ou diferenças de protocolo (http vs https)

### Erro: "bad_verification_code"
- Isso geralmente acontece se o Client Secret estiver incorreto
- Verifique se copiou o Client Secret corretamente do GitHub
- Certifique-se de que não há espaços extras

### Variáveis não aparecem após adicionar
- As variáveis de ambiente são carregadas quando o servidor Convex inicia
- Reinicie o servidor: pare (`Ctrl+C`) e execute `npx convex dev` novamente

## URLs Importantes

- **GitHub OAuth Apps**: https://github.com/settings/developers
- **Convex Dashboard**: https://dashboard.convex.dev
- **Documentação Convex Env**: https://docs.convex.dev/production/environment-variables

## Notas de Segurança

⚠️ **NUNCA** commite o Client Secret no Git!
- O Client Secret deve estar apenas nas variáveis de ambiente do Convex
- Adicione `.env.local` ao `.gitignore` se estiver usando arquivos locais
- Use variáveis de ambiente diferentes para desenvolvimento e produção
