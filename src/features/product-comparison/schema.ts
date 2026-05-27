import { z } from 'zod';

export const compareSearchQuerySchema = z.object({
  q: z.string().trim().min(1, 'Введите товар для поиска'),
  sort: z.enum(['price_asc', 'relevance', 'marketplace']).optional(),
  marketplace: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
});

export type CompareSearchQuery = z.infer<typeof compareSearchQuerySchema>;
