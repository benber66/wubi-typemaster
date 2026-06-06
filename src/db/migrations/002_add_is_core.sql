-- Migration 002: 核心数据集标记
-- 给 wubi_chars / wubi_words 添加 is_core 列，用于区分全量数据 vs 核心练习集
-- 核心集合：top 3500 汉字 + top 10000 词组（按 Jun Da + SUBTLEX-CH 频次）

ALTER TABLE wubi_chars ADD COLUMN is_core INTEGER NOT NULL DEFAULT 0;
ALTER TABLE wubi_words ADD COLUMN is_core INTEGER NOT NULL DEFAULT 0;

-- 部分索引：只为 is_core=1 的行建立索引（小且快）
CREATE INDEX IF NOT EXISTS idx_wubi_chars_core ON wubi_chars(is_core) WHERE is_core = 1;
CREATE INDEX IF NOT EXISTS idx_wubi_words_core ON wubi_words(is_core) WHERE is_core = 1;

-- 练习场景常用查询：核心 + 权重排序
CREATE INDEX IF NOT EXISTS idx_wubi_chars_core_weight ON wubi_chars(is_core, weight DESC) WHERE is_core = 1;
CREATE INDEX IF NOT EXISTS idx_wubi_words_core_weight ON wubi_words(is_core, weight DESC) WHERE is_core = 1;

INSERT OR IGNORE INTO schema_migrations (version, name) VALUES (2, 'add_is_core');
