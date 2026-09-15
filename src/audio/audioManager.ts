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
import dinopediaBgmMp3Url from '../assets/audio/bgm/dinopedia_bgm_discovery_loop_10s.mp3';
import dinopediaBgmOggUrl from '../assets/audio/bgm/dinopedia_bgm_discovery_loop_10s.ogg';
import dinosaurViewBgmMp3Url from '../assets/audio/bgm/dinosaur_view_bgm_friend_loop_10s.mp3';
import dinosaurViewBgmOggUrl from '../assets/audio/bgm/dinosaur_view_bgm_friend_loop_10s.ogg';
import homeBgmMp3Url from '../assets/audio/bgm/home_bgm_learning_loop_10s.mp3';
import homeBgmOggUrl from '../assets/audio/bgm/home_bgm_learning_loop_10s.ogg';
import shopBgmMp3Url from '../assets/audio/bgm/shop_bgm_toy_browse_loop_10s.mp3';
import shopBgmOggUrl from '../assets/audio/bgm/shop_bgm_toy_browse_loop_10s.ogg';
import type { AudioSettings } from '../types/game';

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
const backgroundMusicConfig: Record<BackgroundMusic, { mp3Src: string; oggSrc: string; volume: number }> = {
  home: { mp3Src: homeBgmMp3Url, oggSrc: homeBgmOggUrl, volume: 0.22 },
  dinosaur: { mp3Src: dinosaurViewBgmMp3Url, oggSrc: dinosaurViewBgmOggUrl, volume: 0.22 },
  shop: { mp3Src: shopBgmMp3Url, oggSrc: shopBgmOggUrl, volume: 0.2 },
  dinopedia: { mp3Src: dinopediaBgmMp3Url, oggSrc: dinopediaBgmOggUrl, volume: 0.2 },
};

let backgroundAudio: HTMLAudioElement | null = null;
let currentBackgroundMusic: BackgroundMusic | null = null;
let hasPendingBackgroundUnlock = false;
let hasBackgroundPlaybackUnlocked = false;
let isUsingBackgroundFallback = false;
let audioSettings: AudioSettings = {
  bgmEnabled: true,
  sfxEnabled: true,
};

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
  if (!audioSettings.sfxEnabled) return;
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
    void startCurrentBackgroundMusic(true);
  }
}

function requestBackgroundUnlock() {
  if (hasPendingBackgroundUnlock || typeof document === 'undefined') return;
  hasPendingBackgroundUnlock = true;
  document.addEventListener('pointerdown', retryBackgroundMusicAfterInteraction, { once: true });
  document.addEventListener('touchend', retryBackgroundMusicAfterInteraction, { once: true, passive: true });
  document.addEventListener('keydown', retryBackgroundMusicAfterInteraction, { once: true });
}

function clearBackgroundUnlock() {
  if (!hasPendingBackgroundUnlock || typeof document === 'undefined') return;
  hasPendingBackgroundUnlock = false;
  document.removeEventListener('pointerdown', retryBackgroundMusicAfterInteraction);
  document.removeEventListener('touchend', retryBackgroundMusicAfterInteraction);
  document.removeEventListener('keydown', retryBackgroundMusicAfterInteraction);
}

function logBackgroundPlaybackFailure(error: unknown) {
  const errorName = error instanceof DOMException ? error.name : error instanceof Error ? error.name : 'UnknownError';
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.warn('[BGM] 재생에 실패했습니다.', {
    track: currentBackgroundMusic,
    name: errorName,
    message: errorMessage,
  });
}

async function startCurrentBackgroundMusic(fromUserInteraction = false) {
  const audio = getBackgroundAudio();
  if (!audio || !currentBackgroundMusic || !audioSettings.bgmEnabled) return;

  try {
    await audio.play();
    if (fromUserInteraction) {
      hasBackgroundPlaybackUnlocked = true;
    }
    clearBackgroundUnlock();
  } catch (error) {
    logBackgroundPlaybackFailure(error);
    requestBackgroundUnlock();
  }
}

function configureBackgroundMusic(track: BackgroundMusic) {
  const audio = getBackgroundAudio();
  if (!audio) return;

  if (currentBackgroundMusic !== track) {
    const config = backgroundMusicConfig[track];
    currentBackgroundMusic = track;
    isUsingBackgroundFallback = false;
    audio.pause();
    audio.src = config.mp3Src;
    audio.volume = config.volume;
    audio.currentTime = 0;
    audio.onerror = () => {
      if (!currentBackgroundMusic || isUsingBackgroundFallback) return;
      const fallbackConfig = backgroundMusicConfig[currentBackgroundMusic];
      isUsingBackgroundFallback = true;
      console.warn('[BGM] MP3 로드 실패로 OGG 보조 소스를 사용합니다.', { track: currentBackgroundMusic });
      audio.src = fallbackConfig.oggSrc;
      audio.load();
      if (hasBackgroundPlaybackUnlocked) {
        void startCurrentBackgroundMusic();
      }
    };
    audio.load();
  }
}

export function playBackgroundMusic(track: BackgroundMusic) {
  configureBackgroundMusic(track);
  if (!audioSettings.bgmEnabled) return;
  if (hasBackgroundPlaybackUnlocked) {
    void startCurrentBackgroundMusic();
  } else {
    requestBackgroundUnlock();
  }
}

export function unlockAndPlayBackgroundMusic(track: BackgroundMusic) {
  configureBackgroundMusic(track);
  return startCurrentBackgroundMusic(true);
}

export function setAudioSettings(nextSettings: AudioSettings, fromUserInteraction = false) {
  const wasBgmEnabled = audioSettings.bgmEnabled;
  audioSettings = nextSettings;

  if (!audioSettings.sfxEnabled) {
    for (const audio of audioByEffect.values()) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  if (!audioSettings.bgmEnabled) {
    clearBackgroundUnlock();
    backgroundAudio?.pause();
    return Promise.resolve();
  }

  if (currentBackgroundMusic && (fromUserInteraction || !wasBgmEnabled)) {
    return startCurrentBackgroundMusic(fromUserInteraction);
  }

  return Promise.resolve();
}

export function stopBackgroundMusic() {
  clearBackgroundUnlock();
  currentBackgroundMusic = null;
  if (!backgroundAudio) return;

  backgroundAudio.pause();
  backgroundAudio.currentTime = 0;
}
