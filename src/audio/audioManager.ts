import dinoEatUrl from '../assets/audio/dino/dino_eat.wav';
import dinoHappyUrl from '../assets/audio/dino/dino_happy.mp3';
import itemSelectUrl from '../assets/audio/items/item_select.wav';
import itemUseUrl from '../assets/audio/items/item_use.wav';
import levelUpUrl from '../assets/audio/rewards/level_up.mp3';
import rewardCoinUrl from '../assets/audio/rewards/reward_coin.wav';
import trainingCorrectUrl from '../assets/audio/training/training_correct.wav';
import trainingNumberInputUrl from '../assets/audio/training/training_number_input.wav';
import trainingSubmitUrl from '../assets/audio/training/training_submit.wav';
import trainingWrongUrl from '../assets/audio/training/training_wrong.wav';
import uiButtonTapUrl from '../assets/audio/ui/ui_button_tap.wav';
import uiTabSwitchUrl from '../assets/audio/ui/ui_tab_switch.wav';
import dinopediaBgmUrl from '../assets/audio/bgm/dinopedia_bgm_discovery_loop_10s.ogg';
import dinosaurViewBgmUrl from '../assets/audio/bgm/dinosaur_view_bgm_friend_loop_10s.ogg';
import homeBgmUrl from '../assets/audio/bgm/home_bgm_learning_loop_10s.ogg';
import shopBgmUrl from '../assets/audio/bgm/shop_bgm_toy_browse_loop_10s.ogg';

export type BackgroundMusic = 'home' | 'dinosaur' | 'shop' | 'dinopedia';

export type SoundEffect =
  | 'ui_button_tap'
  | 'ui_tab_switch'
  | 'training_number_input'
  | 'training_submit'
  | 'training_correct'
  | 'training_wrong'
  | 'reward_coin'
  | 'item_select'
  | 'item_use'
  | 'dino_eat'
  | 'dino_happy'
  | 'level_up';

const soundConfig: Record<SoundEffect, { src: string; volume: number; minIntervalMs: number }> = {
  ui_button_tap: { src: uiButtonTapUrl, volume: 0.25, minIntervalMs: 60 },
  ui_tab_switch: { src: uiTabSwitchUrl, volume: 0.3, minIntervalMs: 80 },
  training_number_input: { src: trainingNumberInputUrl, volume: 0.18, minIntervalMs: 30 },
  training_submit: { src: trainingSubmitUrl, volume: 0.3, minIntervalMs: 100 },
  training_correct: { src: trainingCorrectUrl, volume: 0.55, minIntervalMs: 180 },
  training_wrong: { src: trainingWrongUrl, volume: 0.4, minIntervalMs: 180 },
  reward_coin: { src: rewardCoinUrl, volume: 0.5, minIntervalMs: 200 },
  item_select: { src: itemSelectUrl, volume: 0.35, minIntervalMs: 80 },
  item_use: { src: itemUseUrl, volume: 0.55, minIntervalMs: 180 },
  dino_eat: { src: dinoEatUrl, volume: 0.55, minIntervalMs: 250 },
  dino_happy: { src: dinoHappyUrl, volume: 0.5, minIntervalMs: 250 },
  level_up: { src: levelUpUrl, volume: 0.6, minIntervalMs: 400 },
};

const audioByEffect = new Map<SoundEffect, HTMLAudioElement>();
const lastPlayedAt = new Map<SoundEffect, number>();
const backgroundMusicConfig: Record<BackgroundMusic, { src: string; volume: number }> = {
  home: { src: homeBgmUrl, volume: 0.22 },
  dinosaur: { src: dinosaurViewBgmUrl, volume: 0.22 },
  shop: { src: shopBgmUrl, volume: 0.2 },
  dinopedia: { src: dinopediaBgmUrl, volume: 0.2 },
};

let backgroundAudio: HTMLAudioElement | null = null;
let currentBackgroundMusic: BackgroundMusic | null = null;
let hasPendingBackgroundUnlock = false;

function getAudio(effect: SoundEffect) {
  if (typeof Audio === 'undefined') return null;
  const existing = audioByEffect.get(effect);
  if (existing) return existing;

  const config = soundConfig[effect];
  const audio = new Audio(config.src);
  audio.preload = 'auto';
  audio.volume = config.volume;
  audioByEffect.set(effect, audio);
  return audio;
}

export function playSound(effect: SoundEffect) {
  const now = Date.now();
  const config = soundConfig[effect];
  if (now - (lastPlayedAt.get(effect) ?? 0) < config.minIntervalMs) return;

  const audio = getAudio(effect);
  if (!audio) return;

  lastPlayedAt.set(effect, now);
  try {
    audio.pause();
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // Audio is optional and must never interrupt gameplay.
    });
  } catch {
    // Browser playback failures are intentionally ignored.
  }
}

function getBackgroundAudio() {
  if (typeof Audio === 'undefined') return null;
  if (backgroundAudio) return backgroundAudio;

  backgroundAudio = new Audio();
  backgroundAudio.loop = true;
  backgroundAudio.preload = 'auto';
  return backgroundAudio;
}

function retryBackgroundMusicAfterInteraction() {
  clearBackgroundUnlock();
  if (currentBackgroundMusic) {
    void startCurrentBackgroundMusic();
  }
}

function requestBackgroundUnlock() {
  if (hasPendingBackgroundUnlock || typeof document === 'undefined') return;
  hasPendingBackgroundUnlock = true;
  document.addEventListener('pointerdown', retryBackgroundMusicAfterInteraction, { once: true });
  document.addEventListener('keydown', retryBackgroundMusicAfterInteraction, { once: true });
}

function clearBackgroundUnlock() {
  if (!hasPendingBackgroundUnlock || typeof document === 'undefined') return;
  hasPendingBackgroundUnlock = false;
  document.removeEventListener('pointerdown', retryBackgroundMusicAfterInteraction);
  document.removeEventListener('keydown', retryBackgroundMusicAfterInteraction);
}

async function startCurrentBackgroundMusic() {
  const audio = getBackgroundAudio();
  if (!audio || !currentBackgroundMusic) return;

  try {
    await audio.play();
    clearBackgroundUnlock();
  } catch {
    // Browsers may block autoplay until the first user interaction.
    requestBackgroundUnlock();
  }
}

export function playBackgroundMusic(track: BackgroundMusic) {
  const audio = getBackgroundAudio();
  if (!audio) return;

  if (currentBackgroundMusic !== track) {
    const config = backgroundMusicConfig[track];
    currentBackgroundMusic = track;
    audio.pause();
    audio.src = config.src;
    audio.volume = config.volume;
    audio.currentTime = 0;
    audio.load();
  }

  void startCurrentBackgroundMusic();
}

export function stopBackgroundMusic() {
  clearBackgroundUnlock();
  currentBackgroundMusic = null;
  if (!backgroundAudio) return;

  backgroundAudio.pause();
  backgroundAudio.currentTime = 0;
}
