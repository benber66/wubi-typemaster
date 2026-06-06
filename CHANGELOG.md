# Changelog

All notable changes to WubiTypeMaster will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.0] - 2026-06-06

### Added
- **Phase 3.5 会话持久化** (`src/lib/db/sessions.ts`)
  - `insertSession` 原子事务：practice_sessions + session_errors
  - `getSession` / `listSessions` / `getSessionErrors` / `deleteSession`
  - `summarizeSessions` 聚合统计（avg/best wpm, accuracy, errors, totals）
  - `toCharErrors` 持久化模型 → 内存模型转换
  - 17 个单元测试
- **Phase 4 WordInvaders 游戏** (`src/lib/game/word-invaders.ts` + `src/components/PixiInvaders/` + `src/pages/WordInvaders/`)
  - 游戏核心：spawn / move / match / hit / miss（16 个单元测试）
  - PixiJS 8 渲染器：Graphics + Text + Container 缓存池
  - 页面：得分/击落/漏掉/WPM/准确率 · 实时输入 · 暂停/继续/Game Over
  - 键位追踪 + 实时输入框
  - 1 个 Storybook 故事
- **Phase 7 Electron 主进程** (`electron/main.ts` + `electron/preload.ts` + `electron/ipc/`)
  - `ipc/db.ts` 用户数据目录管理 + 自动迁移 + 启动时 lazy seed
  - `ipc/wubi.ts` 单字/编码/词组/核心池查询 IPC
  - `ipc/sessions.ts` 6 个会话管理 IPC
  - `ipc/settings.ts` 4 个设置 IPC
  - `ipc/updater.ts` electron-updater 包装 + 状态推送
  - `preload.ts` 完整类型化 `window.api` 暴露
  - `types/electron.d.ts` ElectronAPI 类型声明
  - 主进程构建：main 24KB + preload 4KB + renderer 622KB
- **Playwright E2E** (`tests/e2e/*.web.spec.ts` + `tests/e2e/app.electron.spec.ts`)
  - 9 个 web 测试：Home / Article / WordInvaders / Settings 流程
  - 2 个 Electron 启动测试（带 built 跳过）
  - `scripts/serve-static.mjs` SPA fallback 静态服务器
  - `vite.web.config.ts` 独立 web 构建配置
  - `dev:web` / `build:web` / `serve:web` npm 脚本
  - 修 electron-vite 别名：main/preload/renderer 共享 `@` / `@electron` / `@tests`

### Total tests
- 145 → **178 unit + 9 e2e = 187 total**

## [0.3.0] - 2026-06-06

### Added
- **Phase 3a 打字核心 metrics** (`src/lib/typing/metrics.ts`)
  - `calculateWpm(correctChars, durationMs)` + `wpmToCpm(wpm)` 标准公式
  - `calculateAccuracy(correct, total)` 0-1 浮点
  - `compareTexts(target, typed)` 返回 `ComparisonResult`（per-char status + error list）
  - `isCharCorrect` / `summarizeKeystrokes` 辅助
  - 21 个单元测试覆盖
- **Phase 3b IME 输入处理** (`src/lib/ime/input-handler.ts`)
  - `extractCommitText` / `isFinalCommit` 处理 compositionend 事件
  - `getLastChar` / `handleCommit` 标点过滤与单字提取
  - `buildCharError` 构造 `CharError`（含 expected/typed/expectedCode/typedCode/position）
  - 17 个单元测试覆盖
- **Phase 3d 练习状态机** (`src/stores/practice.ts`)
  - Zustand store：`start/pause/resume/commit/undo/end/reset/getResult`
  - 自动记录 `CharError[]`，自动计算 wpm/accuracy/durationMs
  - `commit` 返回 `CharError | null`（完成时返回 null）
  - 15 个单元测试覆盖
- **Phase 3c/3e 文章练习页** (`src/pages/Article/`)
  - 文本选择 → 实时 WPM/准确率/进度条
  - IME compositionend 捕获单字
  - 错字弹五笔码 + 词组提示
  - 完成页显示错字明细
  - VirtualKeyboard 联动：高亮目标字首笔键位
  - 1 个 Storybook story
- **CodeHint 组件** (`src/components/CodeHint/`)
  - 错字码 + 词组建议 + 键位提示
  - 3 个 Storybook story
- **示例文本** (`src/lib/practice/sample-texts.ts`)
  - 5 句中英文练习素材

### Total tests
- 92 → **145 passed** (53 新增)

## [0.2.1] - 2026-06-06

