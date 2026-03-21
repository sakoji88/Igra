import { readFileSync } from 'node:fs';
import path from 'node:path';

export type EffectStage =
  | 'before_roll'
  | 'after_roll'
  | 'before_move'
  | 'after_move'
  | 'before_condition_select'
  | 'after_condition_select'
  | 'on_game_assigned'
  | 'while_game_active'
  | 'on_score_calculation';

export type EffectType =
  | 'move_modifier'
  | 'conditional_move_modifier'
  | 'score_modifier'
  | 'condition_lock'
  | 'active_game_note';

export type ItemEffectConfig = {
  id: string;
  triggerStage: EffectStage;
  effectType: EffectType;
  value: number | string;
  priority: number;
  stackable: boolean;
  oneTime: boolean;
  consumption: 'on_trigger' | 'on_assignment_created' | 'on_run_resolved' | 'manual';
  applicationText: string;
  conditions?: { maxRawRoll?: number };
};

export type ContentItemDefinition = {
  id: string;
  number: number;
  name: string;
  type: 'BUFF' | 'DEBUFF' | 'TRAP' | 'NEUTRAL';
  description: string;
  shortLabel: string;
  imageUrl: string;
  chargesDefault: number;
  allowedTargets: string;
  targetType: string;
  duration: string;
  conflictKey: string | null;
  active: boolean;
  manualReview: boolean;
  rawTextSource: string;
  sourceType: 'DOCS';
  stackable: boolean;
  consumable: boolean;
  priority: number;
  mechanics: ItemEffectConfig[];
};

export type RuleSectionContent = {
  slug: string;
  title: string;
  order: number;
  published: boolean;
  manualReview: boolean;
  rawTextSource: string;
  content: string;
};

const rawTextSource = 'docs/rules-and-items.md';
const docsText = readFileSync(path.join(process.cwd(), rawTextSource), 'utf8');

function getSectionBody(title: string, nextTitles: string[]) {
  const start = docsText.indexOf(`## ${title}`);
  if (start < 0) throw new Error(`Section not found in ${rawTextSource}: ${title}`);
  const fromStart = docsText.slice(start + `## ${title}`.length);
  const endCandidates = nextTitles
    .map((nextTitle) => {
      const index = fromStart.indexOf(`\n## ${nextTitle}`);
      return index >= 0 ? index : Number.POSITIVE_INFINITY;
    });
  const endIndex = Math.min(...endCandidates);
  return (endIndex === Number.POSITIVE_INFINITY ? fromStart : fromStart.slice(0, endIndex)).trim();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-zа-я0-9]+/giu, '-')
    .replace(/^-+|-+$/g, '');
}

