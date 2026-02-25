import { z } from 'zod';

export const RequestSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().positive(),
  price_offered: z.number().positive(),
  expires_at: z.date().default(() => new Date(Date.now() + 24 * 60 * 60 * 1000)),
});