import { useMemo, useRef, useState } from 'react';
import {
  Baby,
  Bluetooth,
  BookOpen,
  CheckCircle2,
  Coins,
  Egg,
  Heart,
  Map,
  Play,
  Settings,
  Shirt,
  ShoppingBag,
  Sparkles,
  Star,
  Utensils,
} from 'lucide-react';
import { BluetoothTestPanel, type BluetoothNotificationPayload } from './components/BluetoothTestPanel';

type MainTab = 'training' | 'dino' | 'hatchery' | 'shop' | 'pokedex' | 'adventure' | 'settings';
type DinoView = 'care' | 'playground';

const mainTabs: Array<{ id: MainTab; label: string; icon: typeof Play; color: string; active: string }> = [
  { id: 'training', label: '훈련장', icon: Play, color: 'text-cyan-700', active: 'from-cyan-300 to-sky-300 border-cyan-200' },
  { id: 'dino', label: '우리 공룡', icon: Baby, color: 'text-amber-700', active: 'from-amber-300 to-orange-300 border-amber-200' },
  { id: 'hatchery', label: '알 부화장', icon: Egg, color: 'text-orange-700', active: 'from-orange-300 to-yellow-300 border-orange-200' },
  { id: 'shop', label: '상점', icon: ShoppingBag, color: 'text-violet-700', active: 'from-violet-300 to-fuchsia-300 border-violet-200' },
  { id: 'pokedex', label: '도감', icon: BookOpen, color: 'text-sky-700', active: 'from-sky-300 to-blue-300 border-sky-200' },
  { id: 'adventure', label: '모험', icon: Map, color: 'text-emerald-700', active: 'from-emerald-300 to-lime-300 border-emerald-200' },
  { id: 'settings', label: '설정', icon: Settings, color: 'text-slate-700', active: 'from-slate-200 to-slate-300 border-slate-200' },
];

const trainingProblems = [
  { question: '7 + 5', answer: '12' },
  { question: '13 - 6', answer: '7' },
  { question: '24 + 18', answer: '42' },
];

const foodBag = [
  { name: '말랑 열매', count: 3 },
  { name: '나뭇잎', count: 5 },
  { name: '공룡 쿠키', count: 1 },
];

const shopSections = [
  {
    title: '음식',
    icon: Utensils,
    tone: 'from-amber-100 to-orange-100 border-amber-200 text-amber-800',
    items: [
      { name: '나뭇잎', price: 30, detail: '배고픔 회복 소' },
      { name: '말랑 열매', price: 80, detail: '행복과 EXP 보조' },
      { name: '공룡 쿠키', price: 150, detail: '행복 증가 중' },
      { name: '반짝 간식', price: 400, detail: '성장 보조' },
    ],
  },
  {
    title: '코스튬',
    icon: Shirt,
    tone: 'from-violet-100 to-fuchsia-100 border-violet-200 text-violet-800',
    items: [
      { name: '작은 모자', price: 150, detail: '첫 꾸미기' },
      { name: '빨간 리본', price: 180, detail: '가벼운 꾸미기' },
      { name: '탐험가 가방', price: 250, detail: '모험 분위기' },
      { name: '별 목걸이', price: 400, detail: '행복 보너스 소' },
    ],
  },
  {
    title: '새로운 공룡',
    icon: Egg,
    tone: 'from-cyan-100 to-emerald-100 border-cyan-200 text-cyan-800',
    items: [
      { name: '일반 알 조각', price: 120, detail: '일반 알 목표' },
      { name: '희귀 알 조각', price: 900, detail: '희귀 알 목표' },
      { name: '따뜻한 둥지', price: 120, detail: '부화 진행 보조' },
      { name: '탐험 지도 조각', price: 400, detail: '특별 알 단서' },
    ],
  },
];

const mapCards = [
  { name: '숲길 산책', state: '준비 중', reward: '알 조각 후보' },
  { name: '반짝 강가', state: '훈련 1세트 후 입장', reward: '코인 보너스' },
  { name: '구름 언덕', state: '추후 공개', reward: '희귀 단서' },
];

const pokedexCards = [
  { name: '초록 꼬마', rarity: '일반', unlocked: true },
  { name: '통통 트리케라', rarity: '일반', unlocked: true },
  { name: '???', rarity: '희귀', unlocked: false },
  { name: '???', rarity: '특별', unlocked: false },
  { name: '???', rarity: '전설', unlocked: false },
];

