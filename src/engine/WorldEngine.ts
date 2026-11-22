import {
  TILE_SIZE,
  WORLD_ENTITIES,
  ZONES,
  isTileSolid,
} from '../data/mountainWorld';
import {
  ActId,
  Direction,
  FootstepTerrain,
  PlayerState,
  PromptBadgeKind,
  SaveDataV2,
  TileType,
  WorldEntity,
} from '../types/game';
import { getSpriteBank } from './PixelSprites';

export const BASE_SPEED_TILES = 4.2;
export const DASH_MULTIPLIER = 2.3;
export const DASH_DURATION_SEC = 0.18;
export const DASH_STAMINA_COST = 35;
export const STAMINA_REGEN_PER_SEC = 24;
export const STAMINA_COOLDOWN_SEC = 0.4;
export const CORNER_SLIDE_MAX_PX = 5;
export const CORNER_SLIDE_MAX_TILES = CORNER_SLIDE_MAX_PX / TILE_SIZE; // 0.3125 tiles
export const PROXIMITY_SCAN_RADIUS_PX = 44;
export const PROXIMITY_SCAN_RADIUS_TILES = PROXIMITY_SCAN_RADIUS_PX / TILE_SIZE;

const PLAYER_HALF_W = 0.27;
const PLAYER_HALF_H = 0.24;

export interface SnowParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

export interface DustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export interface BellPulse {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  hintAngle: number | null;
}

export interface WindState {
  phase: 'calm' | 'telegraph' | 'gust';
  timer: number;
  direction: -1 | 1;
}

export interface InteractTarget {
  entity: WorldEntity;
  x: number;
  y: number;
  distPx: number;
  verb: string;
  label: string;
  badge: PromptBadgeKind;
}

export interface PhysicsStepResult {
  player: PlayerState;
  footstepTerrain: FootstepTerrain | null;
  spawnedDust: DustParticle[];
}

export function isEntityResolved(entity: WorldEntity, save: SaveDataV2): boolean {
  if (entity.kind === 'cairn') {
    return save.rebuiltCairns.includes(entity.id);
  }
  if (entity.creatureId && save.pacifiedCreatures.includes(entity.creatureId)) {
    return true;
  }
  if (entity.resolvedFlag && save.storyFlags[entity.resolvedFlag]) {
    return true;
  }
  return false;
}

export function isEntityCollected(entity: WorldEntity, save: SaveDataV2): boolean {
  if (entity.kind !== 'pickup') return false;
  if (entity.noteId && save.collectedNotes.includes(entity.noteId)) {
    return true;
  }
  return save.collectedPickups.includes(entity.id);
}

export function getEntityPosition(
  entity: WorldEntity,
  save: SaveDataV2
): { x: number; y: number } {
  if (
    entity.resolvedX !== undefined &&
    entity.resolvedY !== undefined &&
    isEntityResolved(entity, save)
  ) {
    return { x: entity.resolvedX, y: entity.resolvedY };
  }
  return { x: entity.x, y: entity.y };
}

export function tileToFootstepTerrain(tile: TileType | undefined): FootstepTerrain {
  if (tile === 'grass') return 'grass';
  if (tile === 'stone' || tile === 'bridge' || tile === 'ice') return 'stone';
  return 'snow';
}

export function canOccupyPosition(
  actId: ActId,
  x: number,
  y: number,
  save: SaveDataV2
): boolean {
  const zone = ZONES[actId];
  const minX = x - PLAYER_HALF_W;
  const maxX = x + PLAYER_HALF_W;
  const minY = y - PLAYER_HALF_H;
  const maxY = y + PLAYER_HALF_H;

  if (minX < 0 || maxX > zone.width || minY < 0 || maxY > zone.height) {
    return false;
  }

  const startCol = Math.floor(minX);
  const endCol = Math.floor(maxX - 0.0001);
  const startRow = Math.floor(minY);
  const endRow = Math.floor(maxY - 0.0001);

  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const tile = zone.tiles[row]?.[col];
      if (!tile || isTileSolid(tile, col, row, actId, save.rebuiltCairns)) {
        return false;
      }
    }
  }

  for (const entity of WORLD_ENTITIES) {
    if (entity.act !== actId || !entity.solid) continue;
    const pos = getEntityPosition(entity, save);
    const eMinX = pos.x + 0.1;
    const eMaxX = pos.x + 0.9;
    const eMinY = pos.y + 0.14;
    const eMaxY = pos.y + 0.9;
    if (maxX > eMinX && minX < eMaxX && maxY > eMinY && minY < eMaxY) {
      return false;
    }
  }

  return true;
}

