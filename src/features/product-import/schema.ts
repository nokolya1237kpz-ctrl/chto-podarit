import { z } from 'zod';

export const importItemSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  price: z.coerce.number().optional(),
  oldPrice: z.coerce.number().optional(),
  imageUrl: z.string().optional(),
  productUrl: z.string().optional(),
  originalUrl: z.string().optional(),
  affiliateUrl: z.string().optional(),
  marketplace: z.string().optional(),
  category: z.string().optional(),
  tags: z.union([z.array(z.string()), z.string()]).optional(),
  externalProductId: z.string().optional(),
  availability: z.string().optional(),
}).passthrough();

export const importFileRequestSchema = z.object({
  items: z.array(importItemSchema).default([]),
  columnMapping: z.record(z.string(), z.string()).default({}),
});

export const urlImportRequestSchema = z.object({
  urls: z.array(z.string().trim().min(1)).min(1).max(100),
});

export const feedImportRequestSchema = z.object({
  feedUrl: z.string().url(),
  marketplace: z.string().optional(),
  format: z.enum(['auto', 'xml', 'yml', 'csv', 'json']).default('auto'),
});

export type ImportItemInput = z.infer<typeof importItemSchema>;
