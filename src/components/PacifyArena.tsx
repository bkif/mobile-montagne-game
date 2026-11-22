import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ITEMS } from '../data/narrativeScript';
import { audioSynth } from '../engine/AudioSynth';
import {
  ARENA_HEIGHT,
  ARENA_WIDTH,
  PacifyState,
  applyPacifyItem,
  createPacifyState,
  renderPacifyCanvas,
  setSoulTarget,
  setSouffleHolding,
  stepPacifyState,
  switchPacifyMode,
  triggerResonanceTap,
} from '../engine/PacifyMiniGameEngine';
import {
  InventoryEntry,
  InventoryItemId,
  PacifyActionType,
  PacifyEncounterConfig,
} from '../types/game';

interface PacifyArenaProps {
  config: PacifyEncounterConfig;
  inventory: InventoryEntry[];
  onConsumeItem: (itemId: InventoryItemId) => void;
  onComplete: () => void;
  onCancel: () => void;
}

const MODE_LABELS: Record<PacifyActionType, string> = {
  resonance: 'Résonance',
  souffle: 'Souffle',
  esquive: 'Esquive',
};

export const PacifyArena: React.FC<PacifyArenaProps> = ({
  config,
  inventory,
  onConsumeItem,
  onComplete,
  onCancel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<PacifyState>(createPacifyState(config));
  const [activeMode, setActiveMode] = useState<PacifyActionType>(
    config.defaultMode
  );
  const [showBag, setShowBag] = useState(false);
  const [percent, setPercent] = useState(0);
  const [statusMsg, setStatusMsg] = useState(config.introLine);
  const completedRef = useRef(false);

  useEffect(() => {
    const initial = createPacifyState(config);
    stateRef.current = initial;
    completedRef.current = false;
    setActiveMode(config.defaultMode);
    setShowBag(false);
    setPercent(0);
    setStatusMsg(config.introLine);
  }, [config]);

  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

      const st = stateRef.current;
      const events = stepPacifyState(st, dt);

      if (events.hit) audioSynth.playHitSoft();
      if (events.noteCollected) audioSynth.playNoteCollect();

      const pct = Math.min(
        100,
        Math.round((st.progress / st.config.targetCalm) * 100)
      );
      setPercent(pct);
      setStatusMsg(st.statusMessage);

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) renderPacifyCanvas(ctx, st);
      }

      if (events.completedNow && !completedRef.current) {
        completedRef.current = true;
        audioSynth.playPacifySuccess();
        window.setTimeout(onComplete, 380);
        return;
      }

      rafId = window.requestAnimationFrame(loop);
    };

    rafId = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(rafId);
  }, [onComplete]);

  const pacifyItems = useMemo(
    () =>
      inventory.filter(
        (entry) => entry.quantity > 0 && ITEMS[entry.id].usableInPacify
      ),
    [inventory]
  );

  const mapPointerToArena = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const arenaX = ((clientX - rect.left) / rect.width) * ARENA_WIDTH;
    const arenaY = ((clientY - rect.top) / rect.height) * ARENA_HEIGHT;
    setSoulTarget(stateRef.current, arenaX, arenaY);
  };

  const handleModeSwitch = (mode: PacifyActionType) => {
    audioSynth.playUiSelect();
    setShowBag(false);
    setActiveMode(mode);
    switchPacifyMode(stateRef.current, mode);
    setStatusMsg(stateRef.current.statusMessage);
  };

  const handleUseItem = (itemId: InventoryItemId) => {
    const res = applyPacifyItem(stateRef.current, itemId);
    if (res.consumed) {
      onConsumeItem(itemId);
    }
    audioSynth.playBellPulse();
    setShowBag(false);
    setStatusMsg(res.message);
    if (res.completedNow && !completedRef.current) {
      completedRef.current = true;
      audioSynth.playPacifySuccess();
      window.setTimeout(onComplete, 380);
    }
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const mode = stateRef.current.activeMode;

    if (mode === 'resonance') {
      const res = triggerResonanceTap(stateRef.current);
      if (res.quality === 'perfect') audioSynth.playBellPulse();
      else if (res.quality === 'good') audioSynth.playNoteCollect();
      else audioSynth.playUiSelect();
      setStatusMsg(stateRef.current.statusMessage);

      if (res.completedNow && !completedRef.current) {
        completedRef.current = true;
        audioSynth.playPacifySuccess();
        window.setTimeout(onComplete, 380);
      }
      return;
    }

    if (mode === 'souffle') {
      setSouffleHolding(stateRef.current, true);
      return;
    }

    mapPointerToArena(e.clientX, e.clientY);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (stateRef.current.activeMode !== 'esquive') return;
    if (e.buttons > 0 || e.pointerType === 'touch') {
      mapPointerToArena(e.clientX, e.clientY);
    }
  };

  const handleCanvasPointerUp = () => {
    if (stateRef.current.activeMode !== 'souffle') return;
    const res = setSouffleHolding(stateRef.current, false);
    if (res.quality === 'serene') audioSynth.playNoteCollect();
    else if (res.quality === 'partial') audioSynth.playUiSelect();
    setStatusMsg(stateRef.current.statusMessage);

    if (res.completedNow && !completedRef.current) {
      completedRef.current = true;
      audioSynth.playPacifySuccess();
      window.setTimeout(onComplete, 380);
    }
  };

  return (
    <div className="ut-frame w-full h-full flex flex-col justify-between p-2 bg-black text-white overflow-hidden">
      {/* Header & Progress */}
      <div className="flex items-center justify-between gap-2 pb-1">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 truncate">
              {config.name}
            </span>
            <span className="text-[11px] tabular-nums text-amber-200 font-bold">
              {percent}%
            </span>
          </div>
          <div className="w-full h-2 border border-white bg-black mt-0.5">
            <div
              className="h-full transition-all duration-75"
              style={{
                width: `${percent}%`,
                backgroundColor: config.accentColor,
              }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            audioSynth.playUiSelect();
            onCancel();
          }}
          className="min-w-[44px] min-h-[44px] px-2 border-2 border-white text-[10px] font-bold uppercase shrink-0 active:bg-white active:text-black"
        >
          Fuir
        </button>
      </div>

      {/* Arena or Offrande Drawer */}
      <div className="flex-1 min-h-0 flex items-center justify-center py-0.5">
        {showBag ? (
          <div className="w-full h-full border-2 border-white bg-[#050814] p-2 overflow-y-auto space-y-1.5">
            <div className="text-[11px] uppercase tracking-wider text-amber-300 font-bold">
              Offrandes &amp; Objets
            </div>
            {pacifyItems.length === 0 ? (
              <div className="text-xs text-slate-300 py-3 text-center">
                Aucun objet utilisable pour le moment.
              </div>
            ) : (
              pacifyItems.map((entry) => {
                const item = ITEMS[entry.id];
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => handleUseItem(entry.id)}
                    className="min-h-[44px] w-full px-2.5 py-1.5 border border-white bg-black text-left text-xs flex items-center justify-between active:bg-white active:text-black"
                  >
                    <span className="font-bold text-amber-200">
                      ★ {item.name}
                    </span>
                    <span className="text-[10px] text-slate-300 tabular-nums">
                      x{entry.quantity}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        ) : (
          <div className="relative h-full max-h-[132px] aspect-[240/132] border-2 border-white bg-black">
            <canvas
              ref={canvasRef}
              width={ARENA_WIDTH}
              height={ARENA_HEIGHT}
              onPointerDown={handleCanvasPointerDown}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={handleCanvasPointerUp}
              onPointerCancel={handleCanvasPointerUp}
              className="pixelated w-full h-full touch-none cursor-pointer block"
            />
          </div>
        )}
      </div>

      {/* Status + 3 Tactical Mode Buttons + Offrande */}
      <div className="pt-1 space-y-1">
        <div className="text-[10px] text-slate-200 truncate text-center">
          {statusMsg}
        </div>
        <div className="grid grid-cols-4 gap-1">
          {config.availableModes.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => handleModeSwitch(mode)}
              className={`min-h-[44px] px-1 border-2 text-[10px] font-bold uppercase tracking-tight transition-colors ${
                !showBag && activeMode === mode
                  ? 'border-amber-300 bg-amber-400/20 text-amber-200'
                  : 'border-white bg-black text-white active:bg-white active:text-black'
              }`}
            >
              {MODE_LABELS[mode]}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              audioSynth.playUiSelect();
              setShowBag((v) => !v);
            }}
            className={`min-h-[44px] px-1 border-2 text-[10px] font-bold uppercase tracking-tight ${
              showBag
                ? 'border-amber-300 bg-amber-400/20 text-amber-200'
                : 'border-white bg-black text-white active:bg-white active:text-black'
            }`}
          >
            Offrande
          </button>
        </div>
      </div>
    </div>
  );
};
