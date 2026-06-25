# AltSwitch

> 一个快速、键盘优先的 Windows `Alt+Tab` 替代品。类 Spotlight 的窗口切换器：按所属应用分组、可搜索、瞬间切换。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[English](README.md) · [中文](README.zh-CN.md)

<!-- TODO: 在 docs/screenshot.png 放一张截图或 GIF，会显示在这里 -->
<!-- <p align="center"><img src="docs/screenshot.png" alt="AltSwitch 截图" width="720"></p> -->

## 特性

- **命令面板 UI** —— 唤起居中浮层，输入即筛选，全程键盘操作。
- **按应用分组** —— 窗口按所属进程分组，再多窗口也清晰。
- **实时缩略图** —— 预览选中窗口；最小化窗口回退到「最后一帧」缓存，再没有则回退应用图标。
- **键盘模型** —— `↑`/`↓` 移动，`↵` 切换，`Esc` 关闭，输入任意字符筛选。
- **轻量原生层** —— 窗口枚举/切换通过 [koffi](https://koffi.dev/) 调 Win32（安装无需 Python / Visual C++ 工具链）。

## 运行要求

- Windows 10 / 11（x64）

## 安装

从 [Releases 页面](https://github.com/YellRes/shortcutplus/releases) 下载最新版本：

- **安装程序** —— `AltSwitch-Setup-x.y.z.exe`（NSIS，可选安装路径、自动建快捷方式）
- **便携版** —— `AltSwitch-x.y.z-win.zip`（解压即用，免安装）

## 使用

1. 按 **`Alt+4`** 唤起切换器（再按一次关闭）。
2. 输入关键字筛选打开的窗口。
3. 用 **`↑` / `↓`** 跨分组移动选择。
4. 按 **`↵`** 切换到选中窗口，或直接点击。
5. 按 **`Esc`**（或点击别处）关闭。

## 从源码构建

```bash
pnpm install        # koffi 自带预编译二进制，无需 Python / VC++
pnpm dev            # 开发模式（渲染层 dev server + 自动重建 main/preload）
pnpm dist           # 构建 Windows 安装包 + 便携 zip 到 release/
```

## 技术栈

- **Electron 19** + **Vue 3** + **TypeScript** + **Vite**
- **Tailwind CSS** 做 UI（无组件库）
- **koffi** 调 Win32；**desktopCapturer** 取窗口缩略图

## 工作原理

主进程用 `EnumWindows` 枚举真正的 `Alt+Tab` 窗口（过滤掉 shell 窗口、DWM 遮盖窗口、工具窗），通过 Win32 读取每个窗口的标题与所属进程，经 IPC 暴露给 Vue UI。切换调用 `ShowWindow` + `SetForegroundWindow`。缩略图用 Electron 的 `desktopCapturer`，按 `HWND` 匹配窗口，并带缓存，使最小化窗口仍能显示最后一帧。

## 贡献

欢迎 issue 与 PR。当前仅支持 Windows；跨平台（macOS）重写在另行探索中。请保持改动聚焦，提 PR 前先 `pnpm dev` 验证。

## 许可

[MIT](LICENSE)。灵感来自 [Alt Tab Terminator](https://www.ntwind.com/software/alttabter.html)。
