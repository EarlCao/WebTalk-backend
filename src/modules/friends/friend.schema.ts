import { z } from "zod";

const objectIdRegex = /^[a-f\d]{24}$/i;

// ── Send ──────────────────────────────────────────────────────────────────────

export const SendFriendRequestSchema = z.object({
  addresseeId: z
    .string({
      error: (issue) => (issue.input === undefined ? "addresseeId is required." : undefined),
    })
    .regex(objectIdRegex, "addresseeId must be a valid MongoDB ObjectId."),
});

// ── Query (shared for friends list + request lists) ───────────────────────────

export const GetFriendsQuerySchema = z.object({
  // /^[1-9]\d*$/ rejects "0" and leading-zero strings, guaranteeing page >= 1
  // so that (page - 1) * limit is never negative when passed to .skip().
  page: z.string().regex(/^[1-9]\d*$/).optional().transform(Number).default(1),
  limit: z.string().regex(/^[1-9]\d*$/).optional().transform(Number).default(20),
});

// ── Types ─────────────────────────────────────────────────────────────────────

export type SendFriendRequestInput = z.infer<typeof SendFriendRequestSchema>;
export type GetFriendsQueryInput = z.infer<typeof GetFriendsQuerySchema>;
