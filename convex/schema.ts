import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  workflows: defineTable({
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    nodes: v.array(v.any()),
    edges: v.array(v.any()),
    settings: v.object({
      openRouterKey: v.string(),
      theme: v.union(v.literal("dark"), v.literal("light")),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
    isDefault: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_default", ["userId", "isDefault"]),

    files: defineTable({
      userId: v.string(),
      workflowId: v.optional(v.id("workflows")),
      storageId: v.id("_storage"),
      fileName: v.string(),
      fileType: v.string(),
      fileSize: v.number(),
      uploadedAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_workflow", ["workflowId"]),
    
    executionHistory: defineTable({
      workflowId: v.id("workflows"),
      userId: v.string(),
      status: v.union(
        v.literal("running"),
        v.literal("completed"),
        v.literal("failed"),
        v.literal("paused")
      ),
      steps: v.array(
        v.object({
          nodeId: v.string(),
          input: v.any(),
          output: v.any(),
          timestamp: v.number(),
          duration: v.number(),
        })
      ),
      result: v.optional(v.any()),
      error: v.optional(v.string()),
      startedAt: v.number(),
      completedAt: v.optional(v.number()),
    })
      .index("by_workflow", ["workflowId"])
      .index("by_user", ["userId"]),
    
    templates: defineTable({
      name: v.string(),
      description: v.string(),
      category: v.string(),
      nodes: v.array(v.any()),
      edges: v.array(v.any()),
      isPublic: v.boolean(),
      authorId: v.optional(v.string()),
      usageCount: v.number(),
      createdAt: v.number(),
    })
      .index("by_category", ["category"])
      .index("by_public", ["isPublic"]),
    
    workflowShares: defineTable({
      workflowId: v.id("workflows"),
      ownerId: v.string(),
      sharedWithId: v.optional(v.string()), // null = público
      permission: v.union(v.literal("view"), v.literal("edit")),
      createdAt: v.number(),
    })
      .index("by_workflow", ["workflowId"])
      .index("by_shared_with", ["sharedWithId"])
      .index("by_owner", ["ownerId"]),
    
    workflowVersions: defineTable({
      workflowId: v.id("workflows"),
      version: v.string(), // "1.0.0", "1.1.0", etc.
      nodes: v.array(v.any()),
      edges: v.array(v.any()),
      settings: v.any(),
      createdBy: v.string(),
      createdAt: v.number(),
      description: v.optional(v.string()),
      isCurrent: v.boolean(),
    })
      .index("by_workflow", ["workflowId"])
      .index("by_workflow_current", ["workflowId", "isCurrent"]),
    
    changeHistory: defineTable({
      workflowId: v.id("workflows"),
      userId: v.string(),
      action: v.union(
        v.literal("create"),
        v.literal("update"),
        v.literal("delete"),
        v.literal("add_node"),
        v.literal("remove_node"),
        v.literal("connect"),
        v.literal("disconnect")
      ),
      targetType: v.union(v.literal("workflow"), v.literal("node"), v.literal("edge")),
      targetId: v.optional(v.string()),
      changes: v.any(), // Diff ou snapshot
      timestamp: v.number(),
    })
      .index("by_workflow", ["workflowId"]),

    notifications: defineTable({
      userId: v.string(),
      type: v.union(
        v.literal("workflow_completed"),
        v.literal("workflow_failed"),
        v.literal("workflow_shared"),
        v.literal("comment"),
        v.literal("collaborator_joined"),
        v.literal("schedule_triggered")
      ),
      title: v.string(),
      message: v.string(),
      link: v.optional(v.string()),
      read: v.boolean(),
      createdAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_user_unread", ["userId", "read"]),

    comments: defineTable({
      workflowId: v.id("workflows"),
      nodeId: v.optional(v.string()), // null = comentário no workflow
      userId: v.string(),
      content: v.string(),
      parentId: v.optional(v.id("comments")), // Para respostas
      createdAt: v.number(),
      updatedAt: v.number(),
      resolved: v.boolean(),
    })
      .index("by_workflow", ["workflowId"])
      .index("by_node", ["nodeId"]),

    schedules: defineTable({
      workflowId: v.id("workflows"),
      userId: v.string(),
      name: v.string(),
      cronExpression: v.string(), // "0 9 * * *" = todo dia às 9h
      timezone: v.string(),
      enabled: v.boolean(),
      lastRun: v.optional(v.number()),
      nextRun: v.number(),
      runCount: v.number(),
      createdAt: v.number(),
    })
      .index("by_workflow", ["workflowId"])
      .index("by_next_run", ["nextRun"]),

    customNodes: defineTable({
      name: v.string(),
      description: v.string(),
      category: v.string(),
      authorId: v.string(),
      code: v.string(), // Código JavaScript do nó
      inputs: v.array(v.string()),
      outputs: v.array(v.string()),
      config: v.any(), // Configuração do nó
      isPublic: v.boolean(),
      downloadCount: v.number(),
      rating: v.number(),
      createdAt: v.number(),
    })
      .index("by_category", ["category"])
      .index("by_public", ["isPublic"]),

    githubTokens: defineTable({
      userId: v.string(),
      accessToken: v.string(), // token criptografado
      refreshToken: v.optional(v.string()),
      expiresAt: v.optional(v.number()),
      createdAt: v.number(),
    })
      .index("by_user", ["userId"]),
});

