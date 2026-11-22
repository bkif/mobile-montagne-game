import React, { useRef, useState } from 'react';
import { InteractTarget } from '../engine/WorldEngine';

interface TouchControlsProps {
  onVectorChange: (vec: { x: number; y: number }) => void;
  onPrimaryAction: () => void;
  onDash: () => void;
  onOpenCarnet: () => void;
  interactTarget: InteractTarget | null;
  stamina: number;
  notesCount: number;
  itemsCount: number;
}

const MAX_STICK_RADIUS = 38;
const DEADZONE_PX = 10;

export const TouchControls: React.FC<TouchControlsProps> = ({
  onVectorChange,
  onPrimaryAction,
  onDash,
  onOpenCarnet,
  interactTarget,
  stamina,
  notesCount,
  itemsCount,
}) => {
  const padRef = useRef<HTMLDivElement | null>(null);
  const activePointerRef = useRef<number | null>(null);
  const [stickState, setStickState] = useState<{
    active: boolean;
    originX: number;
    originY: number;
    knobX: number;
    knobY: number;
  }>({
    active: false,
    originX: 0,
    originY: 0,
    knobX: 0,
    knobY: 0,
  });

  const handlePadPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerRef.current !== null) return;
    const pad = padRef.current;
    if (!pad) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    activePointerRef.current = e.pointerId;

    const rect = pad.getBoundingClientRect();
    const lx = Math.max(42, Math.min(rect.width - 42, e.clientX - rect.left));
    const ly = Math.max(42, Math.min(rect.height - 42, e.clientY - rect.top));

    setStickState({
      active: true,
      originX: lx,
      originY: ly,
      knobX: lx,
      knobY: ly,
    });
    onVectorChange({ x: 0, y: 0 });
  };

  const handlePadPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerRef.current !== e.pointerId) return;
    const pad = padRef.current;
    if (!pad) return;
    const rect = pad.getBoundingClientRect();
    const curX = e.clientX - rect.left;
    const curY = e.clientY - rect.top;

    setStickState((prev) => {
      const dx = curX - prev.originX;
      const dy = curY - prev.originY;
      const dist = Math.hypot(dx, dy);
      const clampedDist = Math.min(MAX_STICK_RADIUS, dist);
      const angle = Math.atan2(dy, dx);
      const kx = prev.originX + Math.cos(angle) * clampedDist;
      const ky = prev.originY + Math.sin(angle) * clampedDist;

      if (dist <= DEADZONE_PX) {
        onVectorChange({ x: 0, y: 0 });
      } else {
        const effectiveRatio =
          (clampedDist - DEADZONE_PX) / (MAX_STICK_RADIUS - DEADZONE_PX);
        onVectorChange({
          x: Math.cos(angle) * effectiveRatio,
          y: Math.sin(angle) * effectiveRatio,
        });
      }

      return { ...prev, knobX: kx, knobY: ky };
    });
  };

  const handlePadPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerRef.current !== e.pointerId) return;
    activePointerRef.current = null;
    setStickState((prev) => ({ ...prev, active: false }));
    onVectorChange({ x: 0, y: 0 });
  };

  const primaryVerb = interactTarget ? interactTarget.verb : 'Cloche';
  const primarySub = interactTarget ? interactTarget.label : 'Chercher écho';
  const dashReady = stamina >= 35;

  return (
    <div className="ut-frame w-full h-full flex items-stretch justify-between p-2.5 gap-2.5 bg-black">
      {/* Left: Floating Virtual Thumbstick Zone (10px deadzone) */}
      <div
        ref={padRef}
        onPointerDown={handlePadPointerDown}
        onPointerMove={handlePadPointerMove}
        onPointerUp={handlePadPointerEnd}
        onPointerCancel={handlePadPointerEnd}
        className="relative flex-1 border-2 border-slate-600 bg-[#050814] flex items-center justify-center touch-none overflow-hidden"
      >
        {!stickState.active && (
          <div className="pointer-events-none flex flex-col items-center gap-1 opacity-85">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-500 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-800" />
            </div>
            <span className="text-[10px] uppercase tracking-widest text-slate-300">
              Déplacer
            </span>
          </div>
        )}

        {stickState.active && (
          <>
            <div
              className="pointer-events-none absolute w-20 h-20 -ml-10 -mt-10 rounded-full border-2 border-white/75 bg-white/5"
              style={{
                left: `${stickState.originX}px`,
                top: `${stickState.originY}px`,
              }}
            />
            <div
              className="pointer-events-none absolute w-10 h-10 -ml-5 -mt-5 rounded-full border-2 border-amber-300 bg-amber-400/35"
              style={{
                left: `${stickState.knobX}px`,
                top: `${stickState.knobY}px`,
              }}
            />
          </>
        )}
      </div>

      {/* Right: Contextual Primary Action, Dash with Stamina Bar, Carnet/Sac */}
      <div className="w-[152px] shrink-0 flex flex-col justify-between gap-1.5">
        <button
          type="button"
          onClick={onPrimaryAction}
          className={`min-h-[52px] w-full px-2 py-1 border-2 flex flex-col items-center justify-center transition-colors active:bg-white active:text-black ${
            interactTarget
              ? 'border-amber-300 bg-amber-500/20 text-amber-200 animate-pulse-glow'
              : 'border-white bg-black text-white'
          }`}
        >
          <span className="text-xs font-bold uppercase tracking-wider leading-tight">
            {primaryVerb}
          </span>
          <span className="text-[10px] truncate max-w-full text-slate-200">
            {primarySub}
          </span>
        </button>

        <button
          type="button"
          onClick={onDash}
          disabled={!dashReady}
          className={`min-h-[46px] w-full px-2 py-1 border-2 flex flex-col justify-center gap-1 transition-colors ${
            dashReady
              ? 'border-sky-300 bg-sky-500/15 text-sky-100 active:bg-white active:text-black'
              : 'border-slate-700 bg-black text-slate-500'
          }`}
        >
          <div className="w-full flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
            <span>Esquive</span>
            <span className="tabular-nums text-[10px]">{stamina}%</span>
          </div>
          <div className="w-full h-1.5 border border-slate-500 bg-black">
            <div
              className="h-full transition-all duration-75"
              style={{
                width: `${stamina}%`,
                backgroundColor: dashReady ? '#38BDF8' : '#64748B',
              }}
            />
          </div>
        </button>

        <button
          type="button"
          onClick={onOpenCarnet}
          className="min-h-[44px] w-full px-2 py-1 border-2 border-white bg-black text-white flex items-center justify-between text-[11px] font-bold uppercase tracking-wider active:bg-white active:text-black"
        >
          <span>Carnet &amp; Sac</span>
          <span className="text-amber-300 tabular-nums text-[10px]">
            {notesCount}/6 • {itemsCount}
          </span>
        </button>
      </div>
    </div>
  );
};
