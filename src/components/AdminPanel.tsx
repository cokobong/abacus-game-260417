import { useMemo, useState, type FormEvent } from 'react';
import { ADMIN_LIMITS, ADMIN_PIN } from '../config/adminConfig';
import type { ItemConfig } from '../config/itemConfig';
import type { AdminChangeLog, OwnedEgg } from '../types/game';
import { SaveDataTransferControls } from './SaveDataTransferControls';

type QuantityTarget = Pick<ItemConfig, 'id' | 'name' | 'category'>;

export interface AdminPanelProps {
  profileName: string;
  coins: number;
  eggs: QuantityTarget[];
  items: QuantityTarget[];
  ownedEggs: OwnedEgg[];
  inventory: Array<{ itemId: string; quantity: number }>;
  changeLogs: AdminChangeLog[];
  onSetCoins: (quantity: number) => void;
  onSetEggQuantity: (itemId: string, quantity: number) => void;
  onSetItemQuantity: (itemId: string, quantity: number) => void;
  onClearLogs: () => void;
  onExport: () => void;
  onImport: (file: File) => Promise<void>;
}

function parseInteger(value: string, min: number, max: number) {
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

function formatChangedAt(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

export function AdminPanel(props: AdminPanelProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [feedback, setFeedback] = useState('');

  function submitPin(event: FormEvent) {
    event.preventDefault();
    if (pin === ADMIN_PIN) {
      setAuthenticated(true);
      setPin('');
      setPinError('');
      return;
    }
    setPinError('비밀번호가 올바르지 않습니다.');
  }

  if (!authenticated) {
    return (
      <form onSubmit={submitPin} className="mt-3 grid gap-3 rounded-[18px] border-2 border-slate-200 bg-slate-50 p-3">
        <label className="grid gap-2 text-sm font-black text-slate-800">
          관리자 비밀번호
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            value={pin}
            autoComplete="off"
            onChange={(event) => {
              setPin(event.target.value.replace(/\D/g, '').slice(0, 4));
              setPinError('');
            }}
            className="min-h-14 rounded-[14px] border-2 border-slate-300 bg-white px-4 text-center text-2xl font-black tracking-[0.5em]"
            aria-describedby={pinError ? 'admin-pin-error' : undefined}
          />
        </label>
        {pinError && <p id="admin-pin-error" className="text-sm font-black text-red-600">{pinError}</p>}
        <button type="submit" className="min-h-12 rounded-[14px] bg-slate-800 px-4 font-black text-white">확인</button>
      </form>
    );
  }

  return (
    <div className="mt-3 grid gap-4 rounded-[18px] bg-slate-100 p-3 text-slate-900">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-slate-500">관리 대상</p>
          <p className="text-lg font-black">{props.profileName}</p>
        </div>
        <button type="button" onClick={() => setAuthenticated(false)} className="min-h-12 rounded-xl bg-slate-700 px-4 text-sm font-black text-white">관리 종료</button>
      </div>

      {feedback && <p className="rounded-xl bg-white p-3 text-sm font-black text-slate-700">{feedback}</p>}

      <AdminQuantitySection
        title="코인 관리"
        target={{ id: 'coins', name: '코인', category: 'misc' }}
        current={props.coins}
        min={ADMIN_LIMITS.coins.min}
        max={ADMIN_LIMITS.coins.max}
        steps={[-500, -100, -10, 10, 100, 500]}
        onApply={(quantity) => {
          if (!window.confirm(`코인을 ${props.coins.toLocaleString()}개에서 ${quantity.toLocaleString()}개로 변경합니다. 계속할까요?`)) return;
          props.onSetCoins(quantity);
          setFeedback('코인 수량을 변경했습니다.');
        }}
      />

      <AdminItemList
        title="알 관리"
        targets={props.eggs}
        getCurrent={(id) => props.ownedEggs.filter((egg) => egg.eggItemId === id).length}
        onApply={props.onSetEggQuantity}
        setFeedback={setFeedback}
      />

      <AdminItemList
        title="일반 아이템 관리"
        targets={props.items}
        getCurrent={(id) => props.inventory.find((item) => item.itemId === id)?.quantity ?? 0}
        onApply={props.onSetItemQuantity}
        setFeedback={setFeedback}
      />

      <section className="rounded-2xl bg-white p-3">
        <h5 className="font-black">데이터 백업 및 복원</h5>
        <p className="mt-1 text-xs font-bold text-slate-500">가져오면 현재 데이터가 백업 파일 내용으로 덮어써집니다.</p>
        <SaveDataTransferControls onExport={props.onExport} onImport={props.onImport} />
      </section>

      <section className="rounded-2xl bg-white p-3">
        <div className="flex items-center justify-between gap-2">
          <h5 className="font-black">최근 변경 기록</h5>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('관리자 변경 기록을 모두 삭제할까요?')) props.onClearLogs();
            }}
            className="min-h-12 rounded-xl bg-red-50 px-3 text-xs font-black text-red-700"
          >
            기록 삭제
          </button>
        </div>
        <div className="mt-2 grid gap-2">
          {props.changeLogs.length === 0 && <p className="text-sm font-bold text-slate-400">변경 기록이 없습니다.</p>}
          {props.changeLogs.map((log) => (
            <div key={log.id} className="rounded-xl bg-slate-50 p-2">
              <p className="text-[11px] font-bold text-slate-500">{formatChangedAt(log.changedAt)}</p>
              <p className="text-sm font-black">{log.targetName ?? '항목'} {log.before.toLocaleString()} → {log.after.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function AdminItemList({
  title,
  targets,
  getCurrent,
  onApply,
  setFeedback,
}: {
  title: string;
  targets: QuantityTarget[];
  getCurrent: (id: string) => number;
  onApply: (id: string, quantity: number) => void;
  setFeedback: (message: string) => void;
}) {
  return (
    <section className="rounded-2xl bg-white p-3">
      <h5 className="font-black">{title}</h5>
      <div className="mt-3 grid gap-3">
        {targets.map((target) => (
          <AdminQuantitySection
            key={target.id}
            title={target.name}
            target={target}
            current={getCurrent(target.id)}
            min={ADMIN_LIMITS.quantity.min}
            max={ADMIN_LIMITS.quantity.max}
            steps={[-1, 1]}
            onApply={(quantity) => {
              const current = getCurrent(target.id);
              if (!window.confirm(`${target.name} 수량을 ${current}개에서 ${quantity}개로 변경할까요?`)) return;
              onApply(target.id, quantity);
              setFeedback(`${target.name} 수량을 변경했습니다.`);
            }}
          />
        ))}
      </div>
    </section>
  );
}

function AdminQuantitySection({
  title,
  target,
  current,
  min,
  max,
  steps,
  onApply,
}: {
  key?: string;
  title: string;
  target: QuantityTarget;
  current: number;
  min: number;
  max: number;
  steps: number[];
  onApply: (quantity: number) => void;
}) {
  const [draft, setDraft] = useState(String(current));
  const parsedDraft = useMemo(() => parseInteger(draft, min, max), [draft, min, max]);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="min-w-0">
        <p className="font-black">{title}</p>
        {target.id !== 'coins' && <p className="break-all text-[11px] font-bold text-slate-500">ID: {target.id}</p>}
        <p className="mt-1 text-sm font-black">현재 수량: {current.toLocaleString()}</p>
      </div>
      <div className={`mt-3 grid gap-2 ${steps.length > 2 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {steps.map((step) => (
          <button
            key={step}
            type="button"
            onClick={() => setDraft(String(Math.min(max, Math.max(min, (parsedDraft ?? current) + step))))}
            className="min-h-12 rounded-xl border border-slate-300 bg-white text-sm font-black"
          >
            {step > 0 ? `+${step}` : step}
          </button>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={1}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="min-h-12 min-w-0 rounded-xl border-2 border-slate-300 bg-white px-3 text-lg font-black"
          aria-label={`${title} 변경 수량`}
        />
        <button
          type="button"
          disabled={parsedDraft === null || parsedDraft === current}
          onClick={() => parsedDraft !== null && onApply(parsedDraft)}
          className="min-h-12 rounded-xl bg-blue-700 px-5 font-black text-white disabled:bg-slate-300"
        >
          적용
        </button>
      </div>
      {parsedDraft === null && <p className="mt-1 text-xs font-black text-red-600">{min.toLocaleString()}~{max.toLocaleString()} 사이의 정수를 입력하세요.</p>}
    </div>
  );
}
