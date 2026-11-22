import React, { useEffect, useRef } from 'react';
import { computeEndingId } from '../data/narrativeScript';
import { audioSynth } from '../engine/AudioSynth';
import { getSpriteBank } from '../engine/PixelSprites';
import { EndingId, PortraitId, SaveDataV2 } from '../types/game';

interface EndingScreenProps {
  save: SaveDataV2;
  onReplay: () => void;
}

const PortraitBadge: React.FC<{ portrait: PortraitId; label: string }> = ({
  portrait,
  label,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 32, 32);
    const sprite = getSpriteBank().portraits[portrait];
    if (sprite) ctx.drawImage(sprite, 0, 0);
  }, [portrait]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-12 h-12 border-2 border-white bg-black flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={32}
          height={32}
          className="pixelated w-10 h-10"
        />
      </div>
      <span className="text-[10px] text-amber-200 tracking-wide text-center">
        {label}
      </span>
    </div>
  );
};

const ENDING_COPY: Record<
  EndingId,
  {
    code: string;
    title: string;
    p1: string;
    p2: string;
  }
> = {
  harmony: {
    code: 'Fin A — Harmonie Complète',
    title: "L'Harmonie Retrouvée",
    p1: 'Lorsque la Cloche fêlée résonne contre le Monolithe Résonant, toute la montagne répond d’une seule voix. Le Lynx, le Cerf et le Gypaète observent la lumière dorée embraser les quatre crêtes.',
    p2: 'Avec Léo et les pages retrouvées de son carnet, vous redescendez tranquillement vers le refuge de Maren sous un ciel d’étoiles limpide.',
  },
  echo: {
    code: 'Fin B — Écho Apaisé',
    title: "L'Écho Apaisé",
    p1: 'La tempête acoustique s’efface peu à peu autour du Monolithe. Léo retrouve son souffle et vous remercie d’avoir porté l’écho de la vallée jusqu’à 2 680 mètres.',
    p2: 'Quelques mystères sommeillent encore dans la forêt des cairns, mais la montagne retrouve le calme nécessaire pour passer la nuit.',
  },
  silence: {
    code: 'Fin C — Ascension Solitaire',
    title: 'Le Silence de Pierre',
    p1: 'Le Monolithe Résonant se tait brusquement sous votre accord pressé. Le vent cesse, laissant le Col Silencieux figé dans une paix froide et solitaire.',
    p2: 'Léo est sauf, mais bien des bêtes et des pages oubliées attendent encore quelqu’un qui prendra le temps de les écouter.',
  },
};

export const EndingScreen: React.FC<EndingScreenProps> = ({ save, onReplay }) => {
  const endingId = computeEndingId(save);
  const copy = ENDING_COPY[endingId];
  const trailPacifiedCount = (
    ['lynx_boreal', 'cerf_brumes', 'gypaete_cimes'] as const
  ).filter((c) => save.pacifiedCreatures.includes(c)).length;

  return (
    <div className="w-full h-full flex flex-col justify-between p-4 bg-[#0B1021] text-white overflow-y-auto safe-pad">
      <div className="ut-frame p-4 flex flex-col gap-3.5 my-auto">
        <div className="text-center border-b border-slate-700 pb-2.5">
          <div className="text-[11px] uppercase tracking-[0.22em] text-amber-300 mb-1">
            {copy.code}
          </div>
          <h1 className="text-lg font-bold tracking-wider uppercase text-white">
            {copy.title}
          </h1>
        </div>

        <div className="flex flex-wrap justify-center gap-2.5 py-1">
          <PortraitBadge portrait="leo" label="Léo" />
          <PortraitBadge portrait="monolith" label="Monolithe" />
          {save.pacifiedCreatures.includes('lynx_boreal') && (
            <PortraitBadge portrait="lynx" label="Lynx" />
          )}
          {save.pacifiedCreatures.includes('cerf_brumes') && (
            <PortraitBadge portrait="cerf" label="Cerf" />
          )}
          {save.pacifiedCreatures.includes('gypaete_cimes') && (
            <PortraitBadge portrait="gypaete" label="Gypaète" />
          )}
        </div>

        <div className="text-xs leading-relaxed text-slate-200 space-y-2 text-center">
          <p>{copy.p1}</p>
          <p className="text-amber-200">{copy.p2}</p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-[11px] border-t border-slate-700 pt-3 text-slate-200">
          <div className="border border-slate-700 p-2 text-center">
            <div className="text-slate-400 uppercase text-[9px]">Faune apaisée</div>
            <div className="text-amber-300 font-bold text-sm tabular-nums">
              {trailPacifiedCount}/3
            </div>
          </div>
          <div className="border border-slate-700 p-2 text-center">
            <div className="text-slate-400 uppercase text-[9px]">Carnet</div>
            <div className="text-amber-300 font-bold text-sm tabular-nums">
              {save.collectedNotes.length}/6
            </div>
          </div>
          <div className="border border-slate-700 p-2 text-center">
            <div className="text-slate-400 uppercase text-[9px]">Cairns</div>
            <div className="text-amber-300 font-bold text-sm tabular-nums">
              {save.rebuiltCairns.length}/3
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            audioSynth.playUiSelect();
            onReplay();
          }}
          className="min-h-[48px] w-full border-2 border-white bg-black text-white font-bold text-xs uppercase tracking-widest active:bg-white active:text-black"
        >
          Nouvelle Ascension
        </button>
      </div>
    </div>
  );
};
