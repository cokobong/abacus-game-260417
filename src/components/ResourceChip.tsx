export interface ResourceChipProps {
  label: string;
  value: number;
  icon: string;
  tone?: 'coin' | 'rare';
}

export function ResourceChip({ label, value, icon, tone = 'coin' }: ResourceChipProps) {
  const rare = tone === 'rare';
  return (
    <div
      className={`flex min-w-0 items-center gap-2 rounded-full border-[3px] px-3 py-1.5 shadow-[0_3px_0_rgba(73,46,18,.35)] ${rare ? 'border-violet-200 bg-gradient-to-b from-violet-50 to-orange-100 text-violet-950' : 'border-amber-200 bg-gradient-to-b from-amber-50 to-yellow-200 text-amber-950'}`}
      aria-label={`${label} ${value.toLocaleString()}개`}
      title={rare ? '모험에서 얻을 수 있는 특별한 조각이에요.' : undefined}
    >
      <img src={icon} alt="" aria-hidden="true" className={`shrink-0 object-contain drop-shadow ${rare ? 'h-8 w-8' : 'h-7 w-7'}`} />
      <span className="min-w-0 leading-none">
        <small className={`block whitespace-nowrap text-[clamp(.58rem,1.35dvh,.7rem)] font-black ${rare ? 'text-violet-700' : 'text-amber-700'}`}>{label}</small>
        <strong className="mt-0.5 block truncate text-[clamp(.95rem,2.2dvh,1.2rem)] font-black tabular-nums">{value.toLocaleString()}</strong>
      </span>
    </div>
  );
}
