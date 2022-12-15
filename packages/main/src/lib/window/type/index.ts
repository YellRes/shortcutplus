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
 * */
const HANDLE = _WIN64 ? Def.uint64 : Def.uint32

export default {
  LONG_PTR,
  HANDLE,
  BOOL,
  POINTER,
  Def
}
