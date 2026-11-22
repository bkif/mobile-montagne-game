import React, { useState } from 'react';
import {
  ITEMS,
  JOURNAL_NOTES,
  getCurrentObjective,
} from '../data/narrativeScript';
import { audioSynth } from '../engine/AudioSynth';
import { InventoryItemId, SaveDataV2 } from '../types/game';

interface CarnetSacModalProps {
  save: SaveDataV2;
  onUseWorldItem: (itemId: InventoryItemId) => void;
  onClose: () => void;
}

export const CarnetSacModal: React.FC<CarnetSacModalProps> = ({
  save,
  onUseWorldItem,
  onClose,
}) => {
  const [tab, setTab] = useState<'carnet' | 'sac'>('carnet');
  const objective = getCurrentObjective(save);

  return (
    <div className="ut-frame w-full h-full flex flex-col justify-between p-2.5 bg-black text-white overflow-hidden">
      {/* Quest Objective Banner */}
      <div className="border border-amber-300 bg-[#050814] px-2.5 py-1.5 mb-2">
        <div className="text-[10px] uppercase tracking-widest text-amber-300 font-bold">
          Objectif — {objective.title}
        </div>
        <div className="text-[11px] text-slate-200 leading-tight mt-0.5">
          {objective.detail}
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-1.5 mb-2">
        <button
          type="button"
          onClick={() => {
            audioSynth.playUiSelect();
            setTab('carnet');
          }}
          className={`min-h-[44px] border-2 text-xs font-bold uppercase tracking-wider ${
            tab === 'carnet'
              ? 'border-amber-300 bg-amber-400/20 text-amber-200'
              : 'border-white bg-black text-white'
          }`}
        >
          Carnet ({save.collectedNotes.length}/6)
        </button>
        <button
          type="button"
          onClick={() => {
            audioSynth.playUiSelect();
            setTab('sac');
          }}
          className={`min-h-[44px] border-2 text-xs font-bold uppercase tracking-wider ${
            tab === 'sac'
              ? 'border-amber-300 bg-amber-400/20 text-amber-200'
              : 'border-white bg-black text-white'
          }`}
        >
          Sac ({save.inventory.length}/6)
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
        {tab === 'carnet' &&
          JOURNAL_NOTES.map((note) => {
            const unlocked = save.collectedNotes.includes(note.id);
            return (
              <div
                key={note.id}
                className={`border p-2 ${
                  unlocked
                    ? 'border-white bg-[#050814]'
                    : 'border-slate-700 bg-black opacity-80'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
                  <span className={unlocked ? 'text-amber-200' : 'text-slate-400'}>
                    {unlocked ? note.title : '??? — Page égarée'}
                  </span>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {note.altitudeLabel}
                  </span>
                </div>
                <p className="text-[11px] text-slate-200 mt-1 leading-snug">
                  {unlocked
                    ? note.fullText
                    : `Indice d'altitude : explorez l'Acte ${note.act} et faites tinter la cloche.`}
                </p>
              </div>
            );
          })}

        {tab === 'sac' && (
          <>
            {save.inventory.length === 0 ? (
              <div className="text-xs text-slate-300 text-center py-6">
                Votre sac est vide pour l&apos;instant. Parlez à Maren !
              </div>
            ) : (
              save.inventory.map((entry) => {
                const item = ITEMS[entry.id];
                return (
                  <div
                    key={entry.id}
                    className="border border-white bg-[#050814] p-2 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-amber-200">
                        {item.name}{' '}
                        <span className="text-slate-300 font-normal">
                          (x{entry.quantity})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 leading-snug mt-0.5">
                        {item.description}
                      </div>
                    </div>
                    {item.usableInWorld && (
                      <button
                        type="button"
                        onClick={() => onUseWorldItem(entry.id)}
                        className="min-w-[68px] min-h-[44px] px-2 border-2 border-amber-300 bg-black text-amber-200 text-[11px] font-bold uppercase shrink-0 active:bg-amber-300 active:text-black"
                      >
                        Utiliser
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          audioSynth.playUiSelect();
          onClose();
        }}
        className="mt-2 min-h-[44px] w-full border-2 border-white bg-black text-white text-xs font-bold uppercase tracking-widest active:bg-white active:text-black"
      >
        Retour au sentier
      </button>
    </div>
  );
};
