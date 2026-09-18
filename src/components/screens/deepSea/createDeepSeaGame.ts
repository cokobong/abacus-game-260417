import Phaser from 'phaser';
import { DEEP_SEA_STAGE_1_MAP, DEEP_SEA_STAGE_2_MAP, deepSeaTileKey, type DeepSeaDirection, type DeepSeaDiscoveryKind, type DeepSeaMapConfig, type DeepSeaPatrolConfig, type DeepSeaPickupKind, type DeepSeaTilePoint } from '../../../config/deepSea';

const GAME_WIDTH = 768;
const GAME_HEIGHT = 900;
const PLAYER_SPEED = 245;
const INVINCIBLE_MS = 1300;

export interface DeepSeaGameCallbacks {
  onDiscovery: (id: DeepSeaDiscoveryKind, label: string, rewardCoins: number) => void;
  onPickup: (kind: DeepSeaPickupKind, label: string, rewardCoins: number) => void;
  onHealthChange: (health: number) => void;
  onExitUnlocked: () => void;
  onStageClear: () => void;
  onFailure: () => void;
  onSonarUsesChange: (uses: number) => void;
}

export interface DeepSeaGameController {
  setDirection: (direction: DeepSeaDirection | null) => void;
  useSonar: () => boolean;
  destroy: () => void;
}

const DIRECTION_STEP: Record<DeepSeaDirection, DeepSeaTilePoint> = {
  up: { column: 0, row: -1 },
  down: { column: 0, row: 1 },
  left: { column: -1, row: 0 },
  right: { column: 1, row: 0 },
};

class DeepSeaScene extends Phaser.Scene {
  private player?: Phaser.GameObjects.Container;
  private heldDirection: DeepSeaDirection | null = null;
  private playerTile: DeepSeaTilePoint;
  private moveTarget: DeepSeaTilePoint | null = null;
  private discovered = new Set<DeepSeaDiscoveryKind>();
  private exitUnlocked = false;
  private health = 3;
  private invincibleUntil = 0;
  private finished = false;
  private exitVisual?: Phaser.GameObjects.Arc;
  private hazards: Array<{ visual: Phaser.GameObjects.Container; config: DeepSeaPatrolConfig; targetIndex: number; home: Phaser.Math.Vector2; active: boolean }> = [];
  private collectedPickups = new Set<string>();
  private pickupVisuals = new Map<string, Phaser.GameObjects.Container>();
  private fog?: Phaser.GameObjects.Graphics;
  private sonarUses: number;
  private sonarActive = false;

  constructor(private readonly mapConfig: DeepSeaMapConfig, private readonly callbacks: DeepSeaGameCallbacks) {
    super(`DeepSeaStage${mapConfig.stage}`);
    this.playerTile = { ...mapConfig.playerStart };
    this.sonarUses = mapConfig.sonarUses;
  }

  create() {
    this.cameras.main.setBackgroundColor('#031923');
    this.drawWorld();
    this.createDiscoveries();
    this.createPickups();
    this.createExit();
    this.createHazards();
    this.createPlayer();
    this.cameras.main.setBounds(0, 0, this.mapConfig.columns * this.mapConfig.tileSize, this.mapConfig.rows * this.mapConfig.tileSize);
    this.cameras.main.centerOn(this.player!.x, this.player!.y);
    this.cameras.main.startFollow(this.player!, true, 0.14, 0.14);
    this.cameras.main.setDeadzone(this.mapConfig.tileSize * 1.4, this.mapConfig.tileSize * 1.8);
    this.cameras.main.setZoom(this.mapConfig.cameraZoom);
    this.createFog();
    this.callbacks.onSonarUsesChange(this.sonarUses);
    this.checkDiscoveries();
  }

  update(time: number, delta: number) {
    if (this.finished || !this.player) return;
    this.updatePlayer(delta);
    this.updateHazards(time, delta);
  }

  setDirection(direction: DeepSeaDirection | null) {
    this.heldDirection = direction;
  }

