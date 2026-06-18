# 기존 주산게임 분석

## 1. 프로젝트 개요

이 프로젝트는 기존에 만든 주산게임 초안으로, `Vite + React + TypeScript + Tailwind CSS` 기반의 웹앱이다.

앱의 핵심 콘셉트는 사용자가 주판으로 계산 문제를 풀고, 정답이면 플레이어 캐릭터가 보스를 공격하는 전투형 학습 게임이다.

현재 기획 기준에서 이 앱은 초기에는 일반 모바일 앱이 아니라 터치 기능이 있는 노트북에서 고정적으로 실행하는 브라우저 기반 로컬 웹앱으로 본다.
로컬 개발은 `localhost`, 배포는 Netlify 또는 유사한 HTTPS 웹 배포 환경을 우선하며, 추후 PWA 형태로 설치형 앱처럼 확장할 수 있다.

전체적으로 보면 앱은 크게 세 부분으로 나뉜다.

- React 화면과 게임 상태 관리
- 주판 Bluetooth 연결 및 입력 처리
- 문제 생성 로직
- 브라우저 로컬 저장과 앱 재실행 후 상태 복원

현재 구조에서는 `src/App.tsx` 한 파일에 화면 구성, 게임 진행, 사운드, 애니메이션, 이미지 연결이 많이 모여 있다. 그래서 초안 단계에서는 이해하기 쉽지만, 기능이 커지면 파일을 나누는 작업이 필요할 수 있다.

## 2. 실행 방식

실행 관련 정보는 `package.json`에 들어 있다.

주요 명령어는 다음과 같다.

```bash
npm run dev
```

개발 서버를 실행하는 명령어다. `package.json` 기준으로 Vite가 3000번 포트에서 실행된다.

```bash
npm run build
```

배포용 파일을 만드는 명령어다.

```bash
npm run lint
```

현재 설정에서는 TypeScript 타입 검사를 실행한다.

프로젝트는 브라우저에서 실행되는 프론트엔드 앱이며, `index.html`에서 시작해 `src/main.tsx`가 React 앱을 화면에 붙인다.

초기 사용 환경은 터치 노트북의 Chrome/Edge 계열 브라우저를 우선한다.
Web Bluetooth는 `localhost` 또는 HTTPS 환경에서 동작하므로, 실제 주판 연결 테스트도 이 조건을 기준으로 한다.

## 3. 주요 파일 구조

현재 주요 파일 구조는 다음과 같다.

```text
abacus-game-260417/
├─ index.html
├─ package.json
├─ vite.config.ts
├─ tsconfig.json
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx
│  ├─ index.css
│  ├─ hooks/
│  │  └─ useAbacusBLE.ts
│  └─ utils/
│     └─ problemGenerator.ts
└─ public/
   ├─ title_image.png
   ├─ battle_bg.png
   ├─ player_idle.png
   ├─ player_attack.png
   ├─ player_hit.png
   ├─ player_win.png
   ├─ boss_idle.png
   ├─ boss_attack.png
   ├─ boss_hit.png
   ├─ boss_win.png
   ├─ title_bgm.mp3
   ├─ player_attack.mp3
   ├─ boss_attack.mp3
   ├─ dino_idle.mp3
   └─ dino_win.mp3
```

각 파일의 역할은 다음과 같다.

- `src/main.tsx`: React 앱의 시작점이다.
- `src/App.tsx`: 화면, 게임 상태, 정답 처리, 오답 처리, 애니메이션, 사운드 연결을 대부분 관리한다.
- `src/index.css`: Tailwind CSS를 불러온다.
- `src/hooks/useAbacusBLE.ts`: 실제 주판 기기와 Bluetooth로 연결하고 입력값을 읽는다.
- `src/utils/problemGenerator.ts`: 주산 문제를 생성한다.
- `public/`: 이미지와 사운드 파일이 들어 있다.
- `vite.config.ts`: Vite, React, Tailwind 설정이 들어 있다.
- `package.json`: 실행 명령어와 외부 라이브러리 목록이 들어 있다.

`node_modules/`는 설치된 외부 라이브러리 폴더이므로 직접 수정하지 않는 것이 좋다.

## 4. 게임 진행 방식

게임은 `src/App.tsx`의 상태값을 중심으로 진행된다.

앱 전체 화면 단계는 `appPhase`가 관리한다.

```ts
'title' | 'setup' | 'battle'
```

각 단계의 의미는 다음과 같다.

- `title`: 시작 화면
- `setup`: 주판 연결, 단원 선택, 문제 수 선택 화면
- `battle`: 실제 전투 게임 화면

전투 안에서의 진행 상태는 `gameState`가 관리한다.

```ts
'idle' | 'input' | 'result'
```

기본 흐름은 다음과 같다.

