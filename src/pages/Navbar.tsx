import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <div className="navbar-container">
      <div className="label-section">
        <Link to="/">Home Page</Link>
      </div>
      <div className="label-section">
        <Link to="/aichat">AI Chat</Link>
      </div>
      <div className="label-section">
        <Link to="/labelpage">Label Image with Canvas</Link>
      </div>
      <div className="three-section">
        <Link to="/three">Label 3D Cloud with Three.js</Link>
      </div>
      <div className="three-section">
        <Link to="/three/demo1">Demo1</Link>
      </div>
      <div className="three-section">
        <Link to="/three/demo2">Demo2</Link>
      </div>
      <div className="webgl-section">
        <Link to="/webgl">WebGL Page</Link>
      </div>
    </div>
  );
}
export default Navbar;
