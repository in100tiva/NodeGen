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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.tokenIdentifier;

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
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Not authenticated");
      }
      const userId = identity.tokenIdentifier;
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
    // Log imediato para verificar se o handler está sendo chamado
    console.log('[DEBUG] updateWorkflowWithJsonNodes chamado com:', {
      id: String(args.id),
      hasNodesJson: args.nodesJson !== undefined,
      nodesJsonType: typeof args.nodesJson,
      nodesJsonLength: args.nodesJson?.length,
      hasEdgesJson: args.edgesJson !== undefined,
      edgesJsonType: typeof args.edgesJson,
      edgesJsonLength: args.edgesJson?.length,
      hasSettings: args.settings !== undefined
    });
    
    try {
      // Verificar se workflow existe ANTES de processar
      const workflow = await ctx.db.get(args.id);
      if (!workflow) {
        console.error('[ERROR] Workflow not found:', String(args.id));
        throw new Error("Workflow not found");
      }
      
      console.log('[DEBUG] Workflow encontrado:', {
        id: String(workflow._id),
        nodesCount: workflow.nodes?.length || 0,
        edgesCount: workflow.edges?.length || 0,
        hasSettings: !!workflow.settings,
        workflowUserId: workflow.userId
      });
      
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Not authenticated");
      }
      const userId = identity.tokenIdentifier;
      
      // Verificar autorização
      if (workflow.userId !== userId) {
        console.error('[ERROR] Not authorized to update workflow:', {
          workflowUserId: workflow.userId,
          requestUserId: userId
        });
        throw new Error("Not authorized");
      }
      
      console.log('[DEBUG] Autorização verificada com sucesso');
      
      // Função auxiliar para limpar e validar nodes
      const cleanAndValidateNodes = (nodes: any[]): any[] => {
        if (!Array.isArray(nodes)) {
          console.warn('[WARN] nodes não é array, retornando array vazio');
          return [];
        }
        const cleaned: any[] = [];
        for (const node of nodes) {
          if (!node || typeof node !== 'object') continue;
          if (!node.id || typeof node.id !== 'string') continue;
          if (!node.type || typeof node.type !== 'string') continue;
          if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') continue;
          if (!node.data || typeof node.data !== 'object') continue;
          if (!Array.isArray(node.inputs)) continue;
          if (!Array.isArray(node.outputs)) continue;
          
          // Criar node limpo
          const cleanedNode: any = {
            id: String(node.id),
            type: String(node.type),
            position: {
              x: node.position.x,
              y: node.position.y
            },
            data: {},
            inputs: node.inputs.map(String),
            outputs: node.outputs.map(String)
          };
          
          // Copiar apenas campos primitivos de node.data
          for (const key in node.data) {
            if (key.startsWith('_')) continue;
            const value = node.data[key];
            if (value !== undefined && value !== null && typeof value !== 'function') {
              if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                cleanedNode.data[key] = value;
              }
            }
          }
          
          if (!cleanedNode.data.label) {
            cleanedNode.data.label = String(node.data?.label || node.type || 'Node');
          }
          
          cleaned.push(cleanedNode);
        }
        return cleaned;
      };
      
      // Função auxiliar para limpar e validar edges
      const cleanAndValidateEdges = (edges: any[]): any[] => {
        if (!Array.isArray(edges)) {
          console.warn('[WARN] edges não é array, retornando array vazio');
          return [];
        }
        const cleaned: any[] = [];
        for (const edge of edges) {
          if (!edge || typeof edge !== 'object') continue;
          if (!edge.id || typeof edge.id !== 'string') continue;
          if (!edge.source || typeof edge.source !== 'string') continue;
          if (!edge.target || typeof edge.target !== 'string') continue;
          
          const cleanedEdge: any = {
            id: String(edge.id),
            source: String(edge.source),
            target: String(edge.target),
          };
          if (edge.sourceHandle !== undefined) {
            cleanedEdge.sourceHandle = String(edge.sourceHandle);
          }
          if (edge.targetHandle !== undefined) {
            cleanedEdge.targetHandle = String(edge.targetHandle);
          }
          cleaned.push(cleanedEdge);
        }
        return cleaned;
      };
      
      // Inicializar updateData com valores atuais do workflow (limpos e validados)
      // Isso garante que o schema sempre tenha nodes e edges válidos
      const updateData: any = {
        updatedAt: Date.now(),
        // Limpar e validar nodes e edges atuais antes de usar
        nodes: cleanAndValidateNodes(workflow.nodes || []),
        edges: cleanAndValidateEdges(workflow.edges || []),
      };
      
      // Parse nodes de JSON string
      if (args.nodesJson !== undefined && args.nodesJson !== null) {
        if (args.nodesJson === '[]' || args.nodesJson.trim() === '') {
          // Array vazio explícito
          updateData.nodes = [];
        } else {
          try {
            console.log('[DEBUG] Parseando nodesJson, tamanho:', args.nodesJson.length);
            const parsedNodes = JSON.parse(args.nodesJson);
            
            if (!Array.isArray(parsedNodes)) {
              console.error('[ERROR] nodesJson não é um array após parse:', typeof parsedNodes);
              throw new Error('nodesJson não é um array válido após parse');
            }
            
            console.log('[DEBUG] nodesJson parseado com sucesso, quantidade de nodes:', parsedNodes.length);
            
            // Validar e limpar cada node antes de adicionar
            const cleanedNodes: any[] = [];
            for (let i = 0; i < parsedNodes.length; i++) {
              const node = parsedNodes[i];
              
              // Validar campos obrigatórios
              if (!node || typeof node !== 'object') {
                console.warn(`[WARN] Node ${i} não é um objeto, pulando`);
                continue;
              }
              
              if (!node.id || typeof node.id !== 'string') {
                console.warn(`[WARN] Node ${i} sem id válido, pulando:`, { id: node.id, type: typeof node.id });
                continue;
              }
              
              if (!node.type || typeof node.type !== 'string') {
                console.warn(`[WARN] Node ${i} sem type válido, pulando:`, { type: node.type, typeOf: typeof node.type });
                continue;
              }
              
              if (!node.position || typeof node.position !== 'object') {
                console.warn(`[WARN] Node ${i} sem position válido, pulando:`, { position: node.position });
                continue;
              }
              
              // Criar node limpo apenas com campos essenciais
              const cleanedNode: any = {
                id: String(node.id),
                type: String(node.type),
                position: {
                  x: typeof node.position.x === 'number' ? node.position.x : 0,
                  y: typeof node.position.y === 'number' ? node.position.y : 0
                },
                data: {},
                inputs: Array.isArray(node.inputs) ? node.inputs.map(String) : [],
                outputs: Array.isArray(node.outputs) ? node.outputs.map(String) : []
              };
              
              // Copiar apenas campos primitivos de node.data
              if (node.data && typeof node.data === 'object') {
                for (const key in node.data) {
                  // Ignorar propriedades que começam com _ (internas do React Flow)
                  if (key.startsWith('_')) continue;
                  
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
                cleanedNode.data.label = String(node.data?.label || node.type || 'Node');
              }
              
              cleanedNodes.push(cleanedNode);
            }
            
            console.log('[DEBUG] Nodes limpos e validados:', cleanedNodes.length, 'de', parsedNodes.length);
            updateData.nodes = cleanedNodes;
          } catch (e: any) {
            console.error('[ERROR] Erro ao parsear nodesJson:', {
              message: e.message,
              name: e.name,
              stack: e.stack?.substring(0, 500),
              nodesJsonPreview: args.nodesJson?.substring(0, 500)
            });
            throw new Error(`Erro ao parsear nodesJson: ${e.message}`);
          }
        }
      }
      // Se nodesJson é undefined, não atualizar nodes (manter os atuais)
      
      // Parse edges de JSON string
      if (args.edgesJson !== undefined && args.edgesJson !== null) {
        if (args.edgesJson === '[]' || args.edgesJson.trim() === '') {
          // Array vazio explícito
          updateData.edges = [];
        } else {
          try {
            const parsedEdges = JSON.parse(args.edgesJson);
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
            } else {
              throw new Error('edgesJson não é um array válido após parse');
            }
          } catch (e: any) {
            console.error('[ERROR] Erro ao parsear edgesJson:', e.message, args.edgesJson?.substring(0, 200));
            throw new Error(`Erro ao parsear edgesJson: ${e.message}`);
          }
        }
      }
      // Se edgesJson é undefined, não atualizar edges (manter os atuais)
      
      // Settings - sempre incluir (schema requer)
      if (args.settings !== undefined) {
        // Validar settings antes de adicionar
        if (typeof args.settings !== 'object' || args.settings === null) {
          throw new Error('settings deve ser um objeto');
        }
        if (typeof args.settings.openRouterKey !== 'string') {
          throw new Error('settings.openRouterKey deve ser string');
        }
        if (args.settings.theme !== 'dark' && args.settings.theme !== 'light') {
          throw new Error(`settings.theme deve ser 'dark' ou 'light'`);
        }
        updateData.settings = args.settings;
      } else {
        // Se settings não foi fornecido, usar os settings atuais do workflow
        // O schema requer que settings sempre exista
        if (workflow.settings && typeof workflow.settings === 'object') {
          updateData.settings = workflow.settings;
        } else {
          // Fallback: criar settings padrão
          updateData.settings = {
            openRouterKey: "",
            theme: "dark"
          };
        }
      }
      
      // Garantir que nodes e edges são arrays válidos
      if (!Array.isArray(updateData.nodes)) {
        console.warn('[WARN] nodes não é array, convertendo para array vazio');
        updateData.nodes = [];
      }
      if (!Array.isArray(updateData.edges)) {
        console.warn('[WARN] edges não é array, convertendo para array vazio');
        updateData.edges = [];
      }
      
      // Validar updateData antes de fazer patch
      // Nodes sempre deve ser array (já garantido acima)
      for (let i = 0; i < updateData.nodes.length; i++) {
        const node = updateData.nodes[i];
        if (!node || typeof node !== 'object') {
          throw new Error(`Node ${i} is not an object`);
        }
        if (!node.id || typeof node.id !== 'string') {
          throw new Error(`Node ${i} has invalid id: ${typeof node.id}`);
        }
        if (!node.type || typeof node.type !== 'string') {
          throw new Error(`Node ${i} has invalid type: ${typeof node.type}`);
        }
        if (!node.position || typeof node.position !== 'object' || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
          throw new Error(`Node ${i} has invalid position`);
        }
        if (!node.data || typeof node.data !== 'object') {
          throw new Error(`Node ${i} has invalid data`);
        }
        if (!Array.isArray(node.inputs)) {
          throw new Error(`Node ${i} has invalid inputs`);
        }
        if (!Array.isArray(node.outputs)) {
          throw new Error(`Node ${i} has invalid outputs`);
        }
      }
      
      // Edges sempre deve ser array (já garantido acima)
      for (let i = 0; i < updateData.edges.length; i++) {
        const edge = updateData.edges[i];
        if (!edge || typeof edge !== 'object') {
          throw new Error(`Edge ${i} is not an object`);
        }
        if (!edge.id || typeof edge.id !== 'string') {
          throw new Error(`Edge ${i} has invalid id: ${typeof edge.id}`);
        }
        if (!edge.source || typeof edge.source !== 'string') {
          throw new Error(`Edge ${i} has invalid source: ${typeof edge.source}`);
        }
        if (!edge.target || typeof edge.target !== 'string') {
          throw new Error(`Edge ${i} has invalid target: ${typeof edge.target}`);
        }
      }
      
      // Settings sempre deve existir (já garantido acima)
      if (typeof updateData.settings !== 'object' || updateData.settings === null) {
        throw new Error('updateData.settings deve ser um objeto');
      }
      if (typeof updateData.settings.openRouterKey !== 'string') {
        throw new Error('updateData.settings.openRouterKey deve ser string');
      }
      if (updateData.settings.theme !== 'dark' && updateData.settings.theme !== 'light') {
        throw new Error(`updateData.settings.theme deve ser 'dark' ou 'light', recebido: ${updateData.settings.theme}`);
      }
      
      // Log antes de fazer patch
      console.log('[DEBUG] Preparando para fazer patch:', {
        workflowId: String(args.id),
        updateKeys: Object.keys(updateData),
        nodesCount: updateData.nodes?.length ?? 0,
        edgesCount: updateData.edges?.length ?? 0,
        hasSettings: !!updateData.settings,
        settingsKeys: updateData.settings ? Object.keys(updateData.settings) : null
      });
      
      // Tentar fazer o patch
      try {
        await ctx.db.patch(args.id, updateData);
        console.log('[DEBUG] Patch realizado com sucesso');
      } catch (patchError: any) {
        console.error('[ERROR] Erro ao fazer patch:', {
          message: patchError?.message,
          name: patchError?.name,
          stack: patchError?.stack?.substring(0, 1000),
          updateDataKeys: Object.keys(updateData),
          updateDataPreview: JSON.stringify(updateData).substring(0, 1000)
        });
        throw patchError;
      }
      
      return args.id;
    } catch (error: any) {
      // Log detalhado do erro
      const errorDetails = {
        message: error?.message,
        name: error?.name,
        stack: error?.stack?.substring(0, 1000),
        workflowId: String(args.id),
        hasNodesJson: args.nodesJson !== undefined,
        nodesJsonType: typeof args.nodesJson,
        nodesJsonLength: args.nodesJson?.length,
        hasEdgesJson: args.edgesJson !== undefined,
        edgesJsonType: typeof args.edgesJson,
        edgesJsonLength: args.edgesJson?.length,
        hasSettings: args.settings !== undefined,
        settingsType: typeof args.settings,
        settingsKeys: args.settings ? Object.keys(args.settings) : null
      };
      
      console.error("[ERROR] Erro em updateWorkflowWithJsonNodes:", JSON.stringify(errorDetails, null, 2));
      
      // Re-throw com mensagem mais clara
      const errorMessage = error?.message || String(error);
      
      // Se o erro for de validação do Convex, incluir mais detalhes
      if (errorMessage.includes('validation') || errorMessage.includes('schema')) {
        throw new Error(`Erro de validação ao atualizar workflow: ${errorMessage}. Detalhes: ${JSON.stringify(errorDetails)}`);
      }
      
      throw new Error(`Erro ao atualizar workflow: ${errorMessage}`);
    }
  },
});

export const deleteWorkflow = mutation({
  args: { id: v.id("workflows") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.tokenIdentifier;
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const userId = identity.tokenIdentifier;

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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.tokenIdentifier;
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.tokenIdentifier;
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

