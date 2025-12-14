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
    try {
      // Acessar variáveis de ambiente de forma segura
      const clientId: string | undefined = process.env.AUTH_GITHUB_ID;
      const clientSecret: string | undefined = process.env.AUTH_GITHUB_SECRET;
      const siteUrl: string | undefined = process.env.CONVEX_SITE_URL;
      
      const hasClientId = Boolean(clientId && clientId.length > 0);
      const hasClientSecret = Boolean(clientSecret && clientSecret.length > 0);
      const clientIdLength = clientId ? clientId.length : 0;
      const clientSecretLength = clientSecret ? clientSecret.length : 0;
      
      const missing: string[] = [];
      if (!hasClientId) missing.push("AUTH_GITHUB_ID");
      if (!hasClientSecret) missing.push("AUTH_GITHUB_SECRET");
      
      const siteUrlStr = siteUrl ? String(siteUrl) : "não configurado";
      const callbackUrl = siteUrl 
        ? `${String(siteUrl)}/api/auth/callback/github`
        : "não disponível";
      
      const message = callbackUrl !== "não disponível" 
        ? `Configure esta URL no GitHub OAuth App: ${callbackUrl}`
        : "CONVEX_SITE_URL não está disponível";
      
      return {
        configured: hasClientId && hasClientSecret,
        missing: missing,
        clientIdLength: Number(clientIdLength),
        clientSecretLength: Number(clientSecretLength),
        siteUrl: String(siteUrlStr),
        callbackUrl: String(callbackUrl),
        message: String(message),
        debug: {
          hasClientId: Boolean(hasClientId),
          hasClientSecret: Boolean(hasClientSecret),
          providersConfigured: Boolean(hasClientId && hasClientSecret),
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Erro em checkAuthConfig:", errorMessage);
      return {
        configured: false,
        missing: ["AUTH_GITHUB_ID", "AUTH_GITHUB_SECRET"],
        clientIdLength: 0,
        clientSecretLength: 0,
        siteUrl: "erro ao obter",
        callbackUrl: "não disponível",
        message: `Erro ao verificar configuração: ${errorMessage}`,
        debug: {
          hasClientId: false,
          hasClientSecret: false,
          providersConfigured: false,
          error: errorMessage,
        },
      };
    }
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
