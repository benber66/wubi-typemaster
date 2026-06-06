export interface WubiKey {
  key: string;
  roots: ReadonlyArray<string>;
  hand: 'left' | 'right';
  finger: 1 | 2 | 3 | 4 | 5;
}

export const WUBI_86_LAYOUT: ReadonlyArray<ReadonlyArray<WubiKey>> = [
  [
    { key: 'q', roots: ['钅', '𠂉', '丿'], hand: 'left', finger: 1 },
    { key: 'w', roots: ['亻', '八', '丷'], hand: 'left', finger: 2 },
    { key: 'e', roots: ['一', '乙', '乚', '⺄'], hand: 'left', finger: 3 },
    { key: 'r', roots: ['讠', '亠', '⺁'], hand: 'left', finger: 4 },
    { key: 't', roots: ['丶', '⺀'], hand: 'left', finger: 4 },
    { key: 'y', roots: ['言', '讠', '䒑'], hand: 'right', finger: 5 },
    { key: 'u', roots: ['氵', '冂', '凵'], hand: 'right', finger: 4 },
    { key: 'i', roots: ['火', '灬', '⺆'], hand: 'right', finger: 3 },
    { key: 'o', roots: ['之', '𠂉', '廴'], hand: 'right', finger: 2 },
    { key: 'p', roots: ['宀', '衤', '礻'], hand: 'right', finger: 1 },
  ],
  [
    { key: 'a', roots: ['戈', '七'], hand: 'left', finger: 1 },
    { key: 's', roots: ['木', '朩', '⺈'], hand: 'left', finger: 2 },
    { key: 'd', roots: ['大', '犬', '三'], hand: 'left', finger: 3 },
    { key: 'f', roots: ['土', '士', '⺁'], hand: 'left', finger: 4 },
    { key: 'g', roots: ['王', '玉', '玨'], hand: 'left', finger: 4 },
    { key: 'h', roots: ['目', '罒', '⺁'], hand: 'right', finger: 5 },
    { key: 'j', roots: ['日', '曰', '早'], hand: 'right', finger: 4 },
    { key: 'k', roots: ['口', '囗', '吕'], hand: 'right', finger: 3 },
    { key: 'l', roots: ['田', '甲', '由'], hand: 'right', finger: 2 },
  ],
  [
    { key: 'z', roots: ['金', '钅', '釒'], hand: 'left', finger: 1 },
    { key: 'x', roots: ['纟', '糸', '幺'], hand: 'left', finger: 2 },
    { key: 'c', roots: ['月', '肉', '⺼'], hand: 'left', finger: 3 },
    { key: 'v', roots: ['艹', '廿', '卄'], hand: 'left', finger: 4 },
    { key: 'b', roots: ['又', '阝', '卩'], hand: 'left', finger: 4 },
    { key: 'n', roots: ['山', '⺊', '冖'], hand: 'right', finger: 5 },
    { key: 'm', roots: ['女', '⺟', '毋'], hand: 'right', finger: 4 },
  ],
];

export function findKeyByChar(char: string): WubiKey | undefined {
  for (const row of WUBI_86_LAYOUT) {
    for (const k of row) {
      if (k.key === char.toLowerCase()) return k;
    }
  }
  return undefined;
}
