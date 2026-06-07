# WubiTypeMaster — AI 助手项目指南

## 项目概览

WubiTypeMaster (v0.6.3) 是一个跨平台桌面五笔打字练习应用，支持四种模式：文章跟打、Word Invaders（Pixi.js 游戏）、Bubble（Pixi.js 游戏）、KeyDrill。

## 构建与测试命令

```bash
pnpm dev              # Electron 开发模式（HMR）
pnpm dev:web          # Web 开发模式（E2E 测试用）
pnpm build            # electron-vite 构建
pnpm build:win        # 构建 + Windows 打包（NSIS + portable）
pnpm build:linux      # 构建 + Linux 打包（AppImage + deb）
pnpm test             # Vitest 单元 + 集成测试
pnpm test:e2e         # Playwright E2E 测试
pnpm test:coverage    # 测试覆盖率
pnpm typecheck        # TypeScript 类型检查（node + web）
pnpm lint             # ESLint
pnpm format           # Prettier 格式化
pnpm seed             # JSON → SQLite 灌入数据
pnpm seed:reset       # 重置数据库
pnpm release          # standard-version 版本提升 + changelog
pnpm storybook        # Storybook 组件开发
```

## 关键架构决策

### 进程模型

- **主进程** (`electron/`): BrowserWindow 管理、SQLite (better-sqlite3)、IPC handler、auto-updater (electron-updater)
- **预加载** (`electron/preload.ts`): contextBridge 暴露 `window.api`（db/sessions/settings/updater/app 子 API），使用 invoke/handle 模式
- **渲染进程** (`src/`): React 18 + TypeScript + Tailwind CSS + Zustand。使用 MemoryRouter（无 URL 栏）

### IPC 通信

所有 IPC 使用 invoke/handle 模式（Promise 双向）。通道命名约定：`domain:action`（如 `sessions:insert`, `wubi:lookupChar`）。事件推送用 `webContents.send()`（如 `updater:status`）。

### 数据库

- **引擎**: better-sqlite3 11（同步、WAL 模式）
- **位置**: `app.getPath('userData')/wubi-typemaster.sqlite`，开发期在 `data/db.sqlite`
- **迁移**: `src/db/migrations/NNN_name.sql` 按版本自动应用
- **码表**: 启动时从 `extraResources/data/wubi86-{chars,words}.json` 全量加载到 Lookup（内存 + SQLite 双实现）

### 状态管理

- `useSettings` — 持久化到 localStorage（zustand/middleware/persist），含 theme/accentColor/virtualKeyboard/sound
- `usePractice` — 实时打字会话状态（status/targetText/typedText/position/errors）及相关操作（start/pause/commit/undo/end/reset）。`commitChars()` 方法处理 IME 多次提交
- 游戏页面（Invaders/Bubble/KeyDrill）使用本地 `useState` + `useGameSession` hook 持久化

### 五笔查找引擎

- `src/lib/wubi/lookup.ts`: `WubiLookup` 接口 + 两实现（`createLookupFromJson` 内存版 / `createLookup` SQLite 版）
- 核心方法: `lookupChar`, `lookupCode`, `lookupWord`, `lookupByCode`, `lookupPrefix`, `randomChars`, `randomCoreChars`, `randomWords`, `randomCoreWords`

### IME 输入处理

- 文章模式使用 `<textarea>` 的 `compositionStart/Update/End` 事件处理
- `src/lib/ime/` 提供 `extractCommitText()`, `splitCommitText()`, `codeToLetter()` 等工具
- `computeCharApply()` 逐字比对 typed vs expected，记录 `CharError`

### Pixi.js 游戏模式

- Invaders: 字符从上往下落，类型为 WordInvaders（`src/lib/game/word-invaders.ts` 纯函数逻辑）
- Bubble: 字符从下往上升（`src/lib/game/bubble.ts`）
- KeyDrill: 基于弱键的专项练习（`src/lib/game/key-drill.ts`）
- 游戏循环使用 `setInterval` 100ms + delta time
- 输入直接监听 `KeyboardEvent`，使用 `codeToLetter()` 提取字母

## 编码规范

### TypeScript 严格模式

- `strict: true`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`
- 禁止 `any`（用 `unknown` + 类型守卫），禁止默认导出（组件除外）
- 别名: `@/` → `src/*`, `@electron/` → `electron/*`, `@tests/` → `tests/*`

### 命名与导入

- 组件文件: PascalCase（如 `VirtualKeyboard.tsx`），其他: kebab-case
- 导入顺序: 外部包 → `@/` 别名 → 相对路径。类型导入使用 `import type`

### Git 提交

- Conventional Commits: `feat|fix|docs|refactor|test|chore(scope): message`
- 版本管理: standard-version（`pnpm release` 自动 bump + changelog）

## CI/CD 关键点

### Release 流程（`.github/workflows/release.yml`）

- 触发: tag push `v*`
- Windows 构建 + gh CLI 创建/上传 release（筛选 exe/blockmap/nupkg/RELEASES/latest.yml）
- Linux 构建允许失败
- 同步到 Gitee（`git push --force --mirror` + 手动 asset sync）

### 中国大陆网络

- 所有 workflow 使用 `ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/`
- npm registry: `https://registry.npmmirror.com`

## 相关文档

- `docs/architecture/overview.md` — 架构概览
- `docs/architecture/db-schema.md` — 数据库 Schema
- `docs/architecture/lookup-api.md` — 五笔查找 API
- `docs/architecture/ci-cd.md` — CI/CD 说明
- `docs/dev-guide/getting-started.md` — 开发者入门
- `docs/dev-guide/coding-standards.md` — 编码规范
- `docs/dev-guide/testing.md` — 测试说明
- `docs/data-sources.md` — 五笔数据源
- `docs/roadmap.md` — 路线图
- `docs/decisions/` — ADR 架构决策记录
