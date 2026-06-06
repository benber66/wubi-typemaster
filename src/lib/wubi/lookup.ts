import type Database from 'better-sqlite3';

/**
 * 五笔单字条目
 */
export interface WubiChar {
  char: string;
  code: string;
  weight: number;
  codeLength: number;
  /** 是否在 3500 常用字集合中（Jun Da 频次排名前 3500） */
  isCore: boolean;
}

/**
 * 五笔词组条目
 */
export interface WubiWord {
  word: string;
  code: string;
  weight: number;
  length: number;
  /** 是否在 10000 常用词集合中（SUBTLEX-CH 频次排名前 10000） */
  isCore: boolean;
}

/**
 * 前缀查询结果（混合单字和词组）
 */
export interface LookupResult {
  text: string;
  code: string;
  weight: number;
  type: 'char' | 'word';
  /** 词组字数，单字为 1 */
  length: number;
  isCore: boolean;
}

export interface WubiLookup {
  /** 查询单字 → 编码 */
  lookupChar(char: string): WubiChar | null;
  /** 查询编码 → 所有匹配单字（按权重降序） */
  lookupCode(code: string): WubiChar[];
  /** 查询词组 → 编码 */
  lookupWord(word: string): WubiWord | null;
  /** 查询编码 → 所有匹配词组（按权重降序） */
  lookupByCode(code: string): WubiWord[];
  /** 前缀查询：输入部分编码，返回匹配的单字+词组（按权重降序） */
  lookupPrefix(prefix: string, limit?: number): LookupResult[];
  /** 随机取若干单字（从全量中取） */
  randomChars(count: number): WubiChar[];
  /** 随机取若干词组（从全量中取） */
  randomWords(count: number, length?: 2 | 3 | 4): WubiWord[];
  /** 随机取若干核心单字（用于默认练习） */
  randomCoreChars(count: number): WubiChar[];
  /** 随机取若干核心词组（用于默认练习） */
  randomCoreWords(count: number, length?: 2 | 3 | 4): WubiWord[];
  /** 获取码表大小（调试用） */
  size(): { chars: number; words: number; coreChars: number; coreWords: number };
}

/**
 * 从 JSON 数据创建内存版查询实例（用于测试和无 DB 场景）
 */
export function createLookupFromJson(chars: WubiChar[], words: WubiWord[]): WubiLookup {
  const charByText = new Map<string, WubiChar>();
  const charsByCode = new Map<string, WubiChar[]>();
  const wordByText = new Map<string, WubiWord>();
  const wordsByCode = new Map<string, WubiWord[]>();

  for (const c of chars) {
    charByText.set(c.char, c);
    const arr = charsByCode.get(c.code) ?? [];
    arr.push(c);
    charsByCode.set(c.code, arr);
  }
  for (const arr of charsByCode.values()) {
    arr.sort((a, b) => b.weight - a.weight);
  }

  for (const w of words) {
    wordByText.set(w.word, w);
    const arr = wordsByCode.get(w.code) ?? [];
    arr.push(w);
    wordsByCode.set(w.code, arr);
  }
  for (const arr of wordsByCode.values()) {
    arr.sort((a, b) => b.weight - a.weight);
  }

  return {
    lookupChar: (char) => charByText.get(char) ?? null,
    lookupCode: (code) => charsByCode.get(code.toLowerCase()) ?? [],
    lookupWord: (word) => wordByText.get(word) ?? null,
    lookupByCode: (code) => wordsByCode.get(code.toLowerCase()) ?? [],
    lookupPrefix: (prefix, limit = 50) => {
      if (!prefix) return [];
      const lower = prefix.toLowerCase();
      const result: LookupResult[] = [];
      for (const [code, arr] of charsByCode) {
        if (code.startsWith(lower)) {
          for (const c of arr) {
            result.push({
              text: c.char,
              code: c.code,
              weight: c.weight,
              type: 'char',
              length: 1,
              isCore: c.isCore,
            });
          }
        }
      }
      for (const [code, arr] of wordsByCode) {
        if (code.startsWith(lower)) {
          for (const w of arr) {
            result.push({
              text: w.word,
              code: w.code,
              weight: w.weight,
              type: 'word',
              length: w.length,
              isCore: w.isCore,
            });
          }
        }
      }
      result.sort((a, b) => b.weight - a.weight);
      return result.slice(0, limit);
    },
    randomChars: (count) => {
      if (chars.length === 0 || count <= 0) return [];
      const result: WubiChar[] = [];
      for (let i = 0; i < count; i++) {
        const idx = Math.floor(Math.random() * chars.length);
        const c = chars[idx];
        if (c) result.push(c);
      }
      return result;
    },
    randomWords: (count, length) => {
      if (words.length === 0 || count <= 0) return [];
      const pool = length ? words.filter((w) => w.length === length) : words;
      if (pool.length === 0) return [];
      const result: WubiWord[] = [];
      for (let i = 0; i < count; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        const w = pool[idx];
        if (w) result.push(w);
      }
      return result;
    },
    randomCoreChars: (count) => {
      const pool = chars.filter((c) => c.isCore);
      if (pool.length === 0 || count <= 0) return [];
      const result: WubiChar[] = [];
      for (let i = 0; i < count; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        const c = pool[idx];
        if (c) result.push(c);
      }
      return result;
    },
    randomCoreWords: (count, length) => {
      let pool = words.filter((w) => w.isCore);
      if (length) pool = pool.filter((w) => w.length === length);
      if (pool.length === 0 || count <= 0) return [];
      const result: WubiWord[] = [];
      for (let i = 0; i < count; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        const w = pool[idx];
        if (w) result.push(w);
      }
      return result;
    },
    size: () => ({
      chars: chars.length,
      words: words.length,
      coreChars: chars.filter((c) => c.isCore).length,
      coreWords: words.filter((w) => w.isCore).length,
    }),
  };
}

