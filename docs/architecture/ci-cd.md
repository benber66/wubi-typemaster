# CI/CD 方案

> 版本：v0.0.1

## 1. 仓库拓扑

```
GitHub (主仓)
   ├── benber66/wubi-typemaster
   │
   ├─→ push mirror → Gitee
   │   └── benber66/wubi-typemaster
   │
   └─→ GitHub Actions 跑 CI/CD
        └── 产物发布到 GitHub Releases
            └── 同步到 Gitee Releases
```

**为什么不直接用 Gitee Go？**

- Gitee Go 不支持 macOS runner，跨平台构建矩阵受限
- GitHub Actions 生态成熟，Electron 跨平台构建教程丰富
- 选择 **主仓 GitHub 跑 CI + 镜像推 Gitee** 的方案

## 2. 工作流设计

| 文件          | 触发                 | 任务                                    | 输出                   |
| ------------- | -------------------- | --------------------------------------- | ---------------------- |
| `ci.yml`      | PR / push main       | lint + typecheck + 单元 + 集成 + 覆盖率 | Codecov 报告           |
| `e2e.yml`     | PR (需 label) / main | Playwright E2E (Win + Ubuntu 矩阵)      | 测试报告 + 截图        |
| `build.yml`   | push main            | electron-builder 跨平台构建             | artifacts              |
| `release.yml` | push tag `v*`        | 发布 GitHub Release → 同步 Gitee        | GitHub + Gitee Release |
| `codeql.yml`  | 每周 / PR            | 代码安全扫描                            | 安全告警               |

## 3. 国内访问优化

CI 步骤中设置环境变量：

```yaml
env:
  npm_config_registry: https://registry.npmmirror.com
  ELECTRON_MIRROR: https://npmmirror.com/mirrors/electron/
  ELECTRON_BUILDER_BINARIES_MIRROR: https://npmmirror.com/mirrors/electron-builder-binaries/
```

## 4. 缓存策略

```yaml
- uses: actions/setup-node@v4
  with:
    node-version-file: '.nvmrc'
    cache: 'pnpm'

- uses: actions/cache@v4
  with:
    path: |
      ~/.cache/electron
      ~/.cache/electron-builder
    key: ${{ runner.os }}-electron-${{ hashFiles('**/package.json') }}
```

## 5. Gitee 同步

### 5.1 仓库代码同步

使用 `yanglbme/gitee-repo-mirror` action，定时或 push 触发：

```yaml
- name: Mirror to Gitee
  uses: yanglbme/gitee-repo-mirror@main
  with:
    src: 'https://github.com/benber66/wubi-typemaster'
    dst: 'https://gitee.com/benber66/wubi-typemaster'
    dst_key: ${{ secrets.GITEE_PRIVATE_KEY }}
    force: false
```

### 5.2 Release 产物同步

自定义脚本 `scripts/sync-gitee-release.mjs`：

- 调用 Gitee OpenAPI 创建 Release
- 上传 GitHub Release 中的所有 assets
- 需要 Gitee Access Token（在 GitHub Secrets 中配置）

## 6. 自动更新实现

### 6.1 electron-updater 配置

```typescript
// electron/updater.ts
import { autoUpdater } from 'electron-updater';

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

// 默认 GitHub feed
autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'benber66',
  repo: 'wubi-typemaster',
});
```

### 6.2 双 Feed 切换

在设置页提供切换选项：

- **GitHub Releases**（默认，海外用户）
- **Gitee Releases**（国内用户，访问更快）

```typescript
function switchFeed(source: 'github' | 'gitee') {
  if (source === 'gitee') {
    autoUpdater.setFeedURL({
      provider: 'generic',
      url: 'https://gitee.com/benber66/wubi-typemaster/releases/latest/download/',
    });
  }
}
```

## 7. 必需的 GitHub Secrets

| Secret                 | 用途                 | 必需           |
| ---------------------- | -------------------- | -------------- |
| `GITEE_TOKEN`          | Gitee OpenAPI 认证   | ✅             |
| `GITEE_PRIVATE_KEY`    | Gitee 仓库 SSH 同步  | ✅             |
| `CODECOV_TOKEN`        | 覆盖率上报           | ❌（可选）     |
| `WIN_CSC_LINK`         | Windows 代码签名证书 | ❌（MVP 不做） |
| `WIN_CSC_KEY_PASSWORD` | 签名证书密码         | ❌（MVP 不做） |

## 8. 版本发布流程

```
本地开发
   │
   ▼ 提交 PR → main
   │
   ▼ merge 触发 ci.yml + e2e.yml + build.yml
   │
   ▼ 本地打 tag
   git tag v0.0.1
   git push --tags
   │
   ▼ release.yml 自动：
     1. 跑测试
     2. 跨平台构建
     3. 生成 changelog
     4. 发 GitHub Release
     5. 同步 Gitee Release
     6. 触发 electron-updater feed 更新
```

## 9. 未来优化

- 接入 Renovate / Dependabot 自动依赖更新（已规划开启）
- 增加 nightly 构建（`main` 分支每日构建）
- 接入 Codecov 可视化覆盖率
- 增加 codeql.yml 安全扫描
