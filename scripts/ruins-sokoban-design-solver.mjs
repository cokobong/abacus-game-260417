// Documentation-time solver. Reads puzzle candidates; does not connect to the game.
import fs from 'node:fs';

export function solve({ id, board }, { metric = 'push', forbidAway = false, forbidGoalExit = false, forbidDirections = '', orderConstraint = null, forbiddenAssignment = null, forbiddenPush = null } = {}) {
  const height = board.length;
  const width = board[0]?.length ?? 0;
  if (!width || board.some(row => row.length !== width)) throw new Error(`${id}: ragged board`);
  const walls = new Set(), goals = new Set(), boxes = [];
  let player = -1, exit = -1;
  board.forEach((row, y) => [...row].forEach((cell, x) => {
    const at = y * width + x;
    if (cell === '#') walls.add(at);
    if (cell === '.' || cell === '*' || cell === '+') goals.add(at);
    if (cell === '$' || cell === '*') boxes.push(at);
    if (cell === '@' || cell === '+') player = at;
    if (cell === 'E') exit = at;
  }));
  if (player < 0 || exit < 0 || boxes.length !== goals.size) throw new Error(`${id}: missing player/exit or box/goal mismatch`);
  const labeled = Boolean(orderConstraint || forbiddenAssignment);
  const initialBoxes = labeled ? [...boxes] : boxes.sort((a, b) => a - b);
  const goalList = [...goals];
  const matchingDistance = (positions) => {
    const visit = (index, used) => {
      if (index === positions.length) return 0;
      let minimum = Infinity;
      for (let i = 0; i < goalList.length; i++) {
        if (used & (1 << i)) continue;
        const a = positions[index], b = goalList[i];
        const distance = Math.abs(a % width - b % width) + Math.abs(Math.floor(a / width) - Math.floor(b / width));
        minimum = Math.min(minimum, distance + visit(index + 1, used | (1 << i)));
      }
      return minimum;
    };
    return visit(0, 0);
  };
  const key = (p, b, mask = 0) => `${p}:${b.join(',')}${orderConstraint ? ':' + mask : ''}`;
  const start = key(player, initialBoxes, 0);
  const seen = new Map([[start, { push: 0, move: 0, path: '' }]]);
  const queue = [];
  const less = (a, b) => metric === 'move'
    ? a.move < b.move || a.move === b.move && a.push < b.push
    : a.push < b.push || a.push === b.push && a.move < b.move;
  const better = (a, b) => metric === 'move'
    ? a.move < b.move || a.move === b.move && a.push < b.push
    : a.push < b.push || a.push === b.push && a.move < b.move;
  const insert = value => {
    queue.push(value);
    for (let i = queue.length - 1; i > 0;) {
      const parent = Math.floor((i - 1) / 2);
      if (!less(queue[i], queue[parent])) break;
      [queue[i], queue[parent]] = [queue[parent], queue[i]];
      i = parent;
    }
  };
  const remove = () => {
    const first = queue[0], last = queue.pop();
    if (queue.length) {
      queue[0] = last;
      for (let i = 0;;) {
        const left = 2 * i + 1, right = left + 1;
        if (left >= queue.length) break;
        const child = right < queue.length && less(queue[right], queue[left]) ? right : left;
        if (!less(queue[child], queue[i])) break;
        [queue[i], queue[child]] = [queue[child], queue[i]];
        i = child;
      }
    }
    return first;
  };
  insert({ player, boxes: initialBoxes, movedMask: 0, push: 0, move: 0, path: '' });
  const directions = [['U', -width], ['D', width], ['L', -1], ['R', 1]];
  let expanded = 0, winning = null;
  while (queue.length) {
    const state = remove();
    const record = seen.get(key(state.player, state.boxes, state.movedMask));
    if (record.push !== state.push || record.move !== state.move) continue;
    expanded++;
    if (state.boxes.every(box => goals.has(box)) && !(forbiddenAssignment && state.boxes[forbiddenAssignment.boxIndex] === goalList[forbiddenAssignment.goalIndex])) { winning = state; break; }
    for (const [letter, delta] of directions) {
      const next = state.player + delta;
      if (next < 0 || next >= width * height || walls.has(next) || (Math.abs(delta) === 1 && Math.floor(next / width) !== Math.floor(state.player / width))) continue;
      let nextBoxes = state.boxes, pushed = 0, movedMask = state.movedMask;
      if (state.boxes.includes(next)) {
        if (forbidDirections.includes(letter)) continue;
        const boxIndex = state.boxes.indexOf(next);
        if (orderConstraint && boxIndex === orderConstraint.blockedBoxIndex && !(movedMask & (1 << orderConstraint.prerequisiteBoxIndex))) continue;
        if (forbiddenPush && next % width + 1 === forbiddenPush.from[0] && Math.floor(next / width) + 1 === forbiddenPush.from[1] && letter === forbiddenPush.direction) continue;
        const destination = next + delta;
        if (destination < 0 || destination >= width * height || walls.has(destination) || state.boxes.includes(destination) || (Math.abs(delta) === 1 && Math.floor(destination / width) !== Math.floor(next / width))) continue;
        if (forbidGoalExit && goals.has(next) && !goals.has(destination)) continue;
        nextBoxes = state.boxes.map(box => box === next ? destination : box);
        if (!labeled) nextBoxes.sort((a, b) => a - b);
        movedMask |= 1 << boxIndex;
        if (forbidAway && matchingDistance(nextBoxes) > matchingDistance(state.boxes)) continue;
        pushed = 1;
      }
      const push = state.push + pushed, move = state.move + 1;
      const nextKey = key(next, nextBoxes, movedMask), prior = seen.get(nextKey);
      if (prior && !better({ push, move }, prior)) continue;
      const path = state.path + letter;
      seen.set(nextKey, { push, move, path });
      insert({ player: next, boxes: nextBoxes, movedMask, push, move, path });
    }
  }
  let pushPath = '', firstPush = null;
  const pushEvents = [];
  if (winning) {
    let p = player, b = [...initialBoxes];
    for (const letter of winning.path) {
      const delta = directions.find(([name]) => name === letter)[1];
      const next = p + delta;
      if (b.includes(next)) {
        if (!firstPush) firstPush = { box: [next % width + 1, Math.floor(next / width) + 1], direction: letter };
        const nextBoxes = b.map(box => box === next ? next + delta : box);
        pushEvents.push({ from: [next % width + 1, Math.floor(next / width) + 1], to: [(next + delta) % width + 1, Math.floor((next + delta) / width) + 1], direction: letter, away: matchingDistance(nextBoxes) > matchingDistance(b), offGoal: goals.has(next) && !goals.has(next + delta) });
        b = nextBoxes;
        pushPath += letter;
      }
      p = next;
    }
  }
  return { id, size: `${width}x${height}`, boxes: boxes.length, goals: goals.size, solvable: Boolean(winning), pushes: winning?.push ?? null, moves: winning?.move ?? null, finalBoxes: winning?.boxes.map(at => [at % width + 1, Math.floor(at / width) + 1]) ?? null, firstPush, pushPath: winning ? pushPath : null, pushEvents, path: winning?.path ?? null, expanded };
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/ruins-sokoban-design-solver.mjs')) {
  const file = process.argv[2] ?? 'docs/ruins-sokoban-puzzles.json';
  const puzzles = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const puzzle of puzzles.filter(puzzle => !process.argv[3] || puzzle.id.endsWith(process.argv[3]))) {
    const push = solve(puzzle);
    const move = solve(puzzle, { metric: 'move' });
    const noAway = solve(puzzle, { forbidAway: true });
    const noGoalExit = solve(puzzle, { forbidGoalExit: true });
    console.log(JSON.stringify({ ...push, minPush: push.pushes, minMove: move.moves, movesAtMinPush: push.moves, noAwaySolvable: noAway.solvable, noAwayMinPush: noAway.pushes, noGoalExitSolvable: noGoalExit.solvable }));
  }
}
