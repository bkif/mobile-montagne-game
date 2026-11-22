import {
  InventoryItemId,
  PacifyActionType,
  PacifyEncounterConfig,
} from '../types/game';

export const ARENA_WIDTH = 240;
export const ARENA_HEIGHT = 132;
export const SOUL_RADIUS = 12;
export const RESONANCE_TARGET_RADIUS = 22;
export const SOUFFLE_SERENE_MIN = 34;
export const SOUFFLE_SERENE_MAX = 48;

export interface ArenaProjectile {
  id: number;
  kind: 'gust' | 'note';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  wavePhase: number;
}

export interface HarmonicRing {
  id: number;
  radius: number;
  speed: number;
}

export interface PacifyState {
  config: PacifyEncounterConfig;
  activeMode: PacifyActionType;
  soulX: number;
  soulY: number;
  targetX: number;
  targetY: number;
  breathHolding: boolean;
  breathRadius: number;
  rings: HarmonicRing[];
  ringSpawnTimer: number;
  progress: number;
  elapsed: number;
  invulnTimer: number;
  spawnTimer: number;
  nextEntityId: number;
  entities: ArenaProjectile[];
  completed: boolean;
  hitFlash: number;
  statusMessage: string;
}

export interface PacifyStepEvents {
  hit: boolean;
  noteCollected: boolean;
  completedNow: boolean;
}

export function createPacifyState(
  config: PacifyEncounterConfig,
  initialMode?: PacifyActionType
): PacifyState {
  const mode = initialMode ?? config.defaultMode;
  return {
    config,
    activeMode: mode,
    soulX: ARENA_WIDTH / 2,
    soulY: ARENA_HEIGHT / 2,
    targetX: ARENA_WIDTH / 2,
    targetY: ARENA_HEIGHT / 2,
    breathHolding: false,
    breathRadius: 12,
    rings: [{ id: 1, radius: 56, speed: 30 }],
    ringSpawnTimer: 1.15,
    progress: 0,
    elapsed: 0,
    invulnTimer: 0.4,
    spawnTimer: 0.45,
    nextEntityId: 2,
    entities: [],
    completed: false,
    hitFlash: 0,
    statusMessage: config.introLine,
  };
}

export function switchPacifyMode(
  state: PacifyState,
  mode: PacifyActionType
): void {
  state.activeMode = mode;
  state.breathHolding = false;
  state.breathRadius = 12;
  if (mode === 'resonance') {
    state.statusMessage =
      'Tapez quand le cercle doré atteint l’anneau central.';
  } else if (mode === 'souffle') {
    state.statusMessage =
      'Maintenez appuyé pour inspirer, relâchez dans la zone dorée.';
  } else {
    state.statusMessage =
      'Glissez la flamme pour esquiver le givre et cueillir les échos.';
  }
}

export function clampSoulCoord(
  x: number,
  y: number
): { x: number; y: number } {
  const margin = SOUL_RADIUS + 2;
  return {
    x: Math.max(margin, Math.min(ARENA_WIDTH - margin, x)),
    y: Math.max(margin, Math.min(ARENA_HEIGHT - margin, y)),
  };
}

export function setSoulTarget(
  state: PacifyState,
  x: number,
  y: number
): void {
  const clamped = clampSoulCoord(x, y);
  state.targetX = clamped.x;
  state.targetY = clamped.y;
}

export function triggerResonanceTap(state: PacifyState): {
  quality: 'perfect' | 'good' | 'miss';
  completedNow: boolean;
} {
  if (state.completed || state.activeMode !== 'resonance') {
    return { quality: 'miss', completedNow: false };
  }

  let bestIdx = -1;
  let bestDiff = Infinity;
  state.rings.forEach((ring, idx) => {
    const diff = Math.abs(ring.radius - RESONANCE_TARGET_RADIUS);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = idx;
    }
  });

  if (bestIdx >= 0 && bestDiff <= 9) {
    state.rings.splice(bestIdx, 1);
    state.progress = Math.min(state.config.targetCalm, state.progress + 2.4);
    state.statusMessage = 'Résonance parfaite ! L’écho s’apaise.';
  } else if (bestIdx >= 0 && bestDiff <= 16) {
    state.rings.splice(bestIdx, 1);
    state.progress = Math.min(state.config.targetCalm, state.progress + 1.15);
    state.statusMessage = 'Accord juste... continuez sur ce rythme.';
  } else {
    state.statusMessage = 'Attendez que l’onde touche le cercle central.';
    return { quality: 'miss', completedNow: false };
  }

  if (state.progress >= state.config.targetCalm) {
    state.progress = state.config.targetCalm;
    state.completed = true;
    return { quality: bestDiff <= 9 ? 'perfect' : 'good', completedNow: true };
  }
  return { quality: bestDiff <= 9 ? 'perfect' : 'good', completedNow: false };
}

