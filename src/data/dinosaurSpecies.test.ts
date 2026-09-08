import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync } from 'node:fs';
import { getEggItemConfig } from '../config/itemConfig';
import { getHatchCandidates } from '../utils/hatchCandidates';
import type { OwnedEgg } from '../types/game';
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

test('유적지는 7종과 전설 placeholder로 8칸이며 바다와 얼음도 각각 8종이다', () => {
  const ruins = dinosaurSpecies.filter((species) => species.habitat === 'ancient-ruins');
  assert.equal(ruins.length, 8);
  assert.equal(ruins.at(-1)?.speciesId, 'ancient-guardian');
  assert.equal(ruins.at(-1)?.isPlaceholder, true);
  assert.equal(dinosaurSpecies.filter((species) => species.habitat === 'deep-sea').length, 8);
  assert.equal(dinosaurSpecies.filter((species) => species.habitat === 'ice-continent').length, 8);
});

test('새 바다·얼음 16종은 성장 이미지 48장과 고유한 도감 번호를 갖는다', () => {
  const expansion = dinosaurSpecies.filter((species) => ['deep-sea', 'ice-continent'].includes(species.habitat));
  assert.equal(expansion.length, 16);
  assert.equal(new Set(dinosaurSpecies.map((species) => species.speciesId)).size, 40);
  assert.deepEqual(expansion.map((species) => species.collectionOrder), Array.from({ length: 16 }, (_, index) => 25 + index));
  const urls = expansion.flatMap((species) => {
    assert.equal(species.status, 'available');
    assert.ok(species.diet);
    assert.ok(species.images);
    return [species.images.baby, species.images.youth, species.images.adult];
  });
  assert.equal(new Set(urls).size, 48);
  for (const url of urls) assert.ok(existsSync(new URL(url)), `이미지 누락: ${url}`);
});

test('도감 40개 발견 힌트는 비어 있거나 중복되지 않고 이름을 숨긴다', () => {
  assert.equal(new Set(dinosaurSpecies.map((species) => species.discoveryHint.trim())).size, dinosaurSpecies.length);
  for (const species of dinosaurSpecies) {
    assert.ok(species.discoveryHint.trim());
    assert.ok(!dinosaurSpecies.some((other) => species.discoveryHint.includes(other.displayName)), species.speciesId);
  }
});

test('바다·얼음의 새 친구는 기존 알 등급에 맞춰 부화 후보에 포함된다', () => {
  for (const [itemId, perHabitat] of [['green-starter-egg', 4], ['rare-spark-egg', 2], ['rare-egg', 1], ['legend-egg', 1]] as const) {
    const item = getEggItemConfig(itemId)!;
    const egg: OwnedEgg = { id: 'test-expansion', eggItemId: item.id, name: item.name, rarity: item.rarity, eggType: item.eggType, eggCategory: item.eggCategory, hatchProgress: 0, createdAt: 1 };
    const { candidates } = getHatchCandidates(egg, []);
    for (const habitat of ['deep-sea', 'ice-continent']) assert.equal(candidates.filter((species) => species.habitat === habitat).length, perHabitat);
  }
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
