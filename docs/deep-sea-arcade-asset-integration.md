# 심해협곡 에셋 반영 기록

`_asset_pipeline/inbox/deepsea_*.png` 43개를 `src/assets/adventure/deep-sea/`로 **이동**했다. 원본 inbox에는 심해 에셋이 남아 있지 않다. 이전 탐험형 게임 코드와 기존 지역 유물 완성 이미지는 유지했다. Phaser는 [중앙 레지스트리](../src/config/deepSea/arcadeAssets.ts)의 URL을 Stage별 `preload()`에서 불러온다. 충돌·길찾기는 기존 타일 격자를 사용한다.

| 폴더 | 파일 수 | 적용 |
| --- | ---: | --- |
| `player/` | 4 | 정상·파손·위험·전기 강화 텍스처 교체 |
| `enemies/` | 3 | 상어·문어·해파리 이미지. 도주 색은 tint, 기절/복귀는 기존 표시 |
| `world/` | 7 | 벽 경계 이미지와 비충돌 장식 바위·유적·해초·산호·난파선. 바닥 타일은 반복 렌더링 제외 |
| `gates/` | 3 | Stage 3 수문 OPEN/WARNING/CLOSED 텍스처 교체 |
| `exits/` | 2 | 잠김/활성 상태 텍스처 교체 |
| `pickups/` | 2 | 코인·전기 구슬 이미지 |
| `treasures/` | 6 | 아래 ID 매핑. 판당 기존 3개 수집 규칙 유지 |
| `ui/` | 10 | HUD 4종, 미니맵 3종, 튜토리얼·목표·결과 패널 |
| `backgrounds/` | 3 | Stage 1/2/3의 시각 배경. 격자 판정과 무관 |
| `effects/` | 3 | 파일 정리만 완료. 아래 이유로 렌더링 보류 |

총 **43개 이동, 39개 화면 적용, 4개 렌더링 보류**. 원본 1254px급 이미지가 많으므로 Phaser에서는 타일 크기 56px 기준으로 표시한다. GPU 메모리와 표시 크기는 구형 iPad 실기기에서 확인해야 한다.

## 실제 보물 매핑

| 게임 ID | 이름 | 새 이미지 |
| --- | --- | --- |
| `compass` | 오래된 나침반 | `deepsea_treasure_map.png` — 탐색 도구로 재사용 |
| `gold-jar` | 금빛 항아리 | `deepsea_treasure_vase.png` |
| `broken-crown` | 부서진 왕관 | `deepsea_treasure_crown.png` |
| `blue-jewel-box` | 파란 보석 상자 | `deepsea_treasure_relic_tablet.png` — 모양이 달라 후속 교체 후보 |
| `stage3-pearl` | 빛나는 진주 | `deepsea_treasure_pearl.png` |
| `stage3-crown` | 해마 왕관 | `deepsea_treasure_crown.png` |
| `stage3-trident` | 세 갈래 창 | `deepsea_treasure_trident.png` |

Stage 1의 녹슨 배 열쇠(`key`)와 조개 목걸이(`necklace`)에 맞는 새 그림은 이번 묶음에 없어 기존 도형을 유지했다. 같은 판에서 동일한 보물 텍스처를 중복 배치하지 않는다. Stage 2와 Stage 3에서 왕관 이미지를 각자 쓰는 것은 서로 다른 판이다.

## 파일 내용 점검과 보류

- inbox의 `deepsea_gate_open.png`는 실제로 문이 **닫힌** 모습이고 `deepsea_gate_closed.png`는 **열린** 모습이었다. 정식 폴더로 이동할 때 두 이름을 맞바꿔 텍스처 이름과 화면 상태를 일치시켰다. `deepsea_gate_warning.png`는 경고등이 켜진 문이다.
- `deepsea_tile_floor.png`는 반복 체크무늬를 피하려고 기본 보행 칸에서 제외했다. Stage 배경이 보행 바닥을 표시한다.
- `deepsea_bubbles.png`, `deepsea_sand_cloud.png`, `deepsea_portal_fx.png`는 장식 효과라 렌더링하지 않는다. 작은 화면의 통로·출구 가독성과 구형 iPad 부담을 먼저 확인한다.
- 기존 지역 유물 부품 5종과 완성 이미지는 `src/assets/adventure/relics/`에 그대로 있고 덮어쓰지 않았다.
- 기존 Stage 2/3 맵 템플릿과 스폰·적 AI·보상 규칙은 변경하지 않았다. 시각 배경, 타일, 장식, 캐릭터, 아이템, UI 표시만 교체했다.
