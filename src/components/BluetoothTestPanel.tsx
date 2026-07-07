import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bluetooth, CheckCircle2, Radio, Search, XCircle } from 'lucide-react';

const DEFAULT_SERVICE_UUID = '674219bc-d86b-4b65-8ea4-9c3e64b857c8';
const DEFAULT_CHARACTERISTIC_UUID = '329c75cc-17ff-4de5-affd-69c80311a66f';

type Availability = 'checking' | 'available' | 'unavailable' | 'unsupported' | 'error';

interface BluetoothLogEntry {
  id: number;
  time: string;
  raw: string;
  hex: string;
  text: string;
  parsedNumber: number | null;
  note: string;
}

interface BluetoothErrorState {
  name: string;
  message: string;
}

export interface BluetoothNotificationPayload {
  id: number;
  time: string;
  bytes: number[];
  raw: string;
  hex: string;
  text: string;
  parsedNumber: number | null;
  isConfirmSignal: boolean;
  note: string;
}

interface BluetoothTestPanelProps {
  onNotification?: (payload: BluetoothNotificationPayload) => void;
}

export function BluetoothTestPanel({ onNotification }: BluetoothTestPanelProps) {
  const [availability, setAvailability] = useState<Availability>('checking');
  const [availabilityError, setAvailabilityError] = useState('');
  const [serviceUuid, setServiceUuid] = useState(DEFAULT_SERVICE_UUID);
  const [characteristicUuid, setCharacteristicUuid] = useState(DEFAULT_CHARACTERISTIC_UUID);
  const [deviceName, setDeviceName] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [gattConnected, setGattConnected] = useState(false);
  const [status, setStatus] = useState('대기 중');
  const [error, setError] = useState<BluetoothErrorState | null>(null);
  const [logs, setLogs] = useState<BluetoothLogEntry[]>([]);

  const hasNavigatorBluetooth = typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isChromiumBrowser = /Chrome|Chromium|Edg\//.test(userAgent) && !/OPR\//.test(userAgent);
  const isSecureTarget = typeof window !== 'undefined'
    ? window.location.protocol === 'https:' || ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
    : false;

  const availabilityLabel = useMemo(() => {
    if (availability === 'checking') return '확인 중';
    if (availability === 'available') return '사용 가능';
    if (availability === 'unavailable') return '어댑터 없음';
    if (availability === 'unsupported') return '미지원';
    return '확인 오류';
  }, [availability]);

  useEffect(() => {
    let cancelled = false;

    async function checkAvailability() {
      if (!hasNavigatorBluetooth) {
        setAvailability('unsupported');
        return;
      }

      try {
        const bluetooth = navigator.bluetooth;
        if (typeof bluetooth.getAvailability !== 'function') {
          setAvailability('unsupported');
          setAvailabilityError('navigator.bluetooth.getAvailability()를 사용할 수 없습니다.');
          return;
        }

        const result = await bluetooth.getAvailability();
        if (!cancelled) {
          setAvailability(result ? 'available' : 'unavailable');
        }
      } catch (caught) {
        if (!cancelled) {
          const parsed = normalizeError(caught);
          setAvailability('error');
          setAvailabilityError(`${parsed.name}: ${parsed.message}`);
        }
      }
    }

    checkAvailability();

    return () => {
      cancelled = true;
    };
  }, [hasNavigatorBluetooth]);

  async function connectWithFleduFilter() {
    await requestAndConnect({
      filters: [{ namePrefix: 'FLEDU' }],
      optionalServices: compactUuidList([serviceUuid]),
    });
  }

  async function connectWithAcceptAllDevices() {
    await requestAndConnect({
      acceptAllDevices: true,
      optionalServices: compactUuidList([serviceUuid]),
    });
  }

  async function requestAndConnect(options: RequestDeviceOptions) {
    setError(null);
    setStatus('브라우저 기기 선택 창을 기다리는 중');

    if (!hasNavigatorBluetooth) {
      setError({ name: 'NotSupportedError', message: 'navigator.bluetooth가 없습니다.' });
      setStatus('Web Bluetooth 미지원');
      return;
    }

    try {
      const device = await navigator.bluetooth.requestDevice(options);
      setDeviceName(device.name || '(이름 없는 기기)');
      setDeviceId(device.id);
      setStatus('GATT 서버 연결 중');

      device.addEventListener('gattserverdisconnected', () => {
        setGattConnected(false);
        setStatus('GATT 연결 끊김');
      });

      const server = await device.gatt?.connect();
      setGattConnected(Boolean(server?.connected));

      if (!server) {
        setStatus('GATT 서버를 찾지 못함');
        return;
      }

      if (!serviceUuid.trim() || !characteristicUuid.trim()) {
        setStatus('기기 연결됨. UUID 입력 후 notification 테스트 가능');
        return;
      }

      setStatus('서비스와 characteristic 찾는 중');
      const service = await server.getPrimaryService(serviceUuid.trim());
      const characteristic = await service.getCharacteristic(characteristicUuid.trim());

      setStatus('notification 시작 중');
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', handleNotification);
      setStatus('연결됨. notification 수신 대기 중');
    } catch (caught) {
      const parsed = normalizeError(caught);
      setError(parsed);
      setStatus('연결 시도 종료');
    }
  }

  function handleNotification(event: Event) {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    if (!value) return;

    const bytes = new Uint8Array(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength));
    const raw = `[${Array.from(bytes).join(', ')}]`;
    const hex = Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, '0').toUpperCase())
      .join('-');

    let text = 'decode 불가';
    try {
      const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      text = decoded && decoded.trim().length > 0 ? decoded : '(빈 문자열)';
    } catch {
      text = 'decode 오류';
    }

    const parsedNumber = parseBluetoothNumber(bytes, text);
    const isConfirmSignal = bytes[bytes.length - 1] === 0x01;
    const note = [
      parsedNumber === null ? 'number parse skipped' : `number parsed: ${parsedNumber}`,
      isConfirmSignal ? 'confirm signal received' : '',
    ].filter(Boolean).join(' / ');

    const payload: BluetoothNotificationPayload = {
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      bytes: Array.from(bytes),
      raw,
      hex,
      text,
      parsedNumber,
      isConfirmSignal,
      note,
    };

    onNotification?.(payload);

    setLogs((current) => [
      {
        id: payload.id,
        time: payload.time,
        raw,
        hex,
        text,
        parsedNumber,
        note,
      },
      ...current,
    ].slice(0, 20));
  }

  const adapterUnavailable = availability === 'unavailable' || availability === 'unsupported' || !hasNavigatorBluetooth;

  return (
    <div className="grid min-w-0 gap-3 overflow-x-hidden xl:grid-cols-[0.9fr_1.1fr]">
      <section className="grid min-w-0 gap-3">
        <div className="min-w-0 rounded-3xl border border-slate-200 bg-slate-50 p-3 sm:p-5">
          <div className="mb-3 flex min-w-0 items-start gap-2 sm:mb-4 sm:gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white sm:h-12 sm:w-12">
              <Bluetooth className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div className="min-w-0">
              <h3 className="break-words text-base font-black leading-snug text-slate-900 sm:text-xl">주산 입력 장치 연결 테스트</h3>
              <p className="mt-1 break-words text-[13px] font-semibold leading-snug text-slate-500 sm:text-sm">Bluetooth 주판 입력을 게임 로직과 분리해 확인합니다.</p>
            </div>
          </div>

          <div className="grid gap-2">
            <CheckRow label="Web Bluetooth API 지원" ok={hasNavigatorBluetooth} value={hasNavigatorBluetooth ? '지원' : '미지원'} />
            <CheckRow label="navigator.bluetooth 존재" ok={hasNavigatorBluetooth} value={String(hasNavigatorBluetooth)} />
            <CheckRow label="getAvailability() 결과" ok={availability === 'available'} value={availabilityLabel} />
            <CheckRow label="Chrome/Edge 계열 브라우저" ok={isChromiumBrowser} value={isChromiumBrowser ? '예' : '아니오'} />
            <CheckRow label="localhost 또는 HTTPS" ok={isSecureTarget} value={isSecureTarget ? '허용 주소' : '차단 가능 주소'} />
          </div>

          {availabilityError && (
            <div className="mt-3 break-words rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[13px] font-bold leading-snug text-amber-800 sm:mt-4 sm:p-4 sm:text-sm">
              {availabilityError}
            </div>
          )}

          {adapterUnavailable && (
            <div className="mt-3 break-words rounded-2xl border border-orange-200 bg-orange-50 p-3 text-[13px] font-bold leading-snug text-orange-900 sm:mt-4 sm:p-4 sm:text-sm sm:leading-relaxed">
              현재 Chrome이 사용할 수 있는 Windows Bluetooth 어댑터가 없습니다. nRF52 Connectivity는 nRF Connect용 동글일 수 있으며, Web Bluetooth 테스트에는 일반 Bluetooth 동글 또는 내장 Bluetooth가 필요할 수 있습니다.
            </div>
          )}

          <div className="mt-3 break-words rounded-2xl border border-sky-200 bg-sky-50 p-3 text-[13px] font-bold leading-snug text-sky-900 sm:mt-4 sm:p-4 sm:text-sm">
            집 PC에서는 목업 UI와 패널 동작만 확인하고, 실제 FLEDU 연결 성공 여부는 과거 연결 성공했던 Windows 노트북에서 최종 테스트 필요.
          </div>
        </div>

        <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
          <h4 className="mb-3 text-base font-black text-slate-900 sm:mb-4 sm:text-lg">연결 설정</h4>
          <label className="mb-3 block">
            <span className="mb-1 block text-xs font-black text-slate-500 sm:text-sm">Service UUID</span>
            <input
              value={serviceUuid}
              onChange={(event) => setServiceUuid(event.target.value)}
              className="w-full min-w-0 rounded-2xl border border-slate-200 px-3 py-3 font-mono text-xs focus:border-cyan-400 sm:px-4 sm:text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-black text-slate-500 sm:text-sm">Characteristic UUID</span>
            <input
              value={characteristicUuid}
              onChange={(event) => setCharacteristicUuid(event.target.value)}
              className="w-full min-w-0 rounded-2xl border border-slate-200 px-3 py-3 font-mono text-xs focus:border-cyan-400 sm:px-4 sm:text-sm"
            />
          </label>

          <div className="mt-4 grid gap-2 sm:mt-5 sm:gap-3 sm:grid-cols-2">
            <button
              onClick={connectWithFleduFilter}
              className="inline-flex min-h-12 min-w-0 items-center justify-center gap-1.5 rounded-2xl bg-cyan-600 px-3 text-sm font-black text-white transition hover:bg-cyan-500 active:scale-[0.98] sm:min-h-14 sm:gap-2 sm:px-4 sm:text-base"
            >
              <Radio className="h-5 w-5" />
              <span className="break-words">FLEDU 연결</span>
            </button>
            <button
              onClick={connectWithAcceptAllDevices}
              className="inline-flex min-h-12 min-w-0 items-center justify-center gap-1.5 rounded-2xl bg-slate-800 px-3 text-sm font-black text-white transition hover:bg-slate-700 active:scale-[0.98] sm:min-h-14 sm:gap-2 sm:px-4 sm:text-base"
            >
              <Search className="h-5 w-5" />
              <span className="break-words">전체 기기 검색 테스트</span>
            </button>
          </div>
        </div>
      </section>

      <section className="grid min-w-0 content-start gap-3 sm:gap-4">
        <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
          <h4 className="mb-3 text-base font-black text-slate-900 sm:mb-4 sm:text-lg">연결 상태</h4>
          <div className="grid gap-3">
            <InfoLine label="상태" value={status} />
            <InfoLine label="기기 이름" value={deviceName || '-'} />
            <InfoLine label="Device ID" value={deviceId || '-'} />
            <InfoLine label="GATT connected" value={String(gattConnected)} />
          </div>

          {error && (
            <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 sm:mt-4 sm:p-4">
              <div className="mb-2 flex min-w-0 items-center gap-2 text-[13px] font-black text-red-800 sm:text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span className="break-words">연결 실패 상세</span>
              </div>
              <InfoLine label="error.name" value={error.name} />
              <InfoLine label="error.message" value={error.message} />
            </div>
          )}
        </div>

        <div className="min-w-0 rounded-3xl border border-slate-200 bg-slate-950 p-3 text-white shadow-sm sm:p-5">
          <div className="mb-3 flex min-w-0 items-center justify-between gap-2 sm:mb-4 sm:gap-3">
            <h4 className="min-w-0 break-words text-base font-black sm:text-lg">Notification 로그</h4>
            <button
              onClick={() => setLogs([])}
              className="shrink-0 rounded-full border border-white/20 px-2.5 py-1 text-xs font-black text-slate-200 transition hover:bg-white/10"
            >
              지우기
            </button>
          </div>
          <div className="max-h-[460px] min-w-0 overflow-y-auto overflow-x-hidden">
            {logs.length === 0 ? (
              <p className="break-words rounded-2xl border border-white/10 bg-white/5 p-3 text-[13px] font-semibold leading-snug text-slate-400 sm:p-4 sm:text-sm">
                아직 수신 데이터가 없습니다.
              </p>
            ) : (
              <div className="grid gap-3">
                {logs.map((log) => (
                  <article key={log.id} className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-3 font-mono text-[11px] leading-snug sm:p-4 sm:text-xs">
                    <p className="mb-2 font-sans text-sm font-black text-cyan-300">{log.time}</p>
                    <p className="break-all"><span className="text-slate-400">raw value:</span> {log.raw}</p>
                    <p className="break-all"><span className="text-slate-400">hex:</span> {log.hex}</p>
                    <p className="break-all"><span className="text-slate-400">text:</span> {log.text}</p>
                    <p className="break-all"><span className="text-slate-400">number:</span> {log.parsedNumber ?? '-'}</p>
                    {log.note && <p className="break-all"><span className="text-slate-400">note:</span> {log.note}</p>}
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function CheckRow({ label, ok, value }: { label: string; ok: boolean; value: string }) {
  return (
    <div className="flex min-w-0 flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4 sm:py-3">
      <span className="min-w-0 break-words text-[13px] font-black leading-snug text-slate-600 sm:text-sm">{label}</span>
      <span className={`inline-flex max-w-full shrink items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black leading-snug ${ok ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
        {ok ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" /> : <XCircle className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />}
        <span className="min-w-0 break-words">{value}</span>
      </span>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid min-w-0 gap-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:grid-cols-[120px_minmax(0,1fr)] sm:px-4 sm:py-3">
      <span className="min-w-0 break-words text-[13px] font-black text-slate-500 sm:text-sm">{label}</span>
      <span className="min-w-0 break-all text-[13px] font-bold text-slate-900 sm:text-sm">{value}</span>
    </div>
  );
}

function compactUuidList(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean);
}

function parseBluetoothNumber(bytes: Uint8Array, text: string) {
  const mapped = parseFleduTwoDigitNumber(bytes);
  if (mapped !== null) return mapped;

  const normalizedText = text.trim();
  if (/^\d+$/.test(normalizedText)) {
    return Number(normalizedText);
  }

  return null;
}

function parseFleduTwoDigitNumber(bytes: Uint8Array) {
  if (bytes.length <= 8) return null;

  const tens = mapFleduDigit(bytes[7]);
  const ones = mapFleduDigit(bytes[8]);
  if (tens < 0 || ones < 0) return null;

  return tens * 10 + ones;
}

function mapFleduDigit(byteValue: number) {
  const map: Record<number, number> = {
    0x1F: 0,
    0x17: 1,
    0x13: 2,
    0x11: 3,
    0x10: 4,
    0x0F: 5,
    0x07: 6,
    0x03: 7,
    0x01: 8,
    0x00: 9,
  };

  return map[byteValue] ?? -1;
}

function normalizeError(caught: unknown): BluetoothErrorState {
  if (caught instanceof Error) {
    return {
      name: caught.name || 'Error',
      message: caught.message || '(message 없음)',
    };
  }

  return {
    name: 'UnknownError',
    message: String(caught),
  };
}
