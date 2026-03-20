import { z } from 'zod';

export const loginSchema = z.object({
  nickname: z.string().min(3).max(32),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  nickname: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_а-яА-Я-]+$/u, 'Только буквы, цифры, _, -'),
  password: z.string().min(6),
  avatarUrl: z.string().url().optional().or(z.literal('')),
});

export const runUpdateSchema = z.object({
  gameTitle: z.string().min(1, 'Нужно указать игру'),
  gameUrl: z.string().url().optional().or(z.literal('')),
  playerComment: z.string().optional(),
});

export const upcomingEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  eventDate: z.string().optional(),
  status: z.enum(['PLANNED', 'DONE', 'CANCELED']).default('PLANNED'),
});

export const itemDefinitionSchema = z.object({
  number: z.coerce.number().int().min(1),
  name: z.string().min(1),
  type: z.enum(['BUFF', 'DEBUFF', 'TRAP', 'NEUTRAL']),
  description: z.string().min(1),
  imageUrl: z.string().url().optional().or(z.literal('')),
  chargesDefault: z.coerce.number().int().min(1),
  allowedTargets: z.string().min(1),
  active: z.enum(['true', 'false']).transform((value) => value === 'true'),
});

export const ruleSectionSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.string().min(1),
  order: z.coerce.number().int().min(0),
  published: z.enum(['true', 'false']).transform((value) => value === 'true'),
});
