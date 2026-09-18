# 에셋 조사 및 정리 보고서

작성일: 2026-09-08. 조사 기준: habitat 연결 변경 후, archive 이동 전 작업 트리. 기존 미커밋 공룡 DB/16종 이미지 작업도 포함해 조사했으며 해당 데이터는 이번 작업에서 수정하지 않는다.

## 범위와 조사 방법

- src/assets 전체 501개 파일(이미지·음원·인덱스·README·.gitkeep 포함)을 재귀 스캔했다.
- src의 TS/TSX/CSS/JSON, 루트 설정·HTML, scripts의 JS/PowerShell, 문서·데이터 파일의 경로/파일명/줄기 문자열을 대조했다. node_modules, .git, 생성물 dist는 원본 참조 조사에서 제외했다.
- 상대 경로 import/export, new URL, 문자열 경로는 참조 파일 기준으로 정규화했다. 파일명만 겹치는 경우는 정적 경로 참조와 구분했다. CSS url 및 데이터 문자열도 전체 텍스트 조사에 포함했다.
- import.meta.glob 4개와 파일명 조합 코드를 별도 검토했다. PS1의 carnotaurus_run_$frame.png도 입력 원본으로 보호했다.
- 전 파일 SHA-256 비교로 바이너리 중복을 조사했다. 동일 해시만으로 이동하지 않고 참조를 우선했다.
- ACTIVE는 코드의 정적 연결이 확인된 보수적 보호 집합이다. export된 모든 항목이 모든 화면에서 표시된다는 뜻은 아니다. 미사용 export 제거/전체 런타임 도달성 리팩터링은 하지 않았다.
- REVIEW_REQUIRED는 동적 로딩, 도구 입력, 지원 파일 또는 대체본 미확정 파일이다. glob 검수 이미지처럼 실제 사용이 확인된 파일도 자동 정리 위험을 명시하려고 이 범주에 보존했다.
- 구형/버전 접미사가 있어도 import되면 ACTIVE가 우선한다. 예: dino_name_panel_v2.png, shop/items/eggs/old의 4개 legacy 알.

## 도감 표시 변경 위치

- 표시명: src/components/screens/DexScreen.tsx의 habitatMeta(label/shortLabel). 탭과 제목의 OO 친구들이 함께 반영된다.
- 이미지 import/매핑: src/assets/dex/index.ts의 dexHabitatBadgeImages → DexHabitatTabs의 img.
- habitat ID/순서/지역 연결: src/data/dinosaurSpecies.ts의 DinosaurHabitatId, dexHabitats, dexAdventureRegionByHabitat. 이번 작업에서 수정하지 않았다.

| 내부 ID(유지) | 도감 표시명 | 상단 이미지(src/assets/dex/habitats/) |
| --- | --- | --- |
| volcano-island | 화산지대 | 01_volcanic_zone.png |
| sky-island | 고공정원 | 02_sky_garden.png |
| ancient-ruins | 고대밀림 | 03_ancient_jungle.png |
| deep-sea | 심해세계 | 04_deep_sea_world.png |
| ice-continent | 빙하기 | 05_ice_age.png |

모험맵/미니게임 지역명, 공룡 힌트·DB·알 등급·해금·진행률·현재 배경/제목 장식 이미지 연결은 유지한다.

## 전체 폴더 구조와 용도

| 주요 폴더 | 용도 |
| --- | --- |
| adventure | 모험맵, 용암계곡/하늘섬 미니게임, 효과·스프라이트·최적화 원본 |
| audio | BGM, UI/훈련/공룡/보상 효과음 |
| dex | 도감 지역 배경/탭/공룡 성장 이미지/알/장식/실루엣 |
| dex/dinosaurs | 기존 공룡 성장 이미지 및 에셋 매핑 |
| dex/dino_upgrade | 현재 교체 공룡 이미지 및 검수 원본 |
| dex/dinosaurs_1 | 검수 화면의 배경 제거 비교 이미지(glob 사용) |
| dex/dinosaurs_2 | 최근 추가한 바다·얼음 16종의 48장과 매핑 |
| hatchery | 부화장 배경, 아이템 UI, 성공 팝업 |
| home | 홈 배경·상태·버튼 |
| pet | 공룡방 배경·돌봄·먹이 패널 |
| shop | 상점·알·먹이·부화 아이템·팝업 |
| training | 훈련 화면과 완료 화면 |
| ui | 하단 내비게이션 및 훈련 공통 장식 |

이동 전 모든 하위 폴더의 파일 수:

| 폴더(src/assets 기준) | 파일 수 |
| --- | ---: |
| adventure | 3 |
| adventure/common | 1 |
| adventure/common/map | 1 |
| adventure/common/ui | 8 |
| adventure/lava-valley | 1 |
| adventure/lava-valley/background | 3 |
| adventure/lava-valley/collectibles | 6 |
| adventure/lava-valley/effects | 8 |
| adventure/lava-valley/environment | 8 |
| adventure/lava-valley/obstacles | 2 |
| adventure/lava-valley/player | 15 |
| adventure/lava-valley/track | 8 |
| adventure/lava-valley/ui/buttons | 7 |
| adventure/lava-valley/ui/events | 5 |
| adventure/lava-valley/ui/hud | 5 |
| adventure/sky-island | 1 |
| adventure/sky-island/background | 3 |
| adventure/sky-island/collectibles | 2 |
| adventure/sky-island/effects | 5 |
| adventure/sky-island/environment | 4 |
| adventure/sky-island/obstacles | 3 |
| adventure/sky-island/player | 8 |
| adventure/sky-island/ui/buttons | 4 |
| adventure/sky-island/ui/events | 5 |
| adventure/sky-island/ui/hud | 5 |
| audio/bgm | 8 |
| audio/dino | 2 |
| audio/items | 2 |
| audio/rewards | 2 |
| audio/training | 4 |
| audio/ui | 2 |
| dex | 2 |
| dex/collection | 8 |
| dex/dino_upgrade | 27 |
| dex/dinosaurs | 74 |
| dex/dinosaurs_1 | 27 |
| dex/dinosaurs_2 | 49 |
| dex/eggs | 3 |
| dex/habitats | 14 |
| dex/header | 1 |
| dex/mascots | 1 |
| dex/ornaments | 4 |
| dex/rewards | 2 |
| dex/silhouettes | 4 |
| hatchery/backgrounds | 1 |
| hatchery/success-popup | 4 |
| hatchery/ui | 4 |
| home | 7 |
| pet/backgrounds | 2 |
| pet/characters | 1 |
| pet/mydino | 19 |
| pet/panels | 4 |
| shop | 1 |
| shop/backgrounds | 2 |
| shop/buttons | 7 |
| shop/categories | 7 |
| shop/items/eggs | 5 |
| shop/items/eggs/old | 6 |
| shop/items/food | 9 |
| shop/items/hatch | 5 |
| shop/panels | 5 |
| shop/popup | 6 |
| training | 2 |
| training/backgrounds | 2 |
| training/buttons | 5 |
| training/characters | 2 |
| training/completion/buttons | 2 |
| training/completion/panels | 2 |
| training/panels | 4 |
| training/status | 3 |
| ui/bottom-nav | 11 |
| ui/navigation | 2 |
| ui/training | 14 |

## 분류 집계

| 분류 | 파일 수 |
| --- | ---: |
| ACTIVE | 407 |
| LIKELY_UNUSED | 7 |
| DUPLICATE_OR_OLD | 4 |
| REVIEW_REQUIRED | 83 |

총 archive 이동 완료 11개. 영구 삭제 0개. 이동 전 보고서를 작성하고 아래 확정 목록만 원래 상대 경로 그대로 _archive_unused 아래로 이동한다.

## 삭제 추천 / archive 확정 목록

현재 영구 삭제를 권하지 않는다. 아래 11개는 Git diff 및 화면 검증 후 추후 영구 삭제를 검토할 수 있는 목록이다. 복원은 archive 경로에서 원래 경로로 이동하면 된다. 같은 이름의 다른 폴더 파일은 이동하지 않는다.

