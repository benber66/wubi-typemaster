# 数据库 Schema

> 版本：v0.1.1（与 `src/db/migrations/*.sql` 同步）
> 引擎：SQLite 3
> 驱动：[better-sqlite3](https://github.com/WiseLibs/better-sqlite3) 11.x

## 1. 概述

### 1.1 文件位置

数据库由主进程通过 `app.getPath('userData')` 或 `path.join(process.cwd(), 'data')` 创建：

| 模式               | 路径                                                      |
| ------------------ | --------------------------------------------------------- |
| 开发模式           | `<repo>/data/db.sqlite`                                   |
| Windows 生产       | `%APPDATA%\wubi-typemaster\db.sqlite`                     |
| Linux 生产         | `~/.config/wubi-typemaster/db.sqlite`                     |
| macOS 生产（预留） | `~/Library/Application Support/wubi-typemaster/db.sqlite` |

> 开发期 SQLite 文件位于 `data/`，已 `.gitignore`；不随仓库发布。

### 1.2 表清单（6 表 + 1 元数据表）

| 表                  | Phase | 用途                      |
| ------------------- | ----- | ------------------------- |
| `wubi_chars`        | 1     | 五笔单字码表（21,586 行） |
| `wubi_words`        | 1     | 五笔词组码表（62,323 行） |
| `key_stats`         | 3     | 26 字母键位统计           |
| `practice_sessions` | 3     | 练习记录                  |
| `session_errors`    | 3     | 错字明细                  |
| `settings`          | 2+    | 用户设置 KV               |
| `schema_migrations` | 1     | 迁移元数据                |

### 1.3 当前数据规模（v0.1.1 验证）

```
chars:  21586 (core 3500)  /  words: 62323 (core 7301)
seed time: ~320 ms
```

## 2. 表设计

### 2.1 `wubi_chars` — 五笔单字码表

```sql
CREATE TABLE wubi_chars (
  char        TEXT PRIMARY KEY,                    -- 汉字
  wubi_code   TEXT NOT NULL,                       -- 五笔编码（a-z 小写）
  weight      INTEGER NOT NULL DEFAULT 0,          -- 频次权重（来自 Rime YAML，存以备查询）
  code_length INTEGER NOT NULL                     -- 码长：1=一级简码 / 2=二级简码 / 3=三级 / 4=全码
                GENERATED ALWAYS AS (length(wubi_code)) STORED,
  is_primary  INTEGER NOT NULL DEFAULT 1,          -- 是否首选码（1=是，0=否）
  is_core     INTEGER NOT NULL DEFAULT 0,          -- 是否属于核心 3500 集（v0.1.1+）
  created_at  INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
);
```

**索引**：

```sql
-- 通用查询
CREATE INDEX idx_wubi_chars_code     ON wubi_chars(wubi_code);
CREATE INDEX idx_wubi_chars_weight   ON wubi_chars(weight DESC);
CREATE INDEX idx_wubi_chars_code_len ON wubi_chars(code_length);

-- 核心集部分索引（v0.1.1+，小且快）
CREATE INDEX idx_wubi_chars_core_weight
  ON wubi_chars(is_core, weight DESC) WHERE is_core = 1;
```

**唯一性约束**：`char` 为主键（一字一码——只保留首选码）。

**数据量**：21,586 行（来自 rime-wubi86-jidian 全量去重后）。

### 2.2 `wubi_words` — 五笔词组码表

```sql
CREATE TABLE wubi_words (
  word        TEXT PRIMARY KEY,                    -- 词组（2-4 字）
  wubi_code   TEXT NOT NULL,                       -- 五笔编码
  weight      INTEGER NOT NULL DEFAULT 0,          -- 频次权重
  length      INTEGER NOT NULL,                    -- 词组字数（2/3/4）
  is_core     INTEGER NOT NULL DEFAULT 0,          -- 是否属于核心 7301 集（v0.1.1+）
  created_at  INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
);
```

**索引**：

```sql
CREATE INDEX idx_wubi_words_code   ON wubi_words(wubi_code);
CREATE INDEX idx_wubi_words_weight ON wubi_words(weight DESC);
CREATE INDEX idx_wubi_words_length ON wubi_words(length);

-- 核心集部分索引（v0.1.1+）
CREATE INDEX idx_wubi_words_core_weight
  ON wubi_words(is_core, weight DESC) WHERE is_core = 1;
```

**数据量**：62,323 行（来自 rime-wubi86-jidian 全量词组）。

### 2.3 `practice_sessions` — 练习记录

> Phase 3+ 写入；表结构在 Phase 1 已就绪。

```sql
CREATE TABLE practice_sessions (
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

CREATE INDEX idx_sessions_mode    ON practice_sessions(mode);
CREATE INDEX idx_sessions_started ON practice_sessions(started_at DESC);
```

### 2.4 `session_errors` — 错字明细

```sql
CREATE TABLE session_errors (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id    INTEGER NOT NULL,
  position      INTEGER NOT NULL,                  -- 在文本中的位置
  expected      TEXT NOT NULL,                     -- 目标字
  typed         TEXT NOT NULL,                     -- 实际输入
  expected_code TEXT NOT NULL,                     -- 目标字的五笔码
  typed_code    TEXT,                              -- 实际输入对应的码（可能为空）
  created_at    INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
  FOREIGN KEY (session_id) REFERENCES practice_sessions(id) ON DELETE CASCADE
);

CREATE INDEX idx_errors_session  ON session_errors(session_id);
CREATE INDEX idx_errors_expected ON session_errors(expected);
```

### 2.5 `key_stats` — 键位统计

```sql
CREATE TABLE key_stats (
  key_char      TEXT PRIMARY KEY,                  -- 'a' 到 'z'
  total_presses INTEGER NOT NULL DEFAULT 0,
  errors        INTEGER NOT NULL DEFAULT 0,
  error_rate    REAL NOT NULL DEFAULT 0,           -- 0-1
  last_updated  INTEGER NOT NULL DEFAULT 0
);

-- 预填 26 行（migrations/001_initial.sql）
INSERT OR IGNORE INTO key_stats (key_char, last_updated) VALUES
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
  value       TEXT NOT NULL,                       -- JSON 序列化的值
  updated_at  INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
);

-- 默认设置（migrations/001_initial.sql）
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('theme',               '"light"'),
  ('accentColor',         '"#3b82f6"'),
  ('showVirtualKeyboard', 'false'),
  ('soundEnabled',        'false'),
  ('soundVolume',         '0.5'),
  ('updateSource',        '"github"');
```

### 2.7 `schema_migrations` — 迁移元数据

```sql
CREATE TABLE schema_migrations (
  version     INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  applied_at  INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
);
```

## 3. 迁移策略

使用 `better-sqlite3` 的 `user_version` PRAGMA 管理迁移版本（由 `src/db/client.ts` 自动应用）：

```ts
PRAGMA user_version;     // 读取当前版本
PRAGMA user_version = N; // 写入新版本
```

迁移文件位于 `src/db/migrations/`，按文件名字母序应用：

| 文件                  | 版本 | 描述                             |
| --------------------- | ---- | -------------------------------- |
| `001_initial.sql`     | 1    | 全部 6 表 + 索引 + 默认设置      |
| `002_add_is_core.sql` | 2    | 添加 `is_core` 列 + 4 个部分索引 |

新增迁移规范：

1. 文件名格式 `NNN_description.sql`（NNN 自增 3 位数）
2. 必须以 `INSERT INTO schema_migrations (version, name) VALUES (N, 'name');` 结尾
3. 测试时 `safeRmSync` 异步重试 10 次避免 Windows EBUSY（见 `tests/integration/db/lookup-and-client.test.ts`）

## 4. 备份策略

| 触发     | 行为                             |
| -------- | -------------------------------- |
| 启动     | `db.sqlite.bak` 覆盖式备份       |
| 每周一次 | `backups/db-{YYYY-MM-DD}.sqlite` |
| 用户主动 | 导出 / 导入（设置页提供）        |

## 5. 性能考虑

- **码表预加载**：Phase 1+ 启动时把 `wubi_chars` / `wubi_words` 全量加载到内存
  （见 `createLookup` / `createLookupFromJson`），查询走内存亚毫秒级
- **核心集部分索引**：`WHERE is_core = 1` 索引体积小，对练习场景的 `randomCoreChars` /
  `randomCoreWords` 查询计划友好
- **统计查询**：`practice_sessions.started_at` 等降序索引支持分页
- **历史清理**：定期清理 > 1 年的练习记录（设置中可关闭）

## 6. 代码入口

| 文件                      | 作用                                        |
| ------------------------- | ------------------------------------------- |
| `src/db/client.ts`        | `createDbClient` / `applyMigrations` / 单例 |
| `src/db/migrations/*.sql` | SQL 迁移文件                                |
| `src/lib/wubi/lookup.ts`  | 业务层 API（内存 + DB 双实现）              |
| `scripts/seed-db.ts`      | 从 `src/data/wubi86-*.json` 灌入数据        |

详见：[lookup-api.md](./lookup-api.md)
