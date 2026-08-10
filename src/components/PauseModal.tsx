import React from 'react';
import { Play, RotateCcw, Home, Sliders } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../utils/i18n';
import { soundEngine } from '../utils/audio';

interface PauseModalProps {
  language: Language;
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  language,
  onResume,
  onRestart,
  onOpenSettings,
  onMainMenu,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-slate-100 text-center animate-in fade-in duration-150">
        <h2 className="text-xl font-black tracking-widest text-sky-400 font-mono">
          {getTranslation(language, 'pause')}
        </h2>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onResume();
            }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-sky-950 flex items-center justify-center gap-2 active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{getTranslation(language, 'resume')}</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onRestart();
            }}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all border border-slate-700 flex items-center justify-center gap-2 active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{getTranslation(language, 'restart')}</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onOpenSettings();
            }}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all border border-slate-700 flex items-center justify-center gap-2 active:scale-95"
          >
            <Sliders className="w-4 h-4" />
            <span>{getTranslation(language, 'settings')}</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onMainMenu();
            }}
            className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-rose-300 font-bold text-xs transition-all border border-slate-700 flex items-center justify-center gap-2 active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>{getTranslation(language, 'mainMenu')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
