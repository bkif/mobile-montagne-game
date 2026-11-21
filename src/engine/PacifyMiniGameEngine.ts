import { PacifyChallengeConfig } from '../types/game';

export const ARENA_WIDTH = 240;
export const ARENA_HEIGHT = 136;
export const SOUL_RADIUS = 12;

export interface ArenaEntity {
  id: number;
  kind: 'gust' | 'note';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  wavePhase: number;
}

export interface PacifyState {
  config: PacifyChallengeConfig;
  soulX: number;
  soulY: number;
  targetX: number;
  targetY: number;
  resonanceX: number;
  resonanceY: number;
  resonanceRadius: number;
  inResonance: boolean;
  progress: number;
  elapsed: number;
  invulnTimer: number;
  spawnTimer: number;
  nextEntityId: number;
  entities: ArenaEntity[];
  completed: boolean;
  hitFlash: number;
}

export interface PacifyStepEvents {
  hit: boolean;
  noteCollected: boolean;
  completedNow: boolean;
}

export function createPacifyState(config: PacifyChallengeConfig): PacifyState {
  return {
    config,
    soulX: ARENA_WIDTH / 2,
    soulY: ARENA_HEIGHT / 2 + 12,
    targetX: ARENA_WIDTH / 2,
    targetY: ARENA_HEIGHT / 2 + 12,
    resonanceX: ARENA_WIDTH / 2,
    resonanceY: ARENA_HEIGHT / 2,
    resonanceRadius: config.mode === 'lantern_harmony' ? 34 : 32,
    inResonance: false,
    progress: 0,
    elapsed: 0,
    invulnTimer: 0.5,
    spawnTimer: 0.4,
    nextEntityId: 1,
    entities: [],
    completed: false,
    hitFlash: 0,
  };
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

export function spawnArenaEntity(
  state: PacifyState,
  rng: () => number = Math.random
): void {
  const id = state.nextEntityId++;
  const mode = state.config.mode;

  if (mode === 'catch_notes' && rng() < 0.65) {
    const fromLeft = rng() > 0.5;
    state.entities.push({
      id,
      kind: 'note',
      x: fromLeft ? -10 : ARENA_WIDTH + 10,
      y: 22 + rng() * (ARENA_HEIGHT - 44),
      vx: fromLeft ? 46 + rng() * 24 : -(46 + rng() * 24),
      vy: (rng() - 0.5) * 14,
      radius: 9,
      wavePhase: rng() * Math.PI * 2,
    });
    return;
  }

  if (mode === 'lantern_harmony') {
    const angle = rng() * Math.PI * 2;
    const dist = ARENA_WIDTH * 0.62;
    const sx = ARENA_WIDTH / 2 + Math.cos(angle) * dist;
    const sy = ARENA_HEIGHT / 2 + Math.sin(angle) * dist;
    const speed = 48 + rng() * 20;
    state.entities.push({
      id,
      kind: 'gust',
      x: sx,
      y: sy,
      vx: -Math.cos(angle) * speed,
      vy: -Math.sin(angle) * speed,
      radius: 6,
      wavePhase: rng() * Math.PI * 2,
    });
    return;
  }

  const fromLeft = rng() > 0.5;
  const speed = mode === 'dodge_wind' ? 62 + rng() * 28 : 48 + rng() * 22;
  state.entities.push({
    id,
    kind: 'gust',
    x: fromLeft ? -10 : ARENA_WIDTH + 10,
    y: 16 + rng() * (ARENA_HEIGHT - 32),
    vx: fromLeft ? speed : -speed,
    vy: (rng() - 0.5) * 18,
    radius: 6,
    wavePhase: rng() * Math.PI * 2,
  });
}

export function stepPacifyState(
  state: PacifyState,
  dt: number,
  rng: () => number = Math.random
): PacifyStepEvents {
  const events: PacifyStepEvents = {
    hit: false,
    noteCollected: false,
    completedNow: false,
  };

  if (state.completed) return events;

  state.elapsed += dt;
  state.invulnTimer = Math.max(0, state.invulnTimer - dt);
  state.hitFlash = Math.max(0, state.hitFlash - dt * 2.5);

  // Smoothly follow pointer target
  const followLerp = 1 - Math.exp(-26 * dt);
  state.soulX += (state.targetX - state.soulX) * followLerp;
  state.soulY += (state.targetY - state.soulY) * followLerp;

  // Move resonance halo for resonance modes
  if (state.config.mode === 'resonance_hold') {
    state.resonanceX =
      ARENA_WIDTH / 2 + Math.sin(state.elapsed * 0.9) * 64;
    state.resonanceY =
      ARENA_HEIGHT / 2 + Math.sin(state.elapsed * 1.8) * 26;
  } else if (state.config.mode === 'lantern_harmony') {
    state.resonanceX =
      ARENA_WIDTH / 2 + Math.cos(state.elapsed * 0.75) * 44;
    state.resonanceY =
      ARENA_HEIGHT / 2 + Math.sin(state.elapsed * 1.1) * 24;
  }

  const distToHalo = Math.hypot(
    state.soulX - state.resonanceX,
    state.soulY - state.resonanceY
  );
  state.inResonance = distToHalo <= state.resonanceRadius;

  // Spawn projectiles
  state.spawnTimer -= dt;
  const spawnInterval =
    state.config.mode === 'dodge_wind'
      ? 0.58
      : state.config.mode === 'catch_notes'
      ? 0.65
      : 0.95;

  if (state.spawnTimer <= 0) {
    state.spawnTimer = spawnInterval;
    spawnArenaEntity(state, rng);
  }

  // Update entities & check collisions
  const remaining: ArenaEntity[] = [];
  const hitboxRadius = SOUL_RADIUS - 3;

  for (const ent of state.entities) {
    ent.x += ent.vx * dt;
    ent.y +=
      ent.vy * dt + Math.sin(state.elapsed * 4 + ent.wavePhase) * 14 * dt;

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
        state.progress = Math.min(
          state.config.durationSeconds,
          state.progress + 1.5
        );
        events.noteCollected = true;
        continue;
      }
    } else if (dist <= hitboxRadius + ent.radius) {
      if (state.invulnTimer <= 0) {
        state.invulnTimer = 0.85;
        state.hitFlash = 1;
        state.progress = Math.max(0, state.progress - 1.35);
        events.hit = true;
      }
      continue;
    }

    remaining.push(ent);
  }
  state.entities = remaining;

  // Progress gain per mode
  if (state.config.mode === 'dodge_wind') {
    state.progress += dt;
  } else if (
    state.config.mode === 'resonance_hold' ||
    state.config.mode === 'lantern_harmony'
  ) {
    state.progress += (state.inResonance ? 1.25 : 0.12) * dt;
  } else if (state.config.mode === 'catch_notes') {
    state.progress += 0.28 * dt;
  }

  if (state.progress >= state.config.durationSeconds) {
    state.progress = state.config.durationSeconds;
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

  // Pure black Undertale soul-box background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

  // Subtle starfield dust inside box
  ctx.fillStyle = 'rgba(241, 245, 249, 0.18)';
  for (let i = 0; i < 14; i++) {
    const sx = ((i * 53 + Math.floor(state.elapsed * 8)) % ARENA_WIDTH);
    const sy = ((i * 37) % ARENA_HEIGHT);
    ctx.fillRect(sx, sy, 1, 1);
  }

  // Resonance circle if active mode
  if (
    state.config.mode === 'resonance_hold' ||
    state.config.mode === 'lantern_harmony'
  ) {
    const pulse = Math.sin(state.elapsed * 5) * 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(
      state.resonanceX,
      state.resonanceY,
      state.resonanceRadius + pulse,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = state.inResonance
      ? 'rgba(253, 230, 138, 0.2)'
      : 'rgba(255, 255, 255, 0.06)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = state.inResonance
      ? '#FDE68A'
      : state.config.accentColor;
    ctx.stroke();
    ctx.restore();
  }

  // Entities
  for (const ent of state.entities) {
    if (ent.kind === 'note') {
      ctx.fillStyle = '#E9D5FF';
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

  // Player warm flame soul (12px radius)
  const blink =
    state.invulnTimer > 0 && Math.floor(state.elapsed * 16) % 2 === 0;
  if (!blink) {
    const sx = Math.round(state.soulX);
    const sy = Math.round(state.soulY);

    // Outer warm aura
    ctx.fillStyle =
      state.hitFlash > 0.2
        ? 'rgba(248, 113, 113, 0.35)'
        : 'rgba(245, 158, 11, 0.28)';
    ctx.beginPath();
    ctx.arc(sx, sy, SOUL_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Inner pixel flame shape
    ctx.fillStyle = state.hitFlash > 0.2 ? '#F87171' : '#F59E0B';
    ctx.fillRect(sx - 6, sy - 4, 12, 10);
    ctx.fillRect(sx - 4, sy - 8, 8, 4);
    ctx.fillRect(sx - 2, sy - 11, 4, 3);

    ctx.fillStyle = '#FDE68A';
    ctx.fillRect(sx - 4, sy - 2, 8, 6);
    ctx.fillRect(sx - 2, sy - 6, 4, 4);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(sx - 2, sy, 4, 3);
  }
}
