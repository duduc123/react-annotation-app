import React from 'react';
import { Link } from 'react-router-dom';
import annotationImage from '../assets/annotationImage.jpg';
import './homePage.css';

const HomePage = () => {
  return (
    <div className="home-page">
      <h1>Welcome to Label Application</h1>
      <div className="home-container">
        <div className="left-content">
          <div className="introduction">
            <p>这是一个功能强大的图像标注工具，提供多种标注功能和可视化效果。</p>
          </div>
          
          <div className="label-section">
            <h2>图像标注工具</h2>
            <p>使用Canvas进行图像标注，支持多种标注形状：</p>
            <ul>
              <li>矩形标注：适用于标注物体边界框</li>
              <li>圆形标注：适用于标注圆形物体</li>
              <li>多边形标注：适用于标注不规则形状</li>
            </ul>
            <p>功能特点：</p>
            <ul>
              <li>支持图片上传和默认图片加载</li>
              <li>实时预览标注效果</li>
              <li>可编辑标注标签</li>
              <li>支持标注数据的导出</li>
            </ul>
            <Link to="/labelpage" className="nav-button">开始标注</Link>
          </div>
          
         <div className="three-section">
            <h2>Three.js 3D场景</h2>
            <p>使用Three.js库创建丰富的3D场景和交互体验：</p>
            <ul>
              <li>3D模型加载和展示</li>
              <li>材质和光照效果</li>
              <li>相机控制和动画</li>
              <li>交互式3D操作</li>
            </ul>
            <Link to="/three" className="nav-button">体验Three.js场景</Link>
          </div>

          <div className="webgl-section">
            <h2>WebGL 可视化</h2>
            <p>使用WebGL技术实现高性能的3D可视化效果：</p>
            <ul>
              <li>3D模型展示</li>
              <li>实时渲染</li>
              <li>交互式操作</li>
              <li>高性能图形处理</li>
            </ul>
            <Link to="/webgl" className="nav-button">查看WebGL演示</Link>
          </div>

         

          <div className="getting-started">
            <h2>快速开始</h2>
            <p>1. 选择您需要的功能模块</p>
            <p>2. 点击对应链接进入功能页面</p>
            <p>3. 按照页面提示进行操作</p>
          </div>
        </div>

        <div className="right-content">
          <div className="image-container">
            <img src={annotationImage} alt="Annotation Demo" />
          </div>
        </div>
      </div>
    </div>
  );
}
export default HomePage;
