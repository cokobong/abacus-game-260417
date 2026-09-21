import Phaser from 'phaser';
import type { IceAction, IceIssue } from './iceFossilPrototypeConfig';
import {
  ICE_FOSSIL_SLICE as C, ISSUE_AT_ROUTE_INDEX, SLICE_ISSUES, SLICE_ROUTE,
  type SliceToolAction,
} from './iceFossilSliceConfig';

type Result = 'success' | 'timeout';
export type SliceHudState = {
  remaining: number;
  stage: number;
  stageLabel: string;
  backlog: number;
  selectedTool: SliceToolAction;
};
type Callbacks = {
  onHud: (hud: SliceHudState) => void;
  onFeedback: (message: string) => void;
  onResult: (result: Result) => void;
};
export type IceFossilSliceController = {
  setHeld: (action: IceAction, held: boolean) => void;
  act: (action: SliceToolAction) => void;
  destroy: () => void;
};
type Product = {
  id: number;
  main: boolean;
  spawned: boolean;
  finished: boolean;
  routeIndex: number;
  x: number;
  y: number;
  processLeft: number;
};

class IceFossilSliceScene extends Phaser.Scene {
  private ink!: Phaser.GameObjects.Graphics;
  private labels: Phaser.GameObjects.Text[] = [];
  private player: { x: number; y: number; floor: 1 | 2; climbing: boolean; facing: number } = {
    x: 100, y: C.upperY, floor: 2, climbing: false, facing: 1,
  };
  private held = new Set<IceAction>();
  private products: Product[] = [0, 1, 2].map(id => ({ id, main: id === 0, spawned: id === 0, finished: false, routeIndex: 0, x: SLICE_ROUTE[0].x, y: SLICE_ROUTE[0].y, processLeft: 0 }));
  private activeIssue: IceIssue | null = null;
  private clearedIssues = new Set<IceIssue>();
  private selectedTool: SliceToolAction = 'toolRepair';
  private repairing: { issue: IceIssue; left: number } | null = null;
  private elapsed = 0;
  private completionLeft = 0;
  private finished = false;
  private lastHud = '';
  private feedbackUntil = 0;

  constructor(private callbacks: Callbacks) { super('IceFossilSlice'); }

  create() {
    this.cameras.main.setBackgroundColor('#061d31');
    this.cameras.main.setBounds(0, 0, C.worldWidth, C.height);
    this.ink = this.add.graphics();
    this.addLabels();
    this.cameras.main.centerOn(this.player.x + C.cameraLead, C.height / 2);
    this.callbacks.onFeedback('화석 원석이 움직입니다. 문제 경고를 따라가세요!');
    this.emitHud(true);
  }

  private addLabels() {
    const style = { fontFamily: 'sans-serif', fontSize: '15px', color: '#dff9ff', fontStyle: 'bold', stroke: '#061d31', strokeThickness: 4 };
    const entries: [number, number, string][] = [
      [48, 145, '원석 투입기'], [205, 145, '절단기'], [395, 145, '균열 · 노출기'],
      [650, 410, '세척기'], [825, 410, '복원대'], [510, 355, '사다리'],
    ];
    this.labels = entries.map(([x, y, label]) => this.add.text(x, y, label, style));
  }

  setHeld(action: IceAction, held: boolean) { if (held) this.held.add(action); else this.held.delete(action); }

  act(action: SliceToolAction) {
    if (this.finished) return;
    this.selectedTool = action;
    this.emitHud(true);
    if (!this.activeIssue) { this.feedback('공구를 선택했어요. 문제가 생긴 설비로 이동하세요.'); return; }
    const issue = SLICE_ISSUES[this.activeIssue];
    if (issue.action === 'approach') { this.feedback('펭귄 가까이 가면 달아나요!'); return; }
    if (this.player.floor !== issue.floor || Math.abs(this.player.x - issue.x) > C.interactionDistance) {
      this.feedback(`${issue.label} 근처에서 ${issue.hint}를 사용하세요.`); return;
    }
    if (action !== issue.action) { this.feedback(`이 문제에는 ${issue.hint}가 필요해요!`); return; }
    if (!this.repairing) {
      this.repairing = { issue: this.activeIssue, left: C.repairSeconds };
      this.feedback(`${issue.label} 수리 중…`);
    }
  }

