import { boardCells, currentSeason, defaultItemDefinitions } from '../../../prisma/seed-data';

export type Role = 'ADMIN' | 'JUDGE' | 'PLAYER';
export type AssignmentStatus = 'ACTIVE' | 'COMPLETED' | 'DROPPED' | 'DISPUTED' | 'RESOLVED';
export type ConditionType = 'BASE' | 'GENRE';

export const season = { ...currentSeason, id: 'season-1' };
export const players: Array<never> = [];
export const board = boardCells.map(([label, type], index) => ({ id: `cell-${index}`, index, label, type }));
export const items = defaultItemDefinitions;
export const wheelDefinitions: Array<never> = [];
export const eventLog: Array<never> = [];
export const assignments: Array<never> = [];
