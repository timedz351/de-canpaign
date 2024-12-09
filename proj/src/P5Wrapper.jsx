import { useRef, useEffect } from 'react';
import p5 from 'p5';

const P5Wrapper = ({ sketch, onLoad, ...setterProps }) => {
  const sketchRef = useRef();
  const p5InstanceRef = useRef(null);
  const loadCalledRef = useRef(false);

  useEffect(() => {
    // Initialize p5 instance only once
    p5InstanceRef.current = new p5(sketch, sketchRef.current);

    // If the sketch exposes undo/clear etc., we can capture them after init:
    // Call onLoad once if provided
    if (onLoad && !loadCalledRef.current) {
      loadCalledRef.current = true;
      onLoad(p5InstanceRef.current);
    }

    // Pass setter methods
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
