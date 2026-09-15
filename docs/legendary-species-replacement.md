# 전설종 교체 기록 — 2026-09-09

## 교체 범위

| 지역 key | 제거한 활성 종 ID | 신규 종 ID | 도감 순서 |
| --- | --- | --- | --- |
| volcano-island (화산지대) | volcanodon (불카노돈 등 표기) | magmarex (마그마렉스) | 8 |
| sky-island (고공정원) | starano (스타라노 등 표기) | luminadon (루미나돈) | 16 |

기존 참조는 `data/dinosaurSpecies.ts`의 초안/지역 배치/설명/힌트/식성/이미지 매핑,
`assets/dex/dinosaurs/index.ts`, `config/itemConfig.ts`의 구형 지역 희귀알,
`App.tsx`의 구형 종 ID 별칭, `DinosaurAssetReview.tsx`와 테스트에 있었다.
새 종은 기존 ID의 별칭이 아니며, 기존 종의 소유·발견 상태를 승계하지 않는다.

## 에셋

실제 제공 폴더는 `src/assets/dex/dinosaurs_2`이다 (`dinosaurs/_2`가 아님).
`src/assets/dex/dinosaurs/index.ts`에서 다음 원본을 직접 연결했다. 복사·가공하지 않았다.

- magmarex: `01_baby_magmarex.png`, `02_youth_magmarex.png`, `03_adult_magmarex.png`
- luminadon: `04_baby_luminadon.png`, `05_youth_luminadon.png`, `06_adult_luminadon.png`

성장 이미지 선택은 기존 레벨 기반 공통 로직을 그대로 사용한다.
기존 전설종 PNG는 과거 원본 자료로 디스크에 남지만 활성 도감/성장 매핑에서는 제외했다.
과거 에셋 비교 화면도 현재 도감에 존재하는 종만 표시한다.

## 저장 데이터와 부화

- 기존 정규화 함수가 현재 DB에 없는 owned/discovered ID를 제외한다. 새 ID로 치환하지 않는다.
- `volcano-island-rare`, `secret-land-rare` 별칭도 제거했다. 전체 저장 초기화나 버전 리셋은 없다.
- 선택 중이던 구형 종은 기존 선택 복구 경로를 따른다. 코인·아이템·다른 종·훈련·Stage 진행은 보존한다.
- 구형 지역 희귀알은 기존 희귀알 마이그레이션을 유지하되 제거된 종에 대한 연결은 삭제했다.
- 기존 `legend-egg` 및 구형 알은 새 두 종을 부화 후보로 받지 않는다. 다른 지역 전설종 후보는 유지한다.
- 신규 예약 상품 `magmarex-legend-egg`, `luminadon-legend-egg`만 각 신규 종으로 연결한다.
  두 상품은 판매 목록에 추가하지 않았다. 구형 구매 이력을 새 상품의 구매완료로 해석하지 않는다.
- 도감 총 40종, 지역별 8종 유지. 예전 해당 지역 8종 보유자는 새 종 획득 전 7/8 (87.5%)이다.

## 전설알 조건과 미구현 범위

`src/config/legendaryEggConfig.ts`가 유물조각 2개, 희귀조각 비용 20개,
지역 key 연결 및 신규 지역알 ID를 정의한다. 모든 전설알 가격은 코인 0이다.
`eggPurchaseState.ts`의 지역 조건은 도감 발견 수 대신 **Stage 3 해금 AND 지역 유물조각 2개 이상**을 검사한다.
Stage 3 해금은 기존 저장된 Stage 진행에서 계산해 상점 상세창에 전달한다.

**유물조각 획득/저장 시스템과 지역 선택 구매 흐름은 아직 구현하지 않았다.**
유물 수 입력은 향후 연결용이며 앱에서는 기본 0을 사용한다. 판매 플래그는 false이고,
기존 구매 처리에서도 준비중으로 차단되므로 실제 차감은 발생하지 않는다.
향후 유물 저장과 지역 구매를 구현한 뒤 최신 상태로 조건을 재검증하고 희귀조각만 20개 차감해야 한다.
판매 플래그만 켜서는 안 된다. 이번 작업은 실제 전설알 구매·부화를 개방하지 않는다.

## 검증

- 타입 검사 통과, 테스트 44개 통과, production build 성공 (기존 500kB 청크 경고 존재).
- 격리된 Edge 브라우저: 구형 두 종을 보유한 세이브를 로드해 두 지역 7/8, 신규 종 잠금과 지정 힌트 확인.
- 별도 신규 보유 테스트 데이터: 레벨 1/10/20에서 두 종의 baby/youth/adult PNG 6개 로드 및 표시 확인.
- 상점: 희귀조각 20개 표시, 용암계곡 Stage 3 해금 표시, 고공정원 Stage 3 잠금, 유물 0/2 확인.
- 자동 테스트: 구형 알의 신규 종 부화 차단, 신규 지역알 대상, 유물 0/1/2 경계와 미입력, 가격 설정 확인.
- 실제 사용자 세이브는 건드리지 않았고 푸시·배포하지 않았다.

## 이번 작업 파일

수정:
`src/App.tsx`, `src/assets/dex/dinosaurs/index.ts`, `src/components/DinosaurAssetReview.tsx`,
`src/components/screens/ShopScreen.tsx`, `src/config/itemConfig.ts`,
`src/data/dinosaurSpecies.ts`, `src/data/dinosaurSpecies.test.ts`,
`src/utils/eggPurchaseState.ts`, `src/utils/eggPurchaseState.test.ts`, `src/utils/hatchCandidates.ts`.

생성:
`src/config/legendaryEggConfig.ts`, `src/utils/legendaryReplacement.test.ts`, 이 문서.
사용자 제공 PNG 6장은 위 경로의 기존 파일을 참조했다. 삭제한 파일은 없다.
작업 시작 전에 있던 Stage/대시 수정사항은 보존했으며 이번 교체에서 미니게임 로직은 수정하지 않았다.
