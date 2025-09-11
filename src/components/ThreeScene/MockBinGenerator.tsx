import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface Point {
  x: number;
  y: number;
  z: number;
  r: number;
  g: number;
  b: number;
}

const MockBinGenerator: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const pointCloudRef = useRef<THREE.Points | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [pointCount, setPointCount] = useState(0);

  // 生成更详细的汽车点云
  const generateCarPoints = (baseX: number, baseY: number, baseZ: number): Point[] => {
    const points: Point[] = [];
    const carLength = 4.5;
    const carWidth = 2.0;
    const carHeight = 1.5;
    const density = 0.1; // 增加密度值以减少循环次数

    // 车身主体（红色）
    for (let x = 0; x <= carLength; x += density) {
      for (let y = 0; y <= carHeight; y += density) {
        for (let z = 0; z <= carWidth; z += density) {
          if (y < carHeight * 0.3 || 
              (y >= carHeight * 0.3 && y <= carHeight * 0.7 && 
               (z < carWidth * 0.2 || z > carWidth * 0.8)) ||
              y > carHeight * 0.7) {
            points.push({
              x: baseX + x,
              y: baseY + y,
              z: baseZ + z,
              r: 255,
              g: 0,
              b: 0
            });
          }
        }
      }
    }

    // 车窗（深蓝色）
    for (let x = carLength * 0.2; x <= carLength * 0.8; x += density) {
      for (let y = carHeight * 0.3; y <= carHeight * 0.7; y += density) {
        for (let z = carWidth * 0.2; z <= carWidth * 0.8; z += density) {
          points.push({
            x: baseX + x,
            y: baseY + y,
            z: baseZ + z,
            r: 0,
            g: 0,
            b: 100
          });
        }
      }
    }

    // 车轮（黑色，带细节）
    const wheelPositions = [
      { x: carLength * 0.2, z: carWidth * 0.2 },
      { x: carLength * 0.2, z: carWidth * 0.8 },
      { x: carLength * 0.8, z: carWidth * 0.2 },
      { x: carLength * 0.8, z: carWidth * 0.8 }
    ];

    wheelPositions.forEach(pos => {
      // 轮胎
      for (let angle = 0; angle < Math.PI * 2; angle += density * 2) {
        for (let r = 0.25; r <= 0.35; r += density) {
          for (let y = 0; y <= 0.3; y += density) {
            points.push({
              x: baseX + pos.x + r * Math.cos(angle),
              y: baseY + y,
              z: baseZ + pos.z + r * Math.sin(angle),
              r: 0,
              g: 0,
              b: 0
            });
          }
        }
      }
      // 轮毂（银色）
      for (let angle = 0; angle < Math.PI * 2; angle += density * 2) {
        for (let r = 0; r <= 0.25; r += density) {
          for (let y = 0; y <= 0.3; y += density) {
            if (r * r + y * y <= 0.25 * 0.25) {
              points.push({
                x: baseX + pos.x + r * Math.cos(angle),
                y: baseY + y,
                z: baseZ + pos.z + r * Math.sin(angle),
                r: 192,
                g: 192,
                b: 192
              });
            }
          }
        }
      }
    });

    // 车灯
    // 前灯（白色）
    for (let x = carLength * 0.95; x <= carLength; x += density) {
      for (let y = carHeight * 0.4; y <= carHeight * 0.6; y += density) {
        for (let z = carWidth * 0.2; z <= carWidth * 0.4; z += density) {
          points.push({
            x: baseX + x,
            y: baseY + y,
            z: baseZ + z,
            r: 255,
            g: 255,
            b: 255
          });
        }
      }
    }
    // 后灯（红色）
    for (let x = 0; x <= carLength * 0.05; x += density) {
      for (let y = carHeight * 0.4; y <= carHeight * 0.6; y += density) {
        for (let z = carWidth * 0.2; z <= carWidth * 0.4; z += density) {
          points.push({
            x: baseX + x,
            y: baseY + y,
            z: baseZ + z,
            r: 255,
            g: 0,
            b: 0
          });
        }
      }
    }

    return points;
  };

  // 生成行人点云
  const generatePersonPoints = (baseX: number, baseY: number, baseZ: number): Point[] => {
    const points: Point[] = [];
    const personHeight = 1.7;
    const bodyWidth = 0.5;
    const density = 0.1;

    // 身体（蓝色）
    for (let y = 0; y <= personHeight * 0.6; y += density) {
      for (let z = 0; z <= bodyWidth; z += density) {
        for (let x = 0; x <= bodyWidth; x += density) {
          if (Math.sqrt(Math.pow(x - bodyWidth/2, 2) + Math.pow(z - bodyWidth/2, 2)) <= bodyWidth/2) {
            points.push({
              x: baseX + x,
              y: baseY + y,
              z: baseZ + z,
              r: 0,
              g: 0,
              b: 255
            });
          }
        }
      }
    }

    // 头部（蓝色）
    const headRadius = 0.2;
    for (let angle = 0; angle < Math.PI * 2; angle += density * 2) {
      for (let phi = 0; phi < Math.PI; phi += density * 2) {
        for (let r = 0; r <= headRadius; r += density) {
          points.push({
            x: baseX + bodyWidth/2 + r * Math.sin(phi) * Math.cos(angle),
            y: baseY + personHeight * 0.6 + r * Math.cos(phi),
            z: baseZ + bodyWidth/2 + r * Math.sin(phi) * Math.sin(angle),
            r: 0,
            g: 0,
            b: 255
          });
        }
      }
    }

    return points;
  };

  // 生成树木点云
  const generateTreePoints = (baseX: number, baseY: number, baseZ: number): Point[] => {
    const points: Point[] = [];
    const trunkHeight = 3;
    const trunkRadius = 0.3;
    const treeHeight = 6;
    const treeRadius = 2;
    const density = 0.15;

    // 树干（棕色）
    for (let y = 0; y <= trunkHeight; y += density) {
      for (let angle = 0; angle < Math.PI * 2; angle += density * 2) {
        for (let r = 0; r <= trunkRadius; r += density) {
          points.push({
            x: baseX + r * Math.cos(angle),
            y: baseY + y,
            z: baseZ + r * Math.sin(angle),
            r: 139,
            g: 69,
            b: 19
          });
        }
      }
    }

    // 树冠（绿色）
    for (let y = trunkHeight; y <= treeHeight; y += density) {
      const radiusAtHeight = treeRadius * (1 - (y - trunkHeight) / (treeHeight - trunkHeight));
      for (let angle = 0; angle < Math.PI * 2; angle += density * 2) {
        for (let r = 0; r <= radiusAtHeight; r += density) {
          points.push({
            x: baseX + r * Math.cos(angle),
            y: baseY + y,
            z: baseZ + r * Math.sin(angle),
            r: 0,
            g: 255,
            b: 0
          });
        }
      }
    }

    return points;
  };

  // 生成街景元素
  const generateStreetScenePoints = (): Point[] => {
    const points: Point[] = [];

    // 生成道路（深灰色）
    for (let x = -20; x <= 20; x += 0.3) {
      for (let z = -3; z <= 3; z += 0.3) {
        points.push({
          x,
          y: 0,
          z,
          r: 64,
          g: 64,
          b: 64
        });
      }
    }

    // 道路标线（白色）
    for (let x = -20; x <= 20; x += 1) {
      for (let z = -0.1; z <= 0.1; z += 0.3) {
        points.push({
          x,
          y: 0.01,
          z,
          r: 255,
          g: 255,
          b: 255
        });
      }
    }

    // 人行道（浅灰色）
    for (let x = -20; x <= 20; x += 0.3) {
      for (let z = 3; z <= 6; z += 0.3) {
        points.push({
          x,
          y: 0.1,
          z,
          r: 192,
          g: 192,
          b: 192
        });
      }
    }

    // 路灯
    const lampPosts = [
      { x: -10, z: 4 },
      { x: -5, z: 4 },
      { x: 0, z: 4 },
      { x: 5, z: 4 },
      { x: 10, z: 4 }
    ];

    lampPosts.forEach(pos => {
      // 灯柱（深灰色）
      for (let y = 0; y <= 4; y += 0.1) {
        for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
          for (let r = 0; r <= 0.1; r += 0.05) {
            points.push({
              x: pos.x + r * Math.cos(angle),
              y: y,
              z: pos.z + r * Math.sin(angle),
              r: 64,
              g: 64,
              b: 64
            });
          }
        }
      }
      // 灯罩（白色）
      for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
        for (let r = 0; r <= 0.3; r += 0.05) {
          points.push({
            x: pos.x + r * Math.cos(angle),
            y: 4,
            z: pos.z + r * Math.sin(angle),
            r: 255,
            g: 255,
            b: 255
          });
        }
      }
    });

    return points;
  };

  // 生成场景点云
  const generateScenePoints = (): Point[] => {
    const points: Point[] = [];

    // 添加街景
    points.push(...generateStreetScenePoints());

    // 添加汽车
    points.push(...generateCarPoints(-5, 0, 0));

    // 添加行人
    points.push(...generatePersonPoints(2, 0, 4));

    // 添加树木
    points.push(...generateTreePoints(8, 0, -2));

    return points;
  };

  // 生成.bin文件
  const generateBinFile = () => {
    setIsGenerating(true);
    const points = generateScenePoints();
    setPointCount(points.length);

    // 创建二进制数据
    const buffer = new ArrayBuffer(points.length * 20); // 每个点20字节 (x,y,z,r,g,b各4字节)
    const view = new DataView(buffer);

    points.forEach((point, i) => {
      const offset = i * 20;
      view.setFloat32(offset, point.x, true);
      view.setFloat32(offset + 4, point.y, true);
      view.setFloat32(offset + 8, point.z, true);
      view.setUint8(offset + 12, point.r);
      view.setUint8(offset + 13, point.g);
      view.setUint8(offset + 14, point.b);
    });

    // 创建Blob并下载
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mock_scene.bin';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // 更新3D预览
    updatePointCloud(points);
    setIsGenerating(false);
  };

  // 更新点云显示
  const updatePointCloud = (points: Point[]) => {
    if (!sceneRef.current) return;

    // 移除旧的点云
    if (pointCloudRef.current) {
      sceneRef.current.remove(pointCloudRef.current);
    }

    // 创建几何体
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(points.length * 3);
    const colors = new Float32Array(points.length * 3);

    points.forEach((point, i) => {
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;

      colors[i * 3] = point.r / 255;
      colors[i * 3 + 1] = point.g / 255;
      colors[i * 3 + 2] = point.b / 255;
    });

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // 创建材质
    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      sizeAttenuation: true
    });

    // 创建点云对象
    pointCloudRef.current = new THREE.Points(geometry, material);
    sceneRef.current.add(pointCloudRef.current);
  };

  // 初始化场景
  const initScene = () => {
    if (!mountRef.current) return;

    // 创建场景
    sceneRef.current = new THREE.Scene();
    sceneRef.current.background = new THREE.Color(0x1a1a1a);

    // 创建相机
    cameraRef.current = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    cameraRef.current.position.set(15, 10, 15);
    cameraRef.current.lookAt(0, 0, 0);

    // 创建渲染器
    rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(rendererRef.current.domElement);

    // 添加控制器
    if (cameraRef.current && rendererRef.current) {
      controlsRef.current = new OrbitControls(
        cameraRef.current,
        rendererRef.current.domElement
      );
      controlsRef.current.enableDamping = true;
      controlsRef.current.dampingFactor = 0.05;
    }

    // 添加光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    sceneRef.current.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    sceneRef.current.add(directionalLight);

    // 添加坐标轴辅助
    const axesHelper = new THREE.AxesHelper(5);
    sceneRef.current.add(axesHelper);
  };

  // 动画循环
  const animate = () => {
    requestAnimationFrame(animate);

    if (controlsRef.current) {
      controlsRef.current.update();
    }

    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  };

  // 处理窗口大小变化
  const handleResize = () => {
    if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;

    cameraRef.current.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
  };

  useEffect(() => {
    initScene();
    animate();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  return (
    <div className="mock-bin-generator" style={{ padding: '20px' }}>
      <div className="controls-panel" style={{ marginBottom: '20px' }}>
        <h2>Mock点云生成器</h2>
        <button
          onClick={generateBinFile}
          disabled={isGenerating}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            borderRadius: '4px',
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            border: 'none',
            margin: '10px 0'
          }}
        >
          {isGenerating ? '生成中...' : '生成Mock点云文件'}
        </button>
        
        {pointCount > 0 && (
          <p>已生成 {pointCount} 个点</p>
        )}
      </div>

      <div
        ref={mountRef}
        style={{
          width: '100%',
          height: '600px',
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}
      />
    </div>
  );
};

export default MockBinGenerator;
