# ADR-0003：CI/CD 策略

> 状态：已接受
> 日期：2026-06-06

## 背景

需要为跨平台桌面应用设计 CI/CD 流程。要求：

- 跨平台构建（Windows + Linux）
- 自动化测试
- 自动化发布
- 国内用户友好
- 个人项目，成本敏感

## 备选方案

### 方案 A：仅 GitHub Actions

- ✅ 简单
- ❌ 国内访问慢
- ❌ 国内用户下载/更新慢

### 方案 B：仅 Gitee Go

- ✅ 国内访问快
- ❌ 不支持 macOS runner（暂不需要）
- ❌ 功能受限

### 方案 C：GitHub Actions + Gitee 镜像（采纳）

- ✅ 主仓 GitHub 跑 CI（功能完整）
- ✅ Gitee 镜像提供国内访问
- ✅ Release 产物同步到 Gitee
- ✅ 自动更新支持双 feed 切换
- ❌ 配置稍复杂

## 决策

选择 **方案 C：GitHub Actions + Gitee 镜像**。

## 详细策略

### 仓库拓扑

- **GitHub**：`benber66/wubi-typemaster`（主仓 + CI 跑点）
- **Gitee**：`benber66/wubi-typemaster`（镜像 + Release 同步）

### 工作流

- `ci.yml`：PR / push main 触发，跑 lint + typecheck + 单元 + 集成
- `e2e.yml`：PR 触发，跑 Playwright E2E
- `build.yml`：push main 触发，跨平台构建
- `release.yml`：push tag `v*` 触发，发布 Release 并同步 Gitee
- `codeql.yml`：每周 / PR 触发，代码安全扫描

### 国内优化

- npm 使用 `npmmirror` 镜像
- Electron 二进制使用 `npmmirror` 镜像
- 设置中允许切换自动更新源（GitHub ↔ Gitee）

## 成本

- **0 元**（GitHub Free + Gitee Free）
- 代码签名：暂不做（自用，避免证书费用）

## 接受的成本

- 需要配置 Gitee Token（一次性）
- 需要维护同步脚本

## 何时重新评估

- 若发布到 Mac App Store（需 Apple Developer 账号）
- 若需要 Windows 代码签名（购买证书）
