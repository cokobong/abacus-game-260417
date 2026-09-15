import Phaser from 'phaser';
import { ruinsSokobanAssets } from '../../../assets/adventure/ruins';
import { getRuinsSokobanMissions, parseSokobanPuzzle, sokobanKey, type SokobanDirection, type SokobanParsedPuzzle, type SokobanPuzzleConfig } from '../../../config/ruinsSokoban';
import { createSokobanState, getStaticDeadlockKeys, isMissionComplete, moveSokoban, type SokobanState } from '../../../utils/ruinsSokobanRules';
import { SokobanInputGate } from './sokobanInputGate';

const GAME_WIDTH = 768;
const GAME_HEIGHT = 720;

export interface RuinsSokobanCallbacks {
  onMissionChange: (config: SokobanPuzzleConfig, total: number) => void;
  onStateChange: (moves: number, pushes: number, canUndo: boolean) => void;
  onDeadlock: () => void;
  onBlocked: (reason: 'wall' | 'box') => void;
  onStageComplete: () => void;
}

export interface RuinsSokobanController {
  move: (direction: SokobanDirection) => void;
  undo: () => void;
  reset: () => void;
  setEnabled: (enabled: boolean) => void;
  destroy: () => void;
}

class MissionManager {
  private index = 0;
  readonly missions;

  constructor(stage: 1 | 2) {
    this.missions = getRuinsSokobanMissions(stage);
  }

  get current() { return this.missions[this.index] }

  advance() {
    if (this.index >= this.missions.length - 1) return false;
    this.index += 1;
    return true;
  }
}

class RuinsSokobanScene extends Phaser.Scene {
  private puzzle!: SokobanParsedPuzzle;
  private state!: SokobanState;
  private history: SokobanState[] = [];
  private boardOrigin = { x: 0, y: 0 };
  private cellSize = 100;
  private player?: Phaser.GameObjects.Image;
  private boxes: Phaser.GameObjects.Image[] = [];
  private goals = new Map<string, Phaser.GameObjects.Image>();
  private exitDoor?: Phaser.GameObjects.Image;
  private readonly inputGate = new SokobanInputGate();
  private deadlocks = new Set<string>();
  private playerStateTimer?: Phaser.Time.TimerEvent;

  constructor(private readonly manager: MissionManager, private readonly callbacks: RuinsSokobanCallbacks) {
    super('RuinsSokoban');
  }

  preload() {
    this.load.image('ruins-floor', ruinsSokobanAssets.tiles.floor);
    this.load.image('ruins-wall', ruinsSokobanAssets.tiles.wall);
    this.load.image('ruins-box', ruinsSokobanAssets.objects.relicBox);
    this.load.image('ruins-goal', ruinsSokobanAssets.objects.goalAltar);
    this.load.image('ruins-goal-active', ruinsSokobanAssets.objects.goalAltarActive);
    this.load.image('ruins-gate', ruinsSokobanAssets.objects.sealedGate);
    this.load.image('ruins-explorer-idle', ruinsSokobanAssets.characters.idle);
    this.load.image('ruins-explorer-push-left', ruinsSokobanAssets.characters.push.left);
    this.load.image('ruins-explorer-push-right', ruinsSokobanAssets.characters.push.right);
    this.load.image('ruins-explorer-push-up', ruinsSokobanAssets.characters.push.up);
    this.load.image('ruins-explorer-blocked-side', ruinsSokobanAssets.characters.blocked.horizontal);
    this.load.image('ruins-explorer-blocked-front', ruinsSokobanAssets.characters.blocked.vertical);
  }

  create() {
    this.loadMission();
    this.input.keyboard?.on('keydown-UP', () => this.move('up'));
    this.input.keyboard?.on('keydown-DOWN', () => this.move('down'));
    this.input.keyboard?.on('keydown-LEFT', () => this.move('left'));
    this.input.keyboard?.on('keydown-RIGHT', () => this.move('right'));
  }

