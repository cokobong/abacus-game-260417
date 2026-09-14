import Phaser from 'phaser';
import { getRuinsMirrorObstacles, getRuinsMirrorSource, RUINS_MIRROR_STAGE_1_MISSIONS, RUINS_MIRROR_STAGE_2_MISSIONS, type RuinsMirrorDefinition, type RuinsMirrorOrientation, type RuinsMirrorPuzzleConfig } from '../../../config/ruinsMirror';
import { traceRuinsMirrorBeam, type RuinsMirrorBeamSegment } from '../../../utils/ruinsMirrorBeam';

const GAME_WIDTH = 768;
const GAME_HEIGHT = 820;

export interface RuinsMirrorGameCallbacks {
  onMissionChange: (mission: number, title: string, instruction: string) => void;
  onInventoryChange: (remaining: number, total: number) => void;
  onStageComplete: () => void;
}

export interface RuinsMirrorGameController {
  resetMission: () => void;
  destroy: () => void;
}

type GridPoint = { column: number; row: number };

class PuzzleBoard {
  readonly originX: number;
  readonly originY: number;
  readonly cellSize: number;

  constructor(private readonly scene: Phaser.Scene, readonly config: RuinsMirrorPuzzleConfig) {
    const boardSize = config.grid.columns === 5 ? 690 : 672;
    this.cellSize = boardSize / config.grid.columns;
    this.originX = (GAME_WIDTH - boardSize) / 2;
    this.originY = 70 + (680 - boardSize) / 2;
  }

  draw() {
    const graphics = this.scene.add.graphics();
    const width = this.cellSize * this.config.grid.columns;
    const height = this.cellSize * this.config.grid.rows;
    graphics.fillStyle(0x3f352e, 1).fillRoundedRect(this.originX - 14, this.originY - 14, width + 28, height + 28, 22);
    graphics.lineStyle(4, 0xb9955a, 1).strokeRoundedRect(this.originX - 14, this.originY - 14, width + 28, height + 28, 22);
    for (let row = 0; row < this.config.grid.rows; row += 1) {
      for (let column = 0; column < this.config.grid.columns; column += 1) {
        const { x, y } = this.cellCenter({ column, row });
        const isFiveByFive = this.config.grid.columns === 5;
        const inset = isFiveByFive ? 2 : 4;
        const shade = isFiveByFive ? ((row + column) % 2 === 0 ? 0x5c5145 : 0x574c41) : ((row + column) % 2 === 0 ? 0x756452 : 0x695947);
        graphics.fillStyle(shade, 1).fillRoundedRect(x - this.cellSize / 2 + inset, y - this.cellSize / 2 + inset, this.cellSize - inset * 2, this.cellSize - inset * 2, 10);
        graphics.lineStyle(isFiveByFive ? 1 : 2, 0x9b825f, isFiveByFive ? 0.35 : 0.7).strokeRoundedRect(x - this.cellSize / 2 + inset, y - this.cellSize / 2 + inset, this.cellSize - inset * 2, this.cellSize - inset * 2, 10);
      }
    }
    getRuinsMirrorObstacles(this.config).forEach(blocker => {
      const { x, y } = this.cellCenter(blocker);
      const radius = this.cellSize * 0.31;
      graphics.fillStyle(0x2c3431, 1).fillRoundedRect(x - radius, y - radius, radius * 2, radius * 2, 14);
      graphics.lineStyle(5, 0x99a092, 1).strokeRoundedRect(x - radius, y - radius, radius * 2, radius * 2, 14);
      graphics.lineStyle(4, 0x56625b, 1).beginPath().moveTo(x - radius * 0.55, y - radius * 0.6).lineTo(x + radius * 0.5, y + radius * 0.55).strokePath();
    });
  }

  cellCenter(point: GridPoint) {
    return {
      x: this.originX + (point.column + 0.5) * this.cellSize,
      y: this.originY + (point.row + 0.5) * this.cellSize,
    };
  }

  contains(point: GridPoint) {
    return point.column >= 0 && point.row >= 0 && point.column < this.config.grid.columns && point.row < this.config.grid.rows;
  }
}

