import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const Annotation2DView: React.FC<{
  annotations: Array<{
    id: string;
    position: THREE.Vector3;
    size: THREE.Vector3;
    color: string;
  }>;
}> = ({ annotations }) => {
  const canvasRefs = {
    top: useRef<HTMLCanvasElement>(null),
    left: useRef<HTMLCanvasElement>(null),
    right: useRef<HTMLCanvasElement>(null),
    back: useRef<HTMLCanvasElement>(null)
  };

  // 为每个视图添加缩放状态
  const [scales, setScales] = useState({
    top: 1,
    left: 1,
    right: 1,
    back: 1
  });

  const updateScale = (type: 'top' | 'left' | 'right' | 'back', delta: number) => {
    setScales(prev => ({
      ...prev,
      [type]: Math.max(0.5, Math.min(3, prev[type] + delta))
    }));
  };

  const renderView = (type: 'top' | 'left' | 'right' | 'back') => {
    const canvas = canvasRefs[type].current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 设置坐标系原点在中心，Y轴向上
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(1, -1);

    // 应用缩放
    const scale = scales[type];
    ctx.scale(scale, scale);

    // 绘制坐标轴
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, 0);
    ctx.moveTo(0, -canvas.height / 2);
    ctx.lineTo(0, canvas.height / 2);
    ctx.stroke();

    // 绘制标注框
    annotations.forEach(ann => {
      let x, y, width, height;
      switch (type) {
        case 'top':
          x = ann.position.x - ann.size.x / 2;
          y = ann.position.z - ann.size.z / 2;
          width = ann.size.x;
          height = ann.size.z;
          break;
        case 'left':
          x = ann.position.z - ann.size.z / 2;
          y = ann.position.y - ann.size.y / 2;
          width = ann.size.z;
          height = ann.size.y;
          break;
        case 'right':
          x = -ann.position.z - ann.size.z / 2;
          y = ann.position.y - ann.size.y / 2;
          width = ann.size.z;
          height = ann.size.y;
          break;
        case 'back':
          x = -ann.position.x - ann.size.x / 2;
          y = ann.position.y - ann.size.y / 2;
          width = ann.size.x;
          height = ann.size.y;
          break;
      }

      ctx.strokeStyle = ann.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
    });

    ctx.restore();
  };

  // 当 annotations 或 scales 变化时重新渲染所有视图
  useEffect(() => {
    renderView('top');
    renderView('left');
    renderView('right');
    renderView('back');
  }, [annotations, scales]);

  const ViewContainer = ({ type, title }: { type: 'top' | 'left' | 'right' | 'back', title: string }) => (
    <div style={{ border: '1px solid #ccc', marginBottom: '10px', padding: '0px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 5px' }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        <div>
          <button 
            onClick={() => updateScale(type, -0.1)}
            style={{ marginRight: '5px', padding: '2px 5px', width: '38px', height: '38px', textAlign: 'center' }}
          >
            -
          </button>
          <span style={{ margin: '0 5px' }}>{Math.round(scales[type] * 100)}%</span>
          <button 
            onClick={() => updateScale(type, 0.1)}
            style={{ marginLeft: '5px', padding: '2px 5px', width: '38px', height: '38px', textAlign: 'center' }}
          >
            +
          </button>
        </div>
      </div>
      <canvas
        ref={canvasRefs[type]}
        width={200}
        height={200}
        style={{ border: '1px solid #eee' }}
      />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <ViewContainer type="top" title="俯视图" />
      <ViewContainer type="left" title="左侧视图" />
      <ViewContainer type="right" title="右侧视图" />
      <ViewContainer type="back" title="后视图" />
    </div>
  );
};

export default Annotation2DView;
