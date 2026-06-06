# 数据库 Schema

> 版本：v0.0.1
> 引擎：SQLite 3
> 驱动：better-sqlite3

## 1. 概述

数据库文件位置：
- Windows：`%APPDATA%\wubi-typemaster\db.sqlite`
- Linux：`~/.config/wubi-typemaster/db.sqlite`
- macOS：`~/Library/Application Support/wubi-typemaster/db.sqlite`（预留）

由主进程通过 `app.getPath('userData')` 获取根目录。

## 2. 表设计

### 2.1 `wubi_chars` — 五笔单字码表

```sql
CREATE TABLE wubi_chars (
  char        TEXT PRIMARY KEY,         -- 汉字（UTF-8 4字节，1 字节能放下 BMP 内汉字）
  wubi_code   TEXT NOT NULL,            -- 4 字母编码
  frequency   INTEGER NOT NULL DEFAULT 0, -- 字频排序（数字越小越常用）
  stroke      INTEGER NOT NULL DEFAULT 0  -- 笔画数（预留，用于排序）
);

CREATE INDEX idx_wubi_chars_freq ON wubi_chars(frequency);
CREATE INDEX idx_wubi_chars_code ON wubi_chars(wubi_code);
```

**数据量**：约 7000 汉字，由开发期灌入。

### 2.2 `wubi_words` — 五笔词组码表

```sql
CREATE TABLE wubi_words (
  word        TEXT PRIMARY KEY,         -- 词组（2-4 字）
  wubi_code   TEXT NOT NULL,            -- 词组编码
  length      INTEGER NOT NULL,         -- 词组字数（2/3/4）
  frequency   INTEGER NOT NULL DEFAULT 0 -- 词频
);

CREATE INDEX idx_wubi_words_freq ON wubi_words(frequency);
CREATE INDEX idx_wubi_words_code ON wubi_words(wubi_code);
CREATE INDEX idx_wubi_words_len ON wubi_words(length);
```

**数据量**：约 50000 词组。

### 2.3 `practice_sessions` — 练习记录

```sql
CREATE TABLE practice_sessions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  mode        TEXT NOT NULL,            -- 'article' | 'word-invaders' | 'bubble' | 'key-drill'
  started_at  INTEGER NOT NULL,         -- Unix timestamp (ms)
  ended_at    INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL,         -- 实际耗时
  total_chars INTEGER NOT NULL,         -- 总字符数
  correct_chars INTEGER NOT NULL,       -- 正确数
  wpm         REAL NOT NULL,            -- 每分钟字数
  accuracy    REAL NOT NULL,            -- 准确率 0-1
  text_source TEXT,                     -- 文本来源标识
  config_json TEXT                      -- 模式配置 JSON
);

CREATE INDEX idx_sessions_mode ON practice_sessions(mode);
CREATE INDEX idx_sessions_started ON practice_sessions(started_at);
```

### 2.4 `session_errors` — 错字明细

```sql
CREATE TABLE session_errors (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  INTEGER NOT NULL,
  position    INTEGER NOT NULL,         -- 在文本中的位置
  expected    TEXT NOT NULL,            -- 目标字
  typed       TEXT NOT NULL,            -- 实际输入
  expected_code TEXT NOT NULL,          -- 目标字的五笔码
  typed_code  TEXT,                     -- 实际输入对应的码（可能为空）
  FOREIGN KEY (session_id) REFERENCES practice_sessions(id) ON DELETE CASCADE
);

CREATE INDEX idx_errors_session ON session_errors(session_id);
CREATE INDEX idx_errors_expected ON session_errors(expected);
```

### 2.5 `key_stats` — 键位统计

```sql
CREATE TABLE key_stats (
  key_char    TEXT PRIMARY KEY,         -- 'a' 到 'z'
  total_presses INTEGER NOT NULL DEFAULT 0,
  errors      INTEGER NOT NULL DEFAULT 0,
  error_rate  REAL NOT NULL DEFAULT 0,  -- 错误率 0-1
  last_updated INTEGER NOT NULL
);

-- 初始灌入 26 行
INSERT INTO key_stats (key_char, last_updated) VALUES
  ('a', 0),('b', 0),('c', 0),('d', 0),('e', 0),('f', 0),
  ('g', 0),('h', 0),('i', 0),('j', 0),('k', 0),('l', 0),
  ('m', 0),('n', 0),('o', 0),('p', 0),('q', 0),('r', 0),
  ('s', 0),('t', 0),('u', 0),('v', 0),('w', 0),('x', 0),
  ('y', 0),('z', 0);
```

### 2.6 `settings` — 用户设置

```sql
CREATE TABLE settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,            -- JSON 序列化的值
  updated_at  INTEGER NOT NULL
);
```

**默认设置**：
- `theme`: `"light"` 或 `"dark"`
- `accentColor`: `"#3b82f6"`
- `showVirtualKeyboard`: `false`
- `soundEnabled`: `false`
- `soundVolume`: `0.5`
- `updateSource`: `"github"` 或 `"gitee"`

## 3. 迁移策略

使用 `better-sqlite3` 的 `user_version` PRAGMA 管理迁移版本：

```
PRAGMA user_version;  -- 读取当前版本
PRAGMA user_version = 1;  -- 写入新版本
```

迁移文件位于 `src/db/migrations/`：
- `001_initial.sql` — 创建所有初始表
- `00X_xxx.sql` — 后续迁移

## 4. 备份策略

- 启动时自动备份：`db.sqlite.bak`
- 每周一次：备份到 `backups/db-{date}.sqlite`
- 用户可一键导出 / 导入（设置页提供）

## 5. 性能考虑

- 单字表和词组表启动时**预加载到内存**（使用 LRU 缓存），查询走内存
- 统计查询走索引
- 历史记录分页查询，每页 50 条
- 定期清理一年前的练习记录（可在设置中关闭）