| 원래 경로 | archive 경로 | 대체본 | 근거 | SHA-256 |
| --- | --- | --- | --- | --- |
| src/assets/dex/collection/collection_bg_crystal_cave.png | src/assets/_archive_unused/dex/collection/collection_bg_crystal_cave.png | src/assets/dex/collection/collection_bg_sky_island.png | 이전 동굴 지역 배경; 현재 5지역 background 매핑에서 제외 | 1d95fc2e26557007dc92eaa73471291fc02567a0468b355a09039e0c0b3f4aed |
| src/assets/dex/collection/collection_bg_green_forest.png | src/assets/_archive_unused/dex/collection/collection_bg_green_forest.png | src/assets/dex/collection/collection_bg_volcano_island.png | 이전 숲 지역 배경; 현재 5지역 background 매핑에서 제외 | c6c2a8e9797f35dfa52f714b71fedc1d6c4adbbffcde1663727302f2ea93c7db |
| src/assets/dex/collection/collection_bg_secret_land.png | src/assets/_archive_unused/dex/collection/collection_bg_secret_land.png | src/assets/dex/collection/collection_bg_ancient_ruins.png | 이전 비밀 지역 배경; 현재 5지역 background 매핑에서 제외 | a2ba20671daedd2a6a66536264cb840a685fa125394c2861e0fefccd9f871624 |
| src/assets/dex/habitats/abitat_volcano_badge.png | src/assets/_archive_unused/dex/habitats/abitat_volcano_badge.png | src/assets/dex/habitats/01_volcanic_zone.png | 이번에 교체한 이전 도감 탭 배지 | 336e5415211f7cfde4d4bd6f8cae5f812fbb2ee500aeb5e05fb13f3b3d2c7ca6 |
| src/assets/dex/habitats/habitat_cave_badge.png | src/assets/_archive_unused/dex/habitats/habitat_cave_badge.png | src/assets/dex/habitats/02_sky_garden.png | 이번에 교체한 이전 도감 탭 배지 | 696b8b86cb41338366cdd10ae115681aae1ae8ccfdd36454c0d4dad4950db2cb |
| src/assets/dex/habitats/habitat_forest_badge.png | src/assets/_archive_unused/dex/habitats/habitat_forest_badge.png | src/assets/dex/habitats/05_ice_age.png | 이번에 교체한 이전 도감 탭 배지 | dee35c997f8534fc93cb4df8ce4f7e8e1a24ed89c8bf8e30ac3eecc00cfcad03 |
| src/assets/dex/habitats/habitat_secret_badge.png | src/assets/_archive_unused/dex/habitats/habitat_secret_badge.png | src/assets/dex/habitats/03_ancient_jungle.png | 이번에 교체한 이전 도감 탭 배지; ornaments/의 동명 파일은 별개이며 보존 | dd29cb236654dacc0fc363ad0cd8d4871aac537034c7f56660d7366ef74c85d0 |
| src/assets/shop/buttons/shop_btn_buy_disabled.original.png | src/assets/_archive_unused/shop/buttons/shop_btn_buy_disabled.original.png | src/assets/shop/buttons/shop_btn_buy_disabled.png | 참조 없는 original 원본; 현재 버튼은 접미사 없는 파일 import | 237d7604b277945d51009291d614d5a106ca6d59ba0ff3f02a4ca00984a9d470 |
| src/assets/shop/buttons/shop_btn_my_dino.chromakey.png | src/assets/_archive_unused/shop/buttons/shop_btn_my_dino.chromakey.png | src/assets/shop/buttons/shop_btn_my_dino.png | 참조 없는 chromakey 원본; 현재 버튼은 접미사 없는 파일 import | 8a9e2943c3a478573311974892cbf8dbe0be3a85689290b6ecc955da95a58f50 |
| src/assets/shop/items/eggs/old/shop_item_egg_green.png | src/assets/_archive_unused/shop/items/eggs/old/shop_item_egg_green.png | src/assets/shop/items/eggs/egg_common.png | old 일반알 이미지; 현재 일반알 이미지와 카탈로그 연결 확인 | a6c729a0c5434b0417fdc9bc868eacd3371ba2ece15bd24e6c5440f14001b5dd |
| src/assets/shop/items/eggs/old/shop_item_egg_sparkle.png | src/assets/_archive_unused/shop/items/eggs/old/shop_item_egg_sparkle.png | src/assets/shop/items/eggs/egg_special.png | old 특수알 이미지; 현재 특수알 이미지와 카탈로그 연결 확인 | 94e85ba7d497e8390b6060655975241ab7372c280d352d2378601f7bf622e391 |

## 동적 참조 및 보존 대상

