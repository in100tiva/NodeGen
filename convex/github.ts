import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Gera URL de autorização OAuth do GitHub
 */
export const initiateOAuth = action({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      throw new Error("GITHUB_CLIENT_ID não configurado no Convex Dashboard");
    }

    // Gerar state para segurança (CSRF protection)
    const state = `${args.userId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    // CONVEX_SITE_URL é uma variável built-in do Convex que contém a URL do HTTP Actions
    // Esta URL termina com .convex.site e é usada para callbacks OAuth
    const siteUrl = process.env.CONVEX_SITE_URL;
    
    if (!siteUrl) {
      throw new Error(
        "CONVEX_SITE_URL não está disponível. " +
        "Esta é uma variável built-in do Convex. " +
        "Verifique se está usando a versão mais recente do Convex ou configure manualmente no Dashboard."
      );
    }
    
    const redirectUri = `${siteUrl}/auth/github/callback`;
    
    // Log para debug (remover em produção se necessário)
    console.log("GitHub OAuth - Site URL:", siteUrl);
    console.log("GitHub OAuth - Redirect URI:", redirectUri);
    
    const scope = "repo"; // Acesso a repositórios privados
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
    
    return { authUrl, state, redirectUri }; // Retornar redirectUri para debug
  },
});

/**
 * Salva token GitHub do usuário
 */
export const storeGitHubToken = mutation({
  args: {
    userId: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verificar se já existe token para este usuário
    const existing = await ctx.db
      .query("githubTokens")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      // Atualizar token existente
      await ctx.db.patch(existing._id, {
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: args.expiresAt,
      });
      return existing._id;
    } else {
      // Criar novo token
      return await ctx.db.insert("githubTokens", {
        userId: args.userId,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: args.expiresAt,
        createdAt: Date.now(),
      });
    }
  },
});

/**
 * Recupera token GitHub do usuário
 */
export const getGitHubToken = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const token = await ctx.db
      .query("githubTokens")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!token) {
      return null;
    }

    // Verificar se token expirou
    if (token.expiresAt && token.expiresAt < Date.now()) {
      return { expired: true, token: null };
    }

    return { expired: false, token: token.accessToken };
  },
});

/**
 * Valida token GitHub fazendo uma requisição de teste
 */
export const validateGitHubToken = action({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const tokenData: { expired: boolean; token: string | null } | null = await ctx.runQuery(api.github.getGitHubToken, {
      userId: args.userId,
    });

    if (!tokenData || !tokenData.token) {
      return { valid: false, error: "Token não encontrado" };
    }

    if (tokenData.expired) {
      return { valid: false, error: "Token expirado" };
    }

    // Fazer requisição de teste para validar token
    try {
      const response: Response = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${tokenData.token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!response.ok) {
        return { valid: false, error: "Token inválido" };
      }

      const user = await response.json() as { login: string; name?: string };
      return { valid: true, user: { login: user.login, name: user.name } };
    } catch (error) {
      return { valid: false, error: String(error) };
    }
  },
});

/**
 * Lista arquivos de um repositório GitHub
 */
export const listRepositoryFiles = action({
  args: {
    userId: v.string(),
    owner: v.string(),
    repo: v.string(),
    path: v.optional(v.string()), // Caminho do diretório (vazio = root)
    branch: v.optional(v.string()), // Branch (padrão: main/master)
  },
  handler: async (ctx, args): Promise<any[]> => {
    const tokenData: { expired: boolean; token: string | null } | null = await ctx.runQuery(api.github.getGitHubToken, {
      userId: args.userId,
    });

    if (!tokenData || !tokenData.token) {
      throw new Error("GitHub não autorizado. Por favor, autorize no nó GitHub.");
    }

    const path = args.path || "";
    const branch = args.branch || "main";
    const url = `https://api.github.com/repos/${args.owner}/${args.repo}/contents/${path}?ref=${branch}`;

    const response: Response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${tokenData.token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub API error: ${error}`);
    }

    const files: any[] | any = await response.json() as any[] | any;
    return Array.isArray(files) ? files : [files];
  },
});

/**
 * Lê conteúdo de um arquivo específico do GitHub
 */
export const readFileContent = action({
  args: {
    userId: v.string(),
    owner: v.string(),
    repo: v.string(),
    path: v.string(),
    branch: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tokenData = await ctx.runQuery(api.github.getGitHubToken, {
      userId: args.userId,
    });

    if (!tokenData || !tokenData.token) {
      throw new Error("GitHub não autorizado. Por favor, autorize no nó GitHub.");
    }

    const branch = args.branch || "main";
    const url = `https://api.github.com/repos/${args.owner}/${args.repo}/contents/${args.path}?ref=${branch}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${tokenData.token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub API error: ${error}`);
    }

    const file = await response.json() as {
      type: string;
      name: string;
      path: string;
      size: number;
      content: string;
      encoding: string;
      sha: string;
    };

    if (file.type !== "file") {
      throw new Error("Caminho especificado não é um arquivo");
    }

    // Decodificar conteúdo base64 (sem usar Buffer para compatibilidade com Convex)
    const base64Content = file.content.replace(/\s/g, '');
    const binaryString = atob(base64Content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const content = new TextDecoder('utf-8').decode(bytes);

    return {
      name: file.name,
      path: file.path,
      size: file.size,
      content,
      encoding: file.encoding,
      sha: file.sha,
    };
  },
});

/**
 * Busca código no repositório GitHub
 */
export const searchCode = action({
  args: {
    userId: v.string(),
    owner: v.string(),
    repo: v.string(),
    query: v.string(),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tokenData: { expired: boolean; token: string | null } | null = await ctx.runQuery(api.github.getGitHubToken, {
      userId: args.userId,
    });

    if (!tokenData || !tokenData.token) {
      throw new Error("GitHub não autorizado. Por favor, autorize no nó GitHub.");
    }

    // Construir query de busca
    let searchQuery = `${args.query} repo:${args.owner}/${args.repo}`;
    if (args.language) {
      searchQuery += ` language:${args.language}`;
    }

    const url = `https://api.github.com/search/code?q=${encodeURIComponent(searchQuery)}`;

    const response: Response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${tokenData.token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub API error: ${error}`);
    }

    const data = await response.json() as {
      total_count: number;
      items: Array<{
        name: string;
        path: string;
        html_url: string;
        repository: { full_name: string };
      }>;
    };

    return {
      totalCount: data.total_count,
      items: data.items.map((item) => ({
        name: item.name,
        path: item.path,
        url: item.html_url,
        repository: item.repository.full_name,
      })),
    };
  },
});

