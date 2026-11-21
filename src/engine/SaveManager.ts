import { INITIAL_PLAYER_SPAWN } from '../data/mountainWorld';
import {
  Direction,
  ItemId,
  NpcId,
  SaveData,
  ZoneId,
} from '../types/game';

export const SAVE_STORAGE_KEY = 'echo_du_col_save_v1';

const VALID_ZONES: ZoneId[] = ['forest', 'bridge', 'summit'];
const VALID_DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right'];
const VALID_ITEMS: ItemId[] = ['compass', 'thermos', 'flute'];
const VALID_NPCS: NpcId[] = [
  'barnabe',
  'cabine4',
  'echo_brouillard',
  'lanterne_col',
];

export function createFreshSave(): SaveData {
  return {
    version: 1,
    zoneId: INITIAL_PLAYER_SPAWN.zoneId,
    x: INITIAL_PLAYER_SPAWN.x,
    y: INITIAL_PLAYER_SPAWN.y,
    direction: INITIAL_PLAYER_SPAWN.direction,
    inventory: [],
    collectedItems: [],
    befriendedIds: [],
    flags: {},
    savedAt: Date.now(),
    saveCount: 0,
  };
}

export function serializeSave(save: SaveData): string {
  return JSON.stringify(save);
}

export function parseSave(raw: string | null): SaveData | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const obj = parsed as Record<string, unknown>;

    if (obj.version !== 1) return null;
    if (
      typeof obj.zoneId !== 'string' ||
      !VALID_ZONES.includes(obj.zoneId as ZoneId)
    ) {
      return null;
    }
    if (typeof obj.x !== 'number' || !Number.isFinite(obj.x)) return null;
    if (typeof obj.y !== 'number' || !Number.isFinite(obj.y)) return null;
    if (
      typeof obj.direction !== 'string' ||
      !VALID_DIRECTIONS.includes(obj.direction as Direction)
    ) {
      return null;
    }

    const inventory = Array.isArray(obj.inventory)
      ? obj.inventory.filter(
          (item): item is ItemId =>
            typeof item === 'string' && VALID_ITEMS.includes(item as ItemId)
        )
      : [];

    const collectedItems = Array.isArray(obj.collectedItems)
      ? obj.collectedItems.filter((id): id is string => typeof id === 'string')
      : [];

    const befriendedIds = Array.isArray(obj.befriendedIds)
      ? obj.befriendedIds.filter(
          (id): id is NpcId =>
            typeof id === 'string' && VALID_NPCS.includes(id as NpcId)
        )
      : [];

    const flags: Record<string, boolean> = {};
    if (typeof obj.flags === 'object' && obj.flags !== null) {
      for (const [k, v] of Object.entries(obj.flags as Record<string, unknown>)) {
        if (typeof v === 'boolean') {
          flags[k] = v;
        }
      }
    }

    return {
      version: 1,
      zoneId: obj.zoneId as ZoneId,
      x: Math.max(0.5, Math.min(15.5, obj.x)),
      y: Math.max(0.5, Math.min(17.5, obj.y)),
      direction: obj.direction as Direction,
      inventory,
      collectedItems,
      befriendedIds,
      flags,
      savedAt: typeof obj.savedAt === 'number' ? obj.savedAt : Date.now(),
      saveCount: typeof obj.saveCount === 'number' ? obj.saveCount : 1,
    };
  } catch {
    return null;
  }
}

export function loadSaveFromStorage(
  storage?: Pick<Storage, 'getItem'>
): SaveData | null {
  try {
    const store =
      storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (!store) return null;
    return parseSave(store.getItem(SAVE_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function writeSaveToStorage(
  save: SaveData,
  storage?: Pick<Storage, 'setItem'>
): boolean {
  try {
    const store =
      storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (!store) return false;
    store.setItem(SAVE_STORAGE_KEY, serializeSave(save));
    return true;
  } catch {
    return false;
  }
}

export function clearSaveStorage(
  storage?: Pick<Storage, 'removeItem'>
): void {
  try {
    const store =
      storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (!store) return;
    store.removeItem(SAVE_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export interface DialogueEffectInput {
  setFlag?: string;
  grantBefriend?: NpcId;
  consumeItem?: ItemId;
}

export function applyDialogueEffects(
  save: SaveData,
  effect: DialogueEffectInput
): SaveData {
  let changed = false;
  const nextFlags = { ...save.flags };
  let nextBefriended = save.befriendedIds;
  let nextInventory = save.inventory;

  if (effect.setFlag && !nextFlags[effect.setFlag]) {
    nextFlags[effect.setFlag] = true;
    changed = true;
  }

  if (effect.grantBefriend && !save.befriendedIds.includes(effect.grantBefriend)) {
    nextBefriended = [...save.befriendedIds, effect.grantBefriend];
    changed = true;
  }

  if (effect.consumeItem && save.inventory.includes(effect.consumeItem)) {
    nextInventory = save.inventory.filter((item) => item !== effect.consumeItem);
    changed = true;
  }

  if (!changed) return save;

  return {
    ...save,
    flags: nextFlags,
    befriendedIds: nextBefriended,
    inventory: nextInventory,
  };
}