- src/assets/ui/training/index.ts: src/assets/ui/training/*.png
- src/assets/ui/training/index.ts: src/assets/characters/*.png
- src/components/DinosaurAssetReview.tsx: src/assets/dex/dino_upgrade/*.png
- src/components/DinosaurAssetReview.tsx: src/assets/dex/dinosaurs_1/*.png

- dinosaurs_1의 27장은 검수 화면에서 glob/파일명 정규식으로 사용하므로 보존한다.
- ui/training/speechbubble_cheer_02.png는 glob에 포함되지만 명시적 선택 용도가 불분명해 보존한다.
- carnotaurus_run_1~4.png, 비최적화 player/collectibles는 optimize-lava-assets.ps1 입력이므로 보존한다. sprite sheet는 유지한다.
- adventure_map_bg.png, 두 level_intro_panel 이미지, pet 구형 패널/버튼/배경, training_bg_dino_yard.png는 참조를 못 찾았지만 대체 용도가 확실하지 않아 보존한다.
- old/shop_item_egg_forest_rare.png, shop_item_egg_volcano_rare.png, shop_item_egg_ocean.png, shop_item_egg_legendary.png는 src/assets/shop/index.ts가 참조하므로 보존한다.
- 새 habitat 5종, 현재 collection 배경 5종, 공룡/알 이미지, 미니게임 현재 사용 파일은 보호한다.

## ACTIVE 전체 파일 목록

| 파일 | 근거/참조 | 조치 |
| --- | --- | --- |
| src/assets/adventure/adventure_tab_icon.png | 정적 경로/import/new URL 참조 — src/assets/ui/bottom-nav/index.ts | 현 위치 보존 |
| src/assets/adventure/common/map/adventure_world_map.png | 정적 경로/import/new URL 참조 — src/assets/adventure/common/index.ts | 현 위치 보존 |
| src/assets/adventure/common/ui/adventure_entry_coin_banner.png | 정적 경로/import/new URL 참조 — src/assets/adventure/common/index.ts | 현 위치 보존 |
| src/assets/adventure/common/ui/adventure_start_button.png | 정적 경로/import/new URL 참조 — src/assets/adventure/common/index.ts | 현 위치 보존 |
| src/assets/adventure/common/ui/adventure_title_banner.png | 정적 경로/import/new URL 참조 — src/assets/adventure/common/index.ts | 현 위치 보존 |
| src/assets/adventure/common/ui/panel_ancient_ruins.png | 정적 경로/import/new URL 참조 — src/assets/adventure/common/index.ts | 현 위치 보존 |
| src/assets/adventure/common/ui/panel_deep_sea_canyon.png | 정적 경로/import/new URL 참조 — src/assets/adventure/common/index.ts | 현 위치 보존 |
| src/assets/adventure/common/ui/panel_ice_continent.png | 정적 경로/import/new URL 참조 — src/assets/adventure/common/index.ts | 현 위치 보존 |
| src/assets/adventure/common/ui/panel_lava_valley.png | 정적 경로/import/new URL 참조 — src/assets/adventure/common/index.ts | 현 위치 보존 |
| src/assets/adventure/common/ui/panel_sky_island.png | 정적 경로/import/new URL 참조 — src/assets/adventure/common/index.ts | 현 위치 보존 |
| src/assets/adventure/health_restore.png | 정적 경로/import/new URL 참조 — src/assets/adventure/index.ts, src/components/screens/LavaPathPrototype.tsx, src/components/screens/SkyIslandPrototype.tsx, src/config/adventureCollectibles.test.ts, src/config/adventureCollectibles.ts, src/index.css | 현 위치 보존 |
| src/assets/adventure/lava-valley/background/lava_valley_background.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/background/lava_valley_background2.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/collectibles/dino_coin_optimized.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/collectibles/meat_food_item_optimized.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/collectibles/rare_egg_shard_optimized.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/effects/checkpoint_burst.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/effects/clear_burst.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts, src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/effects/coin_pickup_sparkle.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts, src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/effects/dinosaur_contact_shadow.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/effects/hurt_impact.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/effects/item_pickup_sparkle.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts, src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/effects/jump_dust.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/effects/landing_dust.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/environment/goal_portal.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/environment/lava_torch_totem.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/environment/magma_crystal_altar.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/environment/race_gate_arch.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/environment/treasure_chest_closed.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/environment/treasure_chest_open.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/environment/upgraded_checkpoint_flag.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/environment/warning_sign.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/obstacles/lava_geyser_obstacle.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/obstacles/lava_rock_obstacle.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/player/carnotaurus_fall_optimized.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/player/carnotaurus_hurt_optimized.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/player/carnotaurus_idle_optimized.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/player/carnotaurus_jump_up_optimized.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/player/carnotaurus_run_sheet.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts, src/index.css, scripts/optimize-lava-assets.ps1 | 현 위치 보존 |
| src/assets/adventure/lava-valley/player/carnotaurus_victory_optimized.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/track/lava_crack_overlay.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/track/lava_edge_strip.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/track/lava_track_checkpoint.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/track/lava_track_end.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/track/lava_track_start.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/track/lava_track_tile_a.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/track/lava_track_tile_b.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/track/lava_track_tile_c.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/ui/buttons/dash_button_cooldown.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/ui/buttons/dash_button_disabled.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/ui/buttons/dash_button_pressed.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/ui/buttons/dash_button_ready.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/ui/buttons/jump_button_normal.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/ui/buttons/jump_button_pressed.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/ui/buttons/pause_settings_button.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/ui/events/combo_popup.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts, src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/ui/events/dino_speech_bubble.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/ui/events/pause_menu_panel.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts, src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/ui/events/result_clear_panel.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts, src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/ui/hud/coin_counter_panel.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/ui/hud/distance_time_panel.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/ui/hud/health_panel.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts, src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/ui/hud/rare_fragment_panel.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/ui/hud/top_hud_panel.png | 정적 경로/import/new URL 참조 — src/assets/adventure/lava-valley/index.ts, src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/sky-island/background/sky_background_far.png | 정적 경로/import/new URL 참조 — src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/sky-island/background/sky_background_mid.png | 정적 경로/import/new URL 참조 — src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/sky-island/background/sky_background_near.png | 정적 경로/import/new URL 참조 — src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/sky-island/collectibles/rare_fragment_sky.png | 정적 경로/import/new URL 참조 — src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/sky-island/collectibles/sky_coin.png | 정적 경로/import/new URL 참조 — src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/sky-island/effects/clear_burst_sky.png | 정적 경로/import/new URL 참조 — src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/sky-island/effects/coin_pickup_sparkle_sky.png | 정적 경로/import/new URL 참조 — src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/sky-island/effects/fly_speed_lines_sky.png | 정적 경로/import/new URL 참조 — src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/sky-island/effects/hurt_cloud_burst.png | 정적 경로/import/new URL 참조 — src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/sky-island/effects/item_pickup_sparkle_sky.png | 정적 경로/import/new URL 참조 — src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/sky-island/environment/checkpoint_cloud_flag.png | 정적 경로/import/new URL 참조 — src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/sky-island/environment/cloud_lane_strip.png | 정적 경로/import/new URL 참조 — src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/sky-island/environment/floating_island_platform.png | 정적 경로/import/new URL 참조 — src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/sky-island/environment/goal_gate_cloud_arch.png | 정적 경로/import/new URL 참조 — src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/sky-island/obstacles/flying_rock_obstacle.png | 정적 경로/import/new URL 참조 — src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/sky-island/obstacles/lightning_cloud_obstacle.png | 정적 경로/import/new URL 참조 — src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/sky-island/obstacles/spike_cloud_obstacle.png | 정적 경로/import/new URL 참조 — src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/sky-island/player/pteranodon_down.png | 정적 경로/import/new URL 참조 — src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/sky-island/player/pteranodon_fly_1.png | 정적 경로/import/new URL 참조 — src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/sky-island/player/pteranodon_fly_2.png | 정적 경로/import/new URL 참조 — src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/sky-island/player/pteranodon_fly_3.png | 정적 경로/import/new URL 참조 — src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/sky-island/player/pteranodon_hurt.png | 정적 경로/import/new URL 참조 — src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/sky-island/player/pteranodon_idle.png | 정적 경로/import/new URL 참조 — src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/sky-island/player/pteranodon_up.png | 정적 경로/import/new URL 참조 — src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/sky-island/player/pteranodon_victory.png | 정적 경로/import/new URL 참조 — src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/sky-island/ui/buttons/move_down_button.png | 정적 경로/import/new URL 참조 — src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/sky-island/ui/buttons/move_up_button.png | 정적 경로/import/new URL 참조 — src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/sky-island/ui/buttons/sky_boost_button_ready.png | 정적 경로/import/new URL 참조 — src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/sky-island/ui/buttons/sky_pause_button.png | 정적 경로/import/new URL 참조 — src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/sky-island/ui/events/combo_popup_sky.png | 정적 경로/import/new URL 참조 — src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/sky-island/ui/events/pause_menu_panel_sky.png | 정적 경로/import/new URL 참조 — src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/sky-island/ui/events/result_clear_panel_sky.png | 정적 경로/import/new URL 참조 — src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/sky-island/ui/events/speech_bubble_sky.png | 정적 경로/import/new URL 참조 — src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/sky-island/ui/hud/sky_coin_panel.png | 정적 경로/import/new URL 참조 — src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/sky-island/ui/hud/sky_distance_panel.png | 정적 경로/import/new URL 참조 — src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/sky-island/ui/hud/sky_fragment_panel.png | 정적 경로/import/new URL 참조 — src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/sky-island/ui/hud/sky_health_panel.png | 정적 경로/import/new URL 참조 — src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/adventure/sky-island/ui/hud/sky_top_hud_panel.png | 정적 경로/import/new URL 참조 — src/assets/adventure/sky-island/index.ts | 현 위치 보존 |
| src/assets/audio/bgm/dinopedia_bgm_discovery_loop_10s.mp3 | 정적 경로/import/new URL 참조 — src/audio/audioManager.ts | 현 위치 보존 |
| src/assets/audio/bgm/dinopedia_bgm_discovery_loop_10s.ogg | 정적 경로/import/new URL 참조 — src/audio/audioManager.ts | 현 위치 보존 |
| src/assets/audio/bgm/dinosaur_view_bgm_friend_loop_10s.mp3 | 정적 경로/import/new URL 참조 — src/audio/audioManager.ts | 현 위치 보존 |
| src/assets/audio/bgm/dinosaur_view_bgm_friend_loop_10s.ogg | 정적 경로/import/new URL 참조 — src/audio/audioManager.ts | 현 위치 보존 |
| src/assets/audio/bgm/home_bgm_learning_loop_10s.mp3 | 정적 경로/import/new URL 참조 — src/audio/audioManager.ts | 현 위치 보존 |
| src/assets/audio/bgm/home_bgm_learning_loop_10s.ogg | 정적 경로/import/new URL 참조 — src/audio/audioManager.ts | 현 위치 보존 |
| src/assets/audio/bgm/shop_bgm_toy_browse_loop_10s.mp3 | 정적 경로/import/new URL 참조 — src/audio/audioManager.ts | 현 위치 보존 |
| src/assets/audio/bgm/shop_bgm_toy_browse_loop_10s.ogg | 정적 경로/import/new URL 참조 — src/audio/audioManager.ts | 현 위치 보존 |
| src/assets/audio/dino/dino_eat.wav | 정적 경로/import/new URL 참조 — src/audio/audioManager.ts, src/App.tsx (문서 언급: docs/abacus-game-audio-design.md) | 현 위치 보존 |
| src/assets/audio/dino/dino_happy.mp3 | 정적 경로/import/new URL 참조 — src/audio/audioManager.ts, src/App.tsx (문서 언급: docs/abacus-game-audio-design.md) | 현 위치 보존 |
| src/assets/audio/items/item_select.wav | 정적 경로/import/new URL 참조 — src/audio/audioManager.ts, src/App.tsx, src/components/screens/DinosaurRoomScreen.tsx, src/components/screens/HatcheryScreen.tsx | 현 위치 보존 |
| src/assets/audio/items/item_use.wav | 정적 경로/import/new URL 참조 — src/audio/audioManager.ts, src/App.tsx, src/components/screens/DinosaurRoomScreen.tsx, src/components/screens/HatcheryScreen.tsx (문서 언급: docs/abacus-game-audio-design.md) | 현 위치 보존 |
| src/assets/audio/rewards/level_up.mp3 | 정적 경로/import/new URL 참조 — src/audio/audioManager.ts, src/App.tsx (문서 언급: docs/abacus-game-audio-design.md) | 현 위치 보존 |
| src/assets/audio/rewards/reward_coin.wav | 정적 경로/import/new URL 참조 — src/audio/audioManager.ts, src/App.tsx, src/assets/ui/training/index.ts (문서 언급: docs/abacus-game-audio-design.md, docs/image-style-guide.md) | 현 위치 보존 |
| src/assets/audio/training/training_correct.wav | 정적 경로/import/new URL 참조 — src/audio/audioManager.ts, src/hooks/useTrainingSession.ts (문서 언급: docs/abacus-game-audio-design.md) | 현 위치 보존 |
| src/assets/audio/training/training_number_input.wav | 정적 경로/import/new URL 참조 — src/audio/audioManager.ts, src/App.tsx (문서 언급: docs/abacus-game-audio-design.md) | 현 위치 보존 |
| src/assets/audio/training/training_submit.wav | 정적 경로/import/new URL 참조 — src/audio/audioManager.ts, src/hooks/useTrainingSession.ts (문서 언급: docs/abacus-game-audio-design.md) | 현 위치 보존 |
| src/assets/audio/training/training_wrong.wav | 정적 경로/import/new URL 참조 — src/audio/audioManager.ts, src/hooks/useTrainingSession.ts (문서 언급: docs/abacus-game-audio-design.md) | 현 위치 보존 |
| src/assets/audio/ui/ui_button_tap.wav | 정적 경로/import/new URL 참조 — src/audio/audioManager.ts, src/App.tsx, src/components/screens/AdventureMapScreen.tsx, src/components/screens/DexScreen.tsx, src/components/screens/HatcheryScreen.tsx, src/components/screens/ShopScreen.tsx | 현 위치 보존 |
| src/assets/audio/ui/ui_tab_switch.wav | 정적 경로/import/new URL 참조 — src/audio/audioManager.ts, src/App.tsx, src/components/screens/DexScreen.tsx, src/components/screens/HatcheryScreen.tsx, src/components/screens/ShopScreen.tsx | 현 위치 보존 |
| src/assets/dex/collection/collection_bg_ancient_ruins.png | 정적 경로/import/new URL 참조 — src/assets/dex/index.ts | 현 위치 보존 |
| src/assets/dex/collection/collection_bg_deep_sea.png | 정적 경로/import/new URL 참조 — src/assets/dex/index.ts | 현 위치 보존 |
| src/assets/dex/collection/collection_bg_ice_continent.png | 정적 경로/import/new URL 참조 — src/assets/dex/index.ts | 현 위치 보존 |
| src/assets/dex/collection/collection_bg_sky_island.png | 정적 경로/import/new URL 참조 — src/assets/dex/index.ts | 현 위치 보존 |
| src/assets/dex/collection/collection_bg_volcano_island.png | 정적 경로/import/new URL 참조 — src/assets/dex/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_allosaurus_adult_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_allosaurus_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts (문서 언급: src/assets/dex/dinosaurs/README.md) | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_allosaurus_youth_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_amargasaurus_adult_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_amargasaurus_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts (문서 언급: src/assets/dex/dinosaurs/README.md) | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_amargasaurus_youth_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_ankylo_adult_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_ankylo_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts (문서 언급: src/assets/dex/dinosaurs/README.md) | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_ankylo_youth_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_brachiosaurus_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts (문서 언급: docs/image-style-guide.md, src/assets/dex/dinosaurs/README.md) | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_brachio_adult_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_brachio_youth_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_carnotaurus_adult_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_carnotaurus_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts (문서 언급: src/assets/dex/dinosaurs/README.md) | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_carnotaurus_youth_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_ceratosaurus_adult_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_ceratosaurus_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts (문서 언급: src/assets/dex/dinosaurs/README.md) | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_ceratosaurus_youth_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_corytho_adult_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_corytho_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts (문서 언급: src/assets/dex/dinosaurs/README.md) | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_corytho_youth_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_deinonychus_adult_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_deinonychus_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts (문서 언급: src/assets/dex/dinosaurs/README.md) | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_deinonychus_youth_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_diplodocus_adult_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_diplodocus_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts (문서 언급: src/assets/dex/dinosaurs/README.md) | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_diplodocus_youth_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_dracorex_adult_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_dracorex_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts (문서 언급: src/assets/dex/dinosaurs/README.md) | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_dracorex_youth_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_gallimimus_adult_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_gallimimus_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts (문서 언급: src/assets/dex/dinosaurs/README.md) | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_gallimimus_youth_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_iguanodon_adult_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_iguanodon_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts (문서 언급: src/assets/dex/dinosaurs/README.md) | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_iguanodon_youth_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_kentrosaurus_adult_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_kentrosaurus_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts (문서 언급: src/assets/dex/dinosaurs/README.md) | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_kentrosaurus_youth_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_maiasaura_adult_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_maiasaura_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts (문서 언급: src/assets/dex/dinosaurs/README.md) | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_maiasaura_youth_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_oviraptor_adult_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_oviraptor_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts (문서 언급: src/assets/dex/dinosaurs/README.md) | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_oviraptor_youth_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_pachy_adult_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_pachy_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts (문서 언급: src/assets/dex/dinosaurs/README.md) | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_pachy_youth_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_parasauro_adult_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_parasauro_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts (문서 언급: src/assets/dex/dinosaurs/README.md) | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_parasauro_youth_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_saurolophus_adult_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_saurolophus_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts (문서 언급: src/assets/dex/dinosaurs/README.md) | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_saurolophus_youth_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_spino_adult_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_spino_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts (문서 언급: src/assets/dex/dinosaurs/README.md) | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_spino_youth_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_stegosaurus_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts (문서 언급: src/assets/dex/dinosaurs/README.md) | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_stego_adult_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_stego_youth_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_therizino_adult_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_therizino_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts (문서 언급: src/assets/dex/dinosaurs/README.md) | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_therizino_youth_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_trex_adult_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts (문서 언급: docs/image-style-guide.md) | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_trex_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts (문서 언급: docs/image-style-guide.md, src/assets/dex/dinosaurs/README.md) | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_trex_youth_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts (문서 언급: docs/image-style-guide.md) | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_triceratops_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts (문서 언급: docs/image-style-guide.md, src/assets/dex/dinosaurs/README.md) | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_tricera_adult_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_tricera_youth_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_velociraptor_adult_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_velociraptor_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts (문서 언급: src/assets/dex/dinosaurs/README.md) | 현 위치 보존 |
| src/assets/dex/dinosaurs/dino_velociraptor_youth_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/01_adult_ichthyosaurus.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/01_adult_pachyrhinosaurus.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/01_baby_ichthyosaurus.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/01_baby_pachyrhinosaurus.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/01_youth_ichthyosaurus.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/01_youth_pachyrhinosaurus.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/02_adult_plesiosaurus.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/02_adult_troodon.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/02_baby_plesiosaurus.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/02_baby_troodon.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/02_youth_plesiosaurus.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/02_youth_troodon.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/03_adult_arctodus.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/03_adult_leedsichthys.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/03_baby_arctodus.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/03_baby_leedsichthys.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/03_youth_arctodus.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/03_youth_leedsichthys.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/04_adult_mosasaurus.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/04_adult_woolly_rhino.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/04_baby_mosasaurus.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/04_baby_woolly_rhino.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/04_youth_mosasaurus.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/04_youth_woolly_rhino.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/05_adult_megalodon.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/05_adult_yutyrannus.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/05_baby_megalodon.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/05_baby_yutyrannus.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/05_youth_megalodon.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/05_youth_yutyrannus.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/06_adult_smilodon.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/06_adult_tusoteuthis.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/06_baby_smilodon.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/06_baby_tusoteuthis.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/06_youth_smilodon.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/06_youth_tusoteuthis.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/07_adult_dunkleosteus.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/07_adult_woolly_mammoth.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/07_baby_dunkleosteus.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/07_baby_woolly_mammoth.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/07_youth_dunkleosteus.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/07_youth_woolly_mammoth.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/08_adult_abyssrano.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/08_adult_ice_legend.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/08_baby_abyssrano.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/08_baby_ice_legend.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/08_youth_abyssrano.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/08_youth_ice_legend.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs_2/index.ts | 현 위치 보존 |
| src/assets/dex/dino_upgrade/dino_crystalo_adult_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts, src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dino_upgrade/dino_crystalo_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts, src/components/DinosaurAssetReview.tsx (문서 언급: docs/image-style-guide.md) | 현 위치 보존 |
| src/assets/dex/dino_upgrade/dino_crystalo_youth_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts, src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dino_upgrade/dino_dilophosaurus_adult_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts, src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dino_upgrade/dino_dilophosaurus_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts, src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dino_upgrade/dino_dilophosaurus_youth_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts, src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dino_upgrade/dino_dimetrodon_adult_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts, src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dino_upgrade/dino_dimetrodon_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts, src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dino_upgrade/dino_dimetrodon_youth_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts, src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dino_upgrade/dino_distortus_rex_adult_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts, src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dino_upgrade/dino_distortus_rex_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts, src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dino_upgrade/dino_distortus_rex_youth_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts, src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dino_upgrade/dino_indominus_rex_adult_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts, src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dino_upgrade/dino_indominus_rex_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts, src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dino_upgrade/dino_indominus_rex_youth_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts, src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dino_upgrade/dino_leafcera_adult_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts, src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dino_upgrade/dino_leafcera_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts, src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dino_upgrade/dino_leafcera_youth_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts, src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dino_upgrade/dino_pteranodon_adult_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts, src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dino_upgrade/dino_pteranodon_character.png | 정적 경로/import/new URL 참조 — scripts/optimize-lava-assets.ps1, src/assets/dex/dinosaurs/index.ts, src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dino_upgrade/dino_pteranodon_youth_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts, src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dino_upgrade/dino_starano_adult_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts, src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dino_upgrade/dino_starano_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts, src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dino_upgrade/dino_starano_youth_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts, src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dino_upgrade/dino_volcanodon_adult_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts, src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dino_upgrade/dino_volcanodon_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts, src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dino_upgrade/dino_volcanodon_youth_character.png | 정적 경로/import/new URL 참조 — src/assets/dex/dinosaurs/index.ts, src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/eggs/egg_common.png | 정적 경로/import/new URL 참조 — src/assets/dex/index.ts, src/assets/shop/index.ts (문서 언급: src/assets/dex/eggs/README.md) | 현 위치 보존 |
| src/assets/dex/eggs/egg_rare.png | 정적 경로/import/new URL 참조 — src/assets/dex/index.ts, src/assets/shop/index.ts (문서 언급: src/assets/dex/eggs/README.md) | 현 위치 보존 |
| src/assets/dex/habitats/01_volcanic_zone.png | 정적 경로/import/new URL 참조 — src/assets/dex/index.ts | 현 위치 보존 |
| src/assets/dex/habitats/02_sky_garden.png | 정적 경로/import/new URL 참조 — src/assets/dex/index.ts | 현 위치 보존 |
| src/assets/dex/habitats/03_ancient_jungle.png | 정적 경로/import/new URL 참조 — src/assets/dex/index.ts | 현 위치 보존 |
| src/assets/dex/habitats/04_deep_sea_world.png | 정적 경로/import/new URL 참조 — src/assets/dex/index.ts | 현 위치 보존 |
| src/assets/dex/habitats/05_ice_age.png | 정적 경로/import/new URL 참조 — src/assets/dex/index.ts | 현 위치 보존 |
| src/assets/dex/habitats/habitat_cave.png | 정적 경로/import/new URL 참조 — src/assets/dex/index.ts (문서 언급: src/assets/dex/habitats/README.md) | 현 위치 보존 |
| src/assets/dex/habitats/habitat_forest.png | 정적 경로/import/new URL 참조 — src/assets/dex/index.ts (문서 언급: src/assets/dex/habitats/README.md) | 현 위치 보존 |
| src/assets/dex/habitats/habitat_secret.png | 정적 경로/import/new URL 참조 — src/assets/dex/index.ts (문서 언급: src/assets/dex/habitats/README.md) | 현 위치 보존 |
| src/assets/dex/habitats/habitat_volcano.png | 정적 경로/import/new URL 참조 — src/assets/dex/index.ts (문서 언급: src/assets/dex/habitats/README.md) | 현 위치 보존 |
| src/assets/dex/header/dex_book_icon.png | 정적 경로/import/new URL 참조 — src/assets/dex/index.ts | 현 위치 보존 |
| src/assets/dex/mascots/dex_mascot_green.png | 정적 경로/import/new URL 참조 — src/assets/dex/index.ts | 현 위치 보존 |
| src/assets/dex/ornaments/habitat_secret_badge.png | 정적 경로/import/new URL 참조 — src/assets/dex/index.ts | 현 위치 보존 |
| src/assets/dex/ornaments/ornament_cave_title.png | 정적 경로/import/new URL 참조 — src/assets/dex/index.ts | 현 위치 보존 |
| src/assets/dex/ornaments/ornament_forest_title.png | 정적 경로/import/new URL 참조 — src/assets/dex/index.ts | 현 위치 보존 |
| src/assets/dex/ornaments/ornament_volcano_title.png | 정적 경로/import/new URL 참조 — src/assets/dex/index.ts | 현 위치 보존 |
| src/assets/dex/rewards/progress_egg_icon.png | 정적 경로/import/new URL 참조 — src/assets/dex/index.ts | 현 위치 보존 |
| src/assets/dex/rewards/reward_gift_icon.png | 정적 경로/import/new URL 참조 — src/assets/dex/index.ts | 현 위치 보존 |
| src/assets/dex/silhouettes/silhouette_herbivore.png | 정적 경로/import/new URL 참조 — src/assets/dex/index.ts (문서 언급: src/assets/dex/silhouettes/README.md) | 현 위치 보존 |
| src/assets/dex/silhouettes/silhouette_longneck.png | 정적 경로/import/new URL 참조 — src/assets/dex/index.ts (문서 언급: src/assets/dex/silhouettes/README.md) | 현 위치 보존 |
| src/assets/dex/silhouettes/silhouette_trex.png | 정적 경로/import/new URL 참조 — src/assets/dex/index.ts (문서 언급: src/assets/dex/silhouettes/README.md) | 현 위치 보존 |
| src/assets/hatchery/backgrounds/hatchery_bg_common.png | 정적 경로/import/new URL 참조 — src/components/screens/HatcheryScreen.tsx | 현 위치 보존 |
| src/assets/hatchery/success-popup/hatch_success_btn_collection.png | 정적 경로/import/new URL 참조 — src/components/screens/HatcheryScreen.tsx | 현 위치 보존 |
| src/assets/hatchery/success-popup/hatch_success_btn_continue.png | 정적 경로/import/new URL 참조 — src/components/screens/HatcheryScreen.tsx | 현 위치 보존 |
| src/assets/hatchery/success-popup/hatch_success_btn_my_dinosaur.png | 정적 경로/import/new URL 참조 — src/components/screens/HatcheryScreen.tsx | 현 위치 보존 |
| src/assets/hatchery/success-popup/hatch_success_popup_panel.png | 정적 경로/import/new URL 참조 — src/components/screens/HatcheryScreen.tsx | 현 위치 보존 |
| src/assets/hatchery/ui/hatchery_progress_panel.png | 정적 경로/import/new URL 참조 — src/components/screens/HatcheryScreen.tsx | 현 위치 보존 |
| src/assets/hatchery/ui/hatch_btn_item_use.png | 정적 경로/import/new URL 참조 — src/components/screens/DinosaurRoomScreen.tsx, src/components/screens/HatcheryScreen.tsx | 현 위치 보존 |
| src/assets/hatchery/ui/hatch_btn_start.png | 정적 경로/import/new URL 참조 — src/components/screens/HatcheryScreen.tsx | 현 위치 보존 |
| src/assets/hatchery/ui/hatch_item_selected_panel.png | 정적 경로/import/new URL 참조 — src/components/screens/DinosaurRoomScreen.tsx, src/components/screens/HatcheryScreen.tsx | 현 위치 보존 |
| src/assets/home/home_bg_farm_full.png | 정적 경로/import/new URL 참조 — src/App.tsx, src/components/screens/HomeScreen.tsx (문서 언급: docs/image-style-guide.md) | 현 위치 보존 |
| src/assets/home/home_btn_dino.png | 정적 경로/import/new URL 참조 — src/components/screens/HomeScreen.tsx | 현 위치 보존 |
| src/assets/home/home_btn_setting.png | 정적 경로/import/new URL 참조 — src/components/screens/HomeScreen.tsx | 현 위치 보존 |
| src/assets/home/home_btn_shop.png | 정적 경로/import/new URL 참조 — src/components/screens/HomeScreen.tsx | 현 위치 보존 |
| src/assets/home/home_btn_sound.png | 정적 경로/import/new URL 참조 — src/components/screens/HomeScreen.tsx | 현 위치 보존 |
| src/assets/home/home_btn_train.png | 정적 경로/import/new URL 참조 — src/components/screens/HomeScreen.tsx (문서 언급: docs/image-style-guide.md) | 현 위치 보존 |
| src/assets/home/home_coin_bar.png | 정적 경로/import/new URL 참조 — src/components/screens/HomeScreen.tsx | 현 위치 보존 |
| src/assets/pet/backgrounds/pet_green_main-removebg-preview.png | 정적 경로/import/new URL 참조 — src/components/screens/DinosaurRoomScreen.tsx | 현 위치 보존 |
| src/assets/pet/mydino/dino_feed_btn_feed.png | 정적 경로/import/new URL 참조 — src/assets/pet/mydino/index.ts | 현 위치 보존 |
| src/assets/pet/mydino/dino_feed_info_panel.png | 정적 경로/import/new URL 참조 — src/assets/pet/mydino/index.ts | 현 위치 보존 |
| src/assets/pet/mydino/dino_name_panel_v2.png | 정적 경로/import/new URL 참조 — src/assets/pet/mydino/index.ts | 현 위치 보존 |
| src/assets/pet/mydino/mydino_btn_dino_list_default.png | 정적 경로/import/new URL 참조 — src/assets/pet/mydino/index.ts | 현 위치 보존 |
| src/assets/pet/mydino/mydino_btn_dino_list_pressed.png | 정적 경로/import/new URL 참조 — src/assets/pet/mydino/index.ts | 현 위치 보존 |
| src/assets/pet/mydino/mydino_btn_hatchery_default.png | 정적 경로/import/new URL 참조 — src/assets/pet/mydino/index.ts | 현 위치 보존 |
| src/assets/pet/mydino/mydino_btn_hatchery_pressed.png | 정적 경로/import/new URL 참조 — src/assets/pet/mydino/index.ts | 현 위치 보존 |
| src/assets/pet/mydino/mydino_food_bag_panel.png | 정적 경로/import/new URL 참조 — src/assets/pet/mydino/index.ts | 현 위치 보존 |
| src/assets/pet/mydino/mydino_food_slot_default.png | 정적 경로/import/new URL 참조 — src/assets/pet/mydino/index.ts | 현 위치 보존 |
| src/assets/pet/mydino/mydino_food_slot_disabled.png | 정적 경로/import/new URL 참조 — src/assets/pet/mydino/index.ts | 현 위치 보존 |
| src/assets/pet/mydino/mydino_food_slot_selected.png | 정적 경로/import/new URL 참조 — src/assets/pet/mydino/index.ts | 현 위치 보존 |
| src/assets/pet/mydino/mydino_growth_panel.png | 정적 경로/import/new URL 참조 — src/assets/pet/mydino/index.ts | 현 위치 보존 |
| src/assets/pet/mydino/mydino_name_exp_panel.png | 정적 경로/import/new URL 참조 — src/assets/pet/mydino/index.ts | 현 위치 보존 |
| src/assets/pet/mydino/mydino_title_panel.png | 정적 경로/import/new URL 참조 — src/assets/pet/mydino/index.ts | 현 위치 보존 |
| src/assets/shop/backgrounds/shop_bg.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts, src/audio/audioManager.ts (문서 언급: docs/image-style-guide.md) | 현 위치 보존 |
| src/assets/shop/buttons/shop_btn_buy_default.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts | 현 위치 보존 |
| src/assets/shop/buttons/shop_btn_buy_disabled.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts | 현 위치 보존 |
| src/assets/shop/buttons/shop_btn_buy_pressed.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts | 현 위치 보존 |
| src/assets/shop/buttons/shop_btn_my_dino.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts | 현 위치 보존 |
| src/assets/shop/categories/shop_icon_category_egg_default.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts | 현 위치 보존 |
| src/assets/shop/categories/shop_icon_category_egg_selected.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts | 현 위치 보존 |
| src/assets/shop/categories/shop_icon_category_food_default.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts | 현 위치 보존 |
| src/assets/shop/categories/shop_icon_category_food_selected.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts | 현 위치 보존 |
| src/assets/shop/categories/shop_icon_category_hatch_default.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts | 현 위치 보존 |
| src/assets/shop/categories/shop_icon_category_hatch_selected.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts | 현 위치 보존 |
| src/assets/shop/items/eggs/egg_common.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts, src/assets/dex/index.ts (문서 언급: src/assets/dex/eggs/README.md) | 현 위치 보존 |
| src/assets/shop/items/eggs/egg_legendary.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts | 현 위치 보존 |
| src/assets/shop/items/eggs/egg_rare.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts, src/assets/dex/index.ts (문서 언급: src/assets/dex/eggs/README.md) | 현 위치 보존 |
| src/assets/shop/items/eggs/egg_special.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts (문서 언급: src/assets/dex/eggs/README.md) | 현 위치 보존 |
| src/assets/shop/items/eggs/old/shop_item_egg_forest_rare.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts | 현 위치 보존 |
| src/assets/shop/items/eggs/old/shop_item_egg_legendary.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts | 현 위치 보존 |
| src/assets/shop/items/eggs/old/shop_item_egg_ocean.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts | 현 위치 보존 |
| src/assets/shop/items/eggs/old/shop_item_egg_volcano_rare.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts | 현 위치 보존 |
| src/assets/shop/items/food/shop_item_food_dino_cookie.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts | 현 위치 보존 |
| src/assets/shop/items/food/shop_item_food_fish.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts | 현 위치 보존 |
| src/assets/shop/items/food/shop_item_food_fruit_basket.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts | 현 위치 보존 |
| src/assets/shop/items/food/shop_item_food_leaf.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts | 현 위치 보존 |
| src/assets/shop/items/food/shop_item_food_meat.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts | 현 위치 보존 |
| src/assets/shop/items/food/shop_item_food_soft_berry.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts | 현 위치 보존 |
| src/assets/shop/items/food/shop_item_food_sweet_berry.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts | 현 위치 보존 |
| src/assets/shop/items/food/shop_item_food_tough_meat.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts | 현 위치 보존 |
| src/assets/shop/items/hatch/shop_item_hatch_rare_fragment.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts | 현 위치 보존 |
| src/assets/shop/items/hatch/shop_item_hatch_sparkle_energy.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts | 현 위치 보존 |
| src/assets/shop/items/hatch/shop_item_hatch_warm_blanket.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts | 현 위치 보존 |
| src/assets/shop/items/hatch/shop_item_hatch_warm_stone.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts | 현 위치 보존 |
| src/assets/shop/panels/shop_item_card.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts | 현 위치 보존 |
| src/assets/shop/panels/shop_price_chip.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts | 현 위치 보존 |
| src/assets/shop/panels/shop_status_chip.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts | 현 위치 보존 |
| src/assets/shop/panels/shop_title_banner.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts | 현 위치 보존 |
| src/assets/shop/popup/shop_popup_btn_buy.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts | 현 위치 보존 |
| src/assets/shop/popup/shop_popup_btn_exit.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts | 현 위치 보존 |
| src/assets/shop/popup/shop_popup_effect_panel.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts | 현 위치 보존 |
| src/assets/shop/popup/shop_popup_owned_panel.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts | 현 위치 보존 |
| src/assets/shop/popup/shop_popup_panel.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts | 현 위치 보존 |
| src/assets/shop/popup/shop_popup_price_panel.png | 정적 경로/import/new URL 참조 — src/assets/shop/index.ts | 현 위치 보존 |
| src/assets/training/backgrounds/training_bg.png | 정적 경로/import/new URL 참조 — src/assets/training/index.ts | 현 위치 보존 |
| src/assets/training/buttons/training_key_default.png | 정적 경로/import/new URL 참조 — src/assets/training/index.ts | 현 위치 보존 |
| src/assets/training/buttons/training_key_delete.png | 정적 경로/import/new URL 참조 — src/assets/training/index.ts | 현 위치 보존 |
| src/assets/training/buttons/training_key_pressed.png | 정적 경로/import/new URL 참조 — src/assets/training/index.ts | 현 위치 보존 |
| src/assets/training/buttons/training_key_submit.png | 정적 경로/import/new URL 참조 — src/assets/training/index.ts | 현 위치 보존 |
| src/assets/training/characters/training_dino_cheer.png | 정적 경로/import/new URL 참조 — src/assets/training/index.ts | 현 위치 보존 |
| src/assets/training/completion/buttons/training_complete_btn_feed.png | 정적 경로/import/new URL 참조 — src/assets/training/index.ts | 현 위치 보존 |
| src/assets/training/completion/buttons/training_complete_btn_retry.png | 정적 경로/import/new URL 참조 — src/assets/training/index.ts | 현 위치 보존 |
| src/assets/training/completion/panels/training_complete_popup_panel.png | 정적 경로/import/new URL 참조 — src/assets/training/index.ts | 현 위치 보존 |
| src/assets/training/completion/panels/training_complete_title_badge.png | 정적 경로/import/new URL 참조 — src/assets/training/index.ts | 현 위치 보존 |
| src/assets/training/panels/training_answer_panel.png | 정적 경로/import/new URL 참조 — src/assets/training/index.ts | 현 위치 보존 |
| src/assets/training/panels/training_keypad_panel.png | 정적 경로/import/new URL 참조 — src/assets/training/index.ts | 현 위치 보존 |
| src/assets/training/panels/training_problem_board.png | 정적 경로/import/new URL 참조 — src/assets/training/index.ts | 현 위치 보존 |
| src/assets/training/status/training_status_correct_banner.png | 정적 경로/import/new URL 참조 — src/assets/training/index.ts | 현 위치 보존 |
| src/assets/training/status/training_status_wrong_banner.png | 정적 경로/import/new URL 참조 — src/assets/training/index.ts | 현 위치 보존 |
| src/assets/ui/bottom-nav/nav_dinopedia_default.png | 정적 경로/import/new URL 참조 — src/assets/ui/bottom-nav/index.ts | 현 위치 보존 |
| src/assets/ui/bottom-nav/nav_dinopedia_selected.png | 정적 경로/import/new URL 참조 — src/assets/ui/bottom-nav/index.ts | 현 위치 보존 |
| src/assets/ui/bottom-nav/nav_my_dinosaur_default.png | 정적 경로/import/new URL 참조 — src/assets/ui/bottom-nav/index.ts | 현 위치 보존 |
| src/assets/ui/bottom-nav/nav_my_dinosaur_selected.png | 정적 경로/import/new URL 참조 — src/assets/ui/bottom-nav/index.ts | 현 위치 보존 |
| src/assets/ui/bottom-nav/nav_settings_default.png | 정적 경로/import/new URL 참조 — src/assets/ui/bottom-nav/index.ts | 현 위치 보존 |
| src/assets/ui/bottom-nav/nav_settings_selected.png | 정적 경로/import/new URL 참조 — src/assets/ui/bottom-nav/index.ts | 현 위치 보존 |
| src/assets/ui/bottom-nav/nav_shop_default.png | 정적 경로/import/new URL 참조 — src/assets/ui/bottom-nav/index.ts | 현 위치 보존 |
| src/assets/ui/bottom-nav/nav_shop_selected.png | 정적 경로/import/new URL 참조 — src/assets/ui/bottom-nav/index.ts | 현 위치 보존 |
| src/assets/ui/bottom-nav/nav_training_default.png | 정적 경로/import/new URL 참조 — src/assets/ui/bottom-nav/index.ts | 현 위치 보존 |
| src/assets/ui/bottom-nav/nav_training_selected.png | 정적 경로/import/new URL 참조 — src/assets/ui/bottom-nav/index.ts | 현 위치 보존 |
| src/assets/ui/navigation/nav_arrow_next.png | 정적 경로/import/new URL 참조 — src/components/NavigationArrow.tsx | 현 위치 보존 |
| src/assets/ui/navigation/nav_arrow_previous.png | 정적 경로/import/new URL 참조 — src/components/NavigationArrow.tsx | 현 위치 보존 |
| src/assets/ui/training/badge_correct.png | 정적 경로/import/new URL 참조 — src/assets/ui/training/index.ts | 현 위치 보존 |
| src/assets/ui/training/badge_problem_progress.png | 정적 경로/import/new URL 참조 — src/assets/ui/training/index.ts | 현 위치 보존 |
| src/assets/ui/training/badge_wrong.png | 정적 경로/import/new URL 참조 — src/assets/ui/training/index.ts | 현 위치 보존 |
| src/assets/ui/training/bluetooth_wait_icon.png | 정적 경로/import/new URL 참조 — src/assets/ui/training/index.ts | 현 위치 보존 |
| src/assets/ui/training/corner_leaf_bottom_left.png | 정적 경로/import/new URL 참조 — src/assets/ui/training/index.ts | 현 위치 보존 |
| src/assets/ui/training/dino_footprints_small.png | 정적 경로/import/new URL 참조 — src/assets/ui/training/index.ts | 현 위치 보존 |
| src/assets/ui/training/hint_lamp_icon.png | 정적 경로/import/new URL 참조 — src/assets/ui/training/index.ts | 현 위치 보존 |
| src/assets/ui/training/reward_coin_icon.png | 정적 경로/import/new URL 참조 — src/assets/ui/training/index.ts (문서 언급: docs/image-style-guide.md) | 현 위치 보존 |
| src/assets/ui/training/reward_egg_icon.png | 정적 경로/import/new URL 참조 — src/assets/ui/training/index.ts | 현 위치 보존 |
| src/assets/ui/training/reward_item_pebble_icon.png | 정적 경로/import/new URL 참조 — src/assets/ui/training/index.ts | 현 위치 보존 |
| src/assets/ui/training/speechbubble_cheer_01.png | 정적 경로/import/new URL 참조 — src/assets/ui/training/index.ts | 현 위치 보존 |
| src/assets/ui/training/training_title_banner.png | 정적 경로/import/new URL 참조 — src/assets/ui/training/index.ts | 현 위치 보존 |

## LIKELY_UNUSED 전체 파일 목록

| 파일 | 근거/참조 | 조치 |
| --- | --- | --- |
| src/assets/dex/collection/collection_bg_crystal_cave.png | 이전 동굴 지역 배경; 현재 5지역 background 매핑에서 제외 | archive 이동 완료 |
| src/assets/dex/collection/collection_bg_green_forest.png | 이전 숲 지역 배경; 현재 5지역 background 매핑에서 제외 | archive 이동 완료 |
| src/assets/dex/collection/collection_bg_secret_land.png | 이전 비밀 지역 배경; 현재 5지역 background 매핑에서 제외 | archive 이동 완료 |
| src/assets/dex/habitats/abitat_volcano_badge.png | 이번에 교체한 이전 도감 탭 배지 | archive 이동 완료 |
| src/assets/dex/habitats/habitat_cave_badge.png | 이번에 교체한 이전 도감 탭 배지 | archive 이동 완료 |
| src/assets/dex/habitats/habitat_forest_badge.png | 이번에 교체한 이전 도감 탭 배지 | archive 이동 완료 |
| src/assets/dex/habitats/habitat_secret_badge.png | 이번에 교체한 이전 도감 탭 배지; ornaments/의 동명 파일은 별개이며 보존 — src/assets/dex/index.ts | archive 이동 완료 |

## DUPLICATE_OR_OLD 전체 파일 목록

| 파일 | 근거/참조 | 조치 |
| --- | --- | --- |
| src/assets/shop/buttons/shop_btn_buy_disabled.original.png | 참조 없는 original 원본; 현재 버튼은 접미사 없는 파일 import | archive 이동 완료 |
| src/assets/shop/buttons/shop_btn_my_dino.chromakey.png | 참조 없는 chromakey 원본; 현재 버튼은 접미사 없는 파일 import | archive 이동 완료 |
| src/assets/shop/items/eggs/old/shop_item_egg_green.png | old 일반알 이미지; 현재 일반알 이미지와 카탈로그 연결 확인 | archive 이동 완료 |
| src/assets/shop/items/eggs/old/shop_item_egg_sparkle.png | old 특수알 이미지; 현재 특수알 이미지와 카탈로그 연결 확인 | archive 이동 완료 |

## REVIEW_REQUIRED 전체 파일 목록

| 파일 | 근거/참조 | 조치 |
| --- | --- | --- |
| src/assets/adventure/common/index.ts | 코드 인덱스 모듈: 에셋 삭제 대상 아님, 현 경로 보존 (문서 언급: docs/balance-config.md, docs/current-analysis.md, docs/data-model.md, docs/image-style-guide.md, docs/mobile-game-performance.md, docs/mockup-review.md) | 현 위치 보존 |
| src/assets/adventure/index.ts | 코드 인덱스 모듈: 에셋 삭제 대상 아님, 현 경로 보존 (문서 언급: docs/balance-config.md, docs/current-analysis.md, docs/data-model.md, docs/image-style-guide.md, docs/mobile-game-performance.md, docs/mockup-review.md) | 현 위치 보존 |
| src/assets/adventure/lava-valley/background/adventure_map_bg.png | 참조 없음; 대체본/폐기 의도 확정 불가 | 현 위치 보존 |
| src/assets/adventure/lava-valley/collectibles/dino_coin.png | glob 또는 파일명/부분 문자열 참조: 자동 이동 금지 — scripts/optimize-lava-assets.ps1, src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/collectibles/meat_food_item.png | glob 또는 파일명/부분 문자열 참조: 자동 이동 금지 — scripts/optimize-lava-assets.ps1, src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/collectibles/rare_egg_shard.png | glob 또는 파일명/부분 문자열 참조: 자동 이동 금지 — scripts/optimize-lava-assets.ps1, src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/index.ts | 코드 인덱스 모듈: 에셋 삭제 대상 아님, 현 경로 보존 (문서 언급: docs/balance-config.md, docs/current-analysis.md, docs/data-model.md, docs/image-style-guide.md, docs/mobile-game-performance.md, docs/mockup-review.md) | 현 위치 보존 |
| src/assets/adventure/lava-valley/player/carnotaurus_fall.png | glob 또는 파일명/부분 문자열 참조: 자동 이동 금지 — scripts/optimize-lava-assets.ps1, src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/player/carnotaurus_hurt.png | glob 또는 파일명/부분 문자열 참조: 자동 이동 금지 — scripts/optimize-lava-assets.ps1, src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/player/carnotaurus_idle.png | glob 또는 파일명/부분 문자열 참조: 자동 이동 금지 — scripts/optimize-lava-assets.ps1, src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/player/carnotaurus_jump_up.png | glob 또는 파일명/부분 문자열 참조: 자동 이동 금지 — scripts/optimize-lava-assets.ps1, src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/player/carnotaurus_run_1.png | scripts/optimize-lava-assets.ps1에서 frame 값으로 파일명을 조합하는 sprite sheet 입력 원본 — scripts/optimize-lava-assets.ps1 | 현 위치 보존 |
| src/assets/adventure/lava-valley/player/carnotaurus_run_2.png | scripts/optimize-lava-assets.ps1에서 frame 값으로 파일명을 조합하는 sprite sheet 입력 원본 — scripts/optimize-lava-assets.ps1 | 현 위치 보존 |
| src/assets/adventure/lava-valley/player/carnotaurus_run_3.png | scripts/optimize-lava-assets.ps1에서 frame 값으로 파일명을 조합하는 sprite sheet 입력 원본 — scripts/optimize-lava-assets.ps1 | 현 위치 보존 |
| src/assets/adventure/lava-valley/player/carnotaurus_run_4.png | scripts/optimize-lava-assets.ps1에서 frame 값으로 파일명을 조합하는 sprite sheet 입력 원본 — scripts/optimize-lava-assets.ps1 | 현 위치 보존 |
| src/assets/adventure/lava-valley/player/carnotaurus_victory.png | glob 또는 파일명/부분 문자열 참조: 자동 이동 금지 — scripts/optimize-lava-assets.ps1, src/assets/adventure/lava-valley/index.ts | 현 위치 보존 |
| src/assets/adventure/lava-valley/ui/events/level_intro_panel.png | 참조 없음; 대체본/폐기 의도 확정 불가 | 현 위치 보존 |
| src/assets/adventure/sky-island/index.ts | 코드 인덱스 모듈: 에셋 삭제 대상 아님, 현 경로 보존 (문서 언급: docs/balance-config.md, docs/current-analysis.md, docs/data-model.md, docs/image-style-guide.md, docs/mobile-game-performance.md, docs/mockup-review.md) | 현 위치 보존 |
| src/assets/adventure/sky-island/ui/events/level_intro_panel_sky.png | 참조 없음; 대체본/폐기 의도 확정 불가 | 현 위치 보존 |
| src/assets/dex/dinosaurs/index.ts | 코드 인덱스 모듈: 에셋 삭제 대상 아님, 현 경로 보존 (문서 언급: docs/balance-config.md, docs/current-analysis.md, docs/data-model.md, docs/image-style-guide.md, docs/mobile-game-performance.md, docs/mockup-review.md) | 현 위치 보존 |
| src/assets/dex/dinosaurs/README.md | 에셋 인덱스/문서/폴더 유지 파일 (문서 언급: docs/image-style-guide.md, _asset_pipeline/README.md) | 현 위치 보존 |
| src/assets/dex/dinosaurs_1/dino_crystalo_adult_character-removebg-preview.png | glob 또는 파일명/부분 문자열 참조: 자동 이동 금지 — src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dinosaurs_1/dino_crystalo_character-removebg-preview.png | glob 또는 파일명/부분 문자열 참조: 자동 이동 금지 — src/components/DinosaurAssetReview.tsx (문서 언급: docs/image-style-guide.md) | 현 위치 보존 |
| src/assets/dex/dinosaurs_1/dino_crystalo_youth_character-removebg-preview.png | glob 또는 파일명/부분 문자열 참조: 자동 이동 금지 — src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dinosaurs_1/dino_dilophosaurus_adult_character-removebg-preview.png | glob 또는 파일명/부분 문자열 참조: 자동 이동 금지 — src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dinosaurs_1/dino_dilophosaurus_character-removebg-preview.png | glob 또는 파일명/부분 문자열 참조: 자동 이동 금지 — src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dinosaurs_1/dino_dilophosaurus_youth_character-removebg-preview.png | glob 또는 파일명/부분 문자열 참조: 자동 이동 금지 — src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dinosaurs_1/dino_dimetrodon_adult_character-removebg-preview.png | glob 또는 파일명/부분 문자열 참조: 자동 이동 금지 — src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dinosaurs_1/dino_dimetrodon_character-removebg-preview.png | glob 또는 파일명/부분 문자열 참조: 자동 이동 금지 — src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dinosaurs_1/dino_dimetrodon_youth_character-removebg-preview.png | glob 또는 파일명/부분 문자열 참조: 자동 이동 금지 — src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dinosaurs_1/dino_distortus_rex_adult_character-removebg-preview.png | glob 또는 파일명/부분 문자열 참조: 자동 이동 금지 — src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dinosaurs_1/dino_distortus_rex_character-removebg-preview.png | glob 또는 파일명/부분 문자열 참조: 자동 이동 금지 — src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dinosaurs_1/dino_distortus_rex_youth_character-removebg-preview.png | glob 또는 파일명/부분 문자열 참조: 자동 이동 금지 — src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dinosaurs_1/dino_indominus_rex_adult_character-removebg-preview.png | glob 또는 파일명/부분 문자열 참조: 자동 이동 금지 — src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dinosaurs_1/dino_indominus_rex_character-removebg-preview.png | glob 또는 파일명/부분 문자열 참조: 자동 이동 금지 — src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dinosaurs_1/dino_indominus_rex_youth_character-removebg-preview.png | glob 또는 파일명/부분 문자열 참조: 자동 이동 금지 — src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dinosaurs_1/dino_leafcera_adult_character-removebg-preview.png | glob 또는 파일명/부분 문자열 참조: 자동 이동 금지 — src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dinosaurs_1/dino_leafcera_character-removebg-preview.png | glob 또는 파일명/부분 문자열 참조: 자동 이동 금지 — src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dinosaurs_1/dino_leafcera_youth_character-removebg-preview.png | glob 또는 파일명/부분 문자열 참조: 자동 이동 금지 — src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dinosaurs_1/dino_pteranodon_adult_character-removebg-preview.png | glob 또는 파일명/부분 문자열 참조: 자동 이동 금지 — src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dinosaurs_1/dino_pteranodon_character-removebg-preview.png | glob 또는 파일명/부분 문자열 참조: 자동 이동 금지 — src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dinosaurs_1/dino_pteranodon_youth_character-removebg-preview.png | glob 또는 파일명/부분 문자열 참조: 자동 이동 금지 — src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dinosaurs_1/dino_starano_adult_character-removebg-preview.png | glob 또는 파일명/부분 문자열 참조: 자동 이동 금지 — src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dinosaurs_1/dino_starano_character-removebg-preview.png | glob 또는 파일명/부분 문자열 참조: 자동 이동 금지 — src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dinosaurs_1/dino_starano_youth_character-removebg-preview.png | glob 또는 파일명/부분 문자열 참조: 자동 이동 금지 — src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dinosaurs_1/dino_volcanodon_adult_character-removebg-preview.png | glob 또는 파일명/부분 문자열 참조: 자동 이동 금지 — src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dinosaurs_1/dino_volcanodon_character-removebg-preview.png | glob 또는 파일명/부분 문자열 참조: 자동 이동 금지 — src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dinosaurs_1/dino_volcanodon_youth_character-removebg-preview.png | glob 또는 파일명/부분 문자열 참조: 자동 이동 금지 — src/components/DinosaurAssetReview.tsx | 현 위치 보존 |
| src/assets/dex/dinosaurs_2/index.ts | 코드 인덱스 모듈: 에셋 삭제 대상 아님, 현 경로 보존 (문서 언급: docs/balance-config.md, docs/current-analysis.md, docs/data-model.md, docs/image-style-guide.md, docs/mobile-game-performance.md, docs/mockup-review.md) | 현 위치 보존 |
| src/assets/dex/eggs/README.md | 에셋 인덱스/문서/폴더 유지 파일 (문서 언급: docs/image-style-guide.md, _asset_pipeline/README.md) | 현 위치 보존 |
| src/assets/dex/habitats/README.md | 에셋 인덱스/문서/폴더 유지 파일 (문서 언급: docs/image-style-guide.md, _asset_pipeline/README.md) | 현 위치 보존 |
| src/assets/dex/index.ts | 코드 인덱스 모듈: 에셋 삭제 대상 아님, 현 경로 보존 (문서 언급: docs/balance-config.md, docs/current-analysis.md, docs/data-model.md, docs/image-style-guide.md, docs/mobile-game-performance.md, docs/mockup-review.md) | 현 위치 보존 |
| src/assets/dex/README.md | 에셋 인덱스/문서/폴더 유지 파일 (문서 언급: docs/image-style-guide.md, _asset_pipeline/README.md) | 현 위치 보존 |
| src/assets/dex/silhouettes/README.md | 에셋 인덱스/문서/폴더 유지 파일 (문서 언급: docs/image-style-guide.md, _asset_pipeline/README.md) | 현 위치 보존 |
| src/assets/pet/backgrounds/bg_pet_home_forest.png | 참조 없음; 대체본/폐기 의도 확정 불가 | 현 위치 보존 |
| src/assets/pet/characters/pet_green_main.png | glob 또는 파일명/부분 문자열 참조: 자동 이동 금지 — src/components/screens/DinosaurRoomScreen.tsx | 현 위치 보존 |
| src/assets/pet/mydino/index.ts | 코드 인덱스 모듈: 에셋 삭제 대상 아님, 현 경로 보존 (문서 언급: docs/balance-config.md, docs/current-analysis.md, docs/data-model.md, docs/image-style-guide.md, docs/mobile-game-performance.md, docs/mockup-review.md) | 현 위치 보존 |
| src/assets/pet/mydino/mydino_btn_feed_default.png | 참조 없음; 대체본/폐기 의도 확정 불가 | 현 위치 보존 |
| src/assets/pet/mydino/mydino_btn_feed_disabled.png | 참조 없음; 대체본/폐기 의도 확정 불가 | 현 위치 보존 |
| src/assets/pet/mydino/mydino_btn_feed_pressed.png | 참조 없음; 대체본/폐기 의도 확정 불가 | 현 위치 보존 |
| src/assets/pet/mydino/mydino_owned_food_panel.png | 참조 없음; 대체본/폐기 의도 확정 불가 | 현 위치 보존 |
| src/assets/pet/panels/panel_pet_nameplate-removebg-preview.png | 참조 없음; 대체본/폐기 의도 확정 불가 | 현 위치 보존 |
| src/assets/pet/panels/panel_pet_nameplate.png | 참조 없음; 대체본/폐기 의도 확정 불가 | 현 위치 보존 |
| src/assets/pet/panels/panel_pet_status-removebg-preview.png | 참조 없음; 대체본/폐기 의도 확정 불가 | 현 위치 보존 |
| src/assets/pet/panels/panel_pet_status.png | 참조 없음; 대체본/폐기 의도 확정 불가 | 현 위치 보존 |
| src/assets/shop/backgrounds/.gitkeep | 에셋 인덱스/문서/폴더 유지 파일 (문서 언급: _asset_pipeline/README.md) | 현 위치 보존 |
| src/assets/shop/buttons/.gitkeep | 에셋 인덱스/문서/폴더 유지 파일 (문서 언급: _asset_pipeline/README.md) | 현 위치 보존 |
| src/assets/shop/categories/.gitkeep | 에셋 인덱스/문서/폴더 유지 파일 (문서 언급: _asset_pipeline/README.md) | 현 위치 보존 |
| src/assets/shop/index.ts | 코드 인덱스 모듈: 에셋 삭제 대상 아님, 현 경로 보존 (문서 언급: docs/balance-config.md, docs/current-analysis.md, docs/data-model.md, docs/image-style-guide.md, docs/mobile-game-performance.md, docs/mockup-review.md) | 현 위치 보존 |
| src/assets/shop/items/eggs/.gitkeep | 에셋 인덱스/문서/폴더 유지 파일 (문서 언급: _asset_pipeline/README.md) | 현 위치 보존 |
| src/assets/shop/items/food/.gitkeep | 에셋 인덱스/문서/폴더 유지 파일 (문서 언급: _asset_pipeline/README.md) | 현 위치 보존 |
| src/assets/shop/items/hatch/.gitkeep | 에셋 인덱스/문서/폴더 유지 파일 (문서 언급: _asset_pipeline/README.md) | 현 위치 보존 |
| src/assets/shop/panels/.gitkeep | 에셋 인덱스/문서/폴더 유지 파일 (문서 언급: _asset_pipeline/README.md) | 현 위치 보존 |
| src/assets/training/backgrounds/.gitkeep | 에셋 인덱스/문서/폴더 유지 파일 (문서 언급: _asset_pipeline/README.md) | 현 위치 보존 |
| src/assets/training/buttons/.gitkeep | 에셋 인덱스/문서/폴더 유지 파일 (문서 언급: _asset_pipeline/README.md) | 현 위치 보존 |
| src/assets/training/characters/.gitkeep | 에셋 인덱스/문서/폴더 유지 파일 (문서 언급: _asset_pipeline/README.md) | 현 위치 보존 |
| src/assets/training/index.ts | 코드 인덱스 모듈: 에셋 삭제 대상 아님, 현 경로 보존 (문서 언급: docs/balance-config.md, docs/current-analysis.md, docs/data-model.md, docs/image-style-guide.md, docs/mobile-game-performance.md, docs/mockup-review.md) | 현 위치 보존 |
| src/assets/training/panels/.gitkeep | 에셋 인덱스/문서/폴더 유지 파일 (문서 언급: _asset_pipeline/README.md) | 현 위치 보존 |
| src/assets/training/status/.gitkeep | 에셋 인덱스/문서/폴더 유지 파일 (문서 언급: _asset_pipeline/README.md) | 현 위치 보존 |
| src/assets/training/training_bg_dino_yard.png | 참조 없음; 대체본/폐기 의도 확정 불가 | 현 위치 보존 |
| src/assets/ui/bottom-nav/index.ts | 코드 인덱스 모듈: 에셋 삭제 대상 아님, 현 경로 보존 (문서 언급: docs/balance-config.md, docs/current-analysis.md, docs/data-model.md, docs/image-style-guide.md, docs/mobile-game-performance.md, docs/mockup-review.md) | 현 위치 보존 |
| src/assets/ui/training/index.ts | 코드 인덱스 모듈: 에셋 삭제 대상 아님, 현 경로 보존 (문서 언급: docs/balance-config.md, docs/current-analysis.md, docs/data-model.md, docs/image-style-guide.md, docs/mobile-game-performance.md, docs/mockup-review.md) | 현 위치 보존 |
| src/assets/ui/training/speechbubble_cheer_02.png | glob 또는 파일명/부분 문자열 참조: 자동 이동 금지 — src/assets/ui/training/index.ts | 현 위치 보존 |

## 정리 후 권장 구조

활성 파일의 대규모 이동은 하지 않는다. 신규 에셋에 아래 규칙을 적용하고 dinosaurs_1/_2/dino_upgrade 통합은 별도 작업으로 수행하는 것이 안전하다.

~~~text
src/assets/
  dex/
    dinosaurs/        # species별 성장 이미지와 명시적 index
    eggs/
    habitats/         # 도감 탭 이미지
    collection/       # 도감/공룡방 배경
    silhouettes/
  adventure/
    common/
    lava-valley/
    sky-island/
    # 신규 지역 구현 시에만 폴더 추가
  shop/
  hatchery/
  pet/
  home/
  training/
  ui/
  audio/
  _archive_unused/    # 원래 상대 경로 유지
    dex/
    shop/
~~~

검수 원본의 향후 이동은 DinosaurAssetReview glob 및 최적화 스크립트를 함께 수정하는 별도 작업으로 진행한다. 포괄적인 src/assets/**/*.png glob은 archive까지 포함하므로 추가하지 않는다.