  update(_time: number, delta: number) {
    if (this.finished) return;
    const dt = Math.min(delta / 1000, .05);
    this.elapsed += dt;
    if (this.elapsed >= C.durationSeconds) { this.end('timeout'); return; }
    this.spawnProducts();
    this.movePlayer(dt);
    this.updateRepair(dt);
    this.updateProducts(dt);
    this.updatePenguin();
    this.updateCamera();
    if (this.completionLeft > 0) {
      this.completionLeft -= dt;
      const targetScroll = C.worldWidth - C.viewportWidth;
      this.cameras.main.scrollX = Phaser.Math.Linear(this.cameras.main.scrollX, targetScroll, .045);
      if (this.completionLeft <= 0) this.end('success');
    }
    this.emitHud();
    this.draw();
  }

  private spawnProducts() {
    C.dummySpawnSeconds.forEach((time, index) => {
      const product = this.products[index + 1];
      if (!product.spawned && this.elapsed >= time) product.spawned = true;
    });
  }

  private movePlayer(dt: number) {
    if (this.repairing || this.completionLeft > 0) return;
    const direction = Number(this.held.has('right')) - Number(this.held.has('left'));
    if (direction) {
      this.player.facing = direction;
      this.player.x = Phaser.Math.Clamp(this.player.x + direction * C.playerSpeed * dt, 28, C.worldWidth - 28);
    }
    const onLadder = Math.abs(this.player.x - C.ladderX) < 45;
    const vertical = Number(this.held.has('down')) - Number(this.held.has('up'));
    if (onLadder && vertical) {
      this.player.x = C.ladderX;
      this.player.y = Phaser.Math.Clamp(this.player.y + vertical * C.playerSpeed * dt, C.upperY, C.lowerY);
      this.player.climbing = this.player.y > C.upperY && this.player.y < C.lowerY;
      if (this.player.y === C.upperY) this.player.floor = 2;
      if (this.player.y === C.lowerY) this.player.floor = 1;
    } else if (!this.player.climbing) this.player.y = this.player.floor === 2 ? C.upperY : C.lowerY;
  }

  private updateRepair(dt: number) {
    if (!this.repairing) return;
    this.repairing.left -= dt;
    if (this.repairing.left > 0) return;
    const issue = this.repairing.issue;
    this.repairing = null;
    this.resolveIssue(issue, '수리 완료! 밀린 생산물이 다시 움직입니다.');
  }

  private updateProducts(dt: number) {
    const active = this.products.filter(product => product.spawned && !product.finished).sort((a, b) => b.routeIndex - a.routeIndex || b.x - a.x);
    for (const product of active) {
      if (product.processLeft > 0) { product.processLeft = Math.max(0, product.processLeft - dt); continue; }
      const next = SLICE_ROUTE[product.routeIndex + 1];
      if (!next) {
        product.finished = true;
        if (product.main && !this.completionLeft) {
          this.completionLeft = C.completionSeconds;
          this.feedback('화석 장착 완료! 복원대가 빛나기 시작합니다.');
        }
        continue;
      }
      if (this.activeIssue) continue;
      const ahead = active.find(other => other.id !== product.id && this.routeProgress(other) > this.routeProgress(product));
      if (ahead && this.distanceBetween(product, ahead) < C.backlogSpacing) continue;
      const distance = Math.hypot(next.x - product.x, next.y - product.y);
      const step = C.productSpeed * dt;
      if (distance <= step) {
        product.x = next.x; product.y = next.y; product.routeIndex++;
        if ([2, 4, 5, 8].includes(product.routeIndex)) product.processLeft = C.machineProcessSeconds;
        if (product.main) {
          const issue = ISSUE_AT_ROUTE_INDEX[product.routeIndex];
          if (issue && !this.clearedIssues.has(issue)) this.startIssue(issue);
        }
      } else {
        product.x += (next.x - product.x) / distance * step;
        product.y += (next.y - product.y) / distance * step;
      }
    }
  }

  private routeProgress(product: Product) {
    const next = SLICE_ROUTE[product.routeIndex + 1];
    if (!next) return product.routeIndex + 1;
    const from = SLICE_ROUTE[product.routeIndex];
    const full = Math.hypot(next.x - from.x, next.y - from.y) || 1;
    const remaining = Math.hypot(next.x - product.x, next.y - product.y);
    return product.routeIndex + (1 - remaining / full);
  }

  private distanceBetween(a: Product, b: Product) { return Math.hypot(a.x - b.x, a.y - b.y); }

  private startIssue(issue: IceIssue) {
    this.activeIssue = issue;
    const data = SLICE_ISSUES[issue];
    this.feedback(issue === 'penguin' ? '펭귄이 하층 컨베이어를 막았어요! 가까이 가세요.' : `${data.label}! ${data.hint}가 필요해요.`);
  }

