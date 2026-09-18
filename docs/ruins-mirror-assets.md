# 오래된 유적지 미러 퍼즐 에셋 명세

## 1. 범위와 공통 원칙

- 신규 미러 퍼즐 에셋은 `src/assets/adventure/ancient-ruins/mirror/` 아래에 분류별로 배치하는 것을 권장한다.
- 기준 화면은 iPad Pro 1세대 세로 768 × 1024 논리 해상도다. 래스터 원본은 권장 표시 크기의 2배(@2x)로 제작하고 런타임에서 축소 표시한다.
- 빛의 실제 경로는 이미지가 아니라 Phaser Graphics로 그린다. PNG는 광원, 충돌 지점, 제단 활성화 같은 장식에만 사용한다.
- Stage 1은 최소 에셋으로 규칙과 사용성을 검증한다. Stage 2/3 전용 에셋은 테스트 결과가 확정되기 전 제작하지 않아도 된다.

## 2. 기존 유물 에셋 재사용

다음 경로의 기존 파일은 새로 제작하지 않고 그대로 재사용한다.

- 유물조각: `src/assets/adventure/relics/parts/ruins/`
  - `emerald_stone.png`
  - `ancient_tablet.png`
  - `dinosaur_skull_emblem.png`
  - `sun_gear.png`
  - `rune_core.png`
- 완성 유물: `src/assets/adventure/relics/completed/ruins/ancient_sun_tablet.png`
- 연결된 기존 export: `src/assets/adventure/relics/index.ts`

유물 보관소에서 사용하는 실루엣, 슬롯, 제단, 복원 이펙트도 이미 `src/assets/adventure/relics/` 아래에 있으므로 Final 복원 화면은 우선 기존 공통 에셋을 활용한다.

## 3. 파일명 규칙

- 소문자 영문 `snake_case`와 `.png` 확장자를 사용한다.
- 접두사: `ruins_mirror_`.
- 권장 형식: `ruins_mirror_<category>_<object>_<state>[_vNN].png`.
- 상태 예시: `idle`, `active`, `locked`, `pressed`, `complete`.
- 방향이 필요한 경우: `ne`, `se`, `sw`, `nw` 또는 `horizontal`, `vertical`을 상태 앞에 둔다.
- 숫자는 두 자리로 맞춘다: `tile_01`, `spark_02`.
- 같은 이미지의 임의 크기별 복제는 만들지 않고 Phaser에서 축소한다. 화질상 별도 원본이 필요할 때만 `_1x`, `_2x`를 쓴다.

예: `ruins_mirror_object_mirror_idle.png`, `ruins_mirror_ui_hint_pressed.png`, `ruins_mirror_effect_altar_complete_01.png`.

## 4. 에셋 목록

아래 크기는 @2x PNG 원본 기준 권장값이다. “투명”은 알파 채널이 필요한 파일을 뜻한다.

### 환경

| 에셋 | 권장 파일명 | 투명 PNG | 권장 크기 | 단계 |
| --- | --- | --- | ---: | --- |
| 유적 내부 세로 배경 | `ruins_mirror_env_chamber_bg.png` | 아니요 | 1536 × 2048 | MVP 필수 |
| 보드 뒤 석조 받침 | `ruins_mirror_env_board_plinth.png` | 예 | 1440 × 1440 | MVP 필수 |
| 전경 기둥/덩굴 장식 | `ruins_mirror_env_foreground.png` | 예 | 1536 × 2048 | 이후 확장 |
| Stage 2 회랑 배경 | `ruins_mirror_env_corridor_bg.png` | 아니요 | 1536 × 2048 | 이후 확장 |
| Stage 3 태양의 방 배경 | `ruins_mirror_env_sun_chamber_bg.png` | 아니요 | 1536 × 2048 | 이후 확장 |

### 보드

| 에셋 | 권장 파일명 | 투명 PNG | 권장 크기 | 단계 |
| --- | --- | --- | ---: | --- |
| 기본 석판 셀 | `ruins_mirror_board_tile_01.png` | 아니요 | 256 × 256 | MVP 필수 |
| 셀 선택/터치 강조 | `ruins_mirror_board_tile_focus.png` | 예 | 256 × 256 | MVP 필수 |
| 보드 테두리/모서리 | `ruins_mirror_board_frame.png` | 예 | 1440 × 1440 | MVP 필수 |
| 돌벽 셀 | `ruins_mirror_board_wall_01.png` | 예 | 256 × 256 | 이후 확장(Stage 2) |
| 봉인 룬 셀 | `ruins_mirror_board_rune_locked.png` | 예 | 256 × 256 | 이후 확장 |

보드 타일은 4 × 4, 5 × 5, 6 × 6에 공통 사용하며, 셀별 텍스처를 대량 제작하기보다 소수 타일을 회전·반복 배치한다.

### 퍼즐 오브젝트

