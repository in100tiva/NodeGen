# Configuração do Vercel para NodeGen Studio

## Variáveis de Ambiente Necessárias

Para que a aplicação funcione corretamente no Vercel, você precisa configurar **duas variáveis de ambiente**:

1. **CONVEX_DEPLOY_KEY** - Para o build
2. **VITE_CONVEX_URL** - Para a aplicação funcionar

### 1. VITE_CONVEX_URL (Runtime - OBRIGATÓRIO)

Esta variável permite que a aplicação se conecte ao backend Convex.

#### Como obter a URL:

**Opção A - Via CLI:**
```bash
npx convex dev --once
```
Procure por: `Deployment URL: https://seu-deployment.convex.cloud`

**Opção B - Via Dashboard:**
1. Acesse [dashboard.convex.dev](https://dashboard.convex.dev)
2. Selecione seu projeto
3. Vá para **Settings** → **URL & Deploy Key**
4. Copie a **Deployment URL**

#### Configurar no Vercel:
```
Nome: VITE_CONVEX_URL
Valor: https://seu-deployment.convex.cloud
Ambientes: Production, Preview, Development
```

⚠️ **IMPORTANTE**: Sem essa variável, a aplicação fica com tela preta e erro no console!

### 2. CONVEX_DEPLOY_KEY (Build Time)

1. Acesse o [Dashboard do Convex](https://dashboard.convex.dev)
2. Vá para o seu projeto
3. Clique em **Settings** → **Deploy Keys**
4. Clique em **Create Deploy Key**
5. Copie o **Deploy Key** gerado (ele só será mostrado uma vez!)

#### Configurar no Vercel:

1. Acesse o [Dashboard do Vercel](https://vercel.com/dashboard)
2. Vá para o seu projeto
3. Clique em **Settings** → **Environment Variables**
4. Adicione a seguinte variável:

```
Nome: CONVEX_DEPLOY_KEY
Valor: <cole-o-deploy-key-aqui>
Ambientes: Production, Preview, Development
```

**Importante:**
- Configure para todos os ambientes
- O Deploy Key é sensível - não compartilhe publicamente

### 3. Build Command

O build command já está configurado no `package.json`:

```json
"build": "npx convex codegen && vite build"
```

Isso garante que os arquivos do Convex sejam gerados antes do build do Vite.

### 4. Verificação

Após configurar as variáveis de ambiente, faça um novo deploy. O build deve funcionar corretamente.

## Resumo - Checklist de Variáveis

- [ ] `VITE_CONVEX_URL` - URL do deployment (ex: `https://xxx.convex.cloud`)
- [ ] `CONVEX_DEPLOY_KEY` - Deploy Key do Convex Dashboard

## Troubleshooting

### Erro: "Could not find Convex client!" (Tela Preta)

**Causa**: `VITE_CONVEX_URL` não está configurada

**Solução**:
1. Configure a variável `VITE_CONVEX_URL` no Vercel (veja seção 1 acima)
2. Faça um **novo deploy** (não apenas invalidar cache)
3. Aguarde o deploy completar
4. Recarregue a página (Ctrl+F5)

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
