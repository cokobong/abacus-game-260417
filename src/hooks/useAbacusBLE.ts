import { useState, useCallback, useRef } from 'react';

export interface AbacusData {
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
  const lastUpdateRef = useRef<number>(0);

  const mapDigit = (byteValue: number) => {
    const map: Record<number, number> = {
      0x1F: 0, 0x17: 1, 0x13: 2, 0x11: 3, 0x10: 4,
      0x0F: 5, 0x07: 6, 0x03: 7, 0x01: 8, 0x00: 9
    };
    return map[byteValue] ?? -1;
  };

  const handleValueChange = useCallback((event: any) => {
    const now = Date.now();
    if (now - lastUpdateRef.current < 120) return;
    lastUpdateRef.current = now;

    const value = event.target.value;
    const data = new Uint8Array(value.buffer);
    
    const tensCode = data[7] ?? 0x1F;
    const onesCode = data[8] ?? 0x1F;
    
    // 기기의 OK 버튼 신호 (보통 마지막 바이트나 특정 바이트가 0x01 등으로 변경됨)
    // 기존 app.js의 decodeAbacusPacket 로직을 참고하여 마지막 바이트를 확인
    const lastByte = data[data.length - 1] ?? 0x00;
    const isConfirmed = lastByte === 0x01; 

    const tens = mapDigit(tensCode);
    const ones = mapDigit(onesCode);
    const number = tens * 10 + ones;

    const rawHex = Array.from(data)
      .map(v => v.toString(16).padStart(2, "0").toUpperCase())
      .join("-");

    setLastData({ tens, ones, number, rawHex, isConfirmed });
  }, []);

  const connect = async () => {
    try {
      setStatus("기기 찾는 중...");
      const selectedDevice = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: "FLEDU_" }],
        optionalServices: [SERVICE_UUID]
      });

      setStatus("연결 중...");
      const server = await selectedDevice.gatt?.connect();
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
      setIsConnected(true);
      setStatus("연결됨: " + selectedDevice.name);
    } catch (error: any) {
      console.error(error);
      setStatus("오류: " + error.message);
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
    setLastData({ tens: 0, ones: 0, number: 0, rawHex: "DEBUG-MODE", isConfirmed: false });
  };

  const setDummyNumber = (num: number, isConfirmed: boolean = false) => {
    const tens = Math.floor(num / 10);
    const ones = num % 10;
    setLastData({ tens, ones, number: num, rawHex: "DEBUG-VALUE", isConfirmed });
  };

  return { connect, disconnect, connectDummy, setDummyNumber, isConnected, status, lastData };
}
