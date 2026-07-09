import homeBackground from '../../assets/home/home_bg_farm_full.png?url';
import homeButtonDino from '../../assets/home/home_btn_dino.png?url';
import homeButtonSetting from '../../assets/home/home_btn_setting.png?url';
import homeButtonShop from '../../assets/home/home_btn_shop.png?url';
import homeButtonSound from '../../assets/home/home_btn_sound.png?url';
import homeButtonTrain from '../../assets/home/home_btn_train.png?url';
import homeCoinBar from '../../assets/home/home_coin_bar.png?url';

type HomeRoute = 'training' | 'dino' | 'shop' | 'settings';

export interface HomeScreenProps {
  coins: number;
  dinosaurName: string;
  onNavigate: (screen: HomeRoute) => void;
}

const homeAssets = {
  background: homeBackground,
  soundButton: homeButtonSound,
  coinBar: homeCoinBar,
};

const homeActions: Array<{
  id: HomeRoute;
  image: string | undefined;
  label: string;
}> = [
  {
    id: 'training',
    image: homeButtonTrain,
    label: '훈련 시작',
  },
  {
    id: 'dino',
    image: homeButtonDino,
    label: '공룡 보기',
  },
  {
    id: 'shop',
    image: homeButtonShop,
    label: '상점',
  },
  {
    id: 'settings',
    image: homeButtonSetting,
    label: '설정',
  },
];

export function HomeScreen({ coins, onNavigate }: HomeScreenProps) {
  return (
    <section className="flex h-full min-h-0 w-full items-center justify-center overflow-hidden bg-sky-100">
      <div className="relative aspect-[3/4] h-full max-h-full w-auto max-w-full overflow-hidden bg-sky-200">
        {homeAssets.background && (
          <img
            src={homeAssets.background}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
        )}

        <header className="absolute inset-x-0 top-0 z-20 flex items-start justify-between px-[5.5%] pt-[5%]">
          <button
            type="button"
            className="block h-auto w-[clamp(64px,12%,84px)] p-0 transition active:translate-y-1"
            aria-label="소리 설정"
          >
            {homeAssets.soundButton && (
              <img
                src={homeAssets.soundButton}
                alt=""
                className="block h-auto w-full object-contain"
                draggable={false}
              />
            )}
          </button>

          <div className="relative w-[clamp(140px,30%,210px)]">
            {homeAssets.coinBar && (
              <img
                src={homeAssets.coinBar}
                alt=""
                className="block h-auto w-full object-contain"
                draggable={false}
              />
            )}
            <span className="absolute inset-0 flex items-center justify-center pb-[1%] pl-[14%] text-[clamp(0.9rem,2.2vh,1.25rem)] font-black leading-none text-yellow-200 drop-shadow-[0_2px_0_rgba(0,0,0,.38)]">
              {coins.toLocaleString()}
            </span>
          </div>
        </header>

        <nav className="absolute inset-x-0 bottom-[5%] z-20 flex h-[40%] flex-col items-center justify-center gap-[clamp(8px,1.1vh,10px)]">
          {homeActions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => onNavigate(action.id)}
              className="block w-[clamp(260px,48%,360px)] max-w-[72%] overflow-hidden border-0 bg-transparent p-0 transition hover:brightness-105 active:translate-y-1"
              aria-label={action.label}
            >
              {action.image && (
                <img
                  src={action.image}
                  alt=""
                  className="block h-auto w-full object-contain"
                  draggable={false}
                />
              )}
            </button>
          ))}
        </nav>
      </div>
    </section>
  );
}
