import React, { useCallback, useEffect, useRef, useState } from 'react';
import { EndingScreen } from './components/EndingScreen';
import { PacifyArena } from './components/PacifyArena';
import { TouchControls } from './components/TouchControls';
import { UndertaleBox } from './components/UndertaleBox';
import { WorldCanvas } from './components/WorldCanvas';
import { NPCS, ZONES } from './data/mountainWorld';
import {
  DIALOGUE_TREE,
  ITEMS,
  buildCampfireDialogue,
} from './data/narrativeScript';
import { audioSynth } from './engine/AudioSynth';
import {
  applyDialogueEffects,
  clearSaveStorage,
  createFreshSave,
  loadSaveFromStorage,
  writeSaveToStorage,
} from './engine/SaveManager';
import { InteractTarget, isNpcResolved } from './engine/WorldEngine';
import {
  DialogueChoice,
  DialogueNode,
  GameScreenMode,
  NpcId,
  PlayerState,
  SaveData,
  ZoneTransition,
} from './types/game';

export function App(): React.ReactElement {
  const [existingSave, setExistingSave] = useState<SaveData | null>(() =>
    loadSaveFromStorage()
  );
  const [save, setSave] = useState<SaveData>(() => createFreshSave());
  const [mode, setMode] = useState<GameScreenMode>('title');
  const [activeNode, setActiveNode] = useState<DialogueNode | null>(null);
  const [activePacifyNpc, setActivePacifyNpc] = useState<NpcId | null>(null);
  const [interactTarget, setInteractTarget] = useState<InteractTarget | null>(
    null
  );
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<string>('');
  const [viewportHeight, setViewportHeight] = useState<number>(() =>
    typeof window !== 'undefined'
      ? window.visualViewport?.height ?? window.innerHeight
      : 800
  );

  const playerRef = useRef<PlayerState>({
    zoneId: save.zoneId,
    x: save.x,
    y: save.y,
    direction: save.direction,
    isMoving: false,
    animFrame: 0,
    animTimer: 0,
  });

  const inputVectorRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const keysPressedRef = useRef<Set<string>>(new Set());
  const toastTimerRef = useRef<number | null>(null);

  // Keep viewport height aligned on mobile browser bar show/hide
  useEffect(() => {
    const updateHeight = () => {
      const h = window.visualViewport?.height ?? window.innerHeight;
      setViewportHeight(h);
    };
    window.addEventListener('resize', updateHeight);
    window.visualViewport?.addEventListener('resize', updateHeight);
    return () => {
      window.removeEventListener('resize', updateHeight);
      window.visualViewport?.removeEventListener('resize', updateHeight);
    };
  }, []);

  // Unlock Web Audio on first pointer interaction
  useEffect(() => {
    const handleFirstPointer = () => {
      audioSynth.unlock();
      audioSynth.setZone(playerRef.current.zoneId);
    };
    window.addEventListener('pointerdown', handleFirstPointer, { once: true });
    return () => {
      window.removeEventListener('pointerdown', handleFirstPointer);
    };
  }, []);

  // Sync ambient zone music with current zone
  useEffect(() => {
    audioSynth.setZone(save.zoneId);
  }, [save.zoneId]);

  const showSaveToast = useCallback((label: string) => {
    setSaveToast(label);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setSaveToast('');
    }, 2400);
  }, []);

  const startNewGame = useCallback(() => {
    audioSynth.unlock();
    audioSynth.playUiSelect();
    clearSaveStorage();
    const fresh = createFreshSave();
    setSave(fresh);
    setExistingSave(null);
    playerRef.current = {
      zoneId: fresh.zoneId,
      x: fresh.x,
      y: fresh.y,
      direction: fresh.direction,
      isMoving: false,
      animFrame: 0,
      animTimer: 0,
    };
    setActiveNode({
      id: 'intro_narrator',
      speaker: 'La Montagne',
      portrait: 'narrator',
      voice: 'narrator',
      text: "La nuit tombe sur le sentier. Allumez votre courage : au bout de l'ascension, la Lanterne du Col attend quelqu'un capable d'écouter.",
    });
    setMode('dialogue');
  }, []);

  const continueGame = useCallback(() => {
    if (!existingSave) return;
    audioSynth.unlock();
    audioSynth.playUiSelect();
    setSave(existingSave);
    playerRef.current = {
      zoneId: existingSave.zoneId,
      x: existingSave.x,
      y: existingSave.y,
      direction: existingSave.direction,
      isMoving: false,
      animFrame: 0,
      animTimer: 0,
    };
    setMode('explore');
  }, [existingSave]);

  const openNode = useCallback((nodeId: string, currentSave: SaveData) => {
    const node = DIALOGUE_TREE[nodeId];
    if (!node) {
      setActiveNode(null);
      setMode('explore');
      return;
    }

    const updatedSave = applyDialogueEffects(currentSave, {
      setFlag: node.setFlag,
      grantBefriend: node.grantBefriend,
    });
    if (updatedSave !== currentSave) {
      setSave(updatedSave);
    }

    setActiveNode(node);
    setMode('dialogue');
  }, []);

  const handleInteract = useCallback(() => {
    if (mode !== 'explore') return;
    audioSynth.unlock();

    if (!interactTarget) {
      audioSynth.playUiSelect();
      setActiveNode({
        id: 'empty_inspect',
        speaker: 'Pensée',
        portrait: 'narrator',
        voice: 'narrator',
        text: 'Le vent chante dans la poudreuse. Rien de particulier juste devant vos pas.',
      });
      setMode('dialogue');
      return;
    }

    if (interactTarget.kind === 'npc') {
      const npc = interactTarget.npc;
      audioSynth.playUiSelect();
      if (save.befriendedIds.includes(npc.id)) {
        openNode(npc.befriendedNodeId, save);
      } else if (isNpcResolved(npc.id, save)) {
        openNode(npc.bypassedNodeId, save);
      } else {
        openNode(npc.rootNodeId, save);
      }
      return;
    }

    const obj = interactTarget.object;
    if (obj.type === 'sign' && obj.signNodeId) {
      audioSynth.playUiSelect();
      openNode(obj.signNodeId, save);
      return;
    }

    if (obj.type === 'item' && obj.itemId) {
      audioSynth.playItemPickup();
      const item = ITEMS[obj.itemId];
      const nextSave: SaveData = {
        ...save,
        inventory: save.inventory.includes(obj.itemId)
          ? save.inventory
          : [...save.inventory, obj.itemId],
        collectedItems: save.collectedItems.includes(obj.id)
          ? save.collectedItems
          : [...save.collectedItems, obj.id],
      };
      setSave(nextSave);
      setActiveNode({
        id: `pickup_${obj.id}`,
        speaker: 'Trouvaille dans la neige',
        portrait: 'narrator',
        voice: 'narrator',
        text: `Vous ramassez : ${item.name} !\n${item.description}`,
      });
      setMode('dialogue');
      return;
    }

    if (obj.type === 'campfire') {
      audioSynth.playSaveChime();
      const p = playerRef.current;
      const nextSave: SaveData = {
        ...save,
        zoneId: p.zoneId,
        x: p.x,
        y: p.y,
        direction: p.direction,
        savedAt: Date.now(),
        saveCount: save.saveCount + 1,
      };
      writeSaveToStorage(nextSave);
      setSave(nextSave);
      setExistingSave(nextSave);
      showSaveToast('Sauvé ✓');

      const reflection = buildCampfireDialogue(p.zoneId, nextSave);
      setActiveNode({
        id: `campfire_${obj.id}`,
        speaker: reflection.speaker,
        portrait: 'narrator',
        voice: 'campfire',
        text: reflection.text,
      });
      setMode('dialogue');
    }
  }, [interactTarget, mode, openNode, save, showSaveToast]);

  // Keyboard support for desktop testing
  useEffect(() => {
    const syncKeyboardVector = () => {
      const keys = keysPressedRef.current;
      let x = 0;
      let y = 0;
      if (keys.has('ArrowLeft') || keys.has('KeyA') || keys.has('KeyQ')) x -= 1;
      if (keys.has('ArrowRight') || keys.has('KeyD')) x += 1;
      if (keys.has('ArrowUp') || keys.has('KeyW') || keys.has('KeyZ')) y -= 1;
      if (keys.has('ArrowDown') || keys.has('KeyS')) y += 1;
      inputVectorRef.current = { x, y };
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'ArrowUp' ||
        e.code === 'ArrowDown' ||
        e.code === 'ArrowLeft' ||
        e.code === 'ArrowRight' ||
        e.code === 'KeyW' ||
        e.code === 'KeyA' ||
        e.code === 'KeyS' ||
        e.code === 'KeyD' ||
        e.code === 'KeyZ' ||
        e.code === 'KeyQ'
      ) {
        keysPressedRef.current.add(e.code);
        syncKeyboardVector();
      } else if ((e.code === 'Enter' || e.code === 'Space') && mode === 'explore') {
        e.preventDefault();
        handleInteract();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current.delete(e.code);
      syncKeyboardVector();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [handleInteract, mode]);

  const handleZoneTransition = useCallback((transition: ZoneTransition) => {
    playerRef.current = {
      zoneId: transition.targetZone,
      x: transition.targetX,
      y: transition.targetY,
      direction: transition.targetDirection,
      isMoving: false,
      animFrame: 0,
      animTimer: 0,
    };
    setSave((prev) => ({
      ...prev,
      zoneId: transition.targetZone,
      x: transition.targetX,
      y: transition.targetY,
      direction: transition.targetDirection,
    }));
  }, []);

  const handleDialogueAdvance = useCallback(() => {
    if (!activeNode) {
      setMode('explore');
      return;
    }

    if (activeNode.triggerEnding) {
      setActiveNode(null);
      setMode('ending');
      return;
    }

    if (activeNode.startPacify) {
      setActivePacifyNpc(activeNode.startPacify);
      setActiveNode(null);
      setMode('pacify');
      return;
    }

    if (activeNode.nextNodeId) {
      openNode(activeNode.nextNodeId, save);
      return;
    }

    setActiveNode(null);
    setMode('explore');
  }, [activeNode, openNode, save]);

  const handleSelectChoice = useCallback(
    (choice: DialogueChoice) => {
      const updatedSave = applyDialogueEffects(save, {
        setFlag: choice.setFlag,
        grantBefriend: choice.grantBefriend,
        consumeItem: choice.consumeItem ? choice.requiredItem : undefined,
      });

      if (updatedSave !== save) {
        setSave(updatedSave);
      }

      if (choice.triggerEnding) {
        setActiveNode(null);
        setMode('ending');
        return;
      }

      if (choice.startPacify) {
        setActivePacifyNpc(choice.startPacify);
        setActiveNode(null);
        setMode('pacify');
        return;
      }

      if (choice.nextNodeId) {
        openNode(choice.nextNodeId, updatedSave);
        return;
      }

      setActiveNode(null);
      setMode('explore');
    },
    [openNode, save]
  );

  const handlePacifyComplete = useCallback(() => {
    const npc = NPCS.find((n) => n.id === activePacifyNpc);
    setActivePacifyNpc(null);
    if (!npc) {
      setMode('explore');
      return;
    }
    openNode(npc.pacifyConfig.successNodeId, save);
  }, [activePacifyNpc, openNode, save]);

  const handlePacifyCancel = useCallback(() => {
    setActivePacifyNpc(null);
    setMode('explore');
  }, []);

  const currentZone = ZONES[save.zoneId];
  const pacifyEntity = activePacifyNpc
    ? NPCS.find((n) => n.id === activePacifyNpc)
    : undefined;

  if (mode === 'title') {
    return (
      <main
        className="w-full max-w-[480px] mx-auto bg-[#0B1021] text-white flex flex-col justify-between p-5"
        style={{ height: `${viewportHeight}px` }}
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              audioSynth.unlock();
              setIsMuted(audioSynth.toggleMute());
            }}
            className="min-w-[48px] min-h-[48px] px-3 border-2 border-white bg-black text-xs font-bold uppercase tracking-wider active:bg-white active:text-black"
          >
            {isMuted ? 'Son : Off' : 'Son : On'}
          </button>
        </div>

        <div className="ut-frame p-5 flex flex-col items-center text-center gap-4 my-auto">
          <div className="w-12 h-12 border-2 border-amber-300 bg-black flex items-center justify-center">
            <div className="w-4 h-6 bg-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.9)]" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-amber-300 mb-1">
              Récit Alpin Pacifiste
            </div>
            <h1 className="text-2xl font-bold tracking-wider uppercase text-white">
              L&apos;Écho du Col
            </h1>
          </div>
          <p className="text-xs leading-relaxed text-slate-300">
            Grimpez des sapins givrés jusqu&apos;au refuge des cimes. Écoutez
            les voyageurs égarés, apaisez leurs vertiges avec votre petite
            flamme et réveillez la Lanterne du Col.
          </p>

          <div className="w-full flex flex-col gap-2.5 pt-1">
            {existingSave && (
              <button
                type="button"
                onClick={continueGame}
                className="min-h-[48px] w-full border-2 border-amber-300 bg-amber-500/15 text-amber-200 font-bold text-xs uppercase tracking-widest active:bg-amber-300 active:text-black"
              >
                Continuer ({ZONES[existingSave.zoneId].altitudeMeters} m)
              </button>
            )}
            <button
              type="button"
              onClick={startNewGame}
              className="min-h-[48px] w-full border-2 border-white bg-black text-white font-bold text-xs uppercase tracking-widest active:bg-white active:text-black"
            >
              Nouvelle Ascension
            </button>
          </div>
        </div>

        <footer className="text-center text-[10px] text-slate-400 tracking-wider uppercase">
          Conçu pour écran tactile portrait • 100% Hors-ligne
        </footer>
      </main>
    );
  }

  if (mode === 'ending') {
    return (
      <main
        className="w-full max-w-[480px] mx-auto bg-[#0B1021] text-white"
        style={{ height: `${viewportHeight}px` }}
      >
        <EndingScreen save={save} onReplay={startNewGame} />
      </main>
    );
  }

  return (
    <main
      className="w-full max-w-[480px] mx-auto bg-black text-white flex flex-col overflow-hidden"
      style={{ height: `${viewportHeight}px` }}
    >
      {/* Top Minimal HUD Header */}
      <header className="h-12 shrink-0 bg-black border-b-2 border-white px-3 flex items-center justify-between gap-2">
        <div className="min-w-0 flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-amber-400 shrink-0" />
          <span className="text-xs font-bold tracking-wide truncate tabular-nums">
            {currentZone.altitudeMeters.toLocaleString('fr-FR')} m —{' '}
            {currentZone.shortName}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {saveToast && (
            <span className="text-[11px] font-bold text-amber-300 tracking-wider">
              {saveToast}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              audioSynth.unlock();
              setIsMuted(audioSynth.toggleMute());
            }}
            aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
            className="min-w-[48px] min-h-[48px] px-2 flex items-center justify-center text-[11px] font-bold uppercase tracking-wider border-l border-slate-700 active:bg-white active:text-black"
          >
            {isMuted ? 'Muet' : 'Son'}
          </button>
        </div>
      </header>

      {/* Upper Viewport (~56% height) */}
      <section className="flex-[56] min-h-0 relative">
        <WorldCanvas
          playerRef={playerRef}
          save={save}
          inputVectorRef={inputVectorRef}
          isPaused={mode !== 'explore'}
          onZoneTransition={handleZoneTransition}
          onInteractTargetChange={setInteractTarget}
        />
      </section>

      {/* Lower Viewport (~44% height) */}
      <section className="flex-[44] min-h-0 p-2 bg-black">
        {mode === 'explore' && (
          <TouchControls
            onVectorChange={(vec) => {
              inputVectorRef.current = vec;
            }}
            onInteract={handleInteract}
            onOpenBag={() => {
              audioSynth.playUiSelect();
              setMode('inventory');
            }}
            interactTarget={interactTarget}
            inventoryCount={save.inventory.length}
            befriendedCount={save.befriendedIds.length}
          />
        )}

        {mode === 'dialogue' && activeNode && (
          <UndertaleBox
            node={activeNode}
            inventory={save.inventory}
            onAdvance={handleDialogueAdvance}
            onSelectChoice={handleSelectChoice}
          />
        )}

        {mode === 'pacify' && pacifyEntity && (
          <PacifyArena
            config={pacifyEntity.pacifyConfig}
            onComplete={handlePacifyComplete}
            onCancel={handlePacifyCancel}
          />
        )}

        {mode === 'inventory' && (
          <div className="ut-frame w-full h-full flex flex-col justify-between p-3 bg-black text-white">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-300">
                * Sac de Randonnée
              </span>
              <span className="text-[11px] text-slate-400 tabular-nums">
                {save.inventory.length} objet(s)
              </span>
            </div>

            <div className="flex-1 overflow-y-auto py-2 space-y-2">
              {save.inventory.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">
                  Votre sac est encore léger. Cherchez les éclats dorés dans la
                  neige !
                </p>
              ) : (
                save.inventory.map((itemId) => {
                  const item = ITEMS[itemId];
                  return (
                    <div
                      key={itemId}
                      className="border border-slate-600 p-2 bg-[#050814]"
                    >
                      <div className="text-xs font-bold text-amber-200">
                        ★ {item.name}
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                        {item.description}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                audioSynth.playUiSelect();
                setMode('explore');
              }}
              className="min-h-[48px] w-full border-2 border-white bg-black text-white text-xs font-bold uppercase tracking-widest active:bg-white active:text-black"
            >
              Fermer le sac
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
