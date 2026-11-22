import React, { useEffect, useMemo, useRef, useState } from 'react';
import { evaluateDialogueCondition } from '../data/narrativeScript';
import { audioSynth } from '../engine/AudioSynth';
import { getSpriteBank } from '../engine/PixelSprites';
import {
  DialogueChoice,
  DialogueNode,
  PortraitId,
  SaveDataV2,
} from '../types/game';

interface UndertaleBoxProps {
  node: DialogueNode;
  save: SaveDataV2;
  onAdvance: () => void;
  onSelectChoice: (choice: DialogueChoice) => void;
}

const PortraitView: React.FC<{ portrait: PortraitId }> = ({ portrait }) => {
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
    <div className="shrink-0 w-14 h-14 border-2 border-white bg-black flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={32}
        height={32}
        className="pixelated w-12 h-12"
      />
    </div>
  );
};

export const UndertaleBox: React.FC<UndertaleBoxProps> = ({
  node,
  save,
  onAdvance,
  onSelectChoice,
}) => {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    setVisibleCount(0);
  }, [node.id, node.text]);

  const isDoneTyping = visibleCount >= node.text.length;

  useEffect(() => {
    if (isDoneTyping) return;
    const timer = window.setInterval(() => {
      setVisibleCount((prev) => {
        const next = Math.min(node.text.length, prev + 1);
        const char = node.text[next - 1];
        if (char && char !== ' ') {
          audioSynth.playVoiceBlip(node.voice);
        }
        return next;
      });
    }, 24);

    return () => window.clearInterval(timer);
  }, [isDoneTyping, node.text, node.voice]);

  const availableChoices = useMemo(() => {
    if (!node.choices) return [];
    return node.choices.filter((c) =>
      evaluateDialogueCondition(c.condition, save)
    );
  }, [node.choices, save]);

  const handleBoxTap = () => {
    if (!isDoneTyping) {
      setVisibleCount(node.text.length);
      return;
    }
    if (availableChoices.length === 0) {
      audioSynth.playUiSelect();
      onAdvance();
    }
  };

  return (
    <div className="ut-frame w-full h-full flex flex-col justify-between p-2.5 text-white overflow-hidden">
      <div
        role="button"
        tabIndex={0}
        onClick={handleBoxTap}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleBoxTap();
        }}
        className="flex items-start gap-2.5 flex-1 min-h-0 cursor-pointer"
      >
        <PortraitView portrait={node.portrait} />
        <div className="flex-1 min-w-0 flex flex-col h-full justify-between">
          <div className="overflow-y-auto pr-1">
            <div className="inline-block px-1.5 py-0.5 mb-1 border border-amber-300 bg-black text-[11px] uppercase tracking-widest text-amber-300 font-bold">
              {node.speaker}
            </div>
            <p className="text-[13px] leading-snug text-white whitespace-pre-wrap">
              {node.text.slice(0, visibleCount)}
              {!isDoneTyping && (
                <span className="inline-block w-2 h-3.5 bg-white ml-0.5 align-middle animate-pulse" />
              )}
            </p>
          </div>

          {isDoneTyping && availableChoices.length === 0 && (
            <div className="text-[11px] text-amber-200 tracking-wider uppercase text-right pt-1">
              [ Toucher pour continuer ▼ ]
            </div>
          )}
        </div>
      </div>

      {isDoneTyping && availableChoices.length > 0 && (
        <div className="grid grid-cols-1 gap-1.5 pt-2 overflow-y-auto max-h-[144px]">
          {availableChoices.map((choice) => (
            <button
              key={choice.label}
              type="button"
              onClick={() => {
                audioSynth.playUiSelect();
                onSelectChoice(choice);
              }}
              className={`min-h-[44px] w-full px-3 py-1.5 text-left text-xs font-bold tracking-wide border-2 transition-colors active:bg-white active:text-black flex items-center justify-between ${
                choice.condition
                  ? 'border-amber-300 text-amber-200 bg-black'
                  : 'border-white text-white bg-black'
              }`}
            >
              <span>
                {choice.condition ? '★ ' : '▸ '}
                {choice.label}
              </span>
              {choice.startPacify && (
                <span className="text-[10px] uppercase px-1.5 py-0.5 border border-amber-300 text-amber-200">
                  Apaiser
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
