import { z } from "zod";

// ── Query ─────────────────────────────────────────────────────────────────────

export const GetNotificationsQuerySchema = z.object({
  page: z.string().regex(/^[1-9]\d*$/).optional().transform(Number).default(1),
  limit: z.string().regex(/^[1-9]\d*$/).optional().transform(Number).default(20),
});

// ── Types ─────────────────────────────────────────────────────────────────────

export type GetNotificationsQueryInput = z.infer<typeof GetNotificationsQuerySchema>;