  useSonar() {
    if (this.finished || this.sonarUses <= 0 || this.sonarActive) return false;
    this.sonarUses -= 1;
    this.sonarActive = true;
    this.callbacks.onSonarUsesChange(this.sonarUses);
    this.renderFog();
    const pulse = this.add.circle(this.player!.x, this.player!.y, this.mapConfig.tileSize, 0x76e9ff, 0.08)
      .setStrokeStyle(5, 0x8af2ff, 0.9).setDepth(49);
    this.tweens.add({ targets: pulse, scale: this.mapConfig.sonarRadiusTiles, alpha: 0, duration: 700, onComplete: () => pulse.destroy() });
    this.time.delayedCall(1800, () => { this.sonarActive = false; this.renderFog(); });
    return true;
  }

  private center(point: DeepSeaTilePoint) {
    return {
      x: (point.column + 0.5) * this.mapConfig.tileSize,
      y: (point.row + 0.5) * this.mapConfig.tileSize,
    };
  }

  private isFloor(point: DeepSeaTilePoint) {
    return point.column >= 0 && point.row >= 0 && point.column < this.mapConfig.columns && point.row < this.mapConfig.rows
      && !this.mapConfig.walls.has(deepSeaTileKey(point));
  }

  private drawWorld() {
    const graphics = this.add.graphics();
    const size = this.mapConfig.tileSize;
    for (let row = 0; row < this.mapConfig.rows; row += 1) {
      for (let column = 0; column < this.mapConfig.columns; column += 1) {
        const wall = this.mapConfig.walls.has(deepSeaTileKey({ column, row }));
        const x = column * size;
        const y = row * size;
        if (wall) {
          const wallColor = this.mapConfig.stage === 2 ? ((row + column) % 3 === 0 ? 0x071923 : 0x091e29) : ((row + column) % 3 === 0 ? 0x173744 : 0x12303b);
          graphics.fillStyle(wallColor, 1).fillRect(x, y, size, size);
          graphics.lineStyle(3, this.mapConfig.stage === 2 ? 0x183c49 : 0x285666, 1).strokeRect(x + 2, y + 2, size - 4, size - 4);
          if ((row * 3 + column) % 4 === 0) graphics.fillStyle(this.mapConfig.stage === 2 ? 0x102f3b : 0x244b55, 0.8).fillCircle(x + size * 0.3, y + size * 0.35, size * 0.13);
        } else {
          let floorColor = (row + column) % 2 === 0 ? 0x0b2b37 : 0x0d303d;
          if (this.mapConfig.stage === 2) {
            floorColor = (row + column) % 2 ? 0x245463 : 0x285d6b;
            if (column <= 10 && row <= 10) floorColor = (row + column) % 2 ? 0x315f64 : 0x356970; // 산호 구역
            else if (column >= 25 && row <= 11) floorColor = (row + column) % 2 ? 0x3b5666 : 0x405e70; // 보물 구역
            else if (column >= 25 && row <= 23) floorColor = (row + column) % 2 ? 0x443b62 : 0x4b426b; // 위험 생물 구역
            else if (column >= 12 && column <= 23 && row >= 12 && row <= 23) floorColor = (row + column) % 2 ? 0x385a59 : 0x3e6260; // 유적 구역
          }
          graphics.fillStyle(floorColor, 1).fillRect(x, y, size, size);
          graphics.lineStyle(this.mapConfig.stage === 2 ? 2 : 1, this.mapConfig.stage === 2 ? 0x4f7d88 : 0x164653, this.mapConfig.stage === 2 ? 0.7 : 0.45).strokeRect(x + 1, y + 1, size - 2, size - 2);
        }
      }
    }
  }

  private createPlayer() {
    const position = this.center(this.playerTile);
    const body = this.add.ellipse(0, 0, 45, 31, 0xf2c94c).setStrokeStyle(4, 0xfff1a6);
    const window = this.add.circle(7, -2, 7, 0x8ee7ff).setStrokeStyle(2, 0xffffff);
    const nose = this.add.triangle(25, 0, 0, -9, 14, 0, 0, 9, 0xf2c94c);
    this.player = this.add.container(position.x, position.y, [body, window, nose]).setDepth(20);
  }

