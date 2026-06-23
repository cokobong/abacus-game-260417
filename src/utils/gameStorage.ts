export const GAME_STORAGE_KEY = 'abacus-dino-game-state-v1';
export const GAME_STORAGE_CORRUPTED_KEY = 'abacus-dino-game-state-corrupted';
export const GAME_STORAGE_VERSION = 1;

export type StoredGameState<TState extends object> = TState & {
  version: number;
  savedAt: number;
};

export interface LoadGameStateResult<TState> {
  state: TState;
  message: string;
  loadedFromStorage: boolean;
  savedAt: number | null;
}

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function loadGameState<TState extends object>(fallbackState: TState): LoadGameStateResult<TState> {
  if (!canUseLocalStorage()) {
    return {
      state: fallbackState,
      message: 'localStorage를 사용할 수 없어 기본 상태로 시작했어요.',
      loadedFromStorage: false,
      savedAt: null,
    };
  }

  const raw = window.localStorage.getItem(GAME_STORAGE_KEY);
  if (!raw) {
    return {
      state: fallbackState,
      message: '저장된 데이터가 없어 기본 상태로 시작했어요.',
      loadedFromStorage: false,
      savedAt: null,
    };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredGameState<TState>> & { state?: TState };
    if (parsed.version !== GAME_STORAGE_VERSION) {
      return {
        state: fallbackState,
        message: '저장 데이터 버전이 맞지 않아 기본 상태로 시작했어요.',
        loadedFromStorage: false,
        savedAt: null,
      };
    }

    // Backward-compatible read for the earlier wrapper shape: { version, savedAt, state }.
    const restoredState = parsed.state ?? (() => {
      const { version: _version, savedAt: _savedAt, state: _state, ...flatState } = parsed;
      return flatState as TState;
    })();

    console.log('Loaded game state from localStorage.', {
      key: GAME_STORAGE_KEY,
      savedAt: parsed.savedAt,
      version: parsed.version,
    });

    return {
      state: restoredState,
      message: parsed.savedAt ? `저장 데이터를 불러왔어요. 마지막 저장: ${new Date(parsed.savedAt).toLocaleString()}` : '저장 데이터를 불러왔어요.',
      loadedFromStorage: true,
      savedAt: parsed.savedAt ?? null,
    };
  } catch (error) {
    console.warn('Failed to parse saved game state. Falling back to defaults.', error);
    window.localStorage.setItem(GAME_STORAGE_CORRUPTED_KEY, raw);
    return {
      state: fallbackState,
      message: '저장 데이터를 읽지 못해 기본 상태로 복구했어요.',
      loadedFromStorage: false,
      savedAt: null,
    };
  }
}

export function saveGameState<TState extends object>(state: TState) {
  if (!canUseLocalStorage()) return null;

  const payload: StoredGameState<TState> = {
    version: GAME_STORAGE_VERSION,
    savedAt: Date.now(),
    ...state,
  };

  window.localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(payload));
  return payload.savedAt;
}

export function clearGameState() {
  if (!canUseLocalStorage()) return false;

  window.localStorage.removeItem(GAME_STORAGE_KEY);
  return true;
}
