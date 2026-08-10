import React from 'react';
import { Shield, Zap, Pause, Play, Heart, Bomb, Gem, Volume2, VolumeX } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../utils/i18n';

interface HUDProps {
  score: number;
  highScore: number;
  stage: number;
  lives: number;
  hp: number;
  maxHp: number;
  bombs: number;
  gems: number;
  shieldSec: number;
  bossHp: number;
  bossMaxHp: number;
  bossName: string | null;
  isPaused: boolean;
  language: Language;
  onTogglePause: () => void;
  onTriggerBomb: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  score,
  highScore,
  stage,
  lives,
  hp,
  maxHp,
  bombs,
  gems,
  shieldSec,
  bossHp,
  bossMaxHp,
  bossName,
  isPaused,
  language,
  onTogglePause,
  onTriggerBomb,
}) => {
  const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const bossHpPercent = bossMaxHp > 0 ? Math.max(0, Math.min(100, (bossHp / bossMaxHp) * 100)) : 0;

  return (
    <div className="absolute top-0 left-0 right-0 p-3 z-20 pointer-events-none flex flex-col gap-2 select-none">
      {/* Top Main Bar */}
      <div className="flex items-center justify-between text-xs sm:text-sm font-mono text-slate-100 bg-slate-900/80 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700/50 shadow-lg pointer-events-auto">
        {/* Score & Best */}
        <div className="flex flex-col">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider">
            {getTranslation(language, 'score')}
          </span>
          <span className="text-amber-400 font-bold text-base sm:text-lg tracking-wide">
            {score.toLocaleString()}
          </span>
        </div>

        {/* Stage Badge */}
        <div className="flex flex-col items-center">
          <span className="text-sky-400 font-extrabold text-sm sm:text-base px-2.5 py-0.5 rounded-full bg-sky-950/70 border border-sky-500/30">
            {getTranslation(language, 'stage')} {stage}
          </span>
        </div>

        {/* Gems & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-amber-300 font-semibold">
            <Gem className="w-4 h-4 fill-amber-400 text-amber-500" />
            <span>{gems}</span>
          </div>

          <button
            onClick={onTogglePause}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 transition-all border border-slate-600"
            aria-label="Pause"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Health & Status Indicators */}
      <div className="flex items-center justify-between gap-3 px-1">
        {/* Player HP Bar */}
        <div className="flex-1 max-w-[180px] bg-slate-900/80 backdrop-blur-md p-1.5 rounded-lg border border-slate-700/50 flex flex-col gap-1">
          <div className="flex items-center justify-between text-[10px] text-slate-300 font-mono">
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
              <span>HP</span>
            </span>
            <span>{Math.ceil(hp)}/{maxHp}</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className={`h-full transition-all duration-200 ${
                hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 25 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        {/* Lives Counter */}
        <div className="flex items-center gap-1 bg-slate-900/80 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-700/50">
          {Array.from({ length: Math.max(0, lives) }).map((_, i) => (
            <Zap key={i} className="w-4 h-4 text-sky-400 fill-sky-400 animate-pulse" />
          ))}
        </div>

        {/* Bomb Button (Pointer events auto) */}
        <button
          onClick={onTriggerBomb}
          disabled={bombs <= 0}
          className={`pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-lg transition-all border active:scale-95 ${
            bombs > 0
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-purple-400/50 animate-pulse'
              : 'bg-slate-800 text-slate-500 border-slate-700 opacity-60 cursor-not-allowed'
          }`}
        >
          <Bomb className="w-4 h-4 fill-current" />
          <span>x{bombs}</span>
        </button>
      </div>

      {/* Shield Active Timer Alert */}
      {shieldSec > 0 && (
        <div className="self-center flex items-center gap-1.5 bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-xs font-mono font-bold px-3 py-1 rounded-full shadow-lg animate-bounce">
          <Shield className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
          <span>SHIELD {shieldSec.toFixed(1)}s</span>
        </div>
      )}

      {/* Boss Health Bar (Only active during Boss fights) */}
      {bossName && (
        <div className="w-full max-w-xs mx-auto mt-1 bg-slate-900/90 backdrop-blur-md p-2 rounded-xl border border-rose-500/40 shadow-rose-950/50 shadow-xl flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-rose-400">
            <span>⚠️ {bossName}</span>
            <span>{Math.ceil(bossHpPercent)}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-rose-900">
            <div
              className="h-full bg-gradient-to-r from-rose-600 via-amber-500 to-rose-500 transition-all duration-150"
              style={{ width: `${bossHpPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
