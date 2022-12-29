import { getAllInfo } from './windows'

// Q-A: 导入ffi-napi 后 打包出来的文件 electron 执行后直接退出
// A: ArrayBuffer backing stores must be allocated inside the sandbox address space
// 降低 electron 版本

// Q-A: : Dynamic Symbol Retrieval Error Win32 error 127
export const getAltTabTask = async () => {
  const { allAltTabProcess } = getAllInfo()
  return allAltTabProcess

  // console.log(user32.GetKeyState(0x06) < 0, 'user32.GetKeyState(0x06) < 0')
}
