# 심해협곡 Stage 1~3 에셋 조사와 맵 확장 계획

오늘 전달된 이미지 43개의 실제 적용 결과는 [에셋 반영 기록](./deep-sea-arcade-asset-integration.md)에 정리했다. 아래 상태 표는 **이미지 적용 전 조사 시점**의 목록이다.

기준: [아케이드 재설계](./deep-sea-arcade-redesign.md). 이 문서는 2026-09-18 코드·파일 목록 조사 결과다. 실제 화면에서 이미지 품질이나 플레이 감각을 검증한 결과는 아니다. `src/components/screens/DeepSeaGameHost.tsx`와 `deepSea/createDeepSeaGame.ts`는 남아 있는 이전 탐험형 시안이며, 아래 목록은 현재 연결된 `DeepSeaArcadeHost.tsx`와 `deepSea/createDeepSeaArcade.ts`를 대상으로 한다.

## 구현 현황과 맵 확장

| 단계 | 현재 | 권장 확장 |
| --- | --- | --- |
| Stage 1-1~1-3 | `src/config/deepSea/arcadeStages.ts`의 14×13 공통 통로에서 목표·적·아이템을 바꿔 실행. 상황 팝업은 세션 내 1회 표시 | 맵 증설 대상 아님 |
| Stage 2 | `src/config/deepSea/arcadeStage2.ts`의 고정 22×22 맵 1종. 보물 3, 상어 2, 문어 1, 구슬 2, 출구 1. 수문 없음 | **총 3종**: 현재 맵을 S2-A 기본 루프형으로 유지하고 S2-B 중앙 교차형, S2-C 좌우 우회형 2종 추가 |
| Stage 3 | `src/config/deepSea/arcadeStage3.ts`의 26×26 템플릿 4종(`loop`, `central_cross`, `side_detour`, `gate_focused`). 실행 ID에서 템플릿과 스폰 후보 선택, 최대 32회 검증. 보물 3, 상어·문어·해파리 각 1, 구슬 2, 수문 2 | **총 6종**: `outer_ring`, `dual_loop` 2종 추가. 수문은 맵당 2~3개 범위에서 검증 후 결정 |

### Stage 2 템플릿 계약

S2-A는 현재 `ARCADE_STAGE_2`의 통로·고정 스폰을 그대로 래핑한다. S2-B는 중앙 교차로 양쪽에 대칭 우회 루프를 두고, S2-C는 좌우 외곽 경로와 중간 연결로를 둔다. 각 템플릿은 `id`, `floor`, `playerStart`, `treasureSpawnCandidates`(세 위치군), `enemySpawnCandidates`(상어 2·문어 1), `powerupSpawnCandidates`, `exitCandidates`, `coinPathCandidates`를 제공한다. 출구와 적 스폰의 분리, 보물 간 거리, 모든 목표 도달, 겹침 금지, 첫 충돌 안전거리, 2~3분 목표 동선을 `validateArcadeBoard()`로 확인한다. 코인은 선택된 위치를 제외한 통로 후보에서 생성한다. 수문 필드는 두지 않는다. Stage 2의 현재 플레이 감각을 보존하기 위해 S2-A의 스폰과 통로는 변경하지 않고, 새 두 맵은 실기기 시간을 확인한 뒤 풀에 투입한다.

### Stage 3 템플릿 계약

현재 `Template`에는 통로·시작점·보물/적/구슬/출구 후보·수문 위치·코인 후보가 있다. `gatePattern`은 현재 위치별 주기/위상으로 `buildBoard()`에서 결정되며 템플릿별 별도 필드가 없다. `jellyfishRoute`도 현재 별도 필드가 없고, 해파리는 시작점 주변 통로를 순찰하며 출구 2타일 이내를 피한다. 확장할 때 각 템플릿에 `gatePattern`(2~3개 수문의 주기·위상)과 `jellyfishRoute`(검증된 순찰 노드)를 명시해 결과의 예측 가능성을 높인다. `outer_ring`은 외곽 순환로와 안쪽 지름길, `dual_loop`는 두 순환로 사이의 연결로를 목표로 한다. 두 맵 모두 닫힌 수문 상태에서 보물 3개·출구까지 우회할 수 있어야 한다. 후보 재선택은 제한 횟수 내 수행하고 검증된 fallback을 유지한다. 고정된 전체 배경 이미지는 템플릿마다 만들지 않는다.