/**
 * 从 SQLite 数据库创建查询实例（生产环境）
 */
export function createLookup(db: Database.Database): WubiLookup {
  const charStmt = db.prepare<[string], WubiChar>(
    'SELECT char, wubi_code as code, weight, code_length as codeLength, is_core as isCore FROM wubi_chars WHERE char = ?',
  );
  const charsByCodeStmt = db.prepare<[string], WubiChar>(
    'SELECT char, wubi_code as code, weight, code_length as codeLength, is_core as isCore FROM wubi_chars WHERE wubi_code = ? ORDER BY weight DESC',
  );
  const wordStmt = db.prepare<[string], WubiWord>(
    'SELECT word, wubi_code as code, weight, length, is_core as isCore FROM wubi_words WHERE word = ?',
  );
  const wordsByCodeStmt = db.prepare<[string], WubiWord>(
    'SELECT word, wubi_code as code, weight, length, is_core as isCore FROM wubi_words WHERE wubi_code = ? ORDER BY weight DESC',
  );
  const charsPrefixStmt = db.prepare<[string, number], WubiChar>(
    'SELECT char, wubi_code as code, weight, code_length as codeLength, is_core as isCore FROM wubi_chars WHERE wubi_code LIKE ? ORDER BY weight DESC LIMIT ?',
  );
  const wordsPrefixStmt = db.prepare<[string, number], WubiWord>(
    'SELECT word, wubi_code as code, weight, length, is_core as isCore FROM wubi_words WHERE wubi_code LIKE ? ORDER BY weight DESC LIMIT ?',
  );
  const countCharStmt = db.prepare<[], { c: number }>('SELECT COUNT(*) as c FROM wubi_chars');
  const countWordStmt = db.prepare<[], { c: number }>('SELECT COUNT(*) as c FROM wubi_words');
  const countCoreCharStmt = db.prepare<[], { c: number }>(
    'SELECT COUNT(*) as c FROM wubi_chars WHERE is_core = 1',
  );
  const countCoreWordStmt = db.prepare<[], { c: number }>(
    'SELECT COUNT(*) as c FROM wubi_words WHERE is_core = 1',
  );
  const allCharsStmt = db.prepare<[number, number], WubiChar>(
    'SELECT char, wubi_code as code, weight, code_length as codeLength, is_core as isCore FROM wubi_chars LIMIT ? OFFSET ?',
  );
  const allWordsByLenStmt = db.prepare<[number, number, number], WubiWord>(
    'SELECT word, wubi_code as code, weight, length, is_core as isCore FROM wubi_words WHERE length = ? LIMIT ? OFFSET ?',
  );
  const allWordsStmt = db.prepare<[number, number], WubiWord>(
    'SELECT word, wubi_code as code, weight, length, is_core as isCore FROM wubi_words LIMIT ? OFFSET ?',
  );
  const coreCharsStmt = db.prepare<[number, number], WubiChar>(
    'SELECT char, wubi_code as code, weight, code_length as codeLength, is_core as isCore FROM wubi_chars WHERE is_core = 1 LIMIT ? OFFSET ?',
  );
  const coreWordsByLenStmt = db.prepare<[number, number, number], WubiWord>(
    'SELECT word, wubi_code as code, weight, length, is_core as isCore FROM wubi_words WHERE is_core = 1 AND length = ? LIMIT ? OFFSET ?',
  );
  const coreWordsStmt = db.prepare<[number, number], WubiWord>(
    'SELECT word, wubi_code as code, weight, length, is_core as isCore FROM wubi_words WHERE is_core = 1 LIMIT ? OFFSET ?',
  );

  return {
    lookupChar: (char) => charStmt.get(char) ?? null,
    lookupCode: (code) => charsByCodeStmt.all(code.toLowerCase()),
    lookupWord: (word) => wordStmt.get(word) ?? null,
    lookupByCode: (code) => wordsByCodeStmt.all(code.toLowerCase()),
    lookupPrefix: (prefix, limit = 50) => {
      if (!prefix) return [];
      const like = prefix.toLowerCase() + '%';
      const half = Math.ceil(limit / 2);
      const charResults = charsPrefixStmt.all(like, half);
      const wordResults = wordsPrefixStmt.all(like, half);
      const merged: LookupResult[] = [
        ...charResults.map((c) => ({
          text: c.char,
          code: c.code,
          weight: c.weight,
          type: 'char' as const,
          length: 1,
          isCore: Boolean(c.isCore),
        })),
        ...wordResults.map((w) => ({
          text: w.word,
          code: w.code,
          weight: w.weight,
          type: 'word' as const,
          length: w.length,
          isCore: Boolean(w.isCore),
        })),
      ];
      merged.sort((a, b) => b.weight - a.weight);
      return merged.slice(0, limit);
    },
    randomChars: (count) => {
      if (count <= 0) return [];
      const { c: total } = countCharStmt.get() ?? { c: 0 };
      if (total === 0) return [];
      const result: WubiChar[] = [];
      for (let i = 0; i < count; i++) {
        const offset = Math.floor(Math.random() * total);
        const row = allCharsStmt.get(1, offset);
        if (row) result.push(row);
      }
      return result;
    },
    randomWords: (count, length) => {
      if (count <= 0) return [];
      if (length) {
        const total = countWordStmt.get()?.c ?? 0;
        const result: WubiWord[] = [];
        for (let i = 0; i < count * 3 && result.length < count; i++) {
          const offset = Math.floor(Math.random() * total);
          const row = allWordsByLenStmt.get(length, 1, offset);
          if (row) result.push(row);
        }
        return result;
      } else {
        const total = countWordStmt.get()?.c ?? 0;
        const result: WubiWord[] = [];
        for (let i = 0; i < count; i++) {
          const offset = Math.floor(Math.random() * total);
          const row = allWordsStmt.get(1, offset);
          if (row) result.push(row);
        }
        return result;
      }
    },
    randomCoreChars: (count) => {
      if (count <= 0) return [];
      const { c: total } = countCoreCharStmt.get() ?? { c: 0 };
      if (total === 0) return [];
      const result: WubiChar[] = [];
      for (let i = 0; i < count; i++) {
        const offset = Math.floor(Math.random() * total);
        const row = coreCharsStmt.get(1, offset);
        if (row) result.push(row);
      }
      return result;
    },
    randomCoreWords: (count, length) => {
      if (count <= 0) return [];
      if (length) {
        const total = countCoreWordStmt.get()?.c ?? 0;
        const result: WubiWord[] = [];
        for (let i = 0; i < count * 3 && result.length < count; i++) {
          const offset = Math.floor(Math.random() * total);
          const row = coreWordsByLenStmt.get(length, 1, offset);
          if (row) result.push(row);
        }
        return result;
      } else {
        const total = countCoreWordStmt.get()?.c ?? 0;
        const result: WubiWord[] = [];
        for (let i = 0; i < count; i++) {
          const offset = Math.floor(Math.random() * total);
          const row = coreWordsStmt.get(1, offset);
          if (row) result.push(row);
        }
        return result;
      }
    },
    size: () => ({
      chars: countCharStmt.get()?.c ?? 0,
      words: countWordStmt.get()?.c ?? 0,
      coreChars: countCoreCharStmt.get()?.c ?? 0,
      coreWords: countCoreWordStmt.get()?.c ?? 0,
    }),
  };
}

/**
 * 加载 JSON 数据并灌入数据库（幂等）
 */
export function seedDatabase(
  db: Database.Database,
  chars: WubiChar[],
  words: WubiWord[],
): { chars: number; words: number; coreChars: number; coreWords: number } {
  const insertChar = db.prepare(
    'INSERT OR REPLACE INTO wubi_chars (char, wubi_code, weight, is_core, is_primary) VALUES (?, ?, ?, ?, 1)',
  );
  const insertWord = db.prepare(
    'INSERT OR REPLACE INTO wubi_words (word, wubi_code, weight, length, is_core) VALUES (?, ?, ?, ?, ?)',
  );

  let coreChars = 0;
  let coreWords = 0;

  const tx = db.transaction(() => {
    for (const c of chars) {
      insertChar.run(c.char, c.code, c.weight, c.isCore ? 1 : 0);
      if (c.isCore) coreChars++;
    }
    for (const w of words) {
      insertWord.run(w.word, w.code, w.weight, w.length, w.isCore ? 1 : 0);
      if (w.isCore) coreWords++;
    }
  });
  tx();

  return { chars: chars.length, words: words.length, coreChars, coreWords };
}
