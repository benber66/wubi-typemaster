# 开发者入门

> 本文档面向 WubiTypeMaster 项目的开发者。

## 1. 前置要求

| 工具 | 版本 | 用途 |
|---|---|---|
| Node.js | 20 LTS（实际可用 24） | 运行时 |
| pnpm | 9+ | 包管理 |
| Git | 2.30+ | 版本控制 |
| 五笔输入法 | 86 版 | 自我测试 |

## 2. 首次拉取

```bash
git clone https://github.com/benber66/wubi-typemaster.git
cd wubi-typemaster
pnpm install
```

## 3. 常用命令

```bash
# 启动开发环境（Electron + Vite HMR）
pnpm dev

# 类型检查
pnpm typecheck

# 代码检查
pnpm lint

# 代码格式化
pnpm format

# 单元测试 + 集成测试
pnpm test

# E2E 测试
pnpm test:e2e

# 测试覆盖率
pnpm test:coverage

# 组件文档（Storybook）
pnpm storybook

# 打包（当前平台）
pnpm build

# 打包（Windows）
pnpm build:win

# 打包（Linux）
pnpm build:linux

# 打包（全平台）
pnpm build:all
```

### 3.1 数据层命令（Phase 1）

```bash
# 从 3 个原始数据源生成 src/data/wubi86-*.json
# （仅当 raw 数据更新时才需要；仓库已带预生成产物）
pnpm build:wubi

# 灌入 SQLite（首次启动或重置时执行）
pnpm seed

# 重置数据库（删除再灌入）
pnpm seed:reset
```

> 数据源说明见 [`docs/data-sources.md`](../data-sources.md) 和 [`docs/decisions/0004-data-approach.md`](../decisions/0004-data-approach.md)。

## 4. 项目结构

```
wubi-typemaster/
├── electron/                # 主进程
├── src/
│   ├── db/                  # SQLite 客户端 + 迁移
│   │   ├── client.ts
│   │   └── migrations/
│   ├── lib/
│   │   └── wubi/            # 码表查询 API（lookup.ts）
│   ├── data/
│   │   ├── raw/             # 3 个原始数据源（带 LICENSE）
│   │   ├── wubi86-chars.json    # 生成：21,586 字
│   │   ├── wubi86-words.json    # 生成：62,323 词
│   │   └── wubi86-stats.json    # 生成：构建统计
│   └── renderer/            # 渲染进程（Phase 2+）
├── scripts/
│   ├── build-wubi-table.ts  # 3 源 → JSON
│   └── seed-db.ts           # JSON → SQLite
├── tests/
│   ├── unit/                # 单元测试
│   └── integration/         # 集成测试
├── docs/
│   ├── architecture/        # 架构
│   ├── decisions/           # ADR
│   ├── dev-guide/           # 开发者文档
│   ├── user-guide/          # 用户文档
│   ├── data-sources.md
│   └── roadmap.md
├── data/                    # Gitignored：开发期 SQLite
├── .github/                 # CI/CD
└── ...
```

详见 [`../architecture/overview.md`](../architecture/overview.md)、[`db-schema.md`](../architecture/db-schema.md) 和 [`lookup-api.md`](../architecture/lookup-api.md)。

## 5. 开发流程

1. 创建特性分支：`git checkout -b feat/xxx`
2. 编码 + 测试
3. 本地验证：`pnpm typecheck && pnpm lint && pnpm test`
4. 提交（使用 Conventional Commits）：
   ```bash
   git commit -m "feat(article): add WPM calculation"
   ```
5. 推送并创建 PR
6. CI 全绿后合并

## 6. 调试技巧

### 6.1 主进程调试
在 VSCode 中创建 `.vscode/launch.json`：
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Electron Main",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
      "args": ["."],
      "outputCapture": "std"
    }
  ]
}
```

### 6.2 渲染进程调试
- 启动 `pnpm dev` 后按 `Ctrl+Shift+I` 打开 DevTools
- React DevTools 单独安装

## 7. 测试说明

详见 [`testing.md`](./testing.md)。

## 8. 贡献指南

详见 [`contributing.md`](./contributing.md)。
