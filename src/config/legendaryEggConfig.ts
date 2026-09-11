export const LEGENDARY_EGG_REQUIRED_DEX_DISCOVERIES = 5;
export const LEGENDARY_EGG_RARE_FRAGMENT_COST = 20;
export const LEGENDARY_PURCHASE_ENABLED = true;
// New egg identities prevent already-purchased legacy eggs from granting new species.
export const REPLACEMENT_LEGENDARY_EGGS = [
  { id: 'magmarex-legend-egg', speciesId: 'magmarex', habitat: 'volcano-island', name: '화산지대 전설알', speciesName: '마그마렉스' },
  { id: 'luminadon-legend-egg', speciesId: 'luminadon', habitat: 'sky-island', name: '고공정원 전설알', speciesName: '루미나돈' },
] as const;
