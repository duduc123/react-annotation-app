import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { TransformControls } from "three/examples/jsm/controls/TransformControls";

type LabelType = "车辆" | "树木" | "行人";
type Annotation = {
  label: LabelType;
  position: [number, number, number];
  size: [number, number, number];
  yaw: number;
  id: string;
};

const LABELS: LabelType[] = ["车辆", "树木", "行人"];
const Label3DCloud: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedLabel, setSelectedLabel] = useState<LabelType>("车辆");
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const boxesRef = useRef<{ [id: string]: THREE.Mesh }>({});
  const controlsRef = useRef<TransformControls | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const pointsRef = useRef<THREE.Points | null>(null);

  // 初始化 Three.js 场景
  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 20);
    cameraRef.current = camera;
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // 点云示例（可替换为实际数据）
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array([0,0,0, 5,5,5, -5,-5,-5]);
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const points = new THREE.Points(geometry, new THREE.PointsMaterial({ size: 0.5, color: 0x00ffcc }));
    scene.add(points);
    pointsRef.current = points;

    // TransformControls
    const controls = new TransformControls(camera, renderer.domElement);
    controlsRef.current = controls;
    scene.add(controls);
    controls.addEventListener("objectChange", () => {
      if (selectedBoxId && boxesRef.current[selectedBoxId]) {
        const box = boxesRef.current[selectedBoxId];
        setAnnotations(prev => prev.map(a => a.id === selectedBoxId ? {
          ...a,
          position: [box.position.x, box.position.y, box.position.z],
          size: [box.scale.x * 4, box.scale.y * 2, box.scale.z * 2],
          yaw: box.rotation.y,
        } : a));
      }
    });

    // 鼠标点击交互，添加新框
    renderer.domElement.addEventListener("dblclick", (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      if (pointsRef.current) {
        const intersects = raycaster.intersectObject(pointsRef.current);
        if (intersects.length > 0) {
          const p = intersects[0].point;
          const id = Date.now().toString();
          const boxGeometry = new THREE.BoxGeometry(4, 2, 2);
          const boxMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
          const box = new THREE.Mesh(boxGeometry, boxMaterial);
          box.position.copy(p);
          scene.add(box);
          boxesRef.current[id] = box;
          setAnnotations(prev => [...prev, {
            label: selectedLabel,
            position: [p.x, p.y, p.z],
            size: [4, 2, 2],
            yaw: 0,
            id,
          }]);
          setSelectedBoxId(id);
          controls.attach(box);
        }
      }
    });

    // 选中框（单击）
    renderer.domElement.addEventListener("click", (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const intersectBoxes = Object.values(boxesRef.current).map(box => raycaster.intersectObject(box)).flat();
      if (intersectBoxes.length > 0) {
        const box = intersectBoxes[0].object as THREE.Mesh;
        const id = Object.entries(boxesRef.current).find(([k, v]) => v === box)?.[0];
        if (id) {
          setSelectedBoxId(id);
          controls.attach(box);
        }
      } else {
        controls.detach();
        setSelectedBoxId(null);
      }
    });

    setSceneReady(true);

    // 动画循环
    const animate = () => {
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  // 属性编辑表单
  const handleChange = (field: keyof Annotation, value: any) => {
    if (!selectedBoxId) return;
    setAnnotations(prev => prev.map(a => {
      if (a.id !== selectedBoxId) return a;
      const newAnn = { ...a, [field]: value };
      // 同步到 Three.js 立体框
      const box = boxesRef.current[selectedBoxId];
      if (box) {
        if (field === "position") box.position.set(...value);
        if (field === "size") box.scale.set(value[0] / 4, value[1] / 2, value[2] / 2);
        if (field === "yaw") box.rotation.y = value;
      }
      return newAnn;
    }));
  };

  // 删除框
  const handleDeleteBox = () => {
    if (!selectedBoxId) return;
    const box = boxesRef.current[selectedBoxId];
    if (box && sceneRef.current) {
      sceneRef.current.remove(box);
      delete boxesRef.current[selectedBoxId];
      setAnnotations(prev => prev.filter(a => a.id !== selectedBoxId));
      setSelectedBoxId(null);
      if (controlsRef.current) controlsRef.current.detach();
    }
  };

  // 切换标签
  const handleLabelChange = (label: LabelType) => {
    setSelectedLabel(label);
    if (selectedBoxId) {
      setAnnotations(prev => prev.map(a => a.id === selectedBoxId ? { ...a, label } : a));
    }
  };

  const handlePointCloudUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const buffer = await file.arrayBuffer();
  const floatArray = new Float32Array(buffer);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(floatArray, 3));
  const material = new THREE.PointsMaterial({ size: 0.5, color: 0x00ffcc });
  const points = new THREE.Points(geometry, material);

  // 替换场景中的点云
  if (sceneRef.current) {
    if (pointsRef.current) sceneRef.current.remove(pointsRef.current);
    sceneRef.current.add(points);
    pointsRef.current = points;
  }
};

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <div style={{ position: "absolute", top: 10, left: 10, zIndex: 10, background: "#1505eeff", padding: 10, minWidth: 260 }}>
        <input type="file" accept=".bin" onChange={handlePointCloudUpload} /><br />
        <div>标签：
          <select value={selectedLabel} onChange={e => handleLabelChange(e.target.value as LabelType)}>
            {LABELS.map(label => <option key={label} value={label}>{label}</option>)}
          </select>
        </div>
        {selectedBoxId && (() => {
          const ann = annotations.find(a => a.id === selectedBoxId);
          if (!ann) return null;
          return (
            <div style={{ marginTop: 10 }}>
              <div>位置:
                <input type="number" value={ann.position[0]} onChange={e => handleChange("position", [Number(e.target.value), ann.position[1], ann.position[2]])} />
                <input type="number" value={ann.position[1]} onChange={e => handleChange("position", [ann.position[0], Number(e.target.value), ann.position[2]])} />
                <input type="number" value={ann.position[2]} onChange={e => handleChange("position", [ann.position[0], ann.position[1], Number(e.target.value)])} />
              </div>
              <div>尺寸:
                <input type="number" value={ann.size[0]} onChange={e => handleChange("size", [Number(e.target.value), ann.size[1], ann.size[2]])} />
                <input type="number" value={ann.size[1]} onChange={e => handleChange("size", [ann.size[0], Number(e.target.value), ann.size[2]])} />
                <input type="number" value={ann.size[2]} onChange={e => handleChange("size", [ann.size[0], ann.size[1], Number(e.target.value)])} />
              </div>
              <div>Yaw:
                <input type="number" value={ann.yaw} onChange={e => handleChange("yaw", Number(e.target.value))} />
              </div>
              <button style={{ marginTop: 8 }} onClick={handleDeleteBox}>删除当前框</button>
            </div>
          );
        })()}
        <div style={{ marginTop: 10 }}>
          <b>标注列表：</b>
          <ul>
            {annotations.map(a => (
              <li key={a.id} style={{ background: a.id === selectedBoxId ? "#eee" : "#fff", cursor: "pointer" }} onClick={() => setSelectedBoxId(a.id)}>
                {a.label} | 位置: {a.position.map(n => n.toFixed(2)).join(",")} | 尺寸: {a.size.map(n => n.toFixed(2)).join(",")} | Yaw: {a.yaw.toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div ref={mountRef} style={{ width: "100vw", height: "100vh" }} />
    </div>
  );
};

export default Label3DCloud;