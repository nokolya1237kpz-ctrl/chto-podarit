import { z } from 'zod';

export const productStatusSchema = z.enum(['draft', 'active', 'archived']);
export const riskLevelSchema = z.enum(['low', 'medium', 'high']);

export const productBaseSchema = z.object({
  title: z.string().trim().min(1, 'Укажите название товара'),
  description: z.string().optional(),
  price: z.coerce.number().min(0).default(0),
  oldPrice: z.coerce.number().min(0).optional(),
  currency: z.string().default('RUB'),
  marketplace: z.string().default('other'),
  originalUrl: z.string().optional().default(''),
  affiliateUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  recipients: z.array(z.string()).default([]),
  interests: z.array(z.string()).default([]),
  occasions: z.array(z.string()).default([]),
  giftTypes: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  wowRating: z.coerce.number().min(0).max(10).default(7),
  riskLevel: riskLevelSchema.default('low'),
  status: productStatusSchema.default('draft'),
  isActive: z.boolean().default(false),
  sourceProvider: z.string().default('manual'),
  sourceType: z.string().optional(),
  externalProductId: z.string().optional(),
});

export const createProductSchema = productBaseSchema;
export const updateProductSchema = productBaseSchema.partial().extend({
  id: z.string().min(1),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
