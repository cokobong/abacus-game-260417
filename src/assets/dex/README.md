# Dex image assets

도감, 알부화장, 우리 공룡 화면에서 함께 사용할 이미지 에셋 루트입니다.

## Folders

- `dinosaurs/`: 발견한 공룡의 카드·전신 이미지
- `silhouettes/`: 미발견 공룡과 범용 공룡 실루엣
- `eggs/`: 일반·특수·희귀 알 이미지
- `habitats/`: 숲·동굴·화산·비밀의 땅 배경 이미지

## Naming

- 영문 소문자와 snake_case를 사용합니다.
- 공룡별 이미지는 가능하면 `speciesId`와 대응되는 이름을 사용합니다.
- 같은 공룡의 용도가 여러 개면 `_card`, `_room`, `_detail` 접미사를 붙입니다.
- 투명 배경이 필요한 공룡·알·실루엣은 PNG 또는 WebP를 권장합니다.
- 배경 이미지는 WebP를 우선 고려합니다.

이미지가 준비되면 `src/data/dinosaurSpecies.ts` 등의 데이터 항목에서 이 경로를 연결할 수 있습니다.
