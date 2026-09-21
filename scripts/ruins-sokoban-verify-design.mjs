// Reproducible documentation verification. It does not import or change game code.
import fs from 'node:fs';
import { solve } from './ruins-sokoban-design-solver.mjs';
import { analyze } from './ruins-sokoban-pattern-analysis.mjs';

const candidates = JSON.parse(fs.readFileSync('docs/ruins-sokoban-puzzles.json', 'utf8'));
const prototypes = JSON.parse(fs.readFileSync('docs/ruins-sokoban-prototype-stage2.json', 'utf8'));
const proofs = {
  '2-1': [{ name: 'left push required', options: { forbidDirections: 'L' } }, { name: 'up push required', options: { forbidDirections: 'U' } }],
  '2-2': [{ name: 'lower box before upper box', options: { orderConstraint: { blockedBoxIndex: 1, prerequisiteBoxIndex: 0 } } }],
  '2-3': [{ name: 'left box before center box', options: { orderConstraint: { blockedBoxIndex: 0, prerequisiteBoxIndex: 1 } } }],
  '2-4': [{ name: 'away push required', options: { forbidAway: true } }],
  '2-5': [{ name: 'goal exit required', options: { forbidGoalExit: true } }],
  '2-6': [{ name: 'left box before right box', options: { orderConstraint: { blockedBoxIndex: 0, prerequisiteBoxIndex: 1 } } }],
  '2-7': [{ name: 'left box assigned to left goal', options: { forbiddenAssignment: { boxIndex: 0, goalIndex: 0 } } }, { name: 'away push required', options: { forbidAway: true } }],
  '2-8': [{ name: 'goal exit required', options: { forbidGoalExit: true } }, { name: 'away push required', options: { forbidAway: true } }],
  '2-9': [{ name: 'away push required', options: { forbidAway: true } }, { name: 'goal exit required', options: { forbidGoalExit: true } }],
  '2-10': [{ name: 'away push required', options: { forbidAway: true } }, { name: 'goal exit required', options: { forbidGoalExit: true } }],
};

if (candidates.length !== 30) throw new Error(`expected 30 candidates, got ${candidates.length}`);
const ids = new Set(candidates.map(puzzle => puzzle.id));
if (ids.size !== 30) throw new Error('duplicate puzzle IDs');
const stage3 = candidates.filter(puzzle => /^ruins-sokoban-3-\d+$/.test(puzzle.id));
if (stage3.length !== 20 || stage3.some((puzzle, index) => puzzle.id !== `ruins-sokoban-3-${index + 1}`)) throw new Error('Stage 3 must contain ordered missions 3-1 through 3-20');
const expectedMilestones = new Map([[4, 'ancient_tablet'], [8, 'dinosaur_skull_emblem'], [12, 'emerald_stone'], [16, 'rune_core'], [20, 'sun_gear']]);
for (const [index, puzzle] of stage3.entries()) {
  if (puzzle.milestoneRewardPartId !== expectedMilestones.get(index + 1)) throw new Error(`${puzzle.id}: incorrect milestone reward`);
  if (!puzzle.difficultyBand || !puzzle.requiredPatterns?.length || !puzzle.deadlockNotes) throw new Error(`${puzzle.id}: missing campaign analysis metadata`);
  if (puzzle.hintMilestones?.length < 3 || puzzle.hintMilestones.length > 6) throw new Error(`${puzzle.id}: 3-6 hint milestones required`);
  if (new Set(puzzle.hintMilestones.map(item => item.id)).size !== puzzle.hintMilestones.length) throw new Error(`${puzzle.id}: duplicate hint milestone IDs`);
  if (puzzle.hintMilestones.some(item => item.hints?.length !== 3)) throw new Error(`${puzzle.id}: each hint milestone requires three levels`);
  if (puzzle.hintMilestones.some(item => item.targetBoxIndex < 0 || !['up', 'down', 'left', 'right'].includes(item.direction))) throw new Error(`${puzzle.id}: invalid visual hint target`);
}

