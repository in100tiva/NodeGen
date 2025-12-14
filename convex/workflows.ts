import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

export const createWorkflow = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    nodes: v.array(v.any()),
    edges: v.array(v.any()),
    settings: v.object({
      openRouterKey: v.string(),
      theme: v.union(v.literal("dark"), v.literal("light")),
    }),
  },
  handler: async (ctx, args) => {
    // TODO: Reativar autenticação quando configurada no Convex Dashboard
    // const identity = await ctx.auth.getUserIdentity();
    // if (!identity) {
    //   throw new Error("Not authenticated");
    // }
    // const userId = identity.tokenIdentifier;
    
    // Temporário: usar um userId fixo para desenvolvimento
    const userId = "dev-user-123";

    // Se for o primeiro workflow, marcar como default
    const existingWorkflows = await ctx.db
      .query("workflows")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const isDefault = existingWorkflows.length === 0;

    const workflowId = await ctx.db.insert("workflows", {
      userId,
      name: args.name,
      description: args.description,
      nodes: args.nodes,
      edges: args.edges,
      settings: args.settings,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDefault,
    });

    return workflowId;
  },
});

export const updateWorkflow = mutation({
  args: {
    id: v.id("workflows"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    nodes: v.optional(v.array(v.any())),
    edges: v.optional(v.array(v.any())),
    settings: v.optional(
      v.object({
        openRouterKey: v.string(),
        theme: v.union(v.literal("dark"), v.literal("light")),
      })
    ),
    createVersion: v.optional(v.boolean()), // Auto-save de versão
  },
  handler: async (ctx, args) => {
    try {
      // TODO: Reativar autenticação quando configurada no Convex Dashboard
      // const identity = await ctx.auth.getUserIdentity();
      // if (!identity) {
      //   throw new Error("Not authenticated");
      // }
      // const userId = identity.tokenIdentifier;
      
      // Temporário: usar um userId fixo para desenvolvimento
      const userId = "dev-user-123";
      const workflow = await ctx.db.get(args.id);

      if (!workflow) {
        throw new Error("Workflow not found");
      }

      if (workflow.userId !== userId) {
        throw new Error("Not authorized");
      }

      // TODO: Implementar log de mudanças quando changeHistory estiver disponível
      // Detectar mudanças para log
      // if (args.nodes !== undefined && JSON.stringify(workflow.nodes) !== JSON.stringify(args.nodes)) {
      //   await ctx.runMutation(api.changeHistory.logChange, {
      //     workflowId: args.id,
      //     action: "update",
      //     targetType: "workflow",
      //     changes: { nodes: { from: workflow.nodes, to: args.nodes } },
      //   });
      // }

      // if (args.edges !== undefined && JSON.stringify(workflow.edges) !== JSON.stringify(args.edges)) {
      //   await ctx.runMutation(api.changeHistory.logChange, {
      //     workflowId: args.id,
      //     action: "update",
      //     targetType: "workflow",
      //     changes: { edges: { from: workflow.edges, to: args.edges } },
      //   });
      // }

      // Validar e preparar settings se fornecido
      let validatedSettings = undefined;
      if (args.settings !== undefined) {
        // #region agent log
        const logEntry3 = {
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'A',
          location: 'convex/workflows.ts:109',
          message: 'Before settings validation',
          data: {
            argsSettings: args.settings,
            argsOpenRouterKey: args.settings.openRouterKey,
            argsOpenRouterKeyType: typeof args.settings.openRouterKey,
            argsOpenRouterKeyIsNull: args.settings.openRouterKey === null,
            argsOpenRouterKeyIsUndefined: args.settings.openRouterKey === undefined,
            argsTheme: args.settings.theme,
            argsThemeType: typeof args.settings.theme,
            workflowSettings: workflow.settings
          },
          timestamp: Date.now()
        };
        console.error('[DEBUG]', JSON.stringify(logEntry3));
        // #endregion

        // Garantir que settings tem o formato correto
        // Se openRouterKey ou theme não estiverem presentes, usar valores do workflow atual
        const openRouterKey = args.settings.openRouterKey !== undefined 
          ? args.settings.openRouterKey 
          : (workflow.settings?.openRouterKey || "");
        const theme = args.settings.theme !== undefined 
          ? args.settings.theme 
          : (workflow.settings?.theme || "dark");
        
        // Validar que theme é "dark" ou "light"
        const validTheme = theme === "dark" || theme === "light" ? theme : "dark";
        
        validatedSettings = {
          openRouterKey: typeof openRouterKey === "string" ? openRouterKey : "",
          theme: validTheme,
        };
      }

      // Preparar objeto de atualização
      const updateData: any = {
        updatedAt: Date.now(),
      };

      if (args.name !== undefined) {
        updateData.name = args.name;
      }
      if (args.description !== undefined) {
        updateData.description = args.description;
      }
      if (args.nodes !== undefined) {
        // Garantir que nodes é um array válido e serializável
        if (Array.isArray(args.nodes)) {
          try {
            // Testar serialização antes de adicionar
            const testSerialization = JSON.stringify(args.nodes);
            // Validar estrutura básica de cada node
            for (const node of args.nodes) {
              if (!node.id || typeof node.id !== 'string') {
                throw new Error(`Node inválido: id deve ser string, recebido: ${typeof node.id}`);
              }
              if (!node.type || typeof node.type !== 'string') {
                throw new Error(`Node inválido: type deve ser string, recebido: ${typeof node.type}`);
              }
              if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
                throw new Error(`Node inválido: position deve ter x e y numéricos`);
              }
              if (!node.data || typeof node.data !== 'object') {
                throw new Error(`Node inválido: data deve ser objeto`);
              }
              if (!Array.isArray(node.inputs)) {
                throw new Error(`Node inválido: inputs deve ser array`);
              }
              if (!Array.isArray(node.outputs)) {
                throw new Error(`Node inválido: outputs deve ser array`);
              }
            }
            updateData.nodes = args.nodes;
          } catch (e: any) {
            console.error('[DEBUG] Erro ao validar nodes:', e.message, args.nodes);
            throw new Error(`Erro ao validar nodes: ${e.message}`);
          }
        } else {
          console.error('[DEBUG] nodes não é um array:', typeof args.nodes, args.nodes);
          throw new Error('nodes deve ser um array');
        }
      }
      if (args.edges !== undefined) {
        // Garantir que edges é um array válido e serializável
        if (Array.isArray(args.edges)) {
          try {
            // Testar serialização antes de adicionar
            const testSerialization = JSON.stringify(args.edges);
            // Validar estrutura básica de cada edge
            for (const edge of args.edges) {
              if (!edge.id || typeof edge.id !== 'string') {
                throw new Error(`Edge inválido: id deve ser string, recebido: ${typeof edge.id}`);
              }
              if (!edge.source || typeof edge.source !== 'string') {
                throw new Error(`Edge inválido: source deve ser string, recebido: ${typeof edge.source}`);
              }
              if (!edge.target || typeof edge.target !== 'string') {
                throw new Error(`Edge inválido: target deve ser string, recebido: ${typeof edge.target}`);
              }
            }
            updateData.edges = args.edges;
          } catch (e: any) {
            throw new Error(`Erro ao validar edges: ${e.message}`);
          }
        } else {
          throw new Error('edges deve ser um array');
        }
      }
      // Sempre incluir settings no patch para garantir que o schema seja válido
      // Se não foi fornecido, usar os settings atuais do workflow, mas validar/normalizar
      if (validatedSettings !== undefined) {
        updateData.settings = validatedSettings;
      } else {
        // Garantir que settings sempre existe no updateData para validar o schema
        // Validar e normalizar os settings atuais do workflow para garantir estrutura correta
        const currentSettings = workflow.settings;
        updateData.settings = {
          openRouterKey: (currentSettings && typeof currentSettings.openRouterKey === 'string') 
            ? currentSettings.openRouterKey 
            : "",
          theme: (currentSettings && (currentSettings.theme === 'dark' || currentSettings.theme === 'light'))
            ? currentSettings.theme
            : "dark"
        };
      }
      
      await ctx.db.patch(args.id, updateData);

      // TODO: Implementar auto-save de versão quando versions estiver disponível
      // Auto-save de versão se solicitado
      // if (args.createVersion && (args.nodes !== undefined || args.edges !== undefined)) {
      //   const versions = await ctx.db
      //     .query("workflowVersions")
      //     .withIndex("by_workflow", (q) => q.eq("workflowId", args.id))
      //     .order("desc")
      //     .take(1);

      //   const lastVersion = versions[0];
      //   let nextVersion = "1.0.0";

      //   if (lastVersion) {
      //     const parts = lastVersion.version.split(".");
      //     const minor = parseInt(parts[1] || "0") + 1;
      //     nextVersion = `${parts[0]}.${minor}.0`;
      //   }

      //   await ctx.runMutation(api.versions.createVersion, {
      //     workflowId: args.id,
      //     version: nextVersion,
      //     nodes: args.nodes || workflow.nodes,
      //     edges: args.edges || workflow.edges,
      //     settings: args.settings || workflow.settings,
      //     description: "Auto-save",
      //     setAsCurrent: false,
      //   });
      // }

      return args.id;
    } catch (error: any) {
      console.error("Erro em updateWorkflow:", error);
      throw new Error(`Erro ao atualizar workflow: ${error.message || String(error)}`);
    }
  },
});