export function setSouffleHolding(
  state: PacifyState,
  holding: boolean
): { quality: 'serene' | 'partial' | 'none'; completedNow: boolean } {
  if (state.completed || state.activeMode !== 'souffle') {
    return { quality: 'none', completedNow: false };
  }

  if (holding) {
    state.breathHolding = true;
    return { quality: 'none', completedNow: false };
  }

  if (!state.breathHolding) {
    return { quality: 'none', completedNow: false };
  }

  state.breathHolding = false;
  const r = state.breathRadius;
  state.breathRadius = 12;

  let quality: 'serene' | 'partial' | 'none' = 'none';
  if (r >= SOUFFLE_SERENE_MIN && r <= SOUFFLE_SERENE_MAX) {
    state.progress = Math.min(state.config.targetCalm, state.progress + 2.75);
    state.statusMessage = 'Souffle serein ! La tension retombe.';
    quality = 'serene';
  } else if (r >= 24 && r <= 54) {
    state.progress = Math.min(state.config.targetCalm, state.progress + 1.1);
    state.statusMessage = 'Presque ! Relâchez dans la bande dorée.';
    quality = 'partial';
  } else {
    state.statusMessage = 'Respirez lentement jusqu’à la bande dorée.';
  }

  if (state.progress >= state.config.targetCalm) {
    state.progress = state.config.targetCalm;
    state.completed = true;
    return { quality, completedNow: true };
  }

  return { quality, completedNow: false };
}

export function applyPacifyItem(
  state: PacifyState,
  itemId: InventoryItemId
): { gain: number; message: string; consumed: boolean; completedNow: boolean } {
  if (state.completed) {
    return { gain: 0, message: '', consumed: false, completedNow: false };
  }

  let gain = 2.5;
  let consumed = false;
  let message = 'Votre objet diffuse une chaleur apaisante.';

  if (itemId === 'cloche_felee') {
    gain = 2.6;
    message = 'La Cloche fêlée tinte d’une note limpide et familière.';
  } else if (itemId === 'baies_eglantier') {
    gain = 2.8;
    consumed = true;
    message = "Vous offrez des baies d'églantier parfumées (+Calme).";
  } else if (itemId === 'tisane_pin') {
    gain = 3.5;
    consumed = true;
    message = 'L’odeur de pin chaud détend aussitôt l’atmosphère.';
  } else if (itemId === 'corde_alpiniste') {
    gain = 2.8;
    message = 'Les nœuds de la corde stabilisent parfaitement votre cadence.';
  } else if (itemId === 'cristal_echo') {
    gain = 4.2;
    consumed = true;
    message = "Le Cristal d'écho entre en harmonie pure !";
  } else if (itemId === 'page_carnet_liee') {
    gain = 4.5;
    message =
      state.config.creatureId === 'monolithe_resonant'
        ? 'L’accord tracé par Léo illumine les facettes du Monolithe !'
        : 'Les notes de Léo guident votre geste avec justesse.';
  }

  state.progress = Math.min(state.config.targetCalm, state.progress + gain);
  state.statusMessage = message;

  if (state.progress >= state.config.targetCalm) {
    state.progress = state.config.targetCalm;
    state.completed = true;
    return { gain, message, consumed, completedNow: true };
  }

  return { gain, message, consumed, completedNow: false };
}

