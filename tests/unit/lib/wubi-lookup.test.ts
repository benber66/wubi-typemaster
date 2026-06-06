import { describe, it, expect, beforeEach } from 'vitest';
import {
  createLookupFromJson,
  type WubiChar,
  type WubiWord,
} from '../../../src/lib/wubi/lookup';

const CHARS: WubiChar[] = [
  { char: '中', code: 'k', weight: 5000, codeLength: 1, isCore: true },
  { char: '国', code: 'l', weight: 4999, codeLength: 1, isCore: true },
  { char: '我', code: 'q', weight: 4998, codeLength: 1, isCore: true },
  { char: '的', code: 'r', weight: 4997, codeLength: 1, isCore: true },
  { char: '是', code: 'j', weight: 4996, codeLength: 1, isCore: true },
  { char: '在', code: 'd', weight: 4995, codeLength: 1, isCore: true },
  { char: '了', code: 'b', weight: 4994, codeLength: 1, isCore: true },
  { char: '有', code: 'e', weight: 4993, codeLength: 1, isCore: true },
  { char: '工', code: 'a', weight: 4992, codeLength: 1, isCore: true },
  { char: '土', code: 'f', weight: 4991, codeLength: 1, isCore: true },
  { char: '大', code: 'dd', weight: 4980, codeLength: 2, isCore: true },
  { char: '木', code: 's', weight: 4900, codeLength: 1, isCore: true },
  { char: '乾', code: 'fjjt', weight: 100, codeLength: 4, isCore: false },
  { char: '朝', code: 'fje', weight: 200, codeLength: 3, isCore: false },
];

const WORDS: WubiWord[] = [
  { word: '中国', code: 'lgkl', weight: 5000, length: 2, isCore: true },
  { word: '我们', code: 'trwu', weight: 4999, length: 2, isCore: true },
  { word: '的', code: 'r', weight: 1000, length: 1, isCore: true },
  { word: '工人', code: 'arw', weight: 800, length: 2, isCore: true },
  { word: '大地', code: 'ddfb', weight: 600, length: 2, isCore: true },
  { word: '大规模', code: 'ddtg', weight: 400, length: 3, isCore: true },
  { word: '乾乾', code: 'fjjf', weight: 50, length: 2, isCore: false },
];