// Mutation alternativa que recebe nodes como string JSON para contornar validação do Convex
export const updateWorkflowWithJsonNodes = mutation({
  args: {
    id: v.id("workflows"),
    nodesJson: v.optional(v.string()),
    edgesJson: v.optional(v.string()),
    settings: v.optional(
      v.object({
        openRouterKey: v.string(),
        theme: v.union(v.literal("dark"), v.literal("light")),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Log imediato no início - DEVE aparecer no Convex Dashboard
    // Se este log não aparecer, o erro está na validação de argumentos ANTES do handler
    console.error('[ALTERNATIVE HANDLER ENTRY] updateWorkflowWithJsonNodes called with:', {
      id: String(args.id),
      hasNodesJson: args.nodesJson !== undefined,
      nodesJsonLength: args.nodesJson?.length || 0,
      nodesJsonType: typeof args.nodesJson,
      hasEdgesJson: args.edgesJson !== undefined,
      edgesJsonLength: args.edgesJson?.length || 0,
      edgesJsonType: typeof args.edgesJson,
      hasSettings: args.settings !== undefined,
      settingsType: typeof args.settings,
      argsKeys: Object.keys(args),
      argsStringified: JSON.stringify(args).substring(0, 1000)
    });
    
    // Se chegou aqui, o handler está sendo chamado
    // Se este log não aparecer no Convex Dashboard, o erro está na validação de argumentos
    
    try {
      const workflow = await ctx.db.get(args.id);
      if (!workflow) {
        throw new Error("Workflow not found");
      }
      
      console.error('[ALTERNATIVE] Workflow found, preparing updateData');
      
      const updateData: any = {
        updatedAt: Date.now(),
      };
      
      // Parse nodes de JSON string
      if (args.nodesJson !== undefined && args.nodesJson !== '[]' && args.nodesJson.trim() !== '') {
        try {
          console.error('[ALTERNATIVE] Parsing nodesJson, length:', args.nodesJson.length);
          const parsedNodes = JSON.parse(args.nodesJson);
          console.error('[ALTERNATIVE] Parsed nodes, isArray:', Array.isArray(parsedNodes), 'length:', parsedNodes?.length);
          if (Array.isArray(parsedNodes)) {
            // Validar e limpar cada node antes de adicionar
            const cleanedNodes: any[] = [];
            for (const node of parsedNodes) {
              // Criar node limpo apenas com campos essenciais
              const cleanedNode: any = {
                id: String(node.id || ''),
                type: String(node.type || ''),
                position: {
                  x: typeof node.position?.x === 'number' ? node.position.x : 0,
                  y: typeof node.position?.y === 'number' ? node.position.y : 0
                },
                data: {},
                inputs: Array.isArray(node.inputs) ? node.inputs.map(String) : [],
                outputs: Array.isArray(node.outputs) ? node.outputs.map(String) : []
              };
              
              // Copiar apenas campos primitivos de node.data
              if (node.data && typeof node.data === 'object') {
                for (const key in node.data) {
                  const value = node.data[key];
                  if (value !== undefined && value !== null && typeof value !== 'function') {
                    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                      cleanedNode.data[key] = value;
                    }
                  }
                }
              }
              
              // Garantir que label sempre existe
              if (!cleanedNode.data.label) {
                cleanedNode.data.label = String(node.data?.label || '');
              }
              
              cleanedNodes.push(cleanedNode);
            }
            updateData.nodes = cleanedNodes;
            console.error('[ALTERNATIVE] cleaned nodes added to updateData, count:', cleanedNodes.length);
          } else {
            throw new Error('nodesJson não é um array válido após parse');
          }
        } catch (e: any) {
          console.error('[ALTERNATIVE] Erro ao parsear nodesJson:', e);
          throw new Error(`Erro ao parsear nodesJson: ${e.message}`);
        }
      } else if (args.nodesJson === '[]' || args.nodesJson?.trim() === '') {
        // Se nodesJson é array vazio, definir nodes como array vazio
        console.error('[ALTERNATIVE] nodesJson is empty, setting nodes to empty array');
        updateData.nodes = [];
      }
      
      // Parse edges de JSON string
      if (args.edgesJson !== undefined && args.edgesJson !== '[]' && args.edgesJson.trim() !== '') {
        try {
          console.error('[ALTERNATIVE] Parsing edgesJson, length:', args.edgesJson.length);
          const parsedEdges = JSON.parse(args.edgesJson);
          console.error('[ALTERNATIVE] Parsed edges, isArray:', Array.isArray(parsedEdges), 'length:', parsedEdges?.length);
          if (Array.isArray(parsedEdges)) {
            // Validar e limpar cada edge antes de adicionar
            const cleanedEdges: any[] = [];
            for (const edge of parsedEdges) {
              const cleanedEdge: any = {
                id: String(edge.id || ''),
                source: String(edge.source || ''),
                target: String(edge.target || ''),
              };
              if (edge.sourceHandle !== undefined) {
                cleanedEdge.sourceHandle = String(edge.sourceHandle);
              }
              if (edge.targetHandle !== undefined) {
                cleanedEdge.targetHandle = String(edge.targetHandle);
              }
              cleanedEdges.push(cleanedEdge);
            }
            updateData.edges = cleanedEdges;
            console.error('[ALTERNATIVE] cleaned edges added to updateData, count:', cleanedEdges.length);
          } else {
            throw new Error('edgesJson não é um array válido após parse');
          }
        } catch (e: any) {
          console.error('[ALTERNATIVE] Erro ao parsear edgesJson:', e);
          throw new Error(`Erro ao parsear edgesJson: ${e.message}`);
        }
      } else if (args.edgesJson === '[]' || args.edgesJson?.trim() === '') {
        // Se edgesJson é array vazio, definir edges como array vazio
        console.error('[ALTERNATIVE] edgesJson is empty, setting edges to empty array');
        updateData.edges = [];
      }
      
      // Settings
      if (args.settings !== undefined) {
        updateData.settings = args.settings;
        console.error('[ALTERNATIVE] settings added to updateData');
      }
      
      console.error('[ALTERNATIVE] Before db.patch, updateData keys:', Object.keys(updateData));
      console.error('[ALTERNATIVE] updateData content:', JSON.stringify(updateData).substring(0, 2000));
      
      // Validar updateData antes de fazer patch
      if (updateData.nodes) {
        console.error('[ALTERNATIVE] Validating nodes before patch, count:', updateData.nodes.length);
        for (let i = 0; i < updateData.nodes.length; i++) {
          const node = updateData.nodes[i];
          if (!node.id || typeof node.id !== 'string') {
            throw new Error(`Node ${i} has invalid id: ${typeof node.id}`);
          }
          if (!node.type || typeof node.type !== 'string') {
            throw new Error(`Node ${i} has invalid type: ${typeof node.type}`);
          }
          if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
            throw new Error(`Node ${i} has invalid position`);
          }
        }
      }
      
      await ctx.db.patch(args.id, updateData);
      console.error('[ALTERNATIVE] db.patch succeeded');
      return args.id;
    } catch (error: any) {
      console.error('[ALTERNATIVE ERROR]', error);
      console.error('[ALTERNATIVE ERROR] Message:', error.message);
      console.error('[ALTERNATIVE ERROR] Stack:', error.stack);
      console.error('[ALTERNATIVE ERROR] Args received:', JSON.stringify(args).substring(0, 1000));
      throw new Error(`Erro ao atualizar workflow: ${error.message || String(error)}`);
    }
  },
});

export const deleteWorkflow = mutation({
  args: { id: v.id("workflows") },
  handler: async (ctx, args) => {
    // TODO: Reativar autenticação quando configurada no Convex Dashboard
    // const identity = await ctx.auth.getUserIdentity();
    // if (!identity) {
    //   throw new Error("Not authenticated");
    // }
    // const userId = identity.tokenIdentifier;
    
    // Temporário: usar um userId fixo para desenvolvimento
    const userId = "dev-user-123";
    const workflow = await ctx.db.get(args.id);

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    if (workflow.userId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.id);
  },
});

export const listWorkflows = query({
  handler: async (ctx) => {
    // TODO: Reativar autenticação quando configurada no Convex Dashboard
    // const identity = await ctx.auth.getUserIdentity();
    // if (!identity) {
    //   return [];
    // }
    // const userId = identity.tokenIdentifier;
    
    // Temporário: usar um userId fixo para desenvolvimento
    const userId = "dev-user-123";

    const workflows = await ctx.db
      .query("workflows")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return workflows;
  },
});

export const getWorkflow = query({
  args: { id: v.id("workflows") },
  handler: async (ctx, args) => {
    // TODO: Reativar autenticação quando configurada no Convex Dashboard
    // const identity = await ctx.auth.getUserIdentity();
    // if (!identity) {
    //   throw new Error("Not authenticated");
    // }
    // const userId = identity.tokenIdentifier;
    
    // Temporário: usar um userId fixo para desenvolvimento
    const userId = "dev-user-123";
    const workflow = await ctx.db.get(args.id);

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    if (workflow.userId !== userId) {
      throw new Error("Not authorized");
    }

    return workflow;
  },
});

export const setDefaultWorkflow = mutation({
  args: { id: v.id("workflows") },
  handler: async (ctx, args) => {
    // TODO: Reativar autenticação quando configurada no Convex Dashboard
    // const identity = await ctx.auth.getUserIdentity();
    // if (!identity) {
    //   throw new Error("Not authenticated");
    // }
    // const userId = identity.tokenIdentifier;
    
    // Temporário: usar um userId fixo para desenvolvimento
    const userId = "dev-user-123";
    const workflow = await ctx.db.get(args.id);

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    if (workflow.userId !== userId) {
      throw new Error("Not authorized");
    }

    // Remove default de todos os outros workflows do usuário
    const allWorkflows = await ctx.db
      .query("workflows")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const wf of allWorkflows) {
      if (wf._id !== args.id && wf.isDefault) {
        await ctx.db.patch(wf._id, { isDefault: false });
      }
    }

    // Define este como default
    await ctx.db.patch(args.id, { isDefault: true });

    return args.id;
  },
});

