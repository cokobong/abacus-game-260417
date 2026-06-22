# 블루투스 주판 구현 지시서

이 문서는 블루투스 주판 디바이스를 앱에 연결하고, 주판 입력을 문제 풀이 입력값으로 변환하기 위한 구현 기준을 정리한다.

기준 분석 문서: `docs/current-analysis.md`
현재 참고 코드: `src/hooks/useAbacusBLE.ts`, `src/App.tsx`

## 1. 연결 목적

블루투스 주판 연결의 목적은 사용자가 실제 주판으로 계산한 값을 앱에 입력하게 하는 것이다.

- 문제 풀이 화면에서 사용자가 키보드나 화면 버튼 대신 실제 주판을 사용한다.
- 앱은 주판에서 들어오는 notification 데이터를 읽어 현재 입력값으로 표시한다.
- 기기의 OK/확인 신호가 들어오면 현재 입력값을 정답 검사에 사용한다.
- 학습의 중심은 실제 주판 조작 경험이며, 블루투스 연결은 그 조작을 앱 게임 흐름과 연결하는 역할을 한다.

실제 기기 입력 구조:

- 물리 주판에는 별도의 초기화 버튼이나 초기화 완료 신호가 없다.
- 사용자는 손으로 주판알을 직접 움직여 값을 만든다.
- 기기의 리턴/확인 버튼은 현재 주판알 배열값을 앱으로 전송하는 버튼이다.
- 리턴/확인 버튼은 앱 관점에서 `값 전송 + 정답확인` 역할을 한다.
- 앱은 주판 초기화 신호를 기다리면 안 된다.
- 새 문제로 넘어가면 앱 내부 입력값만 비우고 `주판알을 답에 맞게 움직인 뒤 리턴 버튼을 눌러주세요.` 안내를 표시한다.

## 2. 최초 앱 실행 시 사용자 흐름

최초 앱 실행 시에는 바로 문제 풀이 화면으로 들어가지 않고 설정탭에서 주판 연결을 먼저 시도한다.

기본 흐름:

1. 사용자가 앱을 실행한다.
2. 시작 화면에서 `Game Start`를 누른다.
3. 설정탭으로 이동한다.
4. 설정탭 상단에 주판 연결 상태를 표시한다.
5. 사용자가 `주판 연결` 버튼을 누른다.
6. 브라우저의 블루투스 기기 선택 팝업이 열린다.
7. 사용자가 `FLEDU_`로 시작하는 주판 기기를 선택한다.
8. 앱이 GATT 서버, 서비스, 캐릭터리스틱에 연결한다.
9. notification 수신을 시작한다.
10. 연결 성공 시 `연결됨: {device.name}` 상태를 표시한다.
11. 사용자가 단원, 한 문제당 숫자 개수, 총 문제 수를 고른다.
12. 사용자가 `전투 시작` 또는 이후 UI의 학습 시작 버튼을 누른다.
13. 문제 풀이 화면에서 사용자가 주판알을 답에 맞게 움직이고 리턴 버튼을 누르면, 앱은 수신된 값을 현재 문제의 답으로 반영하고 즉시 정답을 검사한다.

개발 및 테스트 흐름:

- 실제 기기가 없을 때는 `더미 연결` 기능으로 입력 흐름을 테스트한다.
- 더미 연결은 Bluetooth API를 호출하지 않고 앱 내부 상태만 연결된 것처럼 만든다.
- 더미 입력은 숫자 표시, 정답 검사, 결과 처리 UI 검증에 사용한다.

## 3. 브라우저/Web Bluetooth 제약사항

Web Bluetooth는 브라우저와 실행 환경 제약이 크므로 구현 시 아래 조건을 전제로 한다.

