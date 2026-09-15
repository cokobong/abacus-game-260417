import type { DigitType, OperationMode, TrainingInputMode, TrainingSessionRecord } from '../types/game';
import {
  formatAverageSeconds,
  formatDuration,
  getMostCommonTrainingSettings,
  summarizeDailyTraining,
  summarizeRecentDays,
} from '../utils/trainingHistory';

const digitLabels: Record<DigitType, string> = {
  'one-digit': '한 자리',
  'two-digit': '두 자리',
  'three-digit': '세 자리',
  'mixed-digit': '한·두 자리 혼합',
  'mixed-two-three-digit': '두·세 자리 혼합',
};

const operationLabels: Record<OperationMode, string> = {
  add: '덧셈만',
  subtract: '뺄셈만',
  mixed: '덧셈·뺄셈',
};

const inputModeLabels: Record<TrainingInputMode, string> = {
  pencil: '손글씨',
  keypad: '키패드',
  bluetooth: 'Bluetooth',
};

function formatTiedValues<T>(values: T[], formatter: (value: T) => string) {
  if (values.length === 0) return '학습 없음';
  return values.map(formatter).join(' · ');
}

function formatSessionTime(completedAt: string) {
  return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(completedAt));
}

function formatRecentDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric' }).format(new Date(year, month - 1, day, 12));
}

export function TrainingReport({ history }: { history: TrainingSessionRecord[] }) {
  const today = summarizeDailyTraining(history);
  const commonSettings = getMostCommonTrainingSettings(today.sessions);
  const recentDays = summarizeRecentDays(history);

  return (
    <section className="mt-3 grid gap-3 rounded-[22px] bg-gradient-to-b from-cyan-50 to-emerald-50 p-3" aria-label="부모용 학습 리포트">
      <div>
        <h5 className="text-base font-black text-emerald-950">오늘의 학습 요약</h5>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <ReportMetric label="오늘 푼 문제" value={`${today.totalProblems}문제`} />
          <ReportMetric label="완료한 훈련" value={`${today.completedSets}세트`} />
          <ReportMetric label="정답률" value={`${Math.round(today.accuracyRate)}%`} />
          <ReportMetric label="평균 풀이시간" value={formatAverageSeconds(today.averageAnswerMs)} />
          <div className="col-span-2">
            <ReportMetric label="총 학습시간" value={formatDuration(today.totalElapsedMs)} />
          </div>
        </div>
      </div>

      <div className="rounded-[18px] bg-white/85 p-3 shadow-sm">
        <h5 className="text-sm font-black text-cyan-900">오늘 주로 푼 문제</h5>
        {today.sessions.length > 0 ? (
          <>
            <p className="mt-2 text-sm font-black leading-relaxed text-slate-700">
              {formatTiedValues(commonSettings.digitTypes, (value) => digitLabels[value])} ·{' '}
              {formatTiedValues(commonSettings.operationModes, (value) => operationLabels[value])} ·{' '}
              {formatTiedValues(commonSettings.numberCounts, (value) => `숫자 ${value}개`)}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {commonSettings.problemCountFrequency.map((item) => (
                <span key={item.problemCount} className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-black text-cyan-800">
                  {item.problemCount}문제 세트 {item.sessions}회
                </span>
              ))}
            </div>
            {(commonSettings.digitTypes.length > 1 || commonSettings.operationModes.length > 1 || commonSettings.numberCounts.length > 1) && (
              <p className="mt-2 text-[11px] font-bold text-slate-500">동률인 설정을 모두 표시했습니다.</p>
            )}
          </>
        ) : (
          <p className="mt-2 text-sm font-bold text-slate-500">오늘 완료한 훈련이 없습니다.</p>
        )}
      </div>

      <div className="rounded-[18px] bg-white/85 p-3 shadow-sm">
        <h5 className="text-sm font-black text-cyan-900">오늘 완료한 세트</h5>
        <div className="mt-2 grid gap-2">
          {today.sessions.length > 0 ? today.sessions.map((record) => (
            <article key={record.id} className="rounded-[14px] bg-slate-50 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <strong className="text-sm font-black text-slate-800">{formatSessionTime(record.completedAt)}</strong>
                <span className="text-[11px] font-black text-emerald-700">{inputModeLabels[record.inputMode]}</span>
              </div>
              <p className="mt-1 text-xs font-bold leading-relaxed text-slate-600">
                {digitLabels[record.digitType]} · {operationLabels[record.operationMode]} · 숫자 {record.numberCount}개 · {record.problemCount}문제
              </p>
              <p className="mt-1 text-xs font-black text-cyan-800">
                정답률 {Math.round(record.accuracy)}% · 평균 {formatAverageSeconds(record.averageAnswerMs)}
              </p>
            </article>
          )) : <p className="text-sm font-bold text-slate-500">오늘 완료한 세트가 없습니다.</p>}
        </div>
      </div>

      <div className="rounded-[18px] bg-white/85 p-3 shadow-sm">
        <h5 className="text-sm font-black text-cyan-900">최근 7일</h5>
        <div className="mt-2 divide-y divide-cyan-100">
          {recentDays.map((day) => (
            <p key={day.dateKey} className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 py-2 text-xs font-bold text-slate-600">
              <strong className="text-slate-800">{formatRecentDate(day.dateKey)}</strong>
              {day.completedSets > 0
                ? <span>{day.totalProblems}문제 · {Math.round(day.accuracyRate)}% · 평균 {formatAverageSeconds(day.averageAnswerMs)}</span>
                : <span className="text-slate-400">학습 없음</span>}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

function ReportMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-white/90 px-3 py-2 shadow-sm">
      <p className="text-[11px] font-black text-slate-500">{label}</p>
      <strong className="mt-0.5 block text-lg font-black text-emerald-900">{value}</strong>
    </div>
  );
}
