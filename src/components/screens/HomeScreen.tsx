import { Baby, Calculator, Coins, Settings, ShoppingBag, Volume2, type LucideIcon } from 'lucide-react';

type HomeRoute = 'training' | 'dino' | 'shop' | 'settings';

export interface HomeScreenProps {
  coins: number;
  dinosaurName: string;
  onNavigate: (screen: HomeRoute) => void;
}

const homeAssetModules = import.meta.glob('../../assets/home/*.png', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;
const fallbackHomeAssetModules = import.meta.glob('../../home/*.png', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;

const homeAssets = {
  background: homeAsset('home_bg_farm.png'),
  logo: homeAsset('home_logo_title.png'),
  dino: homeAsset('home_dino_main.png'),
  soundButton: homeAsset('home_btn_sound.png'),
  coinBar: homeAsset('home_coin_bar.png') ?? homeAsset('home_coin.png'),
};

const homeActions: Array<{
  id: HomeRoute;
  label: string;
  subtitle: string;
  icon: LucideIcon;
  tone: string;
  iconTone: string;
}> = [
  {
    id: 'training',
    label: '훈련 시작',
    subtitle: '계산 훈련을 시작해요!',
    icon: Calculator,
    tone: 'from-[#ffe66d] via-[#ffbd3d] to-[#f47c22] text-orange-950 shadow-[0_8px_0_#c45a12]',
    iconTone: 'bg-orange-100 text-orange-600',
  },
  {
    id: 'dino',
    label: '공룡 보기',
    subtitle: '먹이 주고 돌보기',
    icon: Baby,
    tone: 'from-[#b9f86e] via-[#58d879] to-[#16a56b] text-emerald-950 shadow-[0_8px_0_#087f5b]',
    iconTone: 'bg-lime-100 text-emerald-700',
  },
  {
    id: 'shop',
    label: '상점',
    subtitle: '먹이와 알 준비',
    icon: ShoppingBag,
    tone: 'from-[#ffd777] via-[#ff9f43] to-[#ef6c2f] text-amber-950 shadow-[0_8px_0_#c2410c]',
    iconTone: 'bg-amber-100 text-orange-600',
  },
  {
    id: 'settings',
    label: '설정',
    subtitle: '난이도와 주판 연결',
    icon: Settings,
    tone: 'from-[#e8f7ff] via-[#b9e8ff] to-[#79c7f2] text-sky-950 shadow-[0_8px_0_#0284c7]',
    iconTone: 'bg-sky-100 text-sky-700',
  },
];

export function HomeScreen({ coins, dinosaurName, onNavigate }: HomeScreenProps) {
  return (
    <section className="relative isolate h-full min-h-0 overflow-hidden rounded-[30px] border-4 border-white bg-gradient-to-b from-sky-200 via-cyan-100 to-lime-100 shadow-[inset_0_1px_0_rgba(255,255,255,.8)]">
      {homeAssets.background ? (
        <img src={homeAssets.background} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#9fe7ff_0%,#dff8ff_35%,#bdf1b3_72%,#75cf70_100%)]" />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,0)_38%,rgba(16,105,58,.1))]" />

      <div className="relative z-10 grid h-full min-h-0 grid-rows-[auto_23%_minmax(0,1fr)_auto] px-6 pb-6 pt-5 md:px-9 md:pb-9 md:pt-7">
        <header className="flex min-h-[10%] shrink-0 items-start justify-between gap-4">
          <button
            type="button"
            className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-[20px] transition active:translate-y-1 md:h-16 md:w-16"
            aria-label="소리 설정"
          >
            {homeAssets.soundButton ? <img src={homeAssets.soundButton} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <span className="absolute inset-0 rounded-[20px] border-4 border-white bg-white/82 shadow-md" />}
            <Volume2 className="relative z-10 h-7 w-7 text-cyan-700" strokeWidth={3} />
          </button>

          <div className="relative flex h-14 w-[min(34%,210px)] min-w-[168px] items-center justify-center px-5 md:h-16 md:min-w-[190px]">
            {homeAssets.coinBar ? <img src={homeAssets.coinBar} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <span className="absolute inset-0 rounded-full border-4 border-white bg-amber-200 shadow-md" />}
            <span className="relative z-10 inline-flex items-center gap-2 text-lg font-black text-white drop-shadow-[0_2px_0_rgba(15,23,42,.35)] md:text-xl">
              <Coins className="h-5 w-5 text-yellow-200 md:h-6 md:w-6" />
              {coins.toLocaleString()}
            </span>
          </div>
        </header>

        <div className="relative z-10 mx-auto flex w-full items-center justify-center">
          {homeAssets.logo ? (
            // TODO: transparent asset required if a future logo export contains baked checkerboard pixels.
            <img src={homeAssets.logo} alt="공룡 주산 훈련소" className="w-[52%] min-w-[300px] max-w-[420px] object-contain drop-shadow-[0_8px_0_rgba(14,116,144,.16)]" />
          ) : (
            <div className="text-center">
              <p className="mx-auto w-fit rounded-full border-2 border-white bg-white/76 px-4 py-1 text-xs font-black text-emerald-700 shadow-sm">매일 조금씩 강해지는</p>
              <h1 className="mt-2 text-4xl font-black leading-none text-emerald-950 drop-shadow-sm md:text-6xl">공룡 주산<br />훈련소</h1>
            </div>
          )}
        </div>

        <div className="relative mx-auto flex min-h-0 w-full max-w-[560px] items-center justify-center py-2">
          <div className="absolute bottom-[10%] h-[24%] w-[68%] rounded-[50%] bg-lime-700/12 blur-sm" />
          {homeAssets.dino ? (
            <img src={homeAssets.dino} alt={`${dinosaurName} 메인 공룡`} className="relative z-10 h-[clamp(230px,25dvh,300px)] max-h-full w-full object-contain object-center drop-shadow-[0_18px_18px_rgba(20,83,45,.24)]" />
          ) : (
            <FallbackHomeDino />
          )}
        </div>

        <nav className="relative z-20 mx-auto grid w-full max-w-[620px] shrink-0 gap-3.5 pb-2 md:gap-4 md:pb-3">
          {homeActions.map((action) => (
            <div key={action.id} className="contents">
              <HomeMenuButton action={action} onClick={() => onNavigate(action.id)} />
            </div>
          ))}
        </nav>
      </div>
    </section>
  );
}

function homeAsset(fileName: string) {
  return homeAssetModules[`../../assets/home/${fileName}`] ?? fallbackHomeAssetModules[`../../home/${fileName}`];
}

function HomeMenuButton({
  action,
  onClick,
}: {
  action: (typeof homeActions)[number];
  onClick: () => void;
}) {
  const Icon = action.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative min-h-[84px] overflow-hidden rounded-[28px] border-4 border-white bg-gradient-to-b px-5 text-left transition hover:brightness-105 active:translate-y-1 active:shadow-none md:min-h-[96px] md:px-6 ${action.tone}`}
    >
      <span className="pointer-events-none absolute inset-x-5 top-2 h-5 rounded-full bg-white/28 blur-sm" />
      <span className="relative z-10 grid min-w-0 grid-cols-[58px_minmax(0,1fr)] items-center gap-4 md:grid-cols-[66px_minmax(0,1fr)] md:gap-5">
        <span className={`flex h-14 w-14 items-center justify-center rounded-[20px] border-2 border-white/70 shadow-inner md:h-16 md:w-16 ${action.iconTone}`}>
          <Icon className="h-8 w-8 md:h-9 md:w-9" strokeWidth={3} />
        </span>
        <span className="min-w-0">
          <span className="block text-[clamp(1.45rem,3.2vw,2rem)] font-black leading-tight tracking-normal text-white drop-shadow-[0_2px_0_rgba(15,23,42,.34)]">
            {action.label}
          </span>
          <span className="mt-1 block truncate text-sm font-black tracking-normal text-white/90 drop-shadow-[0_1px_0_rgba(15,23,42,.25)] md:text-base">
            {action.subtitle}
          </span>
        </span>
      </span>
    </button>
  );
}

function FallbackHomeDino() {
  return (
    <div className="relative z-10 h-[clamp(230px,25dvh,300px)] w-full max-w-[300px] drop-shadow-2xl" aria-label="메인 공룡">
      <div className="absolute bottom-[8%] left-1/2 h-[52%] w-[58%] -translate-x-1/2 rounded-[46%] border-8 border-emerald-200 bg-emerald-400" />
      <div className="absolute left-1/2 top-[12%] h-[36%] w-[44%] -translate-x-1/2 rounded-[45%] border-8 border-emerald-200 bg-emerald-300" />
      <div className="absolute left-[39%] top-[27%] h-[8%] w-[8%] rounded-full bg-white">
        <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-800" />
      </div>
      <div className="absolute right-[39%] top-[27%] h-[8%] w-[8%] rounded-full bg-white">
        <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-800" />
      </div>
      <div className="absolute left-1/2 top-[42%] h-[3%] w-[14%] -translate-x-1/2 rounded-full bg-emerald-700/35" />
      <div className="absolute bottom-[28%] left-[19%] h-[14%] w-[11%] rotate-[-20deg] rounded-full bg-emerald-300" />
      <div className="absolute bottom-[28%] right-[19%] h-[14%] w-[11%] rotate-[20deg] rounded-full bg-emerald-300" />
      <div className="absolute bottom-[2%] left-[35%] h-[16%] w-[12%] rounded-full bg-emerald-500" />
      <div className="absolute bottom-[2%] right-[35%] h-[16%] w-[12%] rounded-full bg-emerald-500" />
      <div className="absolute left-1/2 top-[6%] h-[8%] w-[8%] -translate-x-1/2 rounded-full bg-amber-200" />
    </div>
  );
}
