import fs from 'node:fs';

const puzzles = JSON.parse(fs.readFileSync('docs/ruins-sokoban-puzzles.json', 'utf8')).filter(p => /^ruins-sokoban-3-\d+$/.test(p.id));
const report = new Map(JSON.parse(fs.readFileSync('docs/ruins-sokoban-solver-report.json', 'utf8')).map(r => [r.id, r]));
const labels = { medium:'중급', 'medium-plus':'중급+', 'medium-hard':'중상급', 'hard-child':'아동 상급' };
const milestones = puzzles.filter(p => p.milestoneRewardPartId).map(p => `${p.id.replace('ruins-sokoban-', '')} → \`${p.milestoneRewardPartId}\``).join(', ');
let md = `# 오래된 유적지 Sokoban Stage 3 캠페인

## 역할과 진행 원칙

Stage 3는 유물을 얻기 위한 짧은 관문이 아니라, 아이가 소코반의 시행착오와 해결의 즐거움을 충분히 경험하는 본편 20문제다. 3-1부터 한 문제씩 순서대로 열며 화면에는 \`유적 심층 n / 20\` 정도만 표시한다. 별점, 최소 이동·밀기 기록, Undo 기록, 랭킹은 플레이 화면에 노출하지 않는다.

막힘 → 짧은 재검토 → Undo/Reset → 다른 접근 → 해결의 리듬을 목표로 한다. 의도적 오답은 보통 첫 밀기 즉시 solver상 해법이 사라지고, 아이도 1~4 push 안에 이유를 찾을 수 있도록 설계했다. 이 인지 시간은 solver가 증명할 수 없으므로 실제 아동 테스트가 필요하다.

## 20문제 progression

| 미션 | 이름 | 난이도 | 크기 | 상자 | 최소 밀기/이동 | 풀리는 첫 밀기/지는 첫 밀기 | 핵심 패턴 | 이정표 |
| --- | --- | --- | --- | ---: | ---: | ---: | --- | --- |
`;
for (const puzzle of puzzles) {
  const r = report.get(puzzle.id);
  md += `| ${r.missionId} | ${puzzle.title} | ${labels[puzzle.difficultyBand]} | ${r.boardSize.replace('x','×')} | ${r.crateCount} | ${r.minPushes}/${r.minMoves} | ${r.firstPushOptions.length}/${r.losingFirstPushes.length} | ${puzzle.requiredPatterns.join(', ')} | ${puzzle.milestoneRewardPartId ?? '-'} |\n`;
}
md += `
## 다섯 구간의 리듬

- **3-1~3-4 본편 시작:** 별도 워밍업 없이 상자 순서, 밀기 면, 후퇴, 제단 회수를 두 가지 이상 조합한다.
- **3-5~3-8 순서와 임시 배치:** 잘못된 첫 밀기, 목표 배정, 임시 공간, 제단 회수를 본격적으로 조합한다.
- **3-9~3-12 공간 만들기:** 세 상자 중심으로 통로 확보, 재진입, 상자 간섭을 다룬다.
- **3-13~3-16 복합 계획:** 임시 보관, 장거리 우회, 네 상자 순서, 제단 회수를 여러 단계로 잇는다.
- **3-17~3-20 유적 심층부:** 기존 패턴 2~3개를 결합하되 3-17을 회복 문제로 두고 3-18~3-20에서 다시 올린다.

난이도는 기계적으로 상승하지 않지만 Stage 2 수준으로 내려가는 회복 문제는 두지 않는다. 최소 밀기는 ${Math.min(...puzzles.map(p => report.get(p.id).minPushes))}~${Math.max(...puzzles.map(p => report.get(p.id).minPushes))}, 독립 최소 이동은 ${Math.min(...puzzles.map(p => report.get(p.id).minMoves))}~${Math.max(...puzzles.map(p => report.get(p.id).minMoves))}다. 수치는 설계 검증용이며 UI 기록 경쟁에는 쓰지 않는다.

## 첫눈 위험 수동 검수

모든 문제는 풀리는 첫 밀기가 2개 이상이라 시작하자마자 정답 한 수만 강제되지 않는다. 3-1~3-15와 3-19~3-20은 그럴듯하지만 해법이 사라지는 첫 밀기도 확인되어 **low**로 평가했다. 3-16~3-18은 첫 밀기 함정보다는 이후 순서 의존성이 핵심이어서 **medium**으로 남겼다. **high** 위험 문제는 최종 팩에 포함하지 않았다. alternateTrivialSolution은 필수 거리 증가/제단 회수 행동을 금지한 완전탐색과 복수 첫 밀기 분석을 기준으로 모두 false로 기록했다.

## 대표 테스트 세트

- **3-1:** 상자 순서·밀기 면·후퇴·제단 회수. 두 첫 선택이 모두 가능해 보여 순서가 즉시 보이지 않으며, 가까운 제단부터 채우는 선택이 함정이다. 체감 중급.
- **3-4:** 네 상자의 순서와 제단 회수를 결합한 첫 milestone. 첫 밀기 후보가 많고 8개 losing first push가 있어 전체 배치가 한눈에 읽히지 않는다. 체감 중상급.
- **3-8:** 세 상자의 임시 배치와 후퇴. 가까운 목표로 직행하면 다음 밀기 면이 사라진다. 체감 중상급.
- **3-12:** 통로 확보·목표 배정·제단 회수. 좁은 공간의 상자 역할이 겹쳐 최종 목표 대응이 바로 보이지 않는다. 체감 중상급.
- **3-16:** 상자 간섭·임시 보관·복합 목표 배정. 첫 수보다 2~3단계 뒤의 밀기 면 확보가 핵심이다. 체감 상급.
- **3-20:** 네 상자, 26밀기, 제단 회수와 임시 보관을 모두 요구한다. 자연스러운 첫 목표 배치가 후속 상자 통로를 막는다. 체감 상급 최종전.

## solver 검증 해석

모든 보드는 플레이어·상자 전체 상태의 완전탐색으로 해결 가능성을 확인했다. 보고서에는 \`minPushes\`, \`minMoves\`, \`firstPushOptions\`, \`losingFirstPushes\`, \`shortestSolution\`, 정적 모서리와 패턴 금지 탐색 인증서를 저장한다. \`distance-increasing-push\`와 \`goal-retrieval\`은 해당 행동을 전부 금지한 재탐색이 실패할 때만 required로 기록했다. 그 밖의 의미 패턴은 최단해 사건과 보드 구조에 근거한 설계 분류이며 플레이테스트에서 확인한다.

Stage 2와 같은 보드의 재사용은 없으며, Stage 2 데이터와 런타임 config는 변경하지 않았다. 자동 검증은 정확한 상태 중복과 해법 가능성을 검사한다. 사람 눈에 느껴지는 해법 유사성은 플레이테스트에서도 다시 확인한다.

## 유물 milestone

${milestones}. RNG와 중복 지급은 사용하지 않는다. 이 매핑은 설계 데이터일 뿐 이번 작업에서 보상 코드는 연결하지 않는다. 5/5가 되면 기존 \`ancient_sun_tablet\` 복원 흐름을 사용할 수 있다.

## 힌트

각 퍼즐의 \`hintSteps\`에 짧은 한국어 3단계 힌트를 둔다. 1단계는 원리, 2단계는 볼 상자·공간, 3단계는 첫 핵심 밀기다. 전체 해답인 \`shortestSolution\`은 solver 보고서에만 있고 게임 UI에는 노출하지 않는다.

## 3-21+ 확장 원칙

Stage 3 완료는 영구적인 최종 엔딩이 아니라 현재 설치된 puzzle pack의 끝이다. 이후 3-21~3-30, 3-31~3-40을 같은 배열에 추가할 수 있게 ID와 순서를 데이터 기반으로 유지한다. 런타임 연결 시에는 20을 상수로 박지 말고 현재 pack 길이를 사용하며, 완료 상태는 mission ID 목록으로 저장한다. milestone 역시 mission ID→part ID 데이터 매핑으로 처리한다.

## 런타임 연결 전 확인

아동 플레이테스트로 체감 난이도, 실패를 알아차리는 실제 push 수, 힌트 3의 방향 정확성, 7×9 보드의 세로 화면 가독성을 확인한다. 그 뒤 순차 해금·재입장 저장, 최초 클리어와 부품 지급의 원자성, 3-20 이후 pack 완료 문구, 기존 저장 데이터 보정을 결정한다.
`;
fs.writeFileSync('docs/ruins-sokoban-stage3-campaign.md', md, 'utf8');
