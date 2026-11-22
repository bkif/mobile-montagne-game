import { INITIAL_PLAYER_START } from '../data/mountainWorld';
import {
  ActId,
  CreatureId,
  Direction,
  InventoryEntry,
  InventoryItemId,
  SaveDataV2,
  StoryFlags,
} from '../types/game';

export const SAVE_STORAGE_KEY_V2 = 'echo_du_col_save_v2';
export const LEGACY_SAVE_STORAGE_KEY_V1 = 'echo_du_col_save_v1';

const VALID_ACTS: ActId[] = [1, 2, 3, 4];
const VALID_DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right'];
const VALID_ITEMS: InventoryItemId[] = [
  'cloche_felee',
  'baies_eglantier',
  'tisane_pin',
  'corde_alpiniste',
  'cristal_echo',
  'page_carnet_liee',
];
const VALID_CREATURES: CreatureId[] = [
  'lynx_boreal',
  'cerf_brumes',
  'gypaete_cimes',
  'monolithe_resonant',
];

export function createFreshSave(): SaveDataV2 {
  return {
    version: 2,
    actId: INITIAL_PLAYER_START.actId,
    playerX: INITIAL_PLAYER_START.x,
    playerY: INITIAL_PLAYER_START.y,
    direction: INITIAL_PLAYER_START.direction,
    calm: 100,
    stamina: 100,
    storyFlags: {},
    rebuiltCairns: [],
    collectedNotes: [],
    pacifiedCreatures: [],
    collectedPickups: [],
    inventory: [],
    savedAt: Date.now(),
    saveCount: 0,
  };
}

export function serializeSave(save: SaveDataV2): string {
  return JSON.stringify(save);
}

export function parseSave(raw: string | null): SaveDataV2 | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const obj = parsed as Record<string, unknown>;

    // Graceful migration from legacy v1 save format
    if (obj.version === 1) {
      const legacyZone = obj.zoneId;
      const actId: ActId =
        legacyZone === 'bridge' ? 2 : legacyZone === 'summit' ? 4 : 1;
      return {
        ...createFreshSave(),
        actId,
        saveCount: typeof obj.saveCount === 'number' ? obj.saveCount : 1,
        savedAt: typeof obj.savedAt === 'number' ? obj.savedAt : Date.now(),
      };
    }

    if (obj.version !== 2) return null;

    if (
      typeof obj.actId !== 'number' ||
      !VALID_ACTS.includes(obj.actId as ActId)
    ) {
      return null;
    }
    if (typeof obj.playerX !== 'number' || !Number.isFinite(obj.playerX)) {
      return null;
    }
    if (typeof obj.playerY !== 'number' || !Number.isFinite(obj.playerY)) {
      return null;
    }
    if (
      typeof obj.direction !== 'string' ||
      !VALID_DIRECTIONS.includes(obj.direction as Direction)
    ) {
      return null;
    }

    const storyFlags: StoryFlags = {};
    if (typeof obj.storyFlags === 'object' && obj.storyFlags !== null) {
      for (const [k, v] of Object.entries(
        obj.storyFlags as Record<string, unknown>
      )) {
        if (typeof v === 'boolean') storyFlags[k] = v;
      }
    }

    const filterStrings = (val: unknown): string[] =>
      Array.isArray(val)
        ? val.filter((x): x is string => typeof x === 'string')
        : [];

    const pacifiedCreatures = Array.isArray(obj.pacifiedCreatures)
      ? obj.pacifiedCreatures.filter(
          (c): c is CreatureId =>
            typeof c === 'string' &&
            VALID_CREATURES.includes(c as CreatureId)
        )
      : [];

    const inventory: InventoryEntry[] = [];
    if (Array.isArray(obj.inventory)) {
      for (const entry of obj.inventory) {
        if (typeof entry !== 'object' || entry === null) continue;
        const rec = entry as Record<string, unknown>;
        if (
          typeof rec.id === 'string' &&
          VALID_ITEMS.includes(rec.id as InventoryItemId) &&
          typeof rec.quantity === 'number' &&
          rec.quantity > 0
        ) {
          inventory.push({
            id: rec.id as InventoryItemId,
            quantity: Math.floor(rec.quantity),
          });
        }
      }
    }

    return {
      version: 2,
      actId: obj.actId as ActId,
      playerX: Math.max(0.5, Math.min(19.5, obj.playerX)),
      playerY: Math.max(0.5, Math.min(19.5, obj.playerY)),
      direction: obj.direction as Direction,
      calm:
        typeof obj.calm === 'number' && Number.isFinite(obj.calm)
          ? Math.max(0, Math.min(100, obj.calm))
          : 100,
      stamina:
        typeof obj.stamina === 'number' && Number.isFinite(obj.stamina)
          ? Math.max(0, Math.min(100, obj.stamina))
          : 100,
      storyFlags,
      rebuiltCairns: filterStrings(obj.rebuiltCairns),
      collectedNotes: filterStrings(obj.collectedNotes),
      pacifiedCreatures,
      collectedPickups: filterStrings(obj.collectedPickups),
      inventory: inventory.slice(0, 6),
      savedAt: typeof obj.savedAt === 'number' ? obj.savedAt : Date.now(),
      saveCount: typeof obj.saveCount === 'number' ? obj.saveCount : 1,
    };
  } catch {
    return null;
  }
}

