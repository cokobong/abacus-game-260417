# World Map & Gate Asset Integration — 2026-09-11

## Inbox 조사

PNG 13개를 확인했다.

| 그룹 | 수량 | 크기 | 투명 배경 | 처리 |
|---|---:|---|---|---|
| Adventure world map | 1 | 941×1672 | 없음 | 신규 지도 배경 적용 |
| World gate transparent | 4 | 1254×1254~1448×1086 | 있음 | 3개 적용, 1개 archive |
| Adventure world gate UI repack | 8 | 1086×1448~2172×724 | 있음 | archive |

신규 지도는 상단 중앙 세계의 문, 좌상단 용암계곡, 우상단 하늘섬, 중앙 오래된 유적지, 좌하단 심해협곡, 우하단 얼음대륙 구조다.

## 경로

| 용도 | 기존/원본 | 최종 경로 |
|---|---|---|
| 월드맵 | `src/assets/adventure/common/map/adventure_world_map.png` | 같은 import 경로에 신규 `adventure world map.png` 적용 |
| 닫힌 세계의 문 | inbox `02_world_gate_jungle_ruins_closed.png` | `src/assets/adventure/world-map/world-gate/world_gate_closed.png` |
| 열린 세계의 문 | inbox `04_world_gate_grand_portal_temple.png` | `src/assets/adventure/world-map/world-gate/world_gate_open.png` |
| 팝업 유물 패널 | inbox `01_world_gate_relic_panel.png` | `src/assets/adventure/world-map/popup/world_gate_relic_panel.png` |

에셋 import는 `src/assets/adventure/world-map/index.ts`에서 관리한다.

## UI 적용

- 모험 홈 배경을 신규 세로형 지도 이미지로 교체했다.
- hotspot은 이미지 기준 percent 좌표로 재배치했다.
- 세계의 문은 지도 상단 오브젝트 위에 닫힘/열림 상태 이미지와 작은 `x/5` overlay로 표시한다.
- 기존 클릭 동작을 유지하고 신규 유물 패널과 대형 게이트 이미지를 사용하는 팝업을 연다.
- 팝업은 지역별 완료 상태, `유물 x/5`, 안내 문구를 표시하며 5/5 전에는 버튼이 비활성화된다.
- 하단 `지역 지도 / 유물 보관소` 전환 UI와 기존 relic progression 로직은 변경하지 않았다.

## Hotspot 좌표

| 대상 | left | top |
|---|---:|---:|
| 세계의 문 | 50% | 5.5% |
| 용암계곡 | 25% | 29% |
| 하늘섬 | 76% | 30% |
| 오래된 유적지 | 51% | 51% |
| 심해협곡 | 25% | 72% |
| 얼음대륙 | 76% | 73% |

## Archive 및 미사용

기존 지도는 `src/assets/_archive_unused/world-gate/adventure_world_map_old.png`로 이동했다.

다음 신규 시안은 기존 지역 modal과 하단 전환 UI를 불필요하게 재설계하므로 `src/assets/_archive_unused/world-gate/`에 보관했다.

- `world_gate_magic_portal_ruins_unused.png`
- `repack_01_world_map_portal_ui_frame.png`
- `repack_02_floating_island_ui_frame.png`
- `repack_03_locked_floating_island_level_card.png`
- `repack_04_coming_soon_portal_island.png`
- `repack_05_dex_progress_bar.png`
- `repack_06_relic_progress_bar.png`
- `repack_07_enter_adventure_button.png`
- `repack_08_locked_and_coming_soon_badge.png`

구형 Galaxy Tab을 고려해 지도와 게이트 이미지는 `object-fit: contain` 및 제한된 표시 크기를 사용한다. 지속 glow, blur, 무한 애니메이션은 추가하지 않았다.
