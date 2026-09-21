import Phaser from 'phaser';
import { ICE_EVENT_PATTERNS } from '../../../config/iceContinent/iceEventPatterns';
import { ICE_MAP_TEMPLATES } from '../../../config/iceContinent/iceMapTemplates';
import { ICE_ISSUE_TOOLS, type IceFloorId, type IceIssueType, type IceMissionConfig, type IceTool } from '../../../config/iceContinent/iceMissionTypes';
import type { IceInput } from '../../../config/iceContinent/input';
import { createEventScheduler, nextScheduledEvent, type IceSchedulerState } from './runtime/eventScheduler';
import { advanceProduction, createProductionState, productionBacklog, productionProgress, restartProduction, type IceProductionState } from './runtime/productionModel';
import { assertIceMission } from './runtime/missionValidator';

const WIDTH = 620; const HEIGHT = 720;
const ISSUE_LABELS: Record<IceIssueType, string> = { freeze: '결빙', jam: '기계 막힘', power: '전원 문제', conveyor_block: '컨베이어 장애물', penguin_interference: '펭귄 방해' };
const TOOL_LABELS: Record<IceTool, string> = { toolHeat: '열 도구', toolRepair: '렌치', toolElectric: '전기 도구', interact: '상호작용' };

export interface IceMissionHud { elapsed: number; remaining: number; progress: number; visualState: string; backlog: number; backlogCapacity: number; lost: number; completed: number; target: number; selectedTool: IceTool; highlightedTool: IceTool | null; phase: 'playing' | 'clear' | 'failure'; activeIssue: IceIssueType | null; activeMachineName: string | null; surge: boolean; repaired: number }
export interface IceTutorialPrompt { id: string; title: string; body: string; button: string }
export interface IceIssueNavigation { direction: 'left' | 'right' | null; layer: IceFloorId | null }
export interface IceGameCallbacks { onState: (state: IceMissionHud) => void; onFeedback: (message: string) => void; onNavigation: (navigation: IceIssueNavigation) => void; onTutorialPrompt: (prompt: IceTutorialPrompt) => void; onClear: () => void; onFailure: () => void }
export interface IceContinentController { selectTool: (tool: IceTool) => void; repair: () => void; startMission: () => void; acknowledgeTutorial: () => void; destroy: () => void }
type ActiveIssue = { type: IceIssueType; machineId: string; severity: string; warningLeft: number; repairLeft: number | null; behavior?: string; penguinX?: number; penguinFloor?: IceFloorId; penguinArrived?: boolean };

class IceMissionScene extends Phaser.Scene {
  private readonly map; private readonly pattern; private production: IceProductionState; private scheduler: IceSchedulerState;
  private ink!: Phaser.GameObjects.Graphics;
  private player = { x: 0, y: 0, floor: 'upper' as IceFloorId, climbing: false, facing: 1 };
  private selectedTool: IceTool = 'toolRepair'; private activeIssues: ActiveIssue[] = [];
  private elapsed = 0; private wrongToolLock = 0; private repaired = 0; private phase: IceMissionHud['phase'] = 'playing';
  private completionLeft = 0; private lastHud = ''; private lastNavigation = ''; private tutorialShown = new Set<string>();
  private started = false; private tutorialPaused = false; private waitingStartAction: boolean; private lastVisualState = 'raw';
  private nextIssueAllowedAt = 0; private lastLostCount = 0;

