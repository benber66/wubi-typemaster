# WubiTypeMaster

> 跨平台五笔字型打字练习软件 — 复刻经典 TypeMaster 体验，专为五笔 86 进阶者打造

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux-blue)](#)
[![Wubi 86](https://img.shields.io/badge/五笔-86%20版-green)](#)

## ✨ 特性

- 📝 **文章跟打** — 完整文章段落练习，模拟真实场景
- 👾 **Word Invaders** — 趣味游戏化单字 / 词组练习
- 🫧 **Bubble** — 词组专项训练
- 🎯 **KeyDrill** — 基于个人弱键统计的针对性训练
- 📊 **完整统计** — 趋势图、26 键位热力图、错字本
- 💡 **智能提示** — 错误时显示五笔编码 + 词组编码
- 🎨 **个性化** — Light / Dark 主题 + 自定义强调色

## 📥 下载

前往 [Releases 页面](https://github.com/benber66/wubi-typemaster/releases) 下载对应平台安装包。

| 平台    | 安装包                                   |
| ------- | ---------------------------------------- |
| Windows | `WubiTypeMaster-Setup-x.y.z.exe`         |
| Linux   | `WubiTypeMaster-x.y.z.AppImage` / `.deb` |

国内用户可从 [Gitee Releases](https://gitee.com/benber66/wubi-typemaster/releases) 下载。

## 🚀 快速开始

1. 安装并启用五笔 86 版输入法（系统自带即可）
2. 下载并安装 WubiTypeMaster
3. 启动应用，选择练习模式
4. 用五笔输入目标文字，开始训练

详细使用：[docs/user-guide/quickstart.md](./docs/user-guide/quickstart.md)

## 🛠️ 开发

```bash
git clone https://github.com/benber66/wubi-typemaster.git
cd wubi-typemaster
pnpm install
pnpm dev
```

详见 [开发者入门](./docs/dev-guide/getting-started.md)

## 📋 项目状态

当前版本：**v0.1.1**（Phase 1 数据层完成）

| Phase | 内容                                        | 状态      |
| ----- | ------------------------------------------- | --------- |
| 0     | 仓库骨架 + CI + 文档                        | ✅ v0.0.2 |
| 1     | 五笔码表 + 核心集标记 + SQLite + Lookup API | ✅ v0.1.1 |
| 2     | 设置/主题/虚拟键盘                          | ⏳ 进行中 |
| 3     | 4 模式练习核心                              | ⏳        |
| 4     | 历史/统计                                   | ⏳        |
| 5     | 打包 + 自动更新                             | ⏳        |

详细路线图：[docs/roadmap.md](./docs/roadmap.md)

### 数据规模

- 21,586 单字（核心 3,500）+ 62,323 词组（核心 7,301）
- 数据源：rime-wubi86-jidian（Apache-2.0）+ hanziDB（MIT）+ SUBTLEX-CH（学术）
- 详见 [docs/data-sources.md](./docs/data-sources.md)

## 🤝 贡献

欢迎贡献！详见 [贡献指南](./docs/dev-guide/contributing.md)。

## 📄 许可证

[MIT](./LICENSE) © 2026 benber66

## 🙏 致谢

- 灵感来源：[TypeMaster Typing Tutor](http://www.typefaster.com/)
- 字体：等宽字体（系统自带）
- 图标：待定