export function triggerDash(
  player: PlayerState,
  inputX: number,
  inputY: number
): { player: PlayerState; dashed: boolean } {
  if (player.dashTimer > 0 || player.stamina < DASH_STAMINA_COST) {
    return { player, dashed: false };
  }

  let dx = inputX;
  let dy = inputY;
  const mag = Math.hypot(dx, dy);
  if (mag < 0.15) {
    dx = player.direction === 'left' ? -1 : player.direction === 'right' ? 1 : 0;
    dy = player.direction === 'up' ? -1 : player.direction === 'down' ? 1 : 0;
  } else {
    dx /= mag;
    dy /= mag;
  }

  return {
    dashed: true,
    player: {
      ...player,
      stamina: Math.max(0, player.stamina - DASH_STAMINA_COST),
      staminaCooldown: STAMINA_COOLDOWN_SEC,
      dashTimer: DASH_DURATION_SEC,
      dashDirX: dx,
      dashDirY: dy,
    },
  };
}

export function isShelteredFromWind(
  actId: ActId,
  x: number,
  y: number,
  windDir: -1 | 1
): boolean {
  const zone = ZONES[actId];
  const col = Math.floor(x);
  const row = Math.floor(y);
  // Sheltered if a solid rock boulder is immediately upwind or adjacent
  const upwindCol = col - windDir;
  for (let dr = -1; dr <= 1; dr++) {
    const t = zone.tiles[row + dr]?.[upwindCol];
    if (t === 'rock' || t === 'cliff') return true;
  }
  return false;
}

export function stepWindState(
  wind: WindState,
  dt: number,
  hasWindGusts: boolean
): WindState {
  if (!hasWindGusts) {
    return { phase: 'calm', timer: 3.0, direction: 1 };
  }

  const nextTimer = wind.timer - dt;
  if (nextTimer > 0) {
    return { ...wind, timer: nextTimer };
  }

  if (wind.phase === 'calm') {
    return { phase: 'telegraph', timer: 1.25, direction: wind.direction };
  }
  if (wind.phase === 'telegraph') {
    return { phase: 'gust', timer: 1.75, direction: wind.direction };
  }
  return {
    phase: 'calm',
    timer: 3.1,
    direction: wind.direction === 1 ? -1 : 1,
  };
}