- HTTPS 환경 또는 `localhost`에서만 동작한다.
- 사용자의 명시적인 클릭 같은 user gesture 안에서만 `navigator.bluetooth.requestDevice()`를 호출할 수 있다.
- 브라우저 기기 선택 팝업은 앱이 자동으로 건너뛸 수 없다.
- 지원 브라우저가 제한된다. Chrome/Edge 계열을 우선 지원 대상으로 둔다.
- iOS Safari 지원 여부는 제한적이므로 TODO: 실제 목표 기기에서 확인한다.
- Android Chrome 지원 여부는 기기와 OS 정책에 따라 달라질 수 있으므로 TODO: 실제 목표 기기에서 확인한다.
- Web Bluetooth 권한은 브라우저/프로필/기기 상태에 따라 초기화될 수 있다.
- 연결된 기기가 절전, 거리, 배터리, 다른 앱 연결 등으로 끊길 수 있다.
- 배포 환경에서는 `https://`가 필요하다. 단, 개발 중 `http://localhost`는 허용된다.

구현 전 체크:

- `navigator.bluetooth` 존재 여부를 확인한다.
- 미지원 브라우저에서는 연결 버튼을 비활성화하거나 안내 문구를 표시한다.
- Bluetooth 권한 오류, 사용자의 기기 선택 취소, GATT 연결 실패를 각각 다른 상태 메시지로 표시한다.

## 4. UUID와 notification 구조

현재 코드 기준 블루투스 연결 값은 다음과 같다.

```ts
const SERVICE_UUID = "674219bc-d86b-4b65-8ea4-9c3e64b857c8";
const CHAR_UUID = "329c75cc-17ff-4de5-affd-69c80311a66f";
```

기기 검색 조건:

```ts
filters: [{ namePrefix: "FLEDU_" }],
optionalServices: [SERVICE_UUID]
```

연결 순서:

1. `navigator.bluetooth.requestDevice()`로 기기를 선택한다.
2. `selectedDevice.gatt.connect()`로 GATT 서버에 연결한다.
3. `server.getPrimaryService(SERVICE_UUID)`로 서비스를 가져온다.
4. `service.getCharacteristic(CHAR_UUID)`로 입력 캐릭터리스틱을 가져온다.
5. `characteristic.startNotifications()`를 호출한다.
6. `characteristicvaluechanged` 이벤트를 구독한다.

notification 이벤트 처리:

```ts
const value = event.target.value;
const data = new Uint8Array(value.buffer);
```

현재 코드에서 사용하는 데이터 위치:

| 값 | 위치 | 의미 |
| --- | ---: | --- |
| 십의 자리 raw code | `data[7]` | 주판 십의 자리 상태 |
| 일의 자리 raw code | `data[8]` | 주판 일의 자리 상태 |
| 확인 신호 후보 | `data[data.length - 1]` | 리턴/확인 버튼 신호 |

현재 리턴/확인 판정:

```ts
const lastByte = data[data.length - 1] ?? 0x00;
const isConfirmed = lastByte === 0x01;
```

TODO:

- 실제 notification packet 길이를 기기별로 기록한다.
- 리턴/확인 버튼이 항상 마지막 바이트 `0x01`인지 실기 테스트로 확인한다.
- 리턴/확인 버튼을 누른 뒤 release packet이 따로 오는지 확인한다.
- 십의 자리/일의 자리 외에 백의 자리 이상을 지원하는지 확인한다.
- 음수 입력, 지우기 버튼 등이 별도 신호로 존재하는지 확인한다.

## 5. 키 배열과 raw input 변환 규칙

현재 구현은 두 자리 숫자 입력을 기준으로 한다.

앱 내부 입력 타입:

```ts
interface AbacusData {
  tens: number;
  ones: number;
  number: number;
  rawHex: string;
  isConfirmed: boolean;
}
```

raw byte를 숫자로 변환하는 현재 매핑:

| raw byte | 숫자 |
| --- | ---: |
| `0x1F` | 0 |
| `0x17` | 1 |
| `0x13` | 2 |
| `0x11` | 3 |
| `0x10` | 4 |
| `0x0F` | 5 |
| `0x07` | 6 |
| `0x03` | 7 |
| `0x01` | 8 |
| `0x00` | 9 |

변환 규칙:

```ts
const tensCode = data[7] ?? 0x1F;
const onesCode = data[8] ?? 0x1F;

const tens = mapDigit(tensCode);
const ones = mapDigit(onesCode);
const number = tens * 10 + ones;
```

앱 내부 입력값 규칙:

