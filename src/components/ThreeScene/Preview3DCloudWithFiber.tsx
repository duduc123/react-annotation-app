import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Points } from '@react-three/drei';
import * as THREE from 'three';
import Annotation2DView from './Annotation2DView';

interface Point {
  x: number;
  y: number;
  z: number;
  intensity: number;
  timestamp?: number;
  ring?: number;
}

// 点云组件
const PointCloud: React.FC<{
  points: Point[];
  visible: boolean;
}> = ({ points, visible }) => {
  const meshRef = useRef<THREE.Points>(null);

  // 创建点云几何体和材质
  useEffect(() => {
    if (!meshRef.current || !visible) return;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(points.length * 3);
    const colors = new Float32Array(points.length * 3);
    
    // 计算点云边界用于归一化颜色
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    let minIntensity = Infinity, maxIntensity = -Infinity;

    points.forEach(point => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      minZ = Math.min(minZ, point.z);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
      maxZ = Math.max(maxZ, point.z);
      minIntensity = Math.min(minIntensity, point.intensity);
      maxIntensity = Math.max(maxIntensity, point.intensity);
    });

    const intensityRange = maxIntensity - minIntensity;

    points.forEach((point, i) => {
      // 设置位置
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;

      // 使用强度值生成颜色
      const normalizedIntensity = Math.max(0, Math.min(1, (point.intensity - minIntensity) / intensityRange));
      
      // 使用更明显的颜色映射
      if (normalizedIntensity < 0.25) {
        // 深蓝到蓝
        colors[i * 3] = 0;
        colors[i * 3 + 1] = 0;
        colors[i * 3 + 2] = normalizedIntensity * 4;
      } else if (normalizedIntensity < 0.5) {
        // 蓝到青
        colors[i * 3] = 0;
        colors[i * 3 + 1] = (normalizedIntensity - 0.25) * 4;
        colors[i * 3 + 2] = 1;
      } else if (normalizedIntensity < 0.75) {
        // 青到黄
        colors[i * 3] = (normalizedIntensity - 0.5) * 4;
        colors[i * 3 + 1] = 1;
        colors[i * 3 + 2] = 1 - (normalizedIntensity - 0.5) * 4;
      } else {
        // 黄到红
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 1 - (normalizedIntensity - 0.75) * 4;
        colors[i * 3 + 2] = 0;
      }
    });
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    meshRef.current.geometry = geometry;
  }, [points, visible]);

  if (!visible) return null;

  return (
    <points ref={meshRef}>
      <pointsMaterial size={0.1} vertexColors sizeAttenuation />
    </points>
  );
};

// 标注框组件
const AnnotationBox: React.FC<{
  start: THREE.Vector3;
  end: THREE.Vector3;
  visible: boolean;
}> = ({ start, end, visible }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (!meshRef.current || !visible) return;

    // 计算立方体的中心和大小
    const center = new THREE.Vector3(
      (start.x + end.x) / 2,
      (start.y + end.y) / 2,
      (start.z + end.z) / 2
    );
    const size = new THREE.Vector3(
      Math.abs(end.x - start.x),
      Math.abs(end.y - start.y),
      Math.abs(end.z - start.z)
    );

    // 创建立方体几何体
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    
    // 创建边框材质
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });

    meshRef.current.geometry = geometry;
    meshRef.current.material = material;
    meshRef.current.position.copy(center);
  }, [start, end, visible]);

  if (!visible) return null;

  return <mesh ref={meshRef} />;
};