1. 사용자가 시작 화면에서 `Game Start`를 누른다.
2. 설정 화면에서 주판 연결, 단원, 문제 숫자 개수, 총 문제 수를 고른다.
3. 전투 시작 버튼을 누르면 새 게임이 시작된다.
4. `generateChapterProblem`으로 문제가 생성된다.
5. 사용자가 주판으로 답을 입력한다.
6. OK 버튼 또는 실제 기기의 확인 신호가 들어오면 정답을 검사한다.
7. 정답이면 플레이어가 공격하고 점수가 오른다.
8. 오답이면 보스가 공격하고 플레이어 HP가 줄어든다.
9. 정해진 문제 수를 풀거나 보스 HP가 0이 되면 결과 화면으로 넘어간다.

주요 함수는 `src/App.tsx`에 있다.

- `nextProblem`: 다음 문제를 만든다.
- `startNewGame`: 새 게임을 초기화한다.
- `handleCorrect`: 정답일 때 처리한다.
- `handleWrong`: 오답일 때 처리한다.
- `checkAnswer`: 현재 입력값과 문제 정답을 비교한다.

입력 우선순위는 다음 방향으로 잡는다.

1. 블루투스 주판 입력
2. 터치 화면 키패드 입력
3. 마우스 입력
4. 키보드 입력은 개발/보조용

기본 학습 흐름에서는 블루투스 주판이 주 입력 장치이며, 화면 키패드는 터치 노트북에서 사용할 수 있는 예비 입력 수단으로 둔다.

## 5. 문제 생성 로직

문제 생성은 `src/utils/problemGenerator.ts`의 `generateChapterProblem` 함수가 담당한다.

이 함수는 두 값을 받는다.

- `chapter`: 선택한 단원
- `termCount`: 문제에 나올 숫자의 개수

반환값은 `Problem` 형태다.

```ts
{
  chapter,
  terms,
  answer,
  description
}
```

`terms`는 문제에 나오는 숫자 목록이다. 예를 들어 `terms`가 `[4, 6, -2]`라면 화면에는 세로 계산식처럼 표시되고, 정답은 `8`이 된다.

현재 문제 생성 방식은 대략 다음과 같다.

1. 선택한 단원에 맞춰 첫 번째 숫자를 만든다.
2. 두 번째 숫자로 선택한 단원 값을 넣는다.
3. 세 번째 숫자부터는 1부터 9 사이의 수를 추가한다.
4. 일정 확률로 더하기 대신 빼기를 만든다.
5. 현재 합계가 0보다 작아지지 않도록 조정한다.

단원별 문제 규칙을 바꾸려면 이 파일을 주로 수정하면 된다.

## 6. 화면 구성

화면 구성은 대부분 `src/App.tsx` 안에 들어 있다.

크게 세 화면으로 구성되어 있다.

- 시작 화면
- 설정 화면
- 전투 화면

시작 화면에서는 `title_image.png`를 보여주고 `Game Start` 버튼을 제공한다.

설정 화면에서는 다음을 고른다.

- 주판 Bluetooth 연결
- 디버그용 더미 기기 연결
- 단원 선택
- 문제에 나올 숫자 개수 선택
- 총 문제 수 선택

전투 화면은 다시 세 영역으로 나뉜다.

- 왼쪽: 현재 문제 표시
- 가운데: 현재 주판 입력값, 정답 보기, 제출 버튼
- 오른쪽: 플레이어와 보스 전투 장면

React 컴포넌트가 별도 파일로 나뉘어 있지 않고 `App.tsx` 안에 모두 들어 있는 형태다. 초보자가 처음 보기에는 한 파일만 보면 되어서 편하지만, 파일이 길어져서 수정할 위치를 찾기 어려울 수 있다.

## 7. 그래픽/스타일 구조

그래픽 파일은 `public/` 폴더에 들어 있다.

대표 이미지 파일은 다음과 같다.

- `title_image.png`: 시작 화면 이미지
- `battle_bg.png`: 전투 화면 배경
- `player_idle.png`: 플레이어 기본 모습
- `player_attack.png`: 플레이어 공격 모습
- `player_hit.png`: 플레이어가 맞는 모습
- `player_win.png`: 플레이어 승리 모습
- `boss_idle.png`: 보스 기본 모습
- `boss_attack.png`: 보스 공격 모습
- `boss_hit.png`: 보스가 맞는 모습
- `boss_win.png`: 보스 승리 모습

대표 사운드 파일은 다음과 같다.

- `title_bgm.mp3`: 시작 화면 배경음악
- `player_attack.mp3`: 플레이어 공격 효과음
- `boss_attack.mp3`: 보스 공격 효과음
- `dino_idle.mp3`: 대기 중 효과음
- `dino_win.mp3`: 승리 효과음

스타일은 대부분 `src/App.tsx`의 `className` 안에 Tailwind CSS 문법으로 작성되어 있다.

예를 들어 배경색, 카드 모양, 글자 크기, 여백, 반응형 크기 등이 `className`에 직접 들어 있다.

`src/index.css`는 현재 Tailwind CSS를 불러오는 역할만 한다.

## 8. 유지할 부분

