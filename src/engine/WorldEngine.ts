import {
  NPCS,
  TILE_SIZE,
  VIEWPORT_HEIGHT,
  VIEWPORT_WIDTH,
  WORLD_OBJECTS,
  ZONES,
  isTileSolid,
} from '../data/mountainWorld';
import {
  Direction,
  NpcEntity,
  NpcId,
  PlayerState,
  SaveData,
  WorldObject,
  ZoneId,
  ZoneTransition,
} from '../types/game';
import { getSpriteBank } from './PixelSprites';

export const PLAYER_SPEED_TILES_PER_SEC = 4.2;
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

export type InteractTarget =
  | { kind: 'npc'; npc: NpcEntity }
  | { kind: 'object'; object: WorldObject };

export function isNpcResolved(npcId: NpcId, save: SaveData): boolean {
  return (
    save.befriendedIds.includes(npcId) ||
    Boolean(save.flags[`bypassed_${npcId}`])
  );
}

export function getNpcPosition(
  npc: NpcEntity,
  save: SaveData
): { x: number; y: number } {
  if (isNpcResolved(npc.id, save)) {
    return { x: npc.resolvedX, y: npc.resolvedY };
  }
  return { x: npc.x, y: npc.y };
}

export function canOccupyPosition(
  zoneId: ZoneId,
  x: number,
  y: number,
  save: SaveData
): boolean {
  const zone = ZONES[zoneId];
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
      if (!tile || isTileSolid(tile)) {
        return false;
      }
    }
  }

  for (const obj of WORLD_OBJECTS) {
    if (obj.zoneId !== zoneId || !obj.solid) continue;
    const oMinX = obj.x + 0.14;
    const oMaxX = obj.x + 0.86;
    const oMinY = obj.y + 0.18;
    const oMaxY = obj.y + 0.88;
    if (maxX > oMinX && minX < oMaxX && maxY > oMinY && minY < oMaxY) {
      return false;
    }
  }

  for (const npc of NPCS) {
    if (npc.zoneId !== zoneId) continue;
    const pos = getNpcPosition(npc, save);
    const nMinX = pos.x + 0.1;
    const nMaxX = pos.x + 0.9;
    const nMinY = pos.y + 0.12;
    const nMaxY = pos.y + 0.9;
    if (maxX > nMinX && minX < nMaxX && maxY > nMinY && minY < nMaxY) {
      return false;
    }
  }

  return true;
}

export function movePlayer(
  player: PlayerState,
  inputX: number,
  inputY: number,
  dt: number,
  save: SaveData
): PlayerState {
  const mag = Math.hypot(inputX, inputY);
  if (mag < 0.08) {
    return {
      ...player,
      isMoving: false,
      animFrame: 0,
      animTimer: 0,
    };
  }

  const normX = inputX / Math.max(1, mag);
  const normY = inputY / Math.max(1, mag);

  let direction: Direction = player.direction;
  if (Math.abs(normX) > Math.abs(normY)) {
    direction = normX > 0 ? 'right' : 'left';
  } else {
    direction = normY > 0 ? 'down' : 'up';
  }

  const step = PLAYER_SPEED_TILES_PER_SEC * Math.min(1, mag) * dt;
  let nextX = player.x;
  let nextY = player.y;

  // X movement
  const tryX = nextX + normX * step;
  if (canOccupyPosition(player.zoneId, tryX, nextY, save)) {
    nextX = tryX;
  } else if (Math.abs(normY) < 0.25) {
    // Vertical corner-slide assist when moving horizontally
    for (const offset of [-0.32, 0.32]) {
      const targetCenterY = Math.floor(nextY + offset) + 0.5;
      const slideStep = Math.sign(targetCenterY - nextY) * step * 0.75;
      if (
        Math.abs(targetCenterY - nextY) > 0.02 &&
        canOccupyPosition(player.zoneId, tryX, targetCenterY, save) &&
        canOccupyPosition(player.zoneId, nextX, nextY + slideStep, save)
      ) {
        nextY += slideStep;
        break;
      }
    }
  }

  // Y movement
  const tryY = nextY + normY * step;
  if (canOccupyPosition(player.zoneId, nextX, tryY, save)) {
    nextY = tryY;
  } else if (Math.abs(normX) < 0.25) {
    // Horizontal corner-slide assist when moving vertically into narrow passes
    for (const offset of [-0.35, 0.35]) {
      const targetCenterX = Math.floor(nextX + offset) + 0.5;
      const slideStep = Math.sign(targetCenterX - nextX) * step * 0.85;
      if (
        Math.abs(targetCenterX - nextX) > 0.02 &&
        canOccupyPosition(player.zoneId, targetCenterX, tryY, save) &&
        canOccupyPosition(player.zoneId, nextX + slideStep, nextY, save)
      ) {
        nextX += slideStep;
        break;
      }
    }
  }

  const moved =
    Math.abs(nextX - player.x) > 0.0001 || Math.abs(nextY - player.y) > 0.0001;

  let animTimer = player.animTimer + dt;
  let animFrame = player.animFrame;
  if (animTimer >= 0.18) {
    animTimer -= 0.18;
    animFrame = animFrame === 0 ? 1 : 0;
  }

  return {
    ...player,
    x: nextX,
    y: nextY,
    direction,
    isMoving: moved,
    animFrame: moved ? animFrame : 0,
    animTimer: moved ? animTimer : 0,
  };
}

