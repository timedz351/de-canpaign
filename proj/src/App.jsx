import { useState, useRef, useEffect } from 'react';
import P5Wrapper from './P5Wrapper';
import sketch from './sketch';

const App = () => {
  // States for parameters
  const [brushSize, setBrushSize] = useState(30);
  const [color, setColor] = useState('#ff0000');
  const [mode, setMode] = useState('spray'); // 'spray' or 'marker'
  const [ovalness, setOvalness] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [dripsEnabled, setDripsEnabled] = useState(true);


  // Refs to p5 setter functions and methods
  const setBrushSizeRef = useRef(null);
  const setColorRef = useRef(null);
  const setModeRef = useRef(null);
  const setOvalnessRef = useRef(null);
  const setRotationRef = useRef(null);
  const setDripsEnabledRef = useRef(null);
  const undoLastActionRef = useRef(null)
  const clearLayerRef = useRef(null)

  // Update p5 parameters when states change
  useEffect(() => {
    if (setBrushSizeRef.current) setBrushSizeRef.current(brushSize);
  }, [brushSize]);

  useEffect(() => {
    if (setColorRef.current) setColorRef.current(color);
  }, [color]);

  useEffect(() => {
    if (setModeRef.current) setModeRef.current(mode);
  }, [mode]);

  useEffect(() => {
    if (setOvalnessRef.current) setOvalnessRef.current(ovalness);
  }, [ovalness]);

  useEffect(() => {
    if (setRotationRef.current) setRotationRef.current(rotation);
  }, [rotation]);

  useEffect(() => {
    if (setDripsEnabledRef.current) setDripsEnabledRef.current(dripsEnabled);
  }, [dripsEnabled]);

  const toggleMode = () => {
    setMode(prev => (prev === 'spray' ? 'marker' : 'spray'));
  };

  const handleUndo = () => {
    if (undoLastActionRef.current) {
      undoLastActionRef.current();
    };
  }

  const handleClear = () => {
    if (clearLayerRef.current) {
      clearLayerRef.current();

    };
  }

  return (
    <div
      className="app-container"
    >
      <P5Wrapper
        sketch={sketch}
        setBrushSize={(fn) => (setBrushSizeRef.current = fn)}
        setColor={(fn) => (setColorRef.current = fn)}
        setMode={(fn) => (setModeRef.current = fn)}
        setOvalness={(fn) => (setOvalnessRef.current = fn)}
        setRotation={(fn) => (setRotationRef.current = fn)}
        setDripsEnabled={(fn) => (setDripsEnabledRef.current = fn)}
        undoLastAction={(fn) => (undoLastActionRef.current = fn)}
        clearLayer={(fn) => (clearLayerRef.current = fn)}

      />

      <div
        className="controls-container"
      >
        <div>
          <div>
            <label>Brush Size: {brushSize}</label><br/>
            <input
              type="range"
              min="2"
              max="100"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
            />
            {mode === 'marker' && (
            <>
              <div>
                <label>Ovalness: {ovalness}</label><br/>
                <input
                  type="range"
                  min="0.3"
                  max="1"
                  step="0.01"
                  value={ovalness}
                  onChange={(e) => setOvalness(parseFloat(e.target.value))}
                />
              </div>

              <div>
                <label>Rotation: {rotation.toFixed(2)}</label><br/>
                <input
                  type="range"
                  min="0"
                  max={Math.PI}
                  step="0.01"
                  value={rotation}
                  onChange={(e) => setRotation(parseFloat(e.target.value))}
                />
              </div>

              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={dripsEnabled}
                    onChange={(e) => setDripsEnabled(e.target.checked)}
                  /> Drips
                </label>
              </div>
            </>
          )}
          </div>
        </div>

        <div>
          <label>Color:</label><br/>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>

        <div>
          <button onClick={toggleMode}>
            Switch to {mode === 'spray' ? 'Marker' : 'Spray'}
          </button>
          <p>Current Mode: {mode}</p>
        </div>

        <div style={{ display: 'block', gap: '20px' }}>
          <button onClick={handleUndo}>Undo (Z)</button>
          <button onClick={handleClear}>Clear (C)</button>
        </div>
      </div>
    </div>
  );
};

export default App;