// 场景组件
const Scene: React.FC<{
  points: Point[];
  isAnnotating: boolean;
  currentAnnotation: { start: THREE.Vector3; end: THREE.Vector3 } | null;
  onAnnotationStart: (point: THREE.Vector3) => void;
  onAnnotationMove: (point: THREE.Vector3) => void;
  onAnnotationEnd: () => void;
}> = ({ points, isAnnotating, currentAnnotation, onAnnotationStart, onAnnotationMove, onAnnotationEnd }) => {
  const { camera, gl, scene } = useThree();
  const controlsRef = useRef<any>();
  const pointCloudRef = useRef<THREE.Points>(null);

  // 处理鼠标事件
  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (!isAnnotating) return;

    const mouse = new THREE.Vector2();
    const rect = gl.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
    if (pointCloudRef.current) {
      const intersects = raycaster.intersectObject(pointCloudRef.current);
      if (intersects.length > 0) {
        onAnnotationStart(intersects[0].point.clone());
      }
    }
  }, [isAnnotating, camera, gl, onAnnotationStart]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isAnnotating || !currentAnnotation) return;

    const mouse = new THREE.Vector2();
    const rect = gl.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
    if (pointCloudRef.current) {
      const intersects = raycaster.intersectObject(pointCloudRef.current);
      if (intersects.length > 0) {
        onAnnotationMove(intersects[0].point.clone());
      }
    }
  }, [isAnnotating, currentAnnotation, camera, gl, onAnnotationMove]);

  const handleMouseUp = useCallback(() => {
    if (!isAnnotating || !currentAnnotation) return;
    onAnnotationEnd();
  }, [isAnnotating, currentAnnotation, onAnnotationEnd]);

  // 添加事件监听器
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, gl]);

  // 调整相机位置以适应点云大小
  useEffect(() => {
    if (points.length === 0) return;

    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    points.forEach(point => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      minZ = Math.min(minZ, point.z);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
      maxZ = Math.max(maxZ, point.z);
    });

    const center = new THREE.Vector3(
      (minX + maxX) / 2,
      (minY + maxY) / 2,
      (minZ + maxZ) / 2
    );
    const size = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
    
    camera.position.set(
      center.x + size * 1.5,
      center.y + size * 1.5,
      center.z + size * 1.5
    );
    camera.lookAt(center);
  }, [points, camera]);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <axesHelper args={[5]} />
      <gridHelper args={[10, 10]} />
      
      <PointCloud points={points} visible={true} ref={pointCloudRef} />
      
      {currentAnnotation && (
        <AnnotationBox
          start={currentAnnotation.start}
          end={currentAnnotation.end}
          visible={true}
        />
      )}
      
      <OrbitControls 
        ref={controlsRef} 
        enableDamping 
        dampingFactor={0.05} 
        enabled={!isAnnotating}
      />
    </>
  );
};

