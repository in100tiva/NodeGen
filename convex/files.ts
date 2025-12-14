import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const createFileRecord = mutation({
  args: {
    userId: v.string(),
    workflowId: v.optional(v.id("workflows")),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
  },
  handler: async (ctx, args): Promise<Id<"files">> => {
    const fileId = await ctx.db.insert("files", {
      userId: args.userId,
      workflowId: args.workflowId,
      storageId: args.storageId,
      fileName: args.fileName,
      fileType: args.fileType,
      fileSize: args.fileSize,
      uploadedAt: Date.now(),
    });

    return fileId;
  },
});

export const uploadFile = action({
  args: {
    workflowId: v.optional(v.id("workflows")),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args): Promise<Id<"files">> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.tokenIdentifier;

    const fileId: Id<"files"> = await ctx.runMutation(api.files.createFileRecord, {
      userId,
      workflowId: args.workflowId,
      storageId: args.storageId,
      fileName: args.fileName,
      fileType: args.fileType,
      fileSize: args.fileSize,
    });

    return fileId;
  },
});


export const deleteFile = mutation({
  args: { id: v.id("files") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.tokenIdentifier;
    const file = await ctx.db.get(args.id);

    if (!file) {
      throw new Error("File not found");
    }

    if (file.userId !== userId) {
      throw new Error("Not authorized");
    }

    // Delete from storage
    await ctx.storage.delete(file.storageId);

    // Delete record
    await ctx.db.delete(args.id);
  },
});

export const getFile = query({
  args: { id: v.id("files") },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.id);
    return file;
  },
});

export const getFileUrl = query({
  args: { id: v.optional(v.id("files")) },
  handler: async (ctx, args) => {
    if (!args.id) {
      return null;
    }
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.tokenIdentifier;
    const file = await ctx.db.get(args.id);

    if (!file) {
      throw new Error("File not found");
    }

    if (file.userId !== userId) {
      throw new Error("Not authorized");
    }

    return await ctx.storage.getUrl(file.storageId);
  },
});

export const listFiles = query({
  args: { workflowId: v.optional(v.id("workflows")) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const userId = identity.tokenIdentifier;

    if (args.workflowId) {
      return await ctx.db
        .query("files")
        .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId!))
        .collect();
    }

    return await ctx.db
      .query("files")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});
