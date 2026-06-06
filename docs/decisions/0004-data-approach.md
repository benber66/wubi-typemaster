# ADR-0004：五笔码表数据方案

> 状态：已接受
> 日期：2026-06-06
> 修订：v0.1.1（2026-06-06 — 引入 3 数据源 + 核心集标记）

## 背景

需要为软件提供五笔 86 版的单字和词组编码数据，用于：

- 练习时随机出题
- 错误提示显示对应编码
- 弱键突破（KeyDrill）模式
- 输入验证
- 联想输入（中文 IME-like 体验）

## 备选方案

### 方案 A：硬编码到 SQLite 内置表（采纳）

- ✅ 启动后查询极快（内存预加载 + 索引）
- ✅ 数据与代码一同打包
- ✅ 离线可用，无网络依赖
- ❌ 包体积增大（~10MB 源码数据，打包后 JSON 可 tree-shake）
- ❌ 更新码表需发版

### 方案 B：启动时联网下载

- ❌ 联网依赖
- ❌ 隐私问题（使用情况可能被记录）
- ❌ 初次启动延迟

### 方案 C：内置 JSON 文件

- ❌ 查询性能不如 SQLite
- ❌ 全文扫描慢

### 方案 D：用户自行导入

- ❌ 用户体验差
- ❌ 不符合"开箱即用"

## 决策

选择 **方案 A：硬编码到 SQLite 内置表**。具体实施：

1. **码表来源**：rime-wubi86-jidian（Apache-2.0）作为**唯一码源**
2. **字频来源**：Jun Da《现代汉语单字频率列表》via hanziDB.csv（MIT）作为**核心字判定权威**
3. **词频来源**：SUBTLEX-CH-WF（Cai & Brysbaert 2010, GB18030）作为**核心词判定权威**
4. **核心集标记**：使用 `is_core` 列，部分索引加速查询

## 数据规模（v0.1.1 实测）

| 表 | 全量 | 核心集 | 阈值 |
|---|---|---|---|
| `wubi_chars` | 21,586 | 3,500 | Jun Da 频次 top 3500（覆盖 99.5% 日常） |
| `wubi_words` | 62,323 | 7,301 | SUBTLEX-CH top 10000（部分缺失匹配） |

> 之所以 10000 阈值得 7301 词，是因为 SUBTLEX-CH-WF 中部分词组无对应码（rhyme Rime 词典不含）被剔除。

## 数据源与协议

详见 [`docs/data-sources.md`](../data-sources.md) 和 `src/data/raw/README.md`。

| 数据 | 协议 | 是否可商用 |
|---|---|---|
| rime-wubi86-jidian 码表 | Apache-2.0 | ✅ |
| hanziDB 字符频次 | MIT | ✅ |
| SUBTLEX-CH-WF 词频 | 学术免费 | ⚠️ 仅研究；商业发布考虑 SUBTLEX-CH-POS 或人民日报语料 |

## 排序与合并算法

```
对每个字 / 词：
1. 从 3 个数据源读出 (code, weight_from_rime, freq_rank_from_权威)
2. isCore = (freq_rank ≤ CORE_THRESHOLD)
3. 排序键：isCore DESC → freq_rank ASC → rime_weight DESC → 名称 localeCompare
4. 单字只取首选码（最短）——避免一字多码让用户困惑
5. 词组按 Rime weight 取主码
```

> Rime YAML 第 3 列 weight 不可靠：top1=`艹` w=380，常用字"中/国/是" w=20 排到 1000+。这就是为什么需要外部权威频次表。

## 加载流程

```
首次 / 重置：
  pnpm build:wubi    # 3 源 → src/data/wubi86-{chars,words,stats}.json
  pnpm seed:reset    # JSON → data/db.sqlite

应用启动（生产）：
  1. 打开 %APPDATA%/wubi-typemaster/db.sqlite
  2. 跑迁移（PRAGMA user_version）
  3. 若 wubi_chars 为空 → 自动灌入（同 seed-db.ts 逻辑）
  4. createLookup() 预加载到内存
  5. 查询走内存（亚毫秒级）
```

## 更新策略

- 码表数据视为代码的一部分，**不单独热更新**
- 错误修正需发新版本
- 这是有意的取舍：保证一致性和离线可用性

## 替代方案（未来）

如果未来码表数据膨胀到 50MB+ 级别（如加入字形注释、笔画动画），可考虑：

- 拆分：常用字 + 罕用字二级加载
- 压缩：使用 protobuf / FlatBuffers
- 异步：首屏只加载常用部分

## 验证（v0.1.1）

- ✅ Top 10 核心字与 Jun Da 期望一致：的(r), 一(g), 是(j), 不(i), 了(b), 在(d), 人(w), 有(e), 我(q), 他(wb)
- ✅ Top 10 核心词与 SUBTLEX 期望一致：我们(trwu), 什么(wftc), 知道(tdut), 他们(wbwu), 一个(ggwh), 你们(wqwu), 没有(imde), 这个(ypwh), 怎么(thtc), 现在(gmdh)
- ✅ 灌库耗时 ~320ms（21,586 字 + 62,323 词）
- ✅ `lib/wubi/lookup.ts` 100% 行/语句/函数覆盖
