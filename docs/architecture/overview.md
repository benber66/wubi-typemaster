# 架构概览

> 版本：v0.1.1

## 1. 总体架构

WubiTypeMaster 采用经典的 **Electron 桌面应用**架构：

```
┌─────────────────────────────────────────────────────────┐
│                    Electron 应用进程                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────┐   ┌──────────────────────┐   │
│  │   主进程 (Main)       │   │  渲染进程 (Renderer)  │   │
│  │                      │   │                      │   │
│  │  • 窗口管理          │   │  • React 18 UI        │   │
│  │  • 系统菜单          │   │  • TypeScript         │   │
│  │  • IPC 处理          │◄──┤  • Tailwind 样式      │   │
│  │  • SQLite 访问       │   │  • PixiJS 游戏画布    │   │
│  │  • 文件系统          │   │  • Recharts 图表      │   │
│  │  • 自动更新          │   │  • Zustand 状态       │   │
│  │  • electron-updater  │   │                      │   │
│  └──────────┬───────────┘   └──────────┬───────────┘   │
│             │                          │               │
│             └──────────┬───────────────┘               │
│                        │                               │
│                  IPC 通道（preload 暴露）                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌──────────────────────┐
              │   本地资源            │
              │  • SQLite 数据库     │
              │  • 五笔码表（内嵌）    │
              │  • 用户配置文件       │
              └──────────────────────┘
```

## 2. 技术栈

### 2.1 桌面框架
| 项 | 选型 | 版本 |
|---|---|---|
| 运行时 | Electron | 31+ |
| 构建工具 | electron-vite | 最新 |
| 进程通信 | contextBridge + IPC | - |

### 2.2 前端
| 项 | 选型 | 版本 |
|---|---|---|
| 框架 | React | 18 |
| 语言 | TypeScript | 5.x（strict 模式） |
| 构建 | Vite | 5+ |
| 样式 | Tailwind CSS | 3+ |
| UI 组件 | shadcn/ui | 最新 |
| 状态 | Zustand | 4+ |
| 路由 | React Router | 6+ |
| 图表 | Recharts | 2+ |
| 游戏 | PixiJS | 8+ |

### 2.3 后端（主进程）
| 项 | 选型 |
|---|---|
| 数据库 | better-sqlite3 |
| 自动更新 | electron-updater |
| 日志 | electron-log |
| 打包 | electron-builder |

### 2.4 测试
| 类型 | 工具 |
|---|---|
| 单元 / 集成 | Vitest |
| E2E | Playwright + @playwright/test |
| 覆盖率 | @vitest/coverage-v8 |
| 组件文档 | Storybook 8 |

### 2.5 工程化
| 项 | 选型 |
|---|---|
| 包管理 | pnpm 9 |
| Node | 20 LTS（实际：24 LTS，可降级） |
| Lint | ESLint + @typescript-eslint |
| Format | Prettier |
| Hooks | Husky + lint-staged |
| 提交规范 | Conventional Commits |
| 版本管理 | standard-version |

## 3. 模块划分

### 3.1 渲染进程模块
```
src/
├── components/      # 通用 UI 组件
├── pages/           # 页面级组件
├── lib/             # 业务逻辑
│   ├── typing/      # WPM/准确率计算
│   ├── wubi/        # 五笔码查询
│   └── ime/         # 输入法事件处理
├── db/              # SQLite 封装
├── data/            # 五笔码表 JSON
├── stores/          # Zustand stores
└── styles/          # 全局样式
```

### 3.2 主进程模块
```
electron/
├── main.ts          # 入口
├── preload.ts       # 暴露 IPC
├── ipc/             # IPC 处理
│   ├── stats.ts     # 统计相关
│   ├── db.ts        # 数据库相关
│   └── update.ts    # 自动更新
└── updater.ts       # electron-updater 配置
```

### 3.3 数据流

#### 3.3.1 练习流程
```
用户键入
   │
   ▼ (IME 事件)
React Input 组件
   │
   ▼ (onCompositionEnd 捕获最终汉字)
业务逻辑 lib/typing
   │
   ├─→ 比对目标字 ──→ 错字标记 + 弹错误提示
   │
   └─→ 累积 WPM / 准确率
        │
        ▼ (练习结束)
        IPC → 主进程
        │
        ▼
        better-sqlite3 写入 sessions / errors
```

#### 3.3.2 统计查询
```
Stats 页面
   │
   ▼
Zustand store
   │
   ▼
IPC 调用
   │
   ▼
主进程 better-sqlite3 查询
   │
   ▼
返回结果 → Recharts 渲染
```

## 4. 数据模型

详见 [`db-schema.md`](./db-schema.md)。

核心表：
- `practice_sessions` — 每次练习记录
- `session_errors` — 每次练习的错字明细
- `key_stats` — 26 键位的累计统计
- `wubi_chars` — 五笔单字码表
- `wubi_words` — 五笔词组码表
- `settings` — 用户设置

## 5. 关键技术决策

详见 [`decisions/`](../decisions/) 目录的 ADR 文档。

主要决策：
- ADR-0001：选择 React + TypeScript 技术栈
- ADR-0002：选择 Electron 而非 Tauri
- ADR-0003：CI/CD 策略（GitHub Actions + Gitee 镜像）
- ADR-0004：五笔码表硬编码到 SQLite 内置表（v0.1.1 修订：3 数据源 + 核心集标记）
