# 모바일 게임 성능 가이드

> Abacus Game의 모바일·저사양 태블릿용 게임 애니메이션 및 에셋 성능 가이드

이 문서는 용암계곡 러너를 구형 Android 태블릿과 구형 iPad에서 최적화하며 확인한 기준을 정리한다. 화면 배치와 터치 영역은 [터치·태블릿 UI 가이드](./touch-tablet-ui-guidelines.md), 모험 콘텐츠의 구조와 확장 방향은 [모험 시스템](./adventure-system.md)도 함께 참고한다.

## 1. 문제 배경과 결과

최적화 전에는 PC localhost에서 카르노타우루스 RUN 애니메이션이 정상적으로 보였지만 실제 배포 환경의 구형 기기에서는 다음 문제가 발생했다.

- 약 5년 된 Galaxy Tab Lite: RUN 프레임 변화가 거의 보이지 않아 정지 이미지처럼 보였다.
- 구형 iPad Pro/Safari: RUN 도중 일부 프레임에서 캐릭터가 순간적으로 사라지는 blank/flicker가 나타났다.
- 당시 RUN은 여러 PNG의 `img.src`를 약 105ms마다 React state로 교체하는 구조였다. 프레임 변경마다 상위 게임 컴포넌트도 다시 렌더링됐다.
- 각 플레이어 PNG는 1254×1254였다. PNG 한 장의 디코드 메모리는 약 6MiB이고 RUN 4장만 약 24MiB였다.

RUN을 단일 CSS sprite sheet로 바꾸고 에셋 크기, preload 및 렌더 경계를 정리한 뒤 Galaxy Tab에서 실제 체감 성능이 크게 개선됐다. 이 결과는 파일 용량뿐 아니라 디코드 메모리, 텍스처 교체, React 렌더 범위를 함께 관리해야 한다는 근거다.

## 2. 효과가 확인된 구조

### 지속 애니메이션

- 반복되는 캐릭터·적 애니메이션은 개별 PNG의 `src` 교체보다 CSS sprite sheet를 우선 검토한다.
- 기본 애니메이션 속도는 8~10fps로 시작한다. 용암계곡 RUN은 4프레임을 420ms에 재생해 약 9.5fps다.
- visual frame은 HP, 점수, 충돌 같은 gameplay state와 분리한다.
- CSS `steps()`와 `background-position`으로 충분하면 프레임 번호를 React state로 관리하지 않는다.
- 모든 상태를 하나의 거대한 atlas로 합치지 않는다. 용암계곡도 지속 반복되는 RUN만 sheet로 만들고 idle/jump/fall/hurt/victory는 개별 상태 이미지로 유지한다.

### 에셋 로딩과 메모리

- 중요 캐릭터 이미지는 우선 512px 내외에서 품질을 검토한다.
- 반복 등장하는 coin/item 등 collectible은 128~256px를 시작점으로 삼는다.
- PNG의 실제 비용은 압축 파일 크기만이 아니라 대략 `width × height × 4 bytes`인 RGBA 디코드 메모리로 평가한다.
- 게임 진입 시 critical gameplay asset을 preload한다.
- `HTMLImageElement.decode()`가 있으면 디코드 완료까지 기다린다.
- `decode()`가 없거나 실패하는 구형 Safari/WebView에서는 `onload`로 대체한다.
- preload/decode가 끝난 뒤 intro를 진행하고 실제 게임 타이머를 시작한다. 로딩 시간은 제한 시간에서 차감하지 않는다.
- background와 static texture는 프레임마다 `src`를 바꾸거나 다시 decode하지 않는다.

### 움직임과 효과

- 움직이는 객체는 지속적인 `left`/`top` 변경보다 `transform` 기반 이동을 우선 검토한다.
- 프레임 독립적인 움직임이 필요하면 단일 `requestAnimationFrame` 루프와 `deltaTime`을 사용한다.
- explosion, hit, pickup 같은 effect는 발생 순간에 mount하고 짧게 재생한 뒤 제거한다.
- 숨겨진 effect DOM을 계속 유지하거나 연속 획득 시 effect 노드를 누적하지 않는다.
- 전체 게임을 성급하게 canvas/WebGL로 다시 만들거나 새 게임 엔진을 도입하지 않는다. 현재 DOM/CSS/React 구조 안에서 병목만 작게 개선한다.

## 3. 에셋 제작 기준

- 실제 최대 표시 크기를 먼저 측정하고 그보다 지나치게 큰 PNG를 사용하지 않는다.
- Retina 대응 여유는 두되 기기에서 구분하기 어려운 과도한 해상도는 피한다.
- 투명 padding은 최소화한다. 단, 잘라내기로 캐릭터 anchor가 달라지지 않게 한다.
- 한 애니메이션의 모든 프레임은 같은 canvas 크기와 동일한 발·중심 anchor를 사용한다.
- sprite sheet의 cell 크기와 프레임 간격을 통일한다.
- 최적화본을 검증하기 전 원본을 파괴적으로 덮어쓰지 않는다.

용암계곡의 현재 기준은 다음과 같다.

