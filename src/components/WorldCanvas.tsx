import React, { useEffect, useRef } from 'react';
import { ZONES } from '../data/mountainWorld';
import { audioSynth } from '../engine/AudioSynth';
import {
  BellPulse,
  DustParticle,
  InteractTarget,
  SnowParticle,
  WindState,
  computeTargetCamera,
  createSnowParticles,
  renderWorldCanvas,
  scanProximityInteractable,
  stepPlayerPhysics,
  stepWindState,
  updateSnowParticles,
} from '../engine/WorldEngine';
import { PlayerState, SaveDataV2 } from '../types/game';

interface WorldCanvasProps {
  playerRef: React.MutableRefObject<PlayerState>;
  save: SaveDataV2;
  inputVectorRef: React.MutableRefObject<{ x: number; y: number }>;
  bellPulsesRef: React.MutableRefObject<BellPulse[]>;
  dustRef: React.MutableRefObject<DustParticle[]>;
  isPaused: boolean;
  prefersReducedMotion: boolean;
  onInteractTargetChange: (target: InteractTarget | null) => void;
  onStaminaChange: (stamina: number) => void;
  onWindPhaseChange: (phase: WindState['phase']) => void;
}

export const WorldCanvas: React.FC<WorldCanvasProps> = ({
  playerRef,
  save,
  inputVectorRef,
  bellPulsesRef,
  dustRef,
  isPaused,
  prefersReducedMotion,
  onInteractTargetChange,
  onStaminaChange,
  onWindPhaseChange,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const metricsRef = useRef<{
    physW: number;
    physH: number;
    zoom: number;
    viewW: number;
    viewH: number;
  }>({
    physW: 480,
    physH: 352,
    zoom: 2,
    viewW: 240,
    viewH: 176,
  });

  const cameraRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const snowRef = useRef<SnowParticle[]>(createSnowParticles(48, 260, 200));
  const windRef = useRef<WindState>({ phase: 'calm', timer: 3.0, direction: 1 });
  const saveRef = useRef<SaveDataV2>(save);
  const isPausedRef = useRef<boolean>(isPaused);
  const reducedMotionRef = useRef<boolean>(prefersReducedMotion);

  const lastTargetKeyRef = useRef<string>('');
  const lastStaminaRef = useRef<number>(100);
  const lastWindPhaseRef = useRef<WindState['phase']>('calm');

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    reducedMotionRef.current = prefersReducedMotion;
  }, [prefersReducedMotion]);

  // ResizeObserver for crisp HiDPI Retina scaling
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const updateCanvasSize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const physW = Math.max(240, Math.round(rect.width * dpr));
      const physH = Math.max(176, Math.round(rect.height * dpr));

      canvas.width = physW;
      canvas.height = physH;

      const zoom = Math.max(
        1,
        Math.floor(Math.min(physW / 216, physH / 168))
      );
      const viewW = Math.ceil(physW / zoom);
      const viewH = Math.ceil(physH / zoom);

      metricsRef.current = { physW, physH, zoom, viewW, viewH };
      snowRef.current = createSnowParticles(48, viewW, viewH);

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
      }
    };

    updateCanvasSize();
    const observer = new ResizeObserver(updateCanvasSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Snap camera when switching acts
  useEffect(() => {
    const m = metricsRef.current;
    cameraRef.current = computeTargetCamera(
      playerRef.current,
      { x: 0, y: 0 },
      10,
      m.viewW,
      m.viewH
    );
    windRef.current = { phase: 'calm', timer: 2.5, direction: 1 };
    audioSynth.setWindGustActive(false);
  }, [save.actId, playerRef]);

  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();
    let elapsedSec = 0;

    const tick = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);
      elapsedSec += dt;

      const currentSave = saveRef.current;
      const zone = ZONES[playerRef.current.actId];
      const m = metricsRef.current;

      if (!isPausedRef.current) {
        windRef.current = stepWindState(windRef.current, dt, zone.hasWindGusts);
        audioSynth.setWindGustActive(
          zone.hasWindGusts && windRef.current.phase === 'gust'
        );

        if (windRef.current.phase !== lastWindPhaseRef.current) {
          lastWindPhaseRef.current = windRef.current.phase;
          onWindPhaseChange(windRef.current.phase);
        }

        const vec = inputVectorRef.current;
        const stepRes = stepPlayerPhysics(
          playerRef.current,
          vec.x,
          vec.y,
          dt,
          currentSave,
          windRef.current
        );
        playerRef.current = stepRes.player;

        if (stepRes.footstepTerrain) {
          audioSynth.playFootstep(stepRes.footstepTerrain);
        }
        if (stepRes.spawnedDust.length > 0) {
          dustRef.current.push(...stepRes.spawnedDust);
        }

        const roundedStamina = Math.round(stepRes.player.stamina);
        if (
          Math.abs(roundedStamina - lastStaminaRef.current) >= 2 ||
          (roundedStamina === 100 && lastStaminaRef.current !== 100)
        ) {
          lastStaminaRef.current = roundedStamina;
          onStaminaChange(roundedStamina);
        }
      } else {
        audioSynth.setWindGustActive(false);
        if (playerRef.current.isMoving) {
          playerRef.current = {
            ...playerRef.current,
            vx: 0,
            vy: 0,
            isMoving: false,
            animFrame: 0,
          };
        }
      }

      // Update dust particles
      dustRef.current = dustRef.current
        .map((d) => ({
          ...d,
          x: d.x + d.vx * dt,
          y: d.y + d.vy * dt,
          life: d.life - dt,
        }))
        .filter((d) => d.life > 0);

      // Update bell acoustic pulse rings
      bellPulsesRef.current = bellPulsesRef.current
        .map((p) => ({
          ...p,
          radius: p.radius + 95 * dt,
          alpha: Math.max(0, 1 - p.radius / p.maxRadius),
        }))
        .filter((p) => p.radius < p.maxRadius);

      updateSnowParticles(
        snowRef.current,
        dt,
        playerRef.current.actId,
        windRef.current,
        m.viewW,
        m.viewH
      );

      cameraRef.current = computeTargetCamera(
        playerRef.current,
        cameraRef.current,
        dt,
        m.viewW,
        m.viewH
      );

      const target = scanProximityInteractable(playerRef.current, currentSave);
      const targetKey = target ? `${target.entity.id}:${target.verb}` : '';
      if (targetKey !== lastTargetKeyRef.current) {
        lastTargetKeyRef.current = targetKey;
        onInteractTargetChange(target);
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.setTransform(m.zoom, 0, 0, m.zoom, 0, 0);
          ctx.imageSmoothingEnabled = false;

          const shakeX =
            !reducedMotionRef.current &&
            zone.hasWindGusts &&
            windRef.current.phase === 'gust'
              ? Math.sin(elapsedSec * 45) * 0.6
              : 0;

          renderWorldCanvas(
            ctx,
            playerRef.current,
            currentSave,
            { x: cameraRef.current.x + shakeX, y: cameraRef.current.y },
            m.viewW,
            m.viewH,
            snowRef.current,
            dustRef.current,
            bellPulsesRef.current,
            windRef.current,
            elapsedSec,
            target
          );
        }
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [
    bellPulsesRef,
    dustRef,
    inputVectorRef,
    onInteractTargetChange,
    onStaminaChange,
    onWindPhaseChange,
    playerRef,
  ]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#050814] overflow-hidden"
    >
      <canvas ref={canvasRef} className="pixelated w-full h-full block" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: 'inset 0 0 26px rgba(0, 0, 0, 0.62)' }}
      />
    </div>
  );
};
