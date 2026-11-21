import React, { useEffect, useRef } from 'react';
import {
  VIEWPORT_HEIGHT,
  VIEWPORT_WIDTH,
} from '../data/mountainWorld';
import {
  InteractTarget,
  SnowParticle,
  checkZoneTransition,
  computeTargetCamera,
  createSnowParticles,
  findInteractableInFront,
  movePlayer,
  renderWorldCanvas,
  updateSnowParticles,
} from '../engine/WorldEngine';
import { PlayerState, SaveData, ZoneTransition } from '../types/game';

interface WorldCanvasProps {
  playerRef: React.MutableRefObject<PlayerState>;
  save: SaveData;
  inputVectorRef: React.MutableRefObject<{ x: number; y: number }>;
  isPaused: boolean;
  onZoneTransition: (transition: ZoneTransition) => void;
  onInteractTargetChange: (target: InteractTarget | null) => void;
}

export const WorldCanvas: React.FC<WorldCanvasProps> = ({
  playerRef,
  save,
  inputVectorRef,
  isPaused,
  onZoneTransition,
  onInteractTargetChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const snowRef = useRef<SnowParticle[]>(createSnowParticles(48));
  const lastTargetKeyRef = useRef<string>('');
  const saveRef = useRef<SaveData>(save);
  const isPausedRef = useRef<boolean>(isPaused);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    // Snap camera cleanly when zone changes
    const p = playerRef.current;
    cameraRef.current = computeTargetCamera(p, { x: 0, y: 0 }, 10);
  }, [save.zoneId, playerRef]);

  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();
    let elapsedSec = 0;

    const tick = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(0.05, Math.max(0.001, rawDt));
      elapsedSec += dt;

      const currentSave = saveRef.current;
      let player = playerRef.current;

      if (!isPausedRef.current) {
        const vec = inputVectorRef.current;
        player = movePlayer(player, vec.x, vec.y, dt, currentSave);
        playerRef.current = player;

        const transition = checkZoneTransition(player);
        if (transition) {
          onZoneTransition(transition);
        }
      } else if (player.isMoving) {
        player = { ...player, isMoving: false, animFrame: 0 };
        playerRef.current = player;
      }

      updateSnowParticles(snowRef.current, dt, player.zoneId);
      cameraRef.current = computeTargetCamera(player, cameraRef.current, dt);

      const target = findInteractableInFront(player, currentSave);
      const targetKey = target
        ? target.kind === 'npc'
          ? `npc:${target.npc.id}`
          : `obj:${target.object.id}`
        : '';

      if (targetKey !== lastTargetKeyRef.current) {
        lastTargetKeyRef.current = targetKey;
        onInteractTargetChange(target);
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderWorldCanvas(
            ctx,
            player,
            currentSave,
            cameraRef.current,
            snowRef.current,
            elapsedSec,
            target
          );
        }
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [inputVectorRef, onInteractTargetChange, onZoneTransition, playerRef]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-[#050814] overflow-hidden">
      <canvas
        ref={canvasRef}
        width={VIEWPORT_WIDTH}
        height={VIEWPORT_HEIGHT}
        className="pixelated w-full h-full object-contain"
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          boxShadow: 'inset 0 0 28px rgba(0, 0, 0, 0.65)',
        }}
      />
    </div>
  );
};
