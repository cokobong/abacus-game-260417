# 범용 이미지 에셋 파이프라인

이미지 생성 작업을 주제와 관계없이 반복해서 정리하는 작업 공간입니다. 게임에서 직접 읽는 에셋 경로가 아니며, 현재는 수동으로 폴더와 CSV를 관리합니다.

## 고정 구조

```text
_asset_pipeline/
  README.md
  inbox/
  review/
  approved/
  archive/
  manifests/
    example_task.csv
```

각 단계의 `.gitkeep`은 빈 폴더를 Git에 유지하기 위한 파일입니다. 카테고리별 폴더를 미리 만들지 않고, 실제 작업이 생길 때 해당 단계 아래에 작업 폴더를 만듭니다.

## 작업 흐름

`inbox → review → approved → archive`

| 단계 | 보관 대상과 처리 |
| --- | --- |
| inbox | 생성하거나 전달받은 원본 이미지. 원본은 덮어쓰지 않습니다. |
| review | 검토할 후보와 배경 제거·크기 조정 등의 파생 이미지. 용도, 스타일, 해상도, 투명 배경, 여백을 확인합니다. |
| approved | 검토를 통과한 최종 후보. 게임 반영 여부는 CSV에서 별도로 관리합니다. |
| archive | 반영을 마친 작업, 폐기 후보, 이전 버전. 삭제 대신 보관하고 이유를 CSV에 기록합니다. |

원본 보존이 필요하면 다음 단계로 **복사**하고, 이전 단계의 파일도 CSV에 남깁니다. 단순 상태 변경이면 **이동**한 뒤 CSV 경로를 갱신합니다. 검토에서 탈락한 파일은 archive로 바로 옮길 수 있습니다. 승인 후 수정이 필요하면 새 리비전을 review에서 다시 검토합니다.

한 작업의 파일이 여러 단계에 동시에 존재할 수 있으며, 모든 단계에서 같은 작업 폴더명을 사용합니다. archive로 옮겨도 게임에 복사한 파일은 그대로 유지합니다. 단계 변경이나 CSV 편집이 게임 파일을 자동으로 변경하지는 않습니다.

## 작업 폴더명 규칙

형식: `YYYY-MM-DD_<topic>_<purpose>_v<number>`

- 날짜는 작업을 시작한 날짜로 고정합니다.
- topic은 작업 주제, purpose는 사용 목적을 짧은 영문 소문자와 숫자로 작성합니다.
- 단어는 `_`로 구분하고 공백과 특수문자는 사용하지 않습니다.
- `v1`, `v2`는 작업 묶음의 버전입니다. 전체 방향을 다시 잡을 때 올립니다.
- 폴더명 전체를 작업 ID로 사용합니다.

예시 경로(실제 작업이 생길 때 생성):

```text
inbox/2026-09-08_deepsea_dex_v1/
review/2026-09-08_deepsea_dex_v1/
approved/2026-09-08_deepsea_dex_v1/
archive/2026-09-08_deepsea_dex_v1/
```

다른 주제에도 `2026-09-08_shop_icons_v1`, `2026-09-08_home_background_v1`처럼 동일한 규칙을 적용합니다. deepsea나 ice_continent 전용 고정 디렉터리는 만들지 않습니다.

## 파일명 규칙

형식: `<asset_id>_<variant>_r<NN>.<ext>`

- asset_id: 대상과 용도를 설명하는 고유 이름. 예: `sea_creature_dex_icon`.
- variant: `original`, `transparent`, `small` 등 이미지의 형태나 용도.
- rNN: 개별 이미지의 리비전. `r01`부터 시작하며 수정본은 번호를 올립니다.
- 영문 소문자, 숫자, `_`를 사용하고 확장자는 실제 파일 형식과 일치시킵니다.
- 예: `sea_creature_dex_icon_transparent_r02.png`.
- 같은 파일을 단계 간 이동할 때 파일명은 유지합니다. `final_final` 같은 이름이나 단계명을 파일명에 덧붙이지 않습니다.
- 생성 서비스의 원래 파일명은 필요하면 CSV의 source_file에 남깁니다.

## 작업 단위 CSV

`manifests/example_task.csv`는 형식 예시이며 실제 이미지나 승인 결과가 아닙니다. 작업 시 복사하여 `manifests/<작업 ID>.csv`로 저장합니다. UTF-8 CSV를 사용하고 값에 쉼표나 줄바꿈이 있으면 큰따옴표로 감쌉니다.

한 행은 특정 단계에 존재하는 파일 하나입니다. 원본과 파생본은 같은 asset_id로 묶되 variant와 revision으로 구분합니다. 파일을 복사하면 행을 추가하고, 이동하면 해당 행의 stage와 file_path를 갱신합니다.

| 열 | 의미 |
| --- | --- |
| task_id | 작업 폴더명과 동일한 작업 ID |
| asset_id | 원본과 파생본을 연결하는 에셋 ID |
| variant | original, transparent 등 파일 형태 |
| revision | r01 등 이미지 리비전 |
| stage | inbox / review / approved / archive |
| file_path | 프로젝트 루트 기준 현재 파일 경로. `/` 구분자 사용 |
| source_file | 원본 파일명 또는 파생본의 출처 경로 |
| width_px, height_px | 실제 이미지의 픽셀 크기. 미확인 시 빈 값 |
| review_status | pending / changes_requested / approved / rejected |
| target_path | 실제 게임 반영 예정 경로. 미정이면 빈 값 |
| integration_status | not_applied / applied / superseded |
| notes | 수정 요청, 승인 근거, 보관 이유, 생성 조건 등 |

archive 단계에서도 review_status는 기존 검토 결과를 유지합니다. approved는 시각 검토 통과를 뜻하며, 게임 반영 완료는 integration_status의 applied로 별도 표시합니다.

## 실제 게임 에셋 반영 원칙

1. 게임 코드에서 `_asset_pipeline` 파일을 직접 import하거나 참조하지 않습니다.
2. approved의 검토 완료 파일만, 별도의 게임 반영 작업에서 기존 `src/assets` 또는 `public` 구조에 맞춰 복사합니다. 작업 폴더 전체를 복사하지 않습니다.
3. 기존 게임 파일명과 경로 규칙을 우선합니다. 원본 보관 이름과 게임용 이름이 다르면 CSV의 target_path로 연결합니다.
4. 기존 파일 교체 전 사용처와 크기·투명도·비율을 확인합니다. 필요 시 이전 이미지를 archive에 보관하고 덮어쓰기를 진행합니다.
5. 게임 화면에서 정상 표시되는지 확인하고 프로젝트 검증 및 빌드를 수행한 뒤 integration_status를 applied로 기록합니다.
6. 반영 완료 작업은 archive로 보관하며, CSV의 file_path를 갱신하고 target_path는 유지합니다. 기존 게임 데이터나 에셋을 정리 목적으로 임의 삭제하지 않습니다.

이 구조 도입 자체에는 게임 로직 변경, 실제 에셋 교체, 자동 이동·생성·배포 기능이 포함되지 않습니다.
