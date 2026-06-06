# Changelog

All notable changes to WubiTypeMaster will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/benber66/wubi-typemaster/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/benber66/wubi-typemaster/compare/v0.0.2...v0.1.0
[0.0.2]: https://github.com/benber66/wubi-typemaster/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/benber66/wubi-typemaster/releases/tag/v0.0.1
