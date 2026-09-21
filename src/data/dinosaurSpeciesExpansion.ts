import { dinosaurExpansionAssets } from '../assets/dex/dinosaurs_2';
import type { DinosaurSpecies } from './dinosaurSpecies';

// 파일 번호 01~08 순서: 일반 4종, 특수 2종, 희귀 1종, 전설 1종.
const expansionDrafts = [
  { speciesId: 'ichthyosaurus', displayName: '이크티오사우루스', habitat: 'deep-sea', diet: 'carnivore', personality: '활발함', favoriteFoodName: '물결 생선', discoveryHint: '뾰족한 주둥이를 가진 날씬한 그림자가 물살을 가르며 빠르게 지나가요.', description: '길쭉한 주둥이와 매끈한 몸을 가진 바다 친구예요. 물살을 타고 헤엄치기를 좋아해요.' },
  { speciesId: 'plesiosaurus', displayName: '플레시오사우루스', habitat: 'deep-sea', diet: 'carnivore', personality: '온화함', favoriteFoodName: '말랑 생선', discoveryHint: '잔잔한 바다 위로 작은 머리와 기다란 목이 살며시 올라와요.', description: '긴 목과 넓은 지느러미를 가진 바다 친구예요. 천천히 헤엄치며 주변을 둘러봐요.' },
  { speciesId: 'leedsichthys', displayName: '리드시크티스', habitat: 'deep-sea', diet: 'omnivore', personality: '느긋함', favoriteFoodName: '바다 한입 간식', discoveryHint: '깊은 물속에서 커다란 입을 벌린 물고기 그림자가 작은 먹이를 모아요.', description: '커다란 몸과 넓은 입을 가진 물고기 친구예요. 느긋하게 헤엄치며 작은 먹이를 모아요.' },
  { speciesId: 'mosasaurus', displayName: '모사사우루스', habitat: 'deep-sea', diet: 'carnivore', personality: '씩씩함', favoriteFoodName: '든든 생선', discoveryHint: '바닷속 바위 너머로 길고 튼튼한 꼬리가 크게 휘어지며 물결을 만들어요.', description: '튼튼한 꼬리와 힘찬 몸을 가진 바다 친구예요. 넓은 바다를 씩씩하게 누벼요.' },
  { speciesId: 'megalodon', displayName: '메갈로돈', habitat: 'deep-sea', diet: 'carnivore', personality: '당당함', favoriteFoodName: '왕 생선볼', discoveryHint: '바다 위에 커다란 삼각 지느러미가 보이고 물속에서 뾰족한 이빨이 반짝여요.', description: '커다란 지느러미와 뾰족한 이빨을 가진 상어 친구예요. 힘차게 헤엄치며 먼바다를 살펴요.' },
  { speciesId: 'tusoteuthis', displayName: '투소테우티스', habitat: 'deep-sea', diet: 'carnivore', personality: '호기심 많음', favoriteFoodName: '바다 고기볼', discoveryHint: '어두운 물속에서 길고 구불구불한 여러 팔이 반짝이며 펼쳐져요.', description: '길게 뻗은 여러 팔을 가진 바다 친구예요. 신기한 것을 만나면 팔을 살랑살랑 움직여요.' },
  { speciesId: 'dunkleosteus', displayName: '둔클레오스테우스', habitat: 'deep-sea', diet: 'carnivore', personality: '듬직함', favoriteFoodName: '단단 생선볼', discoveryHint: '바닷속 동굴에서 단단한 갑옷 같은 머리와 커다란 턱이 모습을 드러내요.', description: '갑옷처럼 단단한 머리가 든든한 물고기 친구예요. 커다란 턱을 벌리며 용감하게 나아가요.' },
  { speciesId: 'abyssrano', displayName: '어비스라노', habitat: 'deep-sea', diet: 'omnivore', personality: '신비로움', favoriteFoodName: '심해 빛사탕', discoveryHint: '가장 깊은 바닷속에서 보랏빛 수정이 등을 따라 빛나는 그림자가 보여요.', description: '보랏빛 수정과 빛나는 무늬를 가진 전설의 바다 친구예요. 어두운 심해를 환하게 밝혀 줘요.' },
  { speciesId: 'pachyrhinosaurus', displayName: '파키리노사우루스', habitat: 'ice-continent', diet: 'herbivore', personality: '든든함', favoriteFoodName: '눈꽃 잎사귀', discoveryHint: '눈 덮인 바위 뒤로 넓은 머리 장식과 코 위의 두툼한 혹이 보여요.', description: '코 위의 두툼한 혹과 넓은 머리 장식이 멋진 친구예요. 친구들과 나란히 눈길을 걸어요.' },
  { speciesId: 'troodon', displayName: '트로오돈', habitat: 'ice-continent', diet: 'omnivore', personality: '영리함', favoriteFoodName: '겨울 열매', discoveryHint: '눈길에 작은 발자국이 이어지고 깃털 사이로 커다란 눈이 주위를 살펴요.', description: '커다란 눈과 가벼운 몸을 가진 영리한 친구예요. 눈길에 남은 작은 흔적도 잘 찾아요.' },
  { speciesId: 'arctodus', displayName: '아르크토두스', habitat: 'ice-continent', diet: 'omnivore', personality: '느긋함', favoriteFoodName: '겨울 꿀열매', discoveryHint: '눈밭에 넓은 발자국이 찍혀 있고 하얀 털 사이로 둥근 귀가 쫑긋 보여요.', description: '두툼한 털과 든든한 발을 가진 곰 친구예요. 눈밭을 느긋하게 걸으며 겨울 간식을 찾아요.' },
  { speciesId: 'woolly-rhino', displayName: '털코뿔소', habitat: 'ice-continent', diet: 'herbivore', personality: '꾸준함', favoriteFoodName: '겨울 풀잎', discoveryHint: '북슬북슬한 갈색 그림자가 코 위의 긴 뿔로 눈을 헤치며 걸어가요.', description: '두꺼운 털과 커다란 코뿔을 가진 친구예요. 눈 아래 숨은 풀을 찾아 꾸준히 걸어요.' },
  { speciesId: 'yutyrannus', displayName: '유티라누스', habitat: 'ice-continent', diet: 'carnivore', personality: '용감함', favoriteFoodName: '따뜻한 고기볼', discoveryHint: '눈보라 사이로 온몸에 포근한 깃털을 두른 큰 두 발 그림자가 나타나요.', description: '포근한 깃털을 두른 용감한 친구예요. 힘찬 두 발로 눈길을 걸으며 친구들을 이끌어요.' },
  { speciesId: 'smilodon', displayName: '스밀로돈', habitat: 'ice-continent', diet: 'carnivore', personality: '신중함', favoriteFoodName: '든든 고기볼', discoveryHint: '눈 언덕에 고양이 같은 발자국이 남고 입가에 길게 내려온 송곳니가 보여요.', description: '길게 내려온 송곳니와 튼튼한 발을 가진 친구예요. 조용히 주변을 살피며 사뿐사뿐 걸어요.' },
  { speciesId: 'woolly-mammoth', displayName: '털매머드', habitat: 'ice-continent', diet: 'herbivore', personality: '온화함', favoriteFoodName: '얼음 대륙 풀다발', discoveryHint: '눈밭에서 긴 코가 흔들리고 둥글게 휘어진 큰 엄니 두 개가 보여요.', description: '긴 코와 휘어진 엄니를 가진 털북숭이 친구예요. 커다란 몸으로 작은 친구들의 바람을 막아 줘요.' },
  { speciesId: 'ice-legend', displayName: '얼음 수호룡', habitat: 'ice-continent', diet: 'omnivore', personality: '차분함', favoriteFoodName: '눈꽃 사탕', discoveryHint: '얼음 봉우리 위에서 눈꽃 무늬 날개와 푸른 수정 뿔이 반짝인다는 소문이 있어요.', description: '눈꽃 무늬 날개와 푸른 수정 뿔을 가진 전설의 친구예요. 하얀 눈이 내리는 대륙을 조용히 지켜요.' },
] as const;

