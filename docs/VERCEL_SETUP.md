# Configuração do Vercel para NodeGen Studio

## Variáveis de Ambiente Necessárias

Para que o build funcione corretamente no Vercel, você precisa configurar as seguintes variáveis de ambiente:

### 1. Variáveis do Convex

O Convex precisa gerar os arquivos `_generated` durante o build. Para isso, você precisa configurar:

1. Acesse o [Dashboard do Convex](https://dashboard.convex.dev)
2. Vá para o seu projeto
3. Copie o **Deployment URL** ou **Deployment Name**
4. No Vercel:
   - Vá para **Settings** → **Environment Variables**
   - Adicione a variável `CONVEX_DEPLOYMENT` com o valor do seu deployment
   - Ou configure o arquivo `.env.production` no Vercel

### 2. Configuração no Vercel

1. Acesse o [Dashboard do Vercel](https://vercel.com/dashboard)
2. Vá para o seu projeto
3. Clique em **Settings** → **Environment Variables**
4. Adicione as seguintes variáveis:

```
CONVEX_DEPLOYMENT=wry-avocet-85
```

Ou se você preferir usar o arquivo de configuração do Convex:

```
CONVEX_DEPLOYMENT=<seu-deployment-name>
```

### 3. Build Command

O build command já está configurado no `package.json`:

```json
"build": "npx convex codegen && vite build"
```

Isso garante que os arquivos do Convex sejam gerados antes do build do Vite.

### 4. Verificação

Após configurar as variáveis de ambiente, faça um novo deploy. O build deve funcionar corretamente.

## Troubleshooting

### Erro: "Could not resolve ./convex/_generated/api"

Isso significa que o `convex codegen` não foi executado ou falhou. Verifique:

1. Se a variável `CONVEX_DEPLOYMENT` está configurada no Vercel
2. Se você tem acesso ao deployment do Convex
3. Os logs do build no Vercel para ver se há erros no `convex codegen`

### Erro: "Convex deployment not found"

Verifique se o deployment name está correto e se você tem permissões para acessá-lo.