- `data[7]`을 십의 자리로 변환한다.
- `data[8]`을 일의 자리로 변환한다.
- 최종 입력값은 `tens * 10 + ones`로 계산한다.
- 알 수 없는 raw byte는 `-1`로 변환한다.
- `-1`이 포함된 입력은 유효하지 않은 입력으로 처리해야 한다.
- raw packet은 디버깅을 위해 `AA-BB-CC` 형식의 대문자 hex 문자열로 저장한다.

raw hex 생성 규칙:

```ts
const rawHex = Array.from(data)
  .map(v => v.toString(16).padStart(2, "0").toUpperCase())
  .join("-");
```

TODO:

- 실제 주판 키 배열이 십의 자리/일의 자리 순서와 항상 일치하는지 검증한다.
- 0 입력 상태가 `0x1F`로 고정되는지 확인한다.
- 세 자리 이상 입력이 필요하면 `hundreds`, `thousands` 위치를 추가 조사한다.
- 소수, 음수, 자리 올림 표시가 필요한지 학습 범위에 따라 결정한다.

## 6. 연결 실패, 연결 해제, 재연결 처리

연결 상태는 최소한 아래 상태를 구분한다.

| 상태 | 의미 | UI 처리 |
| --- | --- | --- |
| `idle` | 연결 전 | 연결 버튼 표시 |
| `requesting` | 기기 선택 중 | 연결 중 표시 |
| `connecting` | GATT 연결 중 | 버튼 중복 클릭 방지 |
| `connected` | notification 수신 가능 | 연결됨 표시, 연결 해제 버튼 표시 |
| `disconnected` | 연결이 끊김 | 재연결 버튼 표시 |
| `error` | 연결 실패 | 오류 메시지와 재시도 버튼 표시 |

현재 코드의 상태 메시지:

- `연결 대기 중`
- `기기 찾는 중...`
- `연결 중...`
- `연결됨: {device.name}`
- `연결 끊김`
- `연결 해제됨`
- `오류: {error.message}`

연결 실패 처리:

- 사용자가 브라우저 팝업에서 취소하면 앱을 중단하지 않고 설정탭에 머문다.
- `navigator.bluetooth`가 없으면 Web Bluetooth 미지원 상태를 표시한다.
- 서비스 UUID 또는 캐릭터리스틱 UUID를 찾지 못하면 UUID 확인이 필요하다는 오류를 표시한다.
- notification 시작 실패 시 연결된 것처럼 처리하지 않는다.

연결 해제 처리:

- 사용자가 `연결 해제`를 누르면 `device.gatt.disconnect()`를 호출한다.
- `gattserverdisconnected` 이벤트가 발생하면 `isConnected`를 `false`로 바꾼다.
- 연결 해제 후 기존 `lastData`를 유지할지 초기화할지는 화면 정책으로 정한다.
- TODO: 연결 해제 시 `characteristicvaluechanged` 이벤트 리스너 제거 여부를 코드에서 명시한다.

재연결 처리:

- 수동 재연결을 1차 구현 기준으로 한다.
- 끊김 상태에서 `주판 다시 연결` 버튼을 보여준다.
- 같은 `BluetoothDevice` 객체가 남아 있고 GATT 연결만 끊긴 경우 `device.gatt.connect()` 재시도를 고려한다.
- 브라우저 권한이나 기기 선택 상태가 사라진 경우 다시 `requestDevice()`를 호출한다.
- 자동 재연결은 기기별 안정성을 확인한 뒤 후순위로 둔다.

TODO:

- 동일 기기 재연결이 브라우저별로 안정적으로 가능한지 확인한다.
- 연결 끊김 후 notification listener가 중복 등록되지 않도록 테스트한다.
- 장시간 유휴 상태에서 기기가 절전으로 끊기는지 확인한다.

## 7. 초기 구현 범위

초기 구현은 기능을 작고 검증 가능하게 제한한다.

필수 범위:

