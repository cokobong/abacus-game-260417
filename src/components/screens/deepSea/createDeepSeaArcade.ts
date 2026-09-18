import Phaser from 'phaser';
import { ARCADE_DIRECTIONS, ARCADE_STAGE_2_TUNING as TUNING, arcadeDistance, arcadeIsFloor, arcadeKey, arcadeNeighbors, arcadeNextStep, type ArcadeDirection, type ArcadePoint } from '../../../config/deepSea/arcadeStage2';
import type { DeepSeaStageConfig } from '../../../config/deepSea/arcadeStages';
import type { ArcadeGate, ArcadeEnemyKind } from '../../../config/deepSea/arcadeStages';
import { canJellyfishHold, getStage3GateState, type Stage3GateState } from '../../../config/deepSea/arcadeStage3';
import { DEEP_SEA_ASSETS as ART, deepSeaTreasureAsset, type DeepSeaAsset } from '../../../config/deepSea/arcadeAssets';

const WIDTH = 768;
const HEIGHT = 900;
// Contact circles stay inside the placeholder art; wall movement is tile based.
const PLAYER_HIT_RADIUS = 14;
const ENEMY_HIT_RADIUS = 14;
type EnemyState = 'PATROL' | 'CHASE' | 'RETURN' | 'FLEE' | 'STUNNED';
type Enemy = { id: string; kind: ArcadeEnemyKind; home: ArcadePoint; tile: ArcadePoint; target: ArcadePoint | null; visual: Phaser.GameObjects.Container; hull: Phaser.GameObjects.Image; state: EnemyState; wakeAt: number; safeUntil: number; patrolIndex: number; touchingPlayer: boolean };
type Gate = { config: ArcadeGate; state: Stage3GateState | null; visual: Phaser.GameObjects.Image };

export interface ArcadeCallbacks {
  onPosition: (point: ArcadePoint) => void;
  onCoin: (total: number) => void;
  onTreasure: (id: string, label: string, count: number) => void;
  onHealth: (health: number) => void;
  onPower: (remainingSeconds: number) => void;
  onExitReady: () => void;
  onClear: () => void;
  onFail: () => void;
  onTutorialEvent?: (id: string) => void;
  onGateStates?: (states: Record<string, Stage3GateState>) => void;
  onJellyfishHold?: () => void;
}

class ArcadeScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private playerHull!: Phaser.GameObjects.Image;
  private jellyfishWrap!: Phaser.GameObjects.Ellipse;
  private playerTile: ArcadePoint;
  private playerTarget: ArcadePoint | null = null;
  private direction: ArcadeDirection | null = null;
  private queued: ArcadeDirection | null = null;
  private heldDirection: ArcadeDirection | null = null;
  private enemies: Enemy[] = [];
  private gates: Gate[] = [];
  private readonly walkable: Set<string>;
  private coins = new Map<string, Phaser.GameObjects.Container>();
  private treasures = new Map<string, Phaser.GameObjects.Container>();
  private orbs = new Map<string, Phaser.GameObjects.Image>();
  private exit!: Phaser.GameObjects.Container;
  private exitGate!: Phaser.GameObjects.Image;
  private collectedTreasures = new Set<string>();
  private coinTotal = 0;
  private health = 3;
  private invincibleUntil = 0;
  private powerUntil = 0;
  private powerWasActive = false;
  private powerGraceUntil = 0;
  private jellyfishHoldUntil = 0;
  private jellyfishGraceUntil = 0;
  private lastPowerSecond = -1;
  private finished = false;
  private pausedForTutorial = false;
  private moved = false;
  private firstTurn = false;
  private poweredOnce = false;
  private readonly BOARD;

  constructor(private readonly config: DeepSeaStageConfig, private readonly callbacks: ArcadeCallbacks) {
    super(`DeepSeaArcade-${config.id}`);
    this.BOARD = config.board;
    this.walkable = new Set(config.board.floor);
    this.playerTile = { ...config.board.playerStart };
  }
  private event(id: string) { this.callbacks.onTutorialEvent?.(id); }
  setTutorialPaused(paused: boolean) { this.pausedForTutorial = paused; this.time.paused = paused; if (paused) this.setDirection(null); }
  private center(point: ArcadePoint) { return { x: (point.column + .5) * this.BOARD.tileSize, y: (point.row + .5) * this.BOARD.tileSize }; }

  preload() {
    const playerArt = this.config.id === '1-1' ? [ART.player.normal] : Object.values(ART.player);
    const enemyArt = this.BOARD.enemyStarts.map(enemy => ART.enemy[enemy.kind]);
    const assets: DeepSeaAsset[] = [
      ...playerArt, ...enemyArt, ART.world.wall,
      ART.exit.locked, ART.exit.active, ART.pickup.coin, ART.pickup.orb,
      this.config.id === '3' ? ART.background.stage3 : this.config.id === '2' ? ART.background.stage2 : ART.background.stage1,
      ...this.BOARD.treasures.map(item => deepSeaTreasureAsset(item.id)).filter((item): item is DeepSeaAsset => item !== null),
      ART.world.rock, ART.world.ruins, ART.world.seaweed, ART.world.coral, ART.world.wreck,
    ];
    if (this.BOARD.gates?.length) assets.push(...Object.values(ART.gate));
    for (const item of new Map(assets.map(item => [item.key, item])).values()) this.load.image(item.key, item.url);
  }

  // Two tutorial treasures do not have matching art in this delivery.
  private makeTreasureVisual(id: string, x: number, y: number) {
    const art = deepSeaTreasureAsset(id);
    if (art) return this.add.container(x, y, [this.add.image(0, 0, art.key).setDisplaySize(this.BOARD.tileSize * .88, this.BOARD.tileSize * .88)]).setDepth(8);
    const color = id === 'gold-jar' ? 0xf1c458 : id === 'broken-crown' ? 0xf49aa8 : 0x7ad2ff;
    return this.add.container(x, y, [this.add.rectangle(0, 0, 34, 34, color).setStrokeStyle(3, 0xffffff), this.add.star(0, -4, 5, 6, 14, 0xffffff)]).setDepth(8);
  }
  private makeEnemyVisual(kind: Enemy['kind'], x: number, y: number) {
    const size = this.BOARD.tileSize * (kind === 'shark' ? 1.08 : kind === 'jellyfish' ? .9 : 1);
    const hull = this.add.image(0, 0, ART.enemy[kind].key).setDisplaySize(size, size);
    return { hull, visual: this.add.container(x, y, [hull]).setDepth(16) };
  }

  private updateGates(time: number) {
    let changed = false;
    for (const gate of this.gates) {
      const key = arcadeKey(gate.config);
      let next = getStage3GateState(gate.config, time);
      if (next === 'CLOSED' && (arcadeKey(this.playerTile) === key || (this.playerTarget && arcadeKey(this.playerTarget) === key)
        || this.enemies.some(enemy => arcadeKey(enemy.tile) === key || (enemy.target && arcadeKey(enemy.target) === key)))) next = 'WARNING';
      gate.visual.setAlpha(next === 'WARNING' ? .65 + Math.sin(time * .014) * .35 : 1);
      if (next === gate.state) continue;
      gate.state = next; changed = true;
      if (next === 'CLOSED') this.walkable.delete(key); else this.walkable.add(key);
      gate.visual.setTexture(ART.gate[next === 'CLOSED' ? 'closed' : next === 'WARNING' ? 'warning' : 'open'].key);
    }
    if (changed) this.callbacks.onGateStates?.(Object.fromEntries(this.gates.map(gate => [gate.config.id, gate.state!])));
  }

  create() {
    const BOARD = this.BOARD;
    const size = BOARD.tileSize;
    this.cameras.main.setBackgroundColor('#061620');
    const worldWidth = BOARD.columns * size;
    const worldHeight = BOARD.rows * size;
    const background = this.config.id === '3' ? ART.background.stage3 : this.config.id === '2' ? ART.background.stage2 : ART.background.stage1;
    this.add.image(worldWidth / 2, worldHeight / 2, background.key).setDisplaySize(worldWidth, worldHeight)
      .setAlpha(this.config.id === '3' ? .8 : this.config.id === '2' ? .85 : .9).setDepth(-2);
    const world = this.add.graphics();
    const decor = [ART.world.rock, ART.world.ruins, ART.world.seaweed, ART.world.coral, ART.world.wreck];
    for (let row = 0; row < BOARD.rows; row += 1) for (let column = 0; column < BOARD.columns; column += 1) {
      const x = column * size; const y = row * size;
      if (!arcadeIsFloor({ column, row }, BOARD.floor)) {
        world.fillStyle(0x071a28, .78).fillRect(x, y, size, size);
        if (arcadeNeighbors({ column, row }, BOARD.floor).length) {
          this.add.image(x + size / 2, y + size / 2, ART.world.wall.key).setDisplaySize(size * 1.3, size * 1.3).setTint(0x698996).setDepth(2);
          if ((column * 7 + row * 11) % 47 === 0) {
            const object = decor[(column + row) % decor.length];
            this.add.image(x + size / 2, y + size / 2, object.key).setDisplaySize(size * .68, size * .68).setAlpha(.8).setDepth(3);
          }
        }
      }
    }
    for (const point of BOARD.coins) {
      const { x, y } = this.center(point);
      const coin = this.add.container(x, y, [this.add.image(0, 0, ART.pickup.coin.key).setDisplaySize(size * .42, size * .42)]).setDepth(5);
      this.coins.set(arcadeKey(point), coin);
    }
    for (const item of BOARD.treasures) {
      const { x, y } = this.center(item);
      this.treasures.set(item.id, this.makeTreasureVisual(item.id, x, y));
    }
    for (const point of BOARD.orbs) {
      const { x, y } = this.center(point);
      this.orbs.set(arcadeKey(point), this.add.image(x, y, ART.pickup.orb.key).setDisplaySize(size * .72, size * .72).setDepth(7));
    }
    const exitPos = this.center(BOARD.exit);
    this.exitGate = this.add.image(0, 0, ART.exit.locked.key).setDisplaySize(size * 1.5, size * 1.5);
    this.exit = this.add.container(exitPos.x, exitPos.y, [this.exitGate]).setDepth(6);
    const start = this.center(this.playerTile);
    this.playerHull = this.add.image(0, 0, ART.player.normal.key).setDisplaySize(size * .9, size * .9);
    this.player = this.add.container(start.x, start.y, [this.playerHull]).setDepth(20);
    this.jellyfishWrap = this.add.ellipse(0, 0, 53, 47, 0x7be0ee, .18).setStrokeStyle(4, 0xa2f6ff).setVisible(false);
    this.player.add(this.jellyfishWrap);
    this.enemies = BOARD.enemyStarts.map(config => {
      const home = { column: config.column, row: config.row };
      const pos = this.center(home);
      const kind = config.kind;
      const { visual, hull } = this.makeEnemyVisual(kind, pos.x, pos.y);
      return { id: config.id, kind, home, tile: home, target: null, visual, hull, state: 'PATROL' as EnemyState, wakeAt: 0, safeUntil: 0, patrolIndex: 0, touchingPlayer: false };
    });
    this.gates = (BOARD.gates ?? []).map(config => {
      const { x, y } = this.center(config);
      return { config, state: null, visual: this.add.image(x, y, ART.gate.open.key).setDisplaySize(size * 1.1, size * 1.1).setDepth(9) };
    });
    this.updateGates(this.time.now);
    this.cameras.main.setBounds(0, 0, BOARD.columns * size, BOARD.rows * size);
    this.cameras.main.setZoom(this.config.cameraZoom ?? TUNING.cameraZoom);
    this.cameras.main.startFollow(this.player, true, TUNING.cameraLerp, TUNING.cameraLerp);
    this.cameras.main.centerOn(this.player.x, this.player.y);
    this.callbacks.onPosition(this.playerTile);
    this.collectAtPlayer();
    if (this.config.id === '1-1') this.event('movement_intro');
  }

  setDirection(direction: ArcadeDirection | null) {
    if (this.pausedForTutorial && direction) return;
    this.heldDirection = direction;
    if (!direction) {
      this.queued = null;
      return;
    }
    if (this.playerTarget && this.direction &&
      ARCADE_DIRECTIONS[direction].column === -ARCADE_DIRECTIONS[this.direction].column &&
      ARCADE_DIRECTIONS[direction].row === -ARCADE_DIRECTIONS[this.direction].row) {
      // Turn back from the current pixel position without asking for a tile-center tap.
      this.playerTarget = arcadeKey(this.playerTarget) === arcadeKey(this.playerTile)
        ? this.nextTile(this.playerTile, direction)
        : this.playerTile;
      this.direction = direction;
      this.queued = null;
      this.player.setAngle({ right: 0, down: 90, left: 180, up: 270 }[direction]);
    } else if (this.direction && direction !== this.direction) {
      this.queued = direction;
      if (this.config.id === '1-1' && !this.firstTurn) { this.firstTurn = true; this.event('buffered_turn'); }
    } else {
      this.direction = direction;
      this.queued = null;
    }
  }

  private moveObject(object: Phaser.GameObjects.Container, target: ArcadePoint, pixels: number, snapAllowance = 0) {
    const { x, y } = this.center(target);
    const dx = x - object.x; const dy = y - object.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= pixels + snapAllowance) { object.setPosition(x, y); return true; }
    object.setPosition(object.x + dx / distance * pixels, object.y + dy / distance * pixels);
    return false;
  }

  update(time: number, delta: number) {
    if (this.finished || this.pausedForTutorial) return;
    if (this.powerWasActive && time >= this.powerUntil) {
      this.powerWasActive = false;
      this.powerGraceUntil = time + TUNING.powerEndGraceMs;
      this.setPlayerColor();
    }
    const BOARD = this.BOARD;
    const step = Math.min(delta, 50) / 1000;
    if (this.gates.length) this.updateGates(time);
    if (this.jellyfishHoldUntil && time >= this.jellyfishHoldUntil) {
      this.jellyfishHoldUntil = 0;
      this.jellyfishGraceUntil = time + (this.config.jellyfishRecontactGraceMs ?? 400);
      this.jellyfishWrap.setVisible(false);
    }
    const heldByJellyfish = time < this.jellyfishHoldUntil;
    if (heldByJellyfish) this.jellyfishWrap.setAlpha(.65 + Math.sin(time * .015) * .35);
    if (!heldByJellyfish && this.heldDirection && !this.playerTarget) {
      const nextDirection = this.queued && this.nextTile(this.playerTile, this.queued) ? this.queued : this.direction;
      if (nextDirection) {
        const next = this.nextTile(this.playerTile, nextDirection);
        if (next) {
          this.direction = nextDirection;
          this.queued = null;
          this.playerTarget = next;
          this.player.setAngle({ right: 0, down: 90, left: 180, up: 270 }[nextDirection]);
        }
      }
    }
    const turnAllowance = this.playerTarget && this.queued && this.nextTile(this.playerTarget, this.queued) ? TUNING.turnSnapDistance : 0;
    if (!heldByJellyfish && this.heldDirection && this.playerTarget && this.moveObject(this.player, this.playerTarget, TUNING.playerSpeed * step, turnAllowance)) {
      this.playerTile = this.playerTarget; this.playerTarget = null;
      this.callbacks.onPosition(this.playerTile);
      if (!this.moved) { this.moved = true; this.event('first_move'); }
      if (this.config.id === '1-1' && arcadeDistance(this.playerTile, { column: 6, row: 10 }) <= 2) this.event('buffered_turn');
      if (this.config.id === '1-2' && arcadeDistance(this.playerTile, BOARD.enemyStarts[0]) <= 5) this.event('first_enemy');
      if (this.config.id === '1-2' && BOARD.orbs.some(orb => arcadeDistance(this.playerTile, orb) <= 2)) this.event('first_powerup');
      if (this.config.id === '1-3' && BOARD.treasures.some(treasure => arcadeDistance(this.playerTile, treasure) <= 2)) this.event('treasure_approach');
      this.collectAtPlayer();
      if (this.isExitReady() && arcadeKey(this.playerTile) === arcadeKey(BOARD.exit)) {
        this.finished = true; this.callbacks.onClear(); return;
      }
    }
    const powerSeconds = Math.max(0, Math.ceil((this.powerUntil - time) / 1000));
    if (powerSeconds !== this.lastPowerSecond) { this.lastPowerSecond = powerSeconds; this.callbacks.onPower(powerSeconds); }
    this.player.setAlpha(time < this.invincibleUntil || time < this.powerGraceUntil ? (.55 + Math.sin(time * .025) * .3) : 1);
    for (const enemy of this.enemies) this.updateEnemy(enemy, time, step);
  }

  private nextTile(point: ArcadePoint, direction: ArcadeDirection) {
    const step = ARCADE_DIRECTIONS[direction];
    const next = { column: point.column + step.column, row: point.row + step.row };
    return arcadeIsFloor(next, this.walkable) ? next : null;
  }

  private isExitReady() {
    return this.config.exitRule === 'coins' ? this.coinTotal >= this.config.coinGoal
      : this.config.exitRule === 'power' ? this.poweredOnce
        : this.collectedTreasures.size === this.BOARD.treasures.length;
  }
  private openExit() {
    this.exitGate.setTexture(ART.exit.active.key);
    this.tweens.add({ targets: this.exit, scale: 1.18, yoyo: true, repeat: -1, duration: 600 });
    this.callbacks.onExitReady();
  }

  private collectAtPlayer() {
    const BOARD = this.BOARD;
    const key = arcadeKey(this.playerTile);
    const coin = this.coins.get(key);
    if (coin) {
      this.coins.delete(key);
      this.tweens.add({ targets: coin, scale: 1.8, alpha: 0, duration: 180, onComplete: () => coin.destroy(true) });
      this.coinTotal += 1; this.callbacks.onCoin(this.coinTotal);
      if (this.config.id === '1-1') this.event('first_coin');
      if (this.config.exitRule === 'coins' && this.isExitReady()) this.openExit();
    }
    for (const item of BOARD.treasures) if (arcadeKey(item) === key && !this.collectedTreasures.has(item.id)) {
      this.collectedTreasures.add(item.id);
      this.treasures.get(item.id)?.destroy(true);
      this.callbacks.onTreasure(item.id, item.label, this.collectedTreasures.size);
      if (this.config.id === '1-3') this.event(this.collectedTreasures.size === 1 ? 'first_treasure' : this.collectedTreasures.size === 2 ? 'second_treasure' : 'third_treasure');
      if (this.config.exitRule === 'treasures' && this.isExitReady()) this.openExit();
    }
    const orb = this.orbs.get(key);
    if (orb) {
      this.orbs.delete(key); orb.destroy();
      this.powerUntil = this.time.now + (this.config.powerDurationMs ?? TUNING.powerupDurationMs);
      this.powerWasActive = true;
      this.powerGraceUntil = 0;
      this.jellyfishHoldUntil = 0;
      this.jellyfishWrap.setVisible(false);
      if (!this.poweredOnce) { this.poweredOnce = true; if (this.config.exitRule === 'power') this.openExit(); }
      this.setPlayerColor();
    }
  }

  private enemyGoal(enemy: Enemy, time: number): ArcadePoint {
    if (time < this.powerUntil) {
      enemy.state = 'FLEE';
      return arcadeNeighbors(enemy.tile, this.walkable).sort((a, b) => arcadeDistance(b, this.playerTile) - arcadeDistance(a, this.playerTile))[0] ?? enemy.tile;
    }
    const distance = arcadeDistance(enemy.tile, this.playerTile);
    if (enemy.kind === 'shark' && distance <= TUNING.sharkChaseRange) { enemy.state = 'CHASE'; return this.playerTile; }
    if (enemy.kind === 'octopus' && distance <= TUNING.octopusChaseRange) {
      enemy.state = 'CHASE';
      const ahead = this.direction ? ARCADE_DIRECTIONS[this.direction] : { column: 0, row: 0 };
      const intercept = { column: this.playerTile.column + ahead.column * 3, row: this.playerTile.row + ahead.row * 3 };
      return arcadeIsFloor(intercept, this.walkable) ? intercept : arcadeNeighbors(this.playerTile, this.walkable).find(tile => arcadeDistance(tile, intercept) < arcadeDistance(this.playerTile, intercept)) ?? this.playerTile;
    }
    if (arcadeDistance(enemy.tile, enemy.home) > 4) { enemy.state = 'RETURN'; return enemy.home; }
    enemy.state = 'PATROL';
    const patrol = arcadeNeighbors(enemy.home, this.walkable).filter(tile => enemy.kind !== 'jellyfish' || arcadeDistance(tile, this.BOARD.exit) > 2);
    if (!patrol.length) return enemy.home;
    const goal = patrol[enemy.patrolIndex % patrol.length];
    if (arcadeKey(goal) === arcadeKey(enemy.tile)) enemy.patrolIndex += 1;
    return patrol[enemy.patrolIndex % patrol.length];
  }

  private updateEnemy(enemy: Enemy, time: number, delta: number) {
    if (enemy.state === 'STUNNED') {
      if (time < enemy.wakeAt) return;
      if (arcadeDistance(enemy.home, this.playerTile) < TUNING.respawnSafeDistance) { enemy.wakeAt = time + 350; return; }
      enemy.tile = enemy.home; enemy.target = null;
      const home = this.center(enemy.home);
      enemy.visual.setPosition(home.x, home.y).setVisible(true).setAlpha(.45);
      enemy.safeUntil = time + TUNING.invulnerabilityDurationMs; enemy.state = 'RETURN'; enemy.touchingPlayer = false;
    }
    if (!enemy.target) {
      const goal = this.enemyGoal(enemy, time);
      const desired = enemy.state === 'FLEE' ? goal : arcadeNextStep(enemy.tile, goal, this.walkable);
      const reserved = (point: ArcadePoint) => this.enemies.some(other => other !== enemy && (arcadeKey(other.target ?? other.tile) === arcadeKey(point)));
      const allowed = (tile: ArcadePoint) => enemy.kind !== 'jellyfish' || arcadeDistance(tile, this.BOARD.exit) > 2;
      enemy.target = !reserved(desired) && allowed(desired) ? desired : arcadeNeighbors(enemy.tile, this.walkable)
        .filter(next => !reserved(next) && allowed(next))
        .sort((a, b) => enemy.state === 'FLEE' ? arcadeDistance(b, this.playerTile) - arcadeDistance(a, this.playerTile) : arcadeDistance(a, goal) - arcadeDistance(b, goal))[0] ?? null;
      if (enemy.target && arcadeKey(enemy.target) === arcadeKey(enemy.tile)) enemy.target = null;
    }
    const enemySpeed = enemy.kind === 'jellyfish' ? this.config.jellyfishSpeed ?? 72
      : enemy.kind === 'octopus' ? TUNING.octopusSpeed : enemy.state === 'CHASE' ? TUNING.sharkChaseSpeed : TUNING.sharkPatrolSpeed;
    if (enemy.target && this.moveObject(enemy.visual, enemy.target, enemySpeed * this.config.enemySpeed * delta)) {
      enemy.tile = enemy.target; enemy.target = null;
    }
    enemy.visual.setAlpha(time < enemy.safeUntil ? .45 : 1);
    if (enemy.state === 'FLEE') enemy.hull.setTint(0x8fe6ff);
    else enemy.hull.clearTint();
    const contactDistance = Phaser.Math.Distance.Between(enemy.visual.x, enemy.visual.y, this.player.x, this.player.y);
    if (contactDistance > PLAYER_HIT_RADIUS + ENEMY_HIT_RADIUS + 8) enemy.touchingPlayer = false;
    if (time < enemy.safeUntil || contactDistance > PLAYER_HIT_RADIUS + ENEMY_HIT_RADIUS) return;
    if (time < this.powerUntil) {
      enemy.state = 'STUNNED'; enemy.wakeAt = time + 2600; enemy.target = null; enemy.visual.setVisible(false); enemy.touchingPlayer = false;
      if (enemy.kind === 'jellyfish') { this.jellyfishHoldUntil = 0; this.jellyfishWrap.setVisible(false); }
      this.coinTotal += 2; this.callbacks.onCoin(this.coinTotal);
      if (this.config.id === '1-2') this.event('powered_hit');
      return;
    }
    if (enemy.kind === 'jellyfish') {
      if (canJellyfishHold(time, this.powerUntil, this.jellyfishHoldUntil, this.jellyfishGraceUntil, enemy.touchingPlayer)) {
        enemy.touchingPlayer = true;
        this.jellyfishHoldUntil = time + (this.config.jellyfishHoldDurationMs ?? 1800);
        this.jellyfishWrap.setVisible(true);
        this.callbacks.onJellyfishHold?.();
      }
      return;
    }
    if (!this.config.damageEnabled) return;
    if (enemy.touchingPlayer) return;
    enemy.touchingPlayer = true;
    if (time < this.invincibleUntil || time < this.powerGraceUntil) return;
    this.health -= 1; this.invincibleUntil = time + TUNING.invulnerabilityDurationMs; this.callbacks.onHealth(this.health);
    if (this.config.id === '1-2') this.event('first_hit');
    this.setPlayerColor();
    if (this.health <= 0) { this.finished = true; this.time.delayedCall(500, () => this.callbacks.onFail()); }
  }

  private setPlayerColor() {
    this.playerHull.setTexture(this.time.now < this.powerUntil ? ART.player.powered.key
      : this.health === 3 ? ART.player.normal.key : this.health === 2 ? ART.player.damaged.key : ART.player.critical.key);
  }
}

export function createDeepSeaArcade(parent: HTMLElement, config: DeepSeaStageConfig, callbacks: ArcadeCallbacks) {
  let scene: ArcadeScene | undefined;
  class ActiveScene extends ArcadeScene { constructor() { super(config, callbacks); scene = this; } }
  const game = new Phaser.Game({ type: Phaser.AUTO, parent, width: WIDTH, height: HEIGHT, backgroundColor: '#061620', render: { antialias: false, roundPixels: true }, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, scene: ActiveScene, input: { activePointers: 3 } });
  return { setDirection: (direction: ArcadeDirection | null) => scene?.setDirection(direction), setTutorialPaused: (paused: boolean) => scene?.setTutorialPaused(paused), destroy: () => { scene = undefined; game.destroy(true); } };
}
