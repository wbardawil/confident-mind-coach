import { z } from "zod";

export const SYSTEM_FREQUENCIES = ["daily", "weekly", "per-event"] as const;
export type SystemFrequency = (typeof SYSTEM_FREQUENCIES)[number];

export const SYSTEM_FREQUENCY_LABELS: Record<SystemFrequency, string> = {
  daily: "Daily",
  weekly: "Weekly",
  "per-event": "Per Event",
};

export const systemSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "System title is required")
    .max(200, "Title must be 200 characters or less"),
  description: z
    .string()
    .trim()
    .max(1000, "Description must be 1000 characters or less")
    .optional(),
  frequency: z.enum(SYSTEM_FREQUENCIES),
});

export type SystemInput = z.infer<typeof systemSchema>;

export const systemUpdateSchema = systemSchema;
export type SystemUpdateInput = SystemInput;
