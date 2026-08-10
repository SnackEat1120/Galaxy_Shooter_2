import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Flame,
  ShoppingBag,
  Sliders,
  Trophy,
  Globe,
  Zap,
  Gem,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { VirtualControls } from './components/VirtualControls';
import { ShopModal } from './components/ShopModal';
import { SettingsModal } from './components/SettingsModal';
import { GameOverModal } from './components/GameOverModal';
import { StageClearModal } from './components/StageClearModal';
import { PauseModal } from './components/PauseModal';
import {
  GameState,
  GameSettings,
  GameStats,
  HighScoreRecord,
  ShipUpgrades,
  Vector2D,
} from './types';
import {
  loadGems,
  loadHighScores,
  loadSettings,
  loadUpgrades,
  saveGems,
  saveHighScore,
  saveSettings,
  saveUpgrades,
} from './utils/storage';
import { getTranslation } from './utils/i18n';
import { soundEngine } from './utils/audio';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [stage, setStage] = useState(1);
  const [isEndless, setIsEndless] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHighScores, setShowHighScores] = useState(false);

  // Player & HUD State
  const [gems, setGems] = useState<number>(0);
  const [upgrades, setUpgrades] = useState<ShipUpgrades>(loadUpgrades());
  const [settings, setSettings] = useState<GameSettings>(loadSettings());
  const [highScores, setHighScores] = useState<HighScoreRecord[]>([]);

  const [playerHp, setPlayerHp] = useState(100);
  const [playerMaxHp, setPlayerMaxHp] = useState(100);
  const [playerLives, setPlayerLives] = useState(3);
  const [playerBombs, setPlayerBombs] = useState(1);
  const [shieldSec, setShieldSec] = useState(0);

  const [bossHp, setBossHp] = useState(0);
  const [bossMaxHp, setBossMaxHp] = useState(0);
  const [bossName, setBossName] = useState<string | null>(null);

  const [currentStats, setCurrentStats] = useState<GameStats>({
    score: 0,
    gemsCollected: 0,
    stage: 1,
    kills: 0,
    shotsFired: 0,
    shotsHit: 0,
  });

  const joystickVectorRef = useRef<Vector2D>({ x: 0, y: 0 });
  const triggerBombRef = useRef<(() => void) | null>(null);

  // Load Saved Data on Mount
  useEffect(() => {
    setGems(loadGems());
    setUpgrades(loadUpgrades());
    const loadedSettings = loadSettings();
    setSettings(loadedSettings);
    setHighScores(loadHighScores());

    soundEngine.updateVolumes(
      loadedSettings.sfxVolume,
      loadedSettings.bgmVolume,
      loadedSettings.sfxMuted,
      loadedSettings.bgmMuted
    );
  }, []);

  // Sync BGM with game state
  useEffect(() => {
    if (gameState === 'PLAYING') {
      soundEngine.startBgm();
    } else {
      soundEngine.stopBgm();
    }
  }, [gameState]);

  // Handlers
  const handleStartGame = (endless = false) => {
    soundEngine.playButtonClick();
    setIsEndless(endless);
    setStage(1);
    setCurrentStats({
      score: 0,
      gemsCollected: 0,
      stage: 1,
      kills: 0,
      shotsFired: 0,
      shotsHit: 0,
    });
    setGameState('PLAYING');
  };

  const handleStageClear = useCallback(() => {
    setGameState('STAGE_CLEAR');
  }, []);

  const handleNextStage = useCallback(() => {
    setStage((prev) => prev + 1);
    setGameState('PLAYING');
  }, []);

  const handleGameOver = useCallback(() => {
    setGameState('GAMEOVER');

    // Save earned gems
    setGems((prevGems) => {
      const newTotal = prevGems + currentStats.gemsCollected;
      saveGems(newTotal);
      return newTotal;
    });

    // Save High Score record
    if (currentStats.score > 0) {
      const updatedScores = saveHighScore({
        score: currentStats.score,
        stage: currentStats.stage,
        kills: currentStats.kills,
        date: new Date().toISOString().split('T')[0],
      });
      setHighScores(updatedScores);
    }
  }, [currentStats]);

  const handleUpdatePlayer = useCallback(
    (hp: number, maxHp: number, lives: number, bombs: number, shield: number) => {
      setPlayerHp(hp);
      setPlayerMaxHp(maxHp);
      setPlayerLives(lives);
      setPlayerBombs(bombs);
      setShieldSec(shield);
    },
    []
  );

  const handleBossHpUpdate = useCallback((hp: number, maxHp: number, name: string | null) => {
    setBossHp(hp);
    setBossMaxHp(maxHp);
    setBossName(name);
  }, []);

  const handleUpgrade = (key: keyof ShipUpgrades, cost: number) => {
    if (gems >= cost) {
      const newGems = gems - cost;
      const newUpgrades = { ...upgrades, [key]: upgrades[key] + 1 };
      setGems(newGems);
      setUpgrades(newUpgrades);
      saveGems(newGems);
      saveUpgrades(newUpgrades);
    }
  };

  const handleUpdateSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    soundEngine.updateVolumes(
      newSettings.sfxVolume,
      newSettings.bgmVolume,
      newSettings.sfxMuted,
      newSettings.bgmMuted
    );
  };

  const bestScore = highScores.length > 0 ? highScores[0].score : 0;

  return (
    <div className="relative w-screen h-screen bg-slate-950 font-sans text-slate-100 flex items-center justify-center overflow-hidden select-none">
      {/* ARCADE CONTAINER FRAME (Retro Neon Border on Desktop) */}
      <div className="relative w-full h-full max-w-[520px] max-h-[850px] bg-slate-950 flex flex-col overflow-hidden sm:rounded-3xl sm:border-2 sm:border-slate-800 sm:shadow-2xl sm:shadow-sky-950/50">
        {/* GAME PLAYING AREA */}
        {(gameState === 'PLAYING' ||
          gameState === 'PAUSED' ||
          gameState === 'STAGE_CLEAR' ||
          gameState === 'GAMEOVER') && (
          <div className="relative w-full h-full flex-1 overflow-hidden">
            <HUD
              score={currentStats.score}
              highScore={bestScore}
              stage={stage}
              lives={playerLives}
              hp={playerHp}
              maxHp={playerMaxHp}
              bombs={playerBombs}
              gems={gems + currentStats.gemsCollected}
              shieldSec={shieldSec}
              bossHp={bossHp}
              bossMaxHp={bossMaxHp}
              bossName={bossName}
              isPaused={gameState === 'PAUSED'}
              language={settings.language}
              onTogglePause={() => {
                soundEngine.playButtonClick();
                setGameState((prev) => (prev === 'PLAYING' ? 'PAUSED' : 'PLAYING'));
              }}
              onTriggerBomb={() => triggerBombRef.current?.()}
            />

            <GameCanvas
              isPaused={gameState === 'PAUSED'}
              stage={stage}
              isEndless={isEndless}
              upgrades={upgrades}
              settings={settings}
              onUpdateStats={setCurrentStats}
              onUpdatePlayer={handleUpdatePlayer}
              onBossHpUpdate={handleBossHpUpdate}
              onStageClear={handleStageClear}
              onGameOver={handleGameOver}
              joystickVectorRef={joystickVectorRef}
              triggerBombRef={triggerBombRef}
            />

            <VirtualControls
              controlMode={settings.controlMode}
              joystickVectorRef={joystickVectorRef}
            />
          </div>
        )}

        {/* RETRO MAIN MENU */}
        {gameState === 'MENU' && (
          <div className="relative w-full h-full flex flex-col justify-between p-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-y-auto">
            {/* Top Bar */}
            <div className="flex items-center justify-between z-10 pt-2">
              <div className="flex items-center gap-1.5 bg-amber-950/60 border border-amber-500/40 text-amber-300 px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm shadow-md">
                <Gem className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span>{gems}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    soundEngine.playButtonClick();
                    setShowSettings(true);
                  }}
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition-all shadow-md"
                  aria-label="Settings"
                >
                  <Sliders className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Hero Logo & Title */}
            <div className="flex flex-col items-center text-center my-auto py-6 z-10">
              {/* Space Fighter Vector Icon */}
              <div className="relative mb-3">
                <div className="absolute inset-0 bg-sky-500/20 blur-xl rounded-full" />
                <div className="relative p-4 rounded-2xl bg-slate-900/90 border border-sky-500/40 shadow-xl shadow-sky-950/60">
                  <Flame className="w-12 h-12 text-sky-400 animate-pulse" />
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-500 font-mono drop-shadow-[0_4px_12px_rgba(56,189,248,0.4)]">
                {getTranslation(settings.language, 'title')}
              </h1>

              <p className="text-xs sm:text-sm font-semibold tracking-wider text-sky-400/80 mt-1 uppercase font-mono">
                {getTranslation(settings.language, 'subtitle')}
              </p>

              {/* Best Score Banner */}
              {bestScore > 0 && (
                <div className="mt-4 flex items-center gap-2 bg-slate-900/80 border border-amber-500/30 text-amber-300 px-4 py-1.5 rounded-full text-xs font-mono font-bold shadow-lg">
                  <Trophy className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>BEST: {bestScore.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Menu Buttons */}
            <div className="flex flex-col gap-3 z-10 w-full max-w-xs mx-auto pb-4">
              <button
                onClick={() => handleStartGame(false)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-base tracking-wider transition-all shadow-xl shadow-sky-950 flex items-center justify-center gap-2 active:scale-95 border border-sky-300/30"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>{getTranslation(settings.language, 'start')}</span>
              </button>

              <button
                onClick={() => handleStartGame(true)}
                className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-sm tracking-wider transition-all border border-amber-500/30 shadow-lg flex items-center justify-center gap-2 active:scale-95"
              >
                <Flame className="w-4 h-4 text-amber-400" />
                <span>{getTranslation(settings.language, 'endless')}</span>
              </button>

              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  onClick={() => {
                    soundEngine.playButtonClick();
                    setShowShop(true);
                  }}
                  className="py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs tracking-wider transition-all border border-slate-800 flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                  <span>{getTranslation(settings.language, 'shop')}</span>
                </button>

                <button
                  onClick={() => {
                    soundEngine.playButtonClick();
                    setShowHighScores(true);
                  }}
                  className="py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs tracking-wider transition-all border border-slate-800 flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span>{getTranslation(settings.language, 'highScores')}</span>
                </button>
              </div>

              {/* Controls Instruction Bar */}
              <p className="text-[11px] text-center text-slate-500 mt-2 px-2 leading-relaxed">
                {getTranslation(settings.language, 'mobileControls')}
              </p>
            </div>
          </div>
        )}

        {/* MODALS */}
        {gameState === 'PAUSED' && (
          <PauseModal
            language={settings.language}
            onResume={() => setGameState('PLAYING')}
            onRestart={() => handleStartGame(isEndless)}
            onOpenSettings={() => setShowSettings(true)}
            onMainMenu={() => setGameState('MENU')}
          />
        )}

        {gameState === 'STAGE_CLEAR' && (
          <StageClearModal
            stats={currentStats}
            language={settings.language}
            onNextStage={handleNextStage}
            onOpenShop={() => setShowShop(true)}
          />
        )}

        {gameState === 'GAMEOVER' && (
          <GameOverModal
            stats={currentStats}
            highScore={bestScore}
            language={settings.language}
            onRestart={() => handleStartGame(isEndless)}
            onOpenShop={() => setShowShop(true)}
            onMainMenu={() => setGameState('MENU')}
          />
        )}

        {showShop && (
          <ShopModal
            gems={gems}
            upgrades={upgrades}
            language={settings.language}
            onUpgrade={handleUpgrade}
            onClose={() => setShowShop(false)}
          />
        )}

        {showSettings && (
          <SettingsModal
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onClose={() => setShowSettings(false)}
          />
        )}

        {/* HIGH SCORES MODAL */}
        {showHighScores && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-lg flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-slate-100">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <h2 className="font-bold text-base sm:text-lg font-mono text-slate-100">
                    {getTranslation(settings.language, 'highScores')}
                  </h2>
                </div>
              </div>

              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                {highScores.map((record, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 font-mono text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                          index === 0
                            ? 'bg-amber-500 text-slate-950'
                            : index === 1
                            ? 'bg-slate-300 text-slate-950'
                            : index === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div>
                        <div className="font-bold text-amber-300">{record.score.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-500">Stage {record.stage}</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500">{record.date}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  soundEngine.playButtonClick();
                  setShowHighScores(false);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all border border-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
