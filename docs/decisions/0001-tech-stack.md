# ADR-0001：技术栈选型

> 状态：已接受
> 日期：2026-06-06
> 决策者：项目所有者

## 背景

需要为 WubiTypeMaster 项目选择前端技术栈。要求：

- 跨平台桌面应用
- 良好的 UI 灵活度（需要支持 Light/Dark 主题、自定义强调色）
- 能渲染 2D 游戏动画
- 适合中等复杂度的业务应用

## 备选方案

### 方案 A：Electron + React + TypeScript

- ✅ 生态成熟，Electron 31+ 稳定
- ✅ React 18 + TypeScript 5 组合主流
- ✅ Tailwind + shadcn/ui 主题/强调色易定制
- ✅ better-sqlite3 同步 API、性能好
- ✅ PixiJS 可在 React 中作为 canvas 嵌入
- ❌ 包体积较大（50-100MB）
- ❌ 内存占用较高

### 方案 B：Tauri + React + TypeScript

- ✅ 包体积小（几 MB）、性能好
- ✅ 原生外观、Rust 后端
- ❌ Rust 学习曲线陡
- ❌ 生态比 Electron 略小
- ❌ 跨平台构建调试相对复杂

### 方案 C：Flutter Desktop

- ✅ 自绘 UI，跨平台一致
- ✅ 性能好
- ❌ 不适合 web 技术栈
- ❌ 中文 IME 兼容性需要验证
- ❌ 生态对 SQLite / 系统集成不如 web 友好

## 决策

选择 **方案 A：Electron + React + TypeScript**。

理由：

1. 团队/个人更熟悉 Web 技术栈
2. 生态成熟，跨平台问题解决方案多
3. 文档/教程丰富
4. 集成中文 IME（系统输入法）更自然
5. 性能虽不如 Tauri，但对打字练习类应用足够

## 详细技术选型

| 层       | 选型                    | 理由                        |
| -------- | ----------------------- | --------------------------- |
| 桌面框架 | Electron 31+            | 主流选择                    |
| 前端     | React 18 + TypeScript 5 | 主流                        |
| 构建     | Vite + electron-vite    | 启动快、HMR 流畅            |
| UI       | Tailwind + shadcn/ui    | 主题灵活、可定制            |
| 状态     | Zustand                 | 比 Redux 简单、够用         |
| 游戏     | PixiJS 8                | 2D WebGL、适合下落/气泡动画 |
| 图表     | Recharts                | 简单、声明式                |
| 数据库   | better-sqlite3          | 同步 API、性能好            |

## 后果

- 包体积 ~50MB，内存 ~150MB（中等水平）
- 启动时间 ~2s
- 跨平台打包需要测试 Windows + Linux
- 团队成员需熟悉 Electron 进程模型

## 后续考虑

- 若未来需要减小体积，可考虑迁移到 Tauri（但需重写主进程）
- 若需要 macOS 原生体验，可考虑 Mac App Store 单独优化
