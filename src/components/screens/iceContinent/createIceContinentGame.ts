import Phaser from 'phaser';
import { advanceIceStage1, createIceStage1State, iceLadderAt, ICE_STAGE_1, repairIceStage1, type IceLayer, type IceStage1State } from '../../../config/iceContinent/stage1';
import type { IceInput } from '../../../config/iceContinent/input';

const WIDTH = ICE_STAGE_1.viewportWidth;
const HEIGHT = 820;
const WORLD_WIDTH = ICE_STAGE_1.worldWidth;
const COLORS = { generator: 0xf7d15b, conveyor: 0x79c4d5, relay: 0x8db8ea, heater: 0xf4a66d, pump: 0x90d9cf } as const;

export interface IceIssueNavigation { direction: 'left' | 'right' | null; layer: IceLayer | null }
export interface IceGameCallbacks {
  onState: (state: IceStage1State) => void;
  onFeedback: (message: string) => void;
  onNavigation: (navigation: IceIssueNavigation) => void;
  onClear: () => void;
  onFailure: () => void;
}

type MachineVisual = {
  body: Phaser.GameObjects.Rectangle;
  lamp: Phaser.GameObjects.Arc;
  warning: Phaser.GameObjects.Text;
  issueMark: Phaser.GameObjects.Shape;
  wheel: Phaser.GameObjects.Star;
  penguin: Phaser.GameObjects.Container;
};

class IceStage1Scene extends Phaser.Scene {
  private run: IceStage1State = createIceStage1State();
  private player!: Phaser.GameObjects.Container;
  private playerLayer: IceLayer = 'lower';
  private climbing = false;
  private products: Phaser.GameObjects.Arc[] = [];
  private machines = new Map<string, MachineVisual>();
  private productionMotion = 0;
  private lastIncident = '';
  private lastShownStallSecond = -1;
  private lastNavigation = '';

  constructor(private readonly controls: IceInput, private readonly callbacks: IceGameCallbacks) { super('IceContinentStage1PrototypeV3'); }

