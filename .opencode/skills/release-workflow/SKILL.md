---
name: release-workflow
description: 'Use when GitHub Release workflow fails: softprops/action-gh-release errors, gh release create fails, win-unpacked files uploaded as assets, release tag needs recreation. Covers release.yml, electron-builder artifacts, gh CLI release creation.'
---

# Release Workflow 排错

## Context

当 GitHub Release 自动化发布失败时的常见故障模式。

## 快速诊断

| 症状                                    | 原因                                   | 修复                            |
| --------------------------------------- | -------------------------------------- | ------------------------------- |
| `softprops/action-gh-release` Not Found | action bug 或 tag 冲突                 | 改用 `gh release create` 两步法 |
| 发布包含 `.pak` `.js` `.dll` 等文件     | `**/*` 通配符上传了整个 `win-unpacked` | 用 `find -name` 白名单过滤      |
| `gh release create` exit code 1         | tag 已被删除但 GitHub 侧有缓存         | 等待 1 分钟后重建 tag           |
| 发布后 asset 只有 2 个                  | 只上传了源码 zip                       | 需要上传 installer 文件         |

## 标准修复

### 1. 用 `gh release create + gh release upload` 替代 `softprops/action-gh-release@v2`

```yaml
- name: Create GitHub Release
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  shell: bash
  run: |
    set -euo pipefail
    gh release create "${{ github.ref_name }}" \
      --title "${{ github.ref_name }}" \
      --generate-notes \
      $PRERELEASE_FLAG

    find dist-artifacts -type f \( \
      -name '*.exe' -o -name '*.exe.blockmap' -o \
      -name '*.nupkg' -o -name 'RELEASES' -o \
      -name 'app-update.yml' -o -name 'latest.yml' \
    \) -print0 | while IFS= read -r -d '' f; do
      gh release upload "${{ github.ref_name }}" "$f" --clobber
    done
```

### 2. 资产过滤白名单

只上传 installer 文件，排除 `win-unpacked/`、`pak/`、`locales/` 等目录。

### 3. 重建 tag 触发重新发布

```bash
git push origin --delete vX.X.X
git tag -d vX.X.X
git tag vX.X.X HEAD
git push origin main vX.X.X
```

### 4. Job 权限

GitHub Release job 必须声明 `permissions: contents: write`。

## electron-builder 输出结构

```
release/<version>/
  ├── Product-<version>-setup.exe      # NSIS installer
  ├── Product-<version>-setup.exe.blockmap
  ├── latest.yml                       # auto-update feed
  └── win-unpacked/                    # ← 不要上传
```

## 验证

- 资产列表中只有 installer 文件（不应有 `.pak` `.js` `.dll` `.asar`）
- Release notes 自动生成
- `gh release view` 可查看已发布内容
