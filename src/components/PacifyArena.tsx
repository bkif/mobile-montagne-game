import React, { useEffect, useRef, useState } from 'react';
import { audioSynth } from '../engine/AudioSynth';
import {
  ARENA_HEIGHT,
  ARENA_WIDTH,
  PacifyState,
  createPacifyState,
  renderPacifyCanvas,
  setSoulTarget,
  stepPacifyState,
} from '../engine/PacifyMiniGameEngine';
import { PacifyChallengeConfig } from '../types/game';

interface PacifyArenaProps {
  config: PacifyChallengeConfig;
  onComplete: () => void;
  onCancel: () => void;
}

export const PacifyArena: React.FC<PacifyArenaProps> = ({
  config,
  onComplete,
  onCancel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<PacifyState>(createPacifyState(config));
  const [percent, setPercent] = useState(0);
  const completedRef = useRef(false);

  useEffect(() => {
    stateRef.current = createPacifyState(config);
    completedRef.current = false;
    setPercent(0);
  }, [config]);

  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(0.05, Math.max(0.001, rawDt));

      const st = stateRef.current;
      const events = stepPacifyState(st, dt);

      if (events.hit) {
        audioSynth.playHitSoft();
      }
      if (events.noteCollected) {
        audioSynth.playNoteCollect();
      }

      const pct = Math.min(
        100,
        Math.round((st.progress / st.config.durationSeconds) * 100)
      );
      setPercent(pct);

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderPacifyCanvas(ctx, st);
        }
      }

      if (events.completedNow && !completedRef.current) {
        completedRef.current = true;
        audioSynth.playPacifySuccess();
        window.setTimeout(() => {
          onComplete();
        }, 380);
        return;
      }

      rafId = window.requestAnimationFrame(loop);
    };

    rafId = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(rafId);
  }, [onComplete]);

  const updatePointerToArena = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const arenaX = ((clientX - rect.left) / rect.width) * ARENA_WIDTH;
    const arenaY = ((clientY - rect.top) / rect.height) * ARENA_HEIGHT;
    setSoulTarget(stateRef.current, arenaX, arenaY);
  };

  return (
    <div className="ut-frame w-full h-full flex flex-col justify-between p-2.5 bg-black text-white">
      <div className="flex items-center justify-between gap-2 pb-1.5">
        <div className="min-w-0">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-300 truncate">
            {config.title}
          </div>
          <div className="text-[11px] text-slate-300 truncate">
            {config.instruction}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            audioSynth.playUiSelect();
            onCancel();
          }}
          className="min-w-[48px] min-h-[48px] px-2.5 border-2 border-white text-[11px] font-bold uppercase shrink-0 active:bg-white active:text-black"
        >
          Pause
        </button>
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center">
        <div className="relative h-full max-h-[150px] aspect-[240/136] border-2 border-white bg-black">
          <canvas
            ref={canvasRef}
            width={ARENA_WIDTH}
            height={ARENA_HEIGHT}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              updatePointerToArena(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (e.buttons > 0 || e.pointerType === 'touch') {
                updatePointerToArena(e.clientX, e.clientY);
              }
            }}
            className="pixelated w-full h-full touch-none cursor-crosshair block"
          />
        </div>
      </div>

      <div className="pt-2 flex items-center gap-2">
        <span className="text-[11px] uppercase tracking-wider text-amber-200 shrink-0">
          Sérénité
        </span>
        <div className="flex-1 h-3 border border-white bg-black p-0.5">
          <div
            className="h-full transition-all duration-75"
            style={{
              width: `${percent}%`,
              backgroundColor: config.accentColor,
            }}
          />
        </div>
        <span className="text-[11px] tabular-nums w-9 text-right">
          {percent}%
        </span>
      </div>
    </div>
  );
};
