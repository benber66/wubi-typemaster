// 内置示例文本（文章跟打练习用）
// 取自现代汉语常用词；后续 Phase 可加入"用户导入"和"自选文本"

export const SAMPLE_TEXTS: ReadonlyArray<{
  id: string;
  title: string;
  content: string;
  level: 'beginner' | 'intermediate' | 'advanced';
}> = [
  {
    id: 'lorem-cn-1',
    title: '日常 · 问候',
    level: 'beginner',
    content: '今天天气很好，我们一起去公园散步吧。你想喝点什么？',
  },
  {
    id: 'tech-1',
    title: '技术 · 编程',
    level: 'intermediate',
    content: '学习五笔输入法需要坚持练习。每天抽出一些时间，逐步提高打字速度。',
  },
  {
    id: 'essay-1',
    title: '散文 · 时光',
    level: 'advanced',
    content: '时间如流水般悄然逝去，留下的只有回忆与期盼。我们在键盘的敲击声中，度过每一个充实的日子。',
  },
  {
    id: 'poem-1',
    title: '古诗 · 静夜',
    level: 'advanced',
    content: '床前明月光，疑是地上霜。举头望明月，低头思故乡。',
  },
  {
    id: 'famous-1',
    title: '名句 · 励志',
    level: 'beginner',
    content: '世上无难事，只要肯登攀。一分耕耘，一分收获。',
  },
];

export function getSampleTextById(id: string): typeof SAMPLE_TEXTS[number] | undefined {
  return SAMPLE_TEXTS.find((t) => t.id === id);
}

export function getRandomSampleText(seed?: number): typeof SAMPLE_TEXTS[number] {
  if (SAMPLE_TEXTS.length === 0) {
    throw new Error('No sample texts available');
  }
  if (seed === undefined) {
    return SAMPLE_TEXTS[Math.floor(Math.random() * SAMPLE_TEXTS.length)]!;
  }
  return SAMPLE_TEXTS[seed % SAMPLE_TEXTS.length]!;
}
