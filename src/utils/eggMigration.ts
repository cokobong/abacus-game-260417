import type { OwnedEgg } from '../types/game';

export const EGG_SYSTEM_MIGRATION_VERSION = 3;

export const LEGACY_EGG_ID_MAP = {
  'green-forest-rare-egg': 'rare-egg',
  'sparkle-cave-rare-egg': 'rare-egg',
  'volcano-island-rare-egg': 'rare-egg',
  'ocean-blue-egg': 'rare-egg',
  'secret-land-rare-egg': 'rare-egg',
  'legacy-legend-rare-egg': 'rare-egg',
  'magmarex-legend-egg': 'legend-egg',
  'luminadon-legend-egg': 'legend-egg',
} as const satisfies Readonly<Record<string, string>>;

export function canonicalizeEggItemId(id: string, egg?: Pick<OwnedEgg, 'eggCategory' | 'eggType'>) {
  // An early save format used legend-egg for the old rare egg. Its rare metadata
  // distinguishes it from the current, genuinely legendary egg.
  if (id === 'legend-egg' && (egg?.eggCategory === 'rare' || egg?.eggType === 'rare')) return 'rare-egg';
  return LEGACY_EGG_ID_MAP[id as keyof typeof LEGACY_EGG_ID_MAP] ?? id;
}

export function getOwnedEggCount(ownedEggs: OwnedEgg[], eggItemId: string) {
  const canonicalId = canonicalizeEggItemId(eggItemId);
  return ownedEggs.filter((egg) => canonicalizeEggItemId(egg.eggItemId, egg) === canonicalId).length;
}

export function migrateEggSystemV2(ownedEggs: OwnedEgg[], activeEggId: string | null | undefined) {
  const migrated = ownedEggs.map((egg) => {
    const eggItemId = canonicalizeEggItemId(egg.eggItemId, egg);
    if (eggItemId === egg.eggItemId) return egg;
    const isLegendary = eggItemId === 'legend-egg';
    return {
      ...egg,
      eggItemId,
      name: isLegendary ? '전설 알' : '희귀 알',
      rarity: isLegendary ? 'legendary' as const : 'rare' as const,
      eggType: isLegendary ? 'legendary' : 'rare',
      eggCategory: isLegendary ? 'legendary' as const : 'rare' as const,
      eggHabitatId: undefined,
    };
  });

  const byItemId = new Map<string, OwnedEgg[]>();
  for (const egg of migrated) {
    const group = byItemId.get(egg.eggItemId) ?? [];
    group.push(egg);
    byItemId.set(egg.eggItemId, group);
  }

  const deduplicated = [...byItemId.values()].map((group) =>
    [...group].sort((left, right) => {
      const activeDifference = Number(right.id === activeEggId) - Number(left.id === activeEggId);
      if (activeDifference !== 0) return activeDifference;
      const progressDifference = right.hatchProgress - left.hatchProgress;
      if (progressDifference !== 0) return progressDifference;
      return left.createdAt - right.createdAt;
    })[0],
  ).filter((egg): egg is OwnedEgg => Boolean(egg));

  deduplicated.sort((left, right) => left.createdAt - right.createdAt);
  const activeEgg = deduplicated.find((egg) => egg.id === activeEggId) ?? deduplicated[0] ?? null;
  return { ownedEggs: deduplicated, activeEggId: activeEgg?.id ?? null };
}