export function stepPlayerPhysics(
  player: PlayerState,
  inputX: number,
  inputY: number,
  rawDt: number,
  save: SaveDataV2,
  wind?: WindState
): PhysicsStepResult {
  const dt = Math.min(Math.max(rawDt, 0.0001), 0.05);
  const spawnedDust: DustParticle[] = [];

  let dashTimer = Math.max(0, player.dashTimer - dt);
  let staminaCooldown = Math.max(0, player.staminaCooldown - dt);
  let stamina = player.stamina;
  if (dashTimer <= 0 && staminaCooldown <= 0 && stamina < 100) {
    stamina = Math.min(100, stamina + STAMINA_REGEN_PER_SEC * dt);
  }

  const isDashing = dashTimer > 0;
  let targetVx = 0;
  let targetVy = 0;

  if (isDashing) {
    targetVx = player.dashDirX * BASE_SPEED_TILES * DASH_MULTIPLIER;
    targetVy = player.dashDirY * BASE_SPEED_TILES * DASH_MULTIPLIER;
    spawnedDust.push({
      x: player.x * TILE_SIZE,
      y: player.y * TILE_SIZE + 4,
      vx: -player.dashDirX * 18 + (Math.random() - 0.5) * 10,
      vy: -player.dashDirY * 18 + (Math.random() - 0.5) * 10,
      life: 0.25,
      maxLife: 0.25,
    });
  } else {
    const mag = Math.hypot(inputX, inputY);
    if (mag >= 0.08) {
      const clampedMag = Math.min(1, mag);
      targetVx = (inputX / mag) * BASE_SPEED_TILES * clampedMag;
      targetVy = (inputY / mag) * BASE_SPEED_TILES * clampedMag;
    }
  }

  // Smooth acceleration & ground friction
  let vx = player.vx;
  let vy = player.vy;
  if (isDashing) {
    vx = targetVx;
    vy = targetVy;
  } else {
    const accelRate = Math.hypot(targetVx, targetVy) > 0.01 ? 26 : 18;
    const blend = 1 - Math.exp(-accelRate * dt);
    vx += (targetVx - vx) * blend;
    vy += (targetVy - vy) * blend;
    if (Math.hypot(vx, vy) < 0.03 && Math.hypot(targetVx, targetVy) === 0) {
      vx = 0;
      vy = 0;
    }
  }

  // Apply Act III periodic wind push unless dashing or sheltered
  let windPushVx = 0;
  if (
    wind &&
    wind.phase === 'gust' &&
    ZONES[player.actId].hasWindGusts &&
    !isDashing &&
    !isShelteredFromWind(player.actId, player.x, player.y, wind.direction)
  ) {
    windPushVx = wind.direction * 1.45;
  }

  let nextX = player.x;
  let nextY = player.y;

  // X movement with 5px corner-sliding
  const dx = (vx + windPushVx) * dt;
  if (Math.abs(dx) > 0.00001) {
    if (canOccupyPosition(player.actId, nextX + dx, nextY, save)) {
      nextX += dx;
    } else {
      const slideBudget = CORNER_SLIDE_MAX_TILES;
      const stepProbe = 0.0625; // 1px
      let slid = false;
      for (let offset = stepProbe; offset <= slideBudget + 0.0001; offset += stepProbe) {
        if (
          canOccupyPosition(player.actId, nextX + dx, nextY - offset, save) &&
          canOccupyPosition(player.actId, nextX, nextY - Math.min(offset, Math.abs(dx) + 0.04), save)
        ) {
          nextY -= Math.min(offset, Math.abs(dx) + 0.03);
          nextX += dx;
          slid = true;
          break;
        }
        if (
          canOccupyPosition(player.actId, nextX + dx, nextY + offset, save) &&
          canOccupyPosition(player.actId, nextX, nextY + Math.min(offset, Math.abs(dx) + 0.04), save)
        ) {
          nextY += Math.min(offset, Math.abs(dx) + 0.03);
          nextX += dx;
          slid = true;
          break;
        }
      }
      if (!slid) vx = 0;
    }
  }

  // Y movement with 5px corner-sliding
  const dy = vy * dt;
  if (Math.abs(dy) > 0.00001) {
    if (canOccupyPosition(player.actId, nextX, nextY + dy, save)) {
      nextY += dy;
    } else {
      const slideBudget = CORNER_SLIDE_MAX_TILES;
      const stepProbe = 0.0625; // 1px
      let slid = false;
      for (let offset = stepProbe; offset <= slideBudget + 0.0001; offset += stepProbe) {
        if (
          canOccupyPosition(player.actId, nextX - offset, nextY + dy, save) &&
          canOccupyPosition(player.actId, nextX - Math.min(offset, Math.abs(dy) + 0.04), nextY, save)
        ) {
          nextX -= Math.min(offset, Math.abs(dy) + 0.03);
          nextY += dy;
          slid = true;
          break;
        }
        if (
          canOccupyPosition(player.actId, nextX + offset, nextY + dy, save) &&
          canOccupyPosition(player.actId, nextX + Math.min(offset, Math.abs(dy) + 0.04), nextY, save)
        ) {
          nextX += Math.min(offset, Math.abs(dy) + 0.03);
          nextY += dy;
          slid = true;
          break;
        }
      }
      if (!slid) vy = 0;
    }
  }

  let direction: Direction = player.direction;
  if (Math.hypot(vx, vy) > 0.2) {
    if (Math.abs(vx) > Math.abs(vy)) {
      direction = vx > 0 ? 'right' : 'left';
    } else {
      direction = vy > 0 ? 'down' : 'up';
    }
  }

  const movedDist = Math.hypot(nextX - player.x, nextY - player.y);
  const isMoving = movedDist > 0.002;

  let animTimer = player.animTimer + dt;
  let animFrame = player.animFrame;
  const animInterval = isDashing ? 0.09 : 0.17;
  if (isMoving && animTimer >= animInterval) {
    animTimer -= animInterval;
    animFrame = animFrame === 0 ? 1 : 0;
  } else if (!isMoving) {
    animTimer = 0;
    animFrame = 0;
  }

  let footstepTimer = player.footstepTimer + (isMoving ? dt : 0);
  let footstepTerrain: FootstepTerrain | null = null;
  const stepInterval = isDashing ? 0.14 : 0.28;
  if (isMoving && footstepTimer >= stepInterval) {
    footstepTimer -= stepInterval;
    const tile =
      ZONES[player.actId].tiles[Math.floor(nextY)]?.[Math.floor(nextX)];
    footstepTerrain = tileToFootstepTerrain(tile);
  } else if (!isMoving) {
    footstepTimer = 0.2;
  }

  return {
    footstepTerrain,
    spawnedDust,
    player: {
      ...player,
      x: nextX,
      y: nextY,
      vx,
      vy,
      direction,
      isMoving,
      animFrame,
      animTimer,
      footstepTimer,
      stamina,
      staminaCooldown,
      dashTimer,
    },
  };
}

