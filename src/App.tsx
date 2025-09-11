import React from 'react'
import { BrowserRouter, Routes, Route, } from 'react-router-dom';
import Navbar from './pages/Navbar';
// import { Link } from 'react-router';
import './App.css'
import LabelPage from './pages/LabelPage';
import WebGLPage from './pages/webGLPage';
import HomePage from './pages/HomePage';
import ThreePage from './pages/ThreePage';
import NativeThreeDemo1 from './components/ThreeScene/NativeThreeDemo1';
import NativeThreeDemo2 from './components/ThreeScene/NativeThreeDemo2';
import Preview3DCloud from './components/ThreeScene/Preview3DCloud';
import MockBinGenerator from './components/ThreeScene/MockBinGenerator';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
        <div className='content-container'>
          <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/labelpage" element={<LabelPage />} />
          <Route path="/three" element={<ThreePage />} />
          <Route path="/three/demo1" element={<NativeThreeDemo1 />} />
          <Route path="/three/demo2" element={<NativeThreeDemo2 />} />
          <Route path="/three/preview" element={<Preview3DCloud />} />
          <Route path="/three/mockbin" element={<MockBinGenerator />} />
          <Route path="/webgl" element={<WebGLPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
