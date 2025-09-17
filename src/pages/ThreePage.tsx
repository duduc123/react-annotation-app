import React from 'react';
// import ThreeScene from '../components/ThreeScene/ThreeScene';
import NativeThreeDemo1 from '../components/ThreeScene/NativeThreeDemo1';
import PointCloudAnnotation from '../components/ThreeScene/PointCloudAnnotation';
import Label3DCloud from '../components/ThreeScene/Label3DCloud';
import Preview3DCloud from '../components/ThreeScene/Preview3DCloud';
import MockBinGenerator from '../components/ThreeScene/MockBinGenerator';
import Preview3DCloudWithFiber from '../components/ThreeScene/Preview3DCloudWithFiber';

const ThreePage: React.FC = () => {

  return (
    <div>
      {/* <h1>Three.js Page</h1> */}
      {/* <PointCloudAnnotation /> */}
      <Preview3DCloud />
      {/* <NativeThreeDemo1 /> */}
      {/* <ThreeScene /> */}
      {/* <Label3DCloud /> */}
      {/* <MockBinGenerator /> */}
    </div>
  );
};

export default ThreePage;