### 해파리 역할

`createDeepSeaArcade.ts`에서 해파리는 추적하지 않는 저속 순찰 적이다. 직접 HP를 깎지 않고 접촉 시 1.8초 이동을 멈추며 잠수함을 감싸는 타원형 표시를 띄운다. 그동안 상어·문어 충돌과 기존 무적 판정은 계속 적용된다. 전기 강화 중에는 해파리가 달아나고 접촉 시 기절하며, 붙잡힘도 해제된다. 종료 뒤 0.4초 재접촉 방지 시간을 둔다. 지속 시간과 유예 시간은 Stage 3 설정값이다. 새 에셋은 이 **제어형 역할**이 읽히도록 만들고 공격/피격 그림으로 오해되지 않게 한다.

## 제작 기준과 상태 판정

- `existing_final`: 현재 저장소에 있고 유물 보관소에서 실제 참조되는 완성 이미지. 미술 최종 승인까지 뜻하지 않는다.
- `reusable_common`: 다른 화면에서 실제 사용 중이거나 공유 가능한 이미지/아이콘. 심해 아케이드에 자동 적용되었다는 뜻은 아니다.
- `existing_temp`: 현재 CSS·문구·일반 UI로 기능하는 임시 표시. 별도 PNG가 필수라는 뜻은 아니다.
- `phaser_shape`: 아케이드 런타임이 코드로 그리는 도형. 제안 파일은 교체 시 사용할 이름이다.
- `missing`: 현재 아케이드에 해당 이미지나 효과가 없다. 장식 항목은 제작 전에 실제 필요 여부를 결정한다.

제안 파일의 기본 위치는 `src/assets/adventure/deep-sea/` 아래다. 표의 `current_path`는 **현재 구현 위치**이며, 제안 경로가 아니다. `—`는 현재 아케이드에서 해당 파일/표시가 없음을 뜻한다. `animation_frames`의 `0`은 정적 PNG, `CSS`는 별도 이미지가 없는 상태다. 제작 크기는 원본 이미지 기준이며 실제 플레이에는 56px 타일과 runtime scale을 쓴다. 캐릭터 원본은 최대 약 512px, 반복 소형 오브젝트는 대체로 128px 안팎을 우선한다. 애니메이션을 도입하면 8~10fps부터 확인하고 구형 iPad를 위해 과도한 필터·파티클·상시 큰 시트를 피한다. 투명 배경 `Y`는 PNG alpha 필요를 뜻한다.

## 최종 제작·재사용 인벤토리

한 행은 교체/제작 단위 1개다. 같은 상태의 색·텍스트 변형을 공유 이미지로 처리할 수 있는 행은 목적에 명시했다. `P0`는 플레이 가독성, `P1`은 완성도, `P2`는 장식이다.