- 설정탭에서 주판 연결 버튼 제공
- `FLEDU_` namePrefix 기기 검색
- 현재 서비스 UUID/캐릭터리스틱 UUID로 연결
- notification 구독
- `data[7]`, `data[8]` 기반 두 자리 숫자 입력
- raw hex 디버그 표시
- 리턴/확인 신호 수신 시 `isConfirmed` true 처리
- 연결 실패/해제 상태 메시지 표시
- 더미 연결 및 더미 숫자 입력 유지

초기 범위에서 제외:

- 자동 재연결
- 여러 주판 동시 연결
- 세 자리 이상 입력
- 음수 입력
- 브라우저별 고급 권한 복구
- 기기 펌웨어 버전별 packet 자동 판별
- 문제 풀이 화면 외 다른 화면에서의 주판 입력 사용

초기 구현 완료 기준:

- Chrome 또는 Edge의 `localhost` 환경에서 실제 주판 연결이 된다.
- 주판 조작 시 앱에 현재 숫자가 표시된다.
- raw hex가 디버그 영역에 표시된다.
- 리턴/확인 버튼을 누르면 현재 숫자가 정답 검사 함수로 전달된다.
- 연결 해제 시 UI가 연결 끊김 상태로 바뀐다.
- 더미 연결로 실제 기기 없이도 문제 풀이 흐름을 테스트할 수 있다.

## 8. 문제 풀이 화면과 연결하는 단계

문제 풀이 화면은 두 가지 정답 입력 방식을 지원한다.

- 블루투스 주판 입력
- 화면 키패드 입력

블루투스 주판이 연결되어 있어도 화면 키패드는 예비 입력 수단으로 유지한다.
단, 두 입력 방식이 정답 판정 로직을 각각 직접 호출하면 중복 제출과 늦은 이벤트 문제가 생길 수 있으므로 모든 입력은 공통 `InputController`를 거쳐 처리한다.

### 기본 입력 흐름

블루투스 주판 입력:

1. 아이가 물리 주판에서 정답 값을 만든다.
2. 아이가 주판의 리턴/확인 버튼을 누른다.
3. 앱은 notification에서 현재 주판 값을 읽는다.
4. 앱은 현재 주판 값을 정답 입력칸에 자동 반영한다.
5. 앱은 방금 수신한 값을 직접 정답 확인 함수에 전달한다.
6. 앱은 화면의 `입력` 버튼을 누른 것과 동일한 채점 로직을 실행한다.

화면 키패드 입력:

1. 블루투스 주판을 사용할 수 없거나 보조 입력이 필요할 때 화면 키패드를 사용한다.
2. 숫자 버튼을 누르면 정답 입력칸의 값만 변경한다.
3. 사용자가 화면의 `입력` 버튼을 누르면 정답을 제출한다.

### InputController 책임

`InputController`는 입력값 변경과 정답 제출을 한곳에서 관리하는 계층이다.
문제 풀이 로직과 블루투스 연결 로직을 직접 결합하지 않고, 둘 사이에 입력 컨트롤러를 둔다.

권장 인터페이스:

```ts
type AnswerSource = "bluetooth" | "keypad" | "keyboard";

interface InputController {
  answer: string;
  isSubmitting: boolean;
  isCorrect: boolean;
  submittedQuestionIndex: number | null;
  setAnswer(value: string): void;
  appendDigit(digit: string): void;
  clearAnswer(): void;
  submitAnswer(source: AnswerSource, answerOverride?: string): void;
}
```

역할 분리:

- `setAnswer(value)`는 정답 입력칸의 값을 교체한다.
- `appendDigit(digit)`는 화면 키패드 숫자를 현재 입력값 뒤에 붙인다.
- `clearAnswer()`는 현재 입력값을 삭제한다.
- `submitAnswer(source, answerOverride?)`는 현재 입력값 또는 명시적으로 전달된 값을 문제 풀이 로직에 제출한다.
- `source`는 `bluetooth`, `keypad`, `keyboard` 등으로 구분한다.
- 블루투스 훅은 raw packet과 변환된 숫자, 확인 여부만 제공한다.
- 문제 풀이 로직은 `submitAnswer`를 통해 들어온 값만 정답 판정에 사용한다.

### 충돌 방지 원칙

