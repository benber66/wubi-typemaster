# 开发路线图

> 版本：v0.0.1
> 总估时：~13 天（个人节奏）

## 阶段总览

| 阶段 | 名称 | 估时 | 状态 |
|---|---|---|---|
| Phase 0 | 项目初始化 | 0.5 天 | 🔵 进行中 |
| Phase 1 | 数据基础 | 1.5 天 | ⚪ 待开始 |
| Phase 2 | 核心 UI 骨架 | 1 天 | ⚪ 待开始 |
| Phase 3 | 文章跟打模式 | 2 天 | ⚪ 待开始 |
| Phase 4 | 统计与进度 | 1.5 天 | ⚪ 待开始 |
| Phase 5 | 游戏模式 | 3 天 | ⚪ 待开始 |
| Phase 6 | 打包与发布 | 1.5 天 | ⚪ 待开始 |
| Phase 7 | 打磨与文档 | 1.5 天 | ⚪ 待开始 |

## Phase 0：项目初始化（0.5 天）

### 目标
搭建可运行的最小 Electron + React + TypeScript 工程骨架。

### 任务清单
- [x] 在 D:\MySourcecode\wubi-typemaster 初始化 git 仓库
- [x] 创建完整目录结构
- [x] 编写 docs/ 下的所有规划文档
- [ ] 初始化 `package.json` + 依赖
- [ ] 配置 Vite + electron-vite
- [ ] 配置 Tailwind + shadcn/ui
- [ ] 配置 ESLint + Prettier + tsconfig 严格模式
- [ ] 编写 `.nvmrc`、`.editorconfig`
- [ ] 配置 `ci.yml`（跑通 lint + typecheck + 单测）
- [ ] 编写 `README.md` + `CONTRIBUTING.md`

### 验收
- [ ] `pnpm dev` 启动空白窗口
- [ ] PR 触发 CI 全绿

## Phase 1：数据基础（1.5 天）

### 目标
完成五笔 86 单字/词组码表的数据基础和查询 API。

### 任务清单
- [ ] 收集/整理五笔 86 单字码表 → `wubi86-chars.json`
- [ ] 收集/整理五笔 86 词组码表 → `wubi86-words.json`
- [ ] 编写 `scripts/build-wubi-table.ts` 验证数据完整性
- [ ] 设计 SQLite Schema（迁移文件 `001_initial.sql`）
- [ ] 实现 `db/client.ts`（better-sqlite3 封装 + 单例）
- [ ] 编写 `scripts/seed-db.ts`（启动时建表 + 灌入码表）
- [ ] 实现 `lib/wubi/lookup.ts`（汉字→码、码→汉字、词组查询）
- [ ] 单元测试：`lib/wubi/` 覆盖 100%、`db/` 覆盖 80%+

### 验收
- [ ] 可通过 API 查任意汉字的码
- [ ] 测试覆盖率达标
- [ ] 启动时自动建表、灌入数据

## Phase 2：核心 UI 骨架（1 天）

### 目标
完成主题、路由、首页、虚拟键盘等基础 UI。

### 任务清单
- [ ] 安装 shadcn 基础组件（Button、Card、Dialog、Toggle、Select）
- [ ] 实现 `ThemeProvider`（Light/Dark + 强调色 CSS 变量）
- [ ] 实现侧边导航 + 路由（react-router 6）
- [ ] 实现 `Home` 首页（4 个模式入口 + 状态卡片）
- [ ] 实现 `VirtualKeyboard` 组件（26 键 + 字根 + 高亮）
- [ ] 实现基础 `Settings` 页（主题/强调色/虚拟键盘显隐/音效）
- [ ] Storybook 配置 + 给核心组件写 story

### 验收
- [ ] 能切换主题
- [ ] 能选模式
- [ ] 虚拟键盘可显隐

## Phase 3：文章跟打模式（2 天）

### 目标
完成核心的文章跟打模式，含输入捕获、错误提示、数据持久化。

### 任务清单
- [ ] 实现 `Article` 页面（文本加载 + 输入区 + 进度条）
- [ ] 实现 `lib/ime/input-handler.ts`（捕获 IME 最终上屏字符）
- [ ] 实现 `lib/typing/metrics.ts`（WPM、准确率、错字判定）
- [ ] 错误时弹 `CodeHint`（显示该字 + 词组码）
- [ ] 练习结束写入 sessions + errors 表
- [ ] 单元测试 + 集成测试
- [ ] E2E：一个 happy path

### 验收
- [ ] 可正常跟打
- [ ] 统计准确
- [ ] 错字提示正常

## Phase 4：统计与进度（1.5 天）

### 目标
完成历史记录、趋势图、热力图、错字本。

### 任务清单
- [ ] `Stats` 页：历史记录列表（分页 + 筛选）
- [ ] 趋势图：Recharts 折线图（日/周/月 WPM + 准确率）
- [ ] 热力图：26 键位错误率（自定义 SVG 组件）
- [ ] 错字本：列表 + "加入重练"按钮
- [ ] E2E：跨模式统计准确性

### 验收
- [ ] 完整统计流程可走通

## Phase 5：游戏模式（3 天）

### 目标
完成 3 款游戏：Word Invaders、Bubble、KeyDrill。

### 任务清单
- [ ] 封装 PixiJS 通用游戏引擎类（场景管理、动画、碰撞）
- [ ] **Word Invaders**：汉字下落、键入正确击毁、得分、难度递增
- [ ] **Bubble**：词语气泡上升、键入完成破裂
- [ ] **KeyDrill**：从热力图读弱键 → 动态出题
- [ ] 每个游戏单独 E2E
- [ ] 单元测试覆盖游戏逻辑（非渲染）

### 验收
- [ ] 3 款游戏可玩
- [ ] 得分与正确率记录

## Phase 6：打包与发布（1.5 天）

### 目标
完成跨平台打包、自动更新、Gitee 同步。

### 任务清单
- [ ] 完善 `electron-builder.yml`（Win NSIS + Linux AppImage/deb）
- [ ] 实现 `electron/updater.ts` + IPC 暴露到渲染进程
- [ ] 编写 `release.yml`（tag 触发 + 同步 Gitee）
- [ ] 编写 `scripts/sync-gitee-release.mjs`
- [ ] 实现 `Settings` 中"检查更新"按钮 + "更新源"切换
- [ ] 测试本地打包产物
- [ ] 在 Gitee 创建镜像仓，配置 webhook（如需要）

### 验收
- [ ] `git tag v0.1.0 && git push --tags` 可自动发布

## Phase 7：打磨与文档（1.5 天）

### 目标
完善音效、性能、文档，发首版本。

### 任务清单
- [ ] 音效模块（可选，默认关）
- [ ] 性能优化（首屏、列表虚拟滚动、数据库索引）
- [ ] 完善 `docs/`（架构图、用户手册、ADR）
- [ ] 完成所有 Storybook story
- [ ] 首版本发版（v0.1.0）

### 验收
- [ ] v0.1.0 正式可用