export function checkZoneTransition(
  player: PlayerState
): ZoneTransition | null {
  const zone = ZONES[player.zoneId];
  for (const tr of zone.transitions) {
    if (
      player.x >= tr.x &&
      player.x <= tr.x + tr.width &&
      player.y >= tr.y &&
      player.y <= tr.y + tr.height + 0.2
    ) {
      return tr;
    }
  }
  return null;
}

export function findInteractableInFront(
  player: PlayerState,
  save: SaveData
): InteractTarget | null {
  const dirVec: Record<Direction, { dx: number; dy: number }> = {
    up: { dx: 0, dy: -0.78 },
    down: { dx: 0, dy: 0.78 },
    left: { dx: -0.78, dy: 0 },
    right: { dx: 0.78, dy: 0 },
  };

  const probeX = player.x + dirVec[player.direction].dx;
  const probeY = player.y + dirVec[player.direction].dy;

  // Check NPCs first (facing probe OR close proximity)
  let bestNpc: { npc: NpcEntity; dist: number } | null = null;
  for (const npc of NPCS) {
    if (npc.zoneId !== player.zoneId) continue;
    const pos = getNpcPosition(npc, save);
    const cx = pos.x + 0.5;
    const cy = pos.y + 0.5;
    const distToProbe = Math.hypot(cx - probeX, cy - probeY);
    const distToPlayer = Math.hypot(cx - player.x, cy - player.y);
    if (distToProbe < 0.85 || distToPlayer < 1.05) {
      if (!bestNpc || distToProbe < bestNpc.dist) {
        bestNpc = { npc, dist: distToProbe };
      }
    }
  }
  if (bestNpc) {
    return { kind: 'npc', npc: bestNpc.npc };
  }

  // Check world objects (uncollected items, campfires, signs)
  let bestObj: { object: WorldObject; dist: number } | null = null;
  for (const obj of WORLD_OBJECTS) {
    if (obj.zoneId !== player.zoneId) continue;
    if (obj.type === 'item' && save.collectedItems.includes(obj.id)) {
      continue;
    }
    const cx = obj.x + 0.5;
    const cy = obj.y + 0.5;
    const distToProbe = Math.hypot(cx - probeX, cy - probeY);
    const distToPlayer = Math.hypot(cx - player.x, cy - player.y);
    if (distToProbe < 0.85 || distToPlayer < 0.95) {
      if (!bestObj || distToProbe < bestObj.dist) {
        bestObj = { object: obj, dist: distToProbe };
      }
    }
  }

  if (bestObj) {
    return { kind: 'object', object: bestObj.object };
  }

  return null;
}