- 블루투스 입력과 화면 키패드 입력은 각각 정답 판정 로직에 직접 연결하지 않는다.
- 모든 입력은 공통 `InputController`를 거쳐 처리한다.
- `setAnswer(value)`와 `submitAnswer(source)`를 분리한다.
- 블루투스 리턴/확인 입력은 `setAnswer(value)` 후 `submitAnswer("bluetooth", value)`를 실행한다.
- Bluetooth 리턴/확인 수신 직후에는 React state 반영을 기다리지 말고 방금 파싱한 값을 직접 제출 함수에 넘긴다.
- `setAnswer(value)` 직후 `answer` state를 다시 읽어 채점하면 이전 값으로 오답 처리될 수 있다.
- 화면 키패드는 숫자 입력 시 `setAnswer` 또는 `appendDigit`만 실행한다.
- 화면 키패드는 사용자가 `입력` 버튼을 눌렀을 때만 `submitAnswer("keypad")`를 실행한다.
- 정답 제출 중에는 `isSubmitting` 상태로 추가 입력을 무시한다.
- 오답 후에는 같은 문제에서 다시 시도할 수 있어야 한다.
- 정답 완료 상태에서만 중복 보상과 중복 채점을 막는다.
- `currentQuestionIndex`와 입력 이벤트를 연결하여, 다음 문제로 넘어간 뒤 늦게 도착한 블루투스 입력은 무시한다.
- 블루투스 연결 상태에서도 화면 키패드는 보조 입력 수단으로 유지한다.

권장 이벤트 처리:

```ts
function handleBluetoothConfirm(event: BluetoothAnswerEvent) {
  if (event.questionIndex !== currentQuestionIndex) return;
  if (inputController.isCorrect) return;

  inputController.setAnswer(String(event.value));
  inputController.submitAnswer("bluetooth", String(event.value));
}

function handleKeypadDigit(digit: string) {
  if (inputController.isSubmitting) return;

  inputController.appendDigit(digit);
}

function handleKeypadSubmit() {
  if (inputController.isSubmitting) return;

  inputController.submitAnswer("keypad");
}

function handleKeyboardSubmit() {
  if (inputController.isSubmitting) return;

  inputController.submitAnswer("keyboard");
}
```

제출 처리 기준:

- `submitAnswer`는 현재 문제 상태가 입력 가능할 때 동작한다.
- 오답이면 같은 문제에 머물며 다음 입력을 다시 받을 수 있다.
- 새 Bluetooth 숫자값 또는 리턴/확인값이 들어오면 기존 오답 피드백을 초기화하고 새 값으로 다시 채점한다.
- 정답이면 짧은 정답 피드백 후 다음 문제로 자동 이동한다.
- 정답 처리 후 다음 문제로 넘어갈 때 `answer`, 피드백 메시지, 제출 상태, confirm debounce/guard 상태를 초기화한다.
- 이미 정답 완료된 문제라면 이후 들어온 같은 리턴/확인 신호와 키패드 제출을 무시한다.

### 초기 구현 범위

- 블루투스가 연결되어 있어도 화면 키패드는 예비 입력 수단으로 유지한다.
- 두 입력 방식 모두 공통 `submitAnswer` 함수를 통해서만 정답 판정을 실행한다.
- 문제 풀이 로직과 블루투스 연결 로직을 직접 결합하지 않고 입력 컨트롤러 계층을 둔다.
- 1차 구현에서는 `AnswerSource`를 기록하되, 보상 차등에는 사용하지 않는다.
- 입력 source는 디버깅, 로그, UX 개선을 위해 남겨둘 수 있다.

문제 풀이 화면 연동은 단계적으로 진행한다.

### 1단계: 설정탭 연결

- 설정탭에서만 Bluetooth 연결을 시작한다.
- 문제 풀이 화면 진입 전 연결 상태를 확인한다.
- 연결되지 않아도 더미 모드나 수동 입력으로 개발 테스트가 가능하게 한다.

### 2단계: 입력값 표시

- 문제 풀이 화면에 현재 주판 입력값을 표시한다.
- `lastData.number`를 화면의 현재 답안으로 사용한다.
- `lastData.rawHex`, `tens`, `ones`는 개발 모드 또는 하단 디버그 영역에만 표시한다.