export default function App() {
  const [phase, setPhase] = useState<'title' | 'app'>('title');
  const [activeTab, setActiveTab] = useState<MainTab>('training');
  const [selectedProblem, setSelectedProblem] = useState(0);
  const [answer, setAnswer] = useState('');
  const [trainingFeedback, setTrainingFeedback] = useState('정답을 입력하고 확인해보세요.');
  const [lastBluetoothInput, setLastBluetoothInput] = useState<BluetoothNotificationPayload | null>(null);
  const [submittedProblemIndex, setSubmittedProblemIndex] = useState<number | null>(null);
  const [dinoView, setDinoView] = useState<DinoView>('care');
  const [dinoFeedback, setDinoFeedback] = useState('오늘도 주산훈련을 기다리고 있어요.');
  const [shopFeedback, setShopFeedback] = useState('상점은 목업입니다. 실제 구매는 아직 연결하지 않았습니다.');
  const lastBluetoothConfirmAtRef = useRef(0);

  const activeMeta = useMemo(() => mainTabs.find((tab) => tab.id === activeTab) ?? mainTabs[0], [activeTab]);
  const currentProblem = trainingProblems[selectedProblem];

  function handleSubmitAnswer(value = answer) {
    const submittedAnswer = value.trim();

    if (!submittedAnswer) {
      setTrainingFeedback('답을 먼저 입력해주세요.');
      return;
    }

    if (submittedProblemIndex === selectedProblem) {
      return;
    }

    setSubmittedProblemIndex(selectedProblem);

    if (submittedAnswer === currentProblem.answer) {
      setTrainingFeedback('정답! 코인 +10, 알 부화 게이지 +3%, 공룡 기분 +1');
    } else {
      setTrainingFeedback('조금만 더 생각해볼까요? 주판으로 다시 맞춰보세요.');
    }
  }

  function chooseProblem(index: number) {
    setSelectedProblem(index);
    setAnswer('');
    setSubmittedProblemIndex(null);
    setTrainingFeedback('정답을 입력하고 확인해보세요.');
  }

  function handleBluetoothNotification(payload: BluetoothNotificationPayload) {
    setLastBluetoothInput(payload);

    const nextAnswer = payload.parsedNumber !== null ? String(payload.parsedNumber) : answer;

    if (payload.parsedNumber !== null) {
      setAnswer(nextAnswer);
    }

    if (payload.isConfirmSignal) {
      const now = Date.now();
      if (now - lastBluetoothConfirmAtRef.current < 600) {
        return;
      }

      lastBluetoothConfirmAtRef.current = now;
      handleSubmitAnswer(nextAnswer);
    }
  }

  if (phase === 'title') {
    return (
      <div className="min-h-screen overflow-hidden bg-gradient-to-b from-sky-200 via-cyan-100 to-lime-100 p-4 text-slate-800 md:p-8">
        <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
          <section className="relative grid w-full gap-8 overflow-hidden rounded-[40px] border-4 border-white bg-white/78 p-6 shadow-[0_24px_60px_rgba(14,116,144,0.22)] backdrop-blur md:grid-cols-[1fr_0.9fr] md:p-10">
            <SkyDecor />
            <div className="relative z-10 flex flex-col justify-center">
              <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border-2 border-cyan-200 bg-white px-5 py-2 text-sm font-black text-cyan-800 shadow-sm">
                <Sparkles className="h-4 w-4" />
                주산훈련으로 자라는 공룡 친구
              </div>
              <h1 className="text-5xl font-black leading-tight text-emerald-950 md:text-7xl">주산 공룡 모험</h1>
              <p className="mt-5 max-w-xl text-xl font-black leading-relaxed text-emerald-800/80">
                문제를 풀고 보상을 모아 알을 부화시키고, 내 공룡을 돌보는 밝은 학습 모험입니다.
              </p>
              <button
                onClick={() => setPhase('app')}
                className="mt-8 inline-flex min-h-20 w-fit items-center justify-center gap-3 rounded-[26px] border-4 border-white bg-gradient-to-b from-cyan-400 to-cyan-500 px-10 text-2xl font-black text-white shadow-[0_10px_0_#0891b2,0_20px_28px_rgba(8,145,178,0.28)] transition hover:brightness-105 active:translate-y-1 active:shadow-[0_5px_0_#0891b2]"
              >
                훈련 시작
                <Play className="h-7 w-7 fill-white" />
              </button>
            </div>

            <div className="relative z-10 flex min-h-[440px] items-end justify-center rounded-[36px] bg-gradient-to-b from-sky-100 via-emerald-50 to-lime-200 p-6 shadow-inner">
              <div className="absolute bottom-0 left-0 right-0 h-28 rounded-t-[50%] bg-lime-300/70" />
              <div className="absolute left-8 top-8 rounded-[24px] border-4 border-white bg-white/90 px-5 py-4 shadow-lg">
                <p className="text-sm font-black text-cyan-700">오늘의 문제</p>
                <p className="text-4xl font-black text-slate-950">7 + 5 = ?</p>
              </div>
              <div className="absolute right-8 top-8 rounded-full border-4 border-white bg-amber-300 px-5 py-3 text-lg font-black text-amber-950 shadow-lg">+10 코인</div>
              <div className="absolute bottom-16 left-10 flex h-36 w-28 items-center justify-center rounded-[50%] border-8 border-white bg-gradient-to-br from-amber-200 to-orange-300 shadow-xl">
                <Egg className="h-14 w-14 text-white" />
              </div>
              <DinoAvatar size="hero" />
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-sky-200 via-cyan-100 to-lime-100 pb-28 text-slate-800">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-52 bg-[radial-gradient(circle_at_20%_25%,rgba(255,255,255,0.9),transparent_16%),radial-gradient(circle_at_72%_20%,rgba(255,255,255,0.75),transparent_14%)]" />
      <header className="sticky top-0 z-20 px-3 py-3 md:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-[28px] border-4 border-white bg-white/82 px-3 py-3 shadow-[0_12px_30px_rgba(14,116,144,0.16)] backdrop-blur md:px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-[22px] border-4 border-white bg-gradient-to-b from-emerald-300 to-emerald-400 text-white shadow-md">
              <Baby className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-xl font-black text-emerald-950 md:text-3xl">주산 공룡 모험</h1>
              <p className="hidden text-sm font-black text-emerald-700/75 sm:block">주산훈련 → 보상 → 알부화와 성장</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <HeaderPill icon={Coins} label="1,240" tone="coin" />
            <HeaderPill icon={Star} label="Lv. 3" tone="level" />
            <HeaderPill icon={BookOpen} label="2/5" tone="book" />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-3 py-3 md:px-6">
        <section className="mb-4 flex items-center gap-3 rounded-[30px] border-4 border-white bg-white/72 p-3 shadow-[0_10px_28px_rgba(14,116,144,0.12)] backdrop-blur md:p-4">
          <div className={`flex h-16 w-16 items-center justify-center rounded-[24px] border-4 border-white bg-gradient-to-b ${activeMeta.active} text-white shadow-md`}>
            <activeMeta.icon className={`h-8 w-8 ${activeMeta.color}`} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-emerald-950">{activeMeta.label}</h2>
            <p className="text-sm font-black text-emerald-700/70">화면 흐름과 디자인 방향을 확인하는 목업입니다.</p>
          </div>
        </section>

        {activeTab === 'training' && (
          <TrainingView
            currentProblem={currentProblem}
            selectedProblem={selectedProblem}
            answer={answer}
            feedback={trainingFeedback}
            bluetoothInput={lastBluetoothInput}
            onAnswer={setAnswer}
            onCheck={handleSubmitAnswer}
            onChooseProblem={chooseProblem}
          />
        )}
        {activeTab === 'dino' && (
          <DinoViewPanel
            view={dinoView}
            feedback={dinoFeedback}
            onView={setDinoView}
            onFeedback={setDinoFeedback}
          />
        )}
        {activeTab === 'hatchery' && <HatcheryView />}
        {activeTab === 'shop' && <ShopView feedback={shopFeedback} onFeedback={setShopFeedback} />}
        {activeTab === 'pokedex' && <PokedexView />}
        {activeTab === 'adventure' && <AdventureView />}
        {activeTab === 'settings' && <SettingsView onBluetoothNotification={handleBluetoothNotification} />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 px-2 pb-2">
        <div className="mx-auto grid max-w-5xl grid-cols-7 gap-1 rounded-[30px] border-4 border-white bg-white/90 p-2 shadow-[0_-12px_34px_rgba(14,116,144,0.2)] backdrop-blur">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const active = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex min-h-[68px] flex-col items-center justify-center gap-1 rounded-[22px] border-2 text-[10px] font-black transition active:translate-y-1 sm:text-sm ${
                  active
                    ? `border-white bg-gradient-to-b ${tab.active} shadow-[0_6px_0_rgba(15,23,42,0.16)]`
                    : 'border-transparent bg-transparent text-slate-500 hover:bg-sky-50'
                }`}
              >
                <Icon className={`h-6 w-6 ${active ? tab.color : 'text-slate-400'}`} />
                <span className={active ? 'text-slate-900' : ''}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function TrainingView({
  currentProblem,
  selectedProblem,
  answer,
  feedback,
  bluetoothInput,
  onAnswer,
  onCheck,
  onChooseProblem,
}: {
  currentProblem: { question: string; answer: string };
  selectedProblem: number;
  answer: string;
  feedback: string;
  bluetoothInput: BluetoothNotificationPayload | null;
  onAnswer: (value: string) => void;
  onCheck: () => void;
  onChooseProblem: (index: number) => void;
}) {
  const bluetoothStatus = bluetoothInput ? 'Bluetooth 입력 수신' : 'Bluetooth 입력 대기';
  const bluetoothStatusTone = bluetoothInput ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800';

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <section className="game-panel p-4 md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-3xl font-black text-emerald-950">오늘의 주산훈련</h3>
            <p className="mt-1 font-black text-emerald-700/70">훈련장 미션을 풀고 보상을 받아요.</p>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-full border-4 border-white px-4 py-2 text-xs font-black shadow-sm ${bluetoothStatusTone}`}>
            <Bluetooth className="h-4 w-4" />
            {bluetoothStatus}
          </div>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          {trainingProblems.map((problem, index) => (
            <button
              key={problem.question}
              onClick={() => onChooseProblem(index)}
              className={`min-h-24 rounded-[26px] border-4 px-4 text-left shadow-sm transition active:translate-y-1 ${
                selectedProblem === index ? 'border-white bg-gradient-to-b from-cyan-200 to-sky-200 text-cyan-950 shadow-[0_6px_0_#67e8f9]' : 'border-white bg-white/80 text-slate-600'
              }`}
            >
              <p className="text-xs font-black text-cyan-700">미션 {index + 1}</p>
              <p className="mt-1 text-3xl font-black">{problem.question}</p>
            </button>
          ))}
        </div>

        <div className="rounded-[34px] border-4 border-white bg-gradient-to-b from-cyan-100 via-white to-amber-100 p-5 shadow-inner md:p-8">
          <div className="text-center">
            <p className="mb-2 text-sm font-black text-cyan-700">선택한 문제</p>
            <p className="text-7xl font-black text-emerald-950 md:text-8xl">{currentProblem.question}</p>
          </div>
          <div className="mx-auto mt-8 grid max-w-xl gap-3 sm:grid-cols-[1fr_auto]">
            <input
              value={answer}
              onChange={(event) => onAnswer(event.target.value)}
              inputMode="numeric"
              placeholder="답 입력"
              className="min-h-20 rounded-[24px] border-4 border-white bg-white px-5 text-4xl font-black text-slate-900 shadow-inner outline-none focus:border-cyan-300"
            />
            <button onClick={onCheck} className="game-button min-h-20 bg-gradient-to-b from-cyan-400 to-cyan-500 shadow-cyan">
              <CheckCircle2 className="h-6 w-6" />
              정답 확인
            </button>
          </div>
          <div className="mx-auto mt-3 grid max-w-xl gap-2 rounded-[22px] border-4 border-white bg-white/70 px-4 py-3 text-xs font-black text-slate-600 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-emerald-800">마지막 Bluetooth 수신값</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-800">
                {bluetoothInput?.parsedNumber ?? '-'}
              </span>
            </div>
            <p className="break-all font-mono font-bold text-slate-500">raw: {bluetoothInput?.raw ?? '-'}</p>
            <p className="break-all font-mono font-bold text-slate-500">hex: {bluetoothInput?.hex ?? '-'}</p>
            <p className="break-all font-mono font-bold text-slate-500">text: {bluetoothInput?.text ?? '-'}</p>
            {bluetoothInput?.isConfirmSignal && (
              <p className="rounded-full bg-cyan-100 px-3 py-1 text-cyan-800">confirm signal received</p>
            )}
          </div>
          <p className="mx-auto mt-5 max-w-xl rounded-[24px] border-4 border-white bg-white/90 px-5 py-4 text-center text-lg font-black text-emerald-900 shadow-sm">{feedback}</p>
        </div>
      </section>

      <aside className="grid content-start gap-3">
        <RewardCard icon={Coins} title="코인 보상" value="+10" tone="from-amber-200 to-yellow-300 text-amber-900" />
        <RewardCard icon={Egg} title="알 부화 게이지" value="+3%" tone="from-orange-200 to-amber-300 text-orange-900" />
        <RewardCard icon={Heart} title="공룡 기분" value="+1" tone="from-pink-200 to-rose-300 text-rose-900" />
        <div className="rounded-[30px] border-4 border-white bg-lime-100 p-5 shadow-lg">
          <h4 className="text-xl font-black text-emerald-950">핵심 루프</h4>
          <p className="mt-2 font-black leading-relaxed text-emerald-700/80">훈련을 끝내면 보상을 얻고, 보상은 알부화와 공룡 돌봄으로 이어집니다.</p>
        </div>
      </aside>
    </div>
  );
}

function AdventureView() {
  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <section className="rounded-[34px] border-4 border-white bg-gradient-to-b from-emerald-100 to-lime-100 p-6 shadow-lg">
        <h3 className="text-3xl font-black text-emerald-950">모험 준비</h3>
        <p className="mt-3 font-black leading-relaxed text-emerald-700/80">추후 주산훈련 결과와 연결되어 알 조각과 단서를 얻는 탐험 콘텐츠입니다.</p>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {mapCards.map((card) => (
          <article key={card.name} className="rounded-[32px] border-4 border-white bg-white/86 p-5 shadow-lg">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-b from-emerald-200 to-lime-300 text-emerald-800 shadow-inner">
              <Map className="h-12 w-12" />
            </div>
            <h4 className="text-2xl font-black text-emerald-950">{card.name}</h4>
            <p className="mt-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-black text-emerald-800">{card.state}</p>
            <p className="mt-3 font-black text-slate-500">{card.reward}</p>
          </article>
        ))}
      </section>
    </div>
  );
}

