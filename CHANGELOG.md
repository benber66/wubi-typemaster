# Changelog

All notable changes to WubiTypeMaster will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/benber66/wubi-typemaster/compare/v0.0.2...HEAD
[0.0.2]: https://github.com/benber66/wubi-typemaster/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/benber66/wubi-typemaster/releases/tag/v0.0.1
