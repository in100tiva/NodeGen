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

    await ctx.db.patch(args.id, {
      ...(args.name !== undefined && { name: args.name }),
      ...(args.description !== undefined && { description: args.description }),
      ...(args.nodes !== undefined && { nodes: args.nodes }),
      ...(args.edges !== undefined && { edges: args.edges }),
      ...(args.settings !== undefined && { settings: args.settings }),
      updatedAt: Date.now(),
    });

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

