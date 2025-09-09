import React from 'react'
import { BrowserRouter, Routes, Route, NavLink, } from 'react-router-dom';
import Navbar from './pages/Navbar';
// import { Link } from 'react-router';
import './App.css'
import LabelPage from './pages/LabelPage';
import WebGLPage from './pages/webGLPage';
import HomePage from './pages/HomePage';
import ThreePage from './pages/ThreePage';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
        <div className='content-container'>
          <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/labelpage" element={<LabelPage />} />
          <Route path="/three" element={<ThreePage />} />
          <Route path="/webgl" element={<WebGLPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