### Added
- **Storybook 8.6.18** 完整接入（补完 Phase 2 未完成项）
- **27 个 stories**，分 3 个分类：
  - `UI/`：Button (9)、Card (2)、Switch (4)、Select (2)、Slider (3) — shadcn 原子组件
  - `Components/`：VirtualKeyboard (4)、Sidebar (1) — 应用组件
  - `Pages/`：HomePage、SettingsPage、KeyboardPage — 整页（带 ThemeProvider + MemoryRouter decorator）
- **`.npmrc`**：`public-hoist-pattern[]=@storybook/*`（pnpm 必须 hoist storybook 子包）
- **`.storybook/main.ts`**：用 Storybook 8 的 `StorybookConfig` 类型 + `@/` 别名
- **`.storybook/preview.ts`**：`withThemeByClassName` decorator 自动切换 light/dark 主题

### Removed
- `.storybook/store.ts`：占位 Redux store（项目用 Zustand）
- `.storybook/stories/App.stories.tsx`：占位 App story

### Verified
- ✅ `pnpm build-storybook` 11 个 stories 文件 → 27 stories 成功 build
- ✅ `pnpm typecheck` 0 错误
- ✅ `pnpm lint` 0 错误
- ✅ `pnpm test` 92/92 通过

## [0.2.0] - 2026-06-06

### Added
- **核心 UI 骨架**（Phase 2 完成）
- **路由 + 侧边栏布局**：react-router-dom MemoryRouter + Sidebar 导航（首页/统计/键位/设置）
- **首页**：4 种模式卡片（文章跟打 / Word Invaders / Bubble / KeyDrill），Phase 3+ 模式未实装显示「即将推出」标记
- **设置页**：Light/Dark/System 主题切换 + 8 个强调色预设 + 自定义色盘 + 虚拟键盘显隐 + 音效开关 + 音量
- **键位页**：完整五笔 86 虚拟键盘展示（26 键，每键显示主字根 + 蓝/橙边区分左右手）
- **持久化**：Zustand `persist` 中间件 → `localStorage`，重启保留设置（Phase 3+ 同步到 SQLite）
- **shadcn/ui 基础组件**：Button、Card、Switch、Label、Select、Slider（手写，未用 CLI）
- **radix-ui 依赖**：`@radix-ui/react-{slot,switch,label,select,slider,dialog}` 6 个包
- **lib/db/settings.ts**：DB 设置 CRUD（getSetting/setSetting/loadAllSettings/saveAllSettings）— 供主进程使用

### Changed
- **App.tsx**：从静态欢迎页 → 完整路由 + ThemeProvider
- **vitest.config.ts**：分层覆盖率阈值（lib/wubi 100%、db 80%、全局 60%）；排除 entry points + UI 框架
- **tsconfig.node.json**：新增 `src/types/**/*` include

### Verified
- ✅ `pnpm typecheck` 0 错误
- ✅ `pnpm lint` 0 错误
- ✅ `pnpm test:coverage` 92/92 通过，整体 98.79%
- ✅ `pnpm build` 3 角色（main/preload/renderer）全成功，renderer bundle 622KB
- ✅ `pnpm dev` 启动正常，3 Electron 进程 + WubiTypeMaster 窗口

## [0.1.1] - 2026-06-06

### Added
- **核心数据集**：3500 常用字 + 7301 常用词，加 `isCore` 字段
- **数据源**（参考 [data-sources.md](docs/data-sources.md)）：
  - 汉字频次：Jun Da《现代汉语单字频率列表》via hanziDB.csv (MIT)
  - 词组频次：SUBTLEX-CH-WF (Cai & Brysbaert 2010, GB18030 编码)
- **数据库迁移** `002_add_is_core.sql`：wubi_chars / wubi_words 增加 `is_core` 列 + 4 个部分索引
- **查询 API 增强**：
  - `WubiChar` / `WubiWord` 增加 `isCore: boolean` 字段
  - `LookupResult` 增加 `isCore` 字段
  - 新方法：`randomCoreChars(count)` / `randomCoreWords(count, length?)`
  - `size()` 返回 `{ chars, words, coreChars, coreWords }`
- **数据源文档** `docs/data-sources.md`：3 个数据源完整说明 + 协议 + 数据流图

### Changed
- **build-wubi-table.ts** 重写：从 3 个数据源（wubi YAML + hanziDB + SUBTLEX）合并
- **数据排序**：先按 `isCore` 优先，再按 Jun Da / SUBTLEX 排名，最后按 Rime 权重

