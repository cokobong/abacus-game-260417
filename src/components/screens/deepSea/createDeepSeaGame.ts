import Phaser from 'phaser';
import { DEEP_SEA_STAGE_1_MAP, DEEP_SEA_STAGE_2_MAP, deepSeaTileKey, type DeepSeaDirection, type DeepSeaDiscoveryKind, type DeepSeaMapConfig, type DeepSeaPatrolConfig, type DeepSeaTilePoint } from '../../../config/deepSea';

const GAME_WIDTH = 768;
const GAME_HEIGHT = 900;
const PLAYER_SPEED = 245;
const INVINCIBLE_MS = 1300;

export interface DeepSeaGameCallbacks {
  onDiscovery: (id: DeepSeaDiscoveryKind, label: string, rewardCoins: number) => void;
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
  private hazards: Array<{ visual: Phaser.GameObjects.Container; config: DeepSeaPatrolConfig; targetIndex: number }> = [];
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
          graphics.fillStyle((row + column) % 3 === 0 ? 0x173744 : 0x12303b, 1).fillRect(x, y, size, size);
          graphics.lineStyle(2, 0x285666, 0.9).strokeRect(x + 2, y + 2, size - 4, size - 4);
          graphics.fillStyle(0x244b55, 0.7).fillCircle(x + size * 0.3, y + size * 0.35, size * 0.13);
        } else {
          let floorColor = (row + column) % 2 === 0 ? 0x0b2b37 : 0x0d303d;
          if (this.mapConfig.stage === 2) {
            if (column <= 10 && row <= 10) floorColor = (row + column) % 2 ? 0x163845 : 0x193f48; // 산호 구역
            else if (column >= 25 && row <= 11) floorColor = (row + column) % 2 ? 0x263746 : 0x2c4050; // 보물 구역
            else if (column >= 25 && row <= 23) floorColor = (row + column) % 2 ? 0x291f3e : 0x302447; // 위험 생물 구역
            else if (column >= 12 && column <= 23 && row >= 12 && row <= 23) floorColor = (row + column) % 2 ? 0x24383b : 0x293f40; // 유적 구역
          }
          graphics.fillStyle(floorColor, 1).fillRect(x, y, size, size);
          graphics.lineStyle(1, 0x164653, 0.45).strokeRect(x, y, size, size);
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
      if (!this.exitUnlocked && this.discovered.size >= this.mapConfig.requiredDiscoveries) {
        this.exitUnlocked = true;
        this.exitVisual?.setFillStyle(0x2c9f7b, 0.9).setStrokeStyle(8, 0x8effcf);
        this.callbacks.onExitUnlocked();
      }
    }
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
      return { visual: this.add.container(start.x, start.y, [body, tail]).setDepth(15), config, targetIndex: 1 };
    });
  }

  private updateHazards(time: number, delta: number) {
    if (!this.player) return;
    const cameraView = this.cameras.main.worldView;
    for (const hazard of this.hazards) {
      const visual = hazard.visual;
      if (!cameraView.contains(visual.x, visual.y)) continue;
      const target = this.center(hazard.config.points[hazard.targetIndex]);
      const distance = Phaser.Math.Distance.Between(visual.x, visual.y, target.x, target.y);
      const movement = hazard.config.speedTilesPerSecond * this.mapConfig.tileSize * delta / 1000;
      if (distance <= movement) {
        visual.setPosition(target.x, target.y);
        hazard.targetIndex = (hazard.targetIndex + 1) % hazard.config.points.length;
      } else {
        visual.x += Math.sign(target.x - visual.x) * movement;
        visual.y += Math.sign(target.y - visual.y) * movement;
        visual.setScale(target.x >= visual.x ? 1 : -1, 1);
      }
      if (time < this.invincibleUntil || Phaser.Math.Distance.Between(this.player.x, this.player.y, visual.x, visual.y) > 43) continue;
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