| category | asset_name | recommended_filename | stage | purpose | current_status | current_path | transparent_background | recommended_size | animation_frames | priority |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| G1 player | 잠수함 정상 | characters/submarine_normal.png | 공용 | 방향 회전 기본 모습 | phaser_shape | `src/components/screens/deepSea/createDeepSeaArcade.ts` | Y | 384×384 | 0 | P0 |
| G1 player | 잠수함 파손 | characters/submarine_damaged.png | 공용 | HP 2 상태 | phaser_shape | `src/components/screens/deepSea/createDeepSeaArcade.ts` | Y | 384×384 | 0 | P0 |
| G1 player | 잠수함 위험 | characters/submarine_critical.png | 공용 | HP 1 상태 | phaser_shape | `src/components/screens/deepSea/createDeepSeaArcade.ts` | Y | 384×384 | 0 | P0 |
| G1 player | 잠수함 강화 | characters/submarine_powered.png | 공용 | 전기 구슬 강화 중 색 구별 | phaser_shape | `src/components/screens/deepSea/createDeepSeaArcade.ts` | Y | 384×384 | 0 | P0 |
| G2 enemies | 상어 기본 | enemies/shark_normal.png | 공용 | 직접 추적·피해 | phaser_shape | `src/components/screens/deepSea/createDeepSeaArcade.ts` | Y | 384×384 | 0 | P0 |
| G2 enemies | 상어 도주 | enemies/shark_flee.png | 공용 | 전기 상태 반응 | phaser_shape | `src/components/screens/deepSea/createDeepSeaArcade.ts` | Y | 384×384 | 0 | P1 |
| G2 enemies | 상어 기절/복귀 | enemies/shark_stunned.png | 공용 | 숨김·투명 복귀를 교체할 선택 상태 | existing_temp | `src/components/screens/deepSea/createDeepSeaArcade.ts` | Y | 384×384 | 0 | P2 |
| G2 enemies | 문어 기본 | enemies/octopus_normal.png | 공용 | 교차로 압박 | phaser_shape | `src/components/screens/deepSea/createDeepSeaArcade.ts` | Y | 384×384 | 0 | P0 |
| G2 enemies | 문어 도주 | enemies/octopus_flee.png | 공용 | 전기 상태 반응 | phaser_shape | `src/components/screens/deepSea/createDeepSeaArcade.ts` | Y | 384×384 | 0 | P1 |
| G2 enemies | 해파리 기본 | enemies/jellyfish_normal.png | Stage 3 | 느린 제어형 순찰 | phaser_shape | `src/components/screens/deepSea/createDeepSeaArcade.ts` | Y | 384×384 | 0 | P0 |
| G2 enemies | 해파리 붙잡기 | effects/jellyfish_hold.png | Stage 3 | 잠수함을 감싼 1.8초 표시 | phaser_shape | `src/components/screens/deepSea/createDeepSeaArcade.ts` | Y | 256×256 | 0 | P0 |
| G2 enemies | 해파리 기절 | enemies/jellyfish_stunned.png | Stage 3 | 강화 중 숨김/복귀를 교체할 선택 상태 | existing_temp | `src/components/screens/deepSea/createDeepSeaArcade.ts` | Y | 384×384 | 0 | P2 |
| G3 world | 통로 바닥 타일 | tiles/corridor_floor.png | 공용 | 반복 통로 | phaser_shape | `src/components/screens/deepSea/createDeepSeaArcade.ts` | N | 128×128 | 0 | P0 |
| G3 world | 벽 타일 | tiles/wall.png | 공용 | 이동 불가 영역 | phaser_shape | `src/components/screens/deepSea/createDeepSeaArcade.ts` | N | 128×128 | 0 | P0 |
| G3 world | 심해 바위 | objects/deep_sea_rock.png | 공용 | 충돌 격자와 별개 장식 | missing | — | Y | 128×128 | 0 | P2 |
| G3 world | 해저 유적 | objects/ruins.png | 공용 | 반복 배치 장식 | missing | — | Y | 256×256 | 0 | P2 |
| G3 world | 난파선 | objects/wreck.png | 공용 | 반복 배치 장식 | missing | — | Y | 256×256 | 0 | P2 |
| G3 world | 잠긴 출구 | objects/exit_locked.png | 공용 | 목표 미완료 상태 | phaser_shape | `src/components/screens/deepSea/createDeepSeaArcade.ts` | Y | 256×256 | 0 | P0 |
| G3 world | 열린 출구 | objects/exit_active.png | 공용 | 탈출 가능 상태 | phaser_shape | `src/components/screens/deepSea/createDeepSeaArcade.ts` | Y | 256×256 | 0 | P0 |
| G3 world | 열린 수문 | objects/gate_open.png | Stage 3 | 통로 개방 | phaser_shape | `src/components/screens/deepSea/createDeepSeaArcade.ts` | Y | 128×128 | 0 | P0 |
| G3 world | 경고 수문 | objects/gate_warning.png | Stage 3 | 닫히기 전 구별 | phaser_shape | `src/components/screens/deepSea/createDeepSeaArcade.ts` | Y | 128×128 | 0 | P0 |
| G3 world | 닫힌 수문 | objects/gate_closed.png | Stage 3 | 통행 불가 구별 | phaser_shape | `src/components/screens/deepSea/createDeepSeaArcade.ts` | Y | 128×128 | 0 | P0 |
| G3 world | 수문 경고 효과 | effects/gate_warning_glow.png | Stage 3 | 현재 도형 alpha 점멸 보강 | existing_temp | `src/components/screens/deepSea/createDeepSeaArcade.ts` | Y | 128×128 | 0 | P1 |
| G4 pickups | 전기 구슬 | pickups/electric_orb.png | 공용 | 강화 픽업 | phaser_shape | `src/components/screens/deepSea/createDeepSeaArcade.ts` | Y | 128×128 | 0 | P0 |
| G4 pickups | 전기 오라 | effects/electric_aura.png | 공용 | 강화 지속 상태 | existing_temp | `src/components/screens/deepSea/createDeepSeaArcade.ts` | Y | 256×256 | 0 | P1 |
| G4 pickups | 통로 코인 | pickups/coin.png | 공용 | 통로 보상 | phaser_shape | `src/components/screens/deepSea/createDeepSeaArcade.ts` | Y | 128×128 | 0 | P0 |
| G4 pickups | 보물 공용 프레임 | pickups/treasure_frame.png | 공용 | 보물 종류 공유 테두리 | phaser_shape | `src/components/screens/deepSea/createDeepSeaArcade.ts` | Y | 128×128 | 0 | P1 |
| G4 pickups | 오래된 나침반 | pickups/treasure_compass.png | Stage 1 | 튜토리얼 보물 | phaser_shape | `src/config/deepSea/arcadeStages.ts`, `src/components/screens/deepSea/createDeepSeaArcade.ts` | Y | 128×128 | 0 | P1 |
| G4 pickups | 녹슨 배 열쇠 | pickups/treasure_rusty_key.png | Stage 1 | 튜토리얼 보물 | phaser_shape | `src/config/deepSea/arcadeStages.ts`, `src/components/screens/deepSea/createDeepSeaArcade.ts` | Y | 128×128 | 0 | P1 |
| G4 pickups | 조개 목걸이 | pickups/treasure_shell_necklace.png | Stage 1 | 튜토리얼 보물 | phaser_shape | `src/config/deepSea/arcadeStages.ts`, `src/components/screens/deepSea/createDeepSeaArcade.ts` | Y | 128×128 | 0 | P1 |
| G4 pickups | 금빛 항아리 | pickups/treasure_gold_jar.png | Stage 2 | 목표 보물 | phaser_shape | `src/config/deepSea/arcadeStage2.ts`, `src/components/screens/deepSea/createDeepSeaArcade.ts` | Y | 128×128 | 0 | P0 |
| G4 pickups | 부서진 왕관 | pickups/treasure_broken_crown.png | Stage 2 | 목표 보물 | phaser_shape | `src/config/deepSea/arcadeStage2.ts`, `src/components/screens/deepSea/createDeepSeaArcade.ts` | Y | 128×128 | 0 | P0 |
| G4 pickups | 파란 보석 상자 | pickups/treasure_blue_jewel_box.png | Stage 2 | 목표 보물 | phaser_shape | `src/config/deepSea/arcadeStage2.ts`, `src/components/screens/deepSea/createDeepSeaArcade.ts` | Y | 128×128 | 0 | P0 |
| G4 pickups | 빛나는 진주 | pickups/treasure_stage3_pearl.png | Stage 3 | 고급 목표 보물 | phaser_shape | `src/config/deepSea/arcadeStage3.ts`, `src/components/screens/deepSea/createDeepSeaArcade.ts` | Y | 128×128 | 0 | P0 |
| G4 pickups | 해마 왕관 | pickups/treasure_stage3_crown.png | Stage 3 | 고급 목표 보물 | phaser_shape | `src/config/deepSea/arcadeStage3.ts`, `src/components/screens/deepSea/createDeepSeaArcade.ts` | Y | 128×128 | 0 | P0 |
| G4 pickups | 세 갈래 창 | pickups/treasure_stage3_trident.png | Stage 3 | 고급 목표 보물 | phaser_shape | `src/config/deepSea/arcadeStage3.ts`, `src/components/screens/deepSea/createDeepSeaArcade.ts` | Y | 128×128 | 0 | P0 |
| G5 HUD/tutorial | 보물 카운터 | ui/treasure_counter.png | 공용 | 0/3~3/3 목표 | existing_temp | `src/components/screens/DeepSeaArcadeHost.tsx`, `src/index.css` | Y | 256×96 | CSS | P0 |
| G5 HUD/tutorial | 코인 아이콘 | ui/coin_icon.png | 공용 | 코인 수 읽기; `reward_coin_icon.png` 재사용 후보 | reusable_common | `src/assets/ui/training/reward_coin_icon.png` | Y | 96×96 | 0 | P1 |
| G5 HUD/tutorial | 잠수함 상태 | ui/submarine_condition.png | 공용 | 정상/파손/위험 문구와 색 | existing_temp | `src/components/screens/DeepSeaArcadeHost.tsx`, `src/index.css` | Y | 256×96 | CSS | P0 |
| G5 HUD/tutorial | 강화 표시 | ui/powered_state.png | 공용 | 남은 초 표시 | existing_temp | `src/components/screens/DeepSeaArcadeHost.tsx`, `src/index.css` | Y | 256×96 | CSS | P0 |
| G5 HUD/tutorial | 출구 표시 | ui/exit_indicator.png | 공용 | 잠김/열림 HUD | existing_temp | `src/components/screens/DeepSeaArcadeHost.tsx`, `src/index.css` | Y | 192×96 | CSS | P0 |
| G5 HUD/tutorial | 미니맵 플레이어 | ui/minimap_player.png | 공용 | 위치 점 | existing_temp | `src/components/screens/DeepSeaArcadeHost.tsx` | Y | 64×64 | CSS | P0 |
| G5 HUD/tutorial | 미니맵 출구 | ui/minimap_exit.png | 공용 | 출구 상태 | existing_temp | `src/components/screens/DeepSeaArcadeHost.tsx` | Y | 64×64 | CSS | P0 |
| G5 HUD/tutorial | 미니맵 수문 | ui/minimap_gate.png | Stage 3 | 열림/경고/닫힘 3색 | existing_temp | `src/components/screens/DeepSeaArcadeHost.tsx` | Y | 64×64 | CSS | P0 |
| G5 HUD/tutorial | 화면 밖 목표 화살표 | ui/offscreen_indicator.png | 공용 | 현재 미사용; 필요 시만 추가 | missing | — | Y | 64×64 | 0 | P2 |
| G5 HUD/tutorial | 튜토리얼 팝업 | ui/tutorial_popup.png | Stage 1 | 상황 안내 패널 | existing_temp | `src/components/screens/DeepSeaArcadeHost.tsx`, `src/index.css` | Y | 512×256 | CSS | P1 |
| G5 HUD/tutorial | 방향 조작 신호 | ui/direction_cue.png | Stage 1 | 현재 방향 버튼과 설명 문구 | existing_temp | `src/components/screens/DeepSeaArcadeHost.tsx`, `src/index.css` | Y | 128×128 | CSS | P1 |
| G5 HUD/tutorial | 적 접근 경고 | ui/enemy_warning.png | Stage 1 | 현재 상황 팝업 문구 | existing_temp | `src/components/screens/DeepSeaArcadeHost.tsx` | Y | 256×128 | CSS | P1 |
| G5 HUD/tutorial | 전기 구슬 설명 | ui/electric_orb_cue.png | Stage 1 | 현재 상황 팝업 문구 | existing_temp | `src/components/screens/DeepSeaArcadeHost.tsx` | Y | 256×128 | CSS | P1 |
| G5 HUD/tutorial | 보물 설명 | ui/treasure_cue.png | Stage 1 | 현재 상황 팝업 문구 | existing_temp | `src/components/screens/DeepSeaArcadeHost.tsx` | Y | 256×128 | CSS | P1 |
| G5 HUD/tutorial | 출구 설명 | ui/exit_cue.png | Stage 1 | 현재 상황 팝업 문구 | existing_temp | `src/components/screens/DeepSeaArcadeHost.tsx` | Y | 256×128 | CSS | P1 |
| G6 entry/result | Stage 1-1 도입 | screens/stage1_1_intro.png | Stage 1 | 현재 짧은 시작 문구 | existing_temp | `src/components/screens/DeepSeaArcadeHost.tsx` | N | 768×900 | CSS | P2 |
| G6 entry/result | Stage 1-2 도입 | screens/stage1_2_intro.png | Stage 1 | 현재 목표 문구 | existing_temp | `src/components/screens/DeepSeaArcadeHost.tsx` | N | 768×900 | CSS | P2 |
| G6 entry/result | Stage 1-3 도입 | screens/stage1_3_intro.png | Stage 1 | 현재 목표 문구 | existing_temp | `src/components/screens/DeepSeaArcadeHost.tsx` | N | 768×900 | CSS | P2 |
| G6 entry/result | Stage 2 도입 | screens/stage2_intro.png | Stage 2 | 별도 화면 없음; 시작 목표 문구 | existing_temp | `src/components/screens/DeepSeaArcadeHost.tsx` | N | 768×900 | CSS | P2 |
| G6 entry/result | Stage 3 도입 | screens/stage3_intro.png | Stage 3 | 별도 화면 없음; 시작 목표 문구 | existing_temp | `src/components/screens/DeepSeaArcadeHost.tsx` | N | 768×900 | CSS | P1 |
| G6 entry/result | 클리어 패널 | screens/clear_panel.png | 공용 | 코인·보물 결과 | existing_temp | `src/components/screens/DeepSeaArcadeHost.tsx`, `src/index.css` | Y | 512×512 | CSS | P1 |
| G6 entry/result | 실패 패널 | screens/fail_panel.png | 공용 | 재도전 안내 | existing_temp | `src/components/screens/DeepSeaArcadeHost.tsx`, `src/index.css` | Y | 512×512 | CSS | P1 |
| G6 entry/result | Stage 3 결과 장식 | screens/stage3_result.png | Stage 3 | 공용 결과 패널 위 보물 강조 | missing | — | Y | 512×512 | 0 | P2 |
| G7 relic/FX | 심해 진주 | relic/abyss_pearl.png | Stage 3 | 유물부품 보상 | existing_final | `src/assets/adventure/relics/parts/deep-sea/abyss_pearl.png` | Y | 기존 파일 유지 | 0 | P1 |
| G7 relic/FX | 산호 성배 밑받침 | relic/coral_chalice_base.png | Stage 3 | 유물부품 보상 | existing_final | `src/assets/adventure/relics/parts/deep-sea/coral_chalice_base.png` | Y | 기존 파일 유지 | 0 | P1 |
| G7 relic/FX | 바다용 메달 | relic/sea_dragon_medal.png | Stage 3 | 유물부품 보상 | existing_final | `src/assets/adventure/relics/parts/deep-sea/sea_dragon_medal.png` | Y | 기존 파일 유지 | 0 | P1 |
| G7 relic/FX | 황금 조개잔 | relic/golden_shell_cup.png | Stage 3 | 유물부품 보상 | existing_final | `src/assets/adventure/relics/parts/deep-sea/golden_shell_cup.png` | Y | 기존 파일 유지 | 0 | P1 |
| G7 relic/FX | 소용돌이 핵 | relic/vortex_core.png | Stage 3 | 유물부품 보상 | existing_final | `src/assets/adventure/relics/parts/deep-sea/vortex_core.png` | Y | 기존 파일 유지 | 0 | P1 |
| G7 relic/FX | 완성된 진주 성배 | relic/abyss_pearl_chalice.png | Stage 3 | 5/5 복원 이미지 | existing_final | `src/assets/adventure/relics/completed/deep-sea/abyss_pearl_chalice.png` | Y | 기존 파일 유지 | 0 | P1 |
| G7 relic/FX | 진주 성배 실루엣 | relic/abyss_pearl_chalice_silhouette.png | Stage 3 | 미완성 보관소 표시 | existing_final | `src/assets/adventure/relics/silhouettes/deep-sea/abyss_pearl_chalice.png` | Y | 기존 파일 유지 | 0 | P1 |
| G7 relic/FX | 유물 보상 패널 | relic/relic_reward_panel.png | Stage 3 | 현재 결과 화면의 문구; 공용 심해 패널 재사용 후보 | reusable_common | `src/assets/adventure/common/ui/panel_deep_sea_canyon.png`, `src/components/screens/DeepSeaArcadeHost.tsx` | Y | 기존 패널 유지 | 0 | P1 |
| G7 relic/FX | 보상 상자 | relic/reward_chest.png | Stage 3 | 현재 심해 전용 상자 없음; 연출 선택사항 | missing | — | Y | 256×256 | 0 | P2 |
| G7 relic/FX | 유물 공개 효과 | relic/relic_reveal_glow.png | Stage 3 | 기존 공용 복원 효과 재사용 후보 | reusable_common | `src/assets/adventure/relics/ui/effects/08_relic_restore_orb_aura.png`, `09_relic_restore_complete_glow.png` | Y | 기존 파일 유지 | 0 | P2 |

