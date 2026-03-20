import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const assignmentSchema = z.object({
  title: z.string().min(1),
  conditionType: z.enum(['BASE', 'GENRE']),
  url: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
  price: z.coerce.number().min(0).optional(),
  duration: z.coerce.number().min(0).optional(),
  tags: z.string().optional(),
});
