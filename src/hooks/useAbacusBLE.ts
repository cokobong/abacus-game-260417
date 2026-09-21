import { useState, useCallback, useRef } from 'react';

export interface AbacusData {
  bytes: number[];
  tens: number;
  ones: number;
  number: number;
  rawHex: string;
  isConfirmed: boolean;
}

const SERVICE_UUID = "674219bc-d86b-4b65-8ea4-9c3e64b857c8";
const CHAR_UUID = "329c75cc-17ff-4de5-affd-69c80311a66f";

export function useAbacusBLE() {
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState("연결 대기 중");
  const [lastData, setLastData] = useState<AbacusData | null>(null);
  
  const characteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);

  const mapDigit = (byteValue: number) => {
    const map: Record<number, number> = {
      0x1F: 0, 0x17: 1, 0x13: 2, 0x11: 3, 0x10: 4,
      0x0F: 5, 0x07: 6, 0x03: 7, 0x01: 8, 0x00: 9
    };
    return map[byteValue] ?? -1;
  };

  const handleValueChange = useCallback((event: any) => {
    const value = event.target.value;
    const data = new Uint8Array(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength));
    
    const tensCode = data[7] ?? 0x1F;
    const onesCode = data[8] ?? 0x1F;
    
    // 기기의 OK 버튼 신호 (보통 마지막 바이트나 특정 바이트가 0x01 등으로 변경됨)
    // 기존 app.js의 decodeAbacusPacket 로직을 참고하여 마지막 바이트를 확인
    const lastByte = data[data.length - 1] ?? 0x00;
    const isConfirmed = lastByte === 0x01; 

    const tens = mapDigit(tensCode);
    const ones = mapDigit(onesCode);
    const number = tens >= 0 && ones >= 0 ? tens * 10 + ones : Number.NaN;

    const rawHex = Array.from(data)
      .map(v => v.toString(16).padStart(2, "0").toUpperCase())
      .join("-");

    setLastData({ bytes: Array.from(data), tens, ones, number, rawHex, isConfirmed });
  }, []);

  const connect = async () => {
    try {
      if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
        throw new Error('이 브라우저에서는 블루투스 기기 검색을 지원하지 않아요.');
      }
      setStatus("기기 찾는 중...");
      const selectedDevice = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: "FLEDU" }],
        optionalServices: [SERVICE_UUID]
      });

      setStatus("연결 중...");
      const server = await selectedDevice.gatt?.connect();
      if (!server) throw new Error('GATT 서버에 연결하지 못했어요.');
      const service = await server?.getPrimaryService(SERVICE_UUID);
      const characteristic = await service?.getCharacteristic(CHAR_UUID);

      if (characteristic) {
        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', handleValueChange);
        characteristicRef.current = characteristic;
      }

      selectedDevice.addEventListener('gattserverdisconnected', () => {
        setIsConnected(false);
        setStatus("연결 끊김");
      });

      setDevice(selectedDevice);
      setIsConnected(server.connected);
      setStatus("연결됨: " + (selectedDevice.name || '이름 없는 기기'));
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : String(error);
      setStatus("오류: " + message);
    }
  };

  const disconnect = async () => {
    if (device?.gatt?.connected) {
      device.gatt.disconnect();
    }
    setIsConnected(false);
    setStatus("연결 해제됨");
  };

  const connectDummy = () => {
    setIsConnected(true);
    setStatus("더미 기기 연결됨 (디버그)");
    setLastData({ bytes: [], tens: 0, ones: 0, number: 0, rawHex: "DEBUG-MODE", isConfirmed: false });
  };

  const setDummyNumber = (num: number, isConfirmed: boolean = false) => {
    const tens = Math.floor(num / 10);
    const ones = num % 10;
    setLastData({ bytes: [], tens, ones, number: num, rawHex: "DEBUG-VALUE", isConfirmed });
  };

  return { connect, disconnect, connectDummy, setDummyNumber, isConnected, status, lastData };
}