`missing/unknown placeholder` 조사 결과: 현재 보물 ID 9개는 모두 코드에 이름과 도형이 있으며 누락된 픽업 종류는 없다. `makeTreasureVisual()`은 ID별로 실제 보물 실루엣을 그리지 않고 색 사각형·별을 공유한다. 새 보물 ID가 추가되면 이 매핑에 지정하지 않은 항목은 같은 기본색 도형으로 표시된다. 구형 탐험형 코드·아카이브 이미지는 위 아케이드의 완성 에셋으로 세지 않는다.

## 맵 그래픽 전략

현재 월드는 `createDeepSeaArcade.ts`가 `board.floor`를 순회해 통로/벽 사각형과 가장자리를 한 번 그린다. 충돌·길찾기·수문은 타일 격자에 의존하고 배경 이미지와 분리되어 있다. 맵 3종/6종에도 이 격자를 유지하고, 공용 바닥·벽 타일과 작은 바위·유적·난파선 오브젝트를 반복 배치한다. 충돌하지 않는 장식은 통로 가독성과 수문 경고를 가리지 않게 한다. 먼 배경이 꼭 필요하면 공용 저해상도 1~2종을 나중에 검토한다. 템플릿마다 화면 전체 크기의 배경을 만들지 않는다.

## 이미지 제작 배치

