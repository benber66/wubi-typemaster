# 数据源说明

WubiTypeMaster 使用 3 个数据源，组合成最终码表：

## 1. 五笔码表：`wubi86_jidian.dict.yaml`

| 项 | 值 |
| --- | --- |
| 来源 | <https://github.com/KyleBing/rime-wubi86-jidian> |
| 协议 | Apache-2.0 |
| 格式 | Rime YAML 字典 (`text\tcode\tweight`) |
| 大小 | 1.3 MB（89,300 行） |
| 用途 | 提供汉字 → 五笔 86 编码的映射 |

**注意**：该数据集中 Rime 用户的 `weight` 字段是基于 Rime IME 的输入统计，**不**代表真实中文使用频率（top 权重反而是日文假名和部首）。因此 weight 仅用作多码去重的 tie-breaker，不用于判断"常用"。

## 2. 汉字频次表：`hanzi_db.csv`

| 项 | 值 |
| --- | --- |
| 来源 | <https://github.com/ruddfawcett/hanziDB.csv> |
| 协议 | MIT |
| 原始数据 | Jun Da《现代汉语单字频率列表》<http://lingua.mtsu.edu/> |
| 格式 | CSV (`frequency_rank,character,pinyin,...`) |
| 大小 | 547 KB（9,933 简体字） |
| 用途 | 标记 3,500 核心汉字（覆盖 99.5% 日常中文） |

**注意**：Jun Da 原始数据基于大规模简体语料统计（多个子库：新闻、小说、对话等合计 2 亿+ 字），是学术界最常用的现代汉语字频源。

## 3. 词组频次表：`SUBTLEX-CH-WF`

| 项 | 值 |
| --- | --- |
| 来源 | <https://www.ugent.be/pp/experimentele-psychologie/en/research/documents/subtlexch> |
| 原始论文 | Cai, Q. & Brysbaert, M. (2010). "SUBTLEX-CH: Chinese Word and Character Frequencies Based on Film Subtitles." *PLOS ONE* 5(6): e10729 |
| 协议 | 自由用于研究（学术 free for research） |
| 格式 | Tab-separated (`Word\tWCount\tW/million\tlogW\tW-CD\tW-CD%\tlogW-CD`) |
| 编码 | GB18030 |
| 大小 | 3.2 MB（99,121 词） |
| 用途 | 标记 10,000 核心词组（覆盖 95%+ 日常对话） |

**注意**：基于 3,350 万词的电影/电视字幕语料。理论上 SUBTLEX-CH 比书面语料更接近日常口语频率，但**只允许非商业研究使用**。本项目以 MIT 发布，仅作个人练习工具使用符合条款。

## 4. 最终数据集（`src/data/*.json`）

由 `scripts/build-wubi-table.ts` 处理：

- 读取 Rime YAML → 字符/词组 → 五笔码
- 读取 hanziDB.csv → 汉字排名
- 读取 SUBTLEX-CH-WF → 词组排名
- 合并后输出两个 JSON：
  - `wubi86-chars.json`（21,586 单字，含 `isCore` 标记）
  - `wubi86-words.json`（62,323 词组，含 `isCore` 标记）
- 核心集合：top 3,500 字 + top 10,000 词

## 数据流

```
wubi86_jidian.dict.yaml  ─┐
                          ├─→ build-wubi-table.ts ─→ wubi86-chars.json  ─┐
hanzi_db.csv (char rank)  ─┘                                            │
                                                                       ├─→ seed-db.ts ─→ SQLite
SUBTLEX-CH-WF (word rank) ─────────────────────────────────→ wubi86-words.json ─┘
```

## 重新生成

```bash
# 重新处理码表
pnpm build:wubi

# 重新灌入数据库
pnpm seed:reset
```

## 许可总览

| 组件 | 协议 | 商业使用 |
| --- | --- | --- |
| 集成应用 | MIT | ✅ |
| 五笔码表 | Apache-2.0 | ✅ |
| 汉字频次 | MIT | ✅ |
| 词组频次 | 研究用 free | ⚠️ 仅研究 |
