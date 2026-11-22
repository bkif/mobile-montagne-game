import { describe, expect, it } from 'vitest';
import {
  WORLD_ENTITIES,
  ZONES,
  isTileSolid,
} from '../../data/mountainWorld';
import {
  DIALOGUE_TREE,
  JOURNAL_NOTES,
  PACIFY_ENCOUNTERS,
  computeEndingId,
  evaluateDialogueCondition,
  getCurrentObjective,
} from '../../data/narrativeScript';
import {
  RESONANCE_TARGET_RADIUS,
  SOUFFLE_SERENE_MAX,
  SOUFFLE_SERENE_MIN,
  applyPacifyItem,
  createPacifyState,
  setSouffleHolding,
  stepPacifyState,
  switchPacifyMode,
  triggerResonanceTap,
} from '../PacifyMiniGameEngine';
import {
  LEGACY_SAVE_STORAGE_KEY_V1,
  SAVE_STORAGE_KEY_V2,
  addInventoryItem,
  applyNarrativeEffects,
  createFreshSave,
  loadSaveFromStorage,
  parseSave,
  serializeSave,
  writeSaveToStorage,
} from '../SaveManager';
import {
  DASH_STAMINA_COST,
  canOccupyPosition,
  createBellPulse,
  scanProximityInteractable,
  stepPlayerPhysics,
  triggerDash,
} from '../WorldEngine';
import { PlayerState } from '../../types/game';

function makePlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    actId: 1,
    x: 9.5,
    y: 15.5,
    vx: 0,
    vy: 0,
    direction: 'up',
    isMoving: false,
    animFrame: 0,
    animTimer: 0,
    footstepTimer: 0,
    stamina: 100,
    staminaCooldown: 0,
    dashTimer: 0,
    dashDirX: 0,
    dashDirY: -1,
    calm: 100,
    ...overrides,
  };
}

describe('WorldEngine physics, 5px corner-sliding, Dash, and 44px scanner', () => {
  it('enforces AABB collision and clears Act II mist walls when cairns are rebuilt', () => {
    const save = createFreshSave();
    expect(canOccupyPosition(1, 9.5, 19.5, save)).toBe(false);
    expect(canOccupyPosition(1, 9.5, 15.5, save)).toBe(true);

    // Act II mist at (3, 11) is solid until cairn_1 is rebuilt
    expect(isTileSolid('mist', 3, 11, 2, save.rebuiltCairns)).toBe(true);
    expect(canOccupyPosition(2, 3.5, 11.5, save)).toBe(false);

    const withCairn1 = { ...save, rebuiltCairns: ['cairn_1'] };
    expect(isTileSolid('mist', 3, 11, 2, withCairn1.rebuiltCairns)).toBe(false);
    expect(canOccupyPosition(2, 3.5, 11.5, withCairn1)).toBe(true);
  });

  it('slides smoothly perpendicular when clipping within 5px of an obstacle corner', () => {
    const save = applyNarrativeEffects(createFreshSave(), {
      setFlag: 'resolved_lynx_boreal',
    });
    // Act II row 7: col 8 is rock, col 9 is open path, col 10 is rock.
    // Player at x = 9.08 walking straight up has left edge 9.08 - 0.27 = 8.81 (clips col 8 rock by ~3px <= 5px!)
    const player = makePlayer({
      actId: 2,
      x: 9.08,
      y: 8.15,
      direction: 'up',
      vy: -4.2,
    });

    const res = stepPlayerPhysics(player, 0, -1, 0.04, save);
    expect(res.player.x).toBeGreaterThan(player.x);
    expect(res.player.y).toBeLessThan(player.y);
  });

  it('performs Dash burst (2.3x), depletes 35 stamina, and regenerates after cooldown', () => {
    const save = createFreshSave();
    const startPlayer = makePlayer({ actId: 1, x: 9.5, y: 15.5 });
    const dashInit = triggerDash(startPlayer, 0, -1);

    expect(dashInit.dashed).toBe(true);
    expect(dashInit.player.stamina).toBe(100 - DASH_STAMINA_COST);
    expect(dashInit.player.dashTimer).toBeCloseTo(0.18, 2);

    const stepDash = stepPlayerPhysics(dashInit.player, 0, -1, 0.04, save);
    expect(Math.abs(stepDash.player.vy)).toBeGreaterThan(9.0);
    expect(stepDash.spawnedDust.length).toBeGreaterThan(0);

    // Advance past dash (0.18s) and cooldown (0.4s) to verify stamina regen
    let p = stepDash.player;
    for (let i = 0; i < 20; i++) {
      p = stepPlayerPhysics(p, 0, 0, 0.05, save).player;
    }
    expect(p.stamina).toBeGreaterThan(100 - DASH_STAMINA_COST);
  });

  it('scans interactables within 44px radius and exposes contextual verbs', () => {
    const save = createFreshSave();
    const nearMaren = makePlayer({
      actId: 1,
      x: 9.5,
      y: 14.3,
      direction: 'up',
    });
    const marenTarget = scanProximityInteractable(nearMaren, save);
    expect(marenTarget?.entity.id).toBe('npc_maren');
    expect(marenTarget?.verb).toBe('Parler');
    expect(marenTarget?.distPx).toBeLessThanOrEqual(44);

    const nearCairn = makePlayer({
      actId: 2,
      x: 5.5,
      y: 15.2,
      direction: 'up',
    });
    const cairnTarget = scanProximityInteractable(nearCairn, save);
    expect(cairnTarget?.entity.id).toBe('cairn_1');
    expect(cairnTarget?.verb).toBe('Rebâtir');

    const pulse = createBellPulse(nearMaren, save);
    expect(pulse.hintAngle).not.toBeNull();
  });
});

