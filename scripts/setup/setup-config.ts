import { z } from "zod"

export const setupConfigSchema = z.object({
  appName: z.string().trim().min(1).max(60),
  description: z.string().trim().min(1).max(200),
  iconSource: z.string().trim().min(1),
  locale: z
    .string()
    .trim()
    .regex(/^[a-z]{2}(?:-[A-Z]{2})?$/),
  productionUrl: z.url().refine((url) => url.startsWith("https://"), {
    message: "Production URL must use HTTPS",
  }),
  shortName: z.string().trim().min(1).max(12),
})

export type SetupConfig = z.infer<typeof setupConfigSchema>

export function parseSetupConfig(input: unknown): SetupConfig {
  return setupConfigSchema.parse(input)
}
