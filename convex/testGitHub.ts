import { query } from "./_generated/server";

/**
 * Query temporária para testar configuração do GitHub OAuth
 * Use esta query para descobrir qual URL o Convex está usando
 */
export const testGitHubConfig = query({
  handler: async (ctx) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const hasSecret = !!process.env.GITHUB_CLIENT_SECRET;
    const siteUrl = process.env.CONVEX_SITE_URL || "não configurado";
    
    // Calcular a URL de callback que será usada
    const callbackUrl = `${siteUrl}/auth/github/callback`;
    
    return {
      hasClientId: !!clientId,
      clientIdLength: clientId?.length || 0,
      hasSecret: hasSecret,
      siteUrl: siteUrl,
      callbackUrl: callbackUrl,
      message: "Use esta callbackUrl no GitHub OAuth App!"
    };
  },
});

