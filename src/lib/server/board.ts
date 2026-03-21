import type { BoardSlot, SlotSide, SlotType } from '@prisma/client';
import { boardCells } from '../../../prisma/seed-data.ts';

export function getSlotSide(slotNumber: number): SlotSide {
  if (slotNumber >= 0 && slotNumber <= 10) return 'BOTTOM';
  if (slotNumber >= 11 && slotNumber <= 20) return 'LEFT';
  if (slotNumber >= 21 && slotNumber <= 30) return 'TOP';
  return 'RIGHT';
}

export function getSideBasePoints(side: SlotSide) {
  if (side === 'BOTTOM') return 1;
  if (side === 'LEFT') return 2;
  if (side === 'TOP') return 3;
  return 4;
}

export function getSlotFallback(type: SlotType) {
  if (type === 'START') return '🏁';
  if (type === 'JAIL') return '🚓';
  if (type === 'LOTTERY') return '🎰';
  if (type === 'AUCTION') return '🔨';
  if (type === 'WHEEL') return '🎡';
  if (type === 'PODLYANKA') return '😈';
  if (type === 'KAIFARIK') return '✨';
  if (type === 'RANDOM') return '🎲';
  return '🎮';
}

export function isPlayableSlot(slot: Pick<BoardSlot, 'type'>) {
  return slot.type === 'REGULAR' || slot.type === 'RANDOM';
}

export function buildSlotConditions(name: string, side: SlotSide, type: SlotType) {
  const sideLabel = side === 'BOTTOM' ? 'нижней' : side === 'LEFT' ? 'левой' : side === 'TOP' ? 'верхней' : 'правой';
  const baseConditions = [
    `Закрыть слот «${name}» по основным условиям ${sideLabel} стороны.`,
    'Подтвердить результат вручную через completed или dropped.',
  ];

  if (type === 'WHEEL') baseConditions.push('Сначала применить результат колеса и только потом создавать ран.');
  if (type === 'JAIL') baseConditions.push('Разрулить штраф клетки перед следующим обычным раном.');
  if (type === 'LOTTERY' || type === 'AUCTION') baseConditions.push('Согласовать ручную механику с админом или судьёй.');
  if (type === 'PODLYANKA' || type === 'KAIFARIK') baseConditions.push('Сначала применить эффект клетки, затем брать новый слот.');

  const genreConditions = [
    `Выбрать жанровое условие для слота «${name}».`,
    'Жанровый слот всегда даёт x2 от базовых поинтов стороны.',
  ];

  if (type === 'RANDOM') genreConditions.push('Жанр определяется только после разрешения случайной части клетки.');
  if (type === 'REGULAR') genreConditions.push('Нельзя откатываться к base-условиям после выбора genre.');

  return { baseConditions, genreConditions };
}

export function createBoardSlotSeed(seasonId: string) {
  return boardCells.map(([name, type], index) => {
    const side = getSlotSide(index);
    const { baseConditions, genreConditions } = buildSlotConditions(name, side, type);

    return {
      seasonId,
      slotNumber: index,
      name,
      type,
      side,
      imageUrl: null,
      imageFallback: getSlotFallback(type),
      baseConditions,
      genreConditions,
      description: `Слот ${index} на ${side.toLowerCase()} стороне поля.`,
      isPlayable: type === 'REGULAR' || type === 'RANDOM',
      isPublished: true,
    };
  });
}
