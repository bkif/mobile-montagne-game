import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CarnetSacModal } from './components/CarnetSacModal';
import { EndingScreen } from './components/EndingScreen';
import { PacifyArena } from './components/PacifyArena';
import { TouchControls } from './components/TouchControls';
import { UndertaleBox } from './components/UndertaleBox';
import { WorldCanvas } from './components/WorldCanvas';
import { ZONES } from './data/mountainWorld';
import {
  DIALOGUE_TREE,
  ITEMS,
  JOURNAL_NOTES,
  PACIFY_ENCOUNTERS,
  buildCampfireReflection,
  getCurrentObjective,
} from './data/narrativeScript';
import { audioSynth } from './engine/AudioSynth';
import {
  addInventoryItem,
  applyNarrativeEffects,
  clearSaveStorage,
  consumeInventoryItem,
  createFreshSave,
  loadSaveFromStorage,
  writeSaveToStorage,
} from './engine/SaveManager';
import {
  BellPulse,
  DustParticle,
  InteractTarget,
  WindState,
  createBellPulse,
  isEntityResolved,
  triggerDash,
} from './engine/WorldEngine';
import {
  CreatureId,
  DialogueChoice,
  DialogueNode,
  GameScreenMode,
  InventoryItemId,
  PlayerState,
  SaveDataV2,
} from './types/game';

