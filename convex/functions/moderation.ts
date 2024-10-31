import { Groq } from "groq-sdk";
import { internalAction, internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const run = internalAction({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, { messageId }) => {
    // 1. Get the message
    const message = await ctx.runQuery(internal.functions.moderation.getMessage, {
      messageId,
    });
    if (!message) {
      return;
    }
    // 2. use groq to moderate the message
    const result = await groq.chat.completions.create({
      model: "llama-guard-3-8b",
      messages: [{ role: "user", content: message.content }],
    });
    const value = result.choices[0].message.content;
    console.log("value", value);
    // 3. if it is flagged, delete the message
    if (value?.startsWith("unsafe")) {
      await ctx.runMutation(internal.functions.moderation.deleteMessage, {
        messageId,
        reason: value.replace("unsafe: ", "").trim(),
      });
    }
  },
});

export const deleteMessage = internalMutation({
  args: {
    messageId: v.id("messages"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { messageId, reason }) => {
    await ctx.db.patch(messageId, {
      deleted: true,
      deletedReason: reason,
    });
  },
});

export const getMessage = internalQuery({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, { messageId }) => {
    return await ctx.db.get(messageId);
  },
});
