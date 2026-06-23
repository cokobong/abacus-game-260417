import type { CostumeSlot, DinosaurState } from '../types/game';

export type ItemCategory = 'food' | 'costume' | 'dinosaur' | 'egg' | 'hatchItem' | 'toy' | 'misc';
export type DinosaurStatEffect = Partial<Pick<DinosaurState, 'exp' | 'mood' | 'hunger' | 'stamina'>>;

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

export interface EggItemConfig extends BaseItemConfig {
  category: 'egg';
  rarity: 'normal' | 'rare' | 'special';
  eggType: string;
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
  hunger: 15,
  mood: 1,
  exp: 3,
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
    description: '든든한 기본 사료예요.',
    sortOrder: 1,
    effect: {
      hunger: 20,
      exp: 3,
    },
  },
  {
    id: 'soft-berry',
    name: '말랑 열매',
    category: 'food',
    price: 80,
    description: '포만감과 행복을 조금 채워줘요.',
    sortOrder: 2,
    effect: {
      hunger: 12,
      mood: 2,
    },
  },
  {
    id: 'leaf-snack',
    name: '나뭇잎',
    category: 'food',
    price: 30,
    description: '가벼운 기본 사료예요.',
    sortOrder: 3,
    effect: {
      hunger: 8,
    },
  },
  {
    id: 'dino-cookie',
    name: '공룡 쿠키',
    category: 'food',
    price: 150,
    description: '행복을 더 채워주는 간식이에요.',
    sortOrder: 4,
    effect: {
      mood: 3,
      exp: 2,
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
    eggType: 'starter-normal',
  },
  {
    id: 'rare-tricera-fragment',
    name: '희귀 트리케라 조각',
    category: 'dinosaur',
    price: 900,
    description: '희귀 공룡 해금을 위한 장기 목표예요.',
    sortOrder: 21,
    rarity: 'rare',
    unlockType: 'egg_fragment',
  },
  {
    id: 'rare-spark-egg',
    name: '반짝 알',
    category: 'egg',
    price: 900,
    description: '조금 더 특별한 공룡을 기대하게 만드는 알이에요.',
    sortOrder: 30,
    rarity: 'rare',
    eggType: 'rare-spark',
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
