import { z } from "zod";

// ── Create ────────────────────────────────────────────────────────────────────

export const CreateDirectConversationSchema = z.object({
  participantId: z
    .string({ required_error: "participantId is required." })
    .regex(/^[a-f\d]{24}$/i, "participantId must be a valid MongoDB ObjectId."),
});

export const CreateGroupConversationSchema = z.object({
  name: z
    .string({ required_error: "Group name is required." })
    .min(1, "Group name must not be empty.")
    .max(100, "Group name must not exceed 100 characters.")
    .trim(),
  participantIds: z
    .array(
      z.string().regex(/^[a-f\d]{24}$/i, "Each participantId must be a valid MongoDB ObjectId.")
    )
    .min(2, "A group conversation requires at least 2 other participants.")
    .max(49, "A group conversation can have at most 50 participants (including yourself)."),
  avatar: z.string().url("Avatar must be a valid URL.").optional(),
});

// ── Update (group only) ───────────────────────────────────────────────────────

export const UpdateGroupConversationSchema = z
  .object({
    name: z.string().min(1).max(100).trim().optional(),
    avatar: z.string().url("Avatar must be a valid URL.").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update.",
  });

export const AddParticipantsSchema = z.object({
  participantIds: z
    .array(
      z.string().regex(/^[a-f\d]{24}$/i, "Each participantId must be a valid MongoDB ObjectId.")
    )
    .min(1, "At least one participantId is required."),
});

export const RemoveParticipantSchema = z.object({
  participantId: z
    .string({ required_error: "participantId is required." })
    .regex(/^[a-f\d]{24}$/i, "participantId must be a valid MongoDB ObjectId."),
});

// ── Query ─────────────────────────────────────────────────────────────────────

export const GetConversationsQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional().transform(Number).default(1),
  limit: z.string().regex(/^\d+$/).optional().transform(Number).default(20),
});

// ── Types ─────────────────────────────────────────────────────────────────────

export type CreateDirectConversationInput = z.infer<typeof CreateDirectConversationSchema>;
export type CreateGroupConversationInput = z.infer<typeof CreateGroupConversationSchema>;
export type UpdateGroupConversationInput = z.infer<typeof UpdateGroupConversationSchema>;
export type AddParticipantsInput = z.infer<typeof AddParticipantsSchema>;
export type RemoveParticipantInput = z.infer<typeof RemoveParticipantSchema>;
export type GetConversationsQueryInput = z.infer<typeof GetConversationsQuerySchema>;
