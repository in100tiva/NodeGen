# Configuração do Vercel para NodeGen Studio

## Variáveis de Ambiente Necessárias

Para que o build funcione corretamente no Vercel, você precisa configurar um **Deploy Key** do Convex. O `convex codegen` precisa de autenticação para gerar os arquivos `_generated` durante o build.

### 1. Obter Deploy Key do Convex

1. Acesse o [Dashboard do Convex](https://dashboard.convex.dev)
2. Vá para o seu projeto
3. Clique em **Settings** → **Deploy Keys**
4. Clique em **Create Deploy Key**
5. Copie o **Deploy Key** gerado (ele só será mostrado uma vez!)

### 2. Configurar no Vercel

1. Acesse o [Dashboard do Vercel](https://vercel.com/dashboard)
2. Vá para o seu projeto
3. Clique em **Settings** → **Environment Variables**
4. Adicione a seguinte variável:

```
CONVEX_DEPLOY_KEY=<cole-o-deploy-key-aqui>
```

**Importante:**
- Configure para todos os ambientes: **Production**, **Preview** e **Development**
- O Deploy Key é sensível - não compartilhe publicamente

### 3. Build Command

O build command já está configurado no `package.json`:

```json
"build": "npx convex codegen && vite build"
```

Isso garante que os arquivos do Convex sejam gerados antes do build do Vite.

### 4. Verificação

Após configurar as variáveis de ambiente, faça um novo deploy. O build deve funcionar corretamente.

## Troubleshooting

### Erro: "401 Unauthorized: MissingAccessToken"

Isso significa que o `CONVEX_DEPLOY_KEY` não está configurado ou está incorreto. Verifique:

1. Se a variável `CONVEX_DEPLOY_KEY` está configurada no Vercel
2. Se o Deploy Key está correto (copie novamente do Convex Dashboard se necessário)
3. Se a variável está configurada para todos os ambientes (Production, Preview, Development)

### Erro: "Could not resolve ./convex/_generated/api"

Isso significa que o `convex codegen` não foi executado ou falhou. Verifique:

1. Se a variável `CONVEX_DEPLOY_KEY` está configurada corretamente
2. Os logs do build no Vercel para ver se há erros no `convex codegen`
3. Se o Deploy Key tem permissões para acessar o deployment

### Como gerar um novo Deploy Key

Se você perdeu o Deploy Key ou precisa gerar um novo:

1. No Convex Dashboard, vá para **Settings** → **Deploy Keys**
2. Revogue o Deploy Key antigo (se necessário)
3. Clique em **Create Deploy Key**
4. Copie o novo Deploy Key
5. Atualize a variável `CONVEX_DEPLOY_KEY` no Vercel