export function createSnowParticles(count = 46): SnowParticle[] {
  const particles: SnowParticle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * VIEWPORT_WIDTH,
      y: Math.random() * VIEWPORT_HEIGHT,
      vx: -6 - Math.random() * 10,
      vy: 14 + Math.random() * 18,
      size: Math.random() > 0.72 ? 2 : 1,
      alpha: 0.4 + Math.random() * 0.55,
    });
  }
  return particles;
}

export function updateSnowParticles(
  particles: SnowParticle[],
  dt: number,
  zoneId: ZoneId
): void {
  const windBoost = zoneId === 'bridge' ? 1.8 : zoneId === 'summit' ? 1.3 : 1;
  for (const p of particles) {
    p.x += p.vx * windBoost * dt;
    p.y += p.vy * dt;
    if (p.y > VIEWPORT_HEIGHT) {
      p.y = -2;
      p.x = Math.random() * (VIEWPORT_WIDTH + 30);
    }
    if (p.x < -4) {
      p.x = VIEWPORT_WIDTH + 2;
      p.y = Math.random() * VIEWPORT_HEIGHT;
    }
  }
}

export function computeTargetCamera(
  player: PlayerState,
  currentCam: { x: number; y: number },
  dt: number
): { x: number; y: number } {
  const zone = ZONES[player.zoneId];
  const worldW = zone.width * TILE_SIZE;
  const worldH = zone.height * TILE_SIZE;

  const targetX = Math.max(
    0,
    Math.min(worldW - VIEWPORT_WIDTH, player.x * TILE_SIZE - VIEWPORT_WIDTH / 2)
  );
  const targetY = Math.max(
    0,
    Math.min(worldH - VIEWPORT_HEIGHT, player.y * TILE_SIZE - VIEWPORT_HEIGHT / 2)
  );

  const lerp = 1 - Math.exp(-8 * dt);
  return {
    x: currentCam.x + (targetX - currentCam.x) * lerp,
    y: currentCam.y + (targetY - currentCam.y) * lerp,
  };
}

