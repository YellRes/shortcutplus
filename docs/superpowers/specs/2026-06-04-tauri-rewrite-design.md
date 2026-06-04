# ShortcutsPlus → Tauri 重写设计

- 日期：2026-06-04
- 状态：待用户复审
- 作者：brainstorming 协作产出

## 1. 目标与背景

把现有的 Electron + Vue3 + koffi 的 Windows alt-tab 窗口切换器，重写为 **Tauri + Rust** 项目。

**首要目标**
1. 学习地道的 Rust 语法（trait、`Result`/`?`、所有权/RAII、模式匹配、模块、条件编译）。
2. 减小安装包体积（Tauri 用系统 WebView2，不打包 Chromium，安装包预期 3-10MB，对比 Electron 的 50-150MB）。

**用户背景**：有 Node.js、Python 项目经验；Rust 为新语言。

**未来约束**：以后要做 **macOS 版本** → 架构必须从一开始就跨平台抽象。

## 2. 关键决策（brainstorming 结论）

| 维度 | 决策 | 理由 |
|---|---|---|
| 范围 | **MVP 先行**，分阶段成长 | 学习导向，最快打通端到端闭环，避免一上来卡在缩略图 |
| 前端 | **复用现有 Vue3 + Tailwind 命令面板**，只换 IPC 层 | 学习精力集中在 Rust；体积红利来自 WebView2 与前端无关 |
| 项目位置 | **新建并列项目** `shortcutplus-tauri/` | 保留 Electron 版当参照 + 兜底 + 体积对比 |
| MVP 边界 | 纯文字核心 **+ 应用图标** | 用户选择；图标抽取是有价值的 Win32 Rust 练习 |
| Windows 后端绑定 | **`windows` crate（官方）** | 学地道 Rust（RAII/Result）；跨平台双后端维护更干净；官方文档全 |
| 跨平台 | **平台抽象 `WindowManager` trait + `#[cfg]` 切换** | 把最易变的 OS 层隔离在最里层 |
| `WindowId` | **不透明类型**（Windows=HWND，macOS=CGWindowID） | 前端原样回传，不解释含义 |

## 3. 架构

### 3.1 项目结构

```
shortcutplus-tauri/
├─ src/                          # 前端（Vue3 + Tailwind，从现有 packages/renderer 移植）
│  ├─ pages/alt-tab/index.vue    # 复用现有命令面板 UI，仅改 IPC 调用
│  ├─ lib/bridge.ts              # 封装 Tauri invoke/listen，替代原 window.api
│  ├─ types.ts                   # WindowInfo 等共享类型（对齐 Rust 侧）
│  └─ main.ts / App.vue / style.css
├─ src-tauri/                    # Rust 后端（替代 Electron main + preload）
│  ├─ src/
│  │  ├─ main.rs                 # Tauri 启动：注册 commands / 快捷键 / 托盘 / 窗口事件
│  │  ├─ commands.rs             # #[tauri::command] 薄层，只转调 platform trait
│  │  └─ platform/
│  │     ├─ mod.rs               # WindowManager trait + WindowInfo/WindowId + 工厂
│  │     ├─ windows.rs           # #[cfg(windows)] windows crate 实现
│  │     └─ macos.rs             # #[cfg(target_os="macos")] 先 stub（todo!()）
│  ├─ Cargo.toml
│  └─ tauri.conf.json            # 窗口(无边框/透明/置顶/居中) + 打包配置
├─ package.json                  # 前端依赖 + @tauri-apps/cli
└─ vite.config.ts
```

### 3.2 Electron → Tauri 对照

| Electron | Tauri |
|---|---|
| `main/src/index.ts` | `src-tauri/src/main.rs` |
| `main/src/alt-tab/system/windows.ts`（koffi） | `platform/windows.rs`（windows crate） |
| `preload/index.ts`（contextBridge） | `commands.rs`（`#[tauri::command]`）+ 前端 `bridge.ts` |
| `renderer/` | `src/`（几乎原样移植） |

### 3.3 平台抽象 trait（`platform/mod.rs`）

```rust
use serde::Serialize;

#[derive(Clone, Copy, Serialize)]
pub struct WindowId(pub u64); // 不透明：Windows=HWND, macOS=CGWindowID

#[derive(Clone, Serialize)]
pub struct WindowInfo {
    pub id: WindowId,
    pub title: String,
    pub process_name: String,
}

pub trait WindowManager {
    fn list_windows(&self) -> anyhow::Result<Vec<WindowInfo>>;
    fn focus_window(&self, id: WindowId) -> anyhow::Result<()>;
    fn window_icon(&self, id: WindowId) -> anyhow::Result<Option<Vec<u8>>>; // PNG
    // P3: fn window_thumbnail(&self, id: WindowId) -> anyhow::Result<Option<Vec<u8>>>;
}

pub fn manager() -> impl WindowManager {
    #[cfg(target_os = "windows")]
    { windows::WinManager::new() }
    #[cfg(target_os = "macos")]
    { macos::MacManager::new() }
}
```

### 3.4 Windows 实现要点（`platform/windows.rs`）