  private loadMission() {
    this.tweens.killAll();
    this.playerStateTimer?.remove(false);
    this.playerStateTimer = undefined;
    this.children.removeAll(true);
    this.player = undefined;
    this.boxes = [];
    this.goals.clear();
    this.exitDoor = undefined;
    this.puzzle = parseSokobanPuzzle(this.manager.current);
    this.state = createSokobanState(this.puzzle);
    this.history = [];
    this.inputGate.resetForMission();
    this.deadlocks = getStaticDeadlockKeys(this.puzzle);
    this.cameras.main.setBackgroundColor('#172018');
    this.drawBoard();
    this.createGoals();
    this.createExit();
    this.createBoxes();
    this.createPlayer();
    this.callbacks.onMissionChange(this.manager.current, this.manager.missions.length);
    this.notifyState();
    if (this.manager.current.stage === 2) this.inputGate.setEnabled(true);
  }

  move(direction: SokobanDirection) {
    if (!this.inputGate.canMove()) return;
    const result = moveSokoban(this.puzzle, this.state, direction);
    if (!result.moved) {
      this.cameras.main.shake(55, 0.002);
      if (result.attemptedPush) {
        this.showBlocked(direction);
        this.bumpBlockedBox(direction);
        this.callbacks.onBlocked(result.blockedBy ?? 'wall');
      }
      return;
    }
    this.showPlayerState(result.pushed ? 'push' : 'idle', direction);
    this.history.push(this.state);
    this.state = result.state;
    this.inputGate.startMovement();
    this.renderState(true);
    this.time.delayedCall(110, () => this.inputGate.finishMovement());
    if (result.pushed && this.state.boxes.some(box => this.deadlocks.has(sokobanKey(box)))) {
      this.showBlocked(direction);
      this.callbacks.onDeadlock();
    }
    this.checkComplete();
  }

  undo() {
    if (!this.inputGate.canMove() || this.history.length === 0) return;
    this.state = this.history.pop()!;
    this.showPlayerState('idle');
    this.renderState(false);
  }

  resetMission() {
    if (this.inputGate.isCompletionLocked()) return;
    this.tweens.killTweensOf([this.player, ...this.boxes]);
    this.state = createSokobanState(this.puzzle);
    this.history = [];
    this.inputGate.finishMovement();
    this.exitDoor?.setAlpha(0.62).setTint(0x777777);
    this.showPlayerState('idle');
    this.renderState(false);
  }

  setEnabled(enabled: boolean) {
    this.inputGate.setEnabled(enabled);
  }

