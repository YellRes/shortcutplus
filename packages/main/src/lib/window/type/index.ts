import Def from './def.enum'

const _WIN64 = process.arch === 'x64'

const BOOL = Def.int
const POINTER = Def.ptr
// 64位操作系统 就是 int64
const LONG_PTR = _WIN64 ? Def.int64 : Def.int32

/**
 * u unsigned 无符号类型的数据
 * uint64 和 int64 的区别
 * int64 有符号整数(最大整数 2^32 - 1)
 * uint64 无符号整数，只有正整数(最大整数2^64 - 1)
 * 详情可见 => https://blog.csdn.net/huguangwu7845/article/details/107483947
 *
 * 句柄 （HANDLE）
 * 对象是表示系统资源（如文件、线程或图形图像）的数据结构。 应用程序不能直接访问对象数据
 * 应用程序必须获取对象 句柄，该句柄可用于检查或修改系统资源。 每个句柄都有一个内部维护的表中的条目。 这些条目包含资源的地址，以及标识资源类型的方法。
 * */

const HANDLE = _WIN64 ? Def.uint64 : Def.uint32
const PVOID = _WIN64 ? Def.uint64Ptr : Def.uint32Ptr

// DwmGetWindowAttribute
/**
 * long 和 int 区别
 * int 最少2个字节  long最少4个字节
 */
const HRESULT = Def.long

export default {
  LONG_PTR,
  HANDLE,
  BOOL,
  POINTER,
  PVOID,
  HRESULT,
  Def
}
