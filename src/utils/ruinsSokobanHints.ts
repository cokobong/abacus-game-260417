import { DIRECT_HINT_RESET_THRESHOLD, DIRECTION_HINT_RESET_THRESHOLD, SOFT_HINT_RESET_THRESHOLD, VISUAL_HINT_RESET_THRESHOLD, type SokobanDirection, type SokobanPoint, type SokobanPuzzleConfig, type SokobanRuntimeSnapshot } from '../config/ruinsSokoban';

export interface RuinsSokobanHintResult {
  message: string;
  emphasizeUndo: boolean;
  kind: 'deadlock' | 'milestone' | 'fallback';
  visualTarget?: SokobanPoint;
  direction?: SokobanDirection;
}

const sortedBoxKeys = (snapshot: SokobanRuntimeSnapshot) => snapshot.boxes
  .map(box => `${box.column},${box.row}`)
  .sort();

export function getRuinsSokobanHintContextKey(snapshot: SokobanRuntimeSnapshot) {
  return `${sortedBoxKeys(snapshot).join('|')}@${snapshot.player.column},${snapshot.player.row}:${snapshot.deadlock}`;
}

export function resolveRuinsSokobanHint(
  mission: SokobanPuzzleConfig,
  snapshot: SokobanRuntimeSnapshot,
  level: number,
  canUndo: boolean,
  resetCount = 0,
): RuinsSokobanHintResult {
  if (snapshot.deadlock) {
    return {
      message: canUndo
        ? '이 상자는 다시 움직일 수 없어요. 한 수 뒤로 가보세요.'
        : '이 상태에서는 길이 막혔어요. 처음부터 다시 살펴봐요.',
      emphasizeUndo: canUndo,
      kind: 'deadlock',
    };
  }

  const boxKeys = sortedBoxKeys(snapshot);
  const milestones = mission.tutorial?.hintMilestones ?? [];
  const exactMilestone = milestones.find(item => (
    item.boxKeys.length === boxKeys.length
    && item.boxKeys.every((key, index) => key === boxKeys[index])
  ));
  const distance = (item: typeof milestones[number]) => item.boxPositions.reduce((total, key, index) => {
    const [column, row] = key.split(',').map(Number);
    const current = snapshot.boxes[index];
    return total + (current ? Math.abs(current.column - column) + Math.abs(current.row - row) : 100);
  }, 0) + (() => {
    const target = snapshot.boxes[item.targetBoxIndex];
    if (!target) return 100;
    const step = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[item.direction];
    const pushingFace = { column: target.column - step[0], row: target.row - step[1] };
    return (Math.abs(snapshot.player.column - pushingFace.column) + Math.abs(snapshot.player.row - pushingFace.row)) * 0.1;
  })();
  const targetMilestone = exactMilestone ?? [...milestones].sort((a, b) => distance(a) - distance(b))[0];
  const target = targetMilestone ? snapshot.boxes[targetMilestone.targetBoxIndex] : undefined;
  if (resetCount >= DIRECTION_HINT_RESET_THRESHOLD && target && targetMilestone) {
    const directionText = { up: '위로', down: '아래로', left: '왼쪽으로', right: '오른쪽으로' }[targetMilestone.direction];
    return { message: `이 상자를 ${directionText} 밀어보세요.`, emphasizeUndo: false, kind: exactMilestone ? 'milestone' : 'fallback', visualTarget: target, direction: targetMilestone.direction };
  }
  if (resetCount >= VISUAL_HINT_RESET_THRESHOLD && target) {
    return { message: '이 상자부터 움직여보세요.', emphasizeUndo: false, kind: exactMilestone ? 'milestone' : 'fallback', visualTarget: target };
  }
  if (resetCount >= DIRECT_HINT_RESET_THRESHOLD && target) {
    return { message: targetMilestone?.hints[1] ?? '움직일 공간이 가장 적은 상자부터 살펴볼까요?', emphasizeUndo: false, kind: exactMilestone ? 'milestone' : 'fallback' };
  }
  const hints = exactMilestone?.hints ?? (snapshot.goalsCompleted > 0
    ? ['제단에 놓인 상자가 다른 길을 막는지 살펴봐요.', '아직 제단에 없는 상자와 그 뒤쪽 공간을 봐요.', '다음 상자를 밀기 전에 뒤에 설 길부터 만들어보세요.']
    : ['목표보다 상자들이 서로 막는 길을 먼저 찾아봐요.', '움직일 공간이 가장 적은 상자를 살펴봐요.', '밀기 전에 상자 뒤쪽으로 돌아갈 수 있는지 확인해요.']);

  return {
    message: hints[Math.min(Math.max(resetCount >= SOFT_HINT_RESET_THRESHOLD ? Math.max(level, 1) : level, 0), hints.length - 1)],
    emphasizeUndo: false,
    kind: exactMilestone ? 'milestone' : 'fallback',
  };
}