export function App(): React.ReactElement {
  const [existingSave, setExistingSave] = useState<SaveDataV2 | null>(() =>
    loadSaveFromStorage()
  );
  const [save, setSave] = useState<SaveDataV2>(() => createFreshSave());
  const [mode, setMode] = useState<GameScreenMode>('title');
  const [activeNode, setActiveNode] = useState<DialogueNode | null>(null);
  const [activeEncounterId, setActiveEncounterId] = useState<CreatureId | null>(
    null
  );
  const [interactTarget, setInteractTarget] = useState<InteractTarget | null>(
    null
  );
  const [staminaUi, setStaminaUi] = useState<number>(100);
  const [windPhase, setWindPhase] = useState<WindState['phase']>('calm');
  const [isMuted, setIsMuted] = useState<boolean>(() => audioSynth.isMuted());
  const [toastMsg, setToastMsg] = useState<string>('');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(
    () =>
      typeof window !== 'undefined'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false
  );
  const [viewportHeight, setViewportHeight] = useState<number>(() =>
    typeof window !== 'undefined'
      ? window.visualViewport?.height ?? window.innerHeight
      : 800
  );

  const playerRef = useRef<PlayerState>({
    actId: save.actId,
    x: save.playerX,
    y: save.playerY,
    vx: 0,
    vy: 0,
    direction: save.direction,
    isMoving: false,
    animFrame: 0,
    animTimer: 0,
    footstepTimer: 0,
    stamina: save.stamina,
    staminaCooldown: 0,
    dashTimer: 0,
    dashDirX: 0,
    dashDirY: -1,
    calm: save.calm,
  });

  const inputVectorRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const bellPulsesRef = useRef<BellPulse[]>([]);
  const dustRef = useRef<DustParticle[]>([]);
  const keysPressedRef = useRef<Set<string>>(new Set());
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const updateHeight = () => {
      setViewportHeight(window.visualViewport?.height ?? window.innerHeight);
    };
    window.addEventListener('resize', updateHeight);
    window.visualViewport?.addEventListener('resize', updateHeight);

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    mq.addEventListener('change', onMotionChange);

    return () => {
      window.removeEventListener('resize', updateHeight);
      window.visualViewport?.removeEventListener('resize', updateHeight);
      mq.removeEventListener('change', onMotionChange);
    };
  }, []);

  useEffect(() => {
    const unlockOnce = () => {
      audioSynth.unlock();
      audioSynth.setAct(playerRef.current.actId);
    };
    window.addEventListener('pointerdown', unlockOnce, { once: true });
    window.addEventListener('keydown', unlockOnce, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlockOnce);
      window.removeEventListener('keydown', unlockOnce);
    };
  }, []);

  useEffect(() => {
    audioSynth.setAct(save.actId);
  }, [save.actId]);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMsg('');
    }, 2400);
  }, []);

  const syncPlayerFromSave = useCallback((s: SaveDataV2) => {
    playerRef.current = {
      actId: s.actId,
      x: s.playerX,
      y: s.playerY,
      vx: 0,
      vy: 0,
      direction: s.direction,
      isMoving: false,
      animFrame: 0,
      animTimer: 0,
      footstepTimer: 0,
      stamina: s.stamina,
      staminaCooldown: 0,
      dashTimer: 0,
      dashDirX: 0,
      dashDirY: -1,
      calm: s.calm,
    };
    setStaminaUi(Math.round(s.stamina));
  }, []);

  const startNewGame = useCallback(() => {
    audioSynth.unlock();
    audioSynth.playUiSelect();
    clearSaveStorage();
    const fresh = createFreshSave();
    setSave(fresh);
    setExistingSave(null);
    syncPlayerFromSave(fresh);
    setActiveNode({
      id: 'opening_narration',
      speaker: 'La Montagne',
      portrait: 'narrator',
      voice: 'narrator',
      text: "Un grondement glacé descend du Col Silencieux. Devant le Refuge du Bas, Maren vous attend près du feu.",
    });
    setMode('dialogue');
  }, [syncPlayerFromSave]);

  const continueGame = useCallback(() => {
    if (!existingSave) return;
    audioSynth.unlock();
    audioSynth.playUiSelect();
    setSave(existingSave);
    syncPlayerFromSave(existingSave);
    setMode('explore');
  }, [existingSave, syncPlayerFromSave]);

  const openDialogueNode = useCallback(
    (nodeId: string, currentSave: SaveDataV2) => {
      const node = DIALOGUE_TREE[nodeId];
      if (!node) {
        setActiveNode(null);
        setMode('explore');
        return;
      }

      const nextSave = applyNarrativeEffects(currentSave, {
        setFlag: node.setFlag,
        grantItem: node.grantItem,
        consumeItem: node.consumeItem,
        grantPacify: node.grantPacify,
      });

      if (nextSave !== currentSave) {
        setSave(nextSave);
      }
      setActiveNode(node);
      setMode('dialogue');
    },
    []
  );

  const handleBellPulse = useCallback(() => {
    audioSynth.unlock();
    const hasBell = save.inventory.some(
      (e) => e.id === 'cloche_felee' && e.quantity > 0
    );
    if (!hasBell) {
      audioSynth.playUiSelect();
      showToast('Parlez à Maren !');
      return;
    }
    audioSynth.playBellPulse();
    const pulse = createBellPulse(playerRef.current, save);
    bellPulsesRef.current.push(pulse);
    showToast(
      pulse.hintAngle !== null ? 'Écho détecté !' : 'Cloche résonante'
    );
  }, [save, showToast]);

  const handleDash = useCallback(() => {
    if (mode !== 'explore') return;
    audioSynth.unlock();
    const vec = inputVectorRef.current;
    const res = triggerDash(playerRef.current, vec.x, vec.y);
    if (res.dashed) {
      playerRef.current = res.player;
      setStaminaUi(Math.round(res.player.stamina));
      audioSynth.playDash();
    }
  }, [mode]);

  const handlePrimaryAction = useCallback(() => {
    if (mode !== 'explore') return;
    audioSynth.unlock();

    if (!interactTarget) {
      handleBellPulse();
      return;
    }

    const entity = interactTarget.entity;

    if (entity.kind === 'campfire') {
      audioSynth.playSaveChime();
      playerRef.current.calm = 100;
      playerRef.current.stamina = 100;
      setStaminaUi(100);

      const p = playerRef.current;
      const nextSave: SaveDataV2 = {
        ...save,
        actId: p.actId,
        playerX: p.x,
        playerY: p.y,
        direction: p.direction,
        calm: 100,
        stamina: 100,
        savedAt: Date.now(),
        saveCount: save.saveCount + 1,
      };
      writeSaveToStorage(nextSave);
      setSave(nextSave);
      setExistingSave(nextSave);
      showToast('Sauvé ✓');

      const refl = buildCampfireReflection(p.actId, nextSave);
      setActiveNode({
        id: `campfire_${entity.id}`,
        speaker: refl.speaker,
        portrait: 'narrator',
        voice: 'campfire',
        text: refl.text,
      });
      setMode('dialogue');
      return;
    }

    if (entity.kind === 'cairn') {
      audioSynth.playCairnRebuild();
      const nextCairns = save.rebuiltCairns.includes(entity.id)
        ? save.rebuiltCairns
        : [...save.rebuiltCairns, entity.id];
      const nextSave: SaveDataV2 = {
        ...save,
        rebuiltCairns: nextCairns,
      };
      setSave(nextSave);
      showToast(`Cairn ${nextCairns.length}/3`);
      setActiveNode({
        id: `cairn_rebuilt_${entity.id}`,
        speaker: entity.label,
        portrait: 'narrator',
        voice: 'narrator',
        text: `Vous relevez soigneusement les pierres du ${entity.label}. La brume alentour se dissipe et révèle un passage !`,
      });
      setMode('dialogue');
      return;
    }

    if (entity.kind === 'climb' && entity.climbTarget) {
      if (entity.requiredFlag && !save.storyFlags[entity.requiredFlag]) {
        audioSynth.playUiSelect();
        setActiveNode({
          id: `climb_blocked_${entity.id}`,
          speaker: 'Paroi rocheuse',
          portrait: 'narrator',
          voice: 'narrator',
          text: "L'air vibre trop fort plus haut pour partir sans équipement. Parlez d'abord à Maren devant le refuge.",
        });
        setMode('dialogue');
        return;
      }

      audioSynth.playClimb();
      const target = entity.climbTarget;
      const nextSave: SaveDataV2 = {
        ...save,
        actId: target.act,
        playerX: target.x,
        playerY: target.y,
        direction: target.direction,
      };
      setSave(nextSave);
      playerRef.current = {
        ...playerRef.current,
        actId: target.act,
        x: target.x,
        y: target.y,
        vx: 0,
        vy: 0,
        direction: target.direction,
        dashTimer: 0,
      };
      showToast(ZONES[target.act].shortName);
      return;
    }

    if (entity.kind === 'pickup') {
      audioSynth.playItemPickup();
      if (entity.noteId) {
        const note = JOURNAL_NOTES.find((n) => n.id === entity.noteId);
        const nextNotes = save.collectedNotes.includes(entity.noteId)
          ? save.collectedNotes
          : [...save.collectedNotes, entity.noteId];
        setSave({
          ...save,
          collectedNotes: nextNotes,
        });
        setActiveNode({
          id: `pickup_note_${entity.noteId}`,
          speaker: note ? note.title : 'Page de carnet',
          portrait: 'leo',
          voice: 'leo',
          text: note
            ? `${note.fullText}\n\n(Ajoutée au Carnet : ${nextNotes.length}/6)`
            : 'Page de carnet retrouvée.',
        });
        setMode('dialogue');
        return;
      }

      if (entity.itemId) {
        const item = ITEMS[entity.itemId];
        const nextSave: SaveDataV2 = {
          ...save,
          inventory: addInventoryItem(save.inventory, entity.itemId, 1),
          collectedPickups: save.collectedPickups.includes(entity.id)
            ? save.collectedPickups
            : [...save.collectedPickups, entity.id],
        };
        setSave(nextSave);
        setActiveNode({
          id: `pickup_item_${entity.id}`,
          speaker: 'Objet recueilli',
          portrait: 'narrator',
          voice: 'narrator',
          text: `Vous ajoutez à votre sac : ${item.name}.\n${item.description}`,
        });
        setMode('dialogue');
        return;
      }
    }

    // NPC / Examine / Creature / Monolith
    audioSynth.playUiSelect();
    const resolved = isEntityResolved(entity, save);
    const nodeId =
      resolved && entity.resolvedNodeId
        ? entity.resolvedNodeId
        : entity.rootNodeId;
    if (nodeId) {
      openDialogueNode(nodeId, save);
    }
  }, [handleBellPulse, interactTarget, mode, openDialogueNode, save, showToast]);

  // Desktop keyboard support
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
      } else if (
        (e.code === 'ShiftLeft' || e.code === 'ShiftRight') &&
        mode === 'explore'
      ) {
        handleDash();
      } else if (
        (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') &&
        mode === 'explore'
      ) {
        e.preventDefault();
        handlePrimaryAction();
      } else if (e.code === 'KeyC' && mode === 'explore') {
        handleBellPulse();
      } else if (
        (e.code === 'KeyI' || e.code === 'Tab') &&
        (mode === 'explore' || mode === 'carnet')
      ) {
        e.preventDefault();
        setMode(mode === 'explore' ? 'carnet' : 'explore');
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
  }, [handleBellPulse, handleDash, handlePrimaryAction, mode]);

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
      setActiveEncounterId(activeNode.startPacify);
      setActiveNode(null);
      setMode('pacify');
      return;
    }

    if (activeNode.nextNodeId) {
      openDialogueNode(activeNode.nextNodeId, save);
      return;
    }

    setActiveNode(null);
    setMode('explore');
  }, [activeNode, openDialogueNode, save]);

  const handleSelectChoice = useCallback(
    (choice: DialogueChoice) => {
      const nextSave = applyNarrativeEffects(save, {
        setFlag: choice.setFlag,
        grantItem: choice.grantItem,
        consumeItem: choice.consumeItem,
        grantPacify: choice.grantPacify,
      });
      if (nextSave !== save) {
        setSave(nextSave);
      }

      if (choice.triggerEnding) {
        setActiveNode(null);
        setMode('ending');
        return;
      }

      if (choice.startPacify) {
        setActiveEncounterId(choice.startPacify);
        setActiveNode(null);
        setMode('pacify');
        return;
      }

      if (choice.nextNodeId) {
        openDialogueNode(choice.nextNodeId, nextSave);
        return;
      }

      setActiveNode(null);
      setMode('explore');
    },
    [openDialogueNode, save]
  );

  const handlePacifyComplete = useCallback(() => {
    const encId = activeEncounterId;
    setActiveEncounterId(null);
    if (!encId) {
      setMode('explore');
      return;
    }
    const encounter = PACIFY_ENCOUNTERS[encId];
    openDialogueNode(encounter.successNodeId, save);
  }, [activeEncounterId, openDialogueNode, save]);

  const handleUseWorldItem = useCallback(
    (itemId: InventoryItemId) => {
      if (itemId === 'cloche_felee') {
        setMode('explore');
        handleBellPulse();
        return;
      }

      if (itemId === 'baies_eglantier') {
        audioSynth.playItemPickup();
        const nextCalm = Math.min(100, save.calm + 25);
        const nextStamina = Math.min(100, playerRef.current.stamina + 35);
        playerRef.current.calm = nextCalm;
        playerRef.current.stamina = nextStamina;
        setStaminaUi(Math.round(nextStamina));
        setSave({
          ...save,
          calm: nextCalm,
          stamina: nextStamina,
          inventory: consumeInventoryItem(save.inventory, itemId),
        });
        showToast('+25 Calme • +35 End.');
        return;
      }

      if (itemId === 'tisane_pin') {
        audioSynth.playSaveChime();
        const nextCalm = Math.min(100, save.calm + 35);
        playerRef.current.calm = nextCalm;
        setSave({
          ...save,
          calm: nextCalm,
          inventory: consumeInventoryItem(save.inventory, itemId),
        });
        showToast('+35 Calme');
      }
    },
    [handleBellPulse, save, showToast]
  );

  const currentZone = ZONES[save.actId];
  const currentObjective = getCurrentObjective(save);
  const activeEncounter = activeEncounterId
    ? PACIFY_ENCOUNTERS[activeEncounterId]
    : undefined;

  if (mode === 'title') {
    return (
      <main
        className="w-full max-w-[480px] mx-auto bg-[#0B1021] text-white flex flex-col justify-between p-4 safe-pad"
        style={{ height: `${viewportHeight}px` }}
      >
        <div className="flex justify-end">
          <button
            type="button"
            aria-label="Couper ou activer le son"
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
            <div className="text-[11px] uppercase tracking-[0.26em] text-amber-300 mb-1">
              4 Actes • Aventure Alpine
            </div>
            <h1 className="text-2xl font-bold tracking-wider uppercase text-white">
              L&apos;Écho du Col
            </h1>
          </div>
          <p className="text-xs leading-relaxed text-slate-200">
            Grimpez du Refuge du Bas jusqu&apos;au Col Silencieux pour retrouver
            Léo. Rebâtissez les cairns, recueillez les notes du carnet et
            apaisez la montagne au son de la Cloche fêlée.
          </p>

          <div className="w-full flex flex-col gap-2.5 pt-1">
            {existingSave && (
              <button
                type="button"
                onClick={continueGame}
                className="min-h-[48px] w-full border-2 border-amber-300 bg-amber-500/20 text-amber-200 font-bold text-xs uppercase tracking-widest active:bg-amber-300 active:text-black"
              >
                Continuer l&apos;ascension (Acte {existingSave.actId} •{' '}
                {ZONES[existingSave.actId].altitudeMeters} m)
              </button>
            )}
            <button
              type="button"
              onClick={startNewGame}
              className="min-h-[48px] w-full border-2 border-white bg-black text-white font-bold text-xs uppercase tracking-widest active:bg-white active:text-black"
            >
              Nouvelle ascension
            </button>
          </div>
        </div>

        <footer className="text-center text-[10px] text-slate-300 tracking-wider uppercase">
          PWA Tactile Portrait • Audio &amp; Pixel-Art Procéduraux
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
      className="w-full max-w-[480px] mx-auto bg-black text-white flex flex-col overflow-hidden safe-pad"
      style={{ height: `${viewportHeight}px` }}
    >
      {/* Top Compact HUD */}
      <header className="h-12 shrink-0 bg-black border-b-2 border-white px-2.5 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 bg-amber-400 shrink-0" />
            <span className="text-[11px] font-bold tracking-wide truncate tabular-nums">
              {currentZone.altitudeMeters.toLocaleString('fr-FR')} m —{' '}
              {currentZone.shortName}
            </span>
          </div>
          <div className="text-[10px] text-slate-300 truncate">
            {currentObjective.title}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {currentZone.hasWindGusts && windPhase !== 'calm' && (
            <span
              className={`px-1.5 py-0.5 border text-[10px] font-bold uppercase ${
                windPhase === 'gust'
                  ? 'border-sky-300 text-sky-200 bg-sky-500/20'
                  : 'border-amber-300 text-amber-200'
              }`}
            >
              {windPhase === 'gust' ? 'Rafale !' : 'Vent...'}
            </span>
          )}
          {toastMsg && (
            <span className="text-[10px] font-bold text-amber-300 tracking-wide">
              {toastMsg}
            </span>
          )}
          <button
            type="button"
            aria-label="Couper ou activer le son"
            onClick={() => {
              audioSynth.unlock();
              setIsMuted(audioSynth.toggleMute());
            }}
            className="min-w-[48px] min-h-[44px] px-2 flex items-center justify-center text-[11px] font-bold uppercase tracking-wider border-l border-slate-700 active:bg-white active:text-black"
          >
            {isMuted ? 'Muet' : 'Son'}
          </button>
        </div>
      </header>

      {/* Upper Viewport (~55% height) */}
      <section className="flex-[55] min-h-0 relative">
        <WorldCanvas
          playerRef={playerRef}
          save={save}
          inputVectorRef={inputVectorRef}
          bellPulsesRef={bellPulsesRef}
          dustRef={dustRef}
          isPaused={mode !== 'explore'}
          prefersReducedMotion={prefersReducedMotion}
          onInteractTargetChange={setInteractTarget}
          onStaminaChange={setStaminaUi}
          onWindPhaseChange={setWindPhase}
        />
      </section>

      {/* Lower Viewport (~45% height) */}
      <section className="flex-[45] min-h-0 p-2 bg-black">
        {mode === 'explore' && (
          <TouchControls
            onVectorChange={(vec) => {
              inputVectorRef.current = vec;
            }}
            onPrimaryAction={handlePrimaryAction}
            onDash={handleDash}
            onOpenCarnet={() => {
              audioSynth.playUiSelect();
              setMode('carnet');
            }}
            interactTarget={interactTarget}
            stamina={staminaUi}
            notesCount={save.collectedNotes.length}
            itemsCount={save.inventory.length}
          />
        )}

        {mode === 'dialogue' && activeNode && (
          <UndertaleBox
            node={activeNode}
            save={save}
            onAdvance={handleDialogueAdvance}
            onSelectChoice={handleSelectChoice}
          />
        )}

        {mode === 'pacify' && activeEncounter && (
          <PacifyArena
            config={activeEncounter}
            inventory={save.inventory}
            onConsumeItem={(itemId) => {
              setSave((prev) => ({
                ...prev,
                inventory: consumeInventoryItem(prev.inventory, itemId),
              }));
            }}
            onComplete={handlePacifyComplete}
            onCancel={() => {
              setActiveEncounterId(null);
              setMode('explore');
            }}
          />
        )}

        {mode === 'carnet' && (
          <CarnetSacModal
            save={save}
            onUseWorldItem={handleUseWorldItem}
            onClose={() => setMode('explore')}
          />
        )}
      </section>
    </main>
  );
}

export default App;