export function scanProximityInteractable(
  player: PlayerState,
  save: SaveDataV2
): InteractTarget | null {
  const dirVec: Record<Direction, { dx: number; dy: number }> = {
    up: { dx: 0, dy: -1 },
    down: { dx: 0, dy: 1 },
    left: { dx: -1, dy: 0 },
    right: { dx: 1, dy: 0 },
  };
  const facing = dirVec[player.direction];

  let best: { target: InteractTarget; score: number } | null = null;

  for (const entity of WORLD_ENTITIES) {
    if (entity.act !== player.actId) continue;
    if (isEntityCollected(entity, save)) continue;
    if (entity.kind === 'cairn' && isEntityResolved(entity, save)) continue;

    const pos = getEntityPosition(entity, save);
    const ex = pos.x + 0.5;
    const ey = pos.y + 0.5;
    const dx = ex - player.x;
    const dy = ey - player.y;
    const distTiles = Math.hypot(dx, dy);
    const distPx = distTiles * TILE_SIZE;

    if (distPx > PROXIMITY_SCAN_RADIUS_PX) continue;

    const dot =
      distTiles > 0.001
        ? (dx / distTiles) * facing.dx + (dy / distTiles) * facing.dy
        : 1;
    // Favor entities in front of the player
    const score = distPx - dot * 10;

    let verb = entity.verb;
    if (entity.kind === 'creature' && isEntityResolved(entity, save)) {
      verb = 'Parler';
    }

    const target: InteractTarget = {
      entity,
      x: pos.x,
      y: pos.y,
      distPx,
      verb,
      label: entity.label,
      badge: entity.badge,
    };

    if (!best || score < best.score) {
      best = { target, score };
    }
  }

  return best ? best.target : null;
}

export function createBellPulse(
  player: PlayerState,
  save: SaveDataV2
): BellPulse {
  let nearestAngle: number | null = null;
  let nearestDist = Infinity;

  for (const entity of WORLD_ENTITIES) {
    if (entity.act !== player.actId) continue;
    const isUncollectedNote =
      entity.noteId && !save.collectedNotes.includes(entity.noteId);
    const isFallenCairn =
      entity.kind === 'cairn' && !save.rebuiltCairns.includes(entity.id);

    if (!isUncollectedNote && !isFallenCairn) continue;
    const dx = entity.x + 0.5 - player.x;
    const dy = entity.y + 0.5 - player.y;
    const d = Math.hypot(dx, dy);
    if (d < nearestDist) {
      nearestDist = d;
      nearestAngle = Math.atan2(dy, dx);
    }
  }

  return {
    x: player.x * TILE_SIZE,
    y: player.y * TILE_SIZE,
    radius: 6,
    maxRadius: 96,
    alpha: 1,
    hintAngle: nearestAngle,
  };
}

