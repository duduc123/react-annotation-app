import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface Point {
  x: number;
  y: number;
  z: number;
  intensity: number;
  timestamp?: number;
  ring?: number;
}

const Preview3DCloud: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const pointCloudRef = useRef<THREE.Points | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pointCount, setPointCount] = useState(0);
  const [fileInfo, setFileInfo] = useState<{name: string, size: number} | null>(null);
  const [formatInfo, setFormatInfo] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string>('');

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
    
    // 输出调试信息
    const debugMsg = [
      `文件大小: ${byteSize} 字节`,
      `可能的格式检测:`
    ];
    
    // 检查每种可能的格式
    for (const format of possibleFormats) {
      const remainder = byteSize % format.size;
      const isMatch = remainder === 0;
      debugMsg.push(`${format.desc}: ${format.size}字节/点, 余数: ${remainder} ${isMatch ? '✓' : '✗'}`);
      
      if (isMatch) {
        pointSize = format.size;
        formatDesc = format.desc;
      }
    }

    setDebugInfo(debugMsg.join('\n'));

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
        debugMsg.push(`使用近似匹配: ${formatDesc}`);
      } else {
        throw new Error(`无法识别的点云格式。\n${debugMsg.join('\n')}`);
      }
    }

    setFormatInfo(`检测到格式: ${formatDesc} (${pointSize} 字节/点)`);
    console.log(debugMsg.join('\n'));

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

    console.log(`成功解析 ${validPoints}/${numPoints} 个点`);
    return points;
  };

  // 创建点云对象
  const createPointCloud = (points: Point[]) => {
    if (!sceneRef.current) return;

    // 移除旧的点云
    if (pointCloudRef.current) {
      sceneRef.current.remove(pointCloudRef.current);
    }

    // 创建几何体
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

    const rangeX = maxX - minX;
    const rangeY = maxY - minY;
    const rangeZ = maxZ - minZ;
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

    // 创建材质
    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      sizeAttenuation: true
    });

    // 创建点云对象
    pointCloudRef.current = new THREE.Points(geometry, material);
    sceneRef.current.add(pointCloudRef.current);

    // 更新点数
    setPointCount(points.length);

    // 调整相机位置以适应点云大小
    if (cameraRef.current) {
      const center = new THREE.Vector3(
        (minX + maxX) / 2,
        (minY + maxY) / 2,
        (minZ + maxZ) / 2
      );
      const size = Math.max(rangeX, rangeY, rangeZ);
      cameraRef.current.position.set(
        center.x + size * 1.5,
        center.y + size * 1.5,
        center.z + size * 1.5
      );
      cameraRef.current.lookAt(center);
    }
  };

  // 处理文件上传
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setFileInfo({
      name: file.name,
      size: file.size
    });
    setFormatInfo('');
    setDebugInfo('');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const points = await parseBinFile(arrayBuffer);
      createPointCloud(points);
    } catch (err) {
      setError(`文件解析失败: ${err instanceof Error ? err.message : '未知错误'}`);
      console.error('Error parsing bin file:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 初始化场景
  const initScene = () => {
    if (!mountRef.current) return;

    // 创建场景
    sceneRef.current = new THREE.Scene();
    sceneRef.current.background = new THREE.Color(0x0a0a0a);

    // 创建相机
    cameraRef.current = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    cameraRef.current.position.set(5, 5, 5);

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

    // 添加网格辅助
    const gridHelper = new THREE.GridHelper(10, 10);
    sceneRef.current.add(gridHelper);
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
    if (mountRef.current && rendererRef.current?.domElement) {
      mountRef.current.removeChild(rendererRef.current.domElement);
    }
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
    <div className="preview-3d-cloud" style={{ padding: '20px' }}>
      <div className="controls-panel" style={{ marginBottom: '20px' }}>
        <h2>Hesai LiDAR点云预览</h2>
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
        
        {fileInfo && (
          <div style={{ margin: '10px 0' }}>
            <p>文件名: {fileInfo.name}</p>
            <p>文件大小: {(fileInfo.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        )}
        
        {formatInfo && (
          <div style={{ margin: '10px 0' }}>
            <p>{formatInfo}</p>
          </div>
        )}

        {debugInfo && (
          <div style={{ margin: '10px 0' }}>
            <pre style={{ 
              backgroundColor: '#151516ff', 
              padding: '10px', 
              borderRadius: '4px',
              fontSize: '12px',
              whiteSpace: 'pre-wrap'
            }}>
              {debugInfo}
            </pre>
          </div>
        )}
        
        {isLoading && <p>正在加载点云数据...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {pointCount > 0 && <p>已加载 {pointCount} 个点</p>}
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

export default Preview3DCloud;