describe('4-Act Story, Journal Notes, Endings, and SaveManager v2', () => {
  it('validates all four 20x20 maps, 6 journal notes, and dialogue node integrity', () => {
    for (const act of [1, 2, 3, 4] as const) {
      expect(ZONES[act].tiles.length).toBe(20);
      for (const row of ZONES[act].tiles) {
        expect(row.length).toBe(20);
      }
    }
    expect(JOURNAL_NOTES.length).toBe(6);

    for (const entity of WORLD_ENTITIES) {
      if (entity.rootNodeId) {
        expect(DIALOGUE_TREE[entity.rootNodeId]).toBeDefined();
      }
      if (entity.resolvedNodeId) {
        expect(DIALOGUE_TREE[entity.resolvedNodeId]).toBeDefined();
      }
    }
  });

  it('evaluates conditional dialogue branches, quest objectives, and all 3 endings', () => {
    const base = createFreshSave();
    expect(getCurrentObjective(base).id).toBe('obj_maren');

    // Rushed climb -> silence ending
    expect(computeEndingId(base)).toBe('silence');

    // Partial pacification or >= 2 notes -> echo ending
    const echoSave = {
      ...base,
      collectedNotes: ['note_1', 'note_2'],
    };
    expect(computeEndingId(echoSave)).toBe('echo');

    // Full pacification + >= 4 notes -> harmony ending
    const harmonySave = {
      ...base,
      pacifiedCreatures: [
        'lynx_boreal',
        'cerf_brumes',
        'gypaete_cimes',
      ] as const,
      collectedNotes: ['note_1', 'note_2', 'note_3', 'note_4'],
      inventory: addInventoryItem(base.inventory, 'baies_eglantier', 1),
    };
    const mutableHarmony = {
      ...harmonySave,
      pacifiedCreatures: [...harmonySave.pacifiedCreatures],
    };
    expect(computeEndingId(mutableHarmony)).toBe('harmony');
    expect(
      evaluateDialogueCondition({ hasItem: 'baies_eglantier' }, mutableHarmony)
    ).toBe(true);
    expect(
      evaluateDialogueCondition({ minNotes: 4 }, mutableHarmony)
    ).toBe(true);
  });

  it('round-trips SaveDataV2 in localStorage and migrates/rejects malformed data safely', () => {
    const storeMap = new Map<string, string>();
    const storage = {
      getItem: (k: string) => storeMap.get(k) ?? null,
      setItem: (k: string, v: string) => {
        storeMap.set(k, v);
      },
    };

    const save = {
      ...createFreshSave(),
      actId: 3 as const,
      playerX: 6.5,
      playerY: 14.0,
      rebuiltCairns: ['cairn_1', 'cairn_2'],
      collectedNotes: ['note_1', 'note_2', 'note_4'],
      pacifiedCreatures: ['lynx_boreal' as const],
      inventory: addInventoryItem(
        addInventoryItem([], 'cloche_felee', 1),
        'baies_eglantier',
        2
      ),
      storyFlags: { met_maren: true },
      saveCount: 3,
    };

    expect(writeSaveToStorage(save, storage)).toBe(true);
    const loaded = loadSaveFromStorage(storage);
    expect(loaded).not.toBeNull();
    expect(loaded?.actId).toBe(3);
    expect(loaded?.rebuiltCairns).toEqual(['cairn_1', 'cairn_2']);
    expect(loaded?.collectedNotes).toHaveLength(3);
    expect(loaded?.inventory).toHaveLength(2);

    // Corrupted v2 data returns null
    storeMap.set(SAVE_STORAGE_KEY_V2, '{corrupted');
    expect(loadSaveFromStorage(storage)).toBeNull();

    // Legacy v1 migration check
    storeMap.delete(SAVE_STORAGE_KEY_V2);
    storeMap.set(
      LEGACY_SAVE_STORAGE_KEY_V1,
      JSON.stringify({ version: 1, zoneId: 'bridge', saveCount: 2 })
    );
    const migrated = loadSaveFromStorage(storage);
    expect(migrated?.version).toBe(2);
    expect(migrated?.actId).toBe(2);

    expect(parseSave(serializeSave({ ...save, version: 99 as unknown as 2 }))).toBeNull();
  });
});

