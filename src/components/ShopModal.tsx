import React from 'react';
import { Gem, Zap, Shield, Heart, Magnet, Bomb, ArrowLeft, Check } from 'lucide-react';
import { Language, ShipUpgrades } from '../types';
import { getTranslation } from '../utils/i18n';
import { soundEngine } from '../utils/audio';

interface ShopModalProps {
  gems: number;
  upgrades: ShipUpgrades;
  language: Language;
  onUpgrade: (key: keyof ShipUpgrades, cost: number) => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  gems,
  upgrades,
  language,
  onUpgrade,
  onClose,
}) => {
  const getItemCost = (level: number) => {
    return Math.floor(50 * Math.pow(1.6, level - 1));
  };

  const upgradeItems = [
    {
      key: 'damageLevel' as keyof ShipUpgrades,
      titleKey: 'damage' as const,
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      level: upgrades.damageLevel,
      maxLevel: 5,
      desc: '+30% Laser Damage',
    },
    {
      key: 'fireRateLevel' as keyof ShipUpgrades,
      titleKey: 'fireRate' as const,
      icon: <Zap className="w-5 h-5 text-sky-400" />,
      level: upgrades.fireRateLevel,
      maxLevel: 5,
      desc: '+15% Rapid Fire Speed',
    },
    {
      key: 'maxHpLevel' as keyof ShipUpgrades,
      titleKey: 'maxHp' as const,
      icon: <Heart className="w-5 h-5 text-rose-400" />,
      level: upgrades.maxHpLevel,
      maxLevel: 5,
      desc: '+25 Max Armor Hull HP',
    },
    {
      key: 'magnetLevel' as keyof ShipUpgrades,
      titleKey: 'magnet' as const,
      icon: <Magnet className="w-5 h-5 text-indigo-400" />,
      level: upgrades.magnetLevel,
      maxLevel: 5,
      desc: '+35px Gem Pull Attraction',
    },
    {
      key: 'bombMaxLevel' as keyof ShipUpgrades,
      titleKey: 'bombMax' as const,
      icon: <Bomb className="w-5 h-5 text-purple-400" />,
      level: upgrades.bombMaxLevel,
      maxLevel: 5,
      desc: '+1 Starting Bomb Capacity',
    },
    {
      key: 'shieldDurationLevel' as keyof ShipUpgrades,
      titleKey: 'shieldDuration' as const,
      icon: <Shield className="w-5 h-5 text-cyan-400" />,
      level: upgrades.shieldDurationLevel,
      maxLevel: 5,
      desc: '+2 Seconds Shield Forcefield',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-lg flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col gap-5 text-slate-100 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onClose();
            }}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-400 hover:text-white transition-colors bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{getTranslation(language, 'mainMenu')}</span>
          </button>

          <h2 className="text-base sm:text-lg font-black tracking-wider text-amber-400 font-mono">
            🛠️ {getTranslation(language, 'shop')}
          </h2>

          <div className="flex items-center gap-1.5 bg-amber-950/60 border border-amber-500/40 text-amber-300 px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm">
            <Gem className="w-4 h-4 fill-amber-400 text-amber-500" />
            <span>{gems}</span>
          </div>
        </div>

        {/* Upgrade Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {upgradeItems.map((item) => {
            const isMax = item.level >= item.maxLevel;
            const cost = getItemCost(item.level);
            const canAfford = gems >= cost && !isMax;

            return (
              <div
                key={item.key}
                className="bg-slate-950/60 border border-slate-800 hover:border-slate-700 p-3.5 rounded-xl flex flex-col justify-between gap-3 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm text-slate-200">
                        {getTranslation(language, item.titleKey)}
                      </h3>
                      <span className="text-[10px] text-slate-400">{item.desc}</span>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/40">
                    {getTranslation(language, 'level')} {item.level}/{item.maxLevel}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-slate-800/80 pt-2.5">
                  {isMax ? (
                    <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold font-mono">
                      <Check className="w-4 h-4" />
                      <span>{getTranslation(language, 'maxLevel')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-amber-300 text-xs font-mono font-bold">
                      <Gem className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      <span>{cost}</span>
                    </div>
                  )}

                  {!isMax && (
                    <button
                      onClick={() => {
                        if (canAfford) {
                          soundEngine.playPowerUp();
                          onUpgrade(item.key, cost);
                        }
                      }}
                      disabled={!canAfford}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all active:scale-95 ${
                        canAfford
                          ? 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-md shadow-sky-900/30'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      }`}
                    >
                      {getTranslation(language, 'upgradeCost')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
