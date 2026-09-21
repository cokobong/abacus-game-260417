export const GAME_STORAGE_KEY = 'abacus-dino-game-state-v1';
export const GAME_STORAGE_CORRUPTED_KEY = 'abacus-dino-game-state-corrupted';
export const GAME_STORAGE_VERSION = 1;
export const TRAINING_INPUT_MODE_STORAGE_KEY = 'abacus-game.training-input-mode';
export const EGG_OWNERSHIP_RESET_MIGRATION_KEY = 'abacus-dino-egg-ownership-reset-2026-07-25-v1';
export const GAME_BACKUP_APP = 'abacus-dino-game';
export const GAME_BACKUP_VERSION = 1;

export const GAME_BACKUP_STORAGE_KEYS = [
  GAME_STORAGE_KEY,
  TRAINING_INPUT_MODE_STORAGE_KEY,
  EGG_OWNERSHIP_RESET_MIGRATION_KEY,
] as const;

type GameBackupStorageKey = (typeof GAME_BACKUP_STORAGE_KEYS)[number];

export interface GameBackupFile {
  app: typeof GAME_BACKUP_APP;
  version: typeof GAME_BACKUP_VERSION;
  exportedAt: string;
  data: Partial<Record<GameBackupStorageKey, unknown>>;
}

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateGameStateShape(value: unknown) {
  if (!isRecord(value)) return false;
  if (!isRecord(value.player) || typeof value.player.coins !== 'number') return false;
  if (!Array.isArray(value.ownedDinosaurs) || !Array.isArray(value.ownedEggs) || !Array.isArray(value.inventory)) return false;
  if (value.trainingHistory !== undefined && !Array.isArray(value.trainingHistory)) return false;
  if (value.rewardedTrainingSessionIds !== undefined && !Array.isArray(value.rewardedTrainingSessionIds)) return false;
  return value.userProfile === null || isRecord(value.userProfile);
}

function validateStoredGameState(value: unknown) {
  if (!isRecord(value) || value.version !== GAME_STORAGE_VERSION) return false;
  return validateGameStateShape(value.state ?? value);
}

export function createGameBackup(): GameBackupFile {
  if (!canUseLocalStorage()) {
    throw new Error('이 브라우저에서는 저장 데이터에 접근할 수 없습니다.');
  }

  const data: GameBackupFile['data'] = {};
  for (const key of GAME_BACKUP_STORAGE_KEYS) {
    const rawValue = window.localStorage.getItem(key);
    if (rawValue === null) continue;
    data[key] = key === GAME_STORAGE_KEY ? JSON.parse(rawValue) : rawValue;
  }

  if (!validateStoredGameState(data[GAME_STORAGE_KEY])) {
    throw new Error('내보낼 게임 저장 데이터가 없거나 올바르지 않습니다.');
  }

  return {
    app: GAME_BACKUP_APP,
    version: GAME_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
}

export function parseGameBackup(jsonText: string): GameBackupFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('JSON 형식이 올바르지 않은 파일입니다.');
  }

  if (!isRecord(parsed) || parsed.app !== GAME_BACKUP_APP) {
    throw new Error('주산 공룡 모험 백업 파일이 아닙니다.');
  }
  if (parsed.version !== GAME_BACKUP_VERSION) {
    throw new Error(`지원하지 않는 백업 버전입니다. 현재 지원 버전: ${GAME_BACKUP_VERSION}`);
  }
  if (typeof parsed.exportedAt !== 'string' || Number.isNaN(Date.parse(parsed.exportedAt))) {
    throw new Error('백업 생성 시간이 올바르지 않습니다.');
  }
  if (!isRecord(parsed.data) || !validateStoredGameState(parsed.data[GAME_STORAGE_KEY])) {
    throw new Error('필수 게임 진행 데이터가 없거나 손상되었습니다.');
  }

  const trainingInputMode = parsed.data[TRAINING_INPUT_MODE_STORAGE_KEY];
  if (trainingInputMode !== undefined && trainingInputMode !== 'pencil' && trainingInputMode !== 'keypad' && trainingInputMode !== 'bluetooth') {
    throw new Error('훈련 입력 방식 설정값이 올바르지 않습니다.');
  }

  return parsed as unknown as GameBackupFile;
}

export function importGameBackup(backup: GameBackupFile) {
  if (!canUseLocalStorage()) {
    throw new Error('이 브라우저에서는 저장 데이터를 복원할 수 없습니다.');
  }

  const previousValues = new Map<string, string | null>(
    GAME_BACKUP_STORAGE_KEYS.map((key) => [key, window.localStorage.getItem(key)]),
  );

  try {
    for (const key of GAME_BACKUP_STORAGE_KEYS) {
      const value = backup.data[key] ?? (key === EGG_OWNERSHIP_RESET_MIGRATION_KEY ? 'done' : undefined);
      if (value === undefined) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, key === GAME_STORAGE_KEY ? JSON.stringify(value) : String(value));
      }
    }
  } catch (error) {
    for (const [key, value] of previousValues) {
      if (value === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, value);
    }
    throw error;
  }
}

export function downloadGameBackup(backup: GameBackupFile) {
  if (typeof document === 'undefined' || typeof URL === 'undefined') {
    throw new Error('이 브라우저에서는 파일을 다운로드할 수 없습니다.');
  }

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const date = backup.exportedAt.slice(0, 10);
  const link = document.createElement('a');
  link.href = url;
  link.download = `abacus-dino-save-${date}.json`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function readGameBackupFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('백업 파일을 읽지 못했습니다.'));
    reader.readAsText(file);
  });
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
