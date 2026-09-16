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
};

let markdown = `# 유적지 Sokoban 정식 퍼즐 설계 사양

이 문서의 2-1~2-10은 **모두 새 보드**다. 아이가 이미 푼 현행 Stage 2 세 보드는 [목업 기록](ruins-sokoban-prototype-stage2.json)에만 보존했다. 현재 게임의 \`src/config/ruinsSokoban/stage2.ts\`는 아직 그 목업을 실행한다. 이번 문서와 [설계 JSON](ruins-sokoban-puzzles.json)은 React/Phaser에 연결되지 않았다. Stage 1의 현행 7문제는 유지한다.

## 검증 방법과 해석

[solver](../scripts/ruins-sokoban-design-solver.mjs)는 플레이어·상자 위치의 유한 상태를 완전 탐색한다. **최소 밀기**는 밀기 수를 먼저 최적화한 값이고, **최소 이동**은 이동 수를 독립적으로 먼저 최적화한 값이다. 둘이 다른 경우를 위해 *최소 밀기 해의 이동 수*도 표에 적었다. \`U/D/L/R\`은 위/아래/왼쪽/오른쪽이다. [검증 스크립트](../scripts/ruins-sokoban-verify-design.mjs)는 모든 보드의 해법, 비교 기준 목업과의 불일치, 패턴 회피 탐색을 확인하고 [재현 가능한 결과 JSON](ruins-sokoban-solver-report.json)을 만든다.

- **거리 증가 밀기:** 모든 상자와 목표의 최소 맨해튼 배정 거리 합이 증가하는 밀기다. 이 밀기를 모두 금지한 탐색이 실패하면 '목표에서 일시적으로 멀어지기'가 필수다. 실제 벽을 고려한 목표 배정 거리와는 다른 보수적인 측정 기준이다.
- **목표에서 상자 빼기:** 목표 위 상자를 비목표 칸으로 다시 미는 수다. 이를 금지한 탐색이 실패하면 임시 배치·통로 확보가 필수다.
- **상자 순서·목표 배정:** 시작 시 위에서 아래, 왼쪽에서 오른쪽 순으로 번호를 붙인 상자를 추적한다. 지정한 선행 상자보다 다른 상자를 먼저 밀게 하거나, 지정 목표 배정을 금지하고 다시 완전 탐색한다.
- **대체 해법:** 아래 표의 숫자는 *정답으로 이어지는 다른 첫 밀기*의 개수다. 1 이상이면 별도 풀이 경로가 실제로 있다. 0은 첫 밀기 대안이 없다는 뜻이며, 이후 경로나 단순 걷기 순서까지 유일하다는 뜻은 아니다. '쉬운 회피'는 의도한 패턴을 금지한 별도 탐색으로 검사했다.
- **교착:** 비목표 정적 모서리와 첫 밀기 직후 더 이상 풀 수 없는 위치를 적는다. 뒤늦게 생기는 동적 교착 전체를 열거한 것은 아니다. Undo는 언제든 사용할 수 있게 설계한다.

좌표는 왼쪽 위를 (1,1)로 하는 (열,행)이다. 보드는 \`#\` 벽, \`@\` 플레이어, \`$\` 상자, \`.\` 목표, \`*\` 목표 위 상자, \`+\` 목표 위 플레이어, \`E\` 장식 출구다. 클리어 판정은 모든 상자의 목표 배치다.

## 15문제 요약

| 미션 | 크기 | 상자/목표 | 최소 밀기 | 최소 이동 | 최소 밀기 해 이동 | 대체 첫 밀기 | 핵심 패턴의 필수성 |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
`;
for (const puzzle of puzzles) {
  const result = results.get(puzzle.id);
  if (!result) throw new Error(`missing result for ${puzzle.id}`);
  markdown += `| ${short(puzzle.id)} ${puzzle.title} | ${result.size.replace('x', '×')} | ${result.boxStarts.length}/${result.goalCells.length} | ${result.minPush} | ${result.minMove} | ${result.movesAtMinPush} | ${result.alternativeFirstPushCount} | ${result.mandatoryPatternCertificates.map(name => proofNames[name] ?? name).join('; ')} |\n`;
}
markdown += `
목업 기준점은 2-1 **5/16**, 2-2 **6/37**, 2-3 **8/19**였다. 새 2-1은 6/16으로 밀기 판단이 한 번 늘고, 새 2-2는 8/31로 순서가 강제되며, 새 2-3은 8/23으로 통로 진입 순서가 강제된다. 숫자만으로 아동 체감 난이도의 순서를 확정하지 않는다. 특히 2-2와 3-1은 이동 수가 30을 넘어 실제 아이 테스트에서 피로도를 확인해야 한다.

2-2는 첫 밀기 대안이 없고, 최적해의 각 밀기 사건을 하나씩 금지해도 해가 사라졌다. 따라서 확인한 보드에서는 다른 밀기 사건을 이용하는 대안이 없다. 단순 걷기 경로의 차이는 대체 해법으로 세지 않는다.

## 미션별 보드와 해법

각 미션의 '첫 밀기 함정'은 처음 접근 가능한 밀기 중 그 한 수 이후 해가 없는 목적지다. 정적 모서리와 겹칠 수 있다. 힌트 3은 해당 최적해에서 실제로 가능한 첫 밀기 한 번만 알려주며 전체 경로를 공개하지 않는다.
`;
for (const puzzle of puzzles) {
  const result = results.get(puzzle.id);
  markdown += `
### ${short(puzzle.id)} ${puzzle.title}

~~~text
${puzzle.board.join('\n')}
~~~

- **ID·크기·시작:** \`${puzzle.id}\`, ${result.size.replace('x', '×')}, ${point(result.playerStart)}.
- **상자·목표:** ${points(result.boxStarts)} → ${points(result.goalCells)}. 벽 전체는 위 보드의 \`#\`다.
- **핵심/필수 사고:** ${puzzle.corePattern}. ${result.mandatoryPatternCertificates.map(name => proofNames[name] ?? name).join('; ')}. 이 제한 탐색에서는 패턴 회피 해법이 없다.
- **Solver:** 해결 가능, 최소 밀기 ${result.minPush}, 독립 최소 이동 ${result.minMove}, 최소 밀기 해의 이동 ${result.movesAtMinPush}. 주요 해법 \`${result.solutionPath}\`(밀기만 \`${result.pushPath}\`).
- **대체 해법:** 다른 첫 밀기 ${result.alternativeFirstPushCount}개${result.alternativeFirstPushCount ? '가 정답으로 이어진다' : '는 확인되지 않았다'}. 이후 다른 밀기 순서는 별도 유일성 주장 대상이 아니다.
- **교착 주의:** 비목표 정적 모서리 ${points(result.staticDeadlockCorners)}. 첫 밀기 함정 목적지 ${points(result.trappedFirstPushes.map(push => push.destination))}.
- **단계 힌트:** ① ${puzzle.hintSteps[0]} ② ${puzzle.hintSteps[1]} ③ ${puzzle.hintSteps[2]}
`;
  if (puzzle.rewardPartId) markdown += `- **최초 클리어 확정 부품:** \`${puzzle.rewardPartId}\`. 재클리어 지급 없음.\n`;
}
markdown += `
## 난이도 곡선과 남은 검토

2-1~2-3은 새 출발점, 2-4~2-6은 되돌림을 통한 시도, 2-7~2-9는 목표 배정·임시 배치의 발견, 2-10은 종합 시험으로 설계했다. 3-1은 11밀기/32이동, 3-2~3-4는 서로 다른 두 개념 이상을 결합하고 3-5는 13밀기/27이동으로 가장 많은 밀기 판단을 요구한다. 이동 수와 밀기 수가 항상 단조 증가하지 않는 것은 의도적이다. 해결의 핵심은 보드 크기와 걷기 반복보다 밀기 순서, 되돌릴 수 없는 선택, 목표 배정이다.

solver의 회피 탐색은 위에 정의한 **기계적 패턴**의 필수성을 증명한다. '7세 아이에게 한눈에 보이는가', 실제 시도 횟수, Undo 횟수, 힌트 사용량, 장시간 좌절 여부는 증명하지 못한다. 특히 2-1의 우회·자리 잡기는 왼쪽·위쪽 밀기가 모두 필요함을 확인했지만 아이가 이를 새 개념으로 느끼는지는 관찰해야 한다. 2-5·2-8·3-4의 목표 이탈 규칙은 실제 플레이에서 명확히 안내해야 한다. 2-10의 4상자와 3-1의 32이동이 부담스럽다면 상자 수·이동 거리를 줄이되 핵심 회피 불가능성은 다시 검증한다. 아이 테스트 전에 추가 보드 재설계가 **논리적으로 필수인 문제는 현재 0개**이며, 체감 난이도에 따른 조정 가능성은 남는다.
`;
fs.writeFileSync('docs/ruins-sokoban-puzzle-spec.md', markdown, 'utf8');