const report = [];
for (const puzzle of candidates) {
  const shortId = puzzle.id.split('ruins-sokoban-')[1];
  if (shortId.startsWith('2-') && prototypes.some(old => old.id === puzzle.id && old.board.join('\n') === puzzle.board.join('\n'))) {
    throw new Error(`${shortId}: prototype board was reused`);
  }
  if (puzzle.hintSteps?.length !== 3) throw new Error(`${shortId}: three hints required`);
  const push = solve(puzzle);
  if (!push.solvable) throw new Error(`${shortId}: unsolvable`);
  const move = solve(puzzle, { metric: 'move' });
  const alternatives = analyze(puzzle);
  const goalKey = point => point.join(',');
  const goalCells = new Set(puzzle.board.flatMap((row, y) => [...row].flatMap((cell, x) => '.+*'.includes(cell) ? [`${x + 1},${y + 1}`] : [])));
  const newlyOccupiedGoals = new Set();
  const newlyPlacedGoalExits = [];
  const temporaryCells = new Set();
  const labeledBoxes = puzzle.board.flatMap((row, y) => [...row].flatMap((cell, x) => '$*'.includes(cell) ? [`${x + 1},${y + 1}`] : []));
  const labeledEvents = [];
  for (const event of push.pushEvents) {
    const boxIndex = labeledBoxes.indexOf(goalKey(event.from));
    if (boxIndex < 0) throw new Error(`${shortId}: solution event cannot be assigned to a box`);
    labeledBoxes[boxIndex] = goalKey(event.to);
    labeledEvents.push({ boxIndex, event });
    if (newlyOccupiedGoals.has(goalKey(event.from)) && event.offGoal) newlyPlacedGoalExits.push(event.from);
    if (goalCells.has(goalKey(event.to))) newlyOccupiedGoals.add(goalKey(event.to));
  }
  for (const [index, { boxIndex, event }] of labeledEvents.entries()) {
    if (goalCells.has(goalKey(event.to))) continue;
    const nextSameIndex = labeledEvents.findIndex((later, laterIndex) => laterIndex > index && later.boxIndex === boxIndex);
    if (nextSameIndex > index + 1 && labeledEvents.slice(index + 1, nextSameIndex).some(later => later.boxIndex !== boxIndex)) temporaryCells.add(goalKey(event.to));
  }
  const mandatoryTemporaryCells = [];
  if (shortId.startsWith('3-') || shortId.startsWith('2-') && Number(shortId.split('-')[1]) >= 4) {
    for (const cell of temporaryCells) {
      const point = cell.split(',').map(Number);
      if (!solve(puzzle, { forbiddenDestination: point }).solvable) mandatoryTemporaryCells.push(point);
    }
  }
  const allOptimalPushEventsRequired = shortId === '2-2'
    ? push.pushEvents.every(event => !solve(puzzle, { forbiddenPush: { from: event.from, direction: event.direction } }).solvable)
    : null;
  if (shortId === '2-2' && !allOptimalPushEventsRequired) throw new Error('2-2: unexpected alternative push event');
  const dynamicProofs = [
    ...(puzzle.requiredPatterns?.includes('distance-increasing-push') ? [{ name: 'distance-increasing push required', options: { forbidAway: true } }] : []),
    ...(puzzle.requiredPatterns?.includes('goal-retrieval') ? [{ name: 'goal retrieval required', options: { forbidGoalExit: true } }] : []),
  ];
  const certificates = [...(proofs[shortId] ?? []), ...dynamicProofs].map(proof => {
    const constrained = solve(puzzle, proof.options);
    if (constrained.solvable) throw new Error(`${shortId}: pattern can be bypassed: ${proof.name}`);
    return proof.name;
  });
  const width = puzzle.board[0].length;
  const cells = { playerStart: null, boxStarts: [], goalCells: [] };
  puzzle.board.forEach((row, y) => [...row].forEach((cell, x) => {
    const point = [x + 1, y + 1];
    if (cell === '@' || cell === '+') cells.playerStart = point;
    if (cell === '$' || cell === '*') cells.boxStarts.push(point);
    if (cell === '.' || cell === '*' || cell === '+') cells.goalCells.push(point);
  }));
  report.push({
    id: puzzle.id, size: `${width}x${puzzle.board.length}`, ...cells,
    missionId: shortId,
    boardSize: `${width}x${puzzle.board.length}`,
    crateCount: cells.boxStarts.length,
    goalCount: cells.goalCells.length,
    minPush: push.pushes, minMove: move.moves, movesAtMinPush: push.moves,
    minPushes: push.pushes, minMoves: move.moves,
    solutionPath: push.path, pushPath: push.pushPath, pushEvents: push.pushEvents,
    shortestSolution: push.path,
    firstPushOptions: alternatives.viableFirstPushes,
    losingFirstPushes: alternatives.trappedFirstPushes,
    difficultyBand: puzzle.difficultyBand ?? null,
    requiredPatterns: puzzle.requiredPatterns ?? [],
    deadlockNotes: puzzle.deadlockNotes ?? null,
    hintMilestoneCount: puzzle.hintMilestones?.length ?? 0,
    meaningfulDecisionCount: puzzle.meaningfulDecisionCount ?? alternatives.viableFirstPushes.length,
    requiredRepositionCount: puzzle.requiredRepositionCount ?? null,
    orderDependency: puzzle.orderDependency ?? null,
    alternateTrivialSolution: puzzle.alternateTrivialSolution ?? null,
    obviousFirstMove: puzzle.obviousFirstMove ?? null,
    obviousGoalAssignment: puzzle.obviousGoalAssignment ?? null,
    obviousSolutionRisk: puzzle.obviousSolutionRisk ?? null,
    estimatedFailureRecognitionPushes: alternatives.trappedFirstPushes.length ? '1-4' : null,
    alternativeFirstPushCount: Math.max(0, alternatives.viableFirstPushes.length - 1),
    viableFirstPushes: alternatives.viableFirstPushes,
    trappedFirstPushes: alternatives.trappedFirstPushes,
    staticDeadlockCorners: alternatives.staticCorners,
    ...(shortId.startsWith('2-') ? {
      goalExitRequired: !solve(puzzle, { forbidGoalExit: true }).solvable,
      distanceIncreasingPushRequired: !solve(puzzle, { forbidAway: true }).solvable,
      newlyPlacedGoalExitsInMinPushSolution: newlyPlacedGoalExits,
      mandatoryTemporaryCells,
      firstPushOutcomeCounts: { solvable: alternatives.viableFirstPushes.length, deadAfterOnePush: alternatives.trappedFirstPushes.length },
      fakeSuccessFirstPushes: alternatives.trappedFirstPushes.filter(first => goalCells.has(goalKey(first.destination))),
      shortestProvablyWrongFirstChoicePushCount: alternatives.trappedFirstPushes.length ? 1 : null,
    } : {}),
    allOptimalPushEventsRequired,
    mandatoryPatternCertificates: certificates,
  });
  process.stdout.write(`${shortId}: ${push.pushes} pushes / ${move.moves} moves; ${certificates.length} pattern proof(s)\n`);
}
fs.writeFileSync('docs/ruins-sokoban-solver-report.json', `${JSON.stringify(report, null, 2)}\n`, 'utf8');
