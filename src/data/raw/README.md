# Third-Party Data Sources

This project bundles three external data sources under their respective licenses.
All three are used for **personal, non-commercial typing practice**. See [data-sources.md](../../docs/data-sources.md) for technical details.

## 1. Wubi 86 (极点五笔) — 码表

- **File**: `wubi86_jidian.dict.yaml`
- **Source**: [rime-luna/rime-wubi86-jidian](https://github.com/rime-luna/rime-wubi86-jidian) (LuaRime 极点五笔86 schema)
- **License**: [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)
- **Copyright**: © 2019 rime-luna contributors

```
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
```

## 2. hanziDB (汉字频率表) — 单字频次

- **File**: `hanzi_db.csv`
- **Source**: [Scripta/cjk-project](https://github.com/Scripta/cjk-project) / `hanzi_db.csv`
- **Original data**: Jun Da (笭家治), _Modern Chinese Frequency List_ (《现代汉语常用字频率字典》)
- **License**: [MIT License](https://opensource.org/licenses/MIT)
- **Format note**: First row is header (`rank,char,pinyin,definition,...`); 9,900 简体 characters

```
MIT License - Copyright (c) Scripta Contributors
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

## 3. SUBTLEX-CH-WF — 词组频次

- **File**: `SUBTLEX-CH-WF` (GB18030-encoded text)
- **Source**: [Cai & Brysbaert (2010)](https://www.psychonomic.org/publication/journals/experimental-psychology/2009-06-05), _SUBTLEX-CH: Chinese word and character frequencies based on film subtitles_, PLOS ONE
- **License**: Free for academic / research use. If you intend commercial
  publication, consider using SUBTLEX-CH-POS or an alternative corpus
  (e.g. People's Daily corpus) due to the academic-use restriction.
- **Citation**:
  > Cai, Q., & Brysbaert, M. (2010). SUBTLEX-CH: Chinese word and character frequencies based on film subtitles. _PLOS ONE_, 5(6), e10729.

## Generated Artifacts

The following files in `src/data/` are **generated** by `scripts/build-wubi-table.ts`
from the three sources above and are committed to the repository for build
reproducibility. They are part of this project's MIT license:

- `wubi86-chars.json` (1.2 MB) — 21,586 single characters with Wubi codes
- `wubi86-words.json` (4.4 MB) — 62,323 words/phrases with Wubi codes
- `wubi86-stats.json` (3 KB) — build statistics and sample top-10

## Regeneration

To rebuild the generated artifacts from the three raw sources:

```bash
pnpm build:wubi    # writes src/data/wubi86-*.json
pnpm seed:reset    # builds DB and seeds from JSON
```

Raw sources are stored under `src/data/raw/` and versioned; the generator
is deterministic, so JSON outputs are bit-identical between runs.
