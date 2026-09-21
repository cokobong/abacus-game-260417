import fs from 'node:fs';
import path from 'node:path';
import { solve } from './ruins-sokoban-design-solver.mjs';
import { analyze } from './ruins-sokoban-pattern-analysis.mjs';

const source = fs.readFileSync(path.join(process.env.TEMP, 'microsokoban-levels', 'data', 'packs.js'), 'utf8');
const packs = JSON.parse(source.slice(source.indexOf('['), source.lastIndexOf(']') + 1));
const targets = [[10,15],[13,18],[15,21],[17,24],[19,28]];
const targetCounts = [4, 4, 4, 5, 3];
const selected = [];
for (const [band, [min, max]] of targets.entries()) {
  outer: for (const pack of packs) for (const [sourceIndex, raw] of pack.levels.entries()) {
    if (selected.filter(item => item.band === band).length >= targetCounts[band]) break outer;
    if (selected.some(item => item.sourcePack === pack.id && item.sourceIndex === sourceIndex + 1)) continue;
    const sourceRows = raw.split('\n');
    const left = Math.min(...sourceRows.filter(row => row.trim()).map(row => row.search(/\S/)));
    let rows = sourceRows.map(row => row.slice(left).replace(/\s+$/, ''));
    const width = Math.max(...rows.map(row => row.length));
    rows = rows.map(row => row.padEnd(width, ' '));
    if (width > (band >= 3 ? 10 : 9) || rows.length > (band === 4 ? 9 : 8) || width < 6 || rows.length < 6) continue;
    const crateCount = [...rows.join('')].filter(cell => cell === '$' || cell === '*').length;
    if (crateCount < 3 || crateCount > (band >= 3 ? 5 : 4)) continue;
    const exitAt = rows.join('').split('').findIndex((cell, index) => cell === ' ' && ![0, width - 1, rows.length * width - width, rows.length * width - 1].includes(index));
    if (exitAt < 0) continue;
    rows = rows.map((row, y) => [...row].map((cell, x) => y * width + x === exitAt ? 'E' : cell).join(''));
    const puzzle = { id: `${pack.id}-${sourceIndex + 1}`, board: rows };
    const result = solve(puzzle, { maxExpanded: 200000 });
    if (!result.solvable || result.pushes < min || result.pushes > max || result.moves > Math.max(68, result.pushes * 3.6)) continue;
    const choices = analyze(puzzle, { maxExpanded: 200000 });
    if (choices.viableFirstPushes.length < 2 || (band < 3 && choices.trappedFirstPushes.length < 1)) continue;
    const awayRequired = !solve(puzzle, { forbidAway: true, maxExpanded: 200000 }).solvable;
    const goalExitRequired = !solve(puzzle, { forbidGoalExit: true, maxExpanded: 200000 }).solvable;
    selected.push({ band, sourcePack: pack.id, sourceIndex: sourceIndex + 1, board: rows, pushes: result.pushes, moves: result.moves, path: result.path, viable: choices.viableFirstPushes.length, losing: choices.trappedFirstPushes.length, awayRequired, goalExitRequired });
    console.log(`band ${band + 1}: ${pack.id} ${sourceIndex + 1} ${result.pushes}/${result.moves}`);
  }
}
fs.writeFileSync('docs/ruins-sokoban-stage3-selection.json', JSON.stringify(selected, null, 2) + '\n');
console.log(`selected ${selected.length}`);