  create() {
    this.cameras.main.setBackgroundColor('#b6e7f1');
    const scenery = this.add.graphics();
    scenery.fillGradientStyle(0xd7f4f8, 0xd7f4f8, 0x82bfd8, 0x82bfd8).fillRect(0, 0, WORLD_WIDTH, HEIGHT);
    for (let x = 0; x < WORLD_WIDTH; x += 360) {
      scenery.fillStyle(0xeafaff).fillTriangle(x - 60, 310, x + 90, 100 + x % 80, x + 330, 310);
      scenery.fillStyle(0xb5e2ed).fillTriangle(x + 130, 338, x + 250, 165, x + 410, 338);
    }
    scenery.fillStyle(0x9ed1e1).fillRect(0, 735, WORLD_WIDTH, 85);
    scenery.fillStyle(0x5f9cb4).fillRoundedRect(22, 732, WORLD_WIDTH - 44, 24, 9);
    scenery.fillStyle(0x4f8da8).fillRoundedRect(ICE_STAGE_1.upperLeft, 558, ICE_STAGE_1.upperRight - ICE_STAGE_1.upperLeft, 25, 8);
    scenery.lineStyle(5, 0xc5f3fb).lineBetween(ICE_STAGE_1.upperLeft, 554, ICE_STAGE_1.upperRight, 554);
    for (let x = 460; x < ICE_STAGE_1.upperRight; x += 150) scenery.lineStyle(4, 0x83c3d6).lineBetween(x, 580, x, 728);
    for (const ladder of ICE_STAGE_1.ladders) {
      scenery.lineStyle(8, 0x437b94).lineBetween(ladder - 28, 574, ladder - 28, 729);
      scenery.lineBetween(ladder + 28, 574, ladder + 28, 729);
      for (let y = 590; y < 730; y += 24) scenery.lineStyle(5, 0xcaf4fa).lineBetween(ladder - 28, y, ladder + 28, y);
      this.add.text(ladder, 694, '사다리 ↑↓', { fontFamily: 'sans-serif', fontSize: '20px', color: '#174d67', fontStyle: 'bold', backgroundColor: '#dcf7fb' }).setOrigin(.5);
    }
    scenery.lineStyle(16, 0x376f89).lineBetween(100, 487, WORLD_WIDTH - 100, 487);
    scenery.lineStyle(5, 0x95d6e8).lineBetween(100, 476, WORLD_WIDTH - 100, 476);
    for (let x = 140; x < WORLD_WIDTH - 100; x += 110) scenery.fillStyle(0xcaf3fb).fillTriangle(x, 487, x + 16, 478, x + 16, 496);
    this.add.text(180, 180, '빙하 기지', { fontFamily: 'sans-serif', fontSize: '44px', color: '#174d67', fontStyle: 'bold' }).setOrigin(.5);
    this.add.text(1030, 200, '위층 작업대', { fontFamily: 'sans-serif', fontSize: '30px', color: '#286781', fontStyle: 'bold' }).setOrigin(.5);

    for (const machine of ICE_STAGE_1.machines) {
      const y = machine.layer === 'upper' ? 397 : 565;
      const size = machine.id === 'conveyor' ? 142 : machine.id === 'relay' ? 104 : 116;
      this.add.rectangle(machine.x, y + 66, size + 20, 17, 0x326d86).setStrokeStyle(3, 0xd8f8ff);
      const body = this.add.rectangle(machine.x, y, size, 106, COLORS[machine.id]).setStrokeStyle(5, 0xf5feff);
      const lamp = this.add.circle(machine.x + size * .32, y - 34, 12, 0x63dd8c).setStrokeStyle(3, 0xffffff);
      const wheel = this.add.star(machine.x, y + 4, 8, 18, 30, 0x2f738e).setStrokeStyle(3, 0xd4f5ff);
      const symbol = machine.id === 'generator' ? '⚡' : machine.id === 'heater' ? '♨' : machine.id === 'conveyor' ? '▤' : machine.id === 'relay' ? '↗' : '✦';
      this.add.text(machine.x, y + 1, symbol, { fontFamily: 'sans-serif', fontSize: '29px', color: '#e8fbff', fontStyle: 'bold' }).setOrigin(.5);
      this.add.text(machine.x, y + 90, machine.name, { fontFamily: 'sans-serif', fontSize: '24px', color: '#174b61', fontStyle: 'bold', backgroundColor: '#d9f5f9' }).setOrigin(.5);
      const issueMark = machine.id === 'conveyor'
        ? this.add.circle(machine.x, y + 21, 37, 0x9ae9ff).setStrokeStyle(4, 0xffffff)
        : machine.id === 'heater'
          ? this.add.rectangle(machine.x, y + 18, 94, 64, 0xa4e9ff, .84).setStrokeStyle(4, 0xffffff)
          : this.add.rectangle(machine.x + 39, y + 1, 14, 38, 0x9b4c4c);
      issueMark.setVisible(false);
      const warning = this.add.text(machine.x, y - 128, '!', { fontFamily: 'sans-serif', fontSize: '72px', color: '#e85f43', fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 8 }).setOrigin(.5).setVisible(false);
      const penguin = this.add.container(machine.x, y - 74, [
        this.add.ellipse(0, 0, 48, 65, 0x263b52).setStrokeStyle(3, 0xffffff),
        this.add.ellipse(0, 9, 30, 44, 0xf4fcff),
        this.add.circle(-9, -16, 4, 0xffffff), this.add.circle(9, -16, 4, 0xffffff),
        this.add.triangle(0, -6, -8, 0, 8, 0, 0, 10, 0xf9a84f),
      ]).setDepth(9).setVisible(false);
      this.machines.set(machine.id, { body, lamp, warning, issueMark, wheel, penguin });
    }

    for (let index = 0; index < 4; index += 1) this.products.push(this.add.circle(120 + index * 350, 486, 14, 0xd9f9ff).setStrokeStyle(4, 0xffffff).setDepth(3));
    this.createFossilDepot();
    this.player = this.add.container(300, ICE_STAGE_1.lowerPlayerY, [
      this.add.ellipse(0, 0, 68, 94, 0x326eae).setStrokeStyle(5, 0xe6f8ff),
      this.add.circle(0, -61, 31, 0xffdbb5).setStrokeStyle(4, 0xffffff),
      this.add.rectangle(0, -79, 70, 20, 0x287da8).setStrokeStyle(3, 0xffffff),
      this.add.circle(-36, 8, 13, 0xffdbb5), this.add.circle(36, 8, 13, 0xffdbb5),
    ]).setDepth(10);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, HEIGHT);
    this.cameras.main.startFollow(this.player, true, .12, .08);
    this.cameras.main.setDeadzone(100, HEIGHT);
    this.callbacks.onState(this.run);
    this.updateNavigation();
  }

  private createFossilDepot() {
    this.add.rectangle(1769, 604, 268, 220, 0x3e7995, .8).setStrokeStyle(6, 0xc5f3fb);
    this.add.text(1769, 513, '얼음 공룡 화석 창고', { fontFamily: 'sans-serif', fontSize: '22px', color: '#e9fbff', fontStyle: 'bold' }).setOrigin(.5);
    this.add.text(1769, 693, '고치면 화석이 쌓여요!', { fontFamily: 'sans-serif', fontSize: '18px', color: '#e9fbff', fontStyle: 'bold' }).setOrigin(.5);
  }

  private addFossil(index: number) {
    const x = 1689 + (index % 5) * 40;
    const y = 653 - Math.floor(index / 5) * 36;
    this.add.container(x, y, [
      this.add.rectangle(0, 0, 34, 31, 0x90e3f3).setStrokeStyle(3, 0xe9ffff),
      this.add.ellipse(0, 2, 19, 8, 0xf6ffff).setAngle(-30),
      this.add.circle(-10, 8, 5, 0xf6ffff), this.add.circle(10, -4, 5, 0xf6ffff),
    ]).setDepth(4);
  }

  update(_time: number, delta: number) {
    if (this.run.phase !== 'playing') return;
    const seconds = Math.min(delta, 50) / 1000;
    if (!this.climbing) {
      const ladder = iceLadderAt(this.player.x);
      if (ladder !== null && ((this.playerLayer === 'lower' && this.controls.held('up')) || (this.playerLayer === 'upper' && this.controls.held('down')))) {
        this.climb(ladder);
      } else {
        const left = this.controls.held('left');
        const right = this.controls.held('right');
        if (left !== right) {
          const minX = this.playerLayer === 'upper' ? ICE_STAGE_1.upperLeft + 32 : 68;
          const maxX = this.playerLayer === 'upper' ? ICE_STAGE_1.upperRight - 32 : WORLD_WIDTH - 68;
          this.player.x = Phaser.Math.Clamp(this.player.x + (right ? 1 : -1) * ICE_STAGE_1.playerSpeed * seconds, minX, maxX);
          this.player.setScale(right ? 1 : -1, 1);
        }
      }
    }
    if (this.controls.consumeActionA()) this.tryRepair();
    const before = this.run;
    this.run = advanceIceStage1(before, seconds);
    if (before.activeIssue !== this.run.activeIssue || before.penguinAt !== this.run.penguinAt) this.showIncident();
    for (let index = before.produced; index < this.run.produced; index += 1) this.addFossil(index);
    const stallSecond = Math.floor(this.run.stalledSeconds);
    if (before.produced !== this.run.produced || before.activeIssue !== this.run.activeIssue || before.penguinAt !== this.run.penguinAt || before.phase !== this.run.phase || (this.run.activeIssue && stallSecond !== this.lastShownStallSecond)) this.callbacks.onState(this.run);
    this.lastShownStallSecond = stallSecond;
    if (!this.run.activeIssue) this.productionMotion += seconds / (this.run.penguinAt ? ICE_STAGE_1.penguinProductionMultiplier : 1);
    this.products.forEach((product, index) => {
      product.x = 120 + (this.productionMotion * 130 + index * 390) % (WORLD_WIDTH - 240);
      product.setScale(1 + Math.sin(this.productionMotion * 8 + index) * .06);
    });
    if (!this.run.activeIssue) for (const visual of this.machines.values()) visual.wheel.angle += seconds * (this.run.penguinAt ? 50 : 100);
    this.updateNavigation();
    if (this.run.phase === 'clear') this.callbacks.onClear();
    if (this.run.phase === 'failure') this.callbacks.onFailure();
  }

  private climb(ladder: number) {
    this.climbing = true;
    const targetLayer: IceLayer = this.playerLayer === 'lower' ? 'upper' : 'lower';
    this.tweens.add({ targets: this.player, x: ladder, y: targetLayer === 'upper' ? ICE_STAGE_1.upperPlayerY : ICE_STAGE_1.lowerPlayerY, duration: 530, ease: 'Sine.InOut', onComplete: () => {
      this.playerLayer = targetLayer;
      this.climbing = false;
      this.callbacks.onFeedback(targetLayer === 'upper' ? '사다리를 올라 위층 작업대로 왔어요.' : '사다리를 내려 아래층으로 왔어요.');
      this.updateNavigation();
    } });
  }

  private tryRepair() {
    const incident = this.run.activeIssue ?? this.run.penguinAt;
    if (!incident || this.climbing) return;
    const machine = ICE_STAGE_1.machines.find(item => item.id === incident)!;
    if (this.playerLayer !== machine.layer || Math.abs(this.player.x - machine.x) > ICE_STAGE_1.interactionRange) {
      this.callbacks.onFeedback(`${machine.name}가 있는 ${machine.layer === 'upper' ? '위층' : '아래층'}으로 가세요!`);
      return;
    }
    const wasPenguin = Boolean(this.run.penguinAt);
    this.run = repairIceStage1(this.run);
    this.showIncident();
    this.callbacks.onState(this.run);
    this.callbacks.onFeedback(wasPenguin ? '펭귄이 떠났어요! 생산 속도가 돌아왔어요.' : `${machine.name} 복구! 다시 생산해요.`);
    const y = machine.layer === 'upper' ? 397 : 565;
    const pulse = this.add.circle(machine.x, y, 30, 0x70f3bb, .35).setStrokeStyle(6, 0xffffff);
    this.tweens.add({ targets: pulse, scale: 2.6, alpha: 0, duration: 350, onComplete: () => pulse.destroy() });
  }

  private showIncident() {
    const incident = this.run.activeIssue ?? this.run.penguinAt ?? '';
    if (incident === this.lastIncident) return;
    this.lastIncident = incident;
    for (const machine of ICE_STAGE_1.machines) {
      const visual = this.machines.get(machine.id)!;
      const broken = this.run.activeIssue === machine.id;
      const penguin = this.run.penguinAt === machine.id;
      visual.body.setFillStyle(broken ? machine.id === 'heater' ? 0x8cc9eb : 0x797d91 : COLORS[machine.id]);
      visual.lamp.setFillStyle(broken ? 0xe55959 : penguin ? 0xf4a64b : 0x63dd8c);
      visual.warning.setVisible(broken || penguin);
      visual.issueMark.setVisible(broken);
      visual.penguin.setVisible(penguin);
    }
    if (incident) {
      const machine = ICE_STAGE_1.machines.find(item => item.id === incident)!;
      this.callbacks.onFeedback(this.run.penguinAt ? `${machine.name}에 펭귄이 앉았어요! 쫓아내세요.` : `${machine.name}에 문제가 생겼어요!`);
    }
    this.updateNavigation();
  }

  private updateNavigation() {
    const incident = this.run.activeIssue ?? this.run.penguinAt;
    const machine = incident && ICE_STAGE_1.machines.find(item => item.id === incident);
    const left = this.cameras.main.scrollX;
    const direction = !machine ? null : machine.x < left + 70 ? 'left' : machine.x > left + WIDTH - 70 ? 'right' : null;
    const layer = machine?.layer ?? null;
    const key = `${direction}:${layer}`;
    if (key === this.lastNavigation) return;
    this.lastNavigation = key;
    this.callbacks.onNavigation({ direction, layer });
  }
}

export function createIceContinentGame(parent: HTMLElement, controls: IceInput, callbacks: IceGameCallbacks) {
  let scene: IceStage1Scene | undefined;
  class ActiveScene extends IceStage1Scene { constructor() { super(controls, callbacks); scene = this; } }
  const game = new Phaser.Game({ type: Phaser.AUTO, parent, width: WIDTH, height: HEIGHT, backgroundColor: '#b6e7f1', render: { antialias: false, roundPixels: true }, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, scene: ActiveScene });
  return { destroy: () => { scene = undefined; game.destroy(true); } };
}
