---
name: ci-matrix-decouple
description: "Use when a multi-platform CI matrix has a pre-existing failure on one OS that blocks another OS's job (e.g. linux electron-builder fails but Windows release must proceed). Covers .github/workflows/{release,build}.yml, continue-on-error, needs dependency, job decoupling."
---

# CICD 矩阵解耦

## Context

当 CI 矩阵包含多个平台（`windows-latest`、`ubuntu-latest`），其中一个平台存在预存失败，不应阻塞其他平台的关键路径（如发布）。

问题：矩阵作业默认任一平台失败 → 整个 workflow 标记为 failure，后续依赖 job 被跳过。

## 标准修复

### 1. 拆分为独立 job（不用 matrix）

```yaml
jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - run: pnpm build && pnpm build:win

  build-ubuntu:
    runs-on: ubuntu-latest
    continue-on-error: true # 失败不阻塞
    steps:
      - run: pnpm build && pnpm build:linux
```

### 2. 后续 job 只依赖健康的平台

```yaml
github-release:
  needs: [build-windows] # 不依赖 build-ubuntu
```

### 3. Linux 构建依赖安装

```yaml
- name: Install Linux build dependencies
  run: |
    sudo apt-get update -qq
    sudo apt-get install -y -qq dpkg-dev fakeroot libfuse2
```

## 注意事项

- Workflow 整体仍可能显示为 "failure"（因 ubuntu job 失败），但关键发布已完成
- 查看 job 级别状态确认具体成功/失败
- `continue-on-error: true` 的 job 失败后不会触发通知/告警

## 验证

- `build-windows` ✅ + `build-ubuntu` ❌ → `github-release` 仍正常运行
- 确认发布 asset 完整
