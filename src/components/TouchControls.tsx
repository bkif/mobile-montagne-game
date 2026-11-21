import React, { useRef, useState } from 'react';
import { InteractTarget } from '../engine/WorldEngine';

interface TouchControlsProps {
  onVectorChange: (vec: { x: number; y: number }) => void;
  onInteract: () => void;
  onOpenBag: () => void;
  interactTarget: InteractTarget | null;
  inventoryCount: number;
  befriendedCount: number;
}

const MAX_STICK_RADIUS = 36;

export const TouchControls: React.FC<TouchControlsProps> = ({
  onVectorChange,
  onInteract,
  onOpenBag,
  interactTarget,
  inventoryCount,
  befriendedCount,
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
    const lx = Math.max(44, Math.min(rect.width - 44, e.clientX - rect.left));
    const ly = Math.max(44, Math.min(rect.height - 44, e.clientY - rect.top));

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

      const normX = dist > 4 ? (Math.cos(angle) * clampedDist) / MAX_STICK_RADIUS : 0;
      const normY = dist > 4 ? (Math.sin(angle) * clampedDist) / MAX_STICK_RADIUS : 0;
      onVectorChange({ x: normX, y: normY });

      return {
        ...prev,
        knobX: kx,
        knobY: ky,
      };
    });
  };

  const handlePadPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerRef.current !== e.pointerId) return;
    activePointerRef.current = null;
    setStickState((prev) => ({ ...prev, active: false }));
    onVectorChange({ x: 0, y: 0 });
  };

  const interactLabel = interactTarget
    ? interactTarget.kind === 'npc'
      ? interactTarget.npc.name
      : interactTarget.object.type === 'campfire'
      ? 'Feu de camp'
      : interactTarget.object.type === 'item'
      ? 'Ramasser'
      : 'Lire'
    : 'Explorer...';

  return (
    <div className="ut-frame w-full h-full flex items-stretch justify-between p-3 gap-3 bg-black">
      {/* Left: Floating Virtual Thumbstick Zone */}
      <div
        ref={padRef}
        onPointerDown={handlePadPointerDown}
        onPointerMove={handlePadPointerMove}
        onPointerUp={handlePadPointerEnd}
        onPointerCancel={handlePadPointerEnd}
        className="relative flex-1 border-2 border-slate-700 bg-[#050814] flex items-center justify-center touch-none overflow-hidden"
      >
        {!stickState.active && (
          <div className="pointer-events-none flex flex-col items-center gap-1.5 opacity-80">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-500 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-800" />
            </div>
            <span className="text-[10px] uppercase tracking-widest text-slate-400">
              Glisser ici
            </span>
          </div>
        )}

        {stickState.active && (
          <>
            <div
              className="pointer-events-none absolute w-20 h-20 -ml-10 -mt-10 rounded-full border-2 border-white/70 bg-white/5"
              style={{
                left: `${stickState.originX}px`,
                top: `${stickState.originY}px`,
              }}
            />
            <div
              className="pointer-events-none absolute w-10 h-10 -ml-5 -mt-5 rounded-full border-2 border-amber-300 bg-amber-400/30"
              style={{
                left: `${stickState.knobX}px`,
                top: `${stickState.knobY}px`,
              }}
            />
          </>
        )}
      </div>

      {/* Right: Action Buttons & Status */}
      <div className="w-[140px] shrink-0 flex flex-col justify-between gap-2">
        <div className="text-[10px] uppercase tracking-wider text-slate-300 border border-slate-700 px-2 py-1 flex items-center justify-between">
          <span>Amis</span>
          <span className="text-amber-300 font-bold tabular-nums">
            {befriendedCount} / 4
          </span>
        </div>

        <button
          type="button"
          onClick={onInteract}
          className={`min-h-[54px] w-full px-2 py-1.5 border-2 flex flex-col items-center justify-center transition-colors active:bg-white active:text-black ${
            interactTarget
              ? 'border-amber-300 bg-amber-500/15 text-amber-200 animate-pulse-glow'
              : 'border-white bg-black text-white'
          }`}
        >
          <span className="text-xs font-bold uppercase tracking-widest">
            INTERAGIR
          </span>
          <span className="text-[10px] truncate max-w-full opacity-90">
            {interactLabel}
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenBag}
          className="min-h-[48px] w-full px-2 py-1.5 border-2 border-white bg-black text-white flex items-center justify-between text-xs font-bold uppercase tracking-widest active:bg-white active:text-black"
        >
          <span>SAC</span>
          <span className="px-1.5 py-0.5 border border-white text-[11px] tabular-nums">
            {inventoryCount}
          </span>
        </button>
      </div>
    </div>
  );
};