  private updatePenguin() {
    if (this.activeIssue !== 'penguin') return;
    const issue = SLICE_ISSUES.penguin;
    if (this.player.floor === issue.floor && Math.abs(this.player.x - issue.x) <= C.interactionDistance) {
      this.resolveIssue('penguin', '펭귄이 미끄러져 달아났어요! 생산 재개!');
    }
  }

  private resolveIssue(issue: IceIssue, message: string) {
    this.clearedIssues.add(issue);
    if (this.activeIssue === issue) this.activeIssue = null;
    this.feedback(message);
  }

  private updateCamera() {
    if (this.completionLeft > 0) return;
    const lead = this.player.facing * C.cameraLead;
    const desired = Phaser.Math.Clamp(this.player.x + lead - C.viewportWidth / 2, 0, C.worldWidth - C.viewportWidth);
    this.cameras.main.scrollX = Phaser.Math.Linear(this.cameras.main.scrollX, desired, .09);
  }

  private mainProduct() { return this.products[0]; }

  private backlogCount() {
    if (!this.activeIssue) return 0;
    return this.products.filter(product => product.spawned && !product.finished).length - 1;
  }

  private emitHud(force = false) {
    const main = this.mainProduct();
    const route = SLICE_ROUTE[main.routeIndex];
    const stage = route.state;
    const hud: SliceHudState = {
      remaining: Math.max(0, Math.ceil(C.durationSeconds - this.elapsed)),
      stage,
      stageLabel: route.label,
      backlog: Math.max(0, this.backlogCount()),
      selectedTool: this.selectedTool,
    };
    const serialized = JSON.stringify(hud);
    if (force || serialized !== this.lastHud) { this.lastHud = serialized; this.callbacks.onHud(hud); }
  }

  private feedback(message: string) { this.feedbackUntil = this.elapsed + 2.5; this.callbacks.onFeedback(message); }
  private end(result: Result) { this.finished = true; this.callbacks.onResult(result); this.draw(); }

  private draw() {
    const g = this.ink; g.clear();
    g.fillGradientStyle(0x123c58, 0x123c58, 0x061a2c, 0x061a2c).fillRect(0, 0, C.worldWidth, C.height);
    this.drawEnvironment(g);
    this.drawConveyors(g);
    this.drawMachines(g);
    this.products.filter(product => product.spawned && !product.finished).forEach(product => this.drawProduct(g, product));
    this.drawIssue(g);
    this.drawPlayer(g);
    if (this.completionLeft > 0) this.drawCompletion(g);
  }

  private drawEnvironment(g: Phaser.GameObjects.Graphics) {
    g.fillStyle(0x9eeaff, .09).fillCircle(130, 100, 135).fillCircle(560, 80, 170).fillCircle(890, 130, 120);
    g.fillStyle(0x0d2b42).fillRoundedRect(20, 105, 920, 475, 24);
    g.lineStyle(3, 0x4e8aa1, .45);
    for (let x = 35; x < 940; x += 95) g.lineBetween(x, 118, x + 45, 565);
    g.fillStyle(0xc4edf4).fillRoundedRect(20, C.upperY + 18, 555, 24, 8).fillRoundedRect(535, C.lowerY + 18, 405, 24, 8);
    g.fillStyle(0x6aa2b4).fillRect(0, 582, C.worldWidth, 16);
    g.lineStyle(7, 0xf2cc75).lineBetween(C.ladderX - 17, C.upperY + 20, C.ladderX - 17, C.lowerY + 20).lineBetween(C.ladderX + 17, C.upperY + 20, C.ladderX + 17, C.lowerY + 20);
    for (let y = C.upperY + 35; y < C.lowerY + 15; y += 29) g.lineBetween(C.ladderX - 17, y, C.ladderX + 17, y);
    g.fillStyle(0x183f57).fillRoundedRect(37, 615, 885, 44, 12);
    g.fillStyle(0x5f90a3, .6);
    for (let x = 62; x < 920; x += 88) g.fillCircle(x, 637, 9);
  }

  private drawConveyors(g: Phaser.GameObjects.Graphics) {
    this.drawBelt(g, 55, 270, 480);
    this.drawBelt(g, 590, 535, 315);
    g.lineStyle(5, 0x6bb8c7, .75).lineBetween(555, 270, 555, 490);
  }

