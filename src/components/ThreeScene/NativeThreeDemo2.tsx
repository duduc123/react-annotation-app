import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as dat from 'dat.gui';

const NativeThreeDemo2: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const isInitialized = useRef(false);// 添加初始化标记, 避免重复初始化
  const controls = useRef<OrbitControls | null>(null);

  const initScene = () => {
    if (isInitialized.current) return;
    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current = null; // 清理渲染器
    }
    if (!mountRef.current) return;

    // 1.创建场景
    sceneRef.current = new THREE.Scene();

    // 2.创建相机
    cameraRef.current = new THREE.PerspectiveCamera(
      75, // 视野角度，决定相机上下视野范围。常用值 45~75，值越大视野越广。
      mountRef.current?.offsetWidth / mountRef.current?.offsetHeight, // 宽高比，通常设置为画布宽度 / 高度，保证场景不变形
      0.1, // 近裁剪面，距离相机最近的可见距离，距离小于该值的物体不会被渲染。常用值如 0.1。
      1000 // 远裁剪面，距离相机最远的可见距离，距离大于该值的物体不会被渲染。常用值如 1000。
    );
    cameraRef.current.position.z = 5; // 设置相机位置，拉远相机以便看到立方体, 因为默认值是(0,0,0)
    
    // 3.创建渲染器
    rendererRef.current = new THREE.WebGLRenderer({ antialias: true });// 创建WebGL渲染器, antialias: 抗锯齿, 默认为false
    rendererRef.current.setSize(mountRef.current?.offsetWidth, mountRef.current?.offsetHeight);// 设置渲染器大小为窗口大小

    isInitialized.current = true; // 标记为已初始化
  }

  // 创建一个立方体并添加到场景中
  const createCube = () => {
    if (!sceneRef.current) return;
    // 1.创建图形，立方缓冲几何体，参数为宽、高、深
    const geometry = new THREE.BoxGeometry(1, 1, 1); 
    // 2.创建材质，基础材质-网格基础材质（线，面穿颜色描绘表面），参数为颜色
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); 
    // 3.创建网格，传入图形和材质
    const cube = new THREE.Mesh(geometry, material);
    // 4.将立方体添加到场景中
    sceneRef.current.add(cube); // 创建网格物理对象， 传入图形和材质将立方体添加到场景中
   
  }

  // 移动立方体
  const moveCube = () => {
    if (!sceneRef.current) return;
    // 获取场景中的所有网格对象
    // cube.position.x = 6;
    const cube = sceneRef.current.children.find(obj => obj.type === 'Mesh') as THREE.Mesh;
    if (!cube) return;
    cube.position.x = 5;
    cube.rotation.x = Math.PI / 4; // 旋转45度
    // cube.rotation.y = Math.PI / 4; // 旋转45度
    cube.scale.set(2, 1, 1); // x轴放大2倍，y轴不变，z轴不变
  }

  const createOrbitControls = () => {
    if (!cameraRef.current || !rendererRef.current) return;
    // 创建轨道控制器，轨道控制器可以围绕目标进行轨道运动，可以旋转、缩放和移动相机
    controls.current = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
    controls.current.enableDamping = true; // 启用阻尼（惯性），必须在动画循环中调用 update()
    controls.current.dampingFactor = 0.05; // 阻尼惯性系数，值越小惯性越大，默认值0.05
    controls.current.autoRotate = true; // 启用自动旋转
    controls.current.autoRotateSpeed = 2.0; // 自动旋转速度，相当于在60fps时每旋转一周需要30秒。
    // controls.current.maxPolarAngle = Math.PI / 2; // 垂直旋转的最大角度，0到Math.PI之间，限制上下旋转范围，防止翻转
    // controls.current.minPolarAngle = 0; // 垂直旋转的最小角度，0到Math.PI之间，限制上下旋转范围，上面是0度，下面是90度
    // controls.current.maxAzimuthAngle = 1.5 * Math.PI; // 水平旋转的最大角度, 范围是看到后面和左面， 右面那面看不到
    // controls.current.minAzimuthAngle = 0.5 * Math.PI; // 水平旋转的最小角度
    // controls.current.minDistance = 2; // 最小缩放距离
    // controls.current.maxDistance = 20; // 最大缩放距离
  }
  const renderLoop = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    controls.current?.update(); // 手动JS更新过摄像机的信息， 必须调用轨道控制器update 方法
    requestAnimationFrame(renderLoop); // 根据当前浏览器的刷新帧率，递归调用渲染函数，好处： 当浏览器窗口不可见时，渲染会自动暂停，节省资源
  }

  const createAxesHelper = () => {
    const axesHelper = new THREE.AxesHelper(5); // 参数表示轴线的长度
    if (sceneRef.current) {
      sceneRef.current.add(axesHelper);
    }
  }

  const renderResize = () => {
    if (!cameraRef.current || !rendererRef.current || !mountRef.current) return;
    cameraRef.current.aspect = mountRef.current?.offsetWidth / mountRef.current?.offsetHeight; // 更新相机宽高比
    cameraRef.current.updateProjectionMatrix(); // 更新相机投影矩阵
    rendererRef.current.setSize(mountRef.current?.offsetWidth, mountRef.current?.offsetHeight);
  }

  const createGUI = () => {
    const gui = new dat.GUI();
    const cube = sceneRef.current?.children.find(obj => obj.type === 'Mesh') as THREE.Mesh;
    if (!cube) return;
    // gui.add() 添加图形用户工具， 参数1： 关联DOM对象， JS对象， 3D物体对象， 参数2： 对象属性， 参数3： 属性最小值， 参数4： 属性最大值
    gui.add(cube, 'visible', 0, 1); 
    // gui.add(cube.rotation, 'x', 0, Math.PI * 2);
    // gui.add(cube.rotation, 'y', 0, Math.PI * 2);
    // gui.add(cube.rotation, 'z', 0, Math.PI * 2);

    const colorObj = {
      'color': `#${cube.material.color.getHexString()}`,
    }
    gui.addColor(colorObj, 'color').onChange((value) => {
      cube.material.color.set(value);
    });

    const folder = gui.addFolder('立方体位移'); // 创建一个文件夹
    folder.add(cube.position, 'x', 0, 5, 0.1); // 参数2 属性， 参数3 最小值， 参数4 最大值， 参数5： 步长
    folder.add(cube.position, 'y', 0, 5, 0.1);
    folder.add(cube.position, 'z', 0, 5, 0.1);

    const folderScale = gui.addFolder('立方体缩放'); // 创建一个文件夹
    folderScale.add(cube.scale, 'x', 0, 5, 0.1); // 参数2 属性， 参数3 最小值， 参数4 最大值， 参数5： 步长
    folderScale.add(cube.scale, 'y', 0, 5, 0.1);
    folderScale.add(cube.scale, 'z', 0, 5, 0.1);

    // 下拉菜单：
    gui.add({ type: '1'}, 'type', {'type 1':'1', 'type 2':'2', 'type 3':'3'}).onChange((value) => {
      console.log('选择的类型：', value);
      switch (value) {
        case '1':
          cube.position.set(0,0,0);
          cube.rotation.set(0,0,0);
          cube.scale.set(1,1,1);
          cube.material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
          break;
        case '2':
          cube.position.set(2, 2, 2);
          cube.material = new THREE.MeshBasicMaterial(
            { color: 0xff0000, wireframe: true } // 线框模式
          );
          break;
        case '3':
          cube.position.set(1, 2, 2);
          cube.material = new THREE.MeshBasicMaterial(
            { color: 0x0000ff, wireframe: false } // 实心模式

          );
          break;
        default:
          break;
        }
    });

    gui.add(controls.current, 'reset')
    // gui.close(); // 关闭GUI面板
    // gui.hide(); // 隐藏GUI面板
  }

  useEffect(() => {
    if (isInitialized.current) return; // 如果已经初始化，直接返回
    // 清理现有的canvas元素
    if (mountRef.current && rendererRef.current?.domElement) {
      mountRef.current.removeChild(rendererRef.current.domElement);
    }

    window.addEventListener('resize', renderResize); // 监听窗口大小变化事件

    // renderResize(); // 初始化渲染尺寸
    
    initScene(); // 初始化场景
    renderResize(); // 初始化渲染尺寸
    createOrbitControls(); // 创建轨道控制器
    createAxesHelper(); // 创建坐标轴辅助线
    createCube(); // 创建立方体
    moveCube(); // 移动立方体
    createGUI();
    rendererRef.current?.render(sceneRef.current!, cameraRef.current!);

    if (mountRef.current && rendererRef.current) {
      mountRef.current.appendChild(rendererRef.current.domElement);
    }
    renderLoop();

    return () => {
      window.removeEventListener('resize', renderResize);
      if (mountRef.current && rendererRef.current?.domElement) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  return (<div>
    {/* <p>Native Three.js Demo</p> */}
    <div ref={mountRef} style={{ width: '100%', height: '100vh', padding: '5px 10px', margin: '2px' }} />
  </div>);

};

export default NativeThreeDemo2;