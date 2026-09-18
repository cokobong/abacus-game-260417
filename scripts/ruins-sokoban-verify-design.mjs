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
  '3-1': [{ name: 'away push required', options: { forbidAway: true } }, { name: 'goal exit required', options: { forbidGoalExit: true } }],
  '3-2': [{ name: 'away push required', options: { forbidAway: true } }],
  '3-3': [{ name: 'left box assigned to left goal', options: { forbiddenAssignment: { boxIndex: 0, goalIndex: 0 } } }, { name: 'lower box before upper right box', options: { orderConstraint: { blockedBoxIndex: 2, prerequisiteBoxIndex: 1 } } }],
  '3-4': [{ name: 'away push required', options: { forbidAway: true } }, { name: 'goal exit required', options: { forbidGoalExit: true } }],
  '3-5': [{ name: 'away push required', options: { forbidAway: true } }, { name: 'left box before adjacent box', options: { orderConstraint: { blockedBoxIndex: 0, prerequisiteBoxIndex: 1 } } }],
};

if (candidates.length !== 15) throw new Error(`expected 15 candidates, got ${candidates.length}`);
const ids = new Set(candidates.map(puzzle => puzzle.id));
if (ids.size !== 15) throw new Error('duplicate puzzle IDs');

const report = [];
for (const puzzle of candidates) {
  const shortId = puzzle.id.split('ruins-sokoban-')[1];
  if (!proofs[shortId]) throw new Error(`missing proof for ${shortId}`);
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
  if (shortId.startsWith('2-') && Number(shortId.split('-')[1]) >= 4) {
    for (const cell of temporaryCells) {
      const point = cell.split(',').map(Number);
      if (!solve(puzzle, { forbiddenDestination: point }).solvable) mandatoryTemporaryCells.push(point);
    }
  }
  const allOptimalPushEventsRequired = shortId === '2-2'
    ? push.pushEvents.every(event => !solve(puzzle, { forbiddenPush: { from: event.from, direction: event.direction } }).solvable)
    : null;
  if (shortId === '2-2' && !allOptimalPushEventsRequired) throw new Error('2-2: unexpected alternative push event');
  const certificates = proofs[shortId].map(proof => {
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
    minPush: push.pushes, minMove: move.moves, movesAtMinPush: push.moves,
    solutionPath: push.path, pushPath: push.pushPath, pushEvents: push.pushEvents,
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
