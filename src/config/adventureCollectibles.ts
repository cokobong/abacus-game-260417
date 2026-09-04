export const ADVENTURE_HEALTH_RESTORE_ID = 'health_restore' as const;
export type AdventureCollectibleType = 'coin' | 'rare_fragment' | typeof ADVENTURE_HEALTH_RESTORE_ID;

export function applyHealthRestore(currentHp: number, maxHp: number) {
  return Math.min(Math.max(0, maxHp), Math.max(0, currentHp) + 1);
}

export function shouldSpawnHealthRestore(currentHp: number, maxHp: number, alreadySpawned: boolean, random: () => number = Math.random) {
  return currentHp < maxHp && !alreadySpawned && random() < 0.12;
}
