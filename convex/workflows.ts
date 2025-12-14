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
    // #region agent log
    const logEntry1 = {
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'A',
      location: 'convex/workflows.ts:66',
      message: 'updateWorkflow handler entry - args received',
      data: {
        id: args.id,
        hasName: args.name !== undefined,
        hasDescription: args.description !== undefined,
        hasNodes: args.nodes !== undefined,
        nodesCount: args.nodes?.length || 0,
        hasEdges: args.edges !== undefined,
        edgesCount: args.edges?.length || 0,
        hasSettings: args.settings !== undefined,
        settingsType: typeof args.settings,
        settingsValue: args.settings ? {
          hasOpenRouterKey: args.settings.openRouterKey !== undefined,
          openRouterKeyType: typeof args.settings.openRouterKey,
          openRouterKeyValue: args.settings.openRouterKey === null ? 'null' : (args.settings.openRouterKey === undefined ? 'undefined' : String(args.settings.openRouterKey).substring(0, 20)),
          hasTheme: args.settings.theme !== undefined,
          themeType: typeof args.settings.theme,
          themeValue: args.settings.theme
        } : null
      },
      timestamp: Date.now()
    };
    console.error('[DEBUG]', JSON.stringify(logEntry1));
    // #endregion

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

      // #region agent log
      const logEntry2 = {
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'C',
        location: 'convex/workflows.ts:77',
        message: 'Workflow fetched from DB',
        data: {
          workflowExists: !!workflow,
          workflowId: workflow?._id,
          workflowUserId: workflow?.userId,
          expectedUserId: userId,
          workflowSettings: workflow?.settings ? {
            hasOpenRouterKey: workflow.settings.openRouterKey !== undefined,
            openRouterKeyType: typeof workflow.settings.openRouterKey,
            theme: workflow.settings.theme
          } : null
        },
        timestamp: Date.now()
      };
      console.error('[DEBUG]', JSON.stringify(logEntry2));
      // #endregion

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

        // #region agent log
        const logEntry4 = {
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'A',
          location: 'convex/workflows.ts:125',
          message: 'After settings validation',
          data: {
            validatedSettings,
            openRouterKeyFinal: validatedSettings.openRouterKey,
            openRouterKeyFinalType: typeof validatedSettings.openRouterKey,
            themeFinal: validatedSettings.theme
          },
          timestamp: Date.now()
        };
        console.error('[DEBUG]', JSON.stringify(logEntry4));
        // #endregion
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
        updateData.nodes = args.nodes;
      }
      if (args.edges !== undefined) {
        updateData.edges = args.edges;
      }
      if (validatedSettings !== undefined) {
        updateData.settings = validatedSettings;
      }

      // #region agent log
      const logEntry5 = {
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'D',
        location: 'convex/workflows.ts:148',
        message: 'Before db.patch - updateData prepared',
        data: {
          updateDataKeys: Object.keys(updateData),
          hasSettings: updateData.settings !== undefined,
          settingsValue: updateData.settings,
          nodesCount: updateData.nodes?.length,
          edgesCount: updateData.edges?.length,
          updateDataStringified: JSON.stringify(updateData).substring(0, 500)
        },
        timestamp: Date.now()
      };
      console.error('[DEBUG]', JSON.stringify(logEntry5));
      // #endregion

      await ctx.db.patch(args.id, updateData);

      // #region agent log
      const logEntry6 = {
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'D',
        location: 'convex/workflows.ts:149',
        message: 'After db.patch - success',
        data: {},
        timestamp: Date.now()
      };
      console.error('[DEBUG]', JSON.stringify(logEntry6));
      // #endregion

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
      // #region agent log
      const logEntry7 = {
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'E',
        location: 'convex/workflows.ts:181',
        message: 'Error caught in updateWorkflow',
        data: {
          errorMessage: error?.message,
          errorString: String(error),
          errorName: error?.name,
          errorStack: error?.stack?.substring(0, 500),
          argsId: args.id,
          argsKeys: Object.keys(args)
        },
        timestamp: Date.now()
      };
      console.error('[DEBUG]', JSON.stringify(logEntry7));
      // #endregion

      // Log do erro para debug
      console.error("Erro em updateWorkflow:", error);
      console.error("Args recebidos:", JSON.stringify(args, null, 2));
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

