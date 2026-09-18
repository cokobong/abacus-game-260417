import Phaser from 'phaser';
import { ICE_ISSUES, ICE_PROTOTYPE as C, type IceAction, type IceIssue } from './iceFossilPrototypeConfig';

type Result = 'success' | 'timeout';
type Callbacks = {
  onTick: (seconds: number) => void;
  onFeedback: (message: string) => void;
  onProgress: (mounted: boolean) => void;
  onResult: (result: Result) => void;
};
export type IceFossilController = {
  setHeld: (action: IceAction, held: boolean) => void;
  act: (action: IceAction) => void;
  destroy: () => void;
};

const route = [
  { x: 85, y: 505 }, { x: 210, y: 505 }, { x: 255, y: 505 },
  { x: 255, y: 265 }, { x: 390, y: 265 }, { x: 485, y: 265 },
  { x: 565, y: 265 }, { x: 590, y: 265 }, { x: 590, y: 505 },
] as const;

class IceScene extends Phaser.Scene {
  private ink!: Phaser.GameObjects.Graphics;
  private player: { x: number; floor: 1 | 2; climbing: boolean; y: number } = { x: 95, floor: 1, climbing: false, y: C.groundY };
  private held = new Set<IceAction>();
  private elapsed = 0;
  private routeIndex = 0;
  private product = { x: route[0].x as number, y: route[0].y as number };
  private activeIssue: IceIssue | null = null;
  private clearedIssues = new Set<IceIssue>();
  private mounted = false;
  private finished = false;
  private penguinX = 540;
  private notice = '';
  private noticeTime = 0;
  private playerSprite?: Phaser.GameObjects.Image;

  constructor(private callbacks: Callbacks) { super('IceFossilPrototype'); }

  preload() { if (C.playerAssetUrl) this.load.image(C.playerAssetKey, C.playerAssetUrl); }

  create() {
    this.cameras.main.setBackgroundColor('#0a2945');
    this.cameras.main.setBounds(0, 0, C.width, C.height);
    this.ink = this.add.graphics();
    this.add.text(27, 106, '원석 투입', { fontSize: '19px', color: '#d7f5ff', fontStyle: 'bold' });
    this.add.text(352, 212, '해빙 · 분리 · 세척', { fontSize: '18px', color: '#d7f5ff', fontStyle: 'bold' });
    this.add.text(536, 553, '복원대', { fontSize: '19px', color: '#ffe8a7', fontStyle: 'bold' });
    this.add.text(270, 370, '사다리', { fontSize: '17px', color: '#e2f8ff' });
    if (this.textures.exists(C.playerAssetKey)) this.playerSprite = this.add.image(this.player.x, this.player.y - 43, C.playerAssetKey).setDisplaySize(58, 82);
    this.cameras.main.setScroll(0, 0);
    this.callbacks.onFeedback('얼음이 움직여요. 멈춘 곳의 문제를 찾아보세요!');
  }

  setHeld(action: IceAction, held: boolean) { if (held) this.held.add(action); else this.held.delete(action); }

  act(action: IceAction) {
    if (this.finished || !action.startsWith('tool')) return;
    if (!this.activeIssue) { this.feedback('지금은 공구가 필요하지 않아요.'); return; }
    if (this.activeIssue === 'penguin') { this.feedback('펭귄에게 가까이 가면 스스로 물러나요!'); return; }
    const issue = ICE_ISSUES[this.activeIssue];
    if (this.player.floor !== issue.floor || Math.abs(this.player.x - issue.x) > C.interactionDistance) {
      this.feedback(`${issue.label} 근처로 이동하세요.`); return;
    }
    if (action !== issue.action) { this.feedback('다른 공구를 골라보세요!'); return; }
    this.clearedIssues.add(this.activeIssue);
    this.activeIssue = null;
    this.feedback('고쳤어요! 생산라인이 다시 움직여요.');
  }

  private feedback(message: string) { this.notice = message; this.noticeTime = 2.2; this.callbacks.onFeedback(message); }

