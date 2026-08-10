import React, { useRef, useEffect, useCallback } from 'react';
import {
  Boss,
  Bullet,
  ControlMode,
  Enemy,
  FloatingText,
  GameSettings,
  GameStats,
  Gem,
  Particle,
  Player,
  PowerUp,
  ShipUpgrades,
  Star,
  Vector2D,
} from '../types';
import { soundEngine } from '../utils/audio';

interface GameCanvasProps {
  isPaused: boolean;
  stage: number;
  isEndless: boolean;
  upgrades: ShipUpgrades;
  settings: GameSettings;
  onUpdateStats: (stats: GameStats) => void;
  onUpdatePlayer: (hp: number, maxHp: number, lives: number, bombs: number, shieldSec: number) => void;
  onBossHpUpdate: (hp: number, maxHp: number, name: string | null) => void;
  onStageClear: () => void;
  onGameOver: () => void;
  joystickVectorRef: React.RefObject<Vector2D>;
  triggerBombRef: React.MutableRefObject<(() => void) | null>;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  isPaused,
  stage,
  isEndless,
  upgrades,
  settings,
  onUpdateStats,
  onUpdatePlayer,
  onBossHpUpdate,
  onStageClear,
  onGameOver,
  joystickVectorRef,
  triggerBombRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Callback Refs to prevent re-triggering useEffects on prop recreation
  const onUpdatePlayerRef = useRef(onUpdatePlayer);
  const onBossHpUpdateRef = useRef(onBossHpUpdate);
  const onUpdateStatsRef = useRef(onUpdateStats);
  const onStageClearRef = useRef(onStageClear);
  const onGameOverRef = useRef(onGameOver);

  useEffect(() => {
    onUpdatePlayerRef.current = onUpdatePlayer;
    onBossHpUpdateRef.current = onBossHpUpdate;
    onUpdateStatsRef.current = onUpdateStats;
    onStageClearRef.current = onStageClear;
    onGameOverRef.current = onGameOver;
  });

  // Internal Game State Refs (avoid React re-render lag inside 60FPS loop)
  const gameStateRef = useRef({
    width: 480,
    height: 720,
    player: {
      x: 240,
      y: 620,
      width: 38,
      height: 38,
      speed: 6.5,
      hp: 100 + (upgrades.maxHpLevel - 1) * 25,
      maxHp: 100 + (upgrades.maxHpLevel - 1) * 25,
      lives: 3,
      weaponLevel: 1,
      shield: 0,
      maxShield: 5 + (upgrades.shieldDurationLevel - 1) * 2,
      bombs: 1 + (upgrades.bombMaxLevel - 1),
      maxBombs: 1 + (upgrades.bombMaxLevel - 1),
      invulnerableTimer: 0,
      autoFire: settings.autoFire,
      score: 0,
      gems: 0,
      magnetRange: 80 + (upgrades.magnetLevel - 1) * 35,
    } as Player,
    enemies: [] as Enemy[],
    boss: null as Boss | null,
    bullets: [] as Bullet[],
    powerUps: [] as PowerUp[],
    gems: [] as Gem[],
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    stars: [] as Star[],
    touchPos: null as Vector2D | null,
    isTouching: false,
    keys: {} as Record<string, boolean>,
    fireCooldown: 0,
    stats: {
      score: 0,
      gemsCollected: 0,
      stage,
      kills: 0,
      shotsFired: 0,
      shotsHit: 0,
    } as GameStats,
    screenShakeTimer: 0,
    screenShakeIntensity: 0,
    gridOffset: 0,
    gridDirection: 1,
    swoopTimer: 0,
    stageTimer: 0,
    stageCleared: false,
    gameOver: false,
  });

  // Calculate base damage from upgrades
  const damageMultiplier = 1 + (upgrades.damageLevel - 1) * 0.3;
  const fireRateDelay = Math.max(7, 18 - (upgrades.fireRateLevel - 1) * 2);

  // Trigger Smart Bomb
  const useBomb = useCallback(() => {
    const g = gameStateRef.current;
    if (g.player.bombs <= 0 || g.gameOver || isPaused) return;

    g.player.bombs -= 1;
    soundEngine.playBomb();

    // Trigger haptic if enabled
    if (settings.haptics && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }

    // Screen Shake
    g.screenShakeTimer = 25;
    g.screenShakeIntensity = 12;

    // Shockwave particles
    for (let i = 0; i < 60; i++) {
      const angle = (Math.PI * 2 * i) / 60;
      const speed = 8 + Math.random() * 6;
      g.particles.push({
        x: g.player.x,
        y: g.player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 3 + Math.random() * 4,
        color: '#38bdf8',
        alpha: 1,
        life: 0,
        maxLife: 30 + Math.random() * 15,
      });
    }

    // Clear all enemy bullets
    g.bullets = g.bullets.filter((b) => b.isPlayer);

    // Damage all enemies heavily
    g.enemies.forEach((enemy) => {
      enemy.hp -= 200 * damageMultiplier;
      // Add explosion particles
      for (let p = 0; p < 8; p++) {
        g.particles.push({
          x: enemy.x,
          y: enemy.y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          radius: 3 + Math.random() * 3,
          color: '#f97316',
          alpha: 1,
          life: 0,
          maxLife: 20,
        });
      }
    });

    if (g.boss) {
      g.boss.hp -= 300 * damageMultiplier;
    }

    // Notify UI
    onUpdatePlayerRef.current(
      g.player.hp,
      g.player.maxHp,
      g.player.lives,
      g.player.bombs,
      g.player.shield
    );
  }, [damageMultiplier, isPaused, settings.haptics]);

  useEffect(() => {
    triggerBombRef.current = useBomb;
  }, [useBomb, triggerBombRef]);

