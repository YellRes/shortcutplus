对系统中的快捷键提供更好的应用体验
# alt+tab（任务切换）

---

模仿案例：[Alt Tab Terminator](https://www.ntwind.com/software/alttabter.html)
> 目前只做了windows的版本

## 特性

---

- 技术栈：vite + vue3 + typescript + electron + ffi-napi
- 提供了可以基于程序名称分类的任务展示
- 可以搜索运行中的任务
## 效果图

---

![动画.gif](https://cdn.nlark.com/yuque/0/2023/gif/394182/1677677576665-a81377f6-2329-4d59-8bd0-6fad4640f41c.gif#averageHue=%23282d35&clientId=ucca7bc89-9558-4&from=ui&id=u3673fecb&name=%E5%8A%A8%E7%94%BB.gif&originHeight=838&originWidth=1756&originalType=binary&ratio=1&rotation=0&showTitle=false&size=4824840&status=done&style=none&taskId=u4ad2cd53-ec3a-471f-bc74-fcaed19a877&title=)
## 需要完成的功能

---

- [x] 获取当前系统中所有显示在alt-tab显示栏中的应用
- [x] 获取到的任务窗口需要根据当前的所属的程序来归类
- [x] 任务点击后能够切换
- [x] 任务窗口获取对应的图标信息
- [ ] 要有任务的缩略图的预览
## 项目搭建

---

参考如下：
1.[ts+vite 构建 electron 项目](https://blog.totominc.io/blog/electron-with-typescript-and-vite-as-a-build-system)
## 安装使用

---

- 获取项目代码
> git clone [https://gitee.com/yellres/shortcutsplus.git](https://gitee.com/yellres/shortcutsplus.git)

- 安装依赖
> npm i

npm i 时候会安装`ffi-napi`这个包，其中`ffi-napi`依赖于`node-gyp`。其中`node-gyp`要求电脑中有`python`，`visual C++ Build Tools`等工具。

- 运行项目
> npm run dev


### 项目中遇到的问题

1. 如何获取当前系统中所有运行中的程序？

electron中并没有提供直接的api调用。
所以这里我使用`node-ffi`调用系统原生dll函数，来获取所有的进程信息。
参考了如下： 

- 
- 

2. 系统中的icon图标，进程的预览图如何传递到渲染进程中？

目前icon图标使用了`electron`中自带的 `app.getFileIcon`方法。
当前进程的预览图暂时没有方法来获取。