export function spawnArenaProjectile(
  state: PacifyState,
  rng: () => number = Math.random
): void {
  const id = state.nextEntityId++;
  const fromLeft = rng() > 0.5;

  if (state.activeMode === 'esquive' && rng() < 0.34) {
    state.entities.push({
      id,
      kind: 'note',
      x: fromLeft ? -10 : ARENA_WIDTH + 10,
      y: 20 + rng() * (ARENA_HEIGHT - 40),
      vx: fromLeft ? 48 + rng() * 20 : -(48 + rng() * 20),
      vy: (rng() - 0.5) * 14,
      radius: 8,
      wavePhase: rng() * Math.PI * 2,
    });
    return;
  }

  const speed = state.activeMode === 'esquive' ? 58 + rng() * 26 : 44 + rng() * 18;
  state.entities.push({
    id,
    kind: 'gust',
    x: fromLeft ? -10 : ARENA_WIDTH + 10,
    y: 16 + rng() * (ARENA_HEIGHT - 32),
    vx: fromLeft ? speed : -speed,
    vy: (rng() - 0.5) * 16,
    radius: 6,
    wavePhase: rng() * Math.PI * 2,
  });
}

export function stepPacifyState(
  state: PacifyState,
  rawDt: number,
  rng: () => number = Math.random
): PacifyStepEvents {
  const dt = Math.min(Math.max(rawDt, 0.0001), 0.05);
  const events: PacifyStepEvents = {
    hit: false,
    noteCollected: false,
    completedNow: false,
  };

  if (state.completed) return events;

  state.elapsed += dt;
  state.invulnTimer = Math.max(0, state.invulnTimer - dt);
  state.hitFlash = Math.max(0, state.hitFlash - dt * 2.5);

  // Follow target in esquive mode (center in resonance/souffle)
  const destX = state.activeMode === 'esquive' ? state.targetX : ARENA_WIDTH / 2;
  const destY = state.activeMode === 'esquive' ? state.targetY : ARENA_HEIGHT / 2;
  const lerp = 1 - Math.exp(-24 * dt);
  state.soulX += (destX - state.soulX) * lerp;
  state.soulY += (destY - state.soulY) * lerp;

  if (state.activeMode === 'resonance') {
    state.ringSpawnTimer -= dt;
    if (state.ringSpawnTimer <= 0) {
      state.ringSpawnTimer = 1.15;
      state.rings.push({
        id: state.nextEntityId++,
        radius: 62,
        speed: 31 + Math.min(10, state.elapsed * 0.6),
      });
    }
    state.rings = state.rings
      .map((r) => ({ ...r, radius: r.radius - r.speed * dt }))
      .filter((r) => r.radius > 4);
  } else if (state.activeMode === 'souffle') {
    if (state.breathHolding) {
      state.breathRadius = Math.min(62, state.breathRadius + 36 * dt);
      if (state.breathRadius >= 62) {
        state.breathHolding = false;
        state.breathRadius = 12;
        state.statusMessage = 'Souffle trop long — recommencez calmement.';
      }
    }
  }

  // Projectiles for esquive & souffle modes
  if (state.activeMode === 'esquive' || state.activeMode === 'souffle') {
    state.spawnTimer -= dt;
    const interval = state.activeMode === 'esquive' ? 0.56 : 1.05;
    if (state.spawnTimer <= 0) {
      state.spawnTimer = interval;
      spawnArenaProjectile(state, rng);
    }
  } else {
    state.entities = [];
  }

  const remaining: ArenaProjectile[] = [];
  const hitboxRadius = SOUL_RADIUS - 3;

  for (const ent of state.entities) {
    ent.x += ent.vx * dt;
    ent.y +=
      ent.vy * dt + Math.sin(state.elapsed * 4 + ent.wavePhase) * 12 * dt;

    if (
      ent.x < -30 ||
      ent.x > ARENA_WIDTH + 30 ||
      ent.y < -30 ||
      ent.y > ARENA_HEIGHT + 30
    ) {
      continue;
    }

    const dist = Math.hypot(ent.x - state.soulX, ent.y - state.soulY);
    if (ent.kind === 'note') {
      if (dist <= SOUL_RADIUS + ent.radius + 2) {
        state.progress = Math.min(state.config.targetCalm, state.progress + 1.5);
        state.statusMessage = 'Écho harmonique capté !';
        events.noteCollected = true;
        continue;
      }
    } else if (
      state.activeMode === 'esquive' &&
      dist <= hitboxRadius + ent.radius
    ) {
      if (state.invulnTimer <= 0) {
        state.invulnTimer = 0.85;
        state.hitFlash = 1;
        state.progress = Math.max(0, state.progress - 1.1);
        events.hit = true;
      }
      continue;
    }

    remaining.push(ent);
  }
  state.entities = remaining;

  if (state.activeMode === 'esquive') {
    state.progress += 0.78 * dt;
  }

  if (state.progress >= state.config.targetCalm) {
    state.progress = state.config.targetCalm;
    state.completed = true;
    events.completedNow = true;
  }

  return events;
}