export function loadSaveFromStorage(
  storage?: Pick<Storage, 'getItem'>
): SaveDataV2 | null {
  try {
    const store =
      storage ??
      (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (!store) return null;

    const rawV2 = store.getItem(SAVE_STORAGE_KEY_V2);
    if (rawV2) {
      return parseSave(rawV2);
    }

    const rawV1 = store.getItem(LEGACY_SAVE_STORAGE_KEY_V1);
    if (rawV1) {
      return parseSave(rawV1);
    }

    return null;
  } catch {
    return null;
  }
}

export function writeSaveToStorage(
  save: SaveDataV2,
  storage?: Pick<Storage, 'setItem'>
): boolean {
  try {
    const store =
      storage ??
      (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (!store) return false;
    store.setItem(SAVE_STORAGE_KEY_V2, serializeSave(save));
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
      storage ??
      (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (!store) return;
    store.removeItem(SAVE_STORAGE_KEY_V2);
    store.removeItem(LEGACY_SAVE_STORAGE_KEY_V1);
  } catch {
    // Ignore storage errors
  }
}

export function addInventoryItem(
  inventory: InventoryEntry[],
  itemId: InventoryItemId,
  amount = 1
): InventoryEntry[] {
  const existing = inventory.find((e) => e.id === itemId);
  if (existing) {
    return inventory.map((e) =>
      e.id === itemId ? { ...e, quantity: e.quantity + amount } : e
    );
  }
  if (inventory.length >= 6) return inventory;
  return [...inventory, { id: itemId, quantity: amount }];
}

export function consumeInventoryItem(
  inventory: InventoryEntry[],
  itemId: InventoryItemId
): InventoryEntry[] {
  return inventory
    .map((e) =>
      e.id === itemId ? { ...e, quantity: e.quantity - 1 } : e
    )
    .filter((e) => e.quantity > 0);
}

export interface NarrativeEffectInput {
  setFlag?: string;
  grantItem?: InventoryItemId;
  consumeItem?: InventoryItemId;
  grantPacify?: CreatureId;
}

export function applyNarrativeEffects(
  save: SaveDataV2,
  effect: NarrativeEffectInput
): SaveDataV2 {
  let changed = false;
  let nextFlags = save.storyFlags;
  let nextInventory = save.inventory;
  let nextPacified = save.pacifiedCreatures;

  if (effect.setFlag && !save.storyFlags[effect.setFlag]) {
    nextFlags = { ...save.storyFlags, [effect.setFlag]: true };
    changed = true;
  }

  if (effect.grantItem) {
    nextInventory = addInventoryItem(nextInventory, effect.grantItem, 1);
    changed = true;
  }

  if (effect.consumeItem) {
    const updated = consumeInventoryItem(nextInventory, effect.consumeItem);
    if (updated !== nextInventory) {
      nextInventory = updated;
      changed = true;
    }
  }

  if (
    effect.grantPacify &&
    !save.pacifiedCreatures.includes(effect.grantPacify)
  ) {
    nextPacified = [...save.pacifiedCreatures, effect.grantPacify];
    changed = true;
  }

  if (!changed) return save;

  return {
    ...save,
    storyFlags: nextFlags,
    inventory: nextInventory,
    pacifiedCreatures: nextPacified,
  };
}
