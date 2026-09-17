import Phaser from 'phaser';
import { ARCADE_DIRECTIONS, ARCADE_STAGE_2 as BOARD, arcadeDistance, arcadeIsFloor, arcadeKey, arcadeNeighbors, arcadeNextStep, type ArcadeDirection, type ArcadePoint } from '../../../config/deepSea/arcadeStage2';

const WIDTH = 768;
const HEIGHT = 900;
const POWER_MS = 7000;
const INVINCIBLE_MS = 1300;
const PLAYER_SCALE = 1.18;
const ENEMY_SCALE = 1.12;
const PLAYER_HIT_RADIUS = 18;
const ENEMY_HIT_RADIUS = 17;
const TURN_ASSIST_PX = BOARD.tileSize * .14;
type EnemyState = 'PATROL' | 'CHASE' | 'RETURN' | 'FLEE' | 'STUNNED';
type Enemy = { id: string; kind: 'shark' | 'octopus'; home: ArcadePoint; tile: ArcadePoint; target: ArcadePoint | null; visual: Phaser.GameObjects.Container; state: EnemyState; wakeAt: number; safeUntil: number; patrolIndex: number };

export interface ArcadeCallbacks {
  onPosition: (point: ArcadePoint) => void;
  onCoin: (total: number) => void;
  onTreasure: (id: string, label: string, count: number) => void;
  onHealth: (health: number) => void;
  onPower: (remainingSeconds: number) => void;
  onExitReady: () => void;
  onClear: () => void;
  onFail: () => void;
}

class ArcadeScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private playerTile: ArcadePoint = { ...BOARD.playerStart };
  private playerTarget: ArcadePoint | null = null;
  private direction: ArcadeDirection | null = null;
  private queued: ArcadeDirection | null = null;
  private heldDirection: ArcadeDirection | null = null;
  private enemies: Enemy[] = [];
  private coins = new Map<string, Phaser.GameObjects.Container>();
  private treasures = new Map<string, Phaser.GameObjects.Container>();
  private orbs = new Map<string, Phaser.GameObjects.Arc>();
  private exit!: Phaser.GameObjects.Container;
  private collectedTreasures = new Set<string>();
  private coinTotal = 0;
  private health = 3;
  private invincibleUntil = 0;
  private powerUntil = 0;
  private lastPowerSecond = -1;
  private finished = false;

  constructor(private readonly callbacks: ArcadeCallbacks) { super('DeepSeaArcadeStage2'); }
  private center(point: ArcadePoint) { return { x: (point.column + .5) * BOARD.tileSize, y: (point.row + .5) * BOARD.tileSize }; }

  create() {
    const size = BOARD.tileSize;
    this.cameras.main.setBackgroundColor('#061620');
    const world = this.add.graphics();
    for (let row = 0; row < BOARD.rows; row += 1) for (let column = 0; column < BOARD.columns; column += 1) {
      const x = column * size; const y = row * size;
      if (arcadeIsFloor({ column, row })) {
        world.fillStyle((row + column) % 2 ? 0x124252 : 0x164a59).fillRect(x, y, size, size);
        world.lineStyle(1, 0x346877, .35).strokeRect(x + 1, y + 1, size - 2, size - 2);
      } else {
        world.fillStyle(0x071a28).fillRect(x, y, size, size);
        if (arcadeNeighbors({ column, row }).length) world.lineStyle(2, 0x36758b).strokeRect(x + 2, y + 2, size - 4, size - 4);
      }
    }
    for (const point of BOARD.coins) {
      const { x, y } = this.center(point);
      const coin = this.add.container(x, y, [this.add.circle(0, 0, 9, 0xffd657).setStrokeStyle(2, 0xfff2a3)]).setDepth(5);
      this.coins.set(arcadeKey(point), coin);
    }
    for (const item of BOARD.treasures) {
      const { x, y } = this.center(item);
      const color = item.id === 'gold-jar' ? 0xf1c458 : item.id === 'broken-crown' ? 0xf49aa8 : 0x7ad2ff;
      const visual = this.add.container(x, y, [this.add.rectangle(0, 0, 34, 34, color).setStrokeStyle(3, 0xffffff), this.add.star(0, -4, 5, 6, 14, 0xffffff)]).setDepth(8);
      this.treasures.set(item.id, visual);
    }
    for (const point of BOARD.orbs) {
      const { x, y } = this.center(point);
      this.orbs.set(arcadeKey(point), this.add.circle(x, y, 19, 0x80ebff).setStrokeStyle(4, 0xffffff).setDepth(7));
    }
    const exitPos = this.center(BOARD.exit);
    this.exit = this.add.container(exitPos.x, exitPos.y, [this.add.circle(0, 0, 23, 0x2b4350).setStrokeStyle(4, 0x80949e), this.add.text(0, 0, '출구', { fontSize: '15px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(.5)]).setDepth(6);
    const start = this.center(this.playerTile);
    this.player = this.add.container(start.x, start.y, [this.add.ellipse(0, 0, 35, 25, 0xffd05b).setStrokeStyle(3, 0xfff1a7), this.add.circle(5, -2, 6, 0x9deaff), this.add.triangle(20, 0, 0, -7, 12, 0, 0, 7, 0xffd05b)]).setScale(PLAYER_SCALE).setDepth(20);
    this.enemies = BOARD.enemyStarts.map(config => {
      const home = { column: config.column, row: config.row };
      const pos = this.center(home);
      const kind = config.kind;
      const visual = this.add.container(pos.x, pos.y, kind === 'shark'
        ? [this.add.ellipse(0, 0, 34, 23, 0xea6672).setStrokeStyle(3, 0xffb5bd), this.add.triangle(-21, 0, 0, -10, 0, 10, 12, 0, 0xd94c61)]
        : [this.add.circle(0, -3, 17, 0xb883ed).setStrokeStyle(3, 0xe5c7ff), this.add.star(0, 15, 5, 9, 17, 0x8758c8)]).setScale(ENEMY_SCALE).setDepth(16);
      return { id: config.id, kind, home, tile: home, target: null, visual, state: 'PATROL' as EnemyState, wakeAt: 0, safeUntil: 0, patrolIndex: 0 };
    });
    this.cameras.main.setBounds(0, 0, BOARD.columns * size, BOARD.rows * size);
    this.cameras.main.setZoom(1.1);
    this.cameras.main.startFollow(this.player, true, .18, .18);
    this.cameras.main.centerOn(this.player.x, this.player.y);
    this.callbacks.onPosition(this.playerTile);
    this.collectAtPlayer();
  }

  setDirection(direction: ArcadeDirection | null) {
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
    if (this.finished) return;
    const step = Math.min(delta, 50) / 1000;
    if (this.heldDirection && !this.playerTarget) {
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
    const turnAllowance = this.playerTarget && this.queued && this.nextTile(this.playerTarget, this.queued) ? TURN_ASSIST_PX : 0;
    if (this.heldDirection && this.playerTarget && this.moveObject(this.player, this.playerTarget, 260 * step, turnAllowance)) {
      this.playerTile = this.playerTarget; this.playerTarget = null;
      this.callbacks.onPosition(this.playerTile);
      this.collectAtPlayer();
      if (this.collectedTreasures.size === 3 && arcadeKey(this.playerTile) === arcadeKey(BOARD.exit)) {
        this.finished = true; this.callbacks.onClear(); return;
      }
    }
    const powerSeconds = Math.max(0, Math.ceil((this.powerUntil - time) / 1000));
    if (powerSeconds !== this.lastPowerSecond) { this.lastPowerSecond = powerSeconds; this.callbacks.onPower(powerSeconds); }
    this.player.setAlpha(time < this.invincibleUntil ? (.55 + Math.sin(time * .025) * .3) : 1);
    for (const enemy of this.enemies) this.updateEnemy(enemy, time, step);
  }

  private nextTile(point: ArcadePoint, direction: ArcadeDirection) {
    const step = ARCADE_DIRECTIONS[direction];
    const next = { column: point.column + step.column, row: point.row + step.row };
    return arcadeIsFloor(next) ? next : null;
  }

  private collectAtPlayer() {
    const key = arcadeKey(this.playerTile);
    const coin = this.coins.get(key);
    if (coin) {
      this.coins.delete(key);
      this.tweens.add({ targets: coin, scale: 1.8, alpha: 0, duration: 180, onComplete: () => coin.destroy(true) });
      this.coinTotal += 1; this.callbacks.onCoin(this.coinTotal);
    }
    for (const item of BOARD.treasures) if (arcadeKey(item) === key && !this.collectedTreasures.has(item.id)) {
      this.collectedTreasures.add(item.id);
      this.treasures.get(item.id)?.destroy(true);
      this.callbacks.onTreasure(item.id, item.label, this.collectedTreasures.size);
      if (this.collectedTreasures.size === 3) {
        (this.exit.list[0] as Phaser.GameObjects.Arc).setFillStyle(0x40c993).setStrokeStyle(4, 0xccffe9);
        this.tweens.add({ targets: this.exit, scale: 1.22, yoyo: true, repeat: 2, duration: 260 });
        this.callbacks.onExitReady();
      }
    }
    const orb = this.orbs.get(key);
    if (orb) {
      this.orbs.delete(key); orb.destroy();
      this.powerUntil = this.time.now + POWER_MS;
      (this.player.list[0] as Phaser.GameObjects.Ellipse).setFillStyle(0x81eaff);
      this.time.delayedCall(POWER_MS, () => { if (this.time.now >= this.powerUntil) this.setPlayerColor(); });
    }
  }

  private enemyGoal(enemy: Enemy, time: number): ArcadePoint {
    if (time < this.powerUntil) {
      enemy.state = 'FLEE';
      return arcadeNeighbors(enemy.tile).sort((a, b) => arcadeDistance(b, this.playerTile) - arcadeDistance(a, this.playerTile))[0] ?? enemy.tile;
    }
    const distance = arcadeDistance(enemy.tile, this.playerTile);
    if (enemy.kind === 'shark' && distance <= 7) { enemy.state = 'CHASE'; return this.playerTile; }
    if (enemy.kind === 'octopus' && distance <= 6) {
      enemy.state = 'CHASE';
      const ahead = this.direction ? ARCADE_DIRECTIONS[this.direction] : { column: 0, row: 0 };
      const intercept = { column: this.playerTile.column + ahead.column * 3, row: this.playerTile.row + ahead.row * 3 };
      return arcadeIsFloor(intercept) ? intercept : arcadeNeighbors(this.playerTile).find(tile => arcadeDistance(tile, intercept) < arcadeDistance(this.playerTile, intercept)) ?? this.playerTile;
    }
    if (arcadeDistance(enemy.tile, enemy.home) > 4) { enemy.state = 'RETURN'; return enemy.home; }
    enemy.state = 'PATROL';
    const patrol = arcadeNeighbors(enemy.home);
    if (!patrol.length) return enemy.home;
    const goal = patrol[enemy.patrolIndex % patrol.length];
    if (arcadeKey(goal) === arcadeKey(enemy.tile)) enemy.patrolIndex += 1;
    return patrol[enemy.patrolIndex % patrol.length];
  }

  private updateEnemy(enemy: Enemy, time: number, delta: number) {
    if (enemy.state === 'STUNNED') {
      if (time < enemy.wakeAt) return;
      enemy.tile = enemy.home; enemy.target = null;
      const home = this.center(enemy.home);
      enemy.visual.setPosition(home.x, home.y).setVisible(true).setAlpha(.45);
      enemy.safeUntil = time + 1300; enemy.state = 'RETURN';
    }
    if (!enemy.target) {
      const goal = this.enemyGoal(enemy, time);
      enemy.target = enemy.state === 'FLEE' ? goal : arcadeNextStep(enemy.tile, goal);
      if (arcadeKey(enemy.target) === arcadeKey(enemy.tile)) enemy.target = null;
    }
    if (enemy.target && this.moveObject(enemy.visual, enemy.target, (enemy.kind === 'shark' ? 145 : 118) * delta)) {
      enemy.tile = enemy.target; enemy.target = null;
    }
    enemy.visual.setAlpha(time < enemy.safeUntil ? .45 : 1);
    (enemy.visual.list[0] as Phaser.GameObjects.Shape).setFillStyle(enemy.state === 'FLEE' ? 0x77d5ff : enemy.kind === 'shark' ? 0xea6672 : 0xb883ed);
    if (time < enemy.safeUntil || Phaser.Math.Distance.Between(enemy.visual.x, enemy.visual.y, this.player.x, this.player.y) > PLAYER_HIT_RADIUS + ENEMY_HIT_RADIUS) return;
    if (time < this.powerUntil) {
      enemy.state = 'STUNNED'; enemy.wakeAt = time + 2600; enemy.target = null; enemy.visual.setVisible(false);
      this.coinTotal += 2; this.callbacks.onCoin(this.coinTotal);
      return;
    }
    if (time < this.invincibleUntil) return;
    this.health -= 1; this.invincibleUntil = time + INVINCIBLE_MS; this.callbacks.onHealth(this.health);
    this.setPlayerColor();
    if (this.health <= 0) { this.finished = true; this.callbacks.onFail(); }
  }

  private setPlayerColor() {
    (this.player.list[0] as Phaser.GameObjects.Ellipse).setFillStyle(this.time.now < this.powerUntil ? 0x81eaff : this.health === 3 ? 0xffd05b : this.health === 2 ? 0xf49a50 : 0xe95f65);
  }
}

export function createDeepSeaArcade(parent: HTMLElement, callbacks: ArcadeCallbacks) {
  let scene: ArcadeScene | undefined;
  class ActiveScene extends ArcadeScene { constructor() { super(callbacks); scene = this; } }
  const game = new Phaser.Game({ type: Phaser.AUTO, parent, width: WIDTH, height: HEIGHT, backgroundColor: '#061620', render: { antialias: false, roundPixels: true }, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, scene: ActiveScene, input: { activePointers: 3 } });
  return { setDirection: (direction: ArcadeDirection | null) => scene?.setDirection(direction), destroy: () => { scene = undefined; game.destroy(true); } };
}
