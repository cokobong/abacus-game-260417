import assert from 'node:assert/strict';
import test from 'node:test';
import { dexAdventureRegionByHabitat, dexHabitats, dexSpeciesSlotsPerHabitat, dexTargetSpeciesCount, dinosaurSpecies, getDinosaurSpecies } from './dinosaurSpecies';

test('도감은 5개 지역과 지역별 8슬롯, 총 40슬롯 구조다', () => {
  assert.deepEqual(dexHabitats, ['volcano-island', 'sky-island', 'ancient-ruins', 'deep-sea', 'ice-continent']);
  assert.equal(dexSpeciesSlotsPerHabitat, 8);
  assert.equal(dexTargetSpeciesCount, 40);
  for (const habitat of dexHabitats) assert.ok(dinosaurSpecies.filter((species) => species.habitat === habitat).length <= 8);
});

test('화산섬과 하늘섬은 각각 지정된 8종이다', () => {
  const ids = (habitat: string) => dinosaurSpecies.filter((species) => species.habitat === habitat).map((species) => species.speciesId);
  assert.deepEqual(ids('volcano-island'), ['tiny-tyranno', 'allosaurus', 'carnotaurus', 'dimetrodon', 'spinosaurus', 'distortus-rex', 'indominus-rex', 'volcanodon']);
  assert.deepEqual(ids('sky-island'), ['pteranodon', 'swift-raptor', 'pachycephalosaurus', 'parasaurolophus', 'dilophosaurus', 'therizinosaurus', 'crystalo', 'starano']);
});

test('유적지는 7종과 전설 placeholder로 8칸이며 바다와 얼음은 빈 슬롯이다', () => {
  const ruins = dinosaurSpecies.filter((species) => species.habitat === 'ancient-ruins');
  assert.equal(ruins.length, 8);
  assert.equal(ruins.at(-1)?.speciesId, 'ancient-guardian');
  assert.equal(ruins.at(-1)?.isPlaceholder, true);
  assert.equal(dinosaurSpecies.filter((species) => species.habitat === 'deep-sea').length, 0);
  assert.equal(dinosaurSpecies.filter((species) => species.habitat === 'ice-continent').length, 0);
});

test('등급 재배치와 diplodocus 제거가 적용된다', () => {
  assert.equal(getDinosaurSpecies('diplodocus'), null);
  assert.deepEqual([getDinosaurSpecies('parasaurolophus')?.rarity, getDinosaurSpecies('parasaurolophus')?.eggCategory], ['common', 'normal']);
  assert.deepEqual([getDinosaurSpecies('indominus-rex')?.rarity, getDinosaurSpecies('indominus-rex')?.eggCategory], ['rare', 'rare']);
  assert.equal(getDinosaurSpecies('starano')?.eggCategory, 'legend');
  assert.equal(getDinosaurSpecies('volcanodon')?.eggCategory, 'legend');
});

test('각 도감 지역은 모험 지역 ID와 연결된다', () => {
  assert.deepEqual(Object.keys(dexAdventureRegionByHabitat), dexHabitats);
});
