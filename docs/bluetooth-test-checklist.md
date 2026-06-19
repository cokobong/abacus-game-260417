# Bluetooth 테스트 체크리스트

이 문서는 Bluetooth 주산 입력 장치 연결 테스트를 집 PC와 실제 테스트 노트북으로 나누어 정리한다.

현재 목표는 완성형 게임 로직 연결이 아니라, Web Bluetooth 환경 확인과 FLEDU 기기 연결 가능성, notification raw 로그 확보이다.

## 1. 현재 전제

집 데스크톱에서는 Chrome Web Bluetooth가 사용할 수 있는 일반 Bluetooth adapter가 없는 상태로 본다.

확인된 상태:

- `chrome://bluetooth-internals/#adapter`에서 `Initialized=true`, `Present=false`, `Powered=false`
- Windows Bluetooth 설정에 Bluetooth 토글이 보이지 않음
- nRF52 Connectivity는 기타 디바이스로 표시됨
- nRF Connect for Desktop에서는 nRF52 Connectivity 동글을 통해 FLEDU 기기가 보임
- Chrome Web Bluetooth용 일반 Bluetooth adapter로는 nRF52 Connectivity가 인식되지 않는 것으로 판단

따라서 집 PC의 목표는 실제 연결 성공이 아니다.
집 PC에서는 앱이 깨지지 않고 adapter unavailable 안내가 정상적으로 보이는지 확인한다.

최종 실제 연결 테스트는 과거 연결 성공했던 Windows 노트북에서 진행한다.

## 2. 테스트 위치

앱 안에서는 다음 위치에서 테스트한다.

```text
설정
→ 주산 입력 장치 연결 테스트
```

Bluetooth Test 패널은 실제 게임 로직과 분리된 개발자 / 설정 영역이다.
훈련장 보상, 정답 처리, 성장 로직과 직접 연결하지 않는다.

## 3. 집 PC 확인 체크리스트

집 PC에서는 아래 항목만 확인한다.

- 앱이 정상 실행되는가
- 설정 탭이 열리는가
- `주산 입력 장치 연결 테스트` 영역이 보이는가
- Web Bluetooth API 지원 여부가 표시되는가
- `navigator.bluetooth` 존재 여부가 표시되는가
- `navigator.bluetooth.getAvailability()` 결과가 표시되는가
- Chrome / Edge 계열 브라우저 여부가 표시되는가
- 현재 주소가 `localhost` 또는 HTTPS인지 표시되는가
- adapter unavailable 상황에서 아래 안내가 보이는가

```text
현재 Chrome이 사용할 수 있는 Windows Bluetooth 어댑터가 없습니다. nRF52 Connectivity는 nRF Connect용 동글일 수 있으며, Web Bluetooth 테스트에는 일반 Bluetooth 동글 또는 내장 Bluetooth가 필요할 수 있습니다.
```

- 노트북에서 최종 테스트가 필요하다는 안내가 보이는가
- `FLEDU 연결` 버튼을 눌러도 앱 전체가 깨지지 않는가
- 실패 시 `error.name`과 `error.message`가 화면에 표시되는가
- `전체 기기 검색 테스트` 버튼을 눌러도 앱 전체가 깨지지 않는가

집 PC에서 연결 실패는 정상 범위다.

## 4. 노트북 실제 연결 테스트 체크리스트

실제 Bluetooth 연결은 Windows 노트북에서 확인한다.

테스트 전 확인:

- Chrome 또는 Edge 사용
- 앱 주소가 `localhost` 또는 HTTPS인지 확인
- Windows Bluetooth가 켜져 있는지 확인
- Chrome Bluetooth internals에서 adapter가 present / powered 상태인지 확인
- FLEDU 기기의 전원이 켜져 있는지 확인
- FLEDU 기기가 다른 앱에 이미 연결되어 있지 않은지 확인

테스트 절차:

