import React, { useEffect, useRef } from 'react';
import { audioSynth } from '../engine/AudioSynth';
import { getSpriteBank } from '../engine/PixelSprites';
import { NpcId, PortraitId, SaveData } from '../types/game';

interface EndingScreenProps {
  save: SaveData;
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
      <div className="w-14 h-14 border-2 border-white bg-black flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={32}
          height={32}
          className="pixelated w-12 h-12"
        />
      </div>
      <span className="text-[10px] text-amber-200 tracking-wide text-center">
        {label}
      </span>
    </div>
  );
};

export const EndingScreen: React.FC<EndingScreenProps> = ({ save, onReplay }) => {
  const trailFriends: NpcId[] = ['barnabe', 'cabine4', 'echo_brouillard'];
  const isFullPacifist = trailFriends.every((id) =>
    save.befriendedIds.includes(id)
  );

  return (
    <div className="w-full h-full flex flex-col justify-between p-4 bg-[#0B1021] text-white overflow-y-auto">
      <div className="ut-frame p-4 flex flex-col gap-4 my-auto">
        <div className="text-center border-b border-slate-700 pb-3">
          <div className="text-[11px] uppercase tracking-[0.25em] text-amber-300 mb-1">
            2 640 m — Sommet Éveillé
          </div>
          <h1 className="text-lg font-bold tracking-wider uppercase text-white">
            {isFullPacifist ? "L'Aube Partagée" : "L'Ascension Silencieuse"}
          </h1>
        </div>

        {isFullPacifist ? (
          <div className="flex flex-wrap justify-center gap-3 py-1">
            <PortraitBadge portrait="ibex" label="Barnabé" />
            <PortraitBadge portrait="cablecar" label="Cabine N°4" />
            <PortraitBadge portrait="spirit" label="L'Écho" />
            <PortraitBadge portrait="lantern" label="La Lanterne" />
          </div>
        ) : (
          <div className="flex justify-center gap-4 py-1">
            <PortraitBadge portrait="narrator" label="Voyageur" />
            <PortraitBadge portrait="lantern" label="La Lanterne" />
          </div>
        )}

        <div className="text-xs leading-relaxed text-slate-200 space-y-2.5 text-center">
          {isFullPacifist ? (
            <>
              <p>
                Lorsque la Lanterne du Col s’illumine, un rire de bouquetin
                résonne sur la crête. Cabine N°4 arrive même à bon port, portée
                par un câble d’étoiles, tandis que l’Écho fredonne dans la brume
                dissipée.
              </p>
              <p className="text-amber-200">
                Autour du feu du refuge, personne n’est plus pressé d’arriver.
                La montagne entière écoute votre chaleur.
              </p>
            </>
          ) : (
            <>
              <p>
                La Lanterne du Col répond à votre flamme solitaire. Au loin, les
                vallées dorment sous un manteau bleu nuit, calmes et immenses.
              </p>
              <p className="text-slate-300">
                Vous avez atteint les 2 640 mètres en silence. Peut-être qu’au
                prochain voyage, vous prendrez le temps d’écouter chaque âme
                croisée sur le sentier...
              </p>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-slate-700 pt-3 text-slate-300">
          <div className="border border-slate-700 p-2 text-center">
            <div className="text-slate-400 uppercase text-[10px]">Compagnons</div>
            <div className="text-amber-300 font-bold text-sm tabular-nums">
              {save.befriendedIds.length} / 4
            </div>
          </div>
          <div className="border border-slate-700 p-2 text-center">
            <div className="text-slate-400 uppercase text-[10px]">Feux ravivés</div>
            <div className="text-amber-300 font-bold text-sm tabular-nums">
              {save.saveCount}
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
          Rejouer l&apos;Ascension
        </button>
      </div>
    </div>
  );
};
