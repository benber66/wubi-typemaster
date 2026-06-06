import type Database from 'better-sqlite3';

/**
 * 五笔单字条目
 */
export interface WubiChar {
  char: string;
  code: string;
  weight: number;
  codeLength: number;
}

/**
 * 五笔词组条目
 */
export interface WubiWord {
  word: string;
  code: string;
  weight: number;
  length: number;
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
  /** 随机取若干单字（按权重加权或完全随机） */
  randomChars(count: number): WubiChar[];
  /** 随机取若干词组（按词长筛选） */
  randomWords(count: number, length?: 2 | 3 | 4): WubiWord[];
  /** 获取码表大小（调试用） */
  size(): { chars: number; words: number };
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
    size: () => ({ chars: chars.length, words: words.length }),
  };
}

/**
 * 从 SQLite 数据库创建查询实例（生产环境）
 */
export function createLookup(db: Database.Database): WubiLookup {
  const charStmt = db.prepare<[string], WubiChar>(
    'SELECT char, wubi_code as code, weight, code_length as codeLength FROM wubi_chars WHERE char = ?',
  );
  const charsByCodeStmt = db.prepare<[string], WubiChar>(
    'SELECT char, wubi_code as code, weight, code_length as codeLength FROM wubi_chars WHERE wubi_code = ? ORDER BY weight DESC',
  );
  const wordStmt = db.prepare<[string], WubiWord>(
    'SELECT word, wubi_code as code, weight, length FROM wubi_words WHERE word = ?',
  );
  const wordsByCodeStmt = db.prepare<[string], WubiWord>(
    'SELECT word, wubi_code as code, weight, length FROM wubi_words WHERE wubi_code = ? ORDER BY weight DESC',
  );
  const charsPrefixStmt = db.prepare<[string, number], WubiChar>(
    'SELECT char, wubi_code as code, weight, code_length as codeLength FROM wubi_chars WHERE wubi_code LIKE ? ORDER BY weight DESC LIMIT ?',
  );
  const wordsPrefixStmt = db.prepare<[string, number], WubiWord>(
    'SELECT word, wubi_code as code, weight, length FROM wubi_words WHERE wubi_code LIKE ? ORDER BY weight DESC LIMIT ?',
  );
  const countCharStmt = db.prepare<[], { c: number }>('SELECT COUNT(*) as c FROM wubi_chars');
  const countWordStmt = db.prepare<[], { c: number }>('SELECT COUNT(*) as c FROM wubi_words');
  const allCharsStmt = db.prepare<[number, number], WubiChar>(
    'SELECT char, wubi_code as code, weight, code_length as codeLength FROM wubi_chars LIMIT ? OFFSET ?',
  );
  const allWordsByLenStmt = db.prepare<[number, number, number], WubiWord>(
    'SELECT word, wubi_code as code, weight, length FROM wubi_words WHERE length = ? LIMIT ? OFFSET ?',
  );
  const allWordsStmt = db.prepare<[number, number], WubiWord>(
    'SELECT word, wubi_code as code, weight, length FROM wubi_words LIMIT ? OFFSET ?',
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
        })),
        ...wordResults.map((w) => ({
          text: w.word,
          code: w.code,
          weight: w.weight,
          type: 'word' as const,
          length: w.length,
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
        const total = (countWordStmt.get()?.c) ?? 0;
        // 简化：没有按 length 计数的快速方法，先全查再过滤（数据量小）
        const result: WubiWord[] = [];
        for (let i = 0; i < count * 3 && result.length < count; i++) {
          const offset = Math.floor(Math.random() * total);
          const row = allWordsByLenStmt.get(length, 1, offset);
          if (row) result.push(row);
        }
        return result;
      } else {
        const total = (countWordStmt.get()?.c) ?? 0;
        const result: WubiWord[] = [];
        for (let i = 0; i < count; i++) {
          const offset = Math.floor(Math.random() * total);
          const row = allWordsStmt.get(1, offset);
          if (row) result.push(row);
        }
        return result;
      }
    },
    size: () => ({
      chars: countCharStmt.get()?.c ?? 0,
      words: countWordStmt.get()?.c ?? 0,
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
): { chars: number; words: number } {
  const insertChar = db.prepare(
    'INSERT OR REPLACE INTO wubi_chars (char, wubi_code, weight, is_primary) VALUES (?, ?, ?, 1)',
  );
  const insertWord = db.prepare(
    'INSERT OR REPLACE INTO wubi_words (word, wubi_code, weight, length) VALUES (?, ?, ?, ?)',
  );

  const tx = db.transaction(() => {
    for (const c of chars) {
      insertChar.run(c.char, c.code, c.weight);
    }
    for (const w of words) {
      insertWord.run(w.word, w.code, w.weight, w.length);
    }
  });
  tx();

  return { chars: chars.length, words: words.length };
}
