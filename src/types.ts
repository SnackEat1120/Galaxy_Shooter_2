export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'STAGE_CLEAR' | 'SHOP';

export type ControlMode = 'DRAG' | 'JOYSTICK' | 'BUTTONS';

export type Language = 'KO' | 'EN';

export type EnemyType = 'DRONE' | 'INTERCEPTOR' | 'COMMANDER' | 'ELITE' | 'BOSS';

export type PowerUpType = 'WEAPON' | 'SHIELD' | 'BOMB' | 'HEAL' | 'SPEED' | 'MAGNET';

export interface Vector2D {
  x: number;
  y: number;
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  hp: number;
  maxHp: number;
  lives: number;
  weaponLevel: number; // 1 to 5
  shield: number; // shield duration seconds remaining
  maxShield: number;
  bombs: number;
  maxBombs: number;
  invulnerableTimer: number; // seconds
  autoFire: boolean;
  score: number;
  gems: number;
  magnetRange: number;
}

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  gridX: number; // formation target X
  gridY: number; // formation target Y
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  speed: number;
  points: number;
  state: 'IN_FORMATION' | 'SWOOPING' | 'RETURNING';
  swoopProgress: number; // 0 to 1
  swoopPath: Vector2D[];
  fireTimer: number;
  fireInterval: number;
  color: string;
  shootPattern: 'SINGLE' | 'DOUBLE' | 'SPREAD' | 'AIMED' | 'RING';
}

export interface Boss extends Enemy {
  phase: number;
  maxPhases: number;
  specialAttackTimer: number;
  name: string;
  shieldHp: number;
  maxShieldHp: number;
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isPlayer: boolean;
  damage: number;
  color: string;
  type?: 'LASER' | 'PLASMA' | 'HOMING' | 'BOSS_BEAM';
}

export interface PowerUp {
  id: string;
  type: PowerUpType;
  x: number;
  y: number;
  vy: number;
  radius: number;
}

export interface Gem {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
  radius: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  alpha: number;
  life: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  brightness: number;
  layer: number;
}

export interface ShipUpgrades {
  damageLevel: number;
  fireRateLevel: number;
  maxHpLevel: number;
  magnetLevel: number;
  bombMaxLevel: number;
  shieldDurationLevel: number;
}

export interface HighScoreRecord {
  score: number;
  stage: number;
  kills: number;
  date: string;
}

export interface GameSettings {
  controlMode: ControlMode;
  autoFire: boolean;
  sfxVolume: number;
  bgmVolume: number;
  sfxMuted: boolean;
  bgmMuted: boolean;
  language: Language;
  haptics: boolean;
  touchSensitivity: number;
}

export interface GameStats {
  score: number;
  gemsCollected: number;
  stage: number;
  kills: number;
  shotsFired: number;
  shotsHit: number;
}