// 主组件
const Preview3DCloudWithFiber: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pointCount, setPointCount] = useState(0);
  const [points, setPoints] = useState<Point[]>([]);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState<{
    start: THREE.Vector3;
    end: THREE.Vector3;
  } | null>(null);
  const [annotations, setAnnotations] = useState<Array<{
    id: string;
    position: THREE.Vector3;
    size: THREE.Vector3;
    color: string;
  }>>([]);

  // 解析Hesai LiDAR .bin文件
  const parseBinFile = async (arrayBuffer: ArrayBuffer): Promise<Point[]> => {
    const dataView = new DataView(arrayBuffer);
    const points: Point[] = [];
    const byteSize = arrayBuffer.byteLength;
    
    // 所有可能的点云格式
    const possibleFormats = [
      { size: 12, desc: "XYZ (3 floats)" },
      { size: 16, desc: "XYZ+Intensity (4 floats)" },
      { size: 18, desc: "XYZ+Intensity+Timestamp (4.5 floats)" },
      { size: 20, desc: "XYZ+Intensity+Timestamp+Ring (5 floats)" },
      { size: 22, desc: "XYZ+Intensity+Timestamp+Ring+Extra (5.5 floats)" },
      { size: 24, desc: "XYZ+Intensity+Timestamp+Ring+Extra2 (6 floats)" },
      { size: 32, desc: "XYZ+Intensity+Timestamp+Ring+Extra3 (8 floats)" }
    ];

    // 检测文件格式
    let pointSize = 0;
    let formatDesc = "";
    
    // 检查每种可能的格式
    for (const format of possibleFormats) {
      const remainder = byteSize % format.size;
      if (remainder === 0) {
        pointSize = format.size;
        formatDesc = format.desc;
        break;
      }
    }

    // 如果没有找到匹配的格式，尝试其他可能性
    if (pointSize === 0) {
      // 检查是否有接近的匹配
      const closeMatches = possibleFormats.filter(format => {
        const remainder = byteSize % format.size;
        return remainder < 4 || remainder > format.size - 4;
      });

      if (closeMatches.length > 0) {
        // 使用最接近的匹配
        pointSize = closeMatches[0].size;
        formatDesc = closeMatches[0].desc + " (近似匹配)";
      } else {
        throw new Error("无法识别的点云格式");
      }
    }

    // 解析点云数据
    const numPoints = Math.floor(byteSize / pointSize);
    let validPoints = 0;

    for (let i = 0; i < numPoints; i++) {
      const offset = i * pointSize;
      
      // 确保不会超出边界
      if (offset + 16 > byteSize) {
        console.warn(`点 ${i} 超出数据边界，跳过`);
        continue;
      }

      try {
        const point: Point = {
          x: dataView.getFloat32(offset, true),
          y: dataView.getFloat32(offset + 4, true),
          z: dataView.getFloat32(offset + 8, true),
          intensity: dataView.getFloat32(offset + 12, true)
        };

        // 尝试解析额外数据（如果存在）
        if (pointSize >= 18 && offset + 16 <= byteSize - 2) {
          point.timestamp = dataView.getFloat32(offset + 16, true);
        }
        if (pointSize >= 20 && offset + 20 <= byteSize - 2) {
          point.ring = dataView.getUint16(offset + 20, true);
        }

        points.push(point);
        validPoints++;
      } catch (e) {
        console.warn(`解析点 ${i} 时出错:`, e);
      }
    }

    return points;
  };

  // 处理文件上传
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const parsedPoints = await parseBinFile(arrayBuffer);
      setPoints(parsedPoints);
      setPointCount(parsedPoints.length);
    } catch (err) {
      setError(`文件解析失败: ${err instanceof Error ? err.message : '未知错误'}`);
      console.error('Error parsing bin file:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理标注开始
  const handleAnnotationStart = useCallback((point: THREE.Vector3) => {
    setCurrentAnnotation({
      start: point.clone(),
      end: point.clone()
    });
  }, []);

  // 处理标注移动
  const handleAnnotationMove = useCallback((point: THREE.Vector3) => {
    setCurrentAnnotation(prev => prev ? { ...prev, end: point.clone() } : null);
  }, []);

  // 处理标注结束
  const handleAnnotationEnd = useCallback(() => {
    if (!currentAnnotation) return;

    // 计算立方体的中心和大小
    const center = new THREE.Vector3(
      (currentAnnotation.start.x + currentAnnotation.end.x) / 2,
      (currentAnnotation.start.y + currentAnnotation.end.y) / 2,
      (currentAnnotation.start.z + currentAnnotation.end.z) / 2
    );
    const size = new THREE.Vector3(
      Math.abs(currentAnnotation.end.x - currentAnnotation.start.x),
      Math.abs(currentAnnotation.end.y - currentAnnotation.start.y),
      Math.abs(currentAnnotation.end.z - currentAnnotation.start.z)
    );

    const newAnnotation = {
      id: Date.now().toString(),
      position: center,
      size,
      color: '#00ff00'
    };

    setAnnotations(prev => [...prev, newAnnotation]);
    setCurrentAnnotation(null);
  }, [currentAnnotation]);

  return (
    <div className="preview-3d-cloud" style={{ padding: '0px' }}>
      <div className="controls-panel" style={{ marginBottom: '10px' }}>
        <h2>Hesai LiDAR点云标注</h2>
        <div className="file-upload" style={{ margin: '10px 0' }}>
          <input
            type="file"
            accept=".bin"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            id="bin-file-upload"
          />
          <label
            htmlFor="bin-file-upload"
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'inline-block'
            }}
          >
            选择Hesai LiDAR .bin文件
          </label>
        </div>
        
        {isLoading && <p>正在加载点云数据...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {pointCount > 0 && <p>已加载 {pointCount} 个点</p>}
        
        <button
          onClick={() => setIsAnnotating((prev) => !prev)}
          style={{
            padding: '8px 16px',
            backgroundColor: isAnnotating ? '#ff0000' : '#007bff',
            color: 'white',
            borderRadius: '4px',
            cursor: 'pointer',
            margin: '10px 0'
          }}
        >
          {isAnnotating ? '停止标注' : '开始标注'}
        </button>
      </div>
  
      <div className="img-container" style={{ display: 'flex' }}>
        <div style={{ width: '70%', height: '600px' }}>
          <Canvas>
            <Scene
              points={points}
              isAnnotating={isAnnotating}
              currentAnnotation={currentAnnotation}
              onAnnotationStart={handleAnnotationStart}
              onAnnotationMove={handleAnnotationMove}
              onAnnotationEnd={handleAnnotationEnd}
            />
          </Canvas>
        </div>
        <div style={{ width: '30%', padding: '0px 10px' }}>
          <Annotation2DView annotations={annotations} />
        </div>
      </div>
    </div>
  );
};

export default Preview3DCloudWithFiber;