export function renderPacifyCanvas(
  ctx: CanvasRenderingContext2D,
  state: PacifyState
): void {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

  const cx = Math.round(state.soulX);
  const cy = Math.round(state.soulY);

  // Subtle starfield dust
  ctx.fillStyle = 'rgba(241, 245, 249, 0.2)';
  for (let i = 0; i < 14; i++) {
    const sx = (i * 53 + Math.floor(state.elapsed * 8)) % ARENA_WIDTH;
    const sy = (i * 37) % ARENA_HEIGHT;
    ctx.fillRect(sx, sy, 1, 1);
  }

  if (state.activeMode === 'resonance') {
    // Target ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, RESONANCE_TARGET_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    for (const ring of state.rings) {
      const inZone = Math.abs(ring.radius - RESONANCE_TARGET_RADIUS) <= 9;
      ctx.beginPath();
      ctx.arc(cx, cy, ring.radius, 0, Math.PI * 2);
      ctx.strokeStyle = inZone ? '#FDE68A' : state.config.accentColor;
      ctx.lineWidth = inZone ? 2.5 : 1.5;
      ctx.stroke();
    }
    ctx.restore();
  } else if (state.activeMode === 'souffle') {
    // Serene target band
    ctx.save();
    ctx.beginPath();
    ctx.arc(
      cx,
      cy,
      (SOUFFLE_SERENE_MIN + SOUFFLE_SERENE_MAX) / 2,
      0,
      Math.PI * 2
    );
    ctx.strokeStyle = 'rgba(253, 230, 138, 0.45)';
    ctx.lineWidth = SOUFFLE_SERENE_MAX - SOUFFLE_SERENE_MIN;
    ctx.stroke();

    // Expanding breath ring
    const inBand =
      state.breathRadius >= SOUFFLE_SERENE_MIN &&
      state.breathRadius <= SOUFFLE_SERENE_MAX;
    ctx.beginPath();
    ctx.arc(cx, cy, state.breathRadius, 0, Math.PI * 2);
    ctx.strokeStyle = inBand ? '#FDE68A' : '#38BDF8';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  }

  // Projectiles
  for (const ent of state.entities) {
    if (ent.kind === 'note') {
      ctx.fillStyle = '#FDE68A';
      ctx.fillRect(Math.round(ent.x - 4), Math.round(ent.y - 4), 8, 8);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(Math.round(ent.x - 2), Math.round(ent.y - 2), 4, 4);
    } else {
      ctx.fillStyle = '#94A3B8';
      ctx.beginPath();
      ctx.arc(ent.x, ent.y, ent.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#F1F5F9';
      ctx.fillRect(Math.round(ent.x - 2), Math.round(ent.y - 2), 3, 3);
    }
  }

  // Warm flame heart
  const blink =
    state.invulnTimer > 0 && Math.floor(state.elapsed * 16) % 2 === 0;
  if (!blink) {
    ctx.fillStyle =
      state.hitFlash > 0.2
        ? 'rgba(248, 113, 113, 0.35)'
        : 'rgba(245, 158, 11, 0.28)';
    ctx.beginPath();
    ctx.arc(cx, cy, SOUL_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = state.hitFlash > 0.2 ? '#F87171' : '#F59E0B';
    ctx.fillRect(cx - 6, cy - 4, 12, 10);
    ctx.fillRect(cx - 4, cy - 8, 8, 4);
    ctx.fillRect(cx - 2, cy - 11, 4, 3);

    ctx.fillStyle = '#FDE68A';
    ctx.fillRect(cx - 4, cy - 2, 8, 6);
    ctx.fillRect(cx - 2, cy - 6, 4, 4);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(cx - 2, cy, 4, 3);
  }
}
