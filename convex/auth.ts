import { convexAuth } from "@convex-dev/auth/server";
import GitHub from "@auth/core/providers/github";
import { query } from "./_generated/server";

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

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: providers.length > 0 ? providers : [],
});

// Query para verificar se as variáveis de ambiente estão configuradas
export const checkAuthConfig = query({
  handler: async () => {
    const hasClientId = !!process.env.AUTH_GITHUB_ID;
    const hasClientSecret = !!process.env.AUTH_GITHUB_SECRET;
    const clientIdLength = process.env.AUTH_GITHUB_ID?.length || 0;
    const clientSecretLength = process.env.AUTH_GITHUB_SECRET?.length || 0;
    const siteUrl = process.env.CONVEX_SITE_URL || "não configurado";
    const callbackUrl = siteUrl !== "não configurado" 
      ? `${siteUrl}/api/auth/callback/github`
      : "não disponível";
    
    return {
      configured: hasClientId && hasClientSecret,
      missing: [
        ...(hasClientId ? [] : ["AUTH_GITHUB_ID"]),
        ...(hasClientSecret ? [] : ["AUTH_GITHUB_SECRET"]),
      ],
      clientIdLength,
      clientSecretLength,
      siteUrl,
      callbackUrl,
      message: callbackUrl !== "não disponível" 
        ? `Configure esta URL no GitHub OAuth App: ${callbackUrl}`
        : "CONVEX_SITE_URL não está disponível",
      debug: {
        hasClientId,
        hasClientSecret,
        providersConfigured: hasClientId && hasClientSecret,
      },
    };
  },
});

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
