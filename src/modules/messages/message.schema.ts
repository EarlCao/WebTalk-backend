import { z } from "zod";

// ── Send ──────────────────────────────────────────────────────────────────────

export const SendMessageSchema = z.object({
  conversationId: z
    .string({ error: (issue) => (issue.input === undefined ? "conversationId is required." : undefined) })
    .regex(/^[a-f\d]{24}$/i, "conversationId must be a valid MongoDB ObjectId."),
  content: z
    .string({ error: (issue) => (issue.input === undefined ? "content is required." : undefined) })
    .min(1, "Message content must not be empty.")
    .max(5000, "Message content must not exceed 5 000 characters.")
    .trim(),
  type: z
    .enum(["text", "system"])
    .optional()
    .default("text"),
});

// ── Edit ──────────────────────────────────────────────────────────────────────

export const EditMessageSchema = z.object({
  content: z
    .string({ error: (issue) => (issue.input === undefined ? "content is required." : undefined) })
    .min(1, "Message content must not be empty.")
    .max(5000, "Message content must not exceed 5 000 characters.")
    .trim(),
});

// ── Query ─────────────────────────────────────────────────────────────────────

export const GetMessagesQuerySchema = z.object({
  conversationId: z
    .string({ error: (issue) => (issue.input === undefined ? "conversationId is required." : undefined) })
    .regex(/^[a-f\d]{24}$/i, "conversationId must be a valid MongoDB ObjectId."),
  page: z.string().regex(/^\d+$/).optional().transform(Number).default(1),
  limit: z.string().regex(/^\d+$/).optional().transform(Number).default(30),
});

// ── Types ─────────────────────────────────────────────────────────────────────

export type SendMessageInput = z.infer<typeof SendMessageSchema>;
export type EditMessageInput = z.infer<typeof EditMessageSchema>;
export type GetMessagesQueryInput = z.infer<typeof GetMessagesQuerySchema>;