  // Spawn Starfield
  const initStarfield = useCallback((w: number, h: number) => {
    const stars: Star[] = [];
    for (let i = 0; i < 80; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 1.5 + 0.5,
        brightness: Math.random(),
        layer: Math.floor(Math.random() * 3) + 1,
      });
    }
    return stars;
  }, []);

  // Spawn Enemy Formation for Stage
  const spawnEnemiesForStage = useCallback((stageNum: number, w: number) => {
    const enemies: Enemy[] = [];
    const isBossStage = stageNum % 3 === 0 && !isEndless;

    if (isBossStage) {
      // Small escort formation with boss
      const rows = 2;
      const cols = 6;
      const startX = (w - cols * 45) / 2 + 22;
      const startY = 120;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const type = r === 0 ? 'INTERCEPTOR' : 'DRONE';
          const hp = type === 'INTERCEPTOR' ? 30 + stageNum * 5 : 15 + stageNum * 3;

          enemies.push({
            id: `enemy-${r}-${c}-${Math.random()}`,
            type,
            x: startX + c * 45,
            y: startY + r * 40,
            gridX: startX + c * 45,
            gridY: startY + r * 40,
            width: 32,
            height: 32,
            hp,
            maxHp: hp,
            speed: 2 + Math.random() * 1.5,
            points: type === 'INTERCEPTOR' ? 150 : 80,
            state: 'IN_FORMATION',
            swoopProgress: 0,
            swoopPath: [],
            fireTimer: Math.random() * 120,
            fireInterval: Math.max(60, 150 - stageNum * 10),
            color: type === 'INTERCEPTOR' ? '#a855f7' : '#22c55e',
            shootPattern: 'SINGLE',
          });
        }
      }
    } else {
      // Standard Galaxian Grid Formation
      const rows = Math.min(5, 3 + Math.floor(stageNum / 2));
      const cols = Math.min(8, 6 + Math.floor(stageNum / 3));
      const startX = (w - cols * 48) / 2 + 24;
      const startY = 80;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          let type: 'DRONE' | 'INTERCEPTOR' | 'COMMANDER' | 'ELITE' = 'DRONE';
          if (r === 0) type = stageNum > 2 ? 'ELITE' : 'COMMANDER';
          else if (r === 1) type = 'COMMANDER';
          else if (r === 2) type = 'INTERCEPTOR';

          let hp = 15 + stageNum * 4;
          let points = 50;
          let color = '#22c55e'; // green

          if (type === 'INTERCEPTOR') {
            hp = 25 + stageNum * 5;
            points = 100;
            color = '#a855f7'; // purple
          } else if (type === 'COMMANDER') {
            hp = 40 + stageNum * 8;
            points = 200;
            color = '#ef4444'; // red
          } else if (type === 'ELITE') {
            hp = 65 + stageNum * 10;
            points = 350;
            color = '#eab308'; // yellow gold
          }

          enemies.push({
            id: `enemy-${r}-${c}-${Math.random()}`,
            type,
            x: startX + c * 48,
            y: startY + r * 40,
            gridX: startX + c * 48,
            gridY: startY + r * 40,
            width: 32,
            height: 32,
            hp,
            maxHp: hp,
            speed: 2 + Math.random() * 1.5,
            points,
            state: 'IN_FORMATION',
            swoopProgress: 0,
            swoopPath: [],
            fireTimer: Math.random() * 100,
            fireInterval: Math.max(50, 160 - stageNum * 8),
            color,
            shootPattern: type === 'ELITE' ? 'SPREAD' : type === 'COMMANDER' ? 'DOUBLE' : 'SINGLE',
          });
        }
      }
    }

    return enemies;
  }, [isEndless]);

  // Spawn Boss
  const spawnBoss = useCallback((stageNum: number, w: number) => {
    const hp = 500 + stageNum * 250;
    const bossNames = ['GALAXY OVERLORD', 'CYBER DREADNOUGHT', 'VOID DESTROYER', 'CELESTIAL BEHEMOTH'];
    const name = bossNames[(Math.floor(stageNum / 3) - 1) % bossNames.length] || 'GALAXY OVERLORD';

    return {
      id: `boss-${stageNum}`,
      type: 'BOSS',
      x: w / 2,
      y: -100,
      gridX: w / 2,
      gridY: 110,
      width: 96,
      height: 80,
      hp,
      maxHp: hp,
      speed: 2.2,
      points: 2500 + stageNum * 500,
      state: 'IN_FORMATION',
      swoopProgress: 0,
      swoopPath: [],
      fireTimer: 0,
      fireInterval: 45,
      color: '#f43f5e',
      shootPattern: 'SPREAD',
      phase: 1,
      maxPhases: 3,
      specialAttackTimer: 0,
      name,
      shieldHp: 150 + stageNum * 50,
      maxShieldHp: 150 + stageNum * 50,
    } as Boss;
  }, []);

  // Initialize Game Logic on Mount / Stage Reset
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const g = gameStateRef.current;
    g.stars = initStarfield(g.width, g.height);
    g.enemies = spawnEnemiesForStage(stage, g.width);
    
    if (stage % 3 === 0 && !isEndless) {
      g.boss = spawnBoss(stage, g.width);
      onBossHpUpdateRef.current(g.boss.hp, g.boss.maxHp, g.boss.name);
    } else {
      g.boss = null;
      onBossHpUpdateRef.current(0, 0, null);
    }

    // Reset Stage Stats
    g.stageCleared = false;
    g.gameOver = false;
    g.bullets = [];
    g.powerUps = [];
    g.gems = [];
    g.particles = [];
    g.floatingTexts = [];
    g.player.x = g.width / 2;
    g.player.y = g.height - 80;
    g.player.invulnerableTimer = 1.0; // short protective aura on spawn
    g.player.autoFire = settings.autoFire !== false;
    g.fireCooldown = 0; // ready to fire on frame 1

    onUpdatePlayerRef.current(
      g.player.hp,
      g.player.maxHp,
      g.player.lives,
      g.player.bombs,
      g.player.shield
    );
  }, [stage, isEndless, initStarfield, spawnEnemiesForStage, spawnBoss]);

  // Handle Touch & Mouse Events for Dragging / Joystick
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      const g = gameStateRef.current;
      if (isPaused || g.gameOver) return;

      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const canvasX = ((touch.clientX - rect.left) / rect.width) * g.width;
      const canvasY = ((touch.clientY - rect.top) / rect.height) * g.height;

      g.touchPos = { x: canvasX, y: canvasY };
      g.isTouching = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const g = gameStateRef.current;
      if (isPaused || g.gameOver || !g.isTouching) return;

      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const canvasX = ((touch.clientX - rect.left) / rect.width) * g.width;
      const canvasY = ((touch.clientY - rect.top) / rect.height) * g.height;

      g.touchPos = { x: canvasX, y: canvasY };
    };

    const handleTouchEnd = () => {
      const g = gameStateRef.current;
      g.isTouching = false;
      g.touchPos = null;
    };

    const handleMouseDown = (e: MouseEvent) => {
      const g = gameStateRef.current;
      if (isPaused || g.gameOver) return;

      const rect = canvas.getBoundingClientRect();
      const canvasX = ((e.clientX - rect.left) / rect.width) * g.width;
      const canvasY = ((e.clientY - rect.top) / rect.height) * g.height;

      g.touchPos = { x: canvasX, y: canvasY };
      g.isTouching = true;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const g = gameStateRef.current;
      if (isPaused || g.gameOver) return;

      const rect = canvas.getBoundingClientRect();
      const canvasX = ((e.clientX - rect.left) / rect.width) * g.width;
      const canvasY = ((e.clientY - rect.top) / rect.height) * g.height;

      g.touchPos = { x: canvasX, y: canvasY };
    };

    const handleMouseUp = () => {
      const g = gameStateRef.current;
      g.isTouching = false;
      g.touchPos = null;
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: true });
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPaused]);

  // Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const g = gameStateRef.current;
      g.keys[e.key] = true;

      if (e.key === 'b' || e.key === 'B') {
        useBomb();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const g = gameStateRef.current;
      g.keys[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [useBomb]);

  // Helper: Generate Galaxian Swooping Curve
  const createSwoopPath = (start: Vector2D, target: Vector2D, width: number): Vector2D[] => {
    const path: Vector2D[] = [];
    const steps = 60;
    // Cubic Bézier curve diving down towards player and looping back up
    const cp1 = { x: start.x + (Math.random() > 0.5 ? 120 : -120), y: start.y + 150 };
    const cp2 = { x: target.x + (Math.random() - 0.5) * 100, y: target.y - 100 };
    const end = { x: Math.min(Math.max(30, target.x), width - 30), y: target.y + 180 };

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const invT = 1 - t;

      // B(t) = (1-t)^3*P0 + 3(1-t)^2*t*P1 + 3(1-t)*t^2*P2 + t^3*P3
      const x =
        invT * invT * invT * start.x +
        3 * invT * invT * t * cp1.x +
        3 * invT * t * t * cp2.x +
        t * t * t * end.x;
      const y =
        invT * invT * invT * start.y +
        3 * invT * invT * t * cp1.y +
        3 * invT * t * t * cp2.y +
        t * t * t * end.y;

      path.push({ x, y });
    }
    return path;
  };

  // Main 60FPS Game Loop
  useEffect(() => {
    let animId: number;

    const updateAndRender = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const g = gameStateRef.current;

      // Responsive Canvas DPR Setup
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        g.width = rect.width;
        g.height = rect.height;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // --- SCREEN SHAKE EFFECT ---
      if (g.screenShakeTimer > 0) {
        g.screenShakeTimer--;
        const shakeX = (Math.random() - 0.5) * g.screenShakeIntensity;
        const shakeY = (Math.random() - 0.5) * g.screenShakeIntensity;
        ctx.translate(shakeX, shakeY);
      }

      // --- CLEAR CANVAS & BACKGROUND STARFIELD ---
      ctx.fillStyle = '#090d16'; // deep galactic dark navy
      ctx.fillRect(0, 0, g.width, g.height);

      // Starfield rendering
      g.stars.forEach((star) => {
        star.y += star.speed * (g.stageCleared ? 5 : 1);
        if (star.y > g.height) {
          star.y = 0;
          star.x = Math.random() * g.width;
        }

        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + star.brightness * 0.7})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      if (isPaused || g.gameOver) {
        // Render current frame static
        drawPlayer(ctx, g.player);
        drawEnemies(ctx, g.enemies, g.boss);
        drawBullets(ctx, g.bullets);
        drawPowerUps(ctx, g.powerUps);
        drawGems(ctx, g.gems);
        drawParticles(ctx, g.particles);
        drawFloatingTexts(ctx, g.floatingTexts);
        ctx.restore();
        animId = requestAnimationFrame(updateAndRender);
        return;
      }

      // --- GAME STATE LOGIC TIMERS ---
      g.stageTimer++;
      if (g.player.invulnerableTimer > 0) {
        g.player.invulnerableTimer -= 1 / 60;
      }
      if (g.player.shield > 0) {
        g.player.shield -= 1 / 60;
        onUpdatePlayerRef.current(
          g.player.hp,
          g.player.maxHp,
          g.player.lives,
          g.player.bombs,
          Math.max(0, g.player.shield)
        );
      }

      // --- PLAYER MOVEMENT ---
      const playerSpeed = g.player.speed * (settings.touchSensitivity || 1);

      // Keyboard Controls
      let moveX = 0;
      let moveY = 0;

      if (g.keys['ArrowLeft'] || g.keys['a'] || g.keys['A']) moveX -= 1;
      if (g.keys['ArrowRight'] || g.keys['d'] || g.keys['D']) moveX += 1;
      if (g.keys['ArrowUp'] || g.keys['w'] || g.keys['W']) moveY -= 1;
      if (g.keys['ArrowDown'] || g.keys['s'] || g.keys['S']) moveY += 1;

      // Virtual Joystick Controls
      if (joystickVectorRef.current && (joystickVectorRef.current.x !== 0 || joystickVectorRef.current.y !== 0)) {
        moveX = joystickVectorRef.current.x;
        moveY = joystickVectorRef.current.y;
      }

      if (moveX !== 0 || moveY !== 0) {
        g.player.x += moveX * playerSpeed;
        g.player.y += moveY * playerSpeed;
      } else if (g.touchPos && (settings.controlMode === 'DRAG' || g.isTouching)) {
        // Touch Drag / Mouse Cursor Control
        const targetX = g.touchPos.x;
        const targetY = g.touchPos.y - 20;

        const dx = targetX - g.player.x;
        const dy = targetY - g.player.y;

        if (Math.hypot(dx, dy) > 2) {
          g.player.x += dx * 0.35;
          g.player.y += dy * 0.35;
        }
      }

      // Clamp Player Position to Canvas Bounds
      const margin = g.player.width / 2;
      g.player.x = Math.max(margin, Math.min(g.width - margin, g.player.x));
      g.player.y = Math.max(margin + 40, Math.min(g.height - margin - 20, g.player.y));

      // Ensure autoFire reflects current settings
      g.player.autoFire = settings.autoFire !== false;

      // --- PLAYER SHOOTING LOGIC ---
      g.fireCooldown--;
      const joystickActive =
        joystickVectorRef.current &&
        (Math.abs(joystickVectorRef.current.x) > 0.05 || Math.abs(joystickVectorRef.current.y) > 0.05);

      const isFiring =
        g.player.autoFire ||
        settings.autoFire !== false ||
        g.keys[' '] ||
        g.keys['Spacebar'] ||
        g.keys['z'] ||
        g.keys['Z'] ||
        g.keys['k'] ||
        g.keys['K'] ||
        g.keys['Enter'] ||
        g.isTouching ||
        joystickActive;

      if (isFiring && g.fireCooldown <= 0) {
        g.fireCooldown = fireRateDelay;
        g.stats.shotsFired++;
        soundEngine.playLaser(g.player.weaponLevel);

        const lvl = g.player.weaponLevel;
        const pX = g.player.x;
        const pY = g.player.y - 18;
        const dmg = 25 * damageMultiplier;

        if (lvl === 1) {
          // Single Plasma Shot
          g.bullets.push({
            id: `b-${Math.random()}`,
            x: pX,
            y: pY,
            vx: 0,
            vy: -14,
            radius: 4,
            isPlayer: true,
            damage: dmg,
            color: '#38bdf8',
          });
        } else if (lvl === 2) {
          // Double Parallel Shots
          g.bullets.push(
            { id: `b1-${Math.random()}`, x: pX - 10, y: pY, vx: 0, vy: -14, radius: 4, isPlayer: true, damage: dmg, color: '#38bdf8' },
            { id: `b2-${Math.random()}`, x: pX + 10, y: pY, vx: 0, vy: -14, radius: 4, isPlayer: true, damage: dmg, color: '#38bdf8' }
          );
        } else if (lvl === 3) {
          // Triple Spread Shots
          g.bullets.push(
            { id: `b1-${Math.random()}`, x: pX - 8, y: pY, vx: -2.5, vy: -14, radius: 4, isPlayer: true, damage: dmg, color: '#06b6d4' },
            { id: `b2-${Math.random()}`, x: pX, y: pY, vx: 0, vy: -15, radius: 4.5, isPlayer: true, damage: dmg * 1.2, color: '#38bdf8' },
            { id: `b3-${Math.random()}`, x: pX + 8, y: pY, vx: 2.5, vy: -14, radius: 4, isPlayer: true, damage: dmg, color: '#06b6d4' }
          );
        } else if (lvl === 4) {
          // Quad Spread + Homing Missiles
          g.bullets.push(
            { id: `b1-${Math.random()}`, x: pX - 14, y: pY, vx: -3.5, vy: -13, radius: 4, isPlayer: true, damage: dmg, color: '#a855f7' },
            { id: `b2-${Math.random()}`, x: pX - 5, y: pY, vx: -1, vy: -15, radius: 4, isPlayer: true, damage: dmg, color: '#38bdf8' },
            { id: `b3-${Math.random()}`, x: pX + 5, y: pY, vx: 1, vy: -15, radius: 4, isPlayer: true, damage: dmg, color: '#38bdf8' },
            { id: `b4-${Math.random()}`, x: pX + 14, y: pY, vx: 3.5, vy: -13, radius: 4, isPlayer: true, damage: dmg, color: '#a855f7' }
          );
        } else {
          // Level 5: Mega Plasma Beam + Quad
          g.bullets.push(
            { id: `b1-${Math.random()}`, x: pX, y: pY - 5, vx: 0, vy: -18, radius: 7, isPlayer: true, damage: dmg * 2.2, color: '#f43f5e', type: 'LASER' },
            { id: `b2-${Math.random()}`, x: pX - 16, y: pY, vx: -4, vy: -14, radius: 4, isPlayer: true, damage: dmg, color: '#38bdf8' },
            { id: `b3-${Math.random()}`, x: pX + 16, y: pY, vx: 4, vy: -14, radius: 4, isPlayer: true, damage: dmg, color: '#38bdf8' }
          );
        }
      }

      // --- FORMATION HOVERING LOGIC ---
      g.gridOffset += 0.8 * g.gridDirection;
      if (Math.abs(g.gridOffset) > 40) {
        g.gridDirection *= -1;
      }

      // --- GALAXIAN SWOOPING ENEMY LOGIC ---
      g.swoopTimer++;
      if (g.swoopTimer > Math.max(60, 160 - stage * 12)) {
        g.swoopTimer = 0;
        // Select 1-2 formation enemies to swoop
        const idleEnemies = g.enemies.filter((e) => e.state === 'IN_FORMATION');
        if (idleEnemies.length > 0) {
          const swoopCount = Math.min(idleEnemies.length, Math.random() > 0.5 ? 2 : 1);
          for (let s = 0; s < swoopCount; s++) {
            const chosen = idleEnemies[Math.floor(Math.random() * idleEnemies.length)];
            chosen.state = 'SWOOPING';
            chosen.swoopProgress = 0;
            chosen.swoopPath = createSwoopPath(
              { x: chosen.x, y: chosen.y },
              { x: g.player.x, y: g.player.y },
              g.width
            );
          }
        }
      }

      // Update Enemies
      g.enemies.forEach((enemy) => {
        if (enemy.state === 'IN_FORMATION') {
          enemy.x = enemy.gridX + g.gridOffset;
          enemy.y = enemy.gridY + Math.sin(g.stageTimer * 0.05 + enemy.gridX) * 5;
        } else if (enemy.state === 'SWOOPING') {
          enemy.swoopProgress += 0.018 * (enemy.speed / 2);
          if (enemy.swoopProgress >= 1) {
            enemy.state = 'RETURNING';
          } else {
            const pathIndex = Math.floor(enemy.swoopProgress * (enemy.swoopPath.length - 1));
            const point = enemy.swoopPath[pathIndex];
            if (point) {
              enemy.x = point.x;
              enemy.y = point.y;
            }
          }
        } else if (enemy.state === 'RETURNING') {
          // Fly back up to grid formation
          const targetX = enemy.gridX + g.gridOffset;
          const targetY = enemy.gridY;

          const dx = targetX - enemy.x;
          const dy = targetY - enemy.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 10) {
            enemy.x = targetX;
            enemy.y = targetY;
            enemy.state = 'IN_FORMATION';
          } else {
            enemy.x += (dx / dist) * enemy.speed * 2;
            enemy.y += (dy / dist) * enemy.speed * 2;
          }
        }

        // Enemy Firing Logic
        enemy.fireTimer++;
        if (enemy.fireTimer >= enemy.fireInterval) {
          enemy.fireTimer = 0;
          if (enemy.state === 'SWOOPING' || Math.random() < 0.3) {
            soundEngine.playEnemyLaser();
            if (enemy.shootPattern === 'SPREAD') {
              [-0.2, 0, 0.2].forEach((angle) => {
                g.bullets.push({
                  id: `eb-${Math.random()}`,
                  x: enemy.x,
                  y: enemy.y + 15,
                  vx: Math.sin(angle) * 5,
                  vy: Math.cos(angle) * 5,
                  radius: 4,
                  isPlayer: false,
                  damage: 15,
                  color: '#f43f5e',
                });
              });
            } else {
              // Aimed shot at player
              const dx = g.player.x - enemy.x;
              const dy = g.player.y - enemy.y;
              const dist = Math.hypot(dx, dy) || 1;
              const bulletSpeed = 4.5 + stage * 0.3;

              g.bullets.push({
                id: `eb-${Math.random()}`,
                x: enemy.x,
                y: enemy.y + 15,
                vx: (dx / dist) * bulletSpeed,
                vy: (dy / dist) * bulletSpeed,
                radius: 4,
                isPlayer: false,
                damage: 15,
                color: enemy.color,
              });
            }
          }
        }
      });

      // --- BOSS AI LOGIC ---
      if (g.boss) {
        const boss = g.boss;
        if (boss.y < boss.gridY) {
          boss.y += 1.5; // Boss entry fly-down
        } else {
          // Boss Hover & Attack Patterns
          boss.x = g.width / 2 + Math.sin(g.stageTimer * 0.03) * (g.width / 3);

          boss.fireTimer++;
          if (boss.fireTimer > boss.fireInterval) {
            boss.fireTimer = 0;
            soundEngine.playEnemyLaser();

            // Multi-phase attack patterns
            const phase = boss.hp < boss.maxHp * 0.3 ? 3 : boss.hp < boss.maxHp * 0.65 ? 2 : 1;
            boss.phase = phase;

            if (phase === 1) {
              // 5-way spread laser
              for (let i = -2; i <= 2; i++) {
                g.bullets.push({
                  id: `bb-${Math.random()}`,
                  x: boss.x + i * 12,
                  y: boss.y + 35,
                  vx: i * 1.8,
                  vy: 5.5,
                  radius: 5,
                  isPlayer: false,
                  damage: 20,
                  color: '#f43f5e',
                });
              }
            } else if (phase === 2) {
              // Radial Ring Attack
              for (let a = 0; a < 10; a++) {
                const angle = (Math.PI * 2 * a) / 10 + g.stageTimer * 0.1;
                g.bullets.push({
                  id: `bb-${Math.random()}`,
                  x: boss.x,
                  y: boss.y + 20,
                  vx: Math.cos(angle) * 4.5,
                  vy: Math.sin(angle) * 4.5,
                  radius: 4,
                  isPlayer: false,
                  damage: 18,
                  color: '#eab308',
                });
              }
            } else {
              // Enraged Phase 3: Targeted Plasma Stream
              for (let i = -3; i <= 3; i++) {
                g.bullets.push({
                  id: `bb-${Math.random()}`,
                  x: boss.x + i * 10,
                  y: boss.y + 35,
                  vx: i * 2.2,
                  vy: 6.5,
                  radius: 5,
                  isPlayer: false,
                  damage: 22,
                  color: '#a855f7',
                });
              }
            }
          }
        }
        onBossHpUpdateRef.current(boss.hp, boss.maxHp, boss.name);
      }

      // --- UPDATE BULLETS & COLLISIONS ---
      g.bullets.forEach((bullet) => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
      });

      // Filter off-screen bullets
      g.bullets = g.bullets.filter(
        (b) => b.x >= -20 && b.x <= g.width + 20 && b.y >= -20 && b.y <= g.height + 20
      );

      // Bullet Collisions
      g.bullets.forEach((bullet) => {
        if (bullet.isPlayer) {
          // Check collision with Enemies
          g.enemies.forEach((enemy) => {
            if (enemy.hp <= 0) return;
            const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
            if (dist < bullet.radius + enemy.width / 2) {
              enemy.hp -= bullet.damage;
              bullet.damage = 0; // Destroy bullet
              g.stats.shotsHit++;

              // Hit particles
              for (let p = 0; p < 4; p++) {
                g.particles.push({
                  x: bullet.x,
                  y: bullet.y,
                  vx: (Math.random() - 0.5) * 4,
                  vy: (Math.random() - 0.5) * 4,
                  radius: 2,
                  color: '#38bdf8',
                  alpha: 1,
                  life: 0,
                  maxLife: 12,
                });
              }

              // Check Enemy Destruction
              if (enemy.hp <= 0) {
                soundEngine.playExplosion(false);
                g.stats.kills++;
                g.player.score += enemy.points;

                // Floating score text
                g.floatingTexts.push({
                  id: `ft-${Math.random()}`,
                  x: enemy.x,
                  y: enemy.y,
                  vy: -1,
                  text: `+${enemy.points}`,
                  color: '#fef08a',
                  alpha: 1,
                  life: 0,
                });

                // Spawn Gems
                const gemCount = Math.floor(Math.random() * 3) + 1;
                for (let i = 0; i < gemCount; i++) {
                  g.gems.push({
                    id: `gem-${Math.random()}`,
                    x: enemy.x + (Math.random() - 0.5) * 15,
                    y: enemy.y + (Math.random() - 0.5) * 15,
                    vx: (Math.random() - 0.5) * 3,
                    vy: -2 - Math.random() * 2,
                    value: 10,
                    radius: 5,
                  });
                }

                // Power-Up Drop (12% chance)
                if (Math.random() < 0.12) {
                  const types: PowerUp['type'][] = ['WEAPON', 'SHIELD', 'BOMB', 'HEAL', 'SPEED'];
                  const type = types[Math.floor(Math.random() * types.length)];
                  g.powerUps.push({
                    id: `pu-${Math.random()}`,
                    type,
                    x: enemy.x,
                    y: enemy.y,
                    vy: 1.8,
                    radius: 12,
                  });
                }

                // Explosion Particles
                for (let p = 0; p < 15; p++) {
                  g.particles.push({
                    x: enemy.x,
                    y: enemy.y,
                    vx: (Math.random() - 0.5) * 6,
                    vy: (Math.random() - 0.5) * 6,
                    radius: 3 + Math.random() * 3,
                    color: enemy.color,
                    alpha: 1,
                    life: 0,
                    maxLife: 25,
                  });
                }
              }
            }
          });

          // Check collision with Boss
          if (g.boss && g.boss.hp > 0) {
            const boss = g.boss;
            const dist = Math.hypot(bullet.x - boss.x, bullet.y - boss.y);
            if (dist < bullet.radius + boss.width / 2) {
              boss.hp -= bullet.damage;
              bullet.damage = 0;
              g.stats.shotsHit++;

              // Hit particles
              for (let p = 0; p < 3; p++) {
                g.particles.push({
                  x: bullet.x,
                  y: bullet.y,
                  vx: (Math.random() - 0.5) * 5,
                  vy: (Math.random() - 0.5) * 5,
                  radius: 2.5,
                  color: '#f43f5e',
                  alpha: 1,
                  life: 0,
                  maxLife: 15,
                });
              }

              if (boss.hp <= 0) {
                soundEngine.playExplosion(true);
                g.stats.kills++;
                g.player.score += boss.points;
                g.screenShakeTimer = 35;
                g.screenShakeIntensity = 15;

                // Big Boss Explosion
                for (let p = 0; p < 60; p++) {
                  g.particles.push({
                    x: boss.x,
                    y: boss.y,
                    vx: (Math.random() - 0.5) * 12,
                    vy: (Math.random() - 0.5) * 12,
                    radius: 4 + Math.random() * 5,
                    color: '#f43f5e',
                    alpha: 1,
                    life: 0,
                    maxLife: 40,
                  });
                }

                // Spawn heap of gems
                for (let i = 0; i < 20; i++) {
                  g.gems.push({
                    id: `gem-${Math.random()}`,
                    x: boss.x + (Math.random() - 0.5) * 40,
                    y: boss.y + (Math.random() - 0.5) * 40,
                    vx: (Math.random() - 0.5) * 6,
                    vy: -3 - Math.random() * 3,
                    value: 20,
                    radius: 6,
                  });
                }

                g.boss = null;
                onBossHpUpdateRef.current(0, 0, null);
              }
            }
          }
        } else {
          // Check Enemy Bullet collision with Player
          if (g.player.invulnerableTimer <= 0) {
            const dist = Math.hypot(bullet.x - g.player.x, bullet.y - g.player.y);
            if (dist < bullet.radius + g.player.width / 2 - 4) {
              bullet.damage = 0; // destroy bullet

              if (g.player.shield > 0) {
                // Shield absorbs hit
                soundEngine.playPowerUp();
                g.floatingTexts.push({
                  id: `ft-${Math.random()}`,
                  x: g.player.x,
                  y: g.player.y - 20,
                  vy: -1,
                  text: 'SHIELDED!',
                  color: '#38bdf8',
                  alpha: 1,
                  life: 0,
                });
              } else {
                // Player takes damage
                soundEngine.playPlayerHit();
                g.player.hp -= 25;
                g.player.invulnerableTimer = 1.2; // brief invulnerability
                g.screenShakeTimer = 15;
                g.screenShakeIntensity = 8;

                if (settings.haptics && navigator.vibrate) {
                  navigator.vibrate(150);
                }

                if (g.player.hp <= 0) {
                  g.player.lives -= 1;
                  if (g.player.lives > 0) {
                    g.player.hp = g.player.maxHp;
                    g.player.weaponLevel = Math.max(1, g.player.weaponLevel - 1);
                    g.player.invulnerableTimer = 2.5;
                  } else {
                    // GAME OVER
                    soundEngine.playExplosion(true);
                    g.gameOver = true;
                    onGameOverRef.current();
                  }
                }

                onUpdatePlayerRef.current(
                  g.player.hp,
                  g.player.maxHp,
                  g.player.lives,
                  g.player.bombs,
                  g.player.shield
                );
              }
            }
          }
        }
      });

      // Remove spent bullets
      g.bullets = g.bullets.filter((b) => b.damage > 0);
      g.enemies = g.enemies.filter((e) => e.hp > 0);

      // --- POWER-UPS LOGIC ---
      g.powerUps.forEach((pu) => {
        pu.y += pu.vy;
        const dist = Math.hypot(pu.x - g.player.x, pu.y - g.player.y);
        if (dist < pu.radius + g.player.width / 2) {
          soundEngine.playPowerUp();

          let text = 'POWER UP!';
          let color = '#38bdf8';

          if (pu.type === 'WEAPON') {
            g.player.weaponLevel = Math.min(5, g.player.weaponLevel + 1);
            text = `LASER LV.${g.player.weaponLevel}!`;
            color = '#38bdf8';
          } else if (pu.type === 'SHIELD') {
            g.player.shield = g.player.maxShield;
            text = 'SHIELD ACTIVE!';
            color = '#06b6d4';
          } else if (pu.type === 'BOMB') {
            g.player.bombs = Math.min(g.player.maxBombs + 1, g.player.bombs + 1);
            text = 'BOMB +1!';
            color = '#a855f7';
          } else if (pu.type === 'HEAL') {
            g.player.hp = Math.min(g.player.maxHp, g.player.hp + 40);
            text = 'HP RESTORED!';
            color = '#22c55e';
          } else if (pu.type === 'SPEED') {
            g.player.speed = Math.min(10, g.player.speed + 1);
            text = 'SPEED BOOST!';
            color = '#eab308';
          }

          g.floatingTexts.push({
            id: `ft-${Math.random()}`,
            x: pu.x,
            y: pu.y,
            vy: -1.2,
            text,
            color,
            alpha: 1,
            life: 0,
          });

          onUpdatePlayerRef.current(
            g.player.hp,
            g.player.maxHp,
            g.player.lives,
            g.player.bombs,
            g.player.shield
          );

          pu.vy = 999; // destroy
        }
      });
      g.powerUps = g.powerUps.filter((pu) => pu.y <= g.height + 20 && pu.vy < 100);

      // --- GEMS MAGNET & COLLECTION ---
      g.gems.forEach((gem) => {
        const dx = g.player.x - gem.x;
        const dy = g.player.y - gem.y;
        const dist = Math.hypot(dx, dy);

        // Pull towards player if inside magnet range
        if (dist < g.player.magnetRange) {
          gem.vx += (dx / dist) * 0.8;
          gem.vy += (dy / dist) * 0.8;
        } else {
          gem.vy += 0.05; // gentle gravity
        }

        gem.x += gem.vx;
        gem.y += gem.vy;

        if (dist < gem.radius + g.player.width / 2) {
          soundEngine.playGemCollect();
          g.player.gems += 1;
          g.stats.gemsCollected += 1;
          gem.vy = 999; // collect
        }
      });
      g.gems = g.gems.filter((g) => g.y <= gameStateRef.current.height + 20 && g.vy < 100);

      // --- STAGE CLEAR CHECK ---
      if (
        g.enemies.length === 0 &&
        !g.boss &&
        !g.stageCleared &&
        !g.gameOver
      ) {
        g.stageCleared = true;
        soundEngine.playStageClear();
        setTimeout(() => {
          onStageClearRef.current();
        }, 1200);
      }

      // --- RENDER GAME ELEMENTS ---
      drawPlayer(ctx, g.player);
      drawEnemies(ctx, g.enemies, g.boss);
      drawBullets(ctx, g.bullets);
      drawPowerUps(ctx, g.powerUps);
      drawGems(ctx, g.gems);
      drawParticles(ctx, g.particles);
      drawFloatingTexts(ctx, g.floatingTexts);

      ctx.restore();

      // Sync stats up to React UI periodically
      onUpdateStatsRef.current({
        score: g.player.score,
        gemsCollected: g.stats.gemsCollected,
        stage: g.stats.stage,
        kills: g.stats.kills,
        shotsFired: g.stats.shotsFired,
        shotsHit: g.stats.shotsHit,
      });

      animId = requestAnimationFrame(updateAndRender);
    };

    animId = requestAnimationFrame(updateAndRender);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [
    isPaused,
    stage,
    settings,
    damageMultiplier,
    fireRateDelay,
    joystickVectorRef,
  ]);

  // RENDER DRAW HELPERS (Vector Neon Aesthetic)
  const drawPlayer = (ctx: CanvasRenderingContext2D, player: Player) => {
    ctx.save();
    ctx.translate(player.x, player.y);

    // Spawn / Invulnerability Pulse Shield Aura (never disappears)
    if (player.invulnerableTimer > 0) {
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.globalAlpha = 0.7 + Math.sin(Date.now() * 0.02) * 0.3;
      ctx.beginPath();
      ctx.arc(0, 0, player.width / 2 + 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Thruster Flame Particle Tail
    const flameH = 12 + Math.random() * 8;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(-6, player.height / 2);
    ctx.lineTo(0, player.height / 2 + flameH);
    ctx.lineTo(6, player.height / 2);
    ctx.closePath();
    ctx.fill();

    // Ship Body (Galaxian Fighter Wings)
    ctx.fillStyle = '#0284c7';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(0, -player.height / 2); // Nose
    ctx.lineTo(player.width / 2, player.height / 2);
    ctx.lineTo(player.width / 4, player.height / 4);
    ctx.lineTo(-player.width / 4, player.height / 4);
    ctx.lineTo(-player.width / 2, player.height / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cockpit Canopy Glow
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.ellipse(0, -4, 6, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shield Forcefield Ring
    if (player.shield > 0) {
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, player.width / 2 + 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  };

  const drawEnemies = (
    ctx: CanvasRenderingContext2D,
    enemies: Enemy[],
    boss: Boss | null
  ) => {
    enemies.forEach((enemy) => {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);

      // Rotate slightly when swooping
      if (enemy.state === 'SWOOPING') {
        ctx.rotate(Math.sin(Date.now() * 0.01) * 0.2);
      }

      ctx.fillStyle = enemy.color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;

      // Draw Retro Alien Vessel shapes depending on type
      if (enemy.type === 'DRONE') {
        // Green Drone beetle shape
        ctx.beginPath();
        ctx.arc(0, 0, 14, Math.PI, 0);
        ctx.lineTo(12, 12);
        ctx.lineTo(-12, 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (enemy.type === 'INTERCEPTOR') {
        // Purple Interceptor winged fighter
        ctx.beginPath();
        ctx.moveTo(0, 14);
        ctx.lineTo(16, -10);
        ctx.lineTo(0, -4);
        ctx.lineTo(-16, -10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (enemy.type === 'COMMANDER') {
        // Red Commander flagship
        ctx.beginPath();
        ctx.moveTo(0, 16);
        ctx.lineTo(18, -8);
        ctx.lineTo(10, -16);
        ctx.lineTo(-10, -16);
        ctx.lineTo(-18, -8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        // Elite Gold
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Enemy eyes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-6, -2, 4, 4);
      ctx.fillRect(2, -2, 4, 4);

      ctx.restore();
    });

    // Draw Boss Vessel
    if (boss) {
      ctx.save();
      ctx.translate(boss.x, boss.y);

      ctx.fillStyle = boss.color;
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 3;
      ctx.shadowColor = boss.color;
      ctx.shadowBlur = 15;

      // Giant Mothership Wings
      ctx.beginPath();
      ctx.moveTo(0, 40);
      ctx.lineTo(48, -20);
      ctx.lineTo(30, -40);
      ctx.lineTo(-30, -40);
      ctx.lineTo(-48, -20);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Boss Core Glow
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.restore();
    }
  };

  const drawBullets = (ctx: CanvasRenderingContext2D, bullets: Bullet[]) => {
    bullets.forEach((b) => {
      ctx.save();
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 8;

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  };

  const drawPowerUps = (ctx: CanvasRenderingContext2D, powerUps: PowerUp[]) => {
    powerUps.forEach((pu) => {
      ctx.save();
      ctx.translate(pu.x, pu.y);

      let color = '#38bdf8';
      let symbol = 'W';
      if (pu.type === 'SHIELD') {
        color = '#06b6d4';
        symbol = 'S';
      } else if (pu.type === 'BOMB') {
        color = '#a855f7';
        symbol = 'B';
      } else if (pu.type === 'HEAL') {
        color = '#22c55e';
        symbol = '+';
      } else if (pu.type === 'SPEED') {
        color = '#eab308';
        symbol = '⚡';
      }

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, pu.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(symbol, 0, 1);

      ctx.restore();
    });
  };

  const drawGems = (ctx: CanvasRenderingContext2D, gems: Gem[]) => {
    gems.forEach((gem) => {
      ctx.save();
      ctx.translate(gem.x, gem.y);
      ctx.rotate(Date.now() * 0.005);

      ctx.fillStyle = '#fef08a';
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1;

      // Diamond Star Gem Shape
      ctx.beginPath();
      ctx.moveTo(0, -gem.radius);
      ctx.lineTo(gem.radius, 0);
      ctx.lineTo(0, gem.radius);
      ctx.lineTo(-gem.radius, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    });
  };

  const drawParticles = (ctx: CanvasRenderingContext2D, particles: Particle[]) => {
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life++;
      p.alpha = 1 - p.life / p.maxLife;

      if (p.alpha > 0) {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });

    gameStateRef.current.particles = particles.filter((p) => p.life < p.maxLife);
  };

  const drawFloatingTexts = (
    ctx: CanvasRenderingContext2D,
    floatingTexts: FloatingText[]
  ) => {
    floatingTexts.forEach((ft) => {
      ft.y += ft.vy;
      ft.life += 0.02;
      ft.alpha = Math.max(0, 1 - ft.life);

      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    gameStateRef.current.floatingTexts = floatingTexts.filter((ft) => ft.life < 1);
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-slate-950 overflow-hidden touch-none select-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full max-w-[500px] max-h-[800px] aspect-[2/3] object-contain shadow-2xl rounded-lg border border-slate-800 cursor-crosshair"
      />
    </div>
  );
};
