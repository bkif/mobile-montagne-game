import { describe, expect, it } from 'vitest';
import { NPCS, ZONES } from '../../data/mountainWorld';
import {
  DIALOGUE_TREE,
  buildCampfireDialogue,
} from '../../data/narrativeScript';
import {
  ARENA_HEIGHT,
  ARENA_WIDTH,
  createPacifyState,
  setSoulTarget,
  stepPacifyState,
} from '../PacifyMiniGameEngine';
import {
  SAVE_STORAGE_KEY,
  applyDialogueEffects,
  createFreshSave,
  loadSaveFromStorage,
  parseSave,
  serializeSave,
  writeSaveToStorage,
} from '../SaveManager';
import {
  canOccupyPosition,
  checkZoneTransition,
  findInteractableInFront,
  movePlayer,
} from '../WorldEngine';
import { PlayerState } from '../../types/game';

describe('WorldEngine collision, movement, and interaction', () => {
  it('blocks solid tiles (trees, rocks, chasms, cliffs) and allows walkable snow/path/bridge', () => {
    const save = createFreshSave();

    // Forest row 17 is all trees -> blocked
    expect(canOccupyPosition('forest', 7.5, 17.5, save)).toBe(false);
    // Forest spawn (7.5, 15.5) is walkable path
    expect(canOccupyPosition('forest', 7.5, 15.5, save)).toBe(true);
    // Bridge chasm at (2.5, 7.5) is blocked, bridge plank at (7.5, 7.5) is walkable
    expect(canOccupyPosition('bridge', 2.5, 7.5, save)).toBe(false);
    expect(canOccupyPosition('bridge', 7.5, 7.5, save)).toBe(true);
  });

  it('blocks the narrow forest pass while Barnabé is unresolved and opens it once befriended', () => {
    const save = createFreshSave();
    // Barnabé stands at (7, 3) flanked by rocks at (6, 3) and (8, 3)
    expect(canOccupyPosition('forest', 7.5, 3.5, save)).toBe(false);

    const befriendedSave = applyDialogueEffects(save, {
      grantBefriend: 'barnabe',
    });
    // Barnabé stepped aside to (6, 4), so (7.5, 3.5) is now clear
    expect(canOccupyPosition('forest', 7.5, 3.5, befriendedSave)).toBe(true);
    expect(canOccupyPosition('forest', 6.5, 4.5, befriendedSave)).toBe(false);
  });

  it('provides corner-sliding forgiveness when walking slightly off-center into a 1-tile pass', () => {
    const save = applyDialogueEffects(createFreshSave(), {
      setFlag: 'bypassed_barnabe',
    });
    const player: PlayerState = {
      zoneId: 'forest',
      x: 7.12, // Slightly clipped on left rock edge at col 6
      y: 4.1,
      direction: 'up',
      isMoving: false,
      animFrame: 0,
      animTimer: 0,
    };

    const next = movePlayer(player, 0, -1, 0.05, save);
    expect(next.x).toBeGreaterThan(player.x);
  });

  it('detects campfire and NPCs in front of the player and triggers zone transitions', () => {
    const save = createFreshSave();
    const nearFire: PlayerState = {
      zoneId: 'forest',
      x: 6.1,
      y: 14.5,
      direction: 'left',
      isMoving: false,
      animFrame: 0,
      animTimer: 0,
    };
    const fireTarget = findInteractableInFront(nearFire, save);
    expect(fireTarget?.kind).toBe('object');
    if (fireTarget?.kind === 'object') {
      expect(fireTarget.object.type).toBe('campfire');
    }

    const nearBarnabe: PlayerState = {
      zoneId: 'forest',
      x: 7.5,
      y: 4.3,
      direction: 'up',
      isMoving: false,
      animFrame: 0,
      animTimer: 0,
    };
    const npcTarget = findInteractableInFront(nearBarnabe, save);
    expect(npcTarget?.kind).toBe('npc');
    if (npcTarget?.kind === 'npc') {
      expect(npcTarget.npc.id).toBe('barnabe');
    }

    const atTopExit: PlayerState = {
      zoneId: 'forest',
      x: 7.5,
      y: 0.4,
      direction: 'up',
      isMoving: true,
      animFrame: 0,
      animTimer: 0,
    };
    const tr = checkZoneTransition(atTopExit);
    expect(tr?.targetZone).toBe('bridge');
  });
});

