import { useEffect } from 'react';
import { ArrowDown } from 'lucide-react';
import { trainingUiAssets } from '../assets/ui/training';

export interface MinigameEntryConfirmProps {
  title: string;
  coins: number;
  entryCost: number;
  processing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function MinigameEntryConfirm({ title, coins, entryCost, processing, onCancel, onConfirm }: MinigameEntryConfirmProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !processing) onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCancel, processing]);

  const remainingCoins = Math.max(0, coins - entryCost);
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-[2px]">
    <section role="dialog" aria-modal="true" aria-labelledby="minigame-entry-title" className="w-full max-w-sm rounded-[30px] border-4 border-[#9a6632] bg-[#fff1c7] p-5 text-center shadow-[0_8px_0_#75451f,0_20px_50px_rgba(42,25,10,.4)] animate-[pop-in_.18s_ease-out]">
      <h2 id="minigame-entry-title" className="text-2xl font-black text-amber-950">{title}</h2>
      <p className="mt-2 text-sm font-black text-amber-800">게임 입장을 위해 {entryCost.toLocaleString()}코인이 필요해요. 진행할까요?</p>
      <div className="mt-4 grid gap-2 rounded-[22px] border-2 border-amber-200 bg-white/75 p-4">
        <CoinAmount label="현재 코인" amount={coins} />
        <ArrowDown className="mx-auto h-5 w-5 text-amber-600" aria-hidden="true" />
        <CoinAmount label={`${entryCost.toLocaleString()}코인을 사용해요`} amount={-entryCost} />
        <ArrowDown className="mx-auto h-5 w-5 text-amber-600" aria-hidden="true" />
        <CoinAmount label="남는 코인" amount={remainingCoins} highlight />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button type="button" disabled={processing} onClick={onCancel} className="min-h-14 rounded-[18px] bg-white px-3 font-black text-amber-900 shadow-[0_4px_0_#d6b77a] disabled:opacity-50">취소</button>
        <button type="button" disabled={processing} onClick={onConfirm} className="min-h-14 rounded-[18px] bg-gradient-to-b from-emerald-400 to-emerald-600 px-3 text-sm font-black text-white shadow-[0_4px_0_#047857] disabled:cursor-wait disabled:opacity-60">{processing ? '탐험 준비 중…' : `${entryCost.toLocaleString()}코인 내고 시작`}</button>
      </div>
    </section>
  </div>;
}

function CoinAmount({ label, amount, highlight = false }: { label: string; amount: number; highlight?: boolean }) {
  return <div><p className="text-xs font-black text-amber-800">{label}</p><div className={`mt-1 flex items-center justify-center gap-2 font-black ${highlight ? 'text-3xl text-emerald-800' : 'text-2xl text-amber-950'}`}><img src={trainingUiAssets.rewardCoin} alt="코인" className="h-9 w-9 object-contain drop-shadow" /><span>{amount < 0 ? '-' : ''}{Math.abs(amount).toLocaleString()}</span></div></div>;
}

export function MinigameEntryShortage({ coins, entryCost, onClose }: { coins: number; entryCost: number; onClose: () => void }) {
  const missing = Math.max(0, entryCost - coins);
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-[2px]"><section role="alertdialog" aria-modal="true" aria-labelledby="minigame-shortage-title" className="w-full max-w-sm rounded-[30px] border-4 border-[#9a6632] bg-[#fff1c7] p-6 text-center shadow-[0_8px_0_#75451f,0_20px_50px_rgba(42,25,10,.4)]"><h2 id="minigame-shortage-title" className="text-2xl font-black text-amber-950">코인이 조금 부족해요!</h2><div className="mt-5 grid grid-cols-2 gap-3 rounded-[22px] bg-white/75 p-4"><CoinAmount label="현재 코인" amount={coins} /><CoinAmount label="필요한 코인" amount={entryCost} /></div><p className="mt-4 text-lg font-black text-amber-800">{missing.toLocaleString()}코인이 더 필요해요!</p><button type="button" onClick={onClose} className="mt-5 min-h-14 w-full rounded-[18px] bg-emerald-600 px-5 font-black text-white shadow-[0_4px_0_#047857]">확인</button></section></div>;
}
