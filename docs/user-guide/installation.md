# 用户安装

> 本文档面向 WubiTypeMaster 的最终用户。

## 系统要求

| 系统    | 最低版本                      |
| ------- | ----------------------------- |
| Windows | Windows 10                    |
| Linux   | Ubuntu 22.04 / 其他主流发行版 |
| macOS   | 暂不提供（开发中）            |

## Windows 安装

### 方式一：NSIS 安装包（推荐）

1. 前往 [Releases 页面](https://github.com/benber66/wubi-typemaster/releases)
2. 下载 `WubiTypeMaster-Setup-x.y.z.exe`
3. 双击运行安装程序
4. 按提示完成安装

### 方式二：便携版

1. 下载 `WubiTypeMaster-x.y.z-portable.exe`
2. 双击即可运行，无需安装

> ⚠️ Windows 可能提示"未知发布者"，因为我们未购买代码签名证书。点击"仍要运行"即可。

## Linux 安装

### 方式一：AppImage（推荐）

```bash
wget https://github.com/benber66/wubi-typemaster/releases/download/v0.1.0/WubiTypeMaster-0.1.0.AppImage
chmod +x WubiTypeMaster-0.1.0.AppImage
./WubiTypeMaster-0.1.0.AppImage
```

### 方式二：Debian / Ubuntu

```bash
wget https://github.com/benber66/wubi-typemaster/releases/download/v0.1.0/wubi-typemaster_0.1.0_amd64.deb
sudo dpkg -i wubi-typemaster_0.1.0_amd64.deb
```

## 五笔输入法准备

确保系统已安装并启用了**五笔 86 版输入法**：

| 平台    | 推荐方案                       |
| ------- | ------------------------------ |
| Windows | 极点五笔 / 海峰五笔 / 小鸭五笔 |
| Linux   | ibus-rime + 五笔 86 方案       |
| macOS   | （暂不支持）                   |

## 遇到问题？

请在 [GitHub Issues](https://github.com/benber66/wubi-typemaster/issues) 搜索或创建新问题。
