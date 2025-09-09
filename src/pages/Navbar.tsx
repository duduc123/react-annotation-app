import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <div className="navbar-container">
      <div className="label-section">
        <Link to="/">Home Page</Link>
      </div>
      <div className="label-section">
        <Link to="/labelpage">Label Image with Canvas</Link>
      </div>
      <div className="three-section">
        <Link to="/three">Three.js Page</Link>
      </div>
      <div className="webgl-section">
        <Link to="/webgl">WebGL Page</Link>
      </div>
    </div>
  );
}
export default Navbar;
