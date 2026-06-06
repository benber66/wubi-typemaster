-- Migration 001: Initial schema
-- 创建五笔码表相关表 + 基础设置表
-- Phase 1：数据基础
-- Phase 3+ 才会用到：practice_sessions, session_errors, key_stats

-- ============================================================================
-- 五笔单字码表
-- ============================================================================
CREATE TABLE IF NOT EXISTS wubi_chars (
  char        TEXT PRIMARY KEY,                    -- 汉字（UTF-8）
  wubi_code   TEXT NOT NULL,                       -- 五笔编码（a-z 小写字母）
  weight      INTEGER NOT NULL DEFAULT 0,          -- 词频权重
  code_length INTEGER NOT NULL GENERATED ALWAYS AS (length(wubi_code)) STORED,  -- 码长（1=一级简码, 2=二级简码, 3=三级简码, 4=全码）
  is_primary  INTEGER NOT NULL DEFAULT 1,          -- 是否首选码（1=是，0=否）
  created_at  INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
);

CREATE INDEX IF NOT EXISTS idx_wubi_chars_code ON wubi_chars(wubi_code);
CREATE INDEX IF NOT EXISTS idx_wubi_chars_weight ON wubi_chars(weight DESC);
CREATE INDEX IF NOT EXISTS idx_wubi_chars_code_len ON wubi_chars(code_length);

-- ============================================================================
-- 五笔词组码表
-- ============================================================================
CREATE TABLE IF NOT EXISTS wubi_words (
  word        TEXT PRIMARY KEY,                    -- 词组（2-4 字）
  wubi_code   TEXT NOT NULL,                       -- 五笔编码
  weight      INTEGER NOT NULL DEFAULT 0,          -- 词频权重
  length      INTEGER NOT NULL,                    -- 词组字数
  created_at  INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
);

CREATE INDEX IF NOT EXISTS idx_wubi_words_code ON wubi_words(wubi_code);
CREATE INDEX IF NOT EXISTS idx_wubi_words_weight ON wubi_words(weight DESC);
CREATE INDEX IF NOT EXISTS idx_wubi_words_length ON wubi_words(length);

-- ============================================================================
-- 键位统计（Phase 3 写入，Phase 1 先建表）
-- ============================================================================
CREATE TABLE IF NOT EXISTS key_stats (
  key_char      TEXT PRIMARY KEY,                  -- 'a' 到 'z'
  total_presses INTEGER NOT NULL DEFAULT 0,        -- 总按键次数
  errors        INTEGER NOT NULL DEFAULT 0,        -- 错误次数
  error_rate    REAL NOT NULL DEFAULT 0,           -- 错误率 (0-1)
  last_updated  INTEGER NOT NULL DEFAULT 0
);

-- 预填 26 键
INSERT OR IGNORE INTO key_stats (key_char, last_updated) VALUES
  ('a', 0),('b', 0),('c', 0),('d', 0),('e', 0),('f', 0),
  ('g', 0),('h', 0),('i', 0),('j', 0),('k', 0),('l', 0),
  ('m', 0),('n', 0),('o', 0),('p', 0),('q', 0),('r', 0),
  ('s', 0),('t', 0),('u', 0),('v', 0),('w', 0),('x', 0),
  ('y', 0),('z', 0);

-- ============================================================================
-- 练习记录（Phase 3 写入）
-- ============================================================================
CREATE TABLE IF NOT EXISTS practice_sessions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  mode          TEXT NOT NULL,                     -- 'article' | 'word-invaders' | 'bubble' | 'key-drill'
  started_at    INTEGER NOT NULL,                  -- Unix timestamp (ms)
  ended_at      INTEGER NOT NULL,
  duration_ms   INTEGER NOT NULL,
  total_chars   INTEGER NOT NULL,
  correct_chars INTEGER NOT NULL,
  wpm           REAL NOT NULL,
  accuracy      REAL NOT NULL,                     -- 0-1
  text_source   TEXT,                              -- 文本来源标识
  config_json   TEXT                               -- 模式配置 JSON
);

CREATE INDEX IF NOT EXISTS idx_sessions_mode ON practice_sessions(mode);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON practice_sessions(started_at DESC);

-- ============================================================================
-- 错字明细
-- ============================================================================
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

-- ============================================================================
-- 用户设置
-- ============================================================================
CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
);

-- 默认设置
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('theme', '"light"'),
  ('accentColor', '"#3b82f6"'),
  ('showVirtualKeyboard', 'false'),
  ('soundEnabled', 'false'),
  ('soundVolume', '0.5'),
  ('updateSource', '"github"');

-- ============================================================================
-- 迁移元数据
-- ============================================================================
CREATE TABLE IF NOT EXISTS schema_migrations (
  version     INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  applied_at  INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
);

INSERT OR IGNORE INTO schema_migrations (version, name) VALUES (1, 'initial');
