<script setup lang="ts">
  import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
  import { WindowAltTabTaskItem } from 'main/src/alt-tab/type'
  import { SearchOutlined, CloseOutlined } from '@ant-design/icons-vue'
  import { pinyin } from 'pinyin-pro'

  const inputVal = ref<string>('')
  const allTabsArr = ref<WindowAltTabTaskItem[]>([])
  const loading = ref(false)
  const selectedIndex = ref(0)
  const previewSrc = ref<string>('')

  const searchRef = ref<HTMLInputElement>()
  const listRef = ref<HTMLElement>()

  // ── 本地别名：按窗口 hwnd 存，只在 AltSwitch 显示，不改真实标题 ──
  // 存 localStorage；窗口活着期间有效，目标程序重启换 hwnd 后自然失效。
  const ALIAS_KEY = 'altswitch_window_aliases'
  const loadAliases = (): Record<string, string> => {
    try {
      return JSON.parse(localStorage.getItem(ALIAS_KEY) || '{}')
    } catch {
      return {}
    }
  }
  const aliases = ref<Record<string, string>>(loadAliases())
  const saveAliases = () => localStorage.setItem(ALIAS_KEY, JSON.stringify(aliases.value))
  // 列表/预览/搜索统一用这个：有别名显示别名，否则显示真实标题
  const displayName = (item: WindowAltTabTaskItem) =>
    aliases.value[String(item.appHwnd)] || item.appTitle

  // 子序列模糊匹配：query 的字符按顺序出现在 target 中即命中（如 vsc → Visual Studio Code）
  const isSubsequence = (q: string, t: string) => {
    let i = 0
    for (let j = 0; j < t.length && i < q.length; j++) {
      if (t[j] === q[i]) i++
    }
    return i === q.length
  }
  // 标题转拼音首字母串：中文取首字母，非中文原样保留（如 "微信2.0" → "wx2.0"）
  const toInitials = (s: string) =>
    pinyin(s, { pattern: 'first', toneType: 'none', nonZh: 'consecutive' }).toLowerCase()

  // 匹配：显示名（子串或子序列）或 其拼音首字母（子串或子序列）任一命中
  const matches = (rawQuery: string, item: WindowAltTabTaskItem) => {
    const q = rawQuery.trim().toLowerCase()
    if (!q) return true
    const name = displayName(item).toLowerCase()
    if (name.includes(q) || isSubsequence(q, name)) return true
    const initials = toInitials(displayName(item))
    return initials.includes(q) || isSubsequence(q, initials)
  }

  // 过滤（模糊 + 拼音首字母；别名也能被搜到）
  const filtered = computed(() => allTabsArr.value.filter((t) => matches(inputVal.value, t)))

  // 按进程分组用于展示
  const grouped = computed<Record<string, WindowAltTabTaskItem[]>>(() => {
    const map: Record<string, WindowAltTabTaskItem[]> = {}
    for (const it of filtered.value) {
      ;(map[it.processName] ||= []).push(it)
    }
    return map
  })

  // 分组顺序拍平成一维列表，供键盘上下导航（视觉分组 ≠ 导航顺序）
  const flatList = computed<WindowAltTabTaskItem[]>(() => Object.values(grouped.value).flat())
  const selected = computed<WindowAltTabTaskItem | undefined>(() => flatList.value[selectedIndex.value])

  // exe 全路径 → 显示用进程名（去目录、去 .exe 后缀）
  const exeName = (p: string) => p.split('\\').pop()?.replace(/\.exe$/i, '') || p
  const indexOfItem = (item: WindowAltTabTaskItem) => flatList.value.indexOf(item)

  // MRU 默认选中：getAllAltTabTask 返回的是 Z 序（[0]=当前窗口，[1]=上一个窗口）。
  // 默认选中「上一个窗口」，于是 Alt+4 → 回车 就能像系统 Alt+Tab 一样快速回切。
  const selectDefault = () => {
    const prev = allTabsArr.value[1] ?? allTabsArr.value[0]
    const idx = prev ? flatList.value.indexOf(prev) : -1
    selectedIndex.value = idx >= 0 ? idx : 0
  }

  const getAllTabs = async () => {
    loading.value = true
    try {
      allTabsArr.value = await window.api.getAllAltTabTask()
      selectDefault()
    } catch (e) {
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  const focusSearch = () => nextTick(() => searchRef.value?.focus())
  const reset = () => {
    inputVal.value = ''
    selectedIndex.value = 0
  }

  // 事件驱动：窗口被唤起(show)时刷新并重置（取代 30s 轮询）
  let stopRefresh: (() => void) | undefined
  onMounted(() => {
    getAllTabs()
    focusSearch()
    stopRefresh = window.api.onRefresh(() => {
      reset()
      getAllTabs()
      focusSearch()
    })
  })
  onBeforeUnmount(() => stopRefresh?.())

  // 列表变化时夹紧选中项并刷新预览
  watch(flatList, () => {
    if (selectedIndex.value >= flatList.value.length) {
      selectedIndex.value = Math.max(0, flatList.value.length - 1)
    }
    updatePreview()
  })
  watch(selectedIndex, () => {
    scrollSelectedIntoView()
    updatePreview()
  })

  // 取选中窗口缩略图；用 token 防止快速切换时的竞态（旧请求覆盖新选中）
  let previewToken = 0
  const updatePreview = async () => {
    const item = selected.value
    if (!item) {
      previewSrc.value = ''
      return
    }
    const token = ++previewToken
    try {
      const src = await window.api.getAppThumbnail(item.appHwnd)
      if (token === previewToken) previewSrc.value = src
    } catch {
      if (token === previewToken) previewSrc.value = ''
    }
  }

  const scrollSelectedIntoView = () =>
    nextTick(() => {
      const el = listRef.value?.querySelector('[data-selected="true"]') as HTMLElement | null
      el?.scrollIntoView({ block: 'nearest' })
    })

  const move = (delta: number) => {
    const n = flatList.value.length
    if (!n) return
    selectedIndex.value = (selectedIndex.value + delta + n) % n
  }

  const switchTo = (item: WindowAltTabTaskItem) => {
    window.api.toggleThisWindows(item.appHwnd)
    window.api.hideMainApp()
  }

  /**
   * 关闭目标窗口（WM_CLOSE，优雅关闭）。乐观地先从本地列表移除做即时反馈，
   * 由于 WM_CLOSE 是异步的，稍后重新拉取列表对账。
   */
  const closeWindow = (item: WindowAltTabTaskItem) => {
    window.api.closeWindow(item.appHwnd)
    allTabsArr.value = allTabsArr.value.filter((t) => t.appHwnd !== item.appHwnd)
    setTimeout(getAllTabs, 300)
  }

  // ── 右键菜单 + 重命名 ──
  const menu = ref<{ x: number; y: number; item: WindowAltTabTaskItem } | null>(null)
  const openMenu = (e: MouseEvent, item: WindowAltTabTaskItem) => {
    e.preventDefault()
    selectedIndex.value = indexOfItem(item)
    menu.value = { x: e.clientX, y: e.clientY, item }
  }
  const closeMenu = () => {
    menu.value = null
  }

  const editingHwnd = ref<number | null>(null)
  const editValue = ref('')
  const startRename = (item: WindowAltTabTaskItem) => {
    editingHwnd.value = item.appHwnd
    editValue.value = displayName(item)
    closeMenu()
    nextTick(() => {
      const el = listRef.value?.querySelector('.rename-input') as HTMLInputElement | null
      el?.focus()
      el?.select()
    })
  }
  const commitRename = () => {
    if (editingHwnd.value === null) return
    const key = String(editingHwnd.value)
    const v = editValue.value.trim()
    if (v) aliases.value[key] = v
    else delete aliases.value[key] // 清空 → 恢复真实标题
    saveAliases()
    editingHwnd.value = null
  }
  const cancelRename = () => {
    editingHwnd.value = null
  }
  const clearAlias = (item: WindowAltTabTaskItem) => {
    delete aliases.value[String(item.appHwnd)]
    saveAliases()
    closeMenu()
  }

  // 键盘模型：↑↓ 选择 · ↵ 切换 · Esc 关闭（输入框常驻聚焦，方向键需阻止默认行为）
  const onKeydown = (e: KeyboardEvent) => {
    if (editingHwnd.value !== null) return // 重命名中：交给输入框自己处理
    if (menu.value) {
      // 菜单打开时 Esc 只关菜单，不隐藏窗口
      if (e.key === 'Escape') {
        e.preventDefault()
        closeMenu()
      }
      return
    }
    // Ctrl + 1~9 直达第 N 个窗口（用 Ctrl 修饰，避免与在搜索框输入数字、以及 Alt+4 冲突）
    if (e.ctrlKey && e.key >= '1' && e.key <= '9') {
      e.preventDefault()
      const item = flatList.value[Number(e.key) - 1]
      if (item) switchTo(item)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      move(1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      move(-1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selected.value) switchTo(selected.value)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      window.api.hideMainApp()
    }
  }
  onMounted(() => window.addEventListener('keydown', onKeydown))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div
    class="palette-enter flex h-[480px] max-h-[100vh] w-[720px] max-w-[100vw] flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/95 text-zinc-100 shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
  >
    <!-- 搜索 -->
    <div class="flex h-14 items-center gap-3 border-b border-white/10 px-4">
      <search-outlined class="text-lg text-zinc-500" />
      <input
        ref="searchRef"
        v-model="inputVal"
        placeholder="搜索运行中的窗口"
        class="flex-1 bg-transparent text-base text-zinc-100 outline-none placeholder:text-zinc-600"
      />
      <span class="font-mono text-[11px] text-zinc-600">{{ flatList.length }}</span>
    </div>

    <!-- 主体：左列表 / 右预览 -->
    <div class="flex min-h-0 flex-1">
      <!-- 列表 -->
      <div ref="listRef" class="list-scroll w-1/2 overflow-y-auto py-2">
        <!-- loading 骨架 -->
        <div v-if="loading" class="space-y-2 px-3 pt-1">
          <div v-for="i in 5" :key="i" class="h-8 animate-pulse rounded bg-white/[0.05]" />
        </div>

        <!-- 空状态 -->
        <div
          v-else-if="!flatList.length"
          class="flex h-full flex-col items-center justify-center gap-2 text-zinc-600"
        >
          <search-outlined class="text-2xl" />
          <span class="text-sm">没有匹配的窗口</span>
        </div>

        <!-- 分组列表（v-else 放在包裹 div 上，避免 v-else 与 v-for 同节点的优先级陷阱） -->
        <div v-else>
          <template v-for="(items, proc) in grouped" :key="proc">
            <div class="px-4 pb-1 pt-3 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
              {{ exeName(proc) }}
            </div>
            <div
              v-for="item in items"
              :key="item.appHwnd"
              role="button"
              :data-selected="indexOfItem(item) === selectedIndex"
              class="group flex w-full cursor-pointer items-center gap-3 border-l-2 px-4 py-2 text-left text-sm transition-colors"
              :class="
                indexOfItem(item) === selectedIndex
                  ? 'border-blue-400 bg-blue-500/15 text-white'
                  : 'border-transparent text-zinc-300 hover:bg-white/[0.04]'
              "
              @mouseenter="selectedIndex = indexOfItem(item)"
              @click="switchTo(item)"
              @contextmenu="openMenu($event, item)"
            >
              <img
                v-if="item.appIcon"
                :src="item.appIcon"
                class="h-5 w-5 flex-shrink-0 rounded-[4px]"
                alt=""
              />
              <span v-else class="h-5 w-5 flex-shrink-0 rounded-[4px] bg-white/10" />
              <!-- 重命名中：内联输入框；否则显示名（别名或真实标题） -->
              <input
                v-if="editingHwnd === item.appHwnd"
                v-model="editValue"
                class="rename-input min-w-0 flex-1 rounded bg-white/10 px-1.5 py-0.5 text-sm text-white outline-none ring-1 ring-blue-400"
                @click.stop
                @keydown.enter.stop.prevent="commitRename"
                @keydown.esc.stop.prevent="cancelRename"
                @blur="commitRename"
              />
              <span v-else class="truncate">{{ displayName(item) }}</span>

              <!-- 右侧控件：序号(前9项, Ctrl+N 直达) + 关闭按钮 -->
              <div class="ml-auto flex flex-shrink-0 items-center gap-2">
                <span
                  v-if="indexOfItem(item) < 9"
                  class="font-mono text-[10px] text-zinc-500"
                  title="Ctrl + 数字 直达"
                  >{{ indexOfItem(item) + 1 }}</span
                >
                <!-- 关闭目标窗口；@click.stop 防止冒泡触发上面的切换 -->
                <button
                  class="flex h-6 w-6 items-center justify-center rounded text-zinc-400 opacity-0 transition hover:bg-white/10 hover:text-white group-hover:opacity-100"
                  :class="{ 'opacity-100': indexOfItem(item) === selectedIndex }"
                  title="关闭该窗口"
                  @click.stop="closeWindow(item)"
                >
                  <close-outlined />
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- 预览 -->
      <div class="flex w-1/2 flex-col items-center justify-center gap-4 border-l border-white/10 p-5">
        <div
          class="flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]"
        >
          <img v-if="previewSrc" :src="previewSrc" class="h-full w-full object-cover" alt="" />
          <!-- 无实时帧也无缓存帧（如从未可见的最小化窗口）：回退到应用图标 -->
          <img
            v-else-if="selected?.appIcon"
            :src="selected.appIcon"
            class="h-14 w-14 rounded-lg opacity-80"
            alt=""
          />
          <span v-else class="text-xs text-zinc-600">无预览</span>
        </div>
        <div v-if="selected" class="w-full text-center">
          <div class="truncate text-sm text-zinc-200">{{ displayName(selected) }}</div>
          <div class="mt-1 font-mono text-[11px] text-zinc-500">{{ exeName(selected.processName) }}</div>
        </div>
      </div>
    </div>

    <!-- 键盘提示 -->
    <div class="flex h-9 items-center gap-4 border-t border-white/10 px-4 text-[11px] text-zinc-500">
      <span class="flex items-center gap-1.5"><kbd>↑</kbd><kbd>↓</kbd> 选择</span>
      <span class="flex items-center gap-1.5"><kbd>↵</kbd> 切换</span>
      <span class="flex items-center gap-1.5"><kbd>Ctrl</kbd><kbd>1~9</kbd> 直达</span>
      <span class="flex items-center gap-1.5"><kbd>Esc</kbd> 关闭</span>
    </div>

    <!-- 右键菜单（重命名 / 清除别名）；右键列表项时在光标处弹出 -->
    <template v-if="menu">
      <!-- 全屏透明遮罩：点击或再次右键即关闭菜单 -->
      <div class="fixed inset-0 z-40" @click="closeMenu" @contextmenu.prevent="closeMenu" />
      <div
        class="fixed z-50 min-w-[128px] overflow-hidden rounded-lg border border-white/10 bg-zinc-800 py-1 text-sm text-zinc-200 shadow-xl"
        :style="{ left: menu.x + 'px', top: menu.y + 'px' }"
      >
        <button
          class="block w-full px-3 py-1.5 text-left hover:bg-white/10"
          @click="startRename(menu.item)"
        >
          重命名
        </button>
        <button
          v-if="aliases[String(menu.item.appHwnd)]"
          class="block w-full px-3 py-1.5 text-left text-zinc-400 hover:bg-white/10"
          @click="clearAlias(menu.item)"
        >
          清除别名
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
  /* 入场：覆盖层出现时的轻微淡入+缩放（reduced-motion 下被全局禁用） */
  .palette-enter {
    animation: palette-in 180ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes palette-in {
    from {
      opacity: 0;
      transform: scale(0.98);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  kbd {
    display: inline-flex;
    min-width: 18px;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    border: 1px solid rgb(255 255 255 / 0.1);
    background: rgb(255 255 255 / 0.06);
    padding: 1px 5px;
    font-family: ui-monospace, SFMono-Regular, 'SF Mono', Consolas, monospace;
    font-size: 10px;
    color: rgb(212 212 216);
  }

  /* 细滚动条，贴合暗色面板 */
  .list-scroll::-webkit-scrollbar {
    width: 8px;
  }
  .list-scroll::-webkit-scrollbar-thumb {
    border-radius: 9999px;
    background: rgb(255 255 255 / 0.1);
  }
  .list-scroll::-webkit-scrollbar-thumb:hover {
    background: rgb(255 255 255 / 0.18);
  }
</style>