class MirrorSystem {
  private readonly orientations = new Map<string, RuinsMirrorOrientation>();
  private readonly installed = new Map<string, { orientation: RuinsMirrorOrientation; objects: Phaser.GameObjects.GameObject[] }>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly board: PuzzleBoard,
    private readonly config: RuinsMirrorPuzzleConfig,
    private readonly onRotate: () => void,
    private readonly onInventoryChange: (remaining: number, total: number) => void,
  ) {}

  create() {
    if (this.config.mode === 'placement') {
      this.createPlacementSlots();
      this.notifyInventory();
      return;
    }
    this.config.mirrors.forEach(mirror => {
      this.orientations.set(mirror.id, mirror.initial);
      const center = this.board.cellCenter(mirror);
      const size = this.board.cellSize * (this.config.grid.columns === 5 ? 0.84 : 0.74);
      const hitArea = this.scene.add.rectangle(center.x, center.y, this.board.cellSize * 0.94, this.board.cellSize * 0.94, 0xffffff, 0.001).setDepth(20);
      const group = this.createMirrorVisual(center.x, center.y, size, mirror.initial);
      group.setAngle(mirror.initial === 'slash' ? -45 : 45);
      if (!mirror.rotatable) return;
      hitArea.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        if (!hitArea.input?.enabled) return;
        const next = this.orientations.get(mirror.id) === 'slash' ? 'backslash' : 'slash';
        this.orientations.set(mirror.id, next);
        this.scene.tweens.add({ targets: group, angle: group.angle + 90, duration: 120, ease: 'Sine.Out' });
        this.onRotate();
      });
    });
  }

  private createPlacementSlots() {
    if (this.config.mode !== 'placement') return;
    this.config.mirrorSlots.forEach(slot => {
      const center = this.board.cellCenter(slot);
      const radius = this.board.cellSize * 0.35;
      this.scene.add.circle(center.x, center.y, radius, 0x31423b, 0.9).setStrokeStyle(4, 0xd8c78e, 0.9).setDepth(6);
      this.scene.add.text(center.x, center.y, '+', { fontFamily: 'sans-serif', fontSize: '40px', color: '#d8c78e', fontStyle: 'bold' }).setOrigin(0.5).setDepth(7);
      this.scene.add.circle(center.x, center.y, radius, 0xffffff, 0.001).setDepth(8).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.installMirror(slot));
    });
  }

  private installMirror(slot: { id: string; column: number; row: number }) {
    if (this.config.mode !== 'placement' || this.installed.has(slot.id) || this.installed.size >= this.config.mirrorInventory) return;
    const center = this.board.cellCenter(slot);
    const size = this.board.cellSize * 0.84;
    const orientation: RuinsMirrorOrientation = 'slash';
    const group = this.createMirrorVisual(center.x, center.y, size, orientation);
    const hitArea = this.scene.add.circle(center.x, center.y, size * 0.42, 0xffffff, 0.001).setDepth(20).setInteractive({ useHandCursor: true });
    const removeCircle = this.scene.add.circle(center.x + size * 0.34, center.y - size * 0.34, 19, 0x8f3d35, 1).setStrokeStyle(3, 0xffdfb0).setDepth(22).setInteractive({ useHandCursor: true });
    const removeLabel = this.scene.add.text(removeCircle.x, removeCircle.y - 2, '−', { fontFamily: 'sans-serif', fontSize: '27px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(23);
    hitArea.on('pointerdown', () => {
      const installed = this.installed.get(slot.id);
      if (!installed) return;
      installed.orientation = installed.orientation === 'slash' ? 'backslash' : 'slash';
      this.scene.tweens.add({ targets: group, angle: group.angle + 90, duration: 120, ease: 'Sine.Out' });
      this.onRotate();
    });
    removeCircle.on('pointerdown', () => this.removeMirror(slot.id));
    this.installed.set(slot.id, { orientation, objects: [group, hitArea, removeCircle, removeLabel] });
    this.notifyInventory();
    this.onRotate();
  }

  private removeMirror(slotId: string) {
    const installed = this.installed.get(slotId);
    if (!installed) return;
    installed.objects.forEach(object => object.destroy());
    this.installed.delete(slotId);
    this.notifyInventory();
    this.onRotate();
  }

  private createMirrorVisual(x: number, y: number, size: number, orientation: RuinsMirrorOrientation) {
    const frame = this.scene.add.circle(0, 0, size * 0.49, 0x5a4634, 1).setStrokeStyle(5, 0xe9c46a);
    const glass = this.scene.add.rectangle(0, 0, size * 0.78, 15, 0xe7fbff, 1).setStrokeStyle(4, 0x77cbd8);
    return this.scene.add.container(x, y, [frame, glass]).setAngle(orientation === 'slash' ? -45 : 45).setDepth(10);
  }

  private notifyInventory() {
    if (this.config.mode === 'placement') this.onInventoryChange(this.config.mirrorInventory - this.installed.size, this.config.mirrorInventory);
  }

  getOrientations() {
    if (this.config.mode === 'placement') return new Map([...this.installed].map(([id, mirror]) => [id, mirror.orientation]));
    return this.orientations;
  }

  getActiveMirrors(): RuinsMirrorDefinition[] | undefined {
    if (this.config.mode !== 'placement') return undefined;
    const config = this.config;
    return [...this.installed].map(([slotId, mirror]) => {
      const slot = config.mirrorSlots.find(candidate => candidate.id === slotId)!;
      return { ...slot, initial: mirror.orientation, rotatable: true };
    });
  }
}

class TargetSystem {
  private active = false;
  private ring?: Phaser.GameObjects.Arc;
  private core?: Phaser.GameObjects.Arc;

  constructor(private readonly scene: Phaser.Scene, private readonly board: PuzzleBoard, private readonly config: RuinsMirrorPuzzleConfig) {}

  create() {
    const { x, y } = this.board.cellCenter(this.config.target);
    const sizeScale = this.config.grid.columns === 5 ? 1.12 : 1;
    this.ring = this.scene.add.circle(x, y, this.board.cellSize * 0.32 * sizeScale, 0x273b35, 1).setStrokeStyle(7, 0xa9c98f).setDepth(10);
    this.core = this.scene.add.circle(x, y, this.board.cellSize * 0.13 * sizeScale, 0x687568, 1).setDepth(11);
    this.scene.add.text(x, y + this.board.cellSize * 0.31, '제단', { fontFamily: 'sans-serif', fontSize: `${Math.max(20, this.board.cellSize * 0.15)}px`, color: '#fff4cc', fontStyle: 'bold' }).setOrigin(0.5, 0).setDepth(12);
  }

  setActive(active: boolean) {
    if (this.active === active) return false;
    this.active = active;
    this.ring?.setFillStyle(active ? 0x6b5a19 : 0x273b35).setStrokeStyle(7, active ? 0xffe66d : 0x86a873);
    this.core?.setFillStyle(active ? 0xfff2a8 : 0x687568);
    return active;
  }
}

class MissionManager {
  private missionIndex = 0;

  constructor(private readonly missions: readonly RuinsMirrorPuzzleConfig[], private readonly callbacks: RuinsMirrorGameCallbacks) {}

  get current() {
    return this.missions[this.missionIndex];
  }

  announce() {
    this.callbacks.onMissionChange(this.current.mission, this.current.title, this.current.instruction);
  }

  complete(scene: Phaser.Scene) {
    scene.time.delayedCall(1000, () => {
      if (this.missionIndex >= this.missions.length - 1) {
        this.callbacks.onStageComplete();
        return;
      }
      this.missionIndex += 1;
      scene.scene.restart({ missionIndex: this.missionIndex });
    });
  }

  setMissionIndex(index: number) {
    this.missionIndex = Phaser.Math.Clamp(index, 0, this.missions.length - 1);
  }
}

export function createRuinsMirrorGame(parent: HTMLElement, stageNumber: 1 | 2, callbacks: RuinsMirrorGameCallbacks): RuinsMirrorGameController {
  const missions = stageNumber === 2 ? RUINS_MIRROR_STAGE_2_MISSIONS : RUINS_MIRROR_STAGE_1_MISSIONS;
  const missionManager = new MissionManager(missions, callbacks);
  let activeScene: RuinsMirrorPuzzleScene | undefined;

  class RuinsMirrorPuzzleScene extends Phaser.Scene {
    private beamGraphics?: Phaser.GameObjects.Graphics;
    private mirrorSystem?: MirrorSystem;
    private targetSystem?: TargetSystem;
    private board?: PuzzleBoard;
    private missionLocked = false;

    constructor() {
      super('RuinsMirrorPuzzle');
    }

    init(data: { missionIndex?: number }) {
      if (typeof data.missionIndex === 'number') missionManager.setMissionIndex(data.missionIndex);
      this.missionLocked = false;
    }

    create() {
      activeScene = this;
      const config = missionManager.current;
      this.cameras.main.setBackgroundColor('#17251f');
      this.add.graphics()
        .fillGradientStyle(0x1d3c31, 0x1d3c31, 0x13251f, 0x13251f, 1)
        .fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      this.board = new PuzzleBoard(this, config);
      this.board.draw();
      this.beamGraphics = this.add.graphics().setDepth(5);
      this.drawEmitter(config);
      this.targetSystem = new TargetSystem(this, this.board, config);
      this.targetSystem.create();
      this.mirrorSystem = new MirrorSystem(this, this.board, config, () => this.updateBeam(), callbacks.onInventoryChange);
      this.mirrorSystem.create();
      missionManager.announce();
      this.updateBeam();
    }

    resetMission() {
      if (!this.missionLocked) this.scene.restart({ missionIndex: missionManager.current.mission - 1 });
    }

    private drawEmitter(config: RuinsMirrorPuzzleConfig) {
      if (!this.board) return;
      const source = getRuinsMirrorSource(config);
      const { x, y } = this.board.cellCenter(source);
      const sizeScale = config.grid.columns === 5 ? 1.12 : 1;
      this.add.circle(x, y, this.board.cellSize * 0.27 * sizeScale, 0x6c421d, 1).setStrokeStyle(6, 0xffc45e).setDepth(10);
      this.add.circle(x, y, this.board.cellSize * 0.1 * sizeScale, 0xfff3a3, 1).setDepth(11);
      this.add.text(x, y + this.board.cellSize * 0.31, '광원', { fontFamily: 'sans-serif', fontSize: `${Math.max(20, this.board.cellSize * 0.15)}px`, color: '#fff4cc', fontStyle: 'bold' }).setOrigin(0.5, 0).setDepth(12);
    }

    private updateBeam() {
      if (!this.board || !this.beamGraphics || !this.mirrorSystem || !this.targetSystem || this.missionLocked) return;
      const result = traceRuinsMirrorBeam(missionManager.current, this.mirrorSystem.getOrientations(), this.mirrorSystem.getActiveMirrors());
      this.beamGraphics.clear();
      this.beamGraphics.lineStyle(14, 0xf6bd42, 0.22);
      this.drawSegments(result.segments);
      this.beamGraphics.lineStyle(5, 0xfff3a3, 1);
      this.drawSegments(result.segments);
      if (this.targetSystem.setActive(result.reachedTarget)) {
        this.missionLocked = true;
        this.cameras.main.flash(120, 255, 238, 150, false);
        this.showMissionClear();
        missionManager.complete(this);
      }
    }

    private showMissionClear() {
      this.add.rectangle(GAME_WIDTH / 2, 34, 300, 52, 0x213b30, 0.96).setStrokeStyle(3, 0xffdf78).setDepth(30);
      this.add.text(GAME_WIDTH / 2, 34, '빛 연결 완료!', { fontFamily: 'sans-serif', fontSize: '27px', color: '#fff3af', fontStyle: 'bold' }).setOrigin(0.5).setDepth(31);
    }

    private drawSegments(segments: RuinsMirrorBeamSegment[]) {
      if (!this.board || !this.beamGraphics) return;
      segments.forEach(segment => {
        const from = this.board!.cellCenter(segment.from);
        const to = this.board!.cellCenter(segment.to);
        this.beamGraphics!.beginPath().moveTo(from.x, from.y).lineTo(to.x, to.y).strokePath();
      });
    }
  }

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    transparent: false,
    backgroundColor: '#17251f',
    render: { antialias: true, pixelArt: false, roundPixels: true },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: RuinsMirrorPuzzleScene,
    input: { activePointers: 1 },
  });

  return {
    resetMission: () => activeScene?.resetMission(),
    destroy: () => {
      activeScene = undefined;
      game.destroy(true);
    },
  };
}