- `list_windows`：`EnumWindows` + 回调内复用现有过滤逻辑（`GetShellWindow`、`DwmGetWindowAttribute` 判 cloaked、`GetWindowLongW` 去工具窗 `WS_EX_TOOLWINDOW`、`GetAncestor`/`GetLastActivePopup` 解析顶层弹窗链）。
- 标题：`GetWindowTextW`（UTF-16）→ `String::from_utf16_lossy`（**告别 GBK 解码**）。
- 进程名：`OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION)` + `QueryFullProcessImageNameW`。
- 句柄：用 `windows` crate 的 RAII（`Owned*` / `Drop` 自动关闭，**消除 CloseHandle 泄漏**）。
- 错误：每个调用 `Result` + `?` 传播；过滤自身进程（`GetCurrentProcessId`）。
- `window_icon`：`SHGetFileInfoW` → `HICON` → `GetIconInfo`/`GetDIBits` 取像素 → `image` crate 编码 PNG → `Vec<u8>`。

### 3.5 macOS 实现（`platform/macos.rs`，后续）

先 `todo!()` 占位，trait 就位。以后填 `core-graphics`（CGWindowList 枚举/截图）+ Accessibility API（聚焦）+ `objc2`。需要辅助功能 + 屏幕录制权限引导。command 层与前端**零改动**。

## 4. 数据流 / IPC

### 4.1 Commands（`commands.rs`）

```rust
#[tauri::command] fn get_windows() -> Result<Vec<WindowInfo>, String>
#[tauri::command] fn focus_window(id: u64) -> Result<(), String>
#[tauri::command] fn get_window_icon(id: u64) -> Result<Option<String>, String> // base64 PNG data URL
// P3: fn get_window_thumbnail(id: u64) -> Result<Option<String>, String>
```

### 4.2 事件

`"refresh"`：窗口被快捷键唤起(show)时由 Rust emit，前端据此重新拉列表（替代原 30s 轮询/onRefresh）。

### 4.3 前端桥（`src/lib/bridge.ts`）

```ts
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'

export const getWindows    = () => invoke<WindowInfo[]>('get_windows')
export const focusWindow   = (id: number) => invoke('focus_window', { id })
export const getWindowIcon = (id: number) => invoke<string | null>('get_window_icon', { id })
export const hideApp       = () => getCurrentWindow().hide()
export const onRefresh     = (cb: () => void) => listen('refresh', cb) // 返回 unlisten
```

现有 `index.vue` 映射：`getAllAltTabTask→getWindows`、`toggleThisWindows→focusWindow`、`getAppThumbnail→getWindowIcon`（P3 切缩略图）、`hideMainApp→hideApp`、`onRefresh` 同名替换。**UI/键盘逻辑不动。**

### 4.4 窗口配置（`tauri.conf.json`）

`decorations:false, transparent:true, alwaysOnTop:true, skipTaskbar:true, center:true, width:760, height:520, visible:false, resizable:false`。

## 5. 分阶段拆解

| 阶段 | 交付 | Rust 概念 |
|---|---|---|
| **P1 / MVP** | scaffold；移植 Vue UI + bridge.ts；trait + Windows 实现 `list_windows`/`focus_window`/`window_icon`；3 个 command；启动即显示、键盘/点击切换 | cargo/模块、`trait`、`Result`/`?`、`windows` crate、`EnumWindows` 回调闭包、`unsafe`、UTF-16↔String、RAII 句柄、`SHGetFileInfo`→PNG、`#[tauri::command]`+serde |
| **P2** | 全局快捷键 Alt+4（toggle）、托盘、单实例、失焦隐藏、`refresh` 事件 | Tauri 插件、`State`/`AppHandle`、事件 emit |
| **P3** | 缩略图（Windows：`windows-capture`/WGC 优先，退路 `PrintWindow`+`PW_RENDERFULLCONTENT`）+ 缓存兜底图标 | `Mutex<HashMap>` 共享状态、`tauri::State`、错误分层 |
| **P4** | `tauri build` 出 MSI/NSIS，量体积 vs Electron | bundler、release profile |
| **macOS（后续）** | `platform/macos.rs`：core-graphics 枚举、AX 聚焦、ScreenCaptureKit 截图；权限引导；`.dmg` | `objc2`/FFI 互操作、平台权限模型 |

## 6. 测试与验证

- Rust 纯逻辑单测：把"是否 alt-tab 窗口"判定抽成不直接调 OS 的纯函数，表驱动 `#[test]`；`WindowInfo` 映射同理。
- 前端纯函数（过滤/分组/拍平）可选 vitest。
- 手动冒烟为主力：每阶段真机 Windows 跑核心路径。
- 环境限制：每阶段产物需本地 `cargo` / `pnpm tauri dev` 跑通后再进下一阶段。

## 7. 已知风险

- P3 WGC 复杂度高时退回 `PrintWindow`（Rust 侧有 `windows-capture` crate 现成封装）。
- 图标 HICON→PNG 的 alpha 通道处理需小心。
- macOS 权限弹窗 UX 是后续独立课题。
- 全程无法在助手环境编译验证，依赖用户本地逐阶段跑通。

## 8. 非目标（YAGNI）

- 不在 MVP 做缩略图、托盘、快捷键（分别在 P2/P3）。
- 不重写前端框架（复用 Vue）。
- 不在本次处理 macOS 实现（仅留 trait 占位）。
- 不引入 CI/打包分发以外的工程基建。