  private drawBoard() {
    const maxBoardWidth = 690;
    const maxBoardHeight = 680;
    this.cellSize = Math.floor(Math.min(maxBoardWidth / this.puzzle.columns, maxBoardHeight / this.puzzle.rows));
    const width = this.cellSize * this.puzzle.columns;
    const height = this.cellSize * this.puzzle.rows;
    this.boardOrigin = { x: (GAME_WIDTH - width) / 2, y: (GAME_HEIGHT - height) / 2 };
    const frame = this.add.graphics();
    frame.fillStyle(0x3d3024, 1).fillRoundedRect(this.boardOrigin.x - 13, this.boardOrigin.y - 13, width + 26, height + 26, 20);
    frame.lineStyle(5, 0xc09b58, 1).strokeRoundedRect(this.boardOrigin.x - 13, this.boardOrigin.y - 13, width + 26, height + 26, 20);
    for (let row = 0; row < this.puzzle.rows; row += 1) {
      for (let column = 0; column < this.puzzle.columns; column += 1) {
        const point = { column, row };
        const { x, y } = this.center(point);
        const wall = this.puzzle.walls.has(sokobanKey(point));
        this.add.image(x, y, wall ? 'ruins-wall' : 'ruins-floor')
          .setDisplaySize(this.cellSize * 1.005, this.cellSize * 1.005)
          .setTint(wall ? 0x79593f : ((row + column) % 2 ? 0xffedc1 : 0xfff4d2))
          .setDepth(wall ? 3 : 1);
      }
    }
    if (this.manager.current.highlights.includes('deadlocks')) {
      this.deadlocks.forEach(key => {
        const [column, row] = key.split(',').map(Number);
        const { x, y } = this.center({ column, row });
        frame.fillStyle(0xa73932, 0.42).fillTriangle(x - 22, y + 18, x + 22, y + 18, x, y - 22);
        frame.lineStyle(4, 0xffb0a6, 0.9).strokeCircle(x, y, this.cellSize * 0.32);
      });
    }
    this.manager.current.tutorial?.highlightCells?.forEach((point, index) => {
      const { x, y } = this.center(point);
      frame.lineStyle(4, 0x73e6d0, 0.9 - index * 0.12).strokeCircle(x, y, this.cellSize * 0.22);
    });
    this.manager.current.tutorial?.dangerCells?.forEach(point => {
      const { x, y } = this.center(point);
      frame.lineStyle(5, 0xe45b50, 0.9).strokeRoundedRect(x - this.cellSize * 0.38, y - this.cellSize * 0.38, this.cellSize * 0.76, this.cellSize * 0.76, 10);
    });
    const suggestedDirection = this.manager.current.tutorial?.suggestedDirection;
    if (suggestedDirection) {
      const step = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } }[suggestedDirection];
      const { x, y } = this.center(this.state.player);
      this.add.text(x + step.x * this.cellSize * 0.58, y + step.y * this.cellSize * 0.58, { up: '▲', down: '▼', left: '◀', right: '▶' }[suggestedDirection], { color: '#8fffd6', fontSize: `${Math.round(this.cellSize * 0.3)}px`, fontStyle: 'bold' }).setOrigin(0.5).setDepth(20);
    }
  }

  private createGoals() {
    this.puzzle.goals.forEach(key => {
      const [column, row] = key.split(',').map(Number);
      const { x, y } = this.center({ column, row });
      const ring = this.add.image(x, y, 'ruins-goal').setDisplaySize(this.cellSize * 0.88, this.cellSize * 0.88).setDepth(5).setData('occupied', false);
      if (this.manager.current.highlights.includes('goals')) this.add.circle(x, y, this.cellSize * 0.42, 0xffef92, 0.12).setStrokeStyle(4, 0xffef92, 0.85).setDepth(4);
      this.goals.set(key, ring);
    });
  }

  private createExit() {
    const { x, y } = this.center(this.puzzle.exit);
    this.exitDoor = this.add.image(x, y, 'ruins-gate').setDisplaySize(this.cellSize * 0.72, this.cellSize * 0.72).setDepth(7).setTint(0x777777).setAlpha(0.62);
  }

  private createBoxes() {
    this.boxes = this.state.boxes.map((box, index) => {
      const { x, y } = this.center(box);
      const object = this.add.image(x, y, 'ruins-box').setDisplaySize(this.cellSize * 0.76, this.cellSize * 0.76).setDepth(12).setName(`box-${index}`);
      if (this.manager.current.highlights.includes('boxes')) this.add.circle(x, y, this.cellSize * 0.42, 0xffd86b, 0.1).setStrokeStyle(4, 0xffdd77).setDepth(10);
      return object;
    });
  }

  private createPlayer() {
    const { x, y } = this.center(this.state.player);
    this.player = this.add.image(x, y, 'ruins-explorer-idle').setDisplaySize(this.cellSize * 0.87, this.cellSize * 0.87).setDepth(15);
    if (this.manager.current.highlights.includes('player')) this.add.circle(x, y, this.cellSize * 0.43, 0x8fffd6, 0.08).setStrokeStyle(4, 0x8fffd6).setDepth(13);
  }

  private center(point: { column: number; row: number }) {
    return {
      x: this.boardOrigin.x + (point.column + 0.5) * this.cellSize,
      y: this.boardOrigin.y + (point.row + 0.5) * this.cellSize,
    };
  }

  private renderState(animate: boolean) {
    const duration = animate ? 105 : 0;
    const playerPosition = this.center(this.state.player);
    this.tweens.add({ targets: this.player, ...playerPosition, duration, ease: 'Sine.Out' });
    this.state.boxes.forEach((box, index) => {
      const position = this.center(box);
      const occupied = this.puzzle.goals.has(sokobanKey(box));
      this.boxes[index]
        .setTint(occupied ? 0xffe59a : 0xffffff)
        .setDisplaySize(this.cellSize * (occupied ? 0.79 : 0.76), this.cellSize * (occupied ? 0.79 : 0.76));
      this.tweens.add({ targets: this.boxes[index], ...position, duration, ease: 'Sine.Out' });
    });
    this.goals.forEach((goal, key) => {
      const occupied = this.state.boxes.some(box => sokobanKey(box) === key);
      const wasOccupied = Boolean(goal.getData('occupied'));
      goal
        .setTexture(occupied ? 'ruins-goal-active' : 'ruins-goal')
        .setDisplaySize(this.cellSize * (occupied ? 0.92 : 0.88), this.cellSize * (occupied ? 0.92 : 0.88))
        .setTint(0xffffff)
        .setAlpha(1)
        .setData('occupied', occupied);
      if (occupied && !wasOccupied && animate) {
        const targetScaleX = goal.scaleX;
        const targetScaleY = goal.scaleY;
        goal.setScale(targetScaleX * 0.9, targetScaleY * 0.9);
        this.tweens.add({ targets: goal, scaleX: targetScaleX, scaleY: targetScaleY, duration: 160, ease: 'Back.Out' });
      }
    });
    this.notifyState();
  }

  private showPlayerState(state: 'idle' | 'push', direction?: SokobanDirection) {
    if (!this.player) return;
    this.playerStateTimer?.remove(false);
    this.player.setFlipX(false);
    if (state === 'idle' || !direction) {
      this.player.setTexture('ruins-explorer-idle');
      return;
    }
    const texture = direction === 'left'
      ? 'ruins-explorer-push-left'
      : direction === 'right'
        ? 'ruins-explorer-push-right'
        : 'ruins-explorer-push-up';
    this.player.setTexture(texture);
    this.playerStateTimer = this.time.delayedCall(190, () => this.showPlayerState('idle'));
  }

  private showBlocked(direction: SokobanDirection) {
    if (!this.player) return;
    this.playerStateTimer?.remove(false);
    const horizontal = direction === 'left' || direction === 'right';
    this.player
      .setTexture(horizontal ? 'ruins-explorer-blocked-side' : 'ruins-explorer-blocked-front')
      .setFlipX(direction === 'left');
    const duration = this.manager.current.stage === 1 ? 700 : 380;
    this.playerStateTimer = this.time.delayedCall(duration, () => this.showPlayerState('idle'));
  }

  private bumpBlockedBox(direction: SokobanDirection) {
    const step = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } }[direction];
    const boxColumn = this.state.player.column + step.x;
    const boxRow = this.state.player.row + step.y;
    const boxIndex = this.state.boxes.findIndex(box => box.column === boxColumn && box.row === boxRow);
    const box = this.boxes[boxIndex];
    if (!box) return;
    this.tweens.add({ targets: box, x: box.x + step.x * 2, y: box.y + step.y * 2, duration: 45, yoyo: true, repeat: 1 });
  }

  private notifyState() {
    this.callbacks.onStateChange(this.state.moveCount, this.state.pushCount, this.history.length > 0);
  }

  private checkComplete() {
    if (!isMissionComplete(this.puzzle, this.state)) return;
    this.inputGate.lockForCompletion();
    this.exitDoor?.setTint(0xffe69a).setAlpha(1);
    if (this.exitDoor) {
      this.tweens.add({ targets: this.exitDoor, alpha: 0.55, duration: 180, yoyo: true, repeat: 1 });
    }
    this.cameras.main.flash(180, 255, 226, 130, false);
    this.time.delayedCall(850, () => {
      if (this.manager.advance()) this.loadMission();
      else this.callbacks.onStageComplete();
    });
  }
}

export function createRuinsSokobanGame(parent: HTMLElement, stage: 1 | 2, callbacks: RuinsSokobanCallbacks): RuinsSokobanController {
  const manager = new MissionManager(stage);
  let scene: RuinsSokobanScene | undefined;
  class ActiveScene extends RuinsSokobanScene {
    constructor() {
      super(manager, callbacks);
      scene = this;
    }
  }
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#172018',
    render: { antialias: true, pixelArt: false, roundPixels: true },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: ActiveScene,
    input: { activePointers: 2 },
  });
  return {
    move: direction => scene?.move(direction),
    undo: () => scene?.undo(),
    reset: () => scene?.resetMission(),
    setEnabled: enabled => scene?.setEnabled(enabled),
    destroy: () => { scene = undefined; game.destroy(true); },
  };
}