| 종류 | 최적화 전 | 현재 | 디코드 메모리 변화 |
|---|---:|---:|---:|
| 플레이어 단일 상태 | 1254×1254 | 512×512 | 약 6MiB → 1MiB |
| RUN 4프레임 | 1254×1254 PNG 4장 | 2048×512 sheet, 512px cell 4개 | 약 24MiB → 4MiB |
| coin/meat/rare shard | 각각 1254×1254 | 각각 256×256 | 장당 약 6MiB → 0.25MiB |

## 4. React 구현 기준

React state가 적합한 값:

- HP와 생존 상태
- score와 reward
- pause/resume
- success/fail
- 아이템 획득 및 충돌 결과

React state에서 분리할 값:

- 8~10fps로 반복되는 단순 visual frame 번호
- CSS만으로 표현 가능한 idle/run loop
- gameplay 의미가 없는 짧은 장식 변화

지속 애니메이션 때문에 HUD, 배경, 장애물, 수집물과 타이머까지 반복 렌더하지 않아야 한다. CSS sprite를 사용할 수 없으면 작은 전용 컴포넌트로 격리하고 필요할 때 `React.memo`를 적용한다. 메모이제이션 자체가 목적은 아니며, 전달 prop이 안정적이고 실제 상위 렌더를 차단할 수 있을 때 사용한다.

## 5. 신규 미니게임 적용 규칙

하늘섬, 숫자유적 및 이후 미니게임은 아래 규칙으로 시작한다.

1. 지속 캐릭터·적 애니메이션은 CSS sprite sheet를 우선 검토한다.
2. idle/run/jump 등 모든 상태를 무조건 하나의 atlas로 합치지 않는다.
3. 반복 수집물은 표시 크기에 맞춘 저해상도 optimized asset을 사용한다.
4. explosion/hit/pickup은 one-shot effect로 만들고 종료 후 제거한다.
5. critical asset preload/decode가 끝나기 전에는 게임 타이머를 시작하지 않는다.
6. 월드 이동은 필요 시 `requestAnimationFrame + deltaTime`으로 처리한다.
7. static texture의 반복 교체와 전체 게임 컴포넌트의 visual-frame 렌더를 피한다.
8. PC localhost 결과만으로 완료 처리하지 않는다. production build와 실제 태블릿을 확인한다.

## 6. 테스트 기준

최소 테스트 환경:

- desktop 브라우저
- 구형 Android 태블릿
- 구형 iPad/Safari
- production build (`npm run build`, 필요 시 `npm run preview`)
- 실제 Netlify 배포 환경

체크리스트:

- [ ] 지속 애니메이션이 멈추지 않는다.
- [ ] 프레임 전환 중 blank image가 없다.
- [ ] 캐릭터나 effect가 깜빡이지 않는다.
- [ ] 점프·터치 입력 지연이 눈에 띄지 않는다.
- [ ] preload 시간 동안 게임 타이머가 감소하지 않는다.
- [ ] pause/resume 후 타이머와 움직임이 정상이다.
- [ ] 장애물과 collectible 충돌 판정이 정상이다.
- [ ] effect DOM이 계속 누적되지 않는다.
- [ ] 플레이 시간이 길어져도 메모리가 급증하지 않는다.
- [ ] 애니메이션 중 같은 이미지에 대한 네트워크 요청이 반복되지 않는다.

CPU throttling은 빠른 회귀 확인에는 유용하지만 실제 구형 Android GPU와 iPad Safari 검증을 대체하지 않는다.

## 7. 현재 프로젝트의 권장 기본값

| 항목 | 시작점 |
|---|---:|
| continuous sprite animation | 8~10fps |
| 주요 캐릭터 asset | 약 512px 내외 |
| 반복 collectible | 약 128~256px |
| sprite cell | 같은 canvas 크기와 같은 anchor |
| 게임 시작 | critical preload/decode 완료 후 |

이 숫자는 절대 규격이 아니다. 실제 CSS 표시 크기, 화면 밀도, 동시에 활성화되는 텍스처 수와 목표 기기의 성능을 측정한 뒤 조정한다. 큰 배경처럼 화면 전체를 차지하는 자산은 캐릭터보다 높은 해상도가 필요할 수 있다.

## 8. 현재 구현 위치

- [`src/components/screens/LavaPathPrototype.tsx`](../src/components/screens/LavaPathPrototype.tsx): preload gate, 타이머 시작 순서, `React.memo` 플레이어, RAF 게임 루프와 one-shot effect 정리
- [`src/utils/preloadImages.ts`](../src/utils/preloadImages.ts): `decode()` feature detection과 `onload` fallback
- [`src/assets/adventure/lava-valley/index.ts`](../src/assets/adventure/lava-valley/index.ts): optimized player/collectible 및 RUN sheet 연결
- [`src/index.css`](../src/index.css): RUN sprite `steps(4)` 애니메이션, transform 기반 트랙·게임 객체 스타일, pause 시 애니메이션 정지
- [`scripts/optimize-lava-assets.ps1`](../scripts/optimize-lava-assets.ps1): 원본에서 512px player, 256px collectible, 2048×512 RUN sheet를 재생성하는 스크립트

## 새 미니게임 개발 체크

> **새 미니게임 개발 시 이 문서를 먼저 확인할 것.**
