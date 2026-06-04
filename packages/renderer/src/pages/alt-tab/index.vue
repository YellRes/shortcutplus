<script setup lang="ts">
  import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
  import { WindowAltTabTaskItem } from 'main/src/alt-tab/type'
  import { SearchOutlined } from '@ant-design/icons-vue'

  const inputVal = ref<string>('')
  const allTabsArr = ref<WindowAltTabTaskItem[]>([])
  const loading = ref(false)
  const selectedIndex = ref(0)
  const previewSrc = ref<string>('')

  const searchRef = ref<HTMLInputElement>()
  const listRef = ref<HTMLElement>()

  // 过滤（关键字与标题都转小写，避免大写匹配不到）
  const filtered = computed(() => {
    const kw = inputVal.value.trim().toLowerCase()
    return kw
      ? allTabsArr.value.filter((t) => t.appTitle.toLowerCase().includes(kw))
      : allTabsArr.value
  })

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

  const getAllTabs = async () => {
    loading.value = true
    try {
      allTabsArr.value = await window.api.getAllAltTabTask()
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

  // 键盘模型：↑↓ 选择 · ↵ 切换 · Esc 关闭（输入框常驻聚焦，方向键需阻止默认行为）
  const onKeydown = (e: KeyboardEvent) => {
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
    class="palette-enter flex h-[480px] w-[720px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/95 text-zinc-100 shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
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
            <button
              v-for="item in items"
              :key="item.appHwnd"
              :data-selected="indexOfItem(item) === selectedIndex"
              class="flex w-full items-center gap-3 border-l-2 px-4 py-2 text-left text-sm transition-colors"
              :class="
                indexOfItem(item) === selectedIndex
                  ? 'border-blue-400 bg-blue-500/15 text-white'
                  : 'border-transparent text-zinc-300 hover:bg-white/[0.04]'
              "
              @mouseenter="selectedIndex = indexOfItem(item)"
              @click="switchTo(item)"
            >
              <img
                v-if="item.appIcon"
                :src="item.appIcon"
                class="h-5 w-5 flex-shrink-0 rounded-[4px]"
                alt=""
              />
              <span v-else class="h-5 w-5 flex-shrink-0 rounded-[4px] bg-white/10" />
              <span class="truncate">{{ item.appTitle }}</span>
            </button>
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
          <div class="truncate text-sm text-zinc-200">{{ selected.appTitle }}</div>
          <div class="mt-1 font-mono text-[11px] text-zinc-500">{{ exeName(selected.processName) }}</div>
        </div>
      </div>
    </div>

    <!-- 键盘提示 -->
    <div class="flex h-9 items-center gap-4 border-t border-white/10 px-4 text-[11px] text-zinc-500">
      <span class="flex items-center gap-1.5"><kbd>↑</kbd><kbd>↓</kbd> 选择</span>
      <span class="flex items-center gap-1.5"><kbd>↵</kbd> 切换</span>
      <span class="flex items-center gap-1.5"><kbd>Esc</kbd> 关闭</span>
    </div>
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
