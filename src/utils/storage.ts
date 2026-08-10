import { GameSettings, HighScoreRecord, ShipUpgrades } from '../types';

const STORAGE_KEYS = {
  HIGH_SCORES: 'galaxy_shooter_high_scores',
  GEMS: 'galaxy_shooter_gems',
  UPGRADES: 'galaxy_shooter_upgrades',
  SETTINGS: 'galaxy_shooter_settings',
};

export const DEFAULT_SETTINGS: GameSettings = {
  controlMode: 'DRAG',
  autoFire: true,
  sfxVolume: 0.6,
  bgmVolume: 0.4,
  sfxMuted: false,
  bgmMuted: false,
  language: 'KO',
  haptics: true,
  touchSensitivity: 1.2,
};

export const DEFAULT_UPGRADES: ShipUpgrades = {
  damageLevel: 1,
  fireRateLevel: 1,
  maxHpLevel: 1,
  magnetLevel: 1,
  bombMaxLevel: 1,
  shieldDurationLevel: 1,
};

export function loadSettings(): GameSettings {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (data) return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch (e) {
    console.error('Failed to load settings', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

export function loadGems(): number {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.GEMS);
    if (data) return parseInt(data, 10) || 0;
  } catch (e) {
    console.error('Failed to load gems', e);
  }
  return 0;
}

export function saveGems(gems: number): void {
  try {
    localStorage.setItem(STORAGE_KEYS.GEMS, gems.toString());
  } catch (e) {
    console.error('Failed to save gems', e);
  }
}

export function loadUpgrades(): ShipUpgrades {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.UPGRADES);
    if (data) return { ...DEFAULT_UPGRADES, ...JSON.parse(data) };
  } catch (e) {
    console.error('Failed to load upgrades', e);
  }
  return DEFAULT_UPGRADES;
}

export function saveUpgrades(upgrades: ShipUpgrades): void {
  try {
    localStorage.setItem(STORAGE_KEYS.UPGRADES, JSON.stringify(upgrades));
  } catch (e) {
    console.error('Failed to save upgrades', e);
  }
}

export function loadHighScores(): HighScoreRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.HIGH_SCORES);
    if (data) {
      const records: HighScoreRecord[] = JSON.parse(data);
      return records.sort((a, b) => b.score - a.score).slice(0, 10);
    }
  } catch (e) {
    console.error('Failed to load high scores', e);
  }
  return [
    { score: 12500, stage: 5, kills: 142, date: '2026-08-01' },
    { score: 8400, stage: 3, kills: 98, date: '2026-08-02' },
    { score: 5200, stage: 2, kills: 61, date: '2026-08-03' },
  ];
}

export function saveHighScore(newRecord: HighScoreRecord): HighScoreRecord[] {
  const current = loadHighScores();
  current.push(newRecord);
  current.sort((a, b) => b.score - a.score);
  const top10 = current.slice(0, 10);
  try {
    localStorage.setItem(STORAGE_KEYS.HIGH_SCORES, JSON.stringify(top10));
  } catch (e) {
    console.error('Failed to save high score', e);
  }
  return top10;
}