  private drawBelt(g: Phaser.GameObjects.Graphics, x: number, y: number, width: number) {
    g.fillStyle(0x315e70).fillRoundedRect(x, y, width, 18, 8);
    g.lineStyle(2, 0x98dce5);
    for (let cx = x + 15; cx < x + width - 8; cx += 34) g.strokeCircle(cx, y + 9, 6);
  }

  private drawMachines(g: Phaser.GameObjects.Graphics) {
    this.machine(g, 115, 220, 0x4d9bb2, 'IN', null);
    this.machine(g, 250, 220, 0x65b7c7, 'CUT', 'jam');
    this.machine(g, 440, 220, 0x779bd6, 'CRACK', 'power');
    this.machine(g, 710, 485, 0x58c7d1, 'WASH', 'frozen');
    g.fillStyle(0x705e55).fillRoundedRect(830, 450, 95, 87, 12);
    g.fillStyle(0xf4d789).fillRoundedRect(845, 465, 65, 54, 8);
    g.lineStyle(3, 0xfff1b7).strokeRoundedRect(851, 471, 53, 42, 7);
  }

  private machine(g: Phaser.GameObjects.Graphics, x: number, y: number, color: number, mark: string, issue: IceIssue | null) {
    const active = issue && this.activeIssue === issue;
    g.fillStyle(active ? 0xd35462 : color).fillRoundedRect(x - 42, y - 55, 84, 65, 11);
    g.fillStyle(0x17364c).fillRoundedRect(x - 30, y - 39, 60, 30, 7);
    g.lineStyle(4, active ? 0xffe069 : 0xa9edf3).strokeCircle(x, y - 24, 12);
    g.fillStyle(active ? 0xffe069 : 0xbdf7ff).fillCircle(x, y - 24, 5);
    g.fillStyle(0x15344a).fillRoundedRect(x - 27, y + 10, 12, 26, 3).fillRoundedRect(x + 15, y + 10, 12, 26, 3);
    void mark;
  }

  private drawIssue(g: Phaser.GameObjects.Graphics) {
    if (!this.activeIssue) return;
    const issue = SLICE_ISSUES[this.activeIssue];
    const y = issue.floor === 2 ? 130 : 395;
    if (this.activeIssue === 'frozen') {
      g.fillStyle(0x9eefff, .62).fillTriangle(665, 497, 690, 425, 712, 499).fillTriangle(708, 500, 740, 420, 762, 500);
      g.lineStyle(3, 0xe7fdff).strokeCircle(710, 458, 48);
    } else if (this.activeIssue === 'jam') {
      g.fillStyle(0xb8ecf2).fillRoundedRect(205, 235, 40, 42, 8).fillRoundedRect(245, 230, 47, 47, 8);
      g.lineStyle(3, 0xffffff).lineBetween(213, 244, 236, 267).lineBetween(260, 238, 281, 264);
    } else if (this.activeIssue === 'power') {
      const bright = Math.floor(this.elapsed * 5) % 2 === 0;
      g.fillStyle(bright ? 0xffe66d : 0x593d43).fillCircle(440, 171, 11);
      g.lineStyle(4, 0xffdf66).lineBetween(454, 175, 470, 164).lineBetween(470, 164, 480, 179);
    } else {
      g.fillStyle(0x172638).fillEllipse(issue.x, 493, 48, 58);
      g.fillStyle(0xf3fbff).fillEllipse(issue.x, 501, 27, 35);
      g.fillStyle(0xffbe4d).fillTriangle(issue.x - 3, 488, issue.x + 14, 493, issue.x - 3, 498);
      g.fillStyle(0x62b9d0).fillEllipse(issue.x - 22, 500, 15, 28).fillEllipse(issue.x + 22, 500, 15, 28);
    }
    const pulse = 1 + Math.sin(this.elapsed * 7) * .12;
    g.fillStyle(0xffdc62).fillCircle(issue.x, y, 25 * pulse);
    g.fillStyle(0x742e34).fillRect(issue.x - 3, y - 14, 6, 19).fillCircle(issue.x, y + 13, 4);
    if (this.repairing) {
      const progress = 1 - this.repairing.left / C.repairSeconds;
      g.fillStyle(0x12344c).fillRoundedRect(issue.x - 40, y + 35, 80, 10, 5);
      g.fillStyle(0x68e3b7).fillRoundedRect(issue.x - 38, y + 37, 76 * progress, 6, 3);
    }
  }