  constructor(private controls: IceInput, private callbacks: IceGameCallbacks, private config: IceMissionConfig) {
    super(`IceMission-${config.id}`); const validation = assertIceMission(config);
    validation.warnings.forEach(warning => console.warn(`[Ice mission ${config.id}] ${warning}`));
    this.map = ICE_MAP_TEMPLATES[config.mapTemplate]; this.pattern = ICE_EVENT_PATTERNS[config.eventPatternId];
    this.production = createProductionState(config, this.map); this.scheduler = createEventScheduler(this.pattern, 260417 + Number(config.id.replace('-', '')));
    this.waitingStartAction = config.tutorial.requireStartAction;
  }
  startMission() { this.started = true; this.feedback(this.waitingStartAction ? '가까운 초록 레버를 눌러 생산을 시작해요!' : '화석 복원을 시작해요!'); }
  acknowledgeTutorial() { this.tutorialPaused = false; }
  create() {
    this.ink = this.add.graphics(); const floor = this.map.floors.find(item => item.id === this.map.playerSpawn.floor)!;
    this.player = { x: this.map.playerSpawn.x, y: floor.y, floor: floor.id, climbing: false, facing: 1 };
    const style = { fontFamily: 'sans-serif', fontSize: '16px', color: '#e8fbff', fontStyle: 'bold', stroke: '#11344c', strokeThickness: 4 };
    this.map.machines.forEach(machine => this.add.text(machine.x, machine.y - 92, machine.name, style).setOrigin(.5));
    this.add.text(this.map.restorationStand.x, this.map.restorationStand.y - 105, '복원대', style).setOrigin(.5);
    this.cameras.main.setBounds(this.map.cameraBounds.x, this.map.cameraBounds.y, this.map.cameraBounds.width, this.map.cameraBounds.height);
    this.feedback(this.config.id === '1-1' ? '빛나는 화석 원석이 어디로 가는지 지켜보세요.' : '경고가 뜬 기계로 이동해 알맞은 도구를 사용하세요.');
    this.draw(); this.emitHud(true); this.updateNavigation();
  }
  selectTool(tool: IceTool) { if (this.phase !== 'playing') return; this.selectedTool = tool; this.emitHud(true); if (!this.activeIssues.length) this.feedback(`${TOOL_LABELS[tool]}를 준비했어요.`); else this.tryRepair(); }
  repair() { if (this.phase === 'playing') this.tryRepair(); }
  update(_time: number, delta: number) {
    if (this.phase !== 'playing' || !this.started || this.tutorialPaused) return; const dt = Math.min(delta / 1000, .05); this.wrongToolLock = Math.max(0, this.wrongToolLock - dt);
    this.movePlayer(dt); if (this.controls.consumeActionA()) this.tryRepair();
    if (this.waitingStartAction) { this.updateCamera(); this.draw(); this.emitHud(); return; }
    this.elapsed += dt;
    if (this.elapsed >= this.config.durationSec) { this.finish('failure'); return; }
    if (this.controls.consumeActionB()) this.selectedTool = this.selectedTool === 'toolRepair' ? 'toolHeat' : this.selectedTool === 'toolHeat' ? 'toolElectric' : 'toolRepair';
    this.updateIssues(dt); const blocked = this.activeIssues.some(issue => issue.warningLeft <= 0 && (issue.type !== 'penguin_interference' || issue.penguinArrived !== false) && (this.config.stage === 1 || issue.severity !== 'low' || issue.type === 'penguin_interference'));
    this.production = advanceProduction(this.production, dt, this.config, this.map, blocked); this.scheduleIssue();
    if (this.production.lostCount > this.lastLostCount) { this.lastLostCount = this.production.lostCount; this.cameras.main.shake(180, .008); this.feedback('대기열 과부하! 가장 오래 기다린 화석 1개를 잃었어요.'); }
    const visualState = this.production.items[0]?.visualState ?? 'raw';
    if (this.config.id === '1-1' && visualState !== this.lastVisualState) {
      this.lastVisualState = visualState;
      if (visualState === 'cut') this.feedback('기계가 화석을 다듬고 있어요!');
      if (visualState === 'silhouette') this.feedback('오! 화석이 보이기 시작했어요!');
      if (visualState === 'cleaned') this.feedback('이제 마지막이에요!');
    }
    const objectiveComplete = this.config.production.arcadeLoop ? this.production.completedCount >= this.config.production.targetCompleted : this.config.stage === 1 ? this.production.items[0]?.completed : this.production.items.every(item => item.completed);
    if (objectiveComplete && !this.completionLeft) { this.completionLeft = 2.8; this.feedback('화석 표본이 전시대에 장착됐어요!'); }
    if (this.completionLeft > 0) { this.completionLeft -= dt; this.cameras.main.scrollX = Phaser.Math.Linear(this.cameras.main.scrollX, Math.max(0, this.map.restorationStand.x - WIDTH * .62), .05); if (this.completionLeft <= 0) { this.finish('clear'); return; } }
    else this.updateCamera();
    this.draw(); this.emitHud(); this.updateNavigation();
  }
  private movePlayer(dt: number) {
    if (this.activeIssues.some(issue => issue.repairLeft != null) || this.completionLeft > 0 || this.wrongToolLock > 0) return;
    const direction = Number(this.controls.held('right')) - Number(this.controls.held('left')); const floor = this.map.floors.find(item => item.id === this.player.floor)!;
    if (direction) { this.player.facing = direction; this.player.x = Phaser.Math.Clamp(this.player.x + direction * this.config.playerSpeed * dt, floor.xMin + 20, floor.xMax - 20); }
    const ladder = this.map.ladders.find(item => Math.abs(item.x - this.player.x) < 48 && (item.from === this.player.floor || item.to === this.player.floor));
    const vertical = Number(this.controls.held('down')) - Number(this.controls.held('up'));
    if (!ladder || !vertical || this.player.climbing) return; const target = this.player.floor === ladder.from ? ladder.to : ladder.from; const targetY = this.map.floors.find(item => item.id === target)!.y;
    if ((targetY < this.player.y && vertical < 0) || (targetY > this.player.y && vertical > 0)) this.climb(ladder.x, target);
  }
  private climb(x: number, floor: IceFloorId) { this.player.climbing = true; const y = this.map.floors.find(item => item.id === floor)!.y; this.tweens.add({ targets: this.player, x, y, duration: 520, ease: 'Sine.InOut', onComplete: () => { this.player.floor = floor; this.player.climbing = false; if (!this.tutorialShown.has('ladder')) { this.tutorialShown.add('ladder'); this.feedback('사다리로 층을 이동했어요.'); } } }); }
  private scheduleIssue() {
    if (this.elapsed < this.nextIssueAllowedAt) return;
    const result = nextScheduledEvent(this.scheduler, this.pattern, { elapsed: this.elapsed, progress: productionProgress(this.production, this.map, this.config), activeIssueCount: this.activeIssues.length, maxSimultaneous: this.config.issues.maxSimultaneous, remaining: this.config.durationSec - this.elapsed }); this.scheduler = result.state;
    if (!result.event || this.activeIssues.some(issue => issue.machineId === result.event!.targetMachineId)) return;
    const behavior = result.event.issueType === 'penguin_interference' ? this.config.penguins.behaviorPatterns[this.repaired % Math.max(1, this.config.penguins.behaviorPatterns.length)] : undefined;
    const penguinSpawn = result.event.issueType === 'penguin_interference' && this.config.stage === 2 ? this.map.penguinSpawnCandidates.find(candidate => candidate.machineId === result.event!.targetMachineId) ?? this.map.penguinSpawnCandidates[0] : undefined;
    this.activeIssues.push({ type: result.event.issueType, machineId: result.event.targetMachineId, severity: result.event.severity, warningLeft: this.config.issues.warningDuration, repairLeft: null, behavior, penguinX: penguinSpawn?.x, penguinFloor: penguinSpawn?.floor, penguinArrived: false });
    const machine = this.machine(result.event.targetMachineId); const penguinAction = behavior === 'switchOff' ? '스위치를 껐어요' : behavior === 'dropIceDebris' ? '얼음 조각을 떨어뜨렸어요' : '컨베이어에 올라갔어요'; const action = result.event.issueType === 'penguin_interference' ? `${penguinAction}. 가까이 가서 쫓아내세요` : `${TOOL_LABELS[ICE_ISSUE_TOOLS[result.event.issueType]]}가 필요해요`;
    this.feedback(`${machine.name} ${ISSUE_LABELS[result.event.issueType]} 예고! ${action}.`);
    if (this.config.tutorial.guidedIssueTypes.includes(result.event.issueType) && !this.tutorialShown.has(`issue-${result.event.issueType}`)) {
      this.tutorialShown.add(`issue-${result.event.issueType}`); this.tutorialPaused = true;
      this.callbacks.onTutorialPrompt(result.event.issueType === 'freeze'
        ? { id: 'first-freeze', title: '기계가 얼었어요!', body: '불꽃 도구를 골라서\n얼음을 녹여주세요.', button: '알겠어요!' }
        : { id: 'first-penguin', title: '앗! 펭귄이에요!', body: '펭귄이 기계를 방해하고 있어요.\n가까이 가서 쫓아내주세요!', button: '쫓아내기!' });
    }
  }
  private updateIssues(dt: number) {
    for (const issue of [...this.activeIssues]) {
      if (issue.type === 'penguin_interference' && this.config.stage === 2 && !issue.penguinArrived) {
        const machine = this.machine(issue.machineId); const x = issue.penguinX ?? machine.x; const direction = Math.sign(machine.x - x);
        issue.penguinX = x + direction * 72 * dt; issue.penguinFloor ??= machine.floor;
        if (this.player.floor === issue.penguinFloor && Math.abs(this.player.x - issue.penguinX) <= 74) { this.resolveIssue(issue, '기계에 닿기 전에 펭귄을 막았어요!'); continue; }
        if (Math.abs(machine.x - issue.penguinX) <= 8) { issue.penguinX = machine.x; issue.penguinFloor = machine.floor; issue.penguinArrived = true; issue.warningLeft = 0; this.feedback(`${machine.name}에 펭귄이 도착해 생산이 멈췄어요!`); }
        continue;
      }
      if (issue.warningLeft > 0) { issue.warningLeft = Math.max(0, issue.warningLeft - dt); continue; }
      const machine = this.machine(issue.machineId);
      if (issue.type === 'penguin_interference' && this.player.floor === machine.floor && Math.abs(this.player.x - machine.x) <= 82) { this.resolveIssue(issue, '펭귄이 미끄러져 달아났어요!'); continue; }
      if (issue.repairLeft != null) { issue.repairLeft -= dt; if (issue.repairLeft <= 0) this.resolveIssue(issue, `${machine.name} 복구 완료!`); }
    }
  }
  private tryRepair() {
    if (this.waitingStartAction) { const feeder = this.machine('feeder'); if (this.player.floor === feeder.floor && Math.abs(this.player.x - feeder.x) <= 90) { this.waitingStartAction = false; this.feedback('좋아요! 화석이 출발했어요!'); } else this.feedback('초록 레버 가까이로 가세요.'); return; }
    if (!this.activeIssues.length || this.wrongToolLock > 0) return;
    const issue = this.activeIssues.filter(item => item.warningLeft <= 0).sort((a, b) => Math.abs(this.machine(a.machineId).x - this.player.x) - Math.abs(this.machine(b.machineId).x - this.player.x))[0];
    if (!issue) return; const machine = this.machine(issue.machineId);
    if (this.player.floor !== machine.floor || Math.abs(this.player.x - machine.x) > 86) { this.feedback(`${machine.name}가 있는 ${machine.floor === 'upper' ? '위층' : '아래층'}으로 이동하세요.`); return; }
    const required = ICE_ISSUE_TOOLS[issue.type]; if (required === 'interact') { this.resolveIssue(issue, '장애물을 치웠어요!'); return; }
    if (this.config.stage === 2) { if (issue.repairLeft == null) { issue.repairLeft = this.config.issues.repairDuration; this.feedback('수리 중… 생산 재개를 준비해요!'); } return; }
    if (this.selectedTool !== required) { this.wrongToolLock = this.config.issues.wrongToolPenalty; this.feedback('이 도구는 아닌 것 같아요. 다른 도구를 골라볼까요?'); return; }
    if (issue.repairLeft == null) { issue.repairLeft = this.config.issues.repairDuration; this.feedback(`${TOOL_LABELS[required]}로 수리 중…`); }
  }
  private resolveIssue(issue: ActiveIssue, message: string) { this.activeIssues = this.activeIssues.filter(item => item !== issue); this.repaired += 1; this.nextIssueAllowedAt = this.elapsed + (this.config.stage === 1 ? 10 : 6); if (!this.activeIssues.length) this.production = restartProduction(this.production, this.config); this.feedback(this.activeIssues.length ? `${message} 다른 문제도 남아 있어요!` : `${message} 다시 움직여요!`); }
  private machine(id: string) { return this.map.machines.find(machine => machine.id === id)!; }
  private feedback(message: string) { this.callbacks.onFeedback(message); }
  private updateCamera() { const x = Phaser.Math.Clamp(this.player.x + this.player.facing * 55 - WIDTH / 2, 0, this.map.worldBounds.width - WIDTH); this.cameras.main.scrollX = Phaser.Math.Linear(this.cameras.main.scrollX, x, .09); }
  private emitHud(force = false) {
    const issue = this.primaryIssue(); const machine = issue && this.machine(issue.machineId); const highlightedTool = issue && this.config.tutorial.guidedIssueTypes.includes(issue.type) ? ICE_ISSUE_TOOLS[issue.type] : null; const hud: IceMissionHud = { elapsed: this.elapsed, remaining: Math.max(0, Math.ceil(this.config.durationSec - this.elapsed)), progress: productionProgress(this.production, this.map, this.config), visualState: this.production.items[0]?.visualState ?? 'raw', backlog: productionBacklog(this.production), backlogCapacity: this.config.production.backlogCapacity, lost: this.production.lostCount, completed: this.production.completedCount, target: this.config.production.targetCompleted, selectedTool: this.selectedTool, highlightedTool, phase: this.phase, activeIssue: issue?.type ?? null, activeMachineName: machine?.name ?? null, surge: this.production.surgeRemaining > 0, repaired: this.repaired };
    const key = JSON.stringify({ ...hud, elapsed: Math.floor(hud.elapsed), progress: Math.floor(hud.progress * 100) }); if (force || key !== this.lastHud) { this.lastHud = key; this.callbacks.onState(hud); }
  }
  private primaryIssue() { return [...this.activeIssues].sort((a, b) => ['low', 'medium', 'high', 'critical'].indexOf(b.severity) - ['low', 'medium', 'high', 'critical'].indexOf(a.severity))[0]; }
  private updateNavigation() { const issue = this.primaryIssue(); const machine = issue && this.machine(issue.machineId); const targetX = issue?.penguinArrived === false ? issue.penguinX : machine?.x; const targetFloor = issue?.penguinArrived === false ? issue.penguinFloor : machine?.floor; const left = this.cameras.main.scrollX; const direction = targetX == null ? null : targetX < left + 65 ? 'left' : targetX > left + WIDTH - 65 ? 'right' : null; const key = `${direction}:${targetFloor}`; if (key !== this.lastNavigation) { this.lastNavigation = key; this.callbacks.onNavigation({ direction, layer: targetFloor ?? null }); } }
  private finish(phase: 'clear' | 'failure') { this.phase = phase; this.emitHud(true); if (phase === 'clear') this.callbacks.onClear(); else this.callbacks.onFailure(); }
  private draw() {
    const g = this.ink; g.clear(); g.fillGradientStyle(0x163f5b, 0x163f5b, 0x071b2d, 0x071b2d).fillRect(0, 0, this.map.worldBounds.width, HEIGHT); g.fillStyle(0xa8eafa, .09).fillCircle(150, 90, 150).fillCircle(650, 80, 190).fillCircle(1080, 110, 140);
    for (const floor of this.map.floors) g.fillStyle(0xc3ebf1).fillRoundedRect(floor.xMin, floor.y + 18, floor.xMax - floor.xMin, 23, 8).fillStyle(0x497d91).fillRoundedRect(floor.xMin, floor.y + 43, floor.xMax - floor.xMin, 12, 5);
    for (const ladder of this.map.ladders) this.drawLadder(g, ladder.x, this.map.floors.find(f => f.id === ladder.from)!.y, this.map.floors.find(f => f.id === ladder.to)!.y);
    g.lineStyle(16, 0x315e70); for (let i = 0; i < this.map.conveyorPath.length - 1; i += 1) { const a = this.map.conveyorPath[i]; const b = this.map.conveyorPath[i + 1]; g.lineBetween(a.x, a.y + 25, b.x, b.y + 25); }
    this.map.machines.forEach(machine => this.drawMachine(g, machine)); this.drawStand(g); if (this.waitingStartAction) { const feeder = this.machine('feeder'); const pulse = 1 + Math.sin(performance.now() / 180) * .12; g.lineStyle(6, 0x76f2a8, .9).strokeCircle(feeder.x, feeder.y - 28, 58 * pulse).fillStyle(0x76f2a8).fillTriangle(feeder.x - 10, feeder.y - 120, feeder.x + 10, feeder.y - 120, feeder.x, feeder.y - 96); } this.production.items.forEach((item, index) => { if (item.spawned && !item.completed) this.drawProduct(g, item.position.x, item.position.y - 16, item.visualState, index === 0); }); this.drawIssue(g); this.drawPlayer(g); if (this.completionLeft > 0 || this.phase === 'clear') this.drawGlow(g);
  }
  private drawLadder(g: Phaser.GameObjects.Graphics, x: number, a: number, b: number) { const top = Math.min(a, b) + 18; const bottom = Math.max(a, b) + 18; g.lineStyle(7, 0xf0ca74).lineBetween(x - 17, top, x - 17, bottom).lineBetween(x + 17, top, x + 17, bottom); for (let y = top + 16; y < bottom; y += 28) g.lineBetween(x - 17, y, x + 17, y); }
  private drawMachine(g: Phaser.GameObjects.Graphics, machine: typeof this.map.machines[number]) { const issue = this.activeIssues.find(item => item.machineId === machine.id && item.penguinArrived !== false); const warning = issue && issue.warningLeft > 0; g.fillStyle(issue ? warning ? 0xe7ad4e : issue.severity === 'critical' ? 0xb92f48 : 0xd95d69 : machine.criticality === 3 ? 0xf1bd55 : 0x62b7c8).fillRoundedRect(machine.x - 43, machine.y - 63, 86, 70, 11).fillStyle(0x15364e).fillRoundedRect(machine.x - 29, machine.y - 47, 58, 32, 7).fillStyle(issue ? 0xffe169 : 0x74e0a4).fillCircle(machine.x + 27, machine.y - 49, 8); }
  private drawStand(g: Phaser.GameObjects.Graphics) { const s = this.map.restorationStand; g.fillStyle(0x715d53).fillRoundedRect(s.x - 55, s.y - 45, 110, 77, 12).fillStyle(0xf1d887).fillRoundedRect(s.x - 40, s.y - 31, 80, 47, 8); if (this.config.id === '1-1' && this.production.items[0]?.visualState === 'cleaned') { const pulse = 1 + Math.sin(this.elapsed * 7) * .12; g.lineStyle(6, 0xffeb8a, .85).strokeCircle(s.x, s.y - 10, 68 * pulse); } }
  private drawIssue(g: Phaser.GameObjects.Graphics) { for (const issue of this.activeIssues) { const m = this.machine(issue.machineId); const floor = this.map.floors.find(item => item.id === issue.penguinFloor); const x = issue.penguinArrived === false ? issue.penguinX ?? m.x : m.x; const y = issue.penguinArrived === false ? (floor?.y ?? m.y) - 35 : m.y - 35; const pulse = 1 + Math.sin(this.elapsed * 8) * .1; if (issue.type === 'freeze') g.fillStyle(0x9ceeff, .65).fillTriangle(m.x - 48, m.y + 5, m.x - 18, m.y - 75, m.x + 2, m.y + 5).fillTriangle(m.x - 5, m.y + 5, m.x + 28, m.y - 70, m.x + 51, m.y + 5); if (issue.type === 'jam' || issue.type === 'conveyor_block') g.fillStyle(0xbdeef4).fillRoundedRect(m.x - 43, m.y - 5, 38, 38, 6).fillRoundedRect(m.x, m.y - 8, 45, 42, 6); if (issue.type === 'power') g.lineStyle(5, 0xffdb5e).lineBetween(m.x - 25, m.y - 75, m.x - 5, m.y - 53).lineBetween(m.x - 5, m.y - 53, m.x - 18, m.y - 25); if (issue.type === 'penguin_interference') this.drawPenguin(g, x, y); g.fillStyle(0xffdf62).fillCircle(x, y - 80, (issue.severity === 'critical' ? 31 : 24) * pulse).fillStyle(0x752d34).fillRect(x - 3, y - 94, 6, 18).fillCircle(x, y - 69, 4); if (issue.repairLeft != null) { const p = 1 - issue.repairLeft / this.config.issues.repairDuration; g.fillStyle(0x17354b).fillRoundedRect(m.x - 40, m.y - 88, 80, 9, 4).fillStyle(0x69e1b3).fillRoundedRect(m.x - 38, m.y - 86, 76 * p, 5, 3); } } }
  private drawPenguin(g: Phaser.GameObjects.Graphics, x: number, y: number) { g.fillStyle(0x172638).fillEllipse(x, y, 48, 58).fillStyle(0xf3fbff).fillEllipse(x, y + 8, 27, 35).fillStyle(0xffbe4d).fillTriangle(x - 3, y - 5, x + 14, y, x - 3, y + 5); }
  private drawProduct(g: Phaser.GameObjects.Graphics, x: number, y: number, state: string, main: boolean) { if (['raw', 'cut', 'cracked', 'silhouette'].includes(state)) { g.fillStyle(main ? 0x9eeaf4 : 0x68aec1, .94).fillRoundedRect(x - 23, y - 23, 46, 46, state === 'raw' ? 9 : 4); if (state !== 'raw') g.lineStyle(3, 0xffffff).lineBetween(x - 15, y - 16, x + 14, y + 14); if (state === 'silhouette') this.drawBone(g, x, y, .48, .65); } else this.drawBone(g, x, y, state === 'cleaned' ? .82 : .67, 1); if (main) g.lineStyle(2, 0xffdf75).strokeCircle(x, y, 31); }
  private drawBone(g: Phaser.GameObjects.Graphics, x: number, y: number, scale: number, alpha: number) { g.lineStyle(13 * scale, 0xfff0cf, alpha).lineBetween(x - 18 * scale, y + 8 * scale, x + 18 * scale, y - 8 * scale); g.fillStyle(0xfff7df, alpha).fillCircle(x - 20 * scale, y + 9 * scale, 9 * scale).fillCircle(x + 20 * scale, y - 9 * scale, 9 * scale); }
  private drawPlayer(g: Phaser.GameObjects.Graphics) { const { x, y } = this.player; g.fillStyle(0x67d4df).fillRoundedRect(x - 20, y - 55, 40, 39, 9).fillStyle(0xffbd79).fillCircle(x, y - 69, 17).fillStyle(0xf1a43d).fillRoundedRect(x - 21, y - 86, 42, 14, 7).fillStyle(0x17324e).fillRoundedRect(x - 18, y - 18, 15, 21, 4).fillRoundedRect(x + 3, y - 18, 15, 21, 4); }
  private drawGlow(g: Phaser.GameObjects.Graphics) { const s = this.map.restorationStand; const p = 1 + Math.sin(this.elapsed * 8) * .13; g.fillStyle(0xffe78a, .15).fillCircle(s.x, s.y - 10, 95 * p).fillStyle(0xd2fbff, .2).fillCircle(s.x, s.y - 10, 65 * p); if (this.config.stage === 2) this.drawSample(g, s.x, s.y - 12); else this.drawBone(g, s.x, s.y - 12, 1.2, 1); }
  private drawSample(g: Phaser.GameObjects.Graphics, x: number, y: number) { g.lineStyle(11, 0xfff0cf, 1); if (this.config.dinosaur === 'tyrannosaurus') { g.beginPath().moveTo(x - 35, y - 20).lineTo(x + 4, y + 18).lineTo(x + 35, y - 5).strokePath(); g.fillStyle(0xfff7df).fillCircle(x - 35, y - 20, 8); } else if (this.config.dinosaur === 'triceratops') { g.fillStyle(0xfff0cf).fillTriangle(x - 38, y + 22, x + 34, y - 26, x + 8, y + 26); } else if (this.config.dinosaur === 'spinosaurus') { g.lineBetween(x - 38, y + 17, x + 38, y + 17); for (let dx = -30; dx <= 30; dx += 15) g.lineBetween(x + dx, y + 15, x + dx + 5, y - 25 + Math.abs(dx) * .25); } else { g.lineBetween(x - 32, y - 8, x + 8, y + 14); for (let toe = 0; toe < 3; toe += 1) g.lineBetween(x + 5, y + 12, x + 32, y - 7 + toe * 14); } }
}

export function createIceContinentGame(parent: HTMLElement, controls: IceInput, config: IceMissionConfig, callbacks: IceGameCallbacks): IceContinentController {
  let scene: IceMissionScene | undefined; class ActiveScene extends IceMissionScene { constructor() { super(controls, callbacks, config); scene = this; } }
  const game = new Phaser.Game({ type: Phaser.AUTO, parent, width: WIDTH, height: HEIGHT, backgroundColor: '#071b2d', render: { antialias: true, roundPixels: true }, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, scene: ActiveScene });
  return { selectTool: tool => scene?.selectTool(tool), repair: () => scene?.repair(), startMission: () => scene?.startMission(), acknowledgeTutorial: () => scene?.acknowledgeTutorial(), destroy: () => { scene = undefined; game.destroy(true); } };
}
