# shortcutplus
对系统中的快捷键提供更好的应用体验


## alt+tab（任务切换）

模仿案例：[Alt Tab Terminator](https://www.ntwind.com/software/alttabter.html)

> 目前只做了windows的版本

### 需要完成的功能

- [x] 获取到的任务列表需要再次筛选
- [x] 获取到的任务窗口需要根据当前的所属的程序来归类
- [x] 任务窗口获取对应的图标信息
- [ ] 要有进程的缩略图的预览

### 项目搭建

参考如下：

1.[ts+vite 构建 electron 项目](https://blog.totominc.io/blog/electron-with-typescript-and-vite-as-a-build-system)

启动项目： npm run dev

项目打包： npm run build

### 项目中遇到的问题


1.如何获取当前系统中所有运行中的程序？

electron中并没有提供直接的api调用。所以这里我使用`node-ffi`调用系统原生dll函数，来获取所有的进程信息。

主要使用了如下几个函数：



2.如何从运行中的程序筛选出当前显示在alt-tab面板中的函数？
主要使用了如下几个函数：

3.系统中的icon图标，进程的预览图如何传递到渲染进程中？





