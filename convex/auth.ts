import { convexAuth } from "@convex-dev/auth/server";
import GitHub from "@auth/core/providers/github";
import { query } from "./_generated/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],
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
