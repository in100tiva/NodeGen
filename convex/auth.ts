import { convexAuth } from "@convex-dev/auth/server";
import GitHub from "@auth/core/providers/github";
import { query, action } from "./_generated/server";

// Obter variáveis de ambiente (podem estar indefinidas durante o deploy)
const clientId = process.env.AUTH_GITHUB_ID;
const clientSecret = process.env.AUTH_GITHUB_SECRET;

// Inicializar providers apenas se as variáveis estiverem definidas
const providers = [];
if (clientId && clientSecret) {
  providers.push(
    GitHub({
      clientId,
      clientSecret,
    })
  );
}

// Se não houver providers configurados, lançar erro mais claro
if (providers.length === 0) {
  console.warn(
    "⚠️ AUTH_GITHUB_ID ou AUTH_GITHUB_SECRET não estão configuradas. " +
    "Configure em: https://dashboard.convex.dev → Settings → Environment Variables"
  );
}

// Verificar se SITE_URL está configurada (necessária para Convex Auth)
const siteUrl = process.env.SITE_URL;
if (!siteUrl) {
  console.warn(
    "⚠️ SITE_URL não está configurada. " +
    "Configure em: https://dashboard.convex.dev → Settings → Environment Variables\n" +
    "Para produção, use: https://cautious-buzzard-249.convex.site\n" +
    "Para desenvolvimento, use: http://localhost:3000"
  );
}

// Configurar convexAuth
// O Convex Auth lê automaticamente SITE_URL de process.env.SITE_URL
// IMPORTANTE: SITE_URL deve estar configurada no Convex Dashboard
// Se SITE_URL não estiver configurada, o signIn falhará com "Server Error"
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: providers.length > 0 ? providers : [],
  // SITE_URL é lido automaticamente de process.env.SITE_URL pelo Convex Auth
  // Não precisa ser passado explicitamente na configuração
});

// Query para verificar se as variáveis de ambiente estão configuradas
// NOTA: Temporariamente desabilitada - queries do Convex podem não acessar process.env
// Se necessário, converter para action ou usar valores já carregados no módulo
// export const checkAuthConfig = query({
//   handler: async () => {
//     // Queries do Convex podem não ter acesso a process.env
//     // Usar valores já carregados no topo do módulo se necessário
//     return {
//       configured: !!clientId && !!clientSecret,
//       missing: [
//         ...(!clientId ? ["AUTH_GITHUB_ID"] : []),
//         ...(!clientSecret ? ["AUTH_GITHUB_SECRET"] : []),
//       ],
//       siteUrl: process.env.CONVEX_SITE_URL || "não configurado",
//       callbackUrl: process.env.CONVEX_SITE_URL 
//         ? `${process.env.CONVEX_SITE_URL}/api/auth/callback/github`
//         : "não disponível",
//     };
//   },
// });

// Query para obter informações do usuário atual
export const getCurrentUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    return {
      tokenIdentifier: identity.tokenIdentifier,
      name: identity.name,
      email: identity.email,
      pictureUrl: identity.pictureUrl,
    };
  },
});

// Action para verificar configuração de autenticação
// Usa valores já carregados no módulo (mais confiável que process.env em actions)
// Esta action é opcional e não crítica - se falhar, não deve bloquear o login
export const checkAuthConfig = action({
  handler: async () => {
    // Usar valores já carregados no topo do módulo
    // Esses valores são carregados quando o módulo é importado
    const hasClientId = !!clientId;
    const hasClientSecret = !!clientSecret;
    const hasSiteUrl = !!siteUrl;
    
    // Tentar obter CONVEX_SITE_URL do process.env (se disponível)
    let convexSiteUrl: string | null = null;
    try {
      // Actions podem acessar process.env, mas pode falhar em alguns contextos
      if (typeof process !== 'undefined' && process.env) {
        convexSiteUrl = process.env.CONVEX_SITE_URL || null;
      }
    } catch (e) {
      // Ignorar se não conseguir acessar
    }
    
    return {
      hasClientId,
      hasClientSecret,
      hasSiteUrl,
      hasConvexSiteUrl: !!convexSiteUrl,
      siteUrl: siteUrl || null,
      convexSiteUrl,
      callbackUrl: convexSiteUrl 
        ? `${convexSiteUrl}/api/auth/callback/github`
        : null,
      configured: !!(hasClientId && hasClientSecret && hasSiteUrl),
      missing: [
        ...(!hasClientId ? ["AUTH_GITHUB_ID"] : []),
        ...(!hasClientSecret ? ["AUTH_GITHUB_SECRET"] : []),
        ...(!hasSiteUrl ? ["SITE_URL"] : []),
      ],
    };
  },
});