function HatcheryView() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <section className="game-panel p-4 md:p-6">
        <div className="flex min-h-[500px] flex-col items-center justify-center rounded-[36px] border-4 border-white bg-gradient-to-b from-orange-100 via-amber-100 to-cyan-100 p-6 text-center shadow-inner">
          <div className="relative mb-8">
            <div className="absolute inset-x-8 bottom-0 h-10 rounded-full bg-orange-900/10 blur-md" />
            <div className="relative flex h-64 w-48 items-center justify-center rounded-[50%] border-[12px] border-white bg-gradient-to-br from-amber-100 via-white to-orange-200 shadow-xl">
              <Egg className="h-24 w-24 text-orange-400" />
            </div>
            <div className="absolute -right-8 top-10 rounded-full border-4 border-white bg-cyan-400 px-4 py-2 text-lg font-black text-white shadow-lg">+3%</div>
          </div>
          <h3 className="text-4xl font-black text-emerald-950">미확인 일반 알</h3>
          <p className="mt-2 max-w-md font-black leading-relaxed text-emerald-700/75">훈련장에서 문제를 풀면 부화 게이지가 오르고, 알의 단서가 조금씩 공개됩니다.</p>
          <div className="mt-8 w-full max-w-lg rounded-[26px] border-4 border-white bg-white/80 p-4 shadow-sm">
            <div className="mb-2 flex justify-between text-sm font-black text-emerald-800">
              <span>부화 진행률</span>
              <span>62%</span>
            </div>
            <div className="h-7 overflow-hidden rounded-full bg-orange-100 shadow-inner">
              <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-orange-400 to-cyan-400" />
            </div>
          </div>
        </div>
      </section>
      <aside className="grid content-start gap-3">
        <RewardCard icon={Play} title="다음 행동" value="훈련 1세트" tone="from-cyan-200 to-sky-300 text-cyan-900" />
        <RewardCard icon={Sparkles} title="알 힌트" value="작은 발자국" tone="from-amber-200 to-yellow-300 text-amber-900" />
        <RewardCard icon={ShoppingBag} title="보조 아이템" value="따뜻한 둥지" tone="from-orange-200 to-amber-300 text-orange-900" />
      </aside>
    </div>
  );
}

