import React from 'react';
import LabelWithCanvas from './../components/LabelWithCanvas/LabelWithCanvas';
import './LabelPage.css';

const LabelPage: React.FC = () => {

  return (
    <div>
      <LabelWithCanvas width={600} height={400}/>
    </div>
  );
};

export default LabelPage;
