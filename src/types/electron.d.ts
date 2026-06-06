import type { WubiChar, WubiWord } from '@/lib/wubi/lookup';

export {};

export interface PracticeSessionRecord {
  id: number;
  mode: 'article' | 'word-invaders' | 'bubble' | 'key-drill';
  startedAt: number;
  endedAt: number;
  durationMs: number;
  totalChars: number;
  correctChars: number;
  wpm: number;
  accuracy: number;
  textSource: string | null;
  configJson: string | null;
}

export interface SessionErrorRecord {
  id: number;
  sessionId: number;
  position: number;
  expected: string;
  typed: string;
  expectedCode: string;
  typedCode: string | null;
  createdAt: number;
}

export interface SessionSummary {
  count: number;
  totalDurationMs: number;
  avgWpm: number;
  avgAccuracy: number;
  bestWpm: number;
  totalChars: number;
  totalErrors: number;
}

export interface AppSettingsValue {
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  showVirtualKeyboard: boolean;
  soundEnabled: boolean;
  soundVolume: number;
  updateSource: 'github' | 'gitee';
}

export interface UpdaterStatus {
  available: boolean;
  downloaded: boolean;
  currentVersion: string;
  version: string | null;
  releaseNotes: string | null;
  progress: number;
  error: string | null;
}

export interface ElectronAPI {
  ping: () => Promise<string>;
  db: {
    lookupChar: (char: string) => Promise<WubiChar | null>;
    lookupCode: (code: string) => Promise<WubiChar[]>;
    lookupWord: (word: string) => Promise<WubiWord | null>;
    listCoreChars: (limit: number) => Promise<WubiChar[]>;
    listCoreWords: (limit: number) => Promise<WubiWord[]>;
  };
  sessions: {
    insert: (
      session: Omit<PracticeSessionRecord, 'id'>,
      errors: ReadonlyArray<Omit<SessionErrorRecord, 'id' | 'sessionId' | 'createdAt'>>,
    ) => Promise<number>;
    list: (mode?: PracticeSessionRecord['mode'], limit?: number) => Promise<PracticeSessionRecord[]>;
    errors: (sessionId: number) => Promise<SessionErrorRecord[]>;
    summary: (mode?: PracticeSessionRecord['mode']) => Promise<SessionSummary>;
    delete: (id: number) => Promise<boolean>;
  };
  settings: {
    get: <K extends keyof AppSettingsValue>(key: K) => Promise<AppSettingsValue[K] | undefined>;
    set: <K extends keyof AppSettingsValue>(key: K, value: AppSettingsValue[K]) => Promise<void>;
    loadAll: () => Promise<AppSettingsValue>;
    saveAll: (settings: AppSettingsValue) => Promise<void>;
  };
  updater: {
    check: () => Promise<UpdaterStatus>;
    download: () => Promise<UpdaterStatus>;
    install: () => Promise<void>;
    onStatusChange: (cb: (status: UpdaterStatus) => void) => () => void;
  };
  app: {
    version: () => Promise<string>;
    platform: () => Promise<NodeJS.Platform>;
  };
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}

