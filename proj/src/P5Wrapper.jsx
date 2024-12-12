import { useRef, useEffect } from 'react';
import p5 from 'p5';

const P5Wrapper = ({ sketch, ...setterProps }) => {
  const sketchRef = useRef();
  const p5InstanceRef = useRef(null);

  useEffect(() => {
    // Initialize p5 instance only once
    p5InstanceRef.current = new p5(sketch, sketchRef.current);

    // Pass setter methods
    if (setterProps.undoLastAction) setterProps.undoLastAction(p5InstanceRef.current.undoLastAction);
    if (setterProps.clearLayer) setterProps.clearLayer(p5InstanceRef.current.clearLayer);
    if (setterProps.setBrushSize) setterProps.setBrushSize(p5InstanceRef.current.setBrushSize);
    if (setterProps.setColor) setterProps.setColor(p5InstanceRef.current.setColor);
    if (setterProps.setMode) setterProps.setMode(p5InstanceRef.current.setMode);
    if (setterProps.setOvalness) setterProps.setOvalness(p5InstanceRef.current.setOvalness);
    if (setterProps.setRotation) setterProps.setRotation(p5InstanceRef.current.setRotation);
    if (setterProps.setDripsEnabled) setterProps.setDripsEnabled(p5InstanceRef.current.setDripsEnabled);
    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
      }
    };
  }, [sketch]); // Only re-run if sketch changes

  

  return <div ref={sketchRef}></div>;
};

export default P5Wrapper;
