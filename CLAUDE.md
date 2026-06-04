# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A **Windows-only** Electron desktop app that replaces the OS `Alt+Tab` task switcher (modeled on Alt Tab Terminator). It enumerates all running windows that appear in Alt+Tab, groups them by owning process, lets you search them, and switches to the chosen window. Stack: Vite + Vue 3 + TypeScript + Electron 19 + `ffi-napi`.

Comments and docs in this repo are in Chinese; many trace through tricky native-interop decisions (look for `Q-A:` notes).

## Commands

```bash
npm run dev          # Full dev: renderer dev server + watch-rebuild of preload & main, auto-restarts Electron
npm run build        # Build all three packages in order (renderer → preload → main)
npm run start        # Launch Electron against an already-built dist/
npm run build:addon  # node-gyp rebuild of the C++ addon in addon/ (currently unused — see below)
```

There is **no test runner and no standalone lint script**. Type-checking happens inside each `build:*` script via `vue-tsc`/`tsc --noEmit`. ESLint + Prettier run only on commit via `.husky/pre-commit` → lint-staged. To type-check without a full build, run the relevant `vue-tsc -p packages/<pkg>/tsconfig.json --noEmit`.

### Native interop (koffi)

- Native Windows calls go through **`koffi`** (a modern C FFI). koffi ships prebuilt binaries — `npm i` needs **no** Python / Visual C++ toolchain, and there is **no** `electron-rebuild` step (koffi is N-API, ABI-stable across Electron versions).
- `koffi` must stay in `external` in `packages/main/vite.config.ts` (native module, never bundle it).
- HWND/HANDLE are declared as `uintptr_t` (numeric handles), **not** opaque pointers — the renderer needs `hwnd` as a plain number for `===` comparisons, IPC transport, and `desktopCapturer` source-id matching.
- Electron is still **^19**; the old `ffi-napi`/`ArrayBuffer` constraint is gone, but upgrading Electron is a separate, untested change.

## Architecture

Three packages under `packages/`, each its own Vite build with a distinct output target. They are **not** an npm workspace — they're wired together by Vite path aliases and TypeScript `paths`.

### `packages/main` — Electron main process (Node/CJS)
Owns the window, the system tray, global shortcuts, IPC handlers, and **all native Windows calls**. Builds to `dist/main/index.cjs` in Vite lib mode (CJS). `electron`, `koffi`, and Node builtins are marked external.

- `src/index.ts` — app bootstrap: single-instance lock, `BrowserWindow` (frameless, `skipTaskbar`, centered, hidden until `ready-to-show`), loads `http://localhost:3030` in dev or the built renderer in prod. Calls `initIPC()` + `initShortCut()` + `initAppEvent()`, then `createTray()`.
- `src/alt-tab/index.ts` — registers IPC handlers (once) and the `Alt+4` global shortcut (toggle show/hide + center + focus). `initAppEvent()` hides the window on blur and pushes `refresh-tasks` to the renderer on show.
- `src/alt-tab/system/` — the bridge between Electron and the raw Win32 layer. `windows.ts` is the core: it `EnumWindows`-iterates every top-level window (synchronously — no async race), filters to true Alt+Tab windows (`isAltTabWindows`: skips the shell window, DWM-cloaked windows, tool windows, resolves the last-active-popup ancestor chain), reads window title + owning process path, and toggles/foregrounds a window on demand. `index.ts` adds the per-process icon cache and the `desktopCapturer`-based thumbnail.
- `src/lib/window/` — `koffi` wrappers over Windows DLLs, one folder per DLL: `user32api`, `dwmapi`, `processThreadsapi`. Functions are declared with C prototype strings; HWND/HANDLE/DWORD map to `uintptr_t`/`uint32_t`. `EnumWindowsProc` (the callback proto) is exported from `user32api`.

### `packages/preload` — context bridge
`src/index.ts` exposes a `window.api` surface to the renderer via `contextBridge` (`getAllAltTabTask`, `toggleThisWindows`, `getCurrentHwnd`, `getAppThumbnail`, `hideMainApp`, `onRefresh`). Builds to `dist/preload/index.cjs`; `main/index.ts` references it at `../preload/index.cjs`. Types for `window.api` live in `packages/renderer/src/global.d.ts`.

### `packages/renderer` — Vue 3 UI (web/ESM)
Vite dev server on **port 3030**. Builds to `dist/renderer`. **No component library** — the UI is hand-built with **Tailwind v3** utilities + scoped CSS. Only `@ant-design/icons-vue` remains (for the `SearchOutlined` glyph). `vue-router` is present. The renderer window is a frameless, transparent, always-on-top overlay (set in `main/src/index.ts`), so `style.css` makes `body` transparent and locks the page to dark.

- `src/pages/alt-tab/index.vue` — the only real screen, a **command-palette / Spotlight-style** switcher. Loads tasks on mount and refreshes **event-driven** via `window.api.onRefresh` (fired when the window is shown). Filtering + process-grouping + the flat keyboard-nav list are computed inline. Keyboard model: type to filter, `↑`/`↓` move across groups (a flat `flatList` decouples nav order from visual grouping), `↵` switches, `Esc` hides. The selected window's `desktopCapturer` thumbnail shows in the right pane.

### Cross-package wiring
The renderer (and its tsconfig) aliases `main` → `../main`, so renderer code imports the shared type via `import { WindowAltTabTaskItem } from 'main/src/alt-tab/type'`. That `WindowAltTabTaskItem` shape (`appHwnd`, `appTitle`, `processName`, optional `appIcon`) is the contract that flows main → IPC → renderer.

## Data flow (the one path that matters)

1. Renderer calls `window.api.getAllAltTabTask()` (preload → IPC `get-altTab-task`).
2. Main's `getAltTabTask()` → `getAllInfo()` runs **synchronous** `EnumWindows` with a `koffi.register`-ed callback, building a local array; window titles & process names are read as **raw bytes** and decoded from **GBK** via `iconv-lite` (Win32 `*A` ANSI APIs return GBK on Chinese systems — koffi's default UTF-8 decoding would garble them, so we pass `uint8_t*` buffers and decode ourselves). PID is read as `uint32`; process path via `QueryFullProcessImageNameA` with `PROCESS_QUERY_LIMITED_INFORMATION`; the process handle is `CloseHandle`-d.
3. `getProgressTaskIcon()` fills `appIcon` per process using Electron's `app.getFileIcon()`, deduped by exe path with a persistent `Map` cache, fetched in parallel; per-process failures are caught so one bad path can't fail the whole list.
4. Renderer groups by `processName` and renders. Click → `window.api.toggleThisWindows(appHwnd)` → main `ShowWindow` + `SetForegroundWindow`. Hover → `get-app-thumbnail` → `desktopCapturer` matched by HWND.

## Status / unfinished

- **Thumbnails** use Electron's `desktopCapturer`, matched to the window by HWND (`source.id` is `window:<HWND>:0` on Windows). Minimized/occluded windows may capture blank — this is a `desktopCapturer` limitation, not a bug.
- `addon/main.cpp` is a **stub/scratch** N-API attempt at native thumbnail capture (won't compile as-is) and is **not** part of the runtime. Ignore it unless reviving native thumbnails.

## Conventions

- Don't run `git commit` / `git push` automatically — ask first (per user global rules).
- IPC thumbnail/task handlers are registered **once** in `initIPC()` — never inside a per-call function (re-registering an `ipcMain.handle` channel throws).