function parseRulesSection() {
  const body = getSectionBody('Правила энциклопедии', ['Предметы']);
  const sections = [...body.matchAll(/###\s+(.+)\n([\s\S]*?)(?=\n###\s+|$)/g)];
  return sections.map((match, index) => ({
    slug: slugify(match[1]),
    title: match[1].trim(),
    order: index + 1,
    published: true,
    manualReview: false,
    rawTextSource,
    content: match[2].trim().replace(/\n+/g, '\n'),
  })) satisfies RuleSectionContent[];
}

function parseGlossary() {
  const body = getSectionBody('Глоссарий', ['Особые механики']);
  return [...body.matchAll(/- \*\*(.+?)\*\* — (.+)/g)].map((match) => ({ term: match[1], description: match[2].trim(), manualReview: false }));
}

function parseSpecialMechanics() {
  const body = getSectionBody('Особые механики', ['Правила энциклопедии']);
  return body.split('\n').filter((line) => line.startsWith('- ')).map((line, index) => ({ id: `mechanic-${index + 1}`, title: `Механика ${index + 1}`, description: line.slice(2).trim(), manualReview: false }));
}

function buildMechanics(number: number, stages: string, effectText: string, description: string): ItemEffectConfig[] {
  if (number === 1) return [{ id: 'easy-eyes-move', triggerStage: 'after_roll', effectType: 'move_modifier', value: 1, priority: 80, stackable: false, oneTime: true, consumption: 'on_trigger', applicationText: description }];
  if (number === 2) return [{ id: 'blindfold-curse-move', triggerStage: 'after_roll', effectType: 'move_modifier', value: -1, priority: 85, stackable: false, oneTime: true, consumption: 'on_trigger', applicationText: description }];
  if (number === 3) return [
    { id: 'chill-playlist-active-tag', triggerStage: 'while_game_active', effectType: 'active_game_note', value: description, priority: 40, stackable: false, oneTime: false, consumption: 'on_run_resolved', applicationText: description },
    { id: 'chill-playlist-score', triggerStage: 'on_score_calculation', effectType: 'score_modifier', value: 1, priority: 70, stackable: false, oneTime: true, consumption: 'on_run_resolved', applicationText: 'Чилловый плейлист добавляет +1 очко к награде за активную игру.' },
  ];
  if (number === 4) return [
    { id: 'doomscroll-active-tag', triggerStage: 'while_game_active', effectType: 'active_game_note', value: description, priority: 45, stackable: false, oneTime: false, consumption: 'on_run_resolved', applicationText: description },
    { id: 'doomscroll-score', triggerStage: 'on_score_calculation', effectType: 'score_modifier', value: -1, priority: 75, stackable: false, oneTime: true, consumption: 'on_run_resolved', applicationText: 'Думскролл-шторм отнимает 1 очко от награды за игру.' },
  ];
  if (number === 5) return [{ id: 'banana-mine-move', triggerStage: 'before_move', effectType: 'move_modifier', value: -2, priority: 90, stackable: false, oneTime: true, consumption: 'on_trigger', applicationText: description }];
  if (number === 6) return [{ id: 'toxic-spoiler-lock', triggerStage: 'before_condition_select', effectType: 'condition_lock', value: 'BASE', priority: 95, stackable: false, oneTime: true, consumption: 'on_assignment_created', applicationText: description }];
  if (number === 7) return [{ id: 'clean-reroll-vibe-move', triggerStage: 'after_roll', effectType: 'conditional_move_modifier', value: 2, priority: 60, stackable: false, oneTime: true, consumption: 'on_trigger', applicationText: description, conditions: { maxRawRoll: 5 } }];
  return [{ id: `item-${number}-manual`, triggerStage: 'after_roll', effectType: 'active_game_note', value: effectText, priority: 10, stackable: false, oneTime: false, consumption: 'manual', applicationText: `Нужна ручная проверка: ${effectText}` }];
}

function parseItemsSection() {
  const body = getSectionBody('Предметы', ['Секторы колеса']);
  const entries = [...body.matchAll(/###\s+#(\d+)\s+(.+)\n([\s\S]*?)(?=\n###\s+#|$)/g)];
  return entries.map((match) => {
    const number = Number(match[1]);
    const name = match[2].trim();
    const bullets = Object.fromEntries([...match[3].matchAll(/-\s+([^:]+):\s+(.+)/g)].map((line) => [line[1].trim(), line[2].trim()]));
    const type = String(bullets['Тип'] ?? 'NEUTRAL').trim() as ContentItemDefinition['type'];
    const description = String(bullets['Описание'] ?? '');
    const stageText = String(bullets['Срабатывание'] ?? '');
    const effectText = String(bullets['Эффект'] ?? '');
    const conflictKey = type === 'BUFF' || type === 'DEBUFF' ? (name.includes('глаза') || name.includes('повязки') ? 'eyes' : name.includes('плейлист') || name.includes('Думскролл') ? 'focus' : null) : null;
    const allowedTargets = number === 5 || number === 6 ? 'other' : number === 2 || number === 4 ? 'self,other' : 'self';
    return {
      id: slugify(name),
      number,
      name,
      description,
      type,
      shortLabel: number === 6 ? 'Только Base' : number === 7 ? '+2 при 5-' : description.includes('+1 очко') ? '+1 очко' : description.includes('1 очко меньше') ? '-1 очко' : description.includes('2 клетки меньше') ? '-2 ход' : description.includes('увеличивается на 1') ? '+1 ход' : description.includes('уменьшается на 1') ? '-1 ход' : name,
      imageUrl: number === 1 ? 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=400&q=80' : number === 2 ? 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80' : number === 3 ? 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=400&q=80' : number === 4 ? 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80' : number === 5 ? 'https://images.unsplash.com/photo-1574226516831-e1dff420e37f?auto=format&fit=crop&w=400&q=80' : number === 6 ? 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=400&q=80' : 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&w=400&q=80',
      chargesDefault: 1,
      allowedTargets,
      targetType: allowedTargets,
      duration: stageText.includes('while_game_active') ? 'active_game' : 'next_trigger',
      conflictKey,
      active: true,
      manualReview: false,
      rawTextSource,
      sourceType: 'DOCS' as const,
      stackable: false,
      consumable: !stageText.includes('while_game_active'),
      priority: 50,
      mechanics: buildMechanics(number, stageText, effectText, description),
    } satisfies ContentItemDefinition;
  });
}

function parseWheelEntries(items: ContentItemDefinition[]) {
  const body = getSectionBody('Секторы колеса', []);
  return body
    .split('\n')
    .filter((line) => line.startsWith('- '))
    .map((line, index) => {
      const label = line.slice(2).trim();
      const linkedItem = items.find((item) => item.name === label) ?? null;
      if (label === '+1 дополнительный спин') {
        return { id: `wheel-${index + 1}`, number: index + 1, name: label, fullText: label, category: 'BONUS', linkedItemId: null, linkedEffectId: null, resultType: 'SPINS', rewardSpins: 1, targetingRules: null, manualReview: false, label, description: 'Колесо даёт ещё одну попытку.', rewardType: 'SPINS', itemNumber: undefined, weight: 1, imageUrl: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&w=400&q=80', active: true };
      }
      if (label === 'Ничего, кроме вайба') {
        return { id: `wheel-${index + 1}`, number: index + 1, name: label, fullText: label, category: 'EMPTY', linkedItemId: null, linkedEffectId: null, resultType: 'NOTHING', rewardSpins: null, targetingRules: null, manualReview: false, label, description: 'Пустой сектор без награды, но с настроением.', rewardType: 'NOTHING', itemNumber: undefined, weight: 1, imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&q=80', active: true };
      }
      return { id: `wheel-${index + 1}`, number: index + 1, name: label, fullText: label, category: 'ITEM', linkedItemId: linkedItem?.id ?? null, linkedEffectId: null, resultType: 'ITEM', rewardSpins: null, targetingRules: linkedItem?.targetType ?? null, manualReview: false, label, description: linkedItem?.description ?? label, rewardType: 'ITEM', itemNumber: linkedItem?.number, weight: linkedItem?.type === 'BUFF' ? 3 : linkedItem?.type === 'DEBUFF' ? 2 : 2, imageUrl: linkedItem?.imageUrl, active: true };
    });
}

export const coreRuleSections = parseRulesSection();
export const glossaryEntries = parseGlossary();
export const specialMechanics = parseSpecialMechanics();
export const contentItemDefinitions = parseItemsSection();
export const wheelEntriesContent = parseWheelEntries(contentItemDefinitions);

const itemsByNumber = new Map(contentItemDefinitions.map((item) => [item.number, item]));

export function getContentItemDefinitionByNumber(number: number) {
  return itemsByNumber.get(number) ?? null;
}
