import { getAllInfo } from './windows'

// Q-A: 导入ffi-napi 后 打包出来的文件 electron 执行后直接退出
// A: ArrayBuffer backing stores must be allocated inside the sandbox address space
export const getAltTabTask = async () => {
  const { allAltTabProcess } = getAllInfo()
  return allAltTabProcess
}