export const additionalDinosaurSpecies: DinosaurSpecies[] = expansionDrafts.map((draft, index) => {
  const slot = index % 8;
  const eggCategory = slot < 4 ? 'normal' : slot < 6 ? 'special' : slot === 6 ? 'rare' : 'legend';
  const rarity = slot < 4 ? 'common' : slot < 6 ? 'special' : slot === 6 ? 'rare' : 'legendary';
  const eggLabel = { normal: '일반', special: '특수', rare: '희귀', legend: '전설' }[eggCategory];
  const images = dinosaurExpansionAssets[draft.speciesId];
  return {
    ...draft,
    name: draft.displayName,
    defaultName: draft.displayName,
    dexDescription: draft.description,
    rarity,
    eggCategory,
    unlockSource: `${eggCategory === 'normal' ? 'normal' : eggCategory}-egg`,
    collectionOrder: 25 + index,
    habitatOrder: draft.habitat === 'deep-sea' ? 4 : 5,
    foundMethodLabel: `${eggLabel} 알에서 태어남`,
    unlockHint: eggCategory === 'legend' ? '전설알의 조건을 충족하면 만날 수 있어요.' : `${eggLabel}알을 부화시키면 만날 수 있어요.`,
    images,
    characterAsset: images.baby,
    silhouette: '◆',
    starterSelectable: false,
    status: 'available',
    homeScale: 1, homeOffsetX: 0, homeOffsetY: 0,
    cardScale: 1, cardOffsetX: 0, cardOffsetY: 0,
  };
});