  private updatePlayer(delta: number) {
    if (!this.player) return;
    if (!this.moveTarget && this.heldDirection) {
      const step = DIRECTION_STEP[this.heldDirection];
      const next = { column: this.playerTile.column + step.column, row: this.playerTile.row + step.row };
      if (this.isFloor(next)) {
        this.moveTarget = next;
        const angles: Record<DeepSeaDirection, number> = { right: 0, down: 90, left: 180, up: 270 };
        this.player.setAngle(angles[this.heldDirection]);
      }
    }
    if (!this.moveTarget) return;
    const target = this.center(this.moveTarget);
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, target.x, target.y);
    const movement = PLAYER_SPEED * delta / 1000;
    if (distance <= movement) {
      this.player.setPosition(target.x, target.y);
      this.playerTile = this.moveTarget;
      this.moveTarget = null;
      this.checkDiscoveries();
      this.checkPickups();
      this.checkExit();
      this.renderFog();
      return;
    }
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y);
    this.player.x += Math.cos(angle) * movement;
    this.player.y += Math.sin(angle) * movement;
  }

  private createDiscoveries() {
    this.mapConfig.discoveries.forEach(item => {
      const { x, y } = this.center(item);
      if (item.id === 'coral') {
        this.add.circle(x - 13, y + 7, 15, 0xff6f91).setStrokeStyle(3, 0xffb0c2).setDepth(8);
        this.add.circle(x + 12, y - 5, 18, 0xf45b89).setStrokeStyle(3, 0xffb0c2).setDepth(8);
      } else if (item.id === 'statue') {
        this.add.rectangle(x, y + 4, 34, 46, 0x8fa5a7).setStrokeStyle(4, 0xcad8d8).setDepth(8);
        this.add.circle(x, y - 23, 14, 0x8fa5a7).setStrokeStyle(4, 0xcad8d8).setDepth(8);
      } else {
        this.add.rectangle(x, y, 46, 35, 0xa96c23).setStrokeStyle(4, 0xffcf5a).setDepth(8);
        this.add.rectangle(x, y - 11, 46, 7, 0xffcf5a).setDepth(9);
      }
      this.add.text(x, y + 35, item.label, { fontFamily: 'sans-serif', fontSize: '15px', color: '#dffaff', backgroundColor: '#052631' })
        .setOrigin(0.5, 0).setPadding(4, 2).setDepth(9);
    });
  }

  private checkDiscoveries() {
    for (const item of this.mapConfig.discoveries) {
      if (this.discovered.has(item.id)) continue;
      const distance = Math.abs(item.column - this.playerTile.column) + Math.abs(item.row - this.playerTile.row);
      if (distance > 1) continue;
      this.discovered.add(item.id);
      this.callbacks.onDiscovery(item.id, item.label, item.rewardCoins ?? 0);
      this.showPickupBurst(item);
      if (!this.exitUnlocked && this.discovered.size >= this.mapConfig.requiredDiscoveries) {
        this.exitUnlocked = true;
        this.exitVisual?.setFillStyle(0x2c9f7b, 0.9).setStrokeStyle(8, 0x8effcf);
        if (this.exitVisual) this.tweens.add({ targets: this.exitVisual, scale: 1.16, duration: 260, yoyo: true, repeat: 1, ease: 'Sine.InOut' });
        this.callbacks.onExitUnlocked();
      }
    }
  }

  private createPickups() {
    this.mapConfig.pickups?.forEach(item => {
      const { x, y } = this.center(item);
      const objects: Phaser.GameObjects.GameObject[] = [];
      if (item.kind === 'coin') {
        objects.push(this.add.circle(0, 0, 13, 0xffd85a).setStrokeStyle(4, 0xfff3a0));
        objects.push(this.add.text(0, 0, '★', { color: '#9b6415', fontSize: '14px', fontStyle: 'bold' }).setOrigin(0.5));
      } else if (item.kind === 'smallChest') {
        objects.push(this.add.rectangle(0, 2, 38, 29, 0xa96c23).setStrokeStyle(4, 0xffcf5a));
        objects.push(this.add.rectangle(0, -7, 38, 6, 0xffcf5a));
      } else if (item.kind === 'repair') {
        objects.push(this.add.circle(0, 0, 17, 0x65dfbd).setStrokeStyle(4, 0xc8fff0));
        objects.push(this.add.text(0, 0, '+', { color: '#164b43', fontSize: '22px', fontStyle: 'bold' }).setOrigin(0.5));
      } else {
        objects.push(this.add.circle(0, 0, 17, 0x65cbea).setStrokeStyle(4, 0xd3f7ff));
        objects.push(this.add.text(0, 0, '◉', { color: '#174b68', fontSize: '19px', fontStyle: 'bold' }).setOrigin(0.5));
      }
      const visual = this.add.container(x, y, objects).setDepth(11);
      this.pickupVisuals.set(item.id, visual);
    });
  }

  private checkPickups() {
    for (const item of this.mapConfig.pickups ?? []) {
      if (this.collectedPickups.has(item.id) || item.column !== this.playerTile.column || item.row !== this.playerTile.row) continue;
      this.collectedPickups.add(item.id);
      const visual = this.pickupVisuals.get(item.id);
      if (visual) {
        visual.destroy(true);
        this.pickupVisuals.delete(item.id);
      }
      if (item.healthRestore) {
        this.health = Math.min(3, this.health + item.healthRestore);
        this.callbacks.onHealthChange(this.health);
      }
      if (item.sonarRestore) {
        this.sonarUses = Math.min(this.mapConfig.sonarUses, this.sonarUses + item.sonarRestore);
        this.callbacks.onSonarUsesChange(this.sonarUses);
      }
      this.callbacks.onPickup(item.kind, item.label, item.rewardCoins ?? 0);
      this.showPickupBurst(item);
    }
  }

  private showPickupBurst(point: DeepSeaTilePoint) {
    const { x, y } = this.center(point);
    const burst = this.add.circle(x, y, 12, 0xffef9c, 0.18).setStrokeStyle(4, 0xffef9c, 0.9).setDepth(30);
    this.tweens.add({ targets: burst, scale: 2.8, alpha: 0, duration: 360, onComplete: () => burst.destroy() });
  }

  private createExit() {
    const { x, y } = this.center(this.mapConfig.exit);
    this.exitVisual = this.add.circle(x, y, 27, 0x233944, 1).setStrokeStyle(8, 0x6b7d84).setDepth(8);
    this.add.text(x, y + 36, '출구', { fontFamily: 'sans-serif', fontSize: '16px', color: '#e9ffff', backgroundColor: '#052631' })
      .setOrigin(0.5, 0).setPadding(5, 2).setDepth(9);
  }

  private checkExit() {
    if (!this.exitUnlocked || this.playerTile.column !== this.mapConfig.exit.column || this.playerTile.row !== this.mapConfig.exit.row) return;
    this.finished = true;
    this.heldDirection = null;
    this.callbacks.onStageClear();
  }

  private createFog() {
    this.fog = this.add.graphics().setDepth(50);
    this.renderFog();
  }

  private renderFog() {
    if (!this.fog) return;
    this.fog.clear();
    const radius = this.sonarActive ? this.mapConfig.sonarRadiusTiles : this.mapConfig.visionRadiusTiles;
    const size = this.mapConfig.tileSize;
    this.fog.fillStyle(0x010b12, this.mapConfig.stage === 1 ? 0.42 : 0.86);
    for (let row = 0; row < this.mapConfig.rows; row += 1) {
      for (let column = 0; column < this.mapConfig.columns; column += 1) {
        if (Phaser.Math.Distance.Between(column, row, this.playerTile.column, this.playerTile.row) <= radius) continue;
        this.fog.fillRect(column * size, row * size, size + 1, size + 1);
      }
    }
  }

  private createHazards() {
    this.hazards = this.mapConfig.patrols.map(config => {
      const start = this.center(config.points[0]);
      const body = config.kind === 'octopus'
        ? this.add.circle(0, 0, 22, 0x9b63c7).setStrokeStyle(3, 0xe1b4ff)
        : this.add.ellipse(0, 0, 54, 25, 0xd35f5f).setStrokeStyle(3, 0xffb3a8);
      const tail = config.kind === 'octopus'
        ? this.add.star(0, 18, 5, 10, 22, 0x74449f)
        : this.add.triangle(-33, 0, 0, -13, 0, 13, 17, 0, 0xb84747);
      return { visual: this.add.container(start.x, start.y, [body, tail]).setDepth(15), config, targetIndex: config.points.length > 1 ? 1 : 0, home: new Phaser.Math.Vector2(start.x, start.y), active: false };
    });
  }

  private updateHazards(time: number, delta: number) {
    if (!this.player) return;
    const cameraView = this.cameras.main.worldView;
    for (const hazard of this.hazards) {
      const visual = hazard.visual;
      if (!cameraView.contains(visual.x, visual.y)) continue;
      const playerDistance = Phaser.Math.Distance.Between(this.player.x, this.player.y, visual.x, visual.y);
      const detectionRadius = (hazard.config.detectionRadiusTiles ?? 0) * this.mapConfig.tileSize;
      hazard.active = detectionRadius > 0 && playerDistance <= detectionRadius;
      let target = this.center(hazard.config.points[hazard.targetIndex]);
      let speedMultiplier = 1;
      if (hazard.config.behavior === 'chase' && hazard.active) {
        target = { x: this.player.x, y: this.player.y };
        speedMultiplier = hazard.config.activeSpeedMultiplier ?? 1.25;
      } else if (hazard.config.behavior === 'ambush') {
        const leash = (hazard.config.leashRadiusTiles ?? 2) * this.mapConfig.tileSize;
        const distanceFromHome = Phaser.Math.Distance.Between(visual.x, visual.y, hazard.home.x, hazard.home.y);
        if (hazard.active && distanceFromHome < leash) {
          target = { x: this.player.x, y: this.player.y };
          speedMultiplier = hazard.config.activeSpeedMultiplier ?? 1.1;
        } else {
          target = { x: hazard.home.x, y: hazard.home.y };
        }
      }
      const distance = Phaser.Math.Distance.Between(visual.x, visual.y, target.x, target.y);
      const movement = hazard.config.speedTilesPerSecond * speedMultiplier * this.mapConfig.tileSize * delta / 1000;
      if (distance <= movement) {
        visual.setPosition(target.x, target.y);
        if (!hazard.active && hazard.config.points.length > 1) hazard.targetIndex = (hazard.targetIndex + 1) % hazard.config.points.length;
      } else {
        const angle = Phaser.Math.Angle.Between(visual.x, visual.y, target.x, target.y);
        visual.x += Math.cos(angle) * movement;
        visual.y += Math.sin(angle) * movement;
      }
      const facing = target.x >= visual.x ? 1 : -1;
      const idleMotion = hazard.config.kind === 'octopus' ? 1 + Math.sin(time * 0.008) * 0.08 : 1 + Math.sin(time * 0.012) * 0.035;
      visual.setScale(facing * idleMotion, idleMotion).setAngle(hazard.config.kind === 'octopus' ? Math.sin(time * 0.006) * 5 : Math.sin(time * 0.01) * 3);
      visual.setAlpha(hazard.active ? 1 : 0.88);
      if (time < this.invincibleUntil || playerDistance > 43) continue;
      this.invincibleUntil = time + INVINCIBLE_MS;
      this.health -= 1;
      this.callbacks.onHealthChange(this.health);
      this.tweens.add({ targets: this.player, alpha: 0.25, yoyo: true, repeat: 5, duration: 100 });
      if (this.health <= 0) {
        this.finished = true;
        this.heldDirection = null;
        this.callbacks.onFailure();
      }
    }
  }
}

export function createDeepSeaGame(parent: HTMLElement, stage: 1 | 2, callbacks: DeepSeaGameCallbacks): DeepSeaGameController {
  const mapConfig = stage === 1 ? DEEP_SEA_STAGE_1_MAP : DEEP_SEA_STAGE_2_MAP;
  let scene: DeepSeaScene | undefined;
  class ActiveScene extends DeepSeaScene {
    constructor() {
      super(mapConfig, callbacks);
      scene = this;
    }
  }
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#031923',
    render: { antialias: true, pixelArt: false, roundPixels: true },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: ActiveScene,
    input: { activePointers: 3 },
  });
  return {
    setDirection: direction => scene?.setDirection(direction),
    useSonar: () => scene?.useSonar() ?? false,
    destroy: () => { scene = undefined; game.destroy(true); },
  };
}
