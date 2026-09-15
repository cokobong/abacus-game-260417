import homeBackground from '../../assets/home/home_bg_farm_full.png?url';
import homeButtonDino from '../../assets/home/home_btn_dino.png?url';
import homeButtonSetting from '../../assets/home/home_btn_setting.png?url';
import homeButtonShop from '../../assets/home/home_btn_shop.png?url';
import homeButtonSound from '../../assets/home/home_btn_sound.png?url';
import homeButtonTrain from '../../assets/home/home_btn_train.png?url';
import homeCoinBar from '../../assets/home/home_coin_bar.png?url';
import type { CSSProperties } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

type HomeRoute = 'training' | 'dino' | 'shop' | 'settings';

export interface HomeScreenProps {
  audioEnabled: boolean;
  coins: number;
  dinosaurName: string;
  onNavigate: (screen: HomeRoute) => void;
  onToggleAudio: () => void;
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
  imageScaleX: number;
  imageScaleY: number;
  imageOffsetY: number;
}> = [
  {
    id: 'training',
    image: homeButtonTrain,
    label: '훈련 시작',
    imageScaleX: 1.131,
    imageScaleY: 1.061,
    imageOffsetY: -1.2,
  },
  {
    id: 'dino',
    image: homeButtonDino,
    label: '공룡 보기',
    imageScaleX: 1.094,
    imageScaleY: 1.344,
    imageOffsetY: 0.5,
  },
  {
    id: 'shop',
    image: homeButtonShop,
    label: '상점',
    imageScaleX: 1.019,
    imageScaleY: 1.35,
    imageOffsetY: 0.7,
  },
  {
    id: 'settings',
    image: homeButtonSetting,
    label: '설정',
    imageScaleX: 1.064,
    imageScaleY: 1.124,
    imageOffsetY: 0.2,
  },
];

export function HomeScreen({ audioEnabled, coins, onNavigate, onToggleAudio }: HomeScreenProps) {
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
            onClick={onToggleAudio}
            className="relative flex min-h-[64px] w-[clamp(96px,18%,132px)] items-center justify-center overflow-hidden border-0 bg-transparent p-0 transition hover:brightness-105 active:translate-y-1"
            aria-label={audioEnabled ? '소리 끄기' : '소리 켜기'}
            title={audioEnabled ? '소리 끄기' : '소리 켜기'}
            aria-pressed={!audioEnabled}
          >
            {homeAssets.soundButton && (
              <img
                src={homeAssets.soundButton}
                alt=""
                className={`block h-auto w-full object-contain transition ${audioEnabled ? '' : 'brightness-75 saturate-50'}`}
                draggable={false}
              />
            )}
            {!homeAssets.soundButton && (audioEnabled ? <Volume2 className="h-10 w-10 text-cyan-800" /> : <VolumeX className="h-10 w-10 text-slate-700" />)}
            {!audioEnabled && (
              <span className="absolute right-[8%] top-[12%] grid h-[clamp(28px,5vw,38px)] w-[clamp(28px,5vw,38px)] place-items-center rounded-full border-2 border-white bg-slate-700 text-white shadow-md">
                <VolumeX className="h-[68%] w-[68%]" aria-hidden="true" />
              </span>
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
            <span className="absolute inset-0 flex -translate-y-[5px] items-center justify-center pb-[1%] pl-[14%] text-[clamp(0.9rem,2.2vh,1.25rem)] font-black leading-none text-yellow-200 drop-shadow-[0_2px_0_rgba(0,0,0,.38)]">
              {coins.toLocaleString()}
            </span>
          </div>
        </header>

        <nav className="absolute inset-x-0 bottom-[5%] z-20 flex h-[40%] translate-y-[35px] flex-col items-center justify-center gap-[clamp(1px,calc(0.8vh-5px),3px)]">
          {homeActions.map((action) => {
            const imageStyle = {
              '--home-action-scale-x': action.imageScaleX,
              '--home-action-scale-y': action.imageScaleY,
              '--home-action-offset-y': `${action.imageOffsetY}%`,
            } as CSSProperties;

            return (
              <button
                key={action.id}
                type="button"
                onClick={() => onNavigate(action.id)}
                className="flex h-[clamp(65px,9vh,82px)] w-[clamp(260px,48%,360px)] max-w-[72%] flex-none items-center justify-center overflow-hidden border-0 bg-transparent p-0 transition hover:brightness-105 active:translate-y-1"
                aria-label={action.label}
              >
                {action.image && (
                  <img
                    src={action.image}
                    alt=""
                    className="block h-full w-full origin-center object-fill [transform:translateY(var(--home-action-offset-y))_scaleX(var(--home-action-scale-x))_scaleY(var(--home-action-scale-y))]"
                    style={imageStyle}
                    draggable={false}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </section>
  );
}