  update(_time: number, delta: number) {
    if (this.finished) return;
    const dt = Math.min(delta / 1000, .05);
    this.elapsed += dt;
    this.callbacks.onTick(Math.max(0, Math.ceil(C.durationSeconds - this.elapsed)));
    if (this.elapsed >= C.durationSeconds) { this.end('timeout'); return; }
    this.movePlayer(dt);
    this.playerSprite?.setPosition(this.player.x, this.player.y - 43);
    this.cameras.main.setScroll(Phaser.Math.Clamp(this.player.x - 240, 0, C.width - 480), 0);
    this.moveProduct(dt);
    if (this.activeIssue === 'penguin' && this.player.floor === 2 && Math.abs(this.player.x - this.penguinX) < 65) {
      this.clearedIssues.add('penguin'); this.activeIssue = null; this.penguinX = 605;
      this.feedback('펭귄이 물러났어요. 화석이 다시 출발해요!');
    }
    this.noticeTime = Math.max(0, this.noticeTime - dt);
    this.draw();
  }

  private movePlayer(dt: number) {
    const direction = Number(this.held.has('right')) - Number(this.held.has('left'));
    if (direction) this.player.x = Phaser.Math.Clamp(this.player.x + direction * C.playerSpeed * dt, 25, C.width - 25);
    const onLadder = Math.abs(this.player.x - C.ladderX) < 40;
    const vertical = Number(this.held.has('down')) - Number(this.held.has('up'));
    if (onLadder && vertical) {
      this.player.y = Phaser.Math.Clamp(this.player.y + vertical * C.playerSpeed * dt, C.upperY, C.groundY);
      this.player.climbing = this.player.y !== C.upperY && this.player.y !== C.groundY;
      if (this.player.y === C.upperY) this.player.floor = 2;
      if (this.player.y === C.groundY) this.player.floor = 1;
    } else if (!this.player.climbing) this.player.y = this.player.floor === 1 ? C.groundY : C.upperY;
    if (this.player.climbing && !onLadder) this.player.x = C.ladderX;
  }

  private moveProduct(dt: number) {
    if (this.activeIssue) return;
    const gates: Partial<Record<number, IceIssue>> = { 1: 'jam', 4: 'frozen', 6: 'power', 7: 'penguin' };
    const next = route[this.routeIndex + 1];
    if (!next) { this.mounted = true; this.callbacks.onProgress(true); this.feedback('화석 복원 +1! 다음 뼈도 만들고 싶나요?'); this.end('success'); return; }
    const distance = Math.hypot(next.x - this.product.x, next.y - this.product.y);
    if (distance <= C.productSpeed * dt) {
      this.product.x = next.x; this.product.y = next.y; this.routeIndex++;
      const gate = gates[this.routeIndex];
      if (gate && !this.clearedIssues.has(gate)) {
        this.activeIssue = gate;
        this.feedback(gate === 'penguin' ? '펭귄이 컨베이어를 막았어요! 가까이 가세요.' : `${ICE_ISSUES[gate].label}! 알맞은 공구가 필요해요.`);
      }
    } else {
      this.product.x += (next.x - this.product.x) / distance * C.productSpeed * dt;
      this.product.y += (next.y - this.product.y) / distance * C.productSpeed * dt;
    }
  }

  private end(result: Result) { this.finished = true; this.callbacks.onResult(result); this.draw(); }

