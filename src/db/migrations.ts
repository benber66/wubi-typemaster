import type { Migration } from '@/db/client';

const M001: Migration = {
  version: 1,
  name: 'initial',
  sql: `
CREATE TABLE IF NOT EXISTS wubi_chars (
  char        TEXT PRIMARY KEY,
  wubi_code   TEXT NOT NULL,
  weight      INTEGER NOT NULL DEFAULT 0,
  code_length INTEGER NOT NULL GENERATED ALWAYS AS (length(wubi_code)) STORED,
  is_primary  INTEGER NOT NULL DEFAULT 1,
  created_at  INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
);
CREATE INDEX IF NOT EXISTS idx_wubi_chars_code ON wubi_chars(wubi_code);
CREATE INDEX IF NOT EXISTS idx_wubi_chars_weight ON wubi_chars(weight DESC);
CREATE INDEX IF NOT EXISTS idx_wubi_chars_code_len ON wubi_chars(code_length);

CREATE TABLE IF NOT EXISTS wubi_words (
  word        TEXT PRIMARY KEY,
  wubi_code   TEXT NOT NULL,
  weight      INTEGER NOT NULL DEFAULT 0,
  length      INTEGER NOT NULL,
  created_at  INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
);
CREATE INDEX IF NOT EXISTS idx_wubi_words_code ON wubi_words(wubi_code);
CREATE INDEX IF NOT EXISTS idx_wubi_words_weight ON wubi_words(weight DESC);
CREATE INDEX IF NOT EXISTS idx_wubi_words_length ON wubi_words(length);

CREATE TABLE IF NOT EXISTS key_stats (
  key_char      TEXT PRIMARY KEY,
  total_presses INTEGER NOT NULL DEFAULT 0,
  errors        INTEGER NOT NULL DEFAULT 0,
  error_rate    REAL NOT NULL DEFAULT 0,
  last_updated  INTEGER NOT NULL DEFAULT 0
);
INSERT OR IGNORE INTO key_stats (key_char, last_updated) VALUES
  ('a',0),('b',0),('c',0),('d',0),('e',0),('f',0),
  ('g',0),('h',0),('i',0),('j',0),('k',0),('l',0),
  ('m',0),('n',0),('o',0),('p',0),('q',0),('r',0),
  ('s',0),('t',0),('u',0),('v',0),('w',0),('x',0),
  ('y',0),('z',0);

CREATE TABLE IF NOT EXISTS practice_sessions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  mode          TEXT NOT NULL,
  started_at    INTEGER NOT NULL,
  ended_at      INTEGER NOT NULL,
  duration_ms   INTEGER NOT NULL,
  total_chars   INTEGER NOT NULL,
  correct_chars INTEGER NOT NULL,
  wpm           REAL NOT NULL,
  accuracy      REAL NOT NULL,
  text_source   TEXT,
  config_json   TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_mode ON practice_sessions(mode);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON practice_sessions(started_at DESC);

CREATE TABLE IF NOT EXISTS session_errors (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id    INTEGER NOT NULL,
  position      INTEGER NOT NULL,
  expected      TEXT NOT NULL,
  typed         TEXT NOT NULL,
  expected_code TEXT NOT NULL,
  typed_code    TEXT,
  created_at    INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
  FOREIGN KEY (session_id) REFERENCES practice_sessions(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_errors_session ON session_errors(session_id);
CREATE INDEX IF NOT EXISTS idx_errors_expected ON session_errors(expected);

CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
);
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('theme', '"light"'),
  ('accentColor', '"#3b82f6"'),
  ('showVirtualKeyboard', 'false'),
  ('soundEnabled', 'false'),
  ('soundVolume', '0.5'),
  ('updateSource', '"github"');

INSERT OR IGNORE INTO schema_migrations (version, name) VALUES (1, 'initial');
`,
};

const M002: Migration = {
  version: 2,
  name: 'add_is_core',
  sql: `
ALTER TABLE wubi_chars ADD COLUMN is_core INTEGER NOT NULL DEFAULT 0;
ALTER TABLE wubi_words ADD COLUMN is_core INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_wubi_chars_core ON wubi_chars(is_core) WHERE is_core = 1;
CREATE INDEX IF NOT EXISTS idx_wubi_words_core ON wubi_words(is_core) WHERE is_core = 1;
CREATE INDEX IF NOT EXISTS idx_wubi_chars_core_weight ON wubi_chars(is_core, weight DESC) WHERE is_core = 1;
CREATE INDEX IF NOT EXISTS idx_wubi_words_core_weight ON wubi_words(is_core, weight DESC) WHERE is_core = 1;

INSERT OR IGNORE INTO schema_migrations (version, name) VALUES (2, 'add_is_core');
`,
};

export const BUILTIN_MIGRATIONS: Migration[] = [M001, M002];
