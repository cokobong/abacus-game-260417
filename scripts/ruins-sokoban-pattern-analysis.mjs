// Checks alternative first pushes and local deadlocks for documentation candidates.
import fs from 'node:fs';
import { solve } from './ruins-sokoban-design-solver.mjs';

export function analyze(puzzle) {
  const board = puzzle.board, width = board[0].length, height = board.length;
  const walls = new Set(), goals = new Set(), boxes = [], floor = board.map(row => [...row]);
  let player;
  board.forEach((row, y) => [...row].forEach((cell, x) => {
    const at = y * width + x;
    if (cell === '#') walls.add(at);
    if (cell === '.' || cell === '*' || cell === '+') goals.add(at);
    if (cell === '$' || cell === '*') boxes.push(at);
    if (cell === '@' || cell === '+') player = at;
    if (cell === '$' || cell === '@') floor[y][x] = ' ';
    if (cell === '*' || cell === '+') floor[y][x] = '.';
  }));
  const directions = [['U', -width], ['D', width], ['L', -1], ['R', 1]];
  const valid = (from, to) => to >= 0 && to < width * height && !walls.has(to) && (Math.abs(to - from) !== 1 || Math.floor(to / width) === Math.floor(from / width));
  const reachable = new Set([player]), queue = [player];
  for (let i = 0; i < queue.length; i++) {
    for (const [, delta] of directions) {
      const next = queue[i] + delta;
      if (!valid(queue[i], next) || boxes.includes(next) || reachable.has(next)) continue;
      reachable.add(next); queue.push(next);
    }
  }
  const firstPushes = [];
  for (const box of boxes) for (const [direction, delta] of directions) {
    const stand = box - delta, destination = box + delta;
    if (!valid(box, stand) || !reachable.has(stand) || !valid(box, destination) || boxes.includes(destination)) continue;
    const nextBoxes = boxes.map(value => value === box ? destination : value);
    const nextBoard = floor.map(row => [...row]);
    for (const at of nextBoxes) nextBoard[Math.floor(at / width)][at % width] = goals.has(at) ? '*' : '$';
    nextBoard[Math.floor(box / width)][box % width] = goals.has(box) ? '+' : '@';
    if (!nextBoard.some(row => row.includes('E'))) {
      const open = nextBoard.flat().findIndex(cell => cell === ' ');
      nextBoard[Math.floor(open / width)][open % width] = 'E';
    }
    const result = solve({ id: `${puzzle.id}:${box}:${direction}`, board: nextBoard.map(row => row.join('')) });
    firstPushes.push({ box: [box % width + 1, Math.floor(box / width) + 1], direction, destination: [destination % width + 1, Math.floor(destination / width) + 1], solvable: result.solvable, remainingMinPush: result.pushes });
  }
  const staticCorners = [];
  for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
    const at = y * width + x;
    if (walls.has(at) || goals.has(at)) continue;
    if ((walls.has(at - width) || walls.has(at + width)) && (walls.has(at - 1) || walls.has(at + 1))) staticCorners.push([x + 1, y + 1]);
  }
  return { id: puzzle.id, viableFirstPushes: firstPushes.filter(push => push.solvable), trappedFirstPushes: firstPushes.filter(push => !push.solvable), staticCorners };
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/ruins-sokoban-pattern-analysis.mjs')) {
  const file = process.argv[2] ?? 'docs/ruins-sokoban-puzzles.json';
  const suffix = process.argv[3];
  const puzzles = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const puzzle of puzzles.filter(puzzle => !suffix || suffix === 'stage2' && puzzle.id.includes('-2-') || suffix === 'stage3' && puzzle.id.includes('-3-') || puzzle.id.endsWith(suffix))) console.log(JSON.stringify(analyze(puzzle)));
}