function DinoViewPanel({
  view,
  feedback,
  onView,
  onFeedback,
}: {
  view: DinoView;
  feedback: string;
  onView: (view: DinoView) => void;
  onFeedback: (message: string) => void;
}) {
  if (view === 'playground') {
    return (
      <section className="game-panel p-4 md:p-6">
        <button onClick={() => onView('care')} className="mb-4 rounded-full border-4 border-white bg-white/90 px-5 py-3 text-sm font-black text-emerald-800 shadow-sm">
          우리 공룡으로 돌아가기
        </button>
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="relative flex min-h-[520px] flex-col items-center justify-end overflow-hidden rounded-[36px] border-4 border-white bg-gradient-to-b from-sky-100 via-emerald-100 to-lime-300 p-6 text-center shadow-inner">
            <div className="absolute bottom-0 left-0 right-0 h-32 rounded-t-[50%] bg-lime-400/70" />
            <DinoAvatar size="hero" />
            <h3 className="relative z-10 text-4xl font-black text-emerald-950">작은 놀이터</h3>
            <p className="relative z-10 mt-2 rounded-full bg-white/90 px-5 py-2 font-black text-emerald-700 shadow-sm">{feedback}</p>
          </div>
          <div className="grid content-start gap-3">
            <PlayButton label="쓰다듬기" onClick={() => onFeedback('행복 +1')} />
            <PlayButton label="공 던지기" onClick={() => onFeedback('행복 +1, 체력 -1')} />
            <PlayButton label="쉬게 하기" onClick={() => onFeedback('체력 +1')} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <section className="game-panel p-4 md:p-6">
        <div className="grid gap-5 xl:grid-cols-[1fr_0.95fr]">
          <div className="relative flex min-h-[560px] items-end justify-center overflow-hidden rounded-[36px] border-4 border-white bg-gradient-to-b from-sky-100 via-emerald-100 to-lime-300 p-6">
            <div className="absolute bottom-0 left-0 right-0 h-36 rounded-t-[50%] bg-lime-400/70" />
            <div className="absolute right-8 top-8 rounded-[24px] border-4 border-white bg-white/90 px-5 py-3 text-lg font-black text-emerald-800 shadow-lg">기분 좋음</div>
            <DinoAvatar size="hero" />
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-sm font-black text-amber-700">대표 공룡</p>
            <h3 className="text-5xl font-black text-emerald-950">초록 꼬마</h3>
            <p className="mt-2 rounded-full bg-amber-100 px-4 py-2 text-base font-black text-amber-800">Lv. 3 · 성장 상태: 어린 공룡</p>
            <div className="mt-6 grid gap-4">
              <Meter label="EXP" value={44} tone="from-cyan-400 to-sky-500" />
              <Meter label="배고픔" value={68} tone="from-amber-400 to-orange-500" />
              <Meter label="행복" value={74} tone="from-pink-400 to-rose-500" />
              <Meter label="체력" value={81} tone="from-emerald-400 to-lime-500" />
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <button onClick={() => onFeedback('말랑 열매를 줬어요. 행복 +1')} className="game-button min-h-18 bg-gradient-to-b from-amber-300 to-orange-400 shadow-orange">
                먹이주기
              </button>
              <button onClick={() => onView('playground')} className="game-button min-h-18 bg-gradient-to-b from-emerald-300 to-emerald-500 shadow-green">
                놀이터로 이동
              </button>
            </div>
            <p className="mt-5 rounded-[24px] border-4 border-white bg-white/90 px-5 py-4 text-lg font-black text-emerald-900 shadow-sm">{feedback}</p>
          </div>
        </div>
      </section>
      <aside className="rounded-[34px] border-4 border-white bg-white/84 p-5 shadow-lg">
        <h4 className="mb-4 text-2xl font-black text-emerald-950">보유 사료 가방</h4>
        <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
          {foodBag.map((food) => (
            <div key={food.name} className="flex min-h-28 flex-col items-center justify-center rounded-[26px] border-4 border-white bg-gradient-to-b from-amber-100 to-orange-100 p-3 text-center shadow-sm">
              <Utensils className="mb-2 h-7 w-7 text-orange-500" />
              <span className="text-sm font-black text-amber-950">{food.name}</span>
              <span className="mt-1 rounded-full bg-white px-3 py-1 text-sm font-black text-orange-700">x{food.count}</span>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

function ShopView({ feedback, onFeedback }: { feedback: string; onFeedback: (message: string) => void }) {
  return (
    <div className="grid gap-5">
      <section className="rounded-[34px] border-4 border-white bg-gradient-to-r from-violet-100 to-fuchsia-100 p-5 shadow-lg">
        <h3 className="text-3xl font-black text-violet-950">상점 목업</h3>
        <p className="mt-2 font-black text-violet-800/75">음식, 코스튬, 새로운 공룡 목표 구조를 확인합니다.</p>
        <p className="mt-4 rounded-[22px] border-4 border-white bg-white/90 px-4 py-3 font-black text-violet-800 shadow-sm">{feedback}</p>
      </section>
      {shopSections.map((section) => {
        const Icon = section.icon;
        return (
          <section key={section.title} className={`rounded-[34px] border-4 bg-gradient-to-b p-5 shadow-lg ${section.tone}`}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-[22px] border-4 border-white bg-white/90 shadow-sm">
                <Icon className="h-8 w-8" />
              </div>
              <h4 className="text-3xl font-black">{section.title}</h4>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              {section.items.map((item) => (
                <article key={item.name} className="rounded-[28px] border-4 border-white bg-white/86 p-4 shadow-sm">
                  <h5 className="text-xl font-black text-slate-950">{item.name}</h5>
                  <p className="mt-2 min-h-12 text-sm font-black text-slate-500">{item.detail}</p>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-200 px-3 py-1 text-sm font-black text-amber-950">
                      <Coins className="h-4 w-4 text-amber-600" />
                      {item.price}
                    </span>
                    <button onClick={() => onFeedback(`목업: ${item.name} 구매 예정`)} className="rounded-full bg-violet-500 px-4 py-2 text-sm font-black text-white shadow-[0_4px_0_#7c3aed] transition active:translate-y-1 active:shadow-none">
                      구매
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function PokedexView() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {pokedexCards.map((card, index) => (
        <article key={`${card.name}-${card.rarity}-${index}`} className="rounded-[32px] border-4 border-white bg-white/86 p-4 shadow-lg">
          <div className={`mb-4 flex h-44 items-center justify-center rounded-[28px] ${card.unlocked ? 'bg-gradient-to-b from-sky-100 to-lime-100' : 'bg-gradient-to-b from-slate-200 to-slate-300'}`}>
            {card.unlocked ? (
              <DinoAvatar size="small" />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-slate-400 text-5xl font-black text-white">?</div>
            )}
          </div>
          <h3 className="text-xl font-black text-emerald-950">{card.name}</h3>
          <p className="mt-1 inline-flex rounded-full bg-sky-100 px-3 py-1 text-sm font-black text-sky-800">{card.rarity}</p>
          <p className="mt-3 text-sm font-black text-slate-500">{card.unlocked ? '발견 완료' : '알 부화 후 공개'}</p>
        </article>
      ))}
    </div>
  );
}

function SettingsView({ onBluetoothNotification }: { onBluetoothNotification: (payload: BluetoothNotificationPayload) => void }) {
  return (
    <div className="grid gap-5">
      <section className="rounded-[34px] border-4 border-white bg-white/84 p-5 shadow-lg">
        <h3 className="text-3xl font-black text-slate-950">설정</h3>
        <p className="mt-2 font-black text-slate-500">문제 설정과 저장 기능은 추후 연결 예정입니다.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <SettingChip label="숫자 개수" value="3개" />
          <SettingChip label="숫자 크기" value="한 자리/두 자리 예시" />
          <SettingChip label="세트 문제 수" value="20문제 예정" />
          <SettingChip label="연산 방식" value="덧셈 + 뺄셈" />
        </div>
      </section>
      <section className="rounded-[28px] border-4 border-dashed border-slate-300 bg-white/70 p-4 md:p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-800 text-white">
            <Bluetooth className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-xl font-black text-slate-950">주산 입력 장치 연결 테스트</h4>
            <p className="text-sm font-bold text-slate-500">Bluetooth 주판 입력을 확인하는 개발자 테스트 영역입니다.</p>
          </div>
        </div>
        <div className="scale-[0.98] rounded-[24px] bg-white/70 p-2">
          <BluetoothTestPanel onNotification={onBluetoothNotification} />
        </div>
      </section>
    </div>
  );
}

function HeaderPill({ icon: Icon, label, tone }: { icon: typeof Coins; label: string; tone: 'coin' | 'level' | 'book' }) {
  const toneClass = {
    coin: 'from-amber-200 to-yellow-300 text-amber-950',
    level: 'from-pink-200 to-rose-300 text-rose-950',
    book: 'from-sky-200 to-cyan-300 text-sky-950',
  }[tone];

  return (
    <div className={`inline-flex min-h-12 items-center gap-2 rounded-full border-4 border-white bg-gradient-to-b px-4 text-sm font-black shadow-sm ${toneClass}`}>
      <Icon className="h-5 w-5" />
      {label}
    </div>
  );
}

function DinoAvatar({ size }: { size: 'small' | 'large' | 'hero' }) {
  const shellSize = size === 'hero' ? 'h-[360px] w-[360px]' : size === 'large' ? 'h-64 w-64' : 'h-28 w-28';
  const bodySize = size === 'hero' ? 'h-52 w-56' : size === 'large' ? 'h-36 w-40' : 'h-16 w-20';
  const headSize = size === 'hero' ? 'h-36 w-40' : size === 'large' ? 'h-24 w-28' : 'h-12 w-14';
  const eyeSize = size === 'hero' ? 'h-4 w-4' : size === 'large' ? 'h-3 w-3' : 'h-1.5 w-1.5';

  return (
    <div className={`relative z-10 ${shellSize} drop-shadow-2xl`} aria-label="초록 꼬마 공룡">
      <div className={`absolute bottom-[13%] left-1/2 ${bodySize} -translate-x-1/2 rounded-[45%] border-4 border-emerald-200 bg-emerald-400`} />
      <div className={`absolute left-1/2 top-[12%] ${headSize} -translate-x-1/2 rounded-[45%] border-4 border-emerald-200 bg-emerald-300`} />
      <div className="absolute left-[38%] top-[27%] h-[12%] w-[12%] rounded-full bg-white">
        <div className={`absolute left-1/2 top-1/2 ${eyeSize} -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-800`} />
      </div>
      <div className="absolute right-[38%] top-[27%] h-[12%] w-[12%] rounded-full bg-white">
        <div className={`absolute left-1/2 top-1/2 ${eyeSize} -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-800`} />
      </div>
      <div className="absolute left-1/2 top-[43%] h-[4%] w-[18%] -translate-x-1/2 rounded-full bg-emerald-700/35" />
      <div className="absolute bottom-[30%] left-[17%] h-[16%] w-[12%] rotate-[-20deg] rounded-full bg-emerald-300" />
      <div className="absolute bottom-[30%] right-[17%] h-[16%] w-[12%] rotate-[20deg] rounded-full bg-emerald-300" />
      <div className="absolute bottom-[4%] left-[34%] h-[18%] w-[13%] rounded-full bg-emerald-500" />
      <div className="absolute bottom-[4%] right-[34%] h-[18%] w-[13%] rounded-full bg-emerald-500" />
      <div className="absolute right-[5%] top-[52%] h-[18%] w-[30%] rotate-[28deg] rounded-full bg-emerald-300" />
      <div className="absolute left-1/2 top-[8%] h-[8%] w-[8%] -translate-x-1/2 rounded-full bg-amber-200" />
      <div className="absolute left-[42%] top-[7%] h-[6%] w-[6%] rounded-full bg-amber-200" />
      <div className="absolute right-[42%] top-[7%] h-[6%] w-[6%] rounded-full bg-amber-200" />
    </div>
  );
}

function RewardCard({ icon: Icon, title, value, tone }: { icon: typeof Coins; title: string; value: string; tone: string }) {
  return (
    <div className={`rounded-[30px] border-4 border-white bg-gradient-to-b p-5 shadow-lg ${tone}`}>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-[20px] bg-white/80 shadow-sm">
        <Icon className="h-7 w-7" />
      </div>
      <p className="text-sm font-black opacity-80">{title}</p>
      <p className="mt-1 text-3xl font-black">{value}</p>
    </div>
  );
}

function Meter({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-[22px] border-4 border-white bg-white/80 p-3 shadow-sm">
      <div className="mb-2 flex justify-between text-sm font-black text-emerald-900">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-6 overflow-hidden rounded-full bg-slate-100 shadow-inner">
        <div className={`h-full rounded-full bg-gradient-to-r ${tone}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function PlayButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="game-button min-h-20 bg-gradient-to-b from-emerald-300 to-emerald-500 shadow-green">
      {label}
    </button>
  );
}

function SettingChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border-4 border-white bg-slate-50 px-4 py-3 shadow-sm">
      <p className="text-xs font-black text-slate-400">{label}</p>
      <p className="mt-1 font-black text-slate-800">{value}</p>
    </div>
  );
}

function SkyDecor() {
  return (
    <>
      <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-yellow-200/80" />
      <div className="absolute bottom-0 left-0 right-0 h-28 rounded-t-[50%] bg-lime-300/60" />
      <div className="absolute left-1/2 top-8 h-12 w-36 rounded-full bg-white/70 blur-sm" />
    </>
  );
}