위 표는 **69개 인벤토리 행**으로 구성된다. `phaser_shape` 29개, `existing_temp` 24개, `missing` 6개인 **59개가 신규 제작·교체 검토 대상**이고, 기존 이미지 `existing_final` 7개와 `reusable_common` 3개는 우선 재사용한다. 59개 모두를 반드시 PNG로 만들라는 뜻은 아니다. 특히 `existing_temp`의 CSS·문구와 P2 장식은 최종 UI 평가 후 이미지가 실제로 필요한 경우에만 그린다. P0 30개부터 제작 여부를 결정한다.

| 그룹 | 범위 | 인벤토리 행 수 | 첫 작업 |
| --- | --- | ---: | --- |
| G1 | 플레이어 정상·파손·위험·강화 | 4 | **우선 생성**: 네 상태의 동일 윤곽·방향 기준 확정 |
| G2 | 상어·문어·해파리와 붙잡기 표시 | 8 | 기본형 3종부터 |
| G3 | 바닥·벽·출구·수문·장식 | 11 | 바닥/벽과 수문 3상태부터 |
| G4 | 구슬·코인·보물 9종·공용 프레임/효과 | 13 | 구슬/코인과 Stage 2/3 보물부터 |
| G5 | HUD·미니맵·Stage 1 튜토리얼 | 15 | 텍스트/CSS 유지 가능성 먼저 평가 |
| G6 | 도입·클리어·실패 | 8 | 공용 결과 패널부터 |
| G7 | 기존 유물 이미지와 선택 연출 | 10 | 현행 7개 이미지 재사용 확인 |

수치는 **인벤토리 행 수**이며 신규 PNG 생성 지시 수가 아니다. 권장 크기·투명도·우선순위는 각 행을 따른다. 캐릭터는 4방향 회전이 가능한 기준 자세로 먼저 디자인하고, 애니메이션이 필요한 것이 실기기에서 확인되면 소수 프레임 시트를 8~10fps로 확장한다.
