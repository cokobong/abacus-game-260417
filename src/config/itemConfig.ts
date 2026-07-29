import type { CostumeSlot, DinosaurState } from '../types/game';
import type { DinosaurDiet, DinosaurHabitatId } from '../data/dinosaurSpecies';

export type ItemCategory = 'food' | 'costume' | 'dinosaur' | 'egg' | 'hatchItem' | 'toy' | 'misc';
export type DinosaurStatEffect = Partial<Pick<DinosaurState, 'exp' | 'mood' | 'stamina'>>;
export type EggCategory = 'normal' | 'special' | 'rare';

interface BaseItemConfig {
  id: string;
  name: string;
  category: ItemCategory;
  price: number;
  description: string;
  sortOrder: number;
}

export interface FoodItemConfig extends BaseItemConfig {
  category: 'food';
  expValue: number;
  dietType: DinosaurDiet | 'universal';
  effect: DinosaurStatEffect;
}

export interface CostumeItemConfig extends BaseItemConfig {
  category: 'costume';
  slot: CostumeSlot;
  cosmeticOnly: boolean;
  effect?: DinosaurStatEffect;
}

export interface DinosaurItemConfig extends BaseItemConfig {
  category: 'dinosaur';
  rarity: 'common' | 'rare' | 'special' | 'legendary';
  unlockType: 'egg_fragment' | 'egg' | 'event' | 'shop_unlock';
}

export interface EggRequiredFragmentConfig {
  itemId: string;
  amount: number;
}

export interface EggItemConfig extends BaseItemConfig {
  category: 'egg';
  rarity: 'normal' | 'rare' | 'special';
  eggType: string;
  eggCategory: EggCategory;
  eggHabitatId?: DinosaurHabitatId;
  requiredFragmentId?: string;
  requiredFragmentAmount?: number;
  requiredFragments?: EggRequiredFragmentConfig[];
}

export interface HatchItemConfig extends BaseItemConfig {
  category: 'hatchItem';
  effect: {
    hatchProgress: number;
  };
}

export interface BasicItemConfig extends BaseItemConfig {
  category: 'toy' | 'misc';
  effect?: DinosaurStatEffect;
}

export type ItemConfig = FoodItemConfig | CostumeItemConfig | DinosaurItemConfig | EggItemConfig | HatchItemConfig | BasicItemConfig;

export interface ShopCategoryConfig {
  id: ItemCategory;
  label: string;
  sortOrder: number;
  visible: boolean;
}

export const fallbackFoodEffect: DinosaurStatEffect = {
  exp: 5,
  mood: 1,
  stamina: 3,
};

export const shopCategoryConfigs: ShopCategoryConfig[] = [
  { id: 'food', label: '음식', sortOrder: 1, visible: true },
  { id: 'costume', label: '코스튬', sortOrder: 2, visible: true },
  { id: 'dinosaur', label: '새로운 공룡', sortOrder: 3, visible: true },
  { id: 'egg', label: '알', sortOrder: 4, visible: true },
  { id: 'hatchItem', label: '부화 아이템', sortOrder: 5, visible: true },
  { id: 'toy', label: '장난감', sortOrder: 6, visible: false },
  { id: 'misc', label: '기타', sortOrder: 7, visible: false },
];