  private draw() {
    const g = this.ink; g.clear();
    g.fillGradientStyle(0x123f62, 0x123f62, 0x071e38, 0x071e38).fillRect(0, 0, C.width, C.height);
    g.fillStyle(0x9de8f5, .12).fillCircle(140, 110, 100).fillCircle(520, 140, 130);
    g.fillStyle(0xc8eff5, .85).fillRoundedRect(0, C.groundY + 18, C.width, 26, 8).fillRoundedRect(230, C.upperY + 18, 390, 22, 8);
    g.fillStyle(0x5b9bb2).fillRoundedRect(60, 545, 565, 12, 6).fillRoundedRect(245, 305, 345, 11, 5);
    for (let x = 75; x < 620; x += 38) g.fillStyle(0x7fc1cf).fillCircle(x, 551, 4);
    for (let x = 255; x < 590; x += 38) g.fillStyle(0x7fc1cf).fillCircle(x, 310, 4);
    g.lineStyle(7, 0xe2c375).lineBetween(C.ladderX - 15, C.upperY + 18, C.ladderX - 15, C.groundY + 18).lineBetween(C.ladderX + 15, C.upperY + 18, C.ladderX + 15, C.groundY + 18);
    for (let y = C.upperY + 35; y < C.groundY + 15; y += 28) g.lineBetween(C.ladderX - 15, y, C.ladderX + 15, y);
    this.drawMachine(170, 505, 0x6fbed4, 'jam');
    this.drawMachine(430, 265, 0x86e7ed, 'frozen');
    this.drawMachine(550, 265, 0xffdb71, 'power');
    g.fillStyle(0x755d52).fillRoundedRect(565, 470, 65, 65, 10);
    g.fillStyle(0xffe8a7).fillRoundedRect(578, 483, 39, 42, 6);
    if (this.mounted) this.drawBone(597, 498, 1.1);
    if (this.activeIssue === 'jam') {
      for (const x of [82, 119]) g.fillStyle(0xa8e9f4, .8).fillRoundedRect(x - 15, 485, 30, 30, 5);
    }
    this.drawProduct();
    if (this.activeIssue === 'penguin') {
      g.fillStyle(0x1c2a42).fillEllipse(this.penguinX, 280, 45, 53);
      g.fillStyle(0xf3fbff).fillEllipse(this.penguinX, 288, 25, 31);
      g.fillStyle(0xffbd53).fillTriangle(this.penguinX - 4, 278, this.penguinX + 10, 282, this.penguinX - 4, 286);
      this.drawAlert(this.penguinX, 216);
    }
    if (!this.playerSprite) {
      g.fillStyle(0x17334d).fillEllipse(this.player.x, this.player.y - 36, 39, 46);
      g.fillStyle(0xffbd7b).fillCircle(this.player.x, this.player.y - 67, 17);
      g.fillStyle(0xf5a33e).fillRoundedRect(this.player.x - 21, this.player.y - 84, 42, 13, 6);
      g.fillStyle(0x79d5de).fillRoundedRect(this.player.x - 19, this.player.y - 54, 38, 31, 7);
      g.fillStyle(0x193453).fillRoundedRect(this.player.x - 18, this.player.y - 16, 15, 20, 4).fillRoundedRect(this.player.x + 3, this.player.y - 16, 15, 20, 4);
    }
    if (this.noticeTime > 0) g.fillStyle(0xffe59a, .15).fillRoundedRect(this.player.x - 32, this.player.y - 103, 64, 8, 4);
  }

  private drawMachine(x: number, y: number, color: number, id: Exclude<IceIssue, 'penguin'>) {
    const active = this.activeIssue === id;
    this.ink.fillStyle(active ? 0xe85b64 : color).fillRoundedRect(x - 31, y - 51, 62, 47, 8);
    this.ink.fillStyle(0x163450).fillCircle(x, y - 27, 11);
    if (active) this.drawAlert(x, y - 92);
  }
  private drawAlert(x: number, y: number) {
    this.ink.fillStyle(0xffe27e).fillCircle(x, y, 22).fillStyle(0x7d2e2e).fillRect(x - 3, y - 12, 6, 18).fillCircle(x, y + 11, 3);
  }
  private drawBone(x: number, y: number, scale = 1) {
    const g = this.ink; g.lineStyle(13 * scale, 0xf5e7c8).lineBetween(x - 18 * scale, y + 8 * scale, x + 18 * scale, y - 8 * scale);
    g.fillStyle(0xfff4db).fillCircle(x - 19 * scale, y + 8 * scale, 9 * scale).fillCircle(x + 19 * scale, y - 8 * scale, 9 * scale);
  }
  private drawProduct() {
    const { x, y } = this.product; const g = this.ink;
    if (this.routeIndex < 2) {
      g.fillStyle(0xa8e9f4, .9).fillRoundedRect(x - 21, y - 24, 42, 42, 6);
      if (this.routeIndex === 1) g.lineStyle(3, 0xffffff).lineBetween(x - 14, y - 18, x + 15, y + 12);
    } else if (this.routeIndex < 5) {
      g.fillStyle(0x90dbe9, .84).fillRoundedRect(x - 23, y - 26, 46, 45, 7);
      g.fillStyle(0xf9eccc, .7).fillEllipse(x, y - 4, 24, 12);
      if (this.routeIndex >= 4) this.drawBone(x, y - 4, .55);
    } else if (this.routeIndex < 7) {
      this.drawBone(x, y - 3, .7);
      if (this.routeIndex === 5) g.fillStyle(0x8cdcec, .5).fillCircle(x + 14, y - 18, 9);
    } else this.drawBone(x, y - 3, .8);
  }
}

export function createIceFossilPrototypeGame(parent: HTMLElement, callbacks: Callbacks): IceFossilController {
  const scene = new IceScene(callbacks);
  const game = new Phaser.Game({
    type: Phaser.AUTO, parent, width: 480, height: C.height,
    backgroundColor: '#0a2945', render: { pixelArt: false },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene,
  });
  return { setHeld: (action, held) => scene.setHeld(action, held), act: action => scene.act(action), destroy: () => game.destroy(true) };
}
