import React from 'react';
import { Volume2, VolumeX, Smartphone, Gamepad2, Globe, Sliders, X } from 'lucide-react';
import { GameSettings } from '../types';
import { getTranslation } from '../utils/i18n';
import { soundEngine } from '../utils/audio';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const handleToggleSfx = () => {
    soundEngine.playButtonClick();
    const updated = { ...settings, sfxMuted: !settings.sfxMuted };
    soundEngine.updateVolumes(updated.sfxVolume, updated.bgmVolume, updated.sfxMuted, updated.bgmMuted);
    onUpdateSettings(updated);
  };

  const handleToggleBgm = () => {
    soundEngine.playButtonClick();
    const updated = { ...settings, bgmMuted: !settings.bgmMuted };
    soundEngine.updateVolumes(updated.sfxVolume, updated.bgmVolume, updated.sfxMuted, updated.bgmMuted);
    onUpdateSettings(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-lg flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col gap-5 text-slate-100 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-sky-400" />
            <h2 className="font-bold text-base sm:text-lg tracking-wide text-slate-100 font-mono">
              {getTranslation(settings.language, 'settings')}
            </h2>
          </div>
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Control Mode Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">
            🎮 {getTranslation(settings.language, 'controlMode')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                soundEngine.playButtonClick();
                onUpdateSettings({ ...settings, controlMode: 'DRAG' });
              }}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                settings.controlMode === 'DRAG'
                  ? 'bg-sky-600 border-sky-400 text-white shadow-lg shadow-sky-950'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>{getTranslation(settings.language, 'dragControl')}</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playButtonClick();
                onUpdateSettings({ ...settings, controlMode: 'JOYSTICK' });
              }}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                settings.controlMode === 'JOYSTICK'
                  ? 'bg-sky-600 border-sky-400 text-white shadow-lg shadow-sky-950'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              <span>{getTranslation(settings.language, 'joystickControl')}</span>
            </button>
          </div>
        </div>

        {/* Auto Fire Toggle */}
        <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <span className="text-xs sm:text-sm font-semibold text-slate-300">
            🚀 {getTranslation(settings.language, 'autoFire')}
          </span>
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onUpdateSettings({ ...settings, autoFire: !settings.autoFire });
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              settings.autoFire ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {settings.autoFire ? getTranslation(settings.language, 'on') : getTranslation(settings.language, 'off')}
          </button>
        </div>

        {/* Audio Controls */}
        <div className="flex flex-col gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              🔊 {getTranslation(settings.language, 'sfxVolume')}
            </span>
            <button
              onClick={handleToggleSfx}
              className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-white"
            >
              {settings.sfxMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-slate-800 pt-3">
            <span className="text-xs font-semibold text-slate-300">
              🎵 {getTranslation(settings.language, 'bgmVolume')}
            </span>
            <button
              onClick={handleToggleBgm}
              className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-white"
            >
              {settings.bgmMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        </div>

        {/* Language Selection */}
        <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-sky-400" />
            <span className="text-xs sm:text-sm font-semibold text-slate-300">
              {getTranslation(settings.language, 'language')}
            </span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => {
                soundEngine.playButtonClick();
                onUpdateSettings({ ...settings, language: 'KO' });
              }}
              className={`px-2.5 py-1 rounded text-xs font-bold font-mono transition-all ${
                settings.language === 'KO' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              한국어
            </button>
            <button
              onClick={() => {
                soundEngine.playButtonClick();
                onUpdateSettings({ ...settings, language: 'EN' });
              }}
              className={`px-2.5 py-1 rounded text-xs font-bold font-mono transition-all ${
                settings.language === 'EN' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            soundEngine.playButtonClick();
            onClose();
          }}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm transition-all border border-slate-700"
        >
          OK
        </button>
      </div>
    </div>
  );
};