1. 앱을 실행한다.
2. 설정 탭으로 이동한다.
3. `주산 입력 장치 연결 테스트` 영역을 연다.
4. Web Bluetooth API 지원 여부가 정상인지 확인한다.
5. `navigator.bluetooth` 존재 여부가 `true`인지 확인한다.
6. `getAvailability()` 결과가 사용 가능인지 확인한다.
7. `FLEDU 연결` 버튼을 누른다.
8. 브라우저 기기 선택 창에서 `FLEDU`로 시작하는 기기를 선택한다.
9. 연결 성공 시 기기 이름과 device id가 표시되는지 확인한다.
10. GATT connected 상태가 `true`인지 확인한다.
11. notification 로그 영역에 데이터가 들어오는지 확인한다.
12. 주판을 조작했을 때 raw value / hex / text decode 값이 갱신되는지 확인한다.

`FLEDU 연결`이 실패할 경우:

1. `error.name`과 `error.message`를 기록한다.
2. `전체 기기 검색 테스트` 버튼으로 다시 시도한다.
3. 기기 선택 창에 FLEDU가 보이는지 확인한다.
4. acceptAllDevices 방식에서도 실패하면 오류 정보를 기록한다.

## 5. UUID 확인 항목

현재 기본 UUID는 다음 값으로 둔다.

```text
Service UUID: 674219bc-d86b-4b65-8ea4-9c3e64b857c8
Characteristic UUID: 329c75cc-17ff-4de5-affd-69c80311a66f
```

노트북 테스트에서 확인할 항목:

- 위 Service UUID로 primary service를 찾을 수 있는가
- 위 Characteristic UUID로 characteristic을 찾을 수 있는가
- UUID가 다를 경우 어떤 오류가 표시되는가
- 입력창에서 UUID를 변경했을 때 재시도 가능한가

UUID가 확정되기 전까지 이 값은 상수처럼 고정하지 않고, 테스트 패널에서 쉽게 변경 가능한 값으로 유지한다.

## 6. Notification 로그 기록 항목

notification 수신 시 아래 값을 기록한다.

- 테스트 날짜
- 테스트 기기
- 브라우저
- FLEDU 기기 이름
- device id
- raw value
- hex string
- text decode 결과
- 주판에서 실제로 조작한 값
- OK / 확인 버튼을 눌렀는지 여부
- 연결 중간에 끊김이 발생했는지 여부

확인할 세부 항목:

- packet 길이
- 십의 자리 raw byte 위치
- 일의 자리 raw byte 위치
- OK 버튼 신호 위치
- OK 버튼 press / release가 별도 packet으로 오는지
- 0 입력 상태의 raw 값
- 알 수 없는 byte가 들어오는 경우

## 7. 성공 기준

이번 Bluetooth 테스트의 성공 기준은 다음과 같다.

- Chrome 또는 Edge에서 Web Bluetooth 기기 선택 창이 열린다.
- FLEDU 기기를 선택할 수 있다.
- GATT server 연결 상태가 표시된다.
- service / characteristic 접근이 성공한다.
- notification 수신 로그가 화면에 표시된다.
- 주판 조작에 따라 raw / hex 값이 변한다.
- 실패 상황에서도 앱이 깨지지 않고 `error.name`, `error.message`가 표시된다.

훈련장 정답 제출과 Bluetooth 입력을 실제로 연결하는 것은 다음 단계 작업이다.

## 8. 다음 단계

Bluetooth raw 로그를 확보한 뒤 다음 작업을 진행한다.

1. 실제 packet 샘플을 문서 또는 fixture로 저장한다.
2. raw packet을 숫자로 변환하는 decode 함수를 분리한다.
3. OK 버튼 신호 판정을 확정한다.
4. 훈련장 입력 컨트롤러 구조를 만든다.
5. Bluetooth 입력을 훈련장 답 입력에 연결한다.
6. 같은 문제에 중복 제출되지 않도록 제출 상태를 관리한다.
7. 더미 보상 표시와 실제 훈련 결과 처리를 분리한다.
