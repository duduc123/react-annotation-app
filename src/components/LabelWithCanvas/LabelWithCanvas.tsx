import React, { useCallback, useState } from 'react';
import { generateUUID } from '../../common/utils';
import box from '../../assets/box.svg';
import circle from '../../assets/circle.svg';
import polygon from '../../assets/polygon.svg';

export type Shape = {
  type: 'rect' | 'circle' | 'polygon';
  id: string;
  label: string;
  pointList: { x: number; y: number }[]; // 多边形时，保存所有顶点坐标
};

interface LabelWithCanvasProps {
  width?: number;
  height?: number;
}

/**
 * 一个带有Canvas功能的React组件，用于在图片上绘制矩形、圆形和多边形
 * @param width - Canvas的宽度
 * @param height - Canvas的高度
 */
const LabelWithCanvas: React.FC<LabelWithCanvasProps> = ({ width, height }) => {
  // 创建canvas元素的引用
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  // 是否正在绘制的状态
  const [isDrawing, setIsDrawing] = useState(false);
  // 当前绘制的图形类型（矩形、圆形或多边形）
  const [drawType, setDrawType] = useState<'rect' | 'circle' | 'polygon'>('rect');
  // 绘制起始位置
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  // 当前正在绘制的图形
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  // 已绘制的所有图形列表
  const [shapes, setShapes] = useState<Shape[]>([]);
  // 线条颜色（默认红色）
  const [lineColor] = useState<string>('#FF0000');
  // 线条宽度（默认2像素）
  const [lineWidth] = useState<number>(2);
  // 保存已加载图片对象
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

  const [polygonPoints, setPolygonPoints] = useState<{ x: number; y: number }[]>([]);
  const [isPolygonDrawing, setIsPolygonDrawing] = useState(false);

  // 获取鼠标在canvas上的位置
  const getMousePosition = (event: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }
  }

  // 绘制所有已保存的框和当前预览框，先绘制图片再绘制标注
  const redraw = useCallback((previewShape?: Shape) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (imageObj) ctx.drawImage(imageObj, 0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;
    shapes.forEach(shape => {
      switch (shape.type) {
        case 'rect':
          ctx.strokeRect(shape.pointList[0].x, shape.pointList[0].y, shape.pointList[1].x - shape.pointList[0].x, shape.pointList[1].y - shape.pointList[0].y);
          break;
        case 'circle':
          ctx.beginPath();
          ctx.ellipse(
            shape.pointList[0].x + (shape.pointList[1].x - shape.pointList[0].x) / 2,
            shape.pointList[0].y + (shape.pointList[1].y - shape.pointList[0].y) / 2,
            Math.abs(shape.pointList[1].x - shape.pointList[0].x) / 2,
            Math.abs(shape.pointList[1].y - shape.pointList[0].y) / 2,
            0, 0, 2 * Math.PI
          );
          ctx.stroke();
          break;
        case 'polygon':
          ctx.beginPath();
          ctx.moveTo(shape.pointList[0].x, shape.pointList[0].y);
          for (let i = 1; i < shape.pointList.length; i++) {
            ctx.lineTo(shape.pointList[i].x, shape.pointList[i].y);
          }
          ctx.closePath();
          ctx.stroke();
          break;
      }
    });
    if (previewShape) {
      ctx.strokeStyle = '#00FF00';
      switch (previewShape.type) {
        case 'rect':
          ctx.strokeRect(previewShape.pointList[0].x, previewShape.pointList[0].y, previewShape.pointList[1].x - previewShape.pointList[0].x, previewShape.pointList[1].y - previewShape.pointList[0].y);
          break;
        case 'circle':
          ctx.beginPath();
          ctx.ellipse(
            previewShape.pointList[0].x + (previewShape.pointList[1].x - previewShape.pointList[0].x) / 2,
            previewShape.pointList[0].y + (previewShape.pointList[1].y - previewShape.pointList[0].y) / 2,
            Math.abs(previewShape.pointList[1].x - previewShape.pointList[0].x) / 2,
            Math.abs(previewShape.pointList[1].y - previewShape.pointList[0].y) / 2,
            0, 0, 2 * Math.PI
          );
          ctx.stroke();
          break;
        case 'polygon': 
          ctx.beginPath();
          ctx.moveTo(previewShape.pointList[0].x, previewShape.pointList[0].y);
          for (let i = 1; i < previewShape.pointList.length; i++) {
            ctx.lineTo(previewShape.pointList[i].x, previewShape.pointList[i].y);
          }
          if (!isPolygonDrawing) { // 如果正在绘制多边形，不闭合路径，显示预览线
            ctx.closePath();
          }
          ctx.stroke();

          ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
          previewShape.pointList.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
            ctx.fill();
          });
          break;
      }
      ctx.strokeStyle = lineColor; // 恢复原始颜色
    }
  }, [shapes, imageObj, lineColor, lineWidth, isPolygonDrawing]);

  // 鼠标按下，开始绘制
  const startDrawing = (event: React.MouseEvent) => {
    const { x, y } = getMousePosition(event);

    // 如果是多边形，添加新的顶点
    if (drawType === 'polygon') {
      const newPoints = [...polygonPoints, { x, y }];
      setIsPolygonDrawing(true);
      setPolygonPoints(newPoints);

      // 创建预览形状
      if (newPoints.length >= 2) {
        const previewShape: Shape = {
          type: 'polygon',
          id: generateUUID(),
          label: "desk",
          pointList: newPoints
        }
        setCurrentShape(previewShape);
      }
    } else {
      setIsDrawing(true);
      setStartPos({ x, y });
      setCurrentShape(null);
    }
  };

  // 鼠标移动，预览框
  const draw = (event: React.MouseEvent) => {
    const { x, y } = getMousePosition(event);
    if (drawType === 'polygon' && isPolygonDrawing && polygonPoints.length > 0) {
      // const lastPoint = polygonPoints[polygonPoints.length - 1];
      const previewShape: Shape = {
        type: 'polygon',
        id: generateUUID(),
        label: "desk",
        pointList: [...polygonPoints, { x, y }]
      };
      setCurrentShape(previewShape);
      redraw(previewShape);
    } else if (isDrawing && startPos && drawType !== 'polygon') {
      const previewShape = { 
        type: drawType,
        id: generateUUID(),
        label: "desk",
        pointList: [
          {x:startPos.x, y:startPos.y},
          {x, y}
        ]
      };
      setCurrentShape(previewShape);
      redraw(previewShape);
    }
  };

  // 鼠标松开，保存框
  const stopDrawing = () => {
    if (drawType === 'polygon') {
      // 多边形模式下，鼠标松开不完成整个多边形，只是更新预览
      // 多边形完成需要双击或按完成按钮
      if (currentShape) redraw(currentShape); // 保存多边形
    }
    if (isDrawing && currentShape) {
      setShapes(prev => [...prev, currentShape]);
    }
    setIsDrawing(false);
    setStartPos(null);
    setCurrentShape(null);
    redraw();
  };

  // 每次 shapes/imageObj/lineColor/lineWidth 变化都重绘
  React.useEffect(() => {
    redraw();
  }, [redraw]);

  // 图片上传：通过handleImageChange函数处理用户上传的图片文件，
  // 将其读取为DataURL并在canvas上绘制

  // 添加一个完成多边形的函数
  const completePolygon = () => {
    if (drawType === 'polygon' && polygonPoints.length >= 3) {
      const newShape: Shape = { 
        type: 'polygon',
        id: generateUUID(),
        label: "desk",
        pointList: polygonPoints
      };
      setShapes(prev => [...prev, newShape]);
    }
    setIsPolygonDrawing(false);
    setPolygonPoints([]);
    // setCurrentShape(null);
    redraw();
  };

  const cancelPolygon = () => {
    setIsPolygonDrawing(false);
    setPolygonPoints([]);
    setCurrentShape(null);
    redraw();
  }

  // 图片加载完成后设置canvas尺寸和图片对象，重绘标注
  const handleImageLoad = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    const canvasctx = canvasRef.current?.getContext('2d');
    if (!canvas || !canvasctx) return;
    canvasctx.clearRect(0, 0, canvas.width, canvas.height);
    setShapes([]);
    const dpr = window.devicePixelRatio || 1; //  坐标转换未考虑设备像素比
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.style.width = img.width + 'px';
    canvas.style.height = img.height + 'px';
    canvasctx.setTransform(dpr, 0, 0, dpr, 0, 0);// 用于设置当前的变换矩阵（包括缩放、旋转、平移等），影响后续所有绘图操作。
    setImageObj(img);
    setTimeout(() => redraw(), 0);
  }, [redraw]);

  // 负责处理文件输入框的变化事件，当用户选择文件时触发
  const handleImageChange = useCallback((event: React.ChangeEvent) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    console.log('handleImageChange reader', reader);
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => handleImageLoad(img);
      img.onerror = () => {
        console.error('Failed to load image');
      };
      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  }, [handleImageLoad]);

  const handleLabelChange = (id: string, newLabel: string) => {
    setShapes(prevShapes =>
      prevShapes.map(shape =>
        shape.id === id ? { ...shape, label: newLabel } : shape
      )
    );
  };

  return (
    <div>
      <h1>React Canvas Label Page</h1>
      <div className='label-page'>
        <div className='settings-container'>
          <ul>
            <li><button><img src={box} alt="Box" onClick={() => setDrawType('rect')} /></button></li>
            <li><button><img src={circle} alt="Circle" onClick={() => setDrawType('circle')} /></button></li>
            <li><button><img src={polygon} alt="Polygon" onClick={() => setDrawType('polygon')} /></button></li>
          </ul>
          {drawType === 'polygon' && isPolygonDrawing && (
            <div>
              <button onClick={completePolygon}>完成多边形</button>
              <button onClick={cancelPolygon}>取消多边形</button>
            </div>
          )}
        </div>
        <div className='canvas-container'>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            onMouseDown={startDrawing}
            onMouseUp={stopDrawing}
            onMouseMove={draw}
            style={{ border: '1px solid black', cursor: 'crosshair'}}
          />
        </div>
        <div className='output-container'>
          <strong>已绘制框：</strong>
          <ul>
            {shapes.map((shape) => (
              <li key={shape.id}>
                <label>{"Label: "}
                  <input type="text" value={shape.label} onChange={(e) => handleLabelChange(shape.id, e.target.value)} />
                </label>
                <label>{"Details: "} 
                </label>
                <textarea readOnly value={JSON.stringify(shape)} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>);
};

export default LabelWithCanvas;
