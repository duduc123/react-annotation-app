# 1.three.js 核心知识 -7h
  场景，摄像机， 渲染器， 几何图形，材质
  网格， GUI， 全景图，光线折射， 性能
  定义： 是WebGL引擎，基于JavaScript， 可直接运行GPU驱动游戏与图形驱动应用与浏览器。 其库提供了大量特性与API以绘制3D场景。
  WebGL： Web图形库， 一组浏览器的API， 可以无需其他插件，独立渲染3D场景。
  ## 1.1 three.js 三要素
  - 场景： 场景是所有物体和光源的容器， 用来放置物体， 光源， 相机等。
  - 相机： 相机决定了渲染什么， 从什么角度渲染， 透视相机， 正交相机。
    - 角度： 失业垂直范围，越大看到越多， 物体越小
    - 宽高比： 摄像机换高必 = 画布宽高比， 否则画面变形
    - 近截面
    - 远截面
  - 渲染器： 渲染器决定了渲染的结果输出到什么位置， 渲染器渲染场景和相机看到的内容。
  ## 1.2 几何图形
  ## 1.3 轨道控制器
    目的：使摄像机围绕目标进行轨道运动
     - 单独引入 OrbitControls 
     - 创建轨道控制器
     - 在渲染循环中更新场景渲染
# 2.three.js 进阶知识 -9h
  贴图， 粗糙度， 金属度，物理材质， 模型
  坐标， 光源， 阴影， gsap, 精灵物理
  项目： 汽车展厅
# 3.着色器原理 8h


# 标注软件参考
## 1.basicFinder 参考产品
  - link: https://www.basicfinder.com/services/
  - 数据堂： https://www.datatang.com/platform?txbz2

## 2.标注软件参考
  - link: https://www.zeplin.com/

## 3.标注数据集参考
  - 美团： https://developer.meituan.com/isv/announcement/detail?dockey=anno-all&id=announcement-4574 

## 点云基础知识：
  - link: https://juejin.cn/post/7422338076528181258 

  视屏讲解： https://www.bilibili.com/video/BV1HPYQz7Ed2/?spm_id_from=333.788.player.switch&vd_source=50a0e952162bc25deee2d84daf559b85&p=4