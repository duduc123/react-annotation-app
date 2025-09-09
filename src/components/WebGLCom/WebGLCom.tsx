import React from 'react';

/**
 * WebGLCom组件：在canvas上使用WebGL绘制一个简单的红色三角形
 * 使用React的useRef和useEffect钩子来管理canvas元素和WebGL上下文
设置了canvas的尺寸，使其适应父容器
创建了顶点着色器和片段着色器，其中片段着色器输出红色
定义了三角形的三个顶点位置
创建了顶点缓冲区并将顶点数据传入
设置了WebGL的视口和清除颜色
使用着色器程序并绑定顶点数据
绘制了三角形
此外，我还添加了两个辅助函数：

initShaderProgram: 用于初始化着色器程序
loadShader: 用于加载和编译着色器
最后，我调整了canvas的样式，使其占满整个容器，并添加了一个边框以便于查看。

这个组件现在会在canvas上绘制一个红色的三角形，位于黑色背景上。三角形顶部分别位于顶部中间、左下和右下。
 */
const WebGLCom: React.FC = () => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const gl = canvas.getContext('webgl');
      if (!gl) {
        console.error('WebGL not supported');
        return;
      }

      // 设置canvas尺寸
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);

      // 顶点着色器源码
      const vsSource = `
        attribute vec4 aVertexPosition;
        void main(void) {
          gl_Position = aVertexPosition;
        }`;
      
      // 片段着色器源码
      const fsSource = `
        precision mediump float;
        void main(void) {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // 红色
      }`;

      // 创建着色器程序
      const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

      const programInfo = {
        attribLocations: {
          vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
        }
      };

      // 三角形的顶点位置
      const positions = [
        0.0, 0.5, // 顶部顶点
        -0.5, -0.5, // 左下顶点
        0.5, -0.5, // 右下顶点
      ];

      // 创建顶点缓冲区
      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

      // 清空画布
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // 使用着色器程序
      gl.useProgram(shaderProgram);
      // 启用顶点属性数组
      gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

      // 绑定顶点缓冲区
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

      // 告诉属性如何从缓冲区读取数据
      gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        2,         // 每个顶点有两个分量（x, y）
        gl.FLOAT,  // 数据类型
        false,     // 是否归一化
        0,         // 步长
        0          // 偏移量
      );

      // 绘制三角形
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    
    }
}, []);

// 初始化着色器程序的辅助函数
  const initShaderProgram = (gl: WebGLRenderingContext, vsSource: string, fsSource: string) => {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram = gl.createProgram();
    if (!shaderProgram || !vertexShader || !fragmentShader) {
      console.error('Unable to create shader program');
      return null;
    }

    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
      return null;
    }

    return shaderProgram;
  };

  // 加载着色器的辅助函数
  const loadShader = (gl: WebGLRenderingContext, type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) {
      console.error('Unable to create shader');
      return null;
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  };

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <canvas 
        ref={canvasRef} 
        style={{ width: '100%', height: '100%', border: '1px solid black' }}
      />
    </div>
  );
}

export default WebGLCom;