## 실행 및 검증 기록

보고서를 먼저 작성한 뒤 확정 목록 11개만 이동 완료했다. 영구 삭제는 수행하지 않았다.

- 최종 분류: ACTIVE 407개, LIKELY_UNUSED 7개, DUPLICATE_OR_OLD 4개, REVIEW_REQUIRED 83개(인덱스/문서/.gitkeep 포함).
- archive 11개는 이동 전후 SHA-256 일치. 조사한 에셋 501개 전부 원래 위치 또는 archive 위치에서 내용 동일 확인.
- src/data, src/utils, src/config 39개 파일의 SHA-256이 작업 중 보존된 기준과 동일. 공룡 DB/알/해금/진행률 변경 없음.
- npm.cmd test: 35개 통과.
- npm.cmd run lint: TypeScript 오류 없음.
- npm.cmd run build: 성공. missing asset/import 오류 없음. 기존 500 kB 초과 번들 경고는 남음.
- localhost 브라우저에서 상단 5개 이미지 모두 complete=true, naturalWidth=1448 확인. 실제 스크린샷에서 5개 새 이미지 표시 확인.
- 도감 화면의 좁은 탭에서는 기존 가로 배치가 이름을 잘랐다. DexScreen.tsx의 탭 내부만 세로 배치로 바꾸고 글자 크기를 조정해 5개 이름을 모두 표시했다. 잠금 상태/선택 상태/진행률 계산은 유지했다.
- 탭 전환 후 화산지대/고공정원/고대밀림/심해세계/빙하기 제목과 지역별 8개 카드 확인. 해당 화면 깨진 이미지 0개 확인.
- 모험 화면에서 용암계곡 / 하늘섬 / 오래된 유적지 / 심해협곡 / 얼음대륙 원래 명칭 확인.
- 이번 작업에서 수정한 코드: src/assets/dex/index.ts, src/components/screens/DexScreen.tsx. 새 문서: docs/assets-cleanup-report.md. 새 habitat 원본 5개는 그대로 사용한다.
- 기존 미커밋 공룡 16종/힌트 수정은 보존했다. 커밋, push는 수행하지 않았다.