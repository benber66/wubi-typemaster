---
name: gitee-mirror
description: "Use when Gitee mirror sync fails: yanglbme/gitee-repo-mirror action broken (repository not found), need to push code + tags to Gitee, or sync release assets to Gitee. Covers .github/workflows/release.yml, gitee-repo-mirror, git push --mirror."
---

# Gitee 镜像同步

## Context

`yanglbme/gitee-repo-mirror@main` 已被删除，报错：
`Unable to resolve action yanglbme/gitee-repo-mirror, repository not found`

## 标准修复

用 `git push --mirror` 配合 Gitee token：

```yaml
mirror-to-gitee:
  name: Mirror to Gitee
  needs: github-release
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0

    - name: Mirror to Gitee
      run: |
        git remote add gitee https://<user>:${{ secrets.GITEE_TOKEN }}@gitee.com/<user>/<repo>.git
        git push gitee --force --mirror
        git remote remove gitee

    - name: Sync Release assets to Gitee
      run: node scripts/sync-gitee-release.mjs
      env:
        GITEE_TOKEN: ${{ secrets.GITEE_TOKEN }}
        TAG_NAME: ${{ github.ref_name }}
```

## 前提条件

- Gitee 已创建同名仓库（`gitee.com/<user>/<repo>`）
- GitHub Secrets 配置了 `GITEE_TOKEN`（Gitee 个人访问令牌，需要 `repo` 和 `admin:repo_hook` 权限）

## 本地手动推送

```bash
git remote add gitee https://<user>@gitee.com/<user>/<repo>.git
git push gitee --all
git push gitee --tags
# 强制覆盖已有 tag:
git push --force gitee vX.X.X
```

## 验证

- Gitee 仓库 commit 和 tag 与 GitHub 一致
- Release 资产在 Gitee Releases 页面可见（需 `sync-gitee-release.mjs` 正常工作）
