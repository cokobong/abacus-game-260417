import fs from 'node:fs';
import { solve } from './ruins-sokoban-design-solver.mjs';

const file = 'docs/ruins-sokoban-puzzles.json';
const all = JSON.parse(fs.readFileSync(file, 'utf8'));
const candidates = JSON.parse(fs.readFileSync('docs/ruins-sokoban-stage3-selection.json', 'utf8'));
if (candidates.length !== 20) throw new Error(`expected 20 selected candidates, got ${candidates.length}`);
const titles = ['엇갈린 첫 선택','비켜 두는 석실','뒤쪽 밀기 자리','첫 심층 봉인','세 상자의 약속','잠깐 놓는 자리','막힌 길의 순서','두 번째 심층 봉인','돌기둥 교차로','되돌아오는 상자','빈자리 만들기','세 번째 심층 봉인','숨은 밀기 면','이어지는 회랑','상자들의 간섭','네 번째 심층 봉인','깊은 창고의 순서','가짜 제단의 유혹','마지막 우회로','태양 심층 제단'];
const rewards = { 4:'ancient_tablet', 8:'dinosaur_skull_emblem', 12:'emerald_stone', 16:'rune_core', 20:'sun_gear' };
const directionText = { U:'위로', D:'아래로', L:'왼쪽으로', R:'오른쪽으로' };
const locationText = (point, width, height) => {
  const horizontal = point[0] <= width / 3 ? '왼쪽' : point[0] >= width * 2 / 3 ? '오른쪽' : '가운데';
  const vertical = point[1] <= height / 3 ? '위쪽' : point[1] >= height * 2 / 3 ? '아래쪽' : '가운데';
  return vertical === '가운데' && horizontal === '가운데' ? '가운데' : `${vertical} ${horizontal}`;
};
const stage3 = candidates.map((candidate, index) => {
  const mission = index + 1;
  const solution = solve({ id: `ruins-sokoban-3-${mission}`, board: candidate.board });
  if (!solution.solvable || !solution.pushEvents[0]) throw new Error(`3-${mission}: missing solution`);
  const first = solution.pushEvents[0];
  const initialBoxes = candidate.board.flatMap((row, y) => [...row].flatMap((cell, x) => '$*'.includes(cell) ? [[x, y]] : []));
  const detailedHintMission = [1, 4, 8, 12, 16, 20].includes(mission);
  const milestoneIndexes = [...new Set((detailedHintMission
    ? [0, .2, .4, .6, .8, 1].map(ratio => Math.min(Math.floor(solution.pushEvents.length * ratio), solution.pushEvents.length - 2))
    : [0, Math.floor(solution.pushEvents.length / 3), Math.floor(solution.pushEvents.length * 2 / 3), Math.max(0, solution.pushEvents.length - 2)]
  ))].sort((a, b) => a - b);
  const hintMilestones = milestoneIndexes.map((pushIndex, milestoneIndex) => {
    const boxes = initialBoxes.map(point => [...point]);
    for (const event of solution.pushEvents.slice(0, pushIndex)) {
      const boxIndex = boxes.findIndex(([x, y]) => x === event.from[0] - 1 && y === event.from[1] - 1);
      if (boxIndex >= 0) boxes[boxIndex] = [event.to[0] - 1, event.to[1] - 1];
    }
    const next = solution.pushEvents[pushIndex] ?? solution.pushEvents.at(-1);
    const targetBoxIndex = boxes.findIndex(([x, y]) => x === next.from[0] - 1 && y === next.from[1] - 1);
    const location = locationText(next.from, candidate.board[0].length, candidate.board.length);
    return {
      id: milestoneIndex === 0 ? 'initial-plan' : milestoneIndex === milestoneIndexes.length - 1 ? 'final-setup' : `setup-${milestoneIndex}`,
      boxKeys: boxes.map(point => point.join(',')).sort(),
      boxPositions: boxes.map(point => point.join(',')),
      targetBoxIndex,
      direction: { U: 'up', D: 'down', L: 'left', R: 'right' }[next.direction],
      hints: [
        milestoneIndex === 0 ? '먼저 움직일 상자와 마지막에 움직일 상자를 나눠 생각해요.' : milestoneIndex === milestoneIndexes.length - 1 ? '좋아요. 이제 마지막 밀기 자리를 만들 차례예요.' : '좋아요. 지금 만든 빈 공간을 다음 상자에 사용해요.',
        `${location} 상자와 그 뒤에 설 자리를 살펴봐요.`,
        `${location} 상자를 ${directionText[next.direction]} 한 칸 밀어봐요.`,
      ],
    };
  });
  const patterns = ['box-ordering', mission <= 4 ? 'pushing-face-creation' : mission <= 8 ? 'temporary-placement' : mission <= 12 ? 'corridor-clearing' : mission <= 16 ? 'box-interference' : 'multi-step-setup', ...(candidate.awayRequired ? ['distance-increasing-push'] : []), ...(candidate.goalExitRequired ? ['goal-retrieval'] : []), ...(mission >= 9 ? ['goal-assignment'] : []), ...(mission >= 13 ? ['temporary-storage'] : [])];
  return {
    id: `ruins-sokoban-3-${mission}`, board: candidate.board, status: 'solver-validated-design', title: titles[index],
    corePattern: patterns.slice(0, mission <= 8 ? 2 : mission <= 16 ? 3 : 4).join(' · '),
    difficultyBand: mission <= 4 ? 'medium' : mission <= 8 ? 'medium-plus' : mission <= 12 ? 'medium-hard' : 'hard-child',
    requiredPatterns: [...new Set(patterns)],
    meaningfulDecisionCount: Math.max(2, Math.min(6, candidate.viable ?? 2)),
    requiredRepositionCount: Number(candidate.awayRequired) + Number(candidate.goalExitRequired) + (mission >= 5 ? 1 : 0),
    orderDependency: mission <= 4 ? 'medium' : mission <= 12 ? 'high' : 'very-high',
    alternateTrivialSolution: false, obviousFirstMove: false, obviousGoalAssignment: mission <= 4 ? 'medium' : 'low',
    obviousSolutionRisk: candidate.viable >= 2 && candidate.losing >= 1 ? 'low' : 'medium',
    deadlockNotes: `${candidate.losing ?? 0}개의 losing first push 후보를 확인했다. 잘못된 접근은 짧은 재시도 안에 통로 또는 밀기 면 부족으로 드러나는지 플레이테스트한다.`,
    hintSteps: [mission <= 4 ? '바로 밀지 말고, 상자 순서를 먼저 비교해요.' : '목표보다 다음에 설 자리와 상자 순서를 먼저 생각해요.', candidate.goalExitRequired ? '제단에 가까운 상자도 다시 움직일 수 있어요.' : '다른 상자의 길을 막는 상자와 빈 공간을 함께 봐요.', `${locationText(first.from, candidate.board[0].length, candidate.board.length)} 상자를 ${directionText[first.direction]} 한 칸 밀어봐요.`],
    hintMilestones,
    designSource: `${candidate.sourcePack} ${candidate.sourceIndex}를 캠페인 규격에 맞춰 검증·배치`,
    ...(rewards[mission] ? { milestoneRewardPartId: rewards[mission] } : {}),
  };
});
fs.writeFileSync(file, `${JSON.stringify([...all.filter(p => !/-3-/.test(p.id)), ...stage3], null, 2)}\n`, 'utf8');
