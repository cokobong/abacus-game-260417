# Relic Storage UI Asset Integration — 2026-09-11

## 신규 에셋 조사

`_asset_pipeline/inbox`의 신규 PNG 18개를 확인했다. 모든 파일은 alpha 채널과 투명 모서리를 가지며, 카드/제단 계열은 1448×1086이다.

| 그룹 | 수량 | 크기 | 용도 |
|---|---:|---|---|
| 지역 카드 배경 | 5 | 1448×1086 | 보관소 지역별 카드 배경 |
| 카드 프레임 | 2 | 1448×1086 | 공통 프레임, 선택 프레임 |
| 상태 배지 | 2 | 1536×1024 | 완료, 미완성 |
| 지역 제단 | 5 | 1448×1086 | 상세 화면 유물 전시 배경 |
| 슬롯 프레임 | 1 | 2172×724 | 부품 5개 공통 슬롯 |
| 단일 슬롯 | 1 | 1254×1254 | 향후 개별 부품 강조용 |
| 상태 효과 | 2 | 1254×1254 | 복원 중 오라, 복원 완료 광채 |

## 최종 경로

```text
src/assets/adventure/relics/ui/
  cards/   # 지역 카드 배경 5종
  frames/  # 공통/선택 카드 프레임
  badges/  # 완료/미완성 배지
  altars/  # 지역 제단 5종
  slots/   # 5슬롯/단일 슬롯 프레임
  effects/ # 복원 중/완료 효과
```

에셋 import와 지역별 연결의 source는 `src/assets/adventure/relics/index.ts`의 `regionalRelicUiAssets`다.

## 메인 유물보관소 적용

`AdventureMapScreen.tsx`의 `RelicVault`에서 지역 ID별 카드 배경을 연결한다. 공통 프레임은 모든 카드에 표시하며, 선택 프레임은 hover/focus/active 동안만 표시한다. `relic.completed`에 따라 자체 한글 문구가 포함된 완료/미완성 이미지 배지를 선택하므로 코드 상태 문구는 중복 표시하지 않는다. 기존 유물 실루엣/완성 이미지, 진행 diamond, 카드 클릭 동작은 유지한다.

## 유물 상세 적용

`RelicDetail`의 전시 영역은 지역 ID별 제단을 배경 장식으로 사용하고 유물 이미지를 foreground에 둔다. 미복원 상태에는 `08_relic_restore_orb_aura.png`, `completed === true`에는 `09_relic_restore_complete_glow.png`를 표시한다. 5/5 복원 전에는 완성 유물 미리보기를 유지하며 오라 강도만 높인다.

5슬롯 프레임을 UI base로 사용하고 실제 부품 이미지를 슬롯 중심 `12.4%, 31.2%, 50%, 68.8%, 87.6%`에 overlay한다. 미획득 부품은 opacity만 낮추고 획득 부품은 원본 색상으로 표시한다. 기존 개별 CSS 카드/테두리는 제거했다.

## Archive 및 미사용

기존 구형 유물보관소 UI pack은 이미 `src/assets/_archive_unused/relics/relic_storage_ui_assets_pack/`에 보관되어 있어 추가 이동하지 않았다. 신규 `07_relic_slot_single_frame.png`는 향후 획득 popup 또는 개별 부품 강조용으로 export만 유지하며 현재 화면에는 사용하지 않는다. 삭제한 에셋은 없다.

## 영향 범위

UI 에셋과 표현 계층만 변경했다. `ownedPartIds`, `completed`, 복원 저장, 세계의 문 완료 계산 및 Stage 1/2/3 게임 로직은 변경하지 않았다. 장식 이미지는 `pointer-events: none`, 제한된 표시 크기와 `object-fit: contain`을 사용하며 blur, 지속 애니메이션, 다중 box-shadow를 사용하지 않는다.
