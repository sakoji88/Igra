import { z } from 'zod';
import { normalizeStringList } from '@/lib/server/items';

export const loginSchema = z.object({
  nickname: z.string().trim().min(3, 'Никнейм должен быть минимум 3 символа.').max(32, 'Никнейм не должен быть длиннее 32 символов.'),
  password: z.string().min(6, 'Пароль должен быть минимум 6 символов.'),
});

export const registerSchema = z.object({
  nickname: z.string().trim().min(3, 'Никнейм должен быть минимум 3 символа.').max(32, 'Никнейм не должен быть длиннее 32 символов.').regex(/^[a-zA-Z0-9_а-яА-Я-]+$/u, 'Только буквы, цифры, _, -'),
  password: z.string().min(6, 'Пароль должен быть минимум 6 символов.'),
  avatarUrl: z.string().url('Ссылка на аватар должна быть корректным URL.').optional().or(z.literal('')),
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
  conflictKey: z.string().optional().or(z.literal('')),
  active: z.enum(['true', 'false']).transform((value) => value === 'true'),
}).transform((value) => ({ ...value, conflictKey: value.conflictKey || null }));

export const ruleSectionSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.string().min(1),
  order: z.coerce.number().int().min(0),
  published: z.enum(['true', 'false']).transform((value) => value === 'true'),
});

export const slotUpdateSchema = z.object({
  slotId: z.string().min(1),
  slotNumber: z.coerce.number().int().min(0).max(39),
  name: z.string().min(1),
  type: z.enum(['START', 'REGULAR', 'RANDOM', 'JAIL', 'LOTTERY', 'AUCTION', 'PODLYANKA', 'KAIFARIK', 'WHEEL']),
  side: z.enum(['BOTTOM', 'LEFT', 'TOP', 'RIGHT']),
  imageUrl: z.string().url().optional().or(z.literal('')),
  imageFallback: z.string().min(1),
  baseConditions: z.string().transform(normalizeStringList),
  genreConditions: z.string().transform(normalizeStringList),
  description: z.string().optional().or(z.literal('')),
  isPlayable: z.enum(['true', 'false']).transform((value) => value === 'true'),
  isPublished: z.enum(['true', 'false']).transform((value) => value === 'true'),
}).transform((value) => ({ ...value, imageUrl: value.imageUrl || null, description: value.description || null }));

export const wheelDefinitionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().or(z.literal('')),
  imageUrl: z.string().url().optional().or(z.literal('')),
  active: z.enum(['true', 'false']).transform((value) => value === 'true'),
}).transform((value) => ({ ...value, description: value.description || null, imageUrl: value.imageUrl || null }));

export const wheelEntrySchema = z.object({
  label: z.string().min(1),
  description: z.string().optional().or(z.literal('')),
  imageUrl: z.string().url().optional().or(z.literal('')),
  rewardType: z.enum(['ITEM', 'SPINS', 'NOTHING']),
  itemDefinitionId: z.string().optional().or(z.literal('')),
  rewardSpins: z.coerce.number().int().min(0).optional(),
  weight: z.coerce.number().int().min(1),
  active: z.enum(['true', 'false']).transform((value) => value === 'true'),
}).transform((value) => ({
  ...value,
  description: value.description || null,
  imageUrl: value.imageUrl || null,
  itemDefinitionId: value.itemDefinitionId || null,
  rewardSpins: value.rewardType === 'SPINS' ? value.rewardSpins ?? 1 : null,
}));
