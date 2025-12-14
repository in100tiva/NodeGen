import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

// Convex Auth routes - adiciona todas as rotas de autenticação automaticamente
auth.addHttpRoutes(http);

// GitHub OAuth Callback para tokens de API (separado da autenticação de usuário)
// Este callback é usado pelos nodes GitHub para obter tokens de API
// A autenticação de usuário usa /api/auth/callback/github (gerenciado pelo Convex Auth)
http.route({
  path: "/auth/github/callback",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) {
      return new Response(
        `<html><body><h1>Erro na autorização GitHub</h1><p>${error}</p><script>window.close();</script></body></html>`,
        { status: 400, headers: { "Content-Type": "text/html" } }
      );
    }

    if (!code || !state) {
      return new Response("Código ou state ausente", { status: 400 });
    }

    // Extrair userId do state
    // NOTA: Este callback é para tokens de API do GitHub, não para autenticação de usuário
    // A autenticação de usuário é gerenciada pelo Convex Auth em /api/auth/callback/github
    const userId = state.split("-")[0];

    // Usar GITHUB_CLIENT_ID e GITHUB_CLIENT_SECRET para tokens de API
    // AUTH_GITHUB_ID e AUTH_GITHUB_SECRET são usados pelo Convex Auth para autenticação
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      const missing = [];
      if (!clientId) missing.push("GITHUB_CLIENT_ID");
      if (!clientSecret) missing.push("GITHUB_CLIENT_SECRET");
      return new Response(
        `GitHub OAuth não configurado. Variáveis faltando: ${missing.join(", ")}. ` +
        `Configure em: https://dashboard.convex.dev → Settings → Environment Variables`,
        { status: 500 }
      );
    }

    // Trocar code por access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      return new Response("Erro ao obter token do GitHub", { status: 500 });
    }

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return new Response(`Erro: ${tokenData.error_description || tokenData.error}`, { status: 400 });
    }

    const accessToken = tokenData.access_token;

    // Salvar token no Convex
    await ctx.runMutation(api.github.storeGitHubToken, {
      userId,
      accessToken,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_in ? Date.now() + tokenData.expires_in * 1000 : undefined,
    });

    // Fechar janela e notificar sucesso
    return new Response(
      `<html><body><h1>Autorização bem-sucedida!</h1><p>Você pode fechar esta janela.</p><script>window.opener?.postMessage({ type: 'github-auth-success' }, '*'); window.close();</script></body></html>`,
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  }),
});

export default http;
