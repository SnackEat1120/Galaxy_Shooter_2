import React from 'react';
import { ArrowRight, ShoppingBag, Trophy, Gem, Target, Sparkles } from 'lucide-react';
import { GameStats, Language } from '../types';
import { getTranslation } from '../utils/i18n';
import { soundEngine } from '../utils/audio';

interface StageClearModalProps {
  stats: GameStats;
  language: Language;
  onNextStage: () => void;
  onOpenShop: () => void;
}

export const StageClearModal: React.FC<StageClearModalProps> = ({
  stats,
  language,
  onNextStage,
  onOpenShop,
}) => {
  const accuracy = stats.shotsFired > 0 ? Math.round((stats.shotsHit / stats.shotsFired) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl flex flex-col gap-5 text-slate-100 text-center animate-in fade-in zoom-in duration-200">
        {/* Title */}
        <div className="flex flex-col items-center">
          <Sparkles className="w-8 h-8 text-emerald-400 mb-1 animate-bounce" />
          <h2 className="text-2xl font-black tracking-widest text-emerald-400 font-mono">
            {getTranslation(language, 'stageClear')}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {getTranslation(language, 'stage')} {stats.stage} COMPLETED
          </p>
        </div>

        {/* Stats Summary */}
        <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 grid grid-cols-2 gap-3 text-left font-mono">
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">
              {getTranslation(language, 'score')}
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
            <span className="text-sm font-bold text-emerald-400">
              {accuracy}%
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onNextStage();
            }}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm transition-all shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 active:scale-95"
          >
            <span>{getTranslation(language, 'nextStage')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onOpenShop();
            }}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs transition-all border border-slate-700 flex items-center justify-center gap-1.5 active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{getTranslation(language, 'shop')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