현재 구조에서 유지하면 좋은 부분은 다음과 같다.

- `problemGenerator.ts`로 문제 생성 로직을 분리해 둔 점
- `useAbacusBLE.ts`로 Bluetooth 연결 로직을 분리해 둔 점
- 이미지와 사운드를 `public/`에 모아 둔 점
- `appPhase`로 화면 단계를 나눈 점
- `gameState`로 전투 진행 상태를 나눈 점
- 더미 기기 연결 기능이 있어 실제 주판 없이도 테스트할 수 있는 점
- 브라우저 기반 구조라 `localhost`, Netlify 배포, PWA 확장으로 이어가기 쉬운 점

특히 더미 기기 기능은 개발할 때 매우 유용하다. 실제 기기 없이도 숫자를 바꾸고 OK 버튼을 시뮬레이션할 수 있기 때문이다.

## 8-1. 로컬 저장과 PWA 확장 전제

1차 버전은 서버 로그인 없이 브라우저 로컬 저장을 사용한다.
설정값, 보유 코인, 현재 공룡 상태, 아이템 보유 상태, 알/알 조각, 부화 진행률, 도감 해금 상태는 앱 재실행 후 복원되어야 한다.

저장 방식은 1차 버전에서는 `localStorage`를 기본으로 두고, 데이터가 커지면 IndexedDB로 확장할 수 있다.
PWA는 초기 필수 구현이 아니라 후속 확장으로 두며, 앱 아이콘, manifest, service worker, 오프라인 캐시는 별도 단계에서 검토한다.

주의할 점:

- 로컬 저장은 같은 브라우저/같은 프로필 기준으로 유지된다.
- 브라우저 사이트 데이터 삭제 시 저장 데이터가 사라질 수 있다.
- 여러 기기 동기화는 1차 범위가 아니며, 필요할 경우 클라우드 저장을 후속으로 검토한다.
- PWA로 설치해도 Web Bluetooth 제약은 브라우저와 OS 정책을 따른다.

## 9. 바꿔도 되는 부분

초보자가 비교적 안전하게 바꿀 수 있는 부분은 다음과 같다.

- 화면에 표시되는 문구
- 버튼 색상, 글자 크기, 여백 같은 Tailwind 클래스
- `public/` 안의 이미지와 사운드 파일
- 총 문제 수 선택 옵션
- 문제에 나올 숫자 개수 선택 옵션
- 정답 시 점수 증가량
- 오답 시 플레이어 HP 감소량
- 보스 HP 감소량

게임 방식을 바꾸고 싶다면 주로 `src/App.tsx`를 수정하게 된다.

문제 생성 방식을 바꾸고 싶다면 주로 `src/utils/problemGenerator.ts`를 수정하게 된다.

그래픽을 바꾸고 싶다면 `public/`의 파일을 교체하거나 `src/App.tsx`에서 이미지 경로를 바꾸면 된다.

다만 파일 이름을 바꿀 때는 `App.tsx`에서 해당 파일을 참조하는 경로도 함께 바꿔야 한다.

## 10. 초보자가 조심해야 할 부분

가장 조심해야 할 부분은 `src/App.tsx`가 많은 역할을 동시에 하고 있다는 점이다.

이 파일에는 다음 내용이 함께 들어 있다.

- 화면 전환
- 게임 상태
- 문제 출제
- 정답 검사
- HP와 점수 계산
- 애니메이션
- 사운드 재생
- 이미지 선택

그래서 작은 수정도 예상치 못한 부분에 영향을 줄 수 있다.

특히 조심해야 할 부분은 다음과 같다.

- `appPhase` 값을 잘못 바꾸면 화면 전환이 꼬일 수 있다.
- `gameState` 값을 잘못 바꾸면 문제가 표시되지 않거나 결과 화면으로 넘어가지 않을 수 있다.
- `handleCorrect`, `handleWrong`, `checkAnswer`는 게임 흐름의 핵심이므로 수정 전후 확인이 필요하다.
- `useAbacusBLE.ts`의 UUID, 데이터 위치, 숫자 변환 로직은 실제 주판 기기와 연결되어 있으므로 함부로 바꾸면 입력이 작동하지 않을 수 있다.
- `public/`의 이미지나 음원 파일 이름을 바꾸면 코드 안의 경로도 같이 바꿔야 한다.
- `node_modules/`는 직접 수정하지 않는다.
- 현재 일부 한글 문구가 깨져 보이는 부분이 있다. 화면 문구를 정리할 때 인코딩과 문자열을 함께 점검하는 것이 좋다.

초보자 입장에서는 한 번에 큰 구조를 바꾸기보다, 작은 변경을 하고 실행해서 확인하는 방식이 안전하다.

추천 수정 순서는 다음과 같다.

1. 화면 문구 정리
2. 이미지와 사운드 교체
3. 문제 생성 규칙 조정
4. 점수와 HP 규칙 조정
5. 필요하면 `App.tsx`를 작은 컴포넌트로 분리