### Verified
- ✅ `pnpm typecheck` 严格模式 0 错误
- ✅ `pnpm lint` 0 错误
- ✅ `pnpm test:coverage` 68/68 通过
- ✅ `pnpm seed:reset` 21,586 单字 (核心 3500) + 62,323 词组 (核心 7301)
- ✅ Top 10 核心字：的(r), 一(g), 是(j), 不(i), 了(b), 在(d), 人(w), 有(e), 我(q), 他(wb)
- ✅ Top 10 核心词：我们(trwu), 什么(wftc), 知道(tdut), 他们(wbwu), 一个(ggwh), 你们(wqwu), 没有(imde), 这个(ypwh), 怎么(thtc), 现在(gmdh)

## [0.1.0] - 2026-06-06

### Added
- **码表数据层**：Wubi 86 码表（21,586 单字 + 62,323 词组）从 rime-wubi86-jidian 提取并结构化
- **SQLite 数据库层**：`better-sqlite3` 封装（`src/db/client.ts`），自动应用迁移
- **码表查询 API**：`src/lib/wubi/lookup.ts` 提供 `lookupChar` / `lookupCode` / `lookupWord` / `lookupByCode` / `lookupPrefix` / `randomChars` / `randomWords` / `size`
- **首次数据库迁移**：`src/db/migrations/001_initial.sql`，建表 `wubi_chars` / `wubi_words` / `practice_sessions` / `session_errors` / `key_stats` / `settings` + 索引
- **数据灌入脚本**：`scripts/seed-db.ts`，支持 `--reset` 全量重灌
- **码表构建脚本**：`scripts/build-wubi-table.ts`，从 Rime YAML 字典解析为 JSON
- **`@types/better-sqlite3`** 类型支持
- **测试**：53 个测试覆盖（32 单测 + 21 集成），覆盖率：
  - `src/lib/wubi/lookup.ts`：100% 行/语句/函数，86.84% 分支
  - `src/db/client.ts`：94.52% 行/语句，81.81% 分支
- **脚本别名**：`pnpm build:wubi` / `pnpm seed` / `pnpm seed:reset`

### Verified
- ✅ `pnpm typecheck` 严格模式 0 错误
- ✅ `pnpm lint` 0 错误
- ✅ `pnpm test` 53/53 通过（vitest 1.6.1）
- ✅ `pnpm test:coverage` 覆盖率达标
- ✅ `pnpm seed:reset` 端到端验证：灌入 21,586 单字 + 62,323 词组 (434ms)，抽查 5 单字 + 2 词组编码全部正确

### Phase
- 完成 [Phase 1：数据基础](../docs/roadmap.md)

## [0.0.2] - 2026-06-06

### Changed
- 锁定 Node 20 LTS（原 24），better-sqlite3 现成预编译版本，免装 VS Build Tools
- 修正 `electron-builder.yml` 重复 `output` 键
- `.gitignore` 补充 `out/`（electron-vite 构建产物）

### Added
- 完整 devDependencies：electron 31 / electron-vite / vite 5 / react 18 / tailwind 3 / pixi.js 8 / recharts 2 / better-sqlite3 11 / electron-updater / electron-log
- 工具链：@vitejs/plugin-react@4 / @electron-toolkit/utils / @electron-toolkit/preload / @electron/rebuild / tailwindcss-animate
- `pnpm-lock.yaml` 锁定依赖树，确保 CI 可复现
- `package.json` 新增 `main` 字段指向 `./out/main/index.js`
- electron-vite 配置（main / preload / renderer 三个角色）

### Verified
- ✅ `pnpm typecheck` 严格模式 0 错误
- ✅ `pnpm lint` 0 错误
- ✅ `pnpm build` 成功（out/ 产物 ~230KB）
- ✅ `pnpm dev` 启动 Vite :5173 + Electron 4 进程

### Phase
- 完成 [Phase 0：项目初始化](../docs/roadmap.md)

## [0.0.1] - 2026-06-06

### Added
- 初始化项目仓库
- 完整目录结构
- 需求规格书与架构文档
- 7 阶段开发路线图
- 4 篇架构决策记录 (ADR)
- 开发者文档与用户文档
- CI/CD 工作流占位

[Unreleased]: https://github.com/benber66/wubi-typemaster/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/benber66/wubi-typemaster/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/benber66/wubi-typemaster/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/benber66/wubi-typemaster/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/benber66/wubi-typemaster/compare/v0.0.2...v0.1.0
[0.0.2]: https://github.com/benber66/wubi-typemaster/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/benber66/wubi-typemaster/releases/tag/v0.0.1