export function renderWorldCanvas(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  save: SaveData,
  camera: { x: number; y: number },
  snow: SnowParticle[],
  elapsedSec: number,
  interactTarget: InteractTarget | null
): void {
  const bank = getSpriteBank();
  const zone = ZONES[player.zoneId];
  ctx.imageSmoothingEnabled = false;

  // Sky / backdrop
  ctx.fillStyle = zone.skyTint;
  ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

  const camX = Math.round(camera.x);
  const camY = Math.round(camera.y);
  const animIdx = Math.floor(elapsedSec * 3.5) % 2;

  // Ground + terrain tiles
  for (let row = 0; row < zone.height; row++) {
    for (let col = 0; col < zone.width; col++) {
      const tile = zone.tiles[row][col];
      const screenX = col * TILE_SIZE - camX;
      const screenY = row * TILE_SIZE - camY;

      if (
        screenX < -TILE_SIZE ||
        screenX > VIEWPORT_WIDTH ||
        screenY < -TILE_SIZE ||
        screenY > VIEWPORT_HEIGHT
      ) {
        continue;
      }

      if (tile === 'tree' || tile === 'rock') {
        ctx.drawImage(bank.tiles.snow, screenX, screenY);
        ctx.drawImage(bank.tiles[tile], screenX, screenY);
      } else {
        ctx.drawImage(bank.tiles[tile] ?? bank.tiles.snow, screenX, screenY);
      }
    }
  }

  // World objects (campfires, signs, sparkles)
  for (const obj of WORLD_OBJECTS) {
    if (obj.zoneId !== player.zoneId) continue;
    if (obj.type === 'item' && save.collectedItems.includes(obj.id)) continue;

    const sx = obj.x * TILE_SIZE - camX;
    const sy = obj.y * TILE_SIZE - camY;

    if (obj.sprite === 'campfire') {
      ctx.drawImage(bank.objects.campfire[animIdx], sx, sy);
    } else if (obj.sprite === 'item_sparkle') {
      const bob = Math.round(Math.sin(elapsedSec * 4) * 1.5);
      ctx.drawImage(bank.objects.item_sparkle[animIdx], sx, sy + bob);
    } else {
      ctx.drawImage(bank.objects.sign_post, sx, sy);
    }
  }

  // NPCs
  for (const npc of NPCS) {
    if (npc.zoneId !== player.zoneId) continue;
    const pos = getNpcPosition(npc, save);
    const sprite = bank.npcs[npc.sprite];
    if (!sprite) continue;

    const floatOffset =
      npc.id === 'echo_brouillard'
        ? Math.round(Math.sin(elapsedSec * 3) * 2)
        : 0;
    const sx = Math.round(pos.x * TILE_SIZE - 4 - camX);
    const sy = Math.round(pos.y * TILE_SIZE - 6 - camY + floatOffset);
    ctx.drawImage(sprite, sx, sy);

    // Small golden heart/star badge above befriended NPC
    if (save.befriendedIds.includes(npc.id)) {
      ctx.fillStyle = '#FDE68A';
      ctx.fillRect(sx + 11, sy - 4, 2, 2);
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(sx + 10, sy - 3, 1, 1);
      ctx.fillRect(sx + 13, sy - 3, 1, 1);
    }
  }

  // Player
  const playerSprite = bank.player[player.direction][player.animFrame];
  const px = Math.round(player.x * TILE_SIZE - 8 - camX);
  const py = Math.round(player.y * TILE_SIZE - 10 - camY);
  ctx.drawImage(playerSprite, px, py);

  // Subtle ambient darkness + warm radial lantern glow
  ctx.save();
  const lanternX = Math.round(player.x * TILE_SIZE - camX);
  const lanternY = Math.round(player.y * TILE_SIZE - 2 - camY);
  const flicker = Math.sin(elapsedSec * 7) * 2;

  const grad = ctx.createRadialGradient(
    lanternX,
    lanternY,
    14,
    lanternX,
    lanternY,
    88 + flicker
  );
  grad.addColorStop(0, 'rgba(245, 158, 11, 0.14)');
  grad.addColorStop(0.45, 'rgba(11, 16, 33, 0.08)');
  grad.addColorStop(1, 'rgba(5, 8, 20, 0.42)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

  // Warm campfire & shrine glow pools
  for (const obj of WORLD_OBJECTS) {
    if (obj.zoneId !== player.zoneId || obj.type !== 'campfire') continue;
    const fx = obj.x * TILE_SIZE + 8 - camX;
    const fy = obj.y * TILE_SIZE + 8 - camY;
    const fireGrad = ctx.createRadialGradient(fx, fy, 4, fx, fy, 42 + flicker);
    fireGrad.addColorStop(0, 'rgba(253, 230, 138, 0.28)');
    fireGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.12)');
    fireGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = fireGrad;
    ctx.fillRect(fx - 46, fy - 46, 92, 92);
  }
  ctx.restore();

  // Falling snow particles
  for (const p of snow) {
    ctx.fillStyle = `rgba(241, 245, 249, ${p.alpha.toFixed(2)})`;
    ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
  }

  // Interactable prompt bubble [!]
  if (interactTarget) {
    let tx = 0;
    let ty = 0;
    if (interactTarget.kind === 'npc') {
      const pos = getNpcPosition(interactTarget.npc, save);
      tx = Math.round(pos.x * TILE_SIZE + 8 - camX);
      ty = Math.round(pos.y * TILE_SIZE - 12 - camY);
    } else {
      tx = Math.round(interactTarget.object.x * TILE_SIZE + 8 - camX);
      ty = Math.round(interactTarget.object.y * TILE_SIZE - 10 - camY);
    }
    const bounce = Math.round(Math.sin(elapsedSec * 6) * 1.5);
    const bx = Math.max(8, Math.min(VIEWPORT_WIDTH - 14, tx - 5));
    const by = Math.max(4, ty + bounce);
    ctx.fillStyle = '#000000';
    ctx.fillRect(bx, by, 10, 10);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + 0.5, by + 0.5, 9, 9);
    ctx.fillStyle = '#FDE68A';
    ctx.fillRect(bx + 4, by + 2, 2, 4);
    ctx.fillRect(bx + 4, by + 7, 2, 1);
  }
}
