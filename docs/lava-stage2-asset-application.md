# 용암계곡 Stage 2 에셋 적용 기록

## 최종 신규 에셋 구조

```text
src/assets/adventure/lava-valley/
├─ background/stage2/
│  └─ bg_lava_valley_stage2_lava_cliff.png
├─ stage2/
│  ├─ platform/lava_stage2_ramp_platform.png
│  ├─ collectibles/
│  │  ├─ lava_stage2_fossil_fragment.png
│  │  └─ lava_stage2_fossil_hud_icon.png
│  ├─ hazards/
│  │  ├─ lava_stage2_lava_warning_marker.png
│  │  └─ lava_stage2_lava_eruption.png
│  ├─ secret/
│  │  ├─ lava_stage2_secret_door_closed.png
│  │  ├─ lava_stage2_secret_door_open.png
│  │  ├─ lava_stage2_bonus_chest_closed.png
│  │  └─ lava_stage2_bonus_chest_open.png
│  └─ effects/lava_stage2_fossil_pickup_effect.png
└─ ui/stage-select/
   ├─ stage1_volcano_foothills_banner.png
   ├─ stage2_lava_cliff_banner.png
   └─ stage3_volcano_core_banner.png
```

루트에 추가됐던 14개 파일을 위 경로로 이동하면서 영문 소문자와 언더스코어로 이름을 통일했다.
중복 복사나 원본 재압축은 하지 않았다. 기존 Stage 1 에셋의 위치와 import는 유지했다.

## 적용 내용

- Stage 2 배경은 `background/stage2`의 용암 절벽 배경을 사용한다. Stage 1 배경은 그대로다.
- ramp는 190×50px PNG로 표시한다. 기존 `transition` 플랫폼의 논리 좌표, 충돌면과 스폰 금지 구간은 그대로 유지하며 이미지가 충돌체가 되지 않는다.
- 화석조각은 44×44px PNG, HUD는 24×24px 전용 아이콘을 쓴다. 획득 시 전용 효과 PNG를 기존 1회성 burst 슬롯에서 0.5초 표시하고 자동 정리한다.
- 비밀문은 화석 0~2개일 때 closed, 3개일 때 open PNG를 사용한다. 기존 12% 폭의 넉넉한 진입 판정을 유지한다.
- 용암 분출은 1.2초 warning PNG 후 1.1초 eruption PNG, 0.45초 축소/투명 종료로 전환한다. phase는 React 매 프레임 렌더 없이 DOM data 속성만 갱신한다.
- 비밀루트 진입 시 Stage 2 전용 작은 상자를 표시한다. 접근하면 open 이미지로 바뀌고 기존 허용 보상인 코인 3개를 지급한다. 유물조각은 지급하지 않는다.
- 용암계곡 Stage 선택 카드에는 Stage 1/2/3 배너를 사용한다. 배너에 이름이 포함되어 기존 이름·설명 텍스트는 시각적으로 숨기고 접근성 이름으로만 유지했다. 상태, 시간, NEW/완료/잠김/준비중은 별도 줄로 유지한다.
- CSS로 그리던 ramp, 화석 원형 아이콘, 비밀문 도형, 용암 경고 타원/분출 대체 그림을 제거했다.

## 성능

- 움직임과 충돌은 기존 ref/transform 좌표계를 유지한다.
- PNG는 명시된 고정 표시 크기와 `object-fit`으로 렌더하며, 화석 효과는 하나의 DOM 이미지로 0.5초 후 정리한다.
- 분출은 opacity/scale만 사용하고 새 particle system, blur, shadow 또는 프레임별 React state를 추가하지 않았다.
- Stage 2 에셋은 입장 준비 시 한 번 preload한다. 제공 PNG 원본이 큰 편이라 최초 Stage 2 로딩량은 증가한다. 실제 구형 Galaxy Tab의 메모리·로딩 시간은 실기기에서 검토가 필요하다.

## 검증

- 용암계곡 Stage 선택 배너 3장 로드, 텍스트 중복 없음, 상태/시간 표시 확인.
- 390×844 및 768×1024에서 팝업 overflow 없음.
- Stage 1 기존 게임, Stage 2 배경, ramp/화석/HUD/0.5초 효과, warning→active 분출 전환 확인.
- 기존 Stage 2 단위 검증은 화석 0~3, 문 진입 경계, 비밀루트 지속시간, 보상 pool, 유물 미지급, Stage 3 진입 차단을 포함한다.
- TypeScript, 전체 테스트 51개, production build를 실행했다.

신규 14개 에셋은 모두 import 또는 화면에서 사용한다. 현재 미사용 상태로 남은 신규 lava-valley 에셋은 없다.
