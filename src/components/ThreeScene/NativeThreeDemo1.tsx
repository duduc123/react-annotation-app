import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const NativeThreeDemo1: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const isInitialized = useRef(false);// 添加初始化标记, 避免重复初始化

  const initScene = () => {
    if (isInitialized.current) return;
    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current = null; // 清理渲染器
    }

    // 1.创建场景
    sceneRef.current = new THREE.Scene();

    // 2.创建相机
    cameraRef.current = new THREE.PerspectiveCamera(
      75, // 视野角度，决定相机上下视野范围。常用值 45~75，值越大视野越广。
      window.innerWidth / window.innerHeight, // 宽高比，通常设置为画布宽度 / 高度，保证场景不变形
      0.1, // 近裁剪面，距离相机最近的可见距离，距离小于该值的物体不会被渲染。常用值如 0.1。
      1000 // 远裁剪面，距离相机最远的可见距离，距离大于该值的物体不会被渲染。常用值如 1000。
    );
    cameraRef.current.position.z = 5; // 设置相机位置，拉远相机以便看到立方体, 因为默认值是(0,0,0)
    
    // 3.创建渲染器
    rendererRef.current = new THREE.WebGLRenderer();// 创建WebGL渲染器
    rendererRef.current.setSize(window.innerWidth, window.innerHeight);// 设置渲染器大小为窗口大小

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

  useEffect(() => {
    if (isInitialized.current) return; // 如果已经初始化，直接返回
    // 清理现有的canvas元素
    if (mountRef.current && rendererRef.current?.domElement) {
      mountRef.current.removeChild(rendererRef.current.domElement);
    }

    initScene();
    createCube();
    rendererRef.current?.render(sceneRef.current!, cameraRef.current!);

    if (mountRef.current && rendererRef.current) {
      mountRef.current.appendChild(rendererRef.current.domElement);
    }

    return () => {
      // window.removeEventListener('resize', () => {});
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
    <div ref={mountRef} style={{ width: '100%', height: '100vh' }} />
  </div>);

};

export default NativeThreeDemo1;