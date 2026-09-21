import fs from 'node:fs';

const puzzles = JSON.parse(fs.readFileSync('docs/ruins-sokoban-puzzles.json', 'utf8'));
const report = JSON.parse(fs.readFileSync('docs/ruins-sokoban-solver-report.json', 'utf8'));
const results = new Map(report.map(entry => [entry.id, entry]));
const point = value => `(${value.join(',')})`;
const points = values => values.length ? values.map(point).join('·') : '없음';
const short = id => id.replace('ruins-sokoban-', '');
const proofNames = {
  'left push required': '왼쪽 밀기 금지 시 불가능',
  'up push required': '위쪽 밀기 금지 시 불가능',
  'lower box before upper box': '아래 상자를 위 상자보다 늦게 움직이면 불가능',
  'left box before center box': '왼쪽 상자를 가운데 상자보다 늦게 움직이면 불가능',
  'away push required': '거리 증가 밀기 금지 시 불가능',
  'goal exit required': '목표에서 상자 빼기 금지 시 불가능',
  'left box before right box': '왼쪽 상자를 오른쪽 상자보다 늦게 움직이면 불가능',
  'left box assigned to left goal': '첫 상자의 왼쪽 목표 배정 금지 시 불가능',
  'right box before center box': '오른쪽 상자를 가운데 상자보다 늦게 움직이면 불가능',
  'lower box before upper right box': '아래 상자를 오른쪽 위 상자보다 늦게 움직이면 불가능',
  'left box before adjacent box': '왼쪽 상자를 바로 옆 상자보다 늦게 움직이면 불가능',
  'distance-increasing push required': '거리 증가 밀기 금지 시 불가능',
  'goal retrieval required': '목표에서 상자 빼기 금지 시 불가능',
};

