<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue'

  const hotkey = ref('Alt+4')
  const autoLaunch = ref(false)
  const recording = ref(false)
  const status = ref('')

  const flash = (msg: string) => {
    status.value = msg
    setTimeout(() => {
      if (status.value === msg) status.value = ''
    }, 2000)
  }

  // 把一次 keydown 转成 Electron accelerator（如 "Control+Shift+Space"）
  const MODS = new Set(['Control', 'Shift', 'Alt', 'Meta'])
  const buildAccelerator = (e: KeyboardEvent): string | null => {
    if (MODS.has(e.key)) return null // 纯修饰键：等真正的主键
    const parts: string[] = []
    if (e.ctrlKey) parts.push('Control')
    if (e.altKey) parts.push('Alt')
    if (e.shiftKey) parts.push('Shift')
    if (e.metaKey) parts.push('Super')
    let key = e.key
    if (/^[a-z]$/i.test(key)) key = key.toUpperCase()
    else if (key === ' ') key = 'Space'
    else if (key.startsWith('Arrow')) key = key.replace('Arrow', '')
    parts.push(key)
    return parts.join('+')
  }

  const onRecordKey = async (e: KeyboardEvent) => {
    if (!recording.value) return
    e.preventDefault()
    e.stopPropagation()
    if (e.key === 'Escape') {
      recording.value = false
      status.value = ''
      return
    }
    const accel = buildAccelerator(e)
    if (!accel) return
    recording.value = false
    const res = await window.api.saveSettings({ hotkey: accel })
    hotkey.value = res.settings.hotkey
    flash(res.hotkeyOk ? '快捷键已更新' : '无效或被占用，已保留原快捷键')
  }

  const startRecord = () => {
    recording.value = true
    status.value = '请按下新的快捷键组合（Esc 取消）…'
  }

  const toggleAutoLaunch = async () => {
    const next = !autoLaunch.value
    const res = await window.api.saveSettings({ autoLaunch: next })
    autoLaunch.value = res.settings.autoLaunch
    flash('已保存')
  }

  onMounted(async () => {
    const s = await window.api.getSettings()
    hotkey.value = s.hotkey
    autoLaunch.value = s.autoLaunch
    window.addEventListener('keydown', onRecordKey)
  })
  onBeforeUnmount(() => window.removeEventListener('keydown', onRecordKey))
</script>

<template>
  <div class="min-h-screen w-screen bg-zinc-900 px-6 py-5 text-zinc-100">
    <h1 class="mb-5 text-base font-semibold">设置</h1>

    <!-- 全局快捷键 -->
    <div class="mb-6">
      <div class="mb-2 text-sm">全局快捷键</div>
      <div class="flex items-center gap-3">
        <kbd class="rounded border border-white/15 bg-white/10 px-2 py-1 font-mono text-xs">{{
          hotkey
        }}</kbd>
        <button
          class="rounded-md border px-3 py-1 text-xs transition-colors"
          :class="
            recording
              ? 'border-blue-400 text-blue-300'
              : 'border-white/15 text-zinc-200 hover:bg-white/10'
          "
          @click="startRecord"
        >
          {{ recording ? '按下组合键…' : '录制' }}
        </button>
      </div>
      <p class="mt-2 text-[11px] leading-relaxed text-zinc-500">
        建议带修饰键（Alt / Ctrl / Shift）。注意：系统级的 Alt+Tab 无法被占用。
      </p>
    </div>

    <!-- 开机自启 -->
    <div class="mb-6 flex items-center justify-between">
      <div class="text-sm">开机自启</div>
      <button
        role="switch"
        :aria-checked="autoLaunch"
        class="relative h-5 w-9 flex-shrink-0 rounded-full transition-colors"
        :class="autoLaunch ? 'bg-blue-500' : 'bg-white/15'"
        @click="toggleAutoLaunch"
      >
        <span
          class="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
          :class="autoLaunch ? 'left-[18px]' : 'left-0.5'"
        />
      </button>
    </div>

    <p class="h-4 text-xs text-blue-300">{{ status }}</p>
  </div>
</template>
