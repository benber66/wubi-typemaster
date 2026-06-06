# Lookup API 参考

> v0.1.1+ — `src/lib/wubi/lookup.ts`

本模块是练习层与统计层访问五笔码表的统一入口。提供**内存版**（`createLookupFromJson`）和 **DB 版**（`createLookup`）双实现，行为完全一致以便测试与开发。

## 类型定义

```ts
interface WubiChar {
  char: string;          // 汉字
  code: string;          // 5 字母编码（a-z 小写）
  weight: number;        // 频次权重
  isCore: boolean;       // 是否属于核心 3500 集
}

interface WubiWord {
  word: string;          // 词组
  code: string;          // 5 字母编码
  weight: number;        // 频次权重
  length: number;        // 字数（2/3/4）
  isCore: boolean;       // 是否属于核心 7301 集
}

type LookupResult =
  | { ok: true; type: 'char'; entry: WubiChar }
  | { ok: true; type: 'word'; entry: WubiWord }
  | { ok: false; type: 'char' | 'word'; reason: 'not-found' | 'ambiguous' };

interface SizeInfo {
  chars: number;
  words: number;
  coreChars: number;
  coreWords: number;
}
```

## 工厂函数

### `createLookupFromJson(jsonPath: string): Promise<WubiLookup>`

从 `src/data/wubi86-*.json` 加载到内存。**开发 / 测试首选**，无需 SQLite。

```ts
const lookup = await createLookupFromJson('./src/data/wubi86-chars.json');
```

### `createLookup(db: Database): WubiLookup`

从 SQLite 实例创建，依赖 `wubi_chars` / `wubi_words` 表已就绪。**生产首选**。

```ts
import { createDbClient, setDefaultDb } from '@/db/client';
import { createLookup } from '@/lib/wubi/lookup';

const db = createDbClient({ path: './data/db.sqlite' });
setDefaultDb(db);
const lookup = createLookup(db);
```

## 查询 API

| 方法 | 签名 | 说明 |
|---|---|---|
| `lookupChar` | `(char: string) => LookupResult` | 单字精确查找 |
| `lookupCode` | `(code: string) => LookupResult` | 按编码反向查找（首选码） |
| `lookupWord` | `(word: string) => LookupResult` | 词组精确查找 |
| `lookupByCode` | `(code: string) => (WubiChar \| WubiWord)[]` | 按编码查全部匹配（多对一） |
| `lookupByPrefix` | `(prefix: string, limit?: number) => (WubiChar \| WubiWord)[]` | 按前缀查（联想功能） |
| `randomChars` | `(count: number) => WubiChar[]` | 全量随机 N 字 |
| `randomWords` | `(count: number, length?: number) => WubiWord[]` | 全量随机 N 词，可选按字数过滤 |
| `randomCoreChars` | `(count: number) => WubiChar[]` | **核心集**随机 N 字（练习用） |
| `randomCoreWords` | `(count: number, length?: number) => WubiWord[]` | **核心集**随机 N 词 |
| `size` | `() => SizeInfo` | 返回 `{chars, words, coreChars, coreWords}` |

## 缓存策略

`createLookup` 启动时一次全量预加载到内存（Map 结构），后续查询走内存 — 亚毫秒级。`code_length` 字段由 SQLite 自动生成，无需在写入时显式提供。

## 已知差异

| 场景 | 内存版 | DB 版 |
|---|---|---|
| 启动延迟 | 50-100ms（JSON parse） | 30-50ms（SQLite read） |
| 占用内存 | ~25 MB | ~25 MB（同等） |
| 实时性 | 需重启读取 JSON | 可直接改 DB 后重建 lookup |

## 扩展示例

```ts
// 取得 5 个 2 字核心词组（KeyDrill 模式用）
const drill = lookup.randomCoreWords(5, 2);

// 输入流中按编码查字（错误提示）
const expected = lookup.lookupChar(targetChar);
if (expected.ok) {
  showTooltip(`正确编码：${expected.entry.code}`);
}

// 联想输入（中文 IME-like 体验）
const suggestions = lookup.lookupByPrefix(currentInput, 8);
```
