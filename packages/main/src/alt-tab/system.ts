import { getAllInfo, toggleWindow } from './windows'

// Q-A: 导入ffi-napi 后 打包出来的文件 electron 执行后直接退出
// A: ArrayBuffer backing stores must be allocated inside the sandbox address space
// 降低 electron 版本

// Q-A: : Dynamic Symbol Retrieval Error Win32 error 127
// A: user32 中函数名称导入错误
export const getAltTabTask = () => {
  const { allAltTabProcess, altTabObj } = getAllInfo()
  return { allAltTabProcess, altTabObj }
}

export const toggleThisWindows = (appHwnd: string) => {
  // toggleWindow(appHwnd)
}