export const itemConfigs: ItemConfig[] = [
  {
    id: 'basic-meat',
    name: '고기',
    category: 'food',
    price: 50,
    description: '체력을 회복하는 든든한 기본 사료예요.',
    sortOrder: 1,
    expValue: 10,
    dietType: 'carnivore',
    effect: {
      mood: 2,
      stamina: 5,
    },
  },
  {
    id: 'soft-berry',
    name: '말랑 열매',
    category: 'food',
    price: 80,
    description: '체력을 조금 회복하는 말랑한 열매예요.',
    sortOrder: 2,
    expValue: 12,
    dietType: 'herbivore',
    effect: {
      mood: 2,
      stamina: 3,
    },
  },
  {
    id: 'leaf-snack',
    name: '나뭇잎',
    category: 'food',
    price: 30,
    description: '가볍게 체력을 회복하는 기본 사료예요.',
    sortOrder: 3,
    expValue: 5,
    dietType: 'herbivore',
    effect: {
      mood: 1,
      stamina: 3,
    },
  },
  {
    id: 'dino-cookie',
    name: '공룡 쿠키',
    category: 'food',
    price: 150,
    description: '체력을 많이 회복하는 특별 간식이에요.',
    sortOrder: 4,
    expValue: 20,
    dietType: 'universal',
    effect: {
      mood: 4,
      stamina: 8,
    },
  },
  {
    id: 'fish-bite',
    name: '생선',
    category: 'food',
    price: 70,
    description: '담백한 생선 간식이에요.',
    sortOrder: 5,
    expValue: 12,
    dietType: 'carnivore',
    effect: {
      mood: 2,
      stamina: 4,
    },
  },
  {
    id: 'berry-basket',
    name: '열매 바구니',
    category: 'food',
    price: 120,
    description: '여러 가지 열매를 담은 사료예요.',
    sortOrder: 6,
    expValue: 18,
    dietType: 'herbivore',
    effect: {
      mood: 3,
      stamina: 5,
    },
  },
  {
    id: 'strong-meat',
    name: '튼튼 고기',
    category: 'food',
    price: 140,
    description: '든든하게 힘을 채워주는 고기예요.',
    sortOrder: 7,
    expValue: 22,
    dietType: 'carnivore',
    effect: {
      mood: 2,
      stamina: 7,
    },
  },
  {
    id: 'sweet-berry',
    name: '달콤 열매',
    category: 'food',
    price: 100,
    description: '공룡이 좋아하는 달콤한 열매예요.',
    sortOrder: 8,
    expValue: 15,
    dietType: 'herbivore',
    effect: {
      mood: 4,
      stamina: 4,
    },
  },
  {
    id: 'energy-leaf',
    name: '에너지 잎',
    category: 'food',
    price: 110,
    description: '가볍게 활력을 채워주는 잎사귀예요.',
    sortOrder: 9,
    expValue: 16,
    dietType: 'herbivore',
    effect: {
      mood: 2,
      stamina: 6,
    },
  },
  {
    id: 'special-snack',
    name: '특별 간식',
    category: 'food',
    price: 220,
    description: '조금 더 특별한 날에 주는 간식이에요.',
    sortOrder: 10,
    expValue: 30,
    dietType: 'universal',
    effect: {
      mood: 5,
      stamina: 10,
    },
  },
  {
    id: 'small-hat',
    name: '작은 모자',
    category: 'costume',
    slot: 'head',
    price: 150,
    description: '첫 꾸미기에 좋은 작은 모자예요.',
    sortOrder: 10,
    cosmeticOnly: true,
  },
  {
    id: 'red-ribbon',
    name: '빨간 리본',
    category: 'costume',
    slot: 'neck',
    price: 180,
    description: '가볍게 꾸밀 수 있는 리본이에요.',
    sortOrder: 11,
    cosmeticOnly: true,
  },
  {
    id: 'explorer-bag',
    name: '탐험가 가방',
    category: 'costume',
    slot: 'body',
    price: 250,
    description: '모험 분위기를 내는 가방이에요.',
    sortOrder: 12,
    cosmeticOnly: true,
  },
  {
    id: 'green-starter-egg',
    name: '초록 알',
    category: 'egg',
    price: 500,
    description: '일반 공룡을 만날 수 있는 기본 알이에요.',
    sortOrder: 20,
    rarity: 'normal',
    eggType: 'normal',
    eggCategory: 'normal',
  },
  {
    id: 'rare-egg-fragment',
    name: '희귀조각',
    category: 'hatchItem',
    price: 260,
    description: '희귀 알을 여는 데 필요한 반짝이는 조각이에요.',
    sortOrder: 43,
    effect: {
      hatchProgress: 0,
    },
  },
  {
    id: 'rare-spark-egg',
    name: '반짝 알',
    category: 'egg',
    price: 900,
    description: '조금 더 특별한 공룡을 기대하게 만드는 알이에요.',
    sortOrder: 30,
    rarity: 'special',
    eggType: 'special',
    eggCategory: 'special',
  },
  {
    id: 'green-forest-rare-egg',
    name: '초록 숲 희귀알',
    category: 'egg',
    price: 500,
    description: '초록 숲에서 만날 희귀 공룡을 기대하게 만드는 알이에요.',
    sortOrder: 31,
    rarity: 'rare',
    eggType: 'rare',
    eggCategory: 'rare',
    eggHabitatId: 'green-forest',
    requiredFragmentId: 'rare-egg-fragment',
    requiredFragmentAmount: 5,
    requiredFragments: [{ itemId: 'rare-egg-fragment', amount: 5 }],
  },
  {
    id: 'sparkle-cave-rare-egg',
    name: '반짝 동굴 희귀알',
    category: 'egg',
    price: 0,
    description: '반짝 동굴에서 만날 희귀 공룡을 기대하게 만드는 알이에요.',
    sortOrder: 32,
    rarity: 'rare',
    eggType: 'rare',
    eggCategory: 'rare',
    eggHabitatId: 'sparkle-cave',
    requiredFragmentId: 'rare-egg-fragment',
    requiredFragmentAmount: 10,
    requiredFragments: [{ itemId: 'rare-egg-fragment', amount: 10 }],
  },
  {
    id: 'volcano-island-rare-egg',
    name: '화산섬 희귀알',
    category: 'egg',
    price: 900,
    description: '화산섬에서 만날 희귀 공룡을 기대하게 만드는 알이에요.',
    sortOrder: 33,
    rarity: 'rare',
    eggType: 'rare',
    eggCategory: 'rare',
    eggHabitatId: 'volcano-island',
    requiredFragmentId: 'rare-egg-fragment',
    requiredFragmentAmount: 15,
    requiredFragments: [{ itemId: 'rare-egg-fragment', amount: 15 }],
  },
  {
    id: 'secret-land-rare-egg',
    name: '비밀의 땅 희귀알',
    category: 'egg',
    price: 0,
    description: '비밀의 땅에서 만날 희귀 공룡을 기대하게 만드는 알이에요.',
    sortOrder: 34,
    rarity: 'rare',
    eggType: 'rare',
    eggCategory: 'rare',
    eggHabitatId: 'secret-land',
    requiredFragmentId: 'rare-egg-fragment',
    requiredFragmentAmount: 20,
    requiredFragments: [{ itemId: 'rare-egg-fragment', amount: 20 }],
  },
  {
    id: 'ocean-blue-egg',
    name: '바다빛 알',
    category: 'egg',
    price: 700,
    description: '바다빛을 닮은 희귀한 알이에요.',
    sortOrder: 35,
    rarity: 'rare',
    eggType: 'rare',
    eggCategory: 'rare',
    requiredFragmentId: 'rare-egg-fragment',
    requiredFragmentAmount: 10,
    requiredFragments: [{ itemId: 'rare-egg-fragment', amount: 10 }],
  },
  {
    id: 'legend-egg',
    name: '전설 알',
    category: 'egg',
    price: 1200,
    description: '아주 특별한 공룡을 기대하게 만드는 전설 알이에요.',
    sortOrder: 36,
    rarity: 'rare',
    eggType: 'rare',
    eggCategory: 'rare',
    requiredFragmentId: 'rare-egg-fragment',
    requiredFragmentAmount: 20,
    requiredFragments: [{ itemId: 'rare-egg-fragment', amount: 20 }],
  },
  {
    id: 'hatch-warm-stone',
    name: '따뜻한 돌멩이',
    category: 'hatchItem',
    price: 120,
    description: '알을 조금 따뜻하게 해서 부화 게이지를 올려요.',
    sortOrder: 40,
    effect: {
      hatchProgress: 10,
    },
  },
  {
    id: 'hatch-warm-blanket',
    name: '따뜻한 담요',
    category: 'hatchItem',
    price: 220,
    description: '알을 포근하게 감싸 부화 게이지를 더 올려요.',
    sortOrder: 41,
    effect: {
      hatchProgress: 20,
    },
  },
  {
    id: 'hatch-spark-energy',
    name: '반짝 부화 에너지',
    category: 'hatchItem',
    price: 320,
    description: '반짝이는 기운으로 부화 게이지를 크게 올려요.',
    sortOrder: 42,
    effect: {
      hatchProgress: 30,
    },
  },
];

export function getItemConfig(itemId: string) {
  return itemConfigs.find((item) => item.id === itemId) ?? null;
}

export function getFoodItemConfig(itemId: string) {
  const item = getItemConfig(itemId);
  return item?.category === 'food' ? item : null;
}

export function getEggItemConfig(itemId: string) {
  const item = getItemConfig(itemId);
  return item?.category === 'egg' ? item : null;
}

export function getHatchItemConfig(itemId: string) {
  const item = getItemConfig(itemId);
  return item?.category === 'hatchItem' ? item : null;
}

export function getItemsByCategory(category: ItemCategory) {
  return itemConfigs.filter((item) => item.category === category).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getEggRequiredFragments(item: EggItemConfig): EggRequiredFragmentConfig[] {
  if (item.requiredFragments?.length) return item.requiredFragments;
  if (item.requiredFragmentId && item.requiredFragmentAmount) return [{ itemId: item.requiredFragmentId, amount: item.requiredFragmentAmount }];
  return [];
}
