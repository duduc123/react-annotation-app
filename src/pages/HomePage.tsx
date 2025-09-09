import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="home-page">
      <h1>Welcome to Label Application</h1>
      <div className="label-section">
        <Link to="/labelpage">Label Image with Canvas</Link>
      </div>
      <div className="webgl-section">
        <Link to="/webgl">WebGL Page</Link>
      </div>
    </div>
  );
}
export default HomePage;