describe('Dialogue branching, flags, and campfire SaveManager', () => {
  it('updates flags, befriended NPCs, and consumes offered items cleanly', () => {
    const initial = {
      ...createFreshSave(),
      inventory: ['compass', 'thermos'] as const,
    };
    const save = { ...initial, inventory: [...initial.inventory] };

    const afterGift = applyDialogueEffects(save, {
      consumeItem: 'compass',
      grantBefriend: 'barnabe',
      setFlag: 'met_barnabe',
    });

    expect(afterGift.inventory).toEqual(['thermos']);
    expect(afterGift.befriendedIds).toContain('barnabe');
    expect(afterGift.flags.met_barnabe).toBe(true);
  });

  it('evolves campfire dialogue based on befriended companions', () => {
    const baseSave = createFreshSave();
    const firstMsg = buildCampfireDialogue('forest', baseSave);
    expect(firstMsg.text).not.toContain('Barnabé');

    const withBarnabe = applyDialogueEffects(baseSave, {
      grantBefriend: 'barnabe',
    });
    const secondMsg = buildCampfireDialogue('forest', withBarnabe);
    expect(secondMsg.text).toContain('Barnabé');
  });

  it('serializes, persists, and safely rejects corrupted localStorage saves', () => {
    const memory = new Map<string, string>();
    const mockStorage = {
      getItem: (k: string) => memory.get(k) ?? null,
      setItem: (k: string, v: string) => {
        memory.set(k, v);
      },
    };

    const save = applyDialogueEffects(
      {
        ...createFreshSave(),
        zoneId: 'bridge',
        x: 7.5,
        y: 14.2,
        inventory: ['flute'],
        saveCount: 2,
      },
      { grantBefriend: 'barnabe' }
    );

    expect(writeSaveToStorage(save, mockStorage)).toBe(true);
    const loaded = loadSaveFromStorage(mockStorage);
    expect(loaded).not.toBeNull();
    expect(loaded?.zoneId).toBe('bridge');
    expect(loaded?.befriendedIds).toEqual(['barnabe']);
    expect(loaded?.inventory).toEqual(['flute']);

    // Corrupted JSON fallback
    memory.set(SAVE_STORAGE_KEY, '{broken_json');
    expect(loadSaveFromStorage(mockStorage)).toBeNull();
    expect(parseSave(serializeSave({ ...save, version: 99 as unknown as 1 }))).toBeNull();
  });

  it('verifies all map rows are 16x18 and every NPC dialogue reference exists', () => {
    for (const zone of Object.values(ZONES)) {
      expect(zone.tiles.length).toBe(18);
      for (const row of zone.tiles) {
        expect(row.length).toBe(16);
      }
    }

    for (const npc of NPCS) {
      expect(DIALOGUE_TREE[npc.rootNodeId]).toBeDefined();
      expect(DIALOGUE_TREE[npc.befriendedNodeId]).toBeDefined();
      expect(DIALOGUE_TREE[npc.bypassedNodeId]).toBeDefined();
      expect(DIALOGUE_TREE[npc.pacifyConfig.successNodeId]).toBeDefined();
    }
  });
});

describe('PacifyMiniGameEngine mechanics', () => {
  it('progresses dodge_wind mode to completion without game-over on hits', () => {
    const barnabe = NPCS.find((n) => n.id === 'barnabe')!;
    const state = createPacifyState(barnabe.pacifyConfig);
    state.invulnTimer = 0;

    // Simulate a gust colliding with the soul
    state.entities.push({
      id: 99,
      kind: 'gust',
      x: state.soulX,
      y: state.soulY,
      vx: 0,
      vy: 0,
      radius: 6,
      wavePhase: 0,
    });
    state.progress = 3.0;

    const hitEvt = stepPacifyState(state, 0.016, () => 0.5);
    expect(hitEvt.hit).toBe(true);
    expect(state.completed).toBe(false);
    expect(state.progress).toBeLessThan(3.0);

    // Clear entities and step cleanly to completion
    state.entities = [];
    let completed = false;
    for (let i = 0; i < 300; i++) {
      state.entities = [];
      const evt = stepPacifyState(state, 0.05, () => 0.5);
      if (evt.completedNow) {
        completed = true;
        break;
      }
    }
    expect(completed).toBe(true);
    expect(state.completed).toBe(true);
  });

  it('collects snow-notes in catch_notes mode and clamps soul within arena bounds', () => {
    const spirit = NPCS.find((n) => n.id === 'echo_brouillard')!;
    const state = createPacifyState(spirit.pacifyConfig);

    setSoulTarget(state, -50, ARENA_HEIGHT + 100);
    expect(state.targetX).toBeGreaterThan(0);
    expect(state.targetY).toBeLessThan(ARENA_HEIGHT);

    setSoulTarget(state, ARENA_WIDTH / 2, ARENA_HEIGHT / 2);
    state.soulX = ARENA_WIDTH / 2;
    state.soulY = ARENA_HEIGHT / 2;
    state.entities.push({
      id: 1,
      kind: 'note',
      x: state.soulX + 2,
      y: state.soulY,
      vx: 0,
      vy: 0,
      radius: 9,
      wavePhase: 0,
    });

    const evt = stepPacifyState(state, 0.02, () => 0.5);
    expect(evt.noteCollected).toBe(true);
    expect(state.progress).toBeGreaterThan(1.4);
  });
});
