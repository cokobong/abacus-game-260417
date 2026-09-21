# Relic Asset Integration — 2026-09-11

## 조사 결과

`_asset_pipeline/inbox`에서 `.gitkeep`을 제외한 PNG 55개를 확인했다. 모든 PNG가 alpha 채널을 가지며 파일별 크기와 실제 이미지를 그룹 단위로 확인했다.

| 그룹 | 수량 | 원본 크기 | 분류 |
|---|---:|---|---|
| 완성 유물 | 5 | 1254×1254 | 적용 |
| 유물 실루엣 | 5 | 1024×1536 | 적용 |
| 용암·하늘 부품 | 10 | 1254×1254 | 적용 |
| 유적·심해 부품 | 10 | 1254×1254 | 적용 |
| 얼음 부품 | 5 | 1254×1254 | 적용 |
| 유물 보관소 UI pack | 8 | 1254×1254~2172×724 | archive |
| 월드게이트 UI repack | 8 | 1086×1448~2172×724 | archive |
| 월드게이트 transparent pack | 4 | 1254×1254~1448×1086 | archive |

SHA-256 기준 동일 파일 중복은 없었다. 다만 UI pack은 현재 CSS 카드/월드게이트 구조와 기능적으로 겹치므로 이번 범위에서는 연결하지 않았다.

## 실제 적용 및 최종 경로

- 완성 유물: `src/assets/adventure/relics/completed/{lava,sky,ruins,deep-sea,ice}/`
- 실루엣: `src/assets/adventure/relics/silhouettes/{lava,sky,ruins,deep-sea,ice}/`
- 부품: `src/assets/adventure/relics/parts/{lava,sky,ruins,deep-sea,ice}/`
- 중앙 asset export: `src/assets/adventure/relics/index.ts`

완성 유물과 실루엣은 config의 `relicId` 이름으로 정규화했다. 부품은 `REGIONAL_RELIC_COMPONENT_SYSTEM.md`의 part ID를 파일명으로 사용한다. 총 35개를 이동·rename했다.

## 특이 rename 대응

다음 생성 파일은 최종 부품 정의와 이름이 정확히 일치하지 않아 실제 비주얼을 확인한 뒤 가장 가까운 슬롯에 연결했다.

| 원본 | 적용 ID | 비고 |
|---|---|---|
| `04_volcano_altar_ring.png` | `flame_core` | 불꽃과 용암 동력부를 표현하는 임시 대응 |
| `10_sky_crown_emblem.png` | `sky_crystal` | 푸른 수정 중심 장식 |
| `07_sky_wing_ornament_a.png` | `sky_wings` | 날개 본체 |
| `08_sky_wing_ornament_b.png` | `wind_core` | 바람 효과가 포함된 임시 대응 |

## UI 적용 위치

- 유물 보관소 카드: 미완성은 지역 실루엣, 복원 완료는 완성 유물 이미지
- 유물 상세 전시: 0~4/5 실루엣, 5/5 복원 전 완성 이미지를 dimmed 처리, 복원 후 풀컬러
- 부품 슬롯: 미획득 이미지는 grayscale/낮은 opacity, 획득 이미지는 원본 컬러와 이름
- Stage 3 결과: 획득한 실제 부품 이미지, 부품명, 용암계곡, 현재 진행도 표시

## 미사용 및 archive

다음 20개 inbox UI 에셋을 삭제하지 않고 `src/assets/_archive_unused/relics/` 아래 원래 pack 단위로 이동했다.

- `relic_storage_ui_assets_pack/*` 8개
- `adventure_world_gate_ui_assets_repack/*` 8개
- `world_gate_transparent_assets/*` 4개

기존 단일 조각 이미지 `src/assets/adventure/lava-valley/05_stage3_relic_fragment.png`도 같은 archive에 이동하고 코드 export를 제거했다. archive 총 21개다.

## 추가로 필요한 에셋

- 최종 정의와 더 정확히 일치하는 용암 `flame_core` 전용 이미지
- 최종 정의와 더 정확히 일치하는 하늘 `wind_core` 전용 이미지
- 필요 시 1~4/5 중간 조립 상태 이미지. 현재는 실루엣을 유지하므로 필수는 아니다.

대형 원본은 CSS `object-fit`과 고정 표시 크기로 제한했다. 지속 애니메이션이나 blur는 추가하지 않았다.
