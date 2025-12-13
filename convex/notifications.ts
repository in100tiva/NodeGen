import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Cria uma nova notificação
 */
export const createNotification = mutation({
  args: {
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
  },
  handler: async (ctx, args): Promise<Id<"notifications">> => {
    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      link: args.link,
      read: false,
      createdAt: Date.now(),
    });

    return notificationId;
  },
});

/**
 * Lista notificações do usuário
 */
export const listNotifications = query({
  args: {
    limit: v.optional(v.number()),
    unreadOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = "dev-user-123"; // TODO: Reativar autenticação

    let notifications;
    if (args.unreadOnly) {
      notifications = await ctx.db
        .query("notifications")
        .withIndex("by_user_unread", (q) => q.eq("userId", userId).eq("read", false))
        .order("desc")
        .take(args.limit || 50);
    } else {
      notifications = await ctx.db
        .query("notifications")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .order("desc")
        .take(args.limit || 50);
    }

    return notifications;
  },
});

/**
 * Conta notificações não lidas
 */
export const countUnreadNotifications = query({
  args: {},
  handler: async (ctx) => {
    const userId = "dev-user-123"; // TODO: Reativar autenticação

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) => q.eq("userId", userId).eq("read", false))
      .collect();

    return unread.length;
  },
});

/**
 * Marca notificação como lida
 */
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args): Promise<void> => {
    const userId = "dev-user-123"; // TODO: Reativar autenticação

    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.notificationId, {
      read: true,
    });
  },
});

/**
 * Marca todas as notificações como lidas
 */
export const markAllAsRead = mutation({
  handler: async (ctx): Promise<void> => {
    const userId = "dev-user-123"; // TODO: Reativar autenticação

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) => q.eq("userId", userId).eq("read", false))
      .collect();

    for (const notification of unread) {
      await ctx.db.patch(notification._id, {
        read: true,
      });
    }
  },
});

/**
 * Deleta uma notificação
 */
export const deleteNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args): Promise<void> => {
    const userId = "dev-user-123"; // TODO: Reativar autenticação

    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.notificationId);
  },
});

