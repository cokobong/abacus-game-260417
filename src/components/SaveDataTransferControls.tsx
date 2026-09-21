import { useRef, useState } from 'react';

export function SaveDataTransferControls({
  onExport,
  onImport,
}: {
  onExport: () => void;
  onImport: (file: File) => Promise<void>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  async function selectBackupFile(file: File | undefined) {
    if (!file || isImporting) return;
    setIsImporting(true);
    try {
      await onImport(file);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      <button type="button" onClick={onExport} className="min-h-12 rounded-[16px] bg-sky-600 px-3 text-xs font-black text-white shadow-[0_4px_0_#0369a1] transition active:translate-y-1 active:shadow-none sm:text-sm">
        데이터 내보내기
      </button>
      <button type="button" disabled={isImporting} onClick={() => fileInputRef.current?.click()} className="min-h-12 rounded-[16px] bg-emerald-600 px-3 text-xs font-black text-white shadow-[0_4px_0_#047857] transition active:translate-y-1 active:shadow-none disabled:cursor-wait disabled:opacity-60 sm:text-sm">
        {isImporting ? '가져오는 중…' : '데이터 가져오기'}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="sr-only"
        aria-label="게임 데이터 백업 JSON 파일 선택"
        onChange={(event) => void selectBackupFile(event.target.files?.[0])}
      />
    </div>
  );
}
