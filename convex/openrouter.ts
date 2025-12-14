import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

interface OpenRouterMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  max_tokens?: number;
  temperature?: number;
}

export const validateApiKey = action({
  args: { apiKey: v.string() },
  handler: async (ctx, args) => {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/models", {
        headers: {
          Authorization: `Bearer ${args.apiKey}`,
          "HTTP-Referer": process.env.CONVEX_SITE_URL || "",
          "X-Title": "NodeGen Studio",
        },
      });

      if (!response.ok) {
        return { valid: false, error: "Invalid API key" };
      }

      const data = await response.json();
      return { valid: true, models: data.data || [] };
    } catch (error) {
      return { valid: false, error: String(error) };
    }
  },
});

export const executeWorkflow = action({
  args: {
    workflowId: v.id("workflows"),
    nodes: v.array(v.any()),
    edges: v.array(v.any()),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.tokenIdentifier;

    // Verificar ownership do workflow
    const workflow = await ctx.runQuery(api.workflows.getWorkflow, {
      id: args.workflowId,
    });

    if (!workflow || workflow.userId !== userId) {
      throw new Error("Not authorized");
    }

    // Construir mensagens do workflow
    const nodeMap = new Map(args.nodes.map((n: any) => [n.id, n]));

    // Encontrar TODOS os nós LLM (não apenas o primeiro)
    const llmNodes = args.nodes.filter((n: any) => n.type === "llm-model");

    if (llmNodes.length === 0) {
      throw new Error("No LLM model node found in workflow");
    }

    // Função auxiliar para processar um único nó LLM
    const processLLMNode = async (llmNode: any) => {
      // Encontrar output-display conectado a ESTE LLM específico
      const outputNode = args.nodes.find((n: any) => {
        const edge = args.edges.find((e: any) => e.source === llmNode.id && e.target === n.id);
        return edge && n.type === "output-display";
      });

      // Encontrar nós de entrada CONECTADOS a ESTE LLM através das edges
    const connectedInputNodes: any[] = [];
    for (const edge of args.edges) {
      if (edge.target === llmNode.id) {
        const sourceNode = nodeMap.get(edge.source);
          if (sourceNode && (sourceNode.type === "input-text" || sourceNode.type === "github-repo")) {
          // Evitar duplicatas
          if (!connectedInputNodes.find(n => n.id === sourceNode.id)) {
            connectedInputNodes.push(sourceNode);
          }
        }
      }
    }

      // Construir mensagem do usuário (apenas texto)
    let textContent = "";
    
    for (const inputNode of connectedInputNodes) {
      if (inputNode.type === "input-text" && inputNode.data?.value) {
        textContent += (textContent ? "\n\n" : "") + inputNode.data.value;
        } else if (inputNode.type === "github-repo") {
          // Processar nó GitHub
          const repo = inputNode.data?.githubRepo || "";
          const branch = inputNode.data?.githubBranch || "main";
          const path = inputNode.data?.githubPath || "";
          const searchQuery = inputNode.data?.githubSearchQuery || "";
          const mode = inputNode.data?.githubMode || "list";

          if (!repo) {
            textContent += (textContent ? "\n\n" : "") + "[GitHub: Repositório não configurado]";
            continue;
          }

          const repoParts = repo.split("/");
          if (repoParts.length !== 2) {
            textContent += (textContent ? "\n\n" : "") + `[GitHub: Formato de repositório inválido: ${repo}]`;
            continue;
          }

          const owner = repoParts[0].trim();
          const repoName = repoParts[1].trim();

          try {
            if (mode === "list") {
              const files = await ctx.runAction(api.github.listRepositoryFiles, {
                userId: "dev-user-123", // TODO: Usar userId real
                owner,
                repo: repoName,
                path,
                branch,
              });

              const fileList = files.map((f: any) => `- ${f.type === "dir" ? "📁" : "📄"} ${f.name}`).join("\n");
              textContent += (textContent ? "\n\n" : "") + `# Arquivos do repositório ${repo} (${branch})\n${path ? `Caminho: ${path}\n` : ""}\n${fileList}`;
            } else if (mode === "read") {
              if (!path) {
                textContent += (textContent ? "\n\n" : "") + "[GitHub: Caminho do arquivo não especificado]";
                continue;
              }

              // Obter userId do contexto de autenticação
              const identity = await ctx.auth.getUserIdentity();
              if (!identity) {
                throw new Error("Not authenticated");
              }
              const userId = identity.tokenIdentifier;
              
              const file = await ctx.runAction(api.github.readFileContent, {
                userId,
                owner,
                repo: repoName,
                path,
                branch,
              });

              textContent += (textContent ? "\n\n" : "") + `# Conteúdo do arquivo: ${file.path}\n\`\`\`\n${file.content}\n\`\`\``;
            } else if (mode === "search") {
              if (!searchQuery) {
                textContent += (textContent ? "\n\n" : "") + "[GitHub: Query de busca não especificada]";
                continue;
              }

              // Obter userId do contexto de autenticação
              const identity = await ctx.auth.getUserIdentity();
              if (!identity) {
                throw new Error("Not authenticated");
              }
              const userId = identity.tokenIdentifier;
              
              const results = await ctx.runAction(api.github.searchCode, {
                userId,
                owner,
                repo: repoName,
                query: searchQuery,
              });

              const resultsList = results.items.map((item: any) => `- ${item.path}`).join("\n");
              textContent += (textContent ? "\n\n" : "") + `# Resultados da busca: "${searchQuery}"\nEncontrados ${results.totalCount} resultado(s):\n\n${resultsList}`;
            }
          } catch (error: any) {
            textContent += (textContent ? "\n\n" : "") + `[GitHub Error: ${error.message || String(error)}]`;
          }
        }
      }

      if (textContent.length === 0) {
        throw new Error(`No input content found for LLM node ${llmNode.id}`);
      }

      const messages: OpenRouterMessage[] = [{
      role: "user",
        content: textContent,
      }];

    // Fazer requisição para OpenRouter
      // Usar modelo do nó LLM específico
      const model = llmNode.data?.model || "z-ai/glm-4.5-air:free";

    const requestBody: OpenRouterRequest = {
      model,
      messages,
      max_tokens: 2000,
      temperature: 0.7,
    };

      // Validar que a chave API do OpenRouter está presente
      if (!args.apiKey || args.apiKey.trim() === '') {
        throw new Error("OpenRouter API key não configurada. Configure em Configurações > OpenRouter API Key");
      }

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${args.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.CONVEX_SITE_URL || "",
          "X-Title": "NodeGen Studio",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenRouter API error: ${error}`);
      }

      const data = await response.json();
      
      // Processar resposta: usar o conteúdo da mensagem (texto)
      const result: string = data.choices?.[0]?.message?.content || "No response";

      // Atualizar o nó de output ESPECÍFICO conectado a este LLM
      if (outputNode) {
        await ctx.runMutation(api.workflows.updateWorkflow, {
          id: args.workflowId,
          nodes: args.nodes.map((n: any) =>
            n.id === outputNode.id
              ? { ...n, data: { ...n.data, value: result } }
              : n
          ),
        });
      }

      return {
        success: true,
        result,
        model,
        usage: data.usage || {},
      };
    };

    // Processar TODOS os nós LLM independentemente
    const results = await Promise.all(
      llmNodes.map(llmNode => processLLMNode(llmNode).catch(error => ({
        success: false as const,
        error: String(error),
        model: llmNode.data?.model || "unknown",
      })))
    );

    // Verificar se algum falhou
    const failedResults = results.filter((r): r is { success: false; error: string; model: string } => !r.success);
    if (failedResults.length > 0) {
      return {
        success: false,
        error: `Erro ao executar ${failedResults.length} de ${results.length} nós LLM: ${failedResults.map(r => r.error).join('; ')}`,
        results,
      };
    }

    // Retornar o resultado do primeiro LLM para compatibilidade
    return results[0] || {
      success: false,
      error: "Nenhum resultado retornado",
    };
  },
});