export function createSnowParticles(
  count: number,
  width: number,
  height: number
): SnowParticle[] {
  const particles: SnowParticle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: -6 - Math.random() * 10,
      vy: 14 + Math.random() * 18,
      size: Math.random() > 0.72 ? 2 : 1,
      alpha: 0.4 + Math.random() * 0.5,
    });
  }
  return particles;
}

export function updateSnowParticles(
  particles: SnowParticle[],
  dt: number,
  actId: ActId,
  wind: WindState,
  width: number,
  height: number
): void {
  const windBoost =
    actId === 3 && wind.phase === 'gust'
      ? 4.2 * wind.direction
      : actId === 3
      ? 1.5
      : actId === 4
      ? 1.2
      : 1;

  for (const p of particles) {
    const vx = actId === 3 && wind.phase === 'gust' ? 24 * windBoost : p.vx;
    p.x += vx * dt;
    p.y += p.vy * dt;
    if (p.y > height) {
      p.y = -2;
      p.x = Math.random() * width;
    }
    if (p.x < -4) p.x = width + 2;
    if (p.x > width + 4) p.x = -2;
  }
}

export function computeTargetCamera(
  player: PlayerState,
  currentCam: { x: number; y: number },
  dt: number,
  viewWidth: number,
  viewHeight: number
): { x: number; y: number } {
  const zone = ZONES[player.actId];
  const worldW = zone.width * TILE_SIZE;
  const worldH = zone.height * TILE_SIZE;

  const targetX = Math.max(
    0,
    Math.min(worldW - viewWidth, player.x * TILE_SIZE - viewWidth / 2)
  );
  const targetY = Math.max(
    0,
    Math.min(worldH - viewHeight, player.y * TILE_SIZE - viewHeight / 2)
  );

  const lerp = 1 - Math.exp(-9 * dt);
  return {
    x: currentCam.x + (targetX - currentCam.x) * lerp,
    y: currentCam.y + (targetY - currentCam.y) * lerp,
  };
}

function drawPromptBubble(
  ctx: CanvasRenderingContext2D,
  bx: number,
  by: number,
  badge: PromptBadgeKind
): void {
  ctx.fillStyle = '#000000';
  ctx.fillRect(bx, by, 12, 12);
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1;
  ctx.strokeRect(bx + 0.5, by + 0.5, 11, 11);

  ctx.fillStyle = '#FDE68A';
  if (badge === '!') {
    ctx.fillRect(bx + 5, by + 2, 2, 5);
    ctx.fillRect(bx + 5, by + 8, 2, 2);
  } else if (badge === '?') {
    ctx.fillRect(bx + 4, by + 2, 4, 2);
    ctx.fillRect(bx + 6, by + 4, 2, 2);
    ctx.fillRect(bx + 5, by + 6, 2, 1);
    ctx.fillRect(bx + 5, by + 8, 2, 2);
  } else if (badge === 'climb') {
    ctx.fillRect(bx + 5, by + 2, 2, 2);
    ctx.fillRect(bx + 4, by + 4, 4, 2);
    ctx.fillRect(bx + 5, by + 6, 2, 4);
  } else if (badge === 'bell') {
    ctx.fillRect(bx + 4, by + 3, 4, 4);
    ctx.fillRect(bx + 3, by + 7, 6, 2);
    ctx.fillRect(bx + 5, by + 9, 2, 1);
  } else {
    // hand / interact dot
    ctx.fillRect(bx + 4, by + 4, 4, 4);
  }
}

