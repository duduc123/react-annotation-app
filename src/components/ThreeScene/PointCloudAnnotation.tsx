import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface Point {
  x: number;
  y: number;
  z: number;
}

interface Annotation {
  id: string;
  points: Point[];
  label: string;
  color: string;
}

const PointCloudAnnotation: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const pointCloudRef = useRef<THREE.Points | null>(null);
  const raycasterRef = useRef<THREE.Raycaster | null>(null);
  const mouseRef = useRef<THREE.Vector2 | null>(null);

  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
  const [selectedLabel, setSelectedLabel] = useState('car');
  const [isAnnotating, setIsAnnotating] = useState(false);
  const animationFrameId = useRef<number | null>(null);

  // 生成汽车形状的点云
  const generateCarPointCloud = (density: number = 0.1): Float32Array => {
    const points: number[] = [];
    
    // 汽车基本尺寸
    const carLength = 4.5;  // 车长
    const carWidth = 2.0;   // 车宽
    const carHeight = 1.5;  // 车高
    const wheelRadius = 0.3; // 车轮半径

    // 生成车身主体（长方体）
    for (let x = -carLength/2; x <= carLength/2; x += density) {
      for (let y = 0; y <= carHeight; y += density) {
        for (let z = -carWidth/2; z <= carWidth/2; z += density) {
          // 车身主体（去掉车窗部分）
          if (y < carHeight * 0.7 || Math.abs(z) > carWidth * 0.3) {
            points.push(x, y, z);
          }
        }
      }
    }

    // 生成车顶（倾斜部分）
    for (let x = -carLength/4; x <= carLength/4; x += density) {
      for (let y = carHeight * 0.7; y <= carHeight; y += density) {
        const widthAtHeight = carWidth * 0.6 * (1 - (y - carHeight * 0.7) / (carHeight * 0.3));
        for (let z = -widthAtHeight/2; z <= widthAtHeight/2; z += density) {
          points.push(x, y, z);
        }
      }
    }

    // 生成车轮
    const wheelPositions = [
      { x: carLength/3, z: carWidth/2 },
      { x: carLength/3, z: -carWidth/2 },
      { x: -carLength/3, z: carWidth/2 },
      { x: -carLength/3, z: -carWidth/2 }
    ];

    wheelPositions.forEach(pos => {
      for (let angle = 0; angle < Math.PI * 2; angle += density) {
        for (let r = 0; r <= wheelRadius; r += density) {
          for (let y = -wheelRadius; y <= wheelRadius; y += density) {
            if (r * r + y * y <= wheelRadius * wheelRadius) {
              points.push(
                pos.x + r * Math.cos(angle),
                y,
                pos.z + r * Math.sin(angle)
              );
            }
          }
        }
      }
    });

    // 生成车灯
    const headlightPositions = [
      { x: carLength/2, y: carHeight * 0.4, z: carWidth/3 },
      { x: carLength/2, y: carHeight * 0.4, z: -carWidth/3 }
    ];

    headlightPositions.forEach(pos => {
      for (let x = pos.x - 0.1; x <= pos.x; x += density) {
        for (let y = pos.y - 0.1; y <= pos.y + 0.1; y += density) {
          for (let z = pos.z - 0.1; z <= pos.z + 0.1; z += density) {
            points.push(x, y, z);
          }
        }
      }
    });

    return new Float32Array(points);
  };

  // 初始化场景
  const initScene = () => {
    if (!mountRef.current) return;

    // 清理现有资源
    cleanup();

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
    cameraRef.current.position.set(8, 6, 8);
    cameraRef.current.lookAt(0, 1, 0);

    // 创建渲染器
    rendererRef.current = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    rendererRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    rendererRef.current.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(rendererRef.current.domElement);

    // 初始化控制器
    if (cameraRef.current && rendererRef.current) {
      controlsRef.current = new OrbitControls(
        cameraRef.current,
        rendererRef.current.domElement
      );
      controlsRef.current.enableDamping = true;
      controlsRef.current.dampingFactor = 0.05;
    }

    // 初始化射线投射器和鼠标向量
    raycasterRef.current = new THREE.Raycaster();
    mouseRef.current = new THREE.Vector2();

    // 创建汽车点云
    const positions = generateCarPointCloud(0.1);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // 创建渐变颜色
    const colors = new Float32Array(positions.length);
    for (let i = 0; i < positions.length; i += 3) {
      const height = positions[i + 1]; // y坐标
      const normalizedHeight = height / 1.5; // 归一化高度
      colors[i] = 0.2 + normalizedHeight * 0.3;     // R
      colors[i + 1] = 0.5 + normalizedHeight * 0.3; // G
      colors[i + 2] = 0.8 + normalizedHeight * 0.2; // B
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      sizeAttenuation: true
    });

    pointCloudRef.current = new THREE.Points(geometry, material);
    sceneRef.current.add(pointCloudRef.current);

    // 添加光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    sceneRef.current.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    sceneRef.current.add(directionalLight);

    // 添加坐标轴辅助
    const axesHelper = new THREE.AxesHelper(5);
    sceneRef.current.add(axesHelper);

    // 添加网格辅助
    const gridHelper = new THREE.GridHelper(10, 10);
    sceneRef.current.add(gridHelper);

    // 添加地面
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x404040,
      roughness: 0.8,
      metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    sceneRef.current.add(ground);
  };

  // 处理鼠标点击
  const handleMouseClick = (event: MouseEvent) => {
    if (!isAnnotating || !mouseRef.current || !raycasterRef.current || 
        !cameraRef.current || !sceneRef.current || !pointCloudRef.current) return;

    const rect = mountRef.current?.getBoundingClientRect();
    if (!rect) return;

    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObject(pointCloudRef.current);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      
      if (!currentAnnotation) {
        const newAnnotation: Annotation = {
          id: Date.now().toString(),
          points: [{ x: point.x, y: point.y, z: point.z }],
          label: selectedLabel,
          color: `#${Math.floor(Math.random()*16777215).toString(16)}`
        };
        setCurrentAnnotation(newAnnotation);
      } else {
        const updatedAnnotation = {
          ...currentAnnotation,
          points: [...currentAnnotation.points, { x: point.x, y: point.y, z: point.z }]
        };
        setCurrentAnnotation(updatedAnnotation);
      }
    }
  };

  // 完成当前标注
  const completeAnnotation = () => {
    if (currentAnnotation && currentAnnotation.points.length >= 3) {
      setAnnotations(prev => [...prev, currentAnnotation]);
    }
    setCurrentAnnotation(null);
    setIsAnnotating(false);
  };

  // 取消当前标注
  const cancelAnnotation = () => {
    setCurrentAnnotation(null);
    setIsAnnotating(false);
  };

  // 更新标注显示
  const updateAnnotationDisplay = () => {
    if (!sceneRef.current) return;

    // 清除旧的标注显示
    const oldAnnotations = sceneRef.current.getObjectByName('annotations');
    if (oldAnnotations) {
      sceneRef.current.remove(oldAnnotations);
    }

    const annotationGroup = new THREE.Group();
    annotationGroup.name = 'annotations';

    // 显示已完成的标注
    annotations.forEach(annotation => {
      const points = annotation.points.map(p => new THREE.Vector3(p.x, p.y, p.z));
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ 
        color: annotation.color,
        linewidth: 2
      });
      const line = new THREE.Line(geometry, material);
      annotationGroup.add(line);
    });

    // 显示当前正在进行的标注
    if (currentAnnotation && currentAnnotation.points.length > 0) {
      const points = currentAnnotation.points.map(p => new THREE.Vector3(p.x, p.y, p.z));
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ 
        color: currentAnnotation.color,
        linewidth: 2
      });
      const line = new THREE.Line(geometry, material);
      annotationGroup.add(line);

      // 添加点标记
      currentAnnotation.points.forEach(point => {
        const sphereGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const sphereMaterial = new THREE.MeshBasicMaterial({ 
          color: currentAnnotation.color 
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.set(point.x, point.y, point.z);
        annotationGroup.add(sphere);
      });
    }

    sceneRef.current.add(annotationGroup);
  };

  // 动画循环
  const animate = () => {
    animationFrameId.current = requestAnimationFrame(animate);

    if (controlsRef.current) {
      controlsRef.current.update();
    }

    updateAnnotationDisplay();

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

  // 清理资源
  const cleanup = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }

    if (controlsRef.current) {
      controlsRef.current.dispose();
      controlsRef.current = null;
    }

    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current = null;
    }

    if (sceneRef.current) {
      while(sceneRef.current.children.length > 0) {
        const object = sceneRef.current.children[0];
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry?.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material?.dispose();
          }
        }
        sceneRef.current.remove(object);
      }
      sceneRef.current = null;
    }
  };

  useEffect(() => {
    initScene();
    animate();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current) {
        mountRef.current.removeEventListener('click', handleMouseClick);
      }
      cleanup();
    };
  }, []);

  // 添加点击事件监听器
  useEffect(() => {
    const currentMount = mountRef.current;
    if (currentMount) {
      currentMount.addEventListener('click', handleMouseClick);
    }

    return () => {
      if (currentMount) {
        currentMount.removeEventListener('click', handleMouseClick);
      }
    };
  }, [isAnnotating, currentAnnotation, selectedLabel]);

  return (
    <div className="point-cloud-annotation" style={{ display: 'flex', height: '100vh' }}>
      <div className="controls-panel" style={{ 
        width: '300px', 
        padding: '20px', 
        background: '#f0f0f0',
        overflowY: 'auto'
      }}>
        <h2>汽车点云标注工具</h2>
        <div className="label-selection" style={{ margin: '10px 0' }}>
          <label>选择标签：</label>
          <select 
            value={selectedLabel} 
            onChange={(e) => setSelectedLabel(e.target.value)}
            style={{ width: '100%', padding: '5px', margin: '5px 0' }}
          >
            <option value="car">车身</option>
            <option value="wheel">车轮</option>
            <option value="window">车窗</option>
            <option value="light">车灯</option>
          </select>
        </div>
        <div className="annotation-controls" style={{ margin: '10px 0' }}>
          {!isAnnotating ? (
            <button 
              onClick={() => setIsAnnotating(true)}
              style={{ 
                padding: '5px 10px', 
                margin: '5px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              开始标注
            </button>
          ) : (
            <>
              <button 
                onClick={completeAnnotation}
                style={{ 
                  padding: '5px 10px', 
                  margin: '5px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                完成标注
              </button>
              <button 
                onClick={cancelAnnotation}
                style={{ 
                  padding: '5px 10px', 
                  margin: '5px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                取消标注
              </button>
            </>
          )}
        </div>
        <div className="annotations-list">
          <h3>已标注区域</h3>
          {annotations.map(annotation => (
            <div 
              key={annotation.id} 
              className="annotation-item"
              style={{ 
                margin: '5px 0', 
                padding: '5px',
                background: 'white',
                borderRadius: '3px'
              }}
            >
              <span style={{ color: annotation.color }}>●</span>
              <span>{annotation.label}</span>
              <span>({annotation.points.length} 个点)</span>
            </div>
          ))}
        </div>
      </div>
      <div 
        ref={mountRef} 
        style={{ 
          flex: 1,
          position: 'relative'
        }} 
      />
    </div>
  );
};

export default PointCloudAnnotation;