### 3단계: 확인 신호 처리

- `lastData.isConfirmed === true`가 되면 notification payload에서 숫자를 파싱한다.
- 파싱된 숫자를 정답 입력칸에 반영하고, 같은 값을 `submitAnswer("bluetooth", value)`로 즉시 전달한다.
- 같은 리턴/확인 packet이 아주 짧은 시간 안에 반복 처리되지 않도록 debounce 또는 processed flag를 둔다.
- debounce는 같은 raw/hex payload의 짧은 반복만 막아야 하며, 오답 후 새 값으로 다시 누른 리턴/확인은 정상 처리해야 한다.
- 현재 코드에는 120ms 입력 throttle이 있다. 이 값은 실기 반응성을 보며 조정한다.

### 4단계: 문제 상태와 동기화

- 문제 풀이 상태가 `input`일 때만 `submitAnswer`를 허용한다.
- 결과 연출 중이거나 다음 문제 생성 중에는 notification은 받되 정답 검사는 하지 않는다.
- 새 문제가 시작될 때 이전 OK 신호가 남아 다음 문제를 즉시 제출하지 않도록 주의한다.
- 블루투스 입력 이벤트에는 현재 문제 번호인 `currentQuestionIndex`를 함께 연결한다.
- 이벤트의 문제 번호가 현재 문제 번호와 다르면 늦게 도착한 입력으로 보고 무시한다.
- 새 문제 시작 시 앱 내부 입력값은 비우지만, 물리 주판의 초기화 신호를 기다리는 상태를 만들지 않는다.
- 새 문제에서는 사용자가 주판알을 새 답에 맞게 움직인 뒤 리턴 버튼을 누르면 그때 들어온 값을 현재 문제 답안으로 사용한다.

### 5단계: 보상/결과 화면 연동

- 정답/오답 처리는 기존 문제 풀이 로직에 맡긴다.
- 블루투스 훅은 입력값과 확인 신호만 제공하고, 정답 판정은 `InputController` 이후의 공통 제출 흐름에서 처리한다.
- 20문제 세트 결과에는 총 풀이 시간, 정답 수, 정확도, 속도 보너스가 반영된다.
- 블루투스 연결 여부 자체는 보상을 직접 바꾸지 않는다.

## 9. 구현 시 주의사항

- UUID, 데이터 위치, 숫자 변환 테이블은 실제 기기와 강하게 연결되어 있으므로 변경 전 raw packet 로그를 먼저 확보한다.
- Bluetooth 연결 로직은 React 화면 컴포넌트와 분리된 훅으로 유지한다.
- 문제 풀이 로직은 `number`와 `isConfirmed`만 알면 되도록 유지한다.
- Bluetooth listener가 오래 살아 있을 수 있으므로, React state closure가 오래된 `answer`, `currentProblem`, `submissionResult`를 참조하지 않도록 주의한다.
- Bluetooth 리턴/확인 자동 채점은 방금 수신한 parsed value를 직접 사용하고, 현재 문제 정답과 정답 완료 상태도 최신 값을 참조해야 한다.
- 기기별 예외가 생기면 `decodeAbacusPacket(data)` 같은 순수 함수로 분리해 테스트할 수 있게 한다.
- raw packet 샘플을 문서나 테스트 fixture로 남겨두면 이후 리팩터링 때 안전하다.

## 10. 남은 확인 항목

- TODO: 실제 기기 이름 prefix가 항상 `FLEDU_`인지 확인한다.
- TODO: 서비스 UUID가 모든 보유 기기에서 동일한지 확인한다.
- TODO: 캐릭터리스틱 UUID가 모든 보유 기기에서 동일한지 확인한다.
- TODO: packet 길이와 각 byte 위치를 raw log로 확정한다.
- TODO: 리턴/확인 버튼 raw 값과 release raw 값을 분리해서 확인한다.
- TODO: 세 자리 이상 주판 모델이 있는지 확인한다.
- TODO: 목표 브라우저와 목표 OS 지원 범위를 확정한다.
