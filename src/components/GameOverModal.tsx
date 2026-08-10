import React from 'react';
import { RotateCcw, Home, ShoppingBag, Trophy, Gem, Target, Zap } from 'lucide-react';
import { GameStats, Language } from '../types';
import { getTranslation } from '../utils/i18n';
import { soundEngine } from '../utils/audio';

interface GameOverModalProps {
  stats: GameStats;
  highScore: number;
  language: Language;
  onRestart: () => void;
  onOpenShop: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  highScore,
  language,
  onRestart,
  onOpenShop,
  onMainMenu,
}) => {
  const accuracy = stats.shotsFired > 0 ? Math.round((stats.shotsHit / stats.shotsFired) * 100) : 0;
  const isNewHighScore = stats.score > highScore && stats.score > 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-rose-500/30 rounded-2xl p-6 shadow-2xl flex flex-col gap-5 text-slate-100 text-center animate-in fade-in zoom-in duration-200">
        {/* Title */}
        <div>
          <h2 className="text-2xl font-black tracking-widest text-rose-500 font-mono animate-pulse">
            {getTranslation(language, 'gameOver')}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {getTranslation(language, 'stage')} {stats.stage}
          </p>
        </div>

        {/* New High Score Badge */}
        {isNewHighScore && (
          <div className="bg-amber-500/20 border border-amber-500/50 text-amber-300 px-3 py-1.5 rounded-full text-xs font-extrabold flex items-center justify-center gap-1.5 animate-bounce mx-auto">
            <Trophy className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>NEW HIGH SCORE!</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 grid grid-cols-2 gap-3 text-left font-mono">
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">
              {getTranslation(language, 'totalScore')}
            </span>
            <span className="text-lg font-bold text-amber-400">
              {stats.score.toLocaleString()}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 uppercase block">
              {getTranslation(language, 'gemsEarned')}
            </span>
            <span className="text-lg font-bold text-amber-300 flex items-center gap-1">
              <Gem className="w-4 h-4 fill-amber-400 text-amber-500" />
              {stats.gemsCollected}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 uppercase block">
              {getTranslation(language, 'kills')}
            </span>
            <span className="text-sm font-bold text-sky-400 flex items-center gap-1">
              <Target className="w-3.5 h-3.5" />
              {stats.kills}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 uppercase block">
              {getTranslation(language, 'accuracy')}
            </span>
            <span className="text-sm font-bold text-emerald-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              {accuracy}%
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onRestart();
            }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-sky-950 flex items-center justify-center gap-2 active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{getTranslation(language, 'restart')}</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                soundEngine.playButtonClick();
                onOpenShop();
              }}
              className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs transition-all border border-slate-700 flex items-center justify-center gap-1.5 active:scale-95"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{getTranslation(language, 'shop')}</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playButtonClick();
                onMainMenu();
              }}
              className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all border border-slate-700 flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Home className="w-3.5 h-3.5" />
              <span>{getTranslation(language, 'mainMenu')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