let markdown = `# 유적지 Sokoban 정식 퍼즐 설계 사양

이 문서의 Stage 2 2-1~2-3은 워밍업으로 유지하고, 2-4~2-10은 재설계했다. 이전 목업 보드는 [목업 기록](ruins-sokoban-prototype-stage2.json)에 보존했다. [설계 JSON](ruins-sokoban-puzzles.json)의 Stage 2 보드와 힌트는 현재 게임의 \`src/config/ruinsSokoban/stage2.ts\`에 반영했다. Stage 1의 7문제는 유지하며 Stage 3는 게임에 연결하지 않았다.

## 검증 방법과 해석

[solver](../scripts/ruins-sokoban-design-solver.mjs)는 플레이어·상자 위치의 유한 상태를 완전 탐색한다. **최소 밀기**는 밀기 수를 먼저 최적화한 값이고, **최소 이동**은 이동 수를 독립적으로 먼저 최적화한 값이다. 둘이 다른 경우를 위해 *최소 밀기 해의 이동 수*도 표에 적었다. \`U/D/L/R\`은 위/아래/왼쪽/오른쪽이다. [검증 스크립트](../scripts/ruins-sokoban-verify-design.mjs)는 모든 보드의 해법, 비교 기준 목업과의 불일치, 패턴 회피 탐색을 확인하고 [재현 가능한 결과 JSON](ruins-sokoban-solver-report.json)을 만든다. [런타임 일치 테스트](../src/config/ruinsSokoban/stage2.test.ts)는 Stage 2의 모든 보드·힌트·파싱 결과와 실제 이동 규칙으로 재생한 해법을 확인한다.

- **거리 증가 밀기:** 모든 상자와 목표의 최소 맨해튼 배정 거리 합이 증가하는 밀기다. 이 밀기를 모두 금지한 탐색이 실패하면 '목표에서 일시적으로 멀어지기'가 필수다. 실제 벽을 고려한 목표 배정 거리와는 다른 보수적인 측정 기준이다.
- **목표에서 상자 빼기:** 목표 위 상자를 비목표 칸으로 다시 미는 수다. 이를 금지한 탐색이 실패하면 임시 배치·통로 확보가 필수다.
- **상자 순서·목표 배정:** 시작 시 위에서 아래, 왼쪽에서 오른쪽 순으로 번호를 붙인 상자를 추적한다. 지정한 선행 상자보다 다른 상자를 먼저 밀게 하거나, 지정 목표 배정을 금지하고 다시 완전 탐색한다.
- **대체 해법:** 아래 표의 숫자는 *정답으로 이어지는 다른 첫 밀기*의 개수다. 1 이상이면 별도 풀이 경로가 실제로 있다. 0은 첫 밀기 대안이 없다는 뜻이며, 이후 경로나 단순 걷기 순서까지 유일하다는 뜻은 아니다. '쉬운 회피'는 의도한 패턴을 금지한 별도 탐색으로 검사했다.
- **교착:** 비목표 정적 모서리와 첫 밀기 직후 더 이상 풀 수 없는 위치를 적는다. 뒤늦게 생기는 동적 교착 전체를 열거한 것은 아니다. Undo는 언제든 사용할 수 있게 설계한다.

좌표는 왼쪽 위를 (1,1)로 하는 (열,행)이다. 보드는 \`#\` 벽, \`@\` 플레이어, \`$\` 상자, \`.\` 목표, \`*\` 목표 위 상자, \`+\` 목표 위 플레이어, \`E\` 장식 출구다. 클리어 판정은 모든 상자의 목표 배치다.

## 30문제 요약 (Stage 2 10 + Stage 3 20)

| 미션 | 크기 | 상자/목표 | 최소 밀기 | 최소 이동 | 최소 밀기 해 이동 | 대체 첫 밀기 | 핵심 패턴의 필수성 |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
`;
for (const puzzle of puzzles) {
  const result = results.get(puzzle.id);
  if (!result) throw new Error(`missing result for ${puzzle.id}`);
  markdown += `| ${short(puzzle.id)} ${puzzle.title} | ${result.size.replace('x', '×')} | ${result.boxStarts.length}/${result.goalCells.length} | ${result.minPush} | ${result.minMove} | ${result.movesAtMinPush} | ${result.alternativeFirstPushCount} | ${result.mandatoryPatternCertificates.map(name => proofNames[name] ?? name).join('; ')} |\n`;
}
markdown += `
목업 기준점은 2-1 **5/16**, 2-2 **6/37**, 2-3 **8/19**였다. 2-1~2-3은 이번 재조정에서 보드를 유지했다. 숫자만으로 아동 체감 난이도의 순서를 확정하지 않는다. 특히 2-5(30이동)는 아이 테스트에서 피로도를 확인해야 한다.

2-2는 첫 밀기 대안이 없고, 최적해의 각 밀기 사건을 하나씩 금지해도 해가 사라졌다. 따라서 확인한 보드에서는 다른 밀기 사건을 이용하는 대안이 없다. 단순 걷기 경로의 차이는 대체 해법으로 세지 않는다.
`;
markdown += `
## Stage 2 재조정 검증

| 미션 | 제단 이탈 필수 | 거리 증가 필수 | 필수 임시 칸 | 풀리는 첫 밀기 / 즉시 해법 소멸 | 가장 빠른 잘못된 첫 선택 |
| --- | --- | --- | --- | --- | --- |
`;
for (const puzzle of puzzles.filter(puzzle => puzzle.id.includes('-2-'))) {
  const result = results.get(puzzle.id);
  markdown += `| ${short(puzzle.id)} | ${result.goalExitRequired ? '예' : '아니요'} | ${result.distanceIncreasingPushRequired ? '예' : '아니요'} | ${points(result.mandatoryTemporaryCells)} | ${result.firstPushOutcomeCounts.solvable}/${result.firstPushOutcomeCounts.deadAfterOnePush} | ${result.shortestProvablyWrongFirstChoicePushCount ?? '없음'} push |\n`;
}
markdown += `
**'즉시 해법 소멸'은 solver 판정 시점**이다. 사람이 막힘을 알아차리는 시점과 다르다. 2~4 push 뒤에 아이가 막힘을 깨닫는지는 자동 탐색으로 판정하지 못했다. 2-10에서는 오른쪽 위 상자를 목표 (7,2)에 바로 올리는 첫 밀기가 성공처럼 보이지만 그 직후 해법이 없다. 보고서의 \`trappedFirstPushes\`는 각 선택의 좌표와 방향을 재현한다.

**필수 임시 칸**은 최단해에서 한 상자를 비목표 칸에 놓고 다른 상자를 민 뒤 원래 상자를 다시 움직이는 칸이다. 그 칸으로의 모든 밀기를 금지해 해가 사라질 때만 표에 적었다. 제단 이탈 필수 검사는 시작부터 제단 위에 있던 상자의 이동도 포함한다. 플레이 중 새로 올린 상자를 다시 빼는지 여부는 \`newlyPlacedGoalExitsInMinPushSolution\`에 별도 기록한다.

사람 관점에서 2-4는 아래 상자를 먼저 움직여 밀기 면을 만들고, 2-5는 제단 상자를 비운 뒤 통로를 열고, 2-6은 두 상자의 이동 순서를 고른다. 2-7은 왼쪽 목표 배정과 임시 퇴보, 2-8은 제단 회수와 통로 우회, 2-9는 제단 회수와 아래 상자 이동을 결합한다. 2-10은 ① 오른쪽 위 상자 후퇴, ② 가운데 제단 비우기, ③ 왼쪽 상자 이동, ④ 목표 배정 마무리의 네 판단이 연결된다.

## 미션별 보드와 해법

각 미션의 '첫 밀기 함정'은 처음 접근 가능한 밀기 중 그 한 수 이후 해가 없는 목적지다. 정적 모서리와 겹칠 수 있다. 힌트 3은 해당 최적해에서 실제로 가능한 첫 밀기 한 번만 알려주며 전체 경로를 공개하지 않는다.
`;
for (const puzzle of puzzles) {
  const result = results.get(puzzle.id);
  markdown += `
### ${short(puzzle.id)} ${puzzle.title}

~~~text
${puzzle.board.map(row => row.trimEnd()).join('\n')}
~~~

- **ID·크기·시작:** \`${puzzle.id}\`, ${result.size.replace('x', '×')}, ${point(result.playerStart)}.
- **상자·목표:** ${points(result.boxStarts)} → ${points(result.goalCells)}. 벽 전체는 위 보드의 \`#\`다.
- **핵심/필수 사고:** ${puzzle.corePattern}. ${result.mandatoryPatternCertificates.map(name => proofNames[name] ?? name).join('; ')}. 이 제한 탐색에서는 패턴 회피 해법이 없다.
- **Solver:** 해결 가능, 최소 밀기 ${result.minPush}, 독립 최소 이동 ${result.minMove}, 최소 밀기 해의 이동 ${result.movesAtMinPush}. 주요 해법 \`${result.solutionPath}\`(밀기만 \`${result.pushPath}\`).
- **대체 해법:** 다른 첫 밀기 ${result.alternativeFirstPushCount}개${result.alternativeFirstPushCount ? '가 정답으로 이어진다' : '는 확인되지 않았다'}. 이후 다른 밀기 순서는 별도 유일성 주장 대상이 아니다.
- **교착 주의:** 비목표 정적 모서리 ${points(result.staticDeadlockCorners)}. 첫 밀기 함정 목적지 ${points(result.trappedFirstPushes.map(push => push.destination))}.
- **단계 힌트:** ① ${puzzle.hintSteps[0]} ② ${puzzle.hintSteps[1]} ③ ${puzzle.hintSteps[2]}
`;
  if (puzzle.milestoneRewardPartId) markdown += `- **마일스톤 확정 부품:** \`${puzzle.milestoneRewardPartId}\`. 런타임 지급 연결은 아직 하지 않는다.\n`;
}
markdown += `
## 난이도 곡선과 남은 검토

2-1~2-3은 워밍업으로 유지했다. 2-4~2-6은 한 번의 Undo와 순서 판단, 2-7~2-9는 두 패턴의 결합, 2-10은 네 단계의 연쇄 판단을 목표로 한다. Stage 3는 네 문제마다 새 패턴 소개→조합→도전→봉인 이정표의 리듬을 사용하며, 3-1~3-20 전체가 계속 가팔라지지 않도록 회복 문제를 섞었다.

solver의 회피 탐색은 인증서가 기록된 기계적 패턴의 필수성을 증명한다. 그 밖의 패턴명은 최단해와 보드 구조를 바탕으로 한 설계 의도이며 아동 플레이테스트 대상이다. 첫 선택이 2~4 push 뒤에야 잘못되었음을 **사람이 알아차리는지**는 증명하지 못한다. 실제 아이 테스트에서 시도한 첫 밀기, 막힘을 깨달은 push 번호, Undo 횟수, 힌트 사용량을 기록하고 늦은 좌절이나 즉시 보이는 모서리 함정이 많으면 후속 조정한다. Stage 3는 설계 JSON과 보고서에만 있으며 런타임에는 연결하지 않았다.
`;
fs.writeFileSync('docs/ruins-sokoban-puzzle-spec.md', markdown, 'utf8');
