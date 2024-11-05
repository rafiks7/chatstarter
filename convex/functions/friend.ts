import { authenticatedMutation, authenticatedQuery } from "./helpers";
import { QueryCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { v } from "convex/values";
export const listPending = authenticatedQuery({
  handler: async (ctx) => {
    const friends = await ctx.db
      .query("friends")
      .withIndex("by_user2_status", (q) =>
        q.eq("user2", ctx.user._id).eq("status", "pending")
      )
      .collect();
    return await mapWithUsers(ctx, friends, "user1");
  },
});

export const listAccepted = authenticatedQuery({
  handler: async (ctx) => {
    const friends1 = await ctx.db
      .query("friends")
      .withIndex("by_user1_status", (q) =>
        q.eq("user1", ctx.user._id).eq("status", "accepted")
      )
      .collect();
    const friends2 = await ctx.db
      .query("friends")
      .withIndex("by_user2_status", (q) =>
        q.eq("user2", ctx.user._id).eq("status", "accepted")
      )
      .collect();
    const friendsWithUsers1 = await mapWithUsers(ctx, friends1, "user2");
    const friendsWithUsers2 = await mapWithUsers(ctx, friends2, "user1");
    return [...friendsWithUsers1, ...friendsWithUsers2];
  },
});

export const createFriendRequest = authenticatedMutation({
  args: {
    username: v.string(),
  },
  handler: async (ctx, { username }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();
    if (!user) {
      throw new Error("User not found");
    }
    if (user._id === ctx.user._id) {
      throw new Error("Cannot friend yourself");
    }

    const existing = await ctx.db.query("friends").withIndex("by_user1_user2", (q) => q.eq("user1", ctx.user._id).eq("user2", user._id)).unique();
    const existing2 = await ctx.db.query("friends").withIndex("by_user2_user1", (q) => q.eq("user2", ctx.user._id).eq("user1", user._id)).unique();

    let freindRequest = null;

    if (existing2){
      freindRequest = existing2;
    }
    else if (existing) {
      freindRequest = existing;
    }
    
    if (freindRequest) {
      if (freindRequest.status === "pending") {
        throw new Error("Friend request already sent");
      }
      else if (freindRequest.status === "accepted") {
        throw new Error("Friend already accepted");
      }
      else if (freindRequest.status === "rejected") {
        await ctx.db.patch(freindRequest._id, {
          status: "pending",
        });
      }
    }
    else {
      await ctx.db.insert("friends", {
        user1: ctx.user._id,
      user2: user._id,
        status: "pending",
      });
    }
  },
});

export const updateStatus = authenticatedMutation({
  args: {
    id: v.id("friends"),
    status: v.union(v.literal("accepted"), v.literal("rejected")),
  },
  handler: async (ctx, { id, status }) => {
    const friend = await ctx.db.get(id);
    if (!friend) {
      throw new Error("Friend not found");
    }
    if (friend.user1 !== ctx.user._id && friend.user2 !== ctx.user._id) {
      throw new Error("Not authorized");
    }
    await ctx.db.patch(id, {
      status,
    });
  },
});

export const clear = authenticatedMutation({
  args: {
    id: v.id("friends"),
  },
  handler: async (ctx, { id }) => {
    const friend = await ctx.db.get(id);
    if (!friend) {
      throw new Error("Friend not found");
    }
    if (friend.user1 !== ctx.user._id && friend.user2 !== ctx.user._id) {
      throw new Error("Not authorized");
    }

    console.log("Clearing friend relationship between:", friend.user1, friend.user2);

    const directMessageMembersForUser1 = await ctx.db
      .query("directMessageMembers")
      .withIndex("by_user", (q) => q.eq("user", friend.user1))
      .collect();

    const directMessageMembersForUser2 = await ctx.db
      .query("directMessageMembers")
      .withIndex("by_user", (q) => q.eq("user", friend.user2))
      .collect();

    console.log("Found DM members for user1:", directMessageMembersForUser1);
    console.log("Found DM members for user2:", directMessageMembersForUser2);

    const sharedDirectMessageId = directMessageMembersForUser1.find(
      (dm) =>
        directMessageMembersForUser2.some(
          (dm2) => dm2.directMessage === dm.directMessage
        )
    )?.directMessage;

    console.log("Found shared DM ID:", sharedDirectMessageId);

    // Delete the shared direct message if it exists
    if (sharedDirectMessageId) {
      const deleteDirectMessage = ctx.db.delete(sharedDirectMessageId);
      const sharedDirectMessageMembers = await ctx.db
      .query("directMessageMembers")
      .withIndex("by_direct_message", (q) =>
          q.eq("directMessage", sharedDirectMessageId)
        )
        .collect();

      console.log("Found shared DM members to delete:", sharedDirectMessageMembers);

      const deleteDirectMessageMembers = sharedDirectMessageMembers.map(dm => ctx.db.delete(dm._id));

      const messages = await ctx.db
        .query("messages")
        .withIndex("by_direct_message", (q) =>
          q.eq("directMessage", sharedDirectMessageId)
        )
        .collect();

      console.log("Found messages to delete:", messages);

      const deleteMessages = messages.map((m) => ctx.db.delete(m._id));
    
      console.log("Deleting:", {
        directMessage: sharedDirectMessageId,
        memberIds: sharedDirectMessageMembers.map(m => m._id),
        messageIds: messages.map(m => m._id)
      });

      await Promise.all([
        deleteDirectMessage,
        ...deleteDirectMessageMembers,
        ...deleteMessages,
      ]);

      console.log("Successfully deleted all related records");
    } else {
      throw new Error("No shared direct message found");
    }
  },
});

const mapWithUsers = async <
  K extends string,
  T extends { [key in K]: Id<"users"> },
>(
  ctx: QueryCtx,
  items: T[],
  key: K
) => {
  const result = await Promise.allSettled(
    items.map(async (item) => {
      const user = await ctx.db.get(item[key]);
      if (!user) {
        throw new Error("User not found");
      }
      return {
        ...item,
        user,
      };
    })
  );
  return result.filter((r) => r.status === "fulfilled").map((r) => r.value);
};