| 에셋 | 권장 파일명 | 투명 PNG | 권장 크기 | 단계 |
| --- | --- | --- | ---: | --- |
| 회전 거울 본체 | `ruins_mirror_object_mirror_idle.png` | 예 | 224 × 224 | MVP 필수 |
| 거울 터치/활성 오버레이 | `ruins_mirror_object_mirror_active.png` | 예 | 224 × 224 | MVP 필수 |
| 고정 거울 표식 | `ruins_mirror_object_mirror_fixed.png` | 예 | 224 × 224 | 이후 확장(Stage 2) |
| 광원 장치 | `ruins_mirror_object_emitter_idle.png` | 예 | 256 × 256 | MVP 필수 |
| 활성 광원 오버레이 | `ruins_mirror_object_emitter_active.png` | 예 | 256 × 256 | MVP 필수 |
| 목표 제단 비활성 | `ruins_mirror_object_altar_idle.png` | 예 | 288 × 288 | MVP 필수 |
| 목표 제단 활성 | `ruins_mirror_object_altar_active.png` | 예 | 288 × 288 | MVP 필수 |
| 빛 차단 돌벽 | `ruins_mirror_object_blocker_01.png` | 예 | 224 × 224 | 이후 확장(Stage 2) |
| 다중 목표 표식 | `ruins_mirror_object_target_secondary.png` | 예 | 224 × 224 | 이후 확장(Stage 3, 테스트 후) |

거울 방향은 별도 PNG 두 장을 만들기보다 한 투명 PNG를 Phaser에서 90도 단위 회전하는 방식을 우선한다.

### 이펙트

| 에셋 | 권장 파일명 | 투명 PNG | 권장 크기 | 단계 |
| --- | --- | --- | ---: | --- |
| 거울 터치 반짝임 시트 | `ruins_mirror_effect_mirror_spark_sheet.png` | 예 | 1024 × 256 (4프레임) | MVP 필수 |
| 빛 충돌 반짝임 | `ruins_mirror_effect_beam_hit.png` | 예 | 256 × 256 | MVP 필수 |
| 제단 클리어 광휘 시트 | `ruins_mirror_effect_altar_complete_sheet.png` | 예 | 1536 × 256 (6프레임) | MVP 필수 |
| 보물상자 개방 광휘 | `ruins_mirror_effect_final_chest_glow.png` | 예 | 768 × 768 | 이후 확장(Stage 3) |
| 유적 먼지/빛 입자 | `ruins_mirror_effect_ambient_dust_sheet.png` | 예 | 1024 × 256 (4프레임) | 이후 확장 |

지속 파티클과 대형 블렌드 이미지는 구형 iPad의 overdraw를 늘리므로 피한다. 짧은 일회성 스프라이트 시트와 Phaser Graphics를 우선한다.

### UI

| 에셋 | 권장 파일명 | 투명 PNG | 권장 크기 | 단계 |
| --- | --- | --- | ---: | --- |
| 미션 안내 패널 | `ruins_mirror_ui_mission_panel.png` | 예 | 1408 × 144 | MVP 필수 |
| 처음으로 버튼 기본/눌림 | `ruins_mirror_ui_reset_default.png`, `..._pressed.png` | 예 | 각 320 × 128 | MVP 필수 |
| 힌트 버튼 기본/눌림 | `ruins_mirror_ui_hint_default.png`, `..._pressed.png` | 예 | 각 320 × 128 | MVP 필수 |
| 상단 일시정지 버튼 | `ruins_mirror_ui_pause_default.png` | 예 | 112 × 112 | 공통 UI 미사용 시 MVP 필수 |
| 퍼즐 진행 도트 | `ruins_mirror_ui_progress_dot.png` | 예 | 64 × 64 | MVP 필수 |
| 클리어 패널 | `ruins_mirror_ui_clear_panel.png` | 예 | 1280 × 720 | MVP 필수 |
| Stage 3 Final 보물상자 닫힘/열림 | `ruins_mirror_ui_final_chest_closed.png`, `..._open.png` | 예 | 각 768 × 768 | 이후 확장 |
| 유물조각 획득 패널 | `ruins_mirror_ui_relic_reward_panel.png` | 예 | 1280 × 720 | 이후 확장 |

텍스트는 이미지에 굽지 않는다. 한국어 문구 변경과 접근성 확대를 위해 버튼 배경/프레임과 실제 텍스트를 분리한다.

## 5. 제작 우선순위

### 1차: Stage 1 MVP 필수

- 환경 배경 1종, 보드 받침·프레임, 기본 타일과 포커스
- 회전 거울, 광원, 목표 제단의 기본/활성 상태
- 최소 피드백 이펙트 3종: 거울 터치, 빛 충돌, 제단 클리어
- 미션 패널, 처음으로, 힌트, 진행 표시, 클리어 패널
- 일시정지 버튼은 기존 공통 UI를 Phaser 위 HTML 오버레이로 재사용할 수 없을 때만 신규 제작

### 2차: Stage 2/3 확장

- Stage 2/3 배경 변형, 돌벽·고정 거울·봉인 장치
- Stage 3 Final 보물상자와 보상 패널
- 전경 장식, 환경 입자, 추가 타일 변형
- 유물조각과 완성 유물은 2차에도 신규 제작하지 않고 기존 경로를 재사용