export function renderWorldCanvas(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  save: SaveDataV2,
  camera: { x: number; y: number },
  viewWidth: number,
  viewHeight: number,
  snow: SnowParticle[],
  dust: DustParticle[],
  pulses: BellPulse[],
  wind: WindState,
  elapsedSec: number,
  interactTarget: InteractTarget | null
): void {
  const bank = getSpriteBank();
  const zone = ZONES[player.actId];
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = zone.skyTint;
  ctx.fillRect(0, 0, viewWidth, viewHeight);

  const camX = Math.round(camera.x);
  const camY = Math.round(camera.y);
  const animIdx = Math.floor(elapsedSec * 3.5) % 2;

  // Viewport frustum culling (+1 tile margin)
  const startCol = Math.max(0, Math.floor(camX / TILE_SIZE) - 1);
  const endCol = Math.min(
    zone.width - 1,
    Math.ceil((camX + viewWidth) / TILE_SIZE) + 1
  );
  const startRow = Math.max(0, Math.floor(camY / TILE_SIZE) - 1);
  const endRow = Math.min(
    zone.height - 1,
    Math.ceil((camY + viewHeight) / TILE_SIZE) + 1
  );

  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const tile = zone.tiles[row][col];
      const sx = col * TILE_SIZE - camX;
      const sy = row * TILE_SIZE - camY;

      if (tile === 'tree' || tile === 'rock') {
        ctx.drawImage(
          player.actId === 1 ? bank.tiles.grass : bank.tiles.snow,
          sx,
          sy
        );
        ctx.drawImage(bank.tiles[tile], sx, sy);
      } else if (tile === 'mist') {
        ctx.drawImage(bank.tiles.path, sx, sy);
        if (isTileSolid(tile, col, row, player.actId, save.rebuiltCairns)) {
          ctx.drawImage(bank.tiles.mist, sx, sy);
        }
      } else {
        ctx.drawImage(bank.tiles[tile] ?? bank.tiles.snow, sx, sy);
      }
    }
  }

  // Entities pass
  for (const entity of WORLD_ENTITIES) {
    if (entity.act !== player.actId) continue;
    if (isEntityCollected(entity, save)) continue;

    const pos = getEntityPosition(entity, save);
    const sx = Math.round(pos.x * TILE_SIZE - camX);
    const sy = Math.round(pos.y * TILE_SIZE - camY);

    if (
      sx < -24 ||
      sx > viewWidth + 24 ||
      sy < -24 ||
      sy > viewHeight + 24
    ) {
      continue;
    }

    if (entity.kind === 'campfire') {
      ctx.drawImage(bank.animated.campfire[animIdx], sx, sy);
    } else if (entity.kind === 'cairn') {
      const rebuilt = isEntityResolved(entity, save);
      ctx.drawImage(
        rebuilt ? bank.objects.cairn_rebuilt : bank.objects.cairn_fallen,
        sx,
        sy
      );
    } else if (entity.kind === 'pickup') {
      const bob = Math.round(Math.sin(elapsedSec * 4) * 1.5);
      if (entity.sprite === 'item_sparkle') {
        ctx.drawImage(bank.animated.item_sparkle[animIdx], sx, sy + bob);
      } else {
        ctx.drawImage(
          bank.objects[entity.sprite] ?? bank.animated.item_sparkle[animIdx],
          sx,
          sy + bob
        );
      }
    } else if (entity.kind === 'climb' || entity.kind === 'examine') {
      ctx.drawImage(
        bank.objects[entity.sprite] ?? bank.objects.sign_post,
        sx,
        sy
      );
    } else {
      // NPC / Creature / Monolith (24x24)
      const npcSprite = bank.npcs[entity.sprite];
      if (npcSprite) {
        const floatY =
          entity.creatureId === 'gypaete_cimes'
            ? Math.round(Math.sin(elapsedSec * 4) * 2)
            : 0;
        ctx.drawImage(npcSprite, sx - 4, sy - 6 + floatY);
        if (
          entity.creatureId &&
          save.pacifiedCreatures.includes(entity.creatureId)
        ) {
          ctx.fillStyle = '#FDE68A';
          ctx.fillRect(sx + 7, sy - 9, 2, 2);
        }
      }
    }
  }

  // Dash dust particles
  for (const d of dust) {
    const alpha = Math.max(0, d.life / d.maxLife);
    ctx.fillStyle = `rgba(241, 245, 249, ${alpha.toFixed(2)})`;
    ctx.fillRect(Math.round(d.x - camX), Math.round(d.y - camY), 2, 2);
  }

  // Player sprite
  const playerSprite = bank.player[player.direction][player.animFrame];
  const px = Math.round(player.x * TILE_SIZE - 8 - camX);
  const py = Math.round(player.y * TILE_SIZE - 10 - camY);
  if (player.dashTimer > 0) {
    ctx.globalAlpha = 0.45;
    ctx.drawImage(
      playerSprite,
      Math.round(px - player.dashDirX * 5),
      Math.round(py - player.dashDirY * 5)
    );
    ctx.globalAlpha = 1;
  }
  ctx.drawImage(playerSprite, px, py);

  // Act III wind telegraph / gust streaks
  if (zone.hasWindGusts && wind.phase !== 'calm') {
    const isGust = wind.phase === 'gust';
    ctx.fillStyle = isGust
      ? 'rgba(224, 242, 254, 0.45)'
      : 'rgba(253, 230, 138, 0.28)';
    const streakCount = isGust ? 14 : 6;
    for (let i = 0; i < streakCount; i++) {
      const speed = isGust ? 210 : 90;
      const sx =
        ((elapsedSec * speed * wind.direction + i * 47) % (viewWidth + 40) +
          viewWidth +
          40) %
          (viewWidth + 40) -
        20;
      const sy = (i * 29 + 11) % viewHeight;
      ctx.fillRect(Math.round(sx), sy, isGust ? 18 : 8, 1);
    }
  }

  // Warm lantern radial glow & ambient vignette
  ctx.save();
  const lx = Math.round(player.x * TILE_SIZE - camX);
  const ly = Math.round(player.y * TILE_SIZE - 2 - camY);
  const flicker = Math.sin(elapsedSec * 7) * 2;
  const grad = ctx.createRadialGradient(lx, ly, 14, lx, ly, 92 + flicker);
  grad.addColorStop(0, 'rgba(245, 158, 11, 0.14)');
  grad.addColorStop(0.5, 'rgba(11, 16, 33, 0.08)');
  grad.addColorStop(1, `rgba(5, 8, 20, ${0.32 + zone.fogDensity * 0.5})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, viewWidth, viewHeight);
  ctx.restore();

  // Falling snow
  for (const p of snow) {
    ctx.fillStyle = `rgba(241, 245, 249, ${p.alpha.toFixed(2)})`;
    ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
  }

  // Bell acoustic pulse rings + directional hint arrow
  for (const pulse of pulses) {
    const cx = Math.round(pulse.x - camX);
    const cy = Math.round(pulse.y - camY);
    ctx.save();
    ctx.strokeStyle = `rgba(253, 230, 138, ${pulse.alpha.toFixed(2)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, pulse.radius, 0, Math.PI * 2);
    ctx.stroke();

    if (pulse.hintAngle !== null) {
      const hx = Math.round(cx + Math.cos(pulse.hintAngle) * 24);
      const hy = Math.round(cy + Math.sin(pulse.hintAngle) * 24);
      ctx.fillStyle = `rgba(253, 230, 138, ${pulse.alpha.toFixed(2)})`;
      ctx.fillRect(hx - 2, hy - 2, 4, 4);
    }
    ctx.restore();
  }

  // Floating prompt bubble above closest interactable
  if (interactTarget) {
    const tx = Math.round(interactTarget.x * TILE_SIZE + 2 - camX);
    const bounce = Math.round(Math.sin(elapsedSec * 6) * 1.5);
    const ty = Math.max(4, Math.round(interactTarget.y * TILE_SIZE - 14 - camY + bounce));
    drawPromptBubble(ctx, tx, ty, interactTarget.badge);
  }
}