describe('PacifyMiniGameEngine multi-mechanic encounters', () => {
  it('supports Résonance tap timing, Souffle breath hold/release, Esquive, and Offrande items', () => {
    const state = createPacifyState(PACIFY_ENCOUNTERS.lynx_boreal, 'resonance');
    state.rings = [{ id: 10, radius: RESONANCE_TARGET_RADIUS + 2, speed: 30 }];

    const tapRes = triggerResonanceTap(state);
    expect(tapRes.quality).toBe('perfect');
    expect(state.progress).toBeGreaterThan(2.0);

    // Switch to Souffle mode and release inside serene band
    switchPacifyMode(state, 'souffle');
    setSouffleHolding(state, true);
    state.breathRadius = (SOUFFLE_SERENE_MIN + SOUFFLE_SERENE_MAX) / 2;
    const souffleRes = setSouffleHolding(state, false);
    expect(souffleRes.quality).toBe('serene');
    expect(state.progress).toBeGreaterThan(4.5);

    // Apply Cristal d'écho item
    const itemRes = applyPacifyItem(state, 'cristal_echo');
    expect(itemRes.consumed).toBe(true);
    expect(itemRes.gain).toBeGreaterThan(4);

    // Switch to Esquive and step to completion
    switchPacifyMode(state, 'esquive');
    let done = false;
    for (let i = 0; i < 200; i++) {
      state.entities = [];
      const evt = stepPacifyState(state, 0.05, () => 0.5);
      if (evt.completedNow) {
        done = true;
        break;
      }
    }
    expect(done).toBe(true);
    expect(state.completed).toBe(true);
  });
});
