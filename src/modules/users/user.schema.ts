import { z } from "zod";

export const SearchUsersQuerySchema = z.object({
  username: z.string().optional(),
  page: z.string().regex(/^\d+$/).optional().transform(Number).default(1),
  limit: z.string().regex(/^\d+$/).optional().transform(Number).default(10),
});

export const UpdateProfileSchema = z.object({
  username: z.string().min(3).max(30).trim().optional(),
  avatar: z.string().url("Avatar must be a valid URL").optional(),
  bio: z.string().max(200, "Bio must not exceed 200 characters").optional(),
  status: z.enum(["online", "offline", "away", "busy"]).optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
