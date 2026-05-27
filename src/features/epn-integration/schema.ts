import { z } from 'zod';

export const epnDeeplinkRequestSchema = z.object({
  offerId: z.string().optional(),
  originalUrl: z.string().url(),
  placementId: z.string().optional(),
  subId: z.string().optional(),
});

export const epnImportRequestSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(10),
  query: z.string().optional(),
});