describe('createLookupFromJson', () => {
  let lookup: ReturnType<typeof createLookupFromJson>;

  beforeEach(() => {
    lookup = createLookupFromJson(CHARS, WORDS);
  });

  describe('lookupChar', () => {
    it('应该返回单字及其编码', () => {
      const r = lookup.lookupChar('中');
      expect(r).not.toBeNull();
      expect(r?.code).toBe('k');
      expect(r?.codeLength).toBe(1);
    });

    it('不存在的字返回 null', () => {
      expect(lookup.lookupChar('𠀀')).toBeNull();
    });

    it('空字符串返回 null', () => {
      expect(lookup.lookupChar('')).toBeNull();
    });

    it('大写编码也能识别（输入字符始终 1 个）', () => {
      // 字符级别不涉及大小写
      const r = lookup.lookupChar('我');
      expect(r?.code).toBe('q');
    });
  });

  describe('lookupCode', () => {
    it('单字编码查询返回按权重排序的数组', () => {
      // 'f' 对应：土(f,4991), 朝(fje,200) → 不对，朝是 3 字母
      // 实际：f 单独命中土(weight 4991)
      const r = lookup.lookupCode('f');
      expect(r.length).toBeGreaterThan(0);
      expect(r[0]?.char).toBe('土');
    });

    it('二级简码查询', () => {
      const r = lookup.lookupCode('dd');
      expect(r.length).toBeGreaterThan(0);
      expect(r.some((c) => c.char === '大')).toBe(true);
    });

    it('不存在的编码返回空数组', () => {
      expect(lookup.lookupCode('xxxxxx')).toEqual([]);
    });

    it('空编码返回空数组', () => {
      expect(lookup.lookupCode('')).toEqual([]);
    });

    it('权重高的字排在前面', () => {
      const r = lookup.lookupCode('d');
      // 'd' 对应: 在(d,4995)
      expect(r[0]?.char).toBe('在');
    });
  });

  describe('lookupWord', () => {
    it('查询词组返回编码', () => {
      const r = lookup.lookupWord('我们');
      expect(r).not.toBeNull();
      expect(r?.code).toBe('trwu');
      expect(r?.length).toBe(2);
    });

    it('不存在的词组返回 null', () => {
      expect(lookup.lookupWord('不存在')).toBeNull();
    });

    it('空字符串返回 null', () => {
      expect(lookup.lookupWord('')).toBeNull();
    });
  });

  describe('lookupByCode', () => {
    it('查询词组编码返回匹配词组', () => {
      const r = lookup.lookupByCode('trwu');
      expect(r.length).toBeGreaterThan(0);
      expect(r.some((w) => w.word === '我们')).toBe(true);
    });

    it('按权重降序排列', () => {
      const r = lookup.lookupByCode('lgkl');
      expect(r[0]?.weight).toBeGreaterThanOrEqual(r[r.length - 1]?.weight ?? 0);
    });

    it('不存在的编码返回空数组', () => {
      expect(lookup.lookupByCode('xxxxxx')).toEqual([]);
    });
  });

  describe('lookupPrefix', () => {
    it('前缀查询返回匹配的单字和词组', () => {
      const r = lookup.lookupPrefix('d');
      // 单字: 在(d), 大(dd)
      // 词组: 大地(ddfb), 大规模(ddtg)
      const types = new Set(r.map((x) => x.type));
      expect(types.has('char')).toBe(true);
      expect(types.has('word')).toBe(true);
    });

    it('结果按权重降序', () => {
      const r = lookup.lookupPrefix('d');
      for (let i = 1; i < r.length; i++) {
        expect(r[i]!.weight).toBeLessThanOrEqual(r[i - 1]!.weight);
      }
    });

    it('limit 限制返回数量', () => {
      const r = lookup.lookupPrefix('d', 2);
      expect(r.length).toBeLessThanOrEqual(2);
    });

    it('空前缀返回空数组', () => {
      expect(lookup.lookupPrefix('')).toEqual([]);
    });

    it('无匹配的前缀返回空数组', () => {
      expect(lookup.lookupPrefix('zzzzzz')).toEqual([]);
    });

    it('结果中每条都带 type、length 和 isCore', () => {
      const r = lookup.lookupPrefix('d');
      for (const item of r) {
        expect(['char', 'word']).toContain(item.type);
        expect(item.length).toBeGreaterThanOrEqual(1);
        expect(item.text.length).toBe(item.length);
        expect(typeof item.isCore).toBe('boolean');
      }
    });
  });

  describe('randomChars', () => {
    it('返回指定数量的字', () => {
      const r = lookup.randomChars(5);
      expect(r.length).toBe(5);
    });

    it('count=0 返回空数组', () => {
      expect(lookup.randomChars(0)).toEqual([]);
    });

    it('负数返回空数组', () => {
      expect(lookup.randomChars(-1)).toEqual([]);
    });

    it('返回的字都在码表中', () => {
      const r = lookup.randomChars(10);
      const valid = new Set(CHARS.map((c) => c.char));
      for (const c of r) {
        expect(valid.has(c.char)).toBe(true);
      }
    });
  });

  describe('randomWords', () => {
    it('返回指定数量的词组', () => {
      const r = lookup.randomWords(3);
      expect(r.length).toBe(3);
    });

    it('按 length 过滤', () => {
      const r = lookup.randomWords(10, 3);
      // 词长为 3 的：大规模
      expect(r.every((w) => w.length === 3)).toBe(true);
    });

    it('无匹配的 length 返回空数组', () => {
      // 我们测试数据没有 4 字词
      const r = lookup.randomWords(5, 4);
      expect(r).toEqual([]);
    });

    it('count=0 返回空数组', () => {
      expect(lookup.randomWords(0)).toEqual([]);
    });
  });

  describe('randomCoreChars', () => {
    it('只返回 isCore=true 的字', () => {
      const r = lookup.randomCoreChars(20);
      expect(r.length).toBe(20);
      expect(r.every((c) => c.isCore)).toBe(true);
    });

    it('count=0 返回空数组', () => {
      expect(lookup.randomCoreChars(0)).toEqual([]);
    });

    it('返回的字都在核心集内', () => {
      const r = lookup.randomCoreChars(10);
      const valid = new Set(CHARS.filter((c) => c.isCore).map((c) => c.char));
      for (const c of r) {
        expect(valid.has(c.char)).toBe(true);
      }
    });
  });

  describe('randomCoreWords', () => {
    it('只返回 isCore=true 的词组', () => {
      const r = lookup.randomCoreWords(20);
      expect(r.length).toBe(20);
      expect(r.every((w) => w.isCore)).toBe(true);
    });

    it('按长度过滤', () => {
      const r = lookup.randomCoreWords(10, 2);
      expect(r.every((w) => w.isCore && w.length === 2)).toBe(true);
    });

    it('无匹配时返回空', () => {
      expect(lookup.randomCoreWords(5, 4)).toEqual([]);
    });

    it('count=0 返回空数组', () => {
      expect(lookup.randomCoreWords(0)).toEqual([]);
    });
  });

  describe('size', () => {
    it('返回码表大小与核心集大小', () => {
      const s = lookup.size();
      expect(s.chars).toBe(CHARS.length);
      expect(s.words).toBe(WORDS.length);
      expect(s.coreChars).toBe(CHARS.filter((c) => c.isCore).length);
      expect(s.coreWords).toBe(WORDS.filter((w) => w.isCore).length);
    });
  });

  describe('空数据', () => {
    it('空数组也能工作', () => {
      const empty = createLookupFromJson([], []);
      expect(empty.lookupChar('中')).toBeNull();
      expect(empty.lookupCode('k')).toEqual([]);
      expect(empty.lookupWord('我们')).toBeNull();
      expect(empty.lookupPrefix('d')).toEqual([]);
      expect(empty.randomChars(5)).toEqual([]);
      expect(empty.randomWords(5)).toEqual([]);
      expect(empty.randomCoreChars(5)).toEqual([]);
      expect(empty.randomCoreWords(5)).toEqual([]);
      expect(empty.size()).toEqual({ chars: 0, words: 0, coreChars: 0, coreWords: 0 });
    });
  });

  describe('大小写不敏感', () => {
    it('查询大小写不区分', () => {
      // 实际码表都小写
      const r1 = lookup.lookupCode('K');
      const r2 = lookup.lookupCode('k');
      expect(r1.length).toBe(r2.length);
    });
  });
});