  private drawProduct(g: Phaser.GameObjects.Graphics, product: Product) {
    const route = SLICE_ROUTE[product.routeIndex];
    const state = route.state;
    const scale = product.main ? 1 : .78;
    const x = product.x; const y = product.y - 18;
    if (state <= 2) {
      const size = (state === 0 ? 42 : state === 1 ? 47 : 50) * scale;
      g.fillStyle(product.main ? 0x9eeaf4 : 0x69afc2, .94).fillRoundedRect(x - size / 2, y - size / 2, size, size, state === 0 ? 9 : 4);
      if (state >= 1) g.lineStyle(3 * scale, 0xf2feff).lineBetween(x - 14 * scale, y - 15 * scale, x + 12 * scale, y + 13 * scale);
      if (state >= 2) this.drawBone(g, x, y, .5 * scale, .62);
    } else if (state === 3) {
      g.fillStyle(0x78c8d8, .58).fillRoundedRect(x - 25 * scale, y - 23 * scale, 50 * scale, 45 * scale, 7);
      this.drawBone(g, x, y, .7 * scale, 1);
    } else {
      this.drawBone(g, x, y, .86 * scale, 1);
      if (state === 4) {
        g.fillStyle(0xd5fbff, .8).fillCircle(x - 22 * scale, y - 19 * scale, 4).fillCircle(x + 20 * scale, y - 24 * scale, 3);
      }
    }
    if (product.main) {
      g.lineStyle(2, 0xffdf75).strokeCircle(x, y, 31 * scale);
      g.fillStyle(0xffdf75).fillTriangle(x - 6, y - 42, x + 6, y - 42, x, y - 33);
    }
  }

  private drawBone(g: Phaser.GameObjects.Graphics, x: number, y: number, scale: number, alpha: number) {
    g.lineStyle(13 * scale, 0xfff0cf, alpha).lineBetween(x - 18 * scale, y + 8 * scale, x + 18 * scale, y - 8 * scale);
    g.fillStyle(0xfff7df, alpha).fillCircle(x - 20 * scale, y + 9 * scale, 9 * scale).fillCircle(x + 20 * scale, y - 9 * scale, 9 * scale);
  }

  private drawPlayer(g: Phaser.GameObjects.Graphics) {
    const x = this.player.x; const y = this.player.y;
    const working = Boolean(this.repairing);
    g.fillStyle(0x132f49).fillRoundedRect(x - 20, y - 54, 40, 38, 10);
    g.fillStyle(0x68d6df).fillRoundedRect(x - 18, y - 50, 36, 31, 8);
    g.fillStyle(0xffbd79).fillCircle(x, y - 68, 17);
    g.fillStyle(0xf1a53e).fillRoundedRect(x - 21, y - 85, 42, 14, 7);
    g.fillStyle(0x17324e).fillRoundedRect(x - 18, y - 18, 15, 21, 4).fillRoundedRect(x + 3, y - 18, 15, 21, 4);
    const armX = x + this.player.facing * 25;
    g.lineStyle(7, 0x68d6df).lineBetween(x + this.player.facing * 14, y - 43, armX, y - (working ? 55 : 32));
    if (working) {
      g.lineStyle(4, 0xffdf76).lineBetween(armX, y - 58, armX + 12, y - 70).lineBetween(armX + 7, y - 72, armX + 16, y - 65);
    }
  }

  private drawCompletion(g: Phaser.GameObjects.Graphics) {
    const x = 878; const y = 486;
    const pulse = 1 + Math.sin(this.elapsed * 8) * .12;
    g.fillStyle(0xffe991, .12).fillCircle(x, y, 92 * pulse).fillStyle(0xcdfaff, .17).fillCircle(x, y, 66 * pulse);
    this.drawBone(g, x, y, 1.25, 1);
    for (let i = 0; i < 8; i++) {
      const angle = i / 8 * Math.PI * 2 + this.elapsed;
      const sx = x + Math.cos(angle) * 64; const sy = y + Math.sin(angle) * 52;
      g.fillStyle(i % 2 ? 0xffe88f : 0xd2fbff).fillCircle(sx, sy, 3 + (i % 3));
    }
  }
}

export function createIceFossilSliceGame(parent: HTMLElement, callbacks: Callbacks): IceFossilSliceController {
  const scene = new IceFossilSliceScene(callbacks);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: C.viewportWidth,
    height: C.height,
    backgroundColor: '#061d31',
    render: { pixelArt: false, antialias: true },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene,
  });
  return {
    setHeld: (action, held) => scene.setHeld(action, held),
    act: action => scene.act(action),
    destroy: () => game.destroy(true),
  };
}
