// PaintingPage.jsx
import { useState } from 'react';
import { ReactP5Wrapper } from 'react-p5-wrapper';
import sketch from '../sketch';
import BillboardSelector from './BillboardSelector';

// Import your mode icons
import sprayIcon from '../assets/spray-icon.png';
import markerIcon from '../assets/marker-icon.png';
import eggIcon from '../assets/egg-icon.png'; // Import the egg icon

const PaintingPage = () => {
  const [brushSize, setBrushSize] = useState(30);
  const [color, setColor] = useState('#ff0000');
  const [mode, setMode] = useState('spray');
  const [ovalness, setOvalness] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [dripsEnabled, setDripsEnabled] = useState(true);
  const [selectedBillboard, setSelectedBillboard] = useState(null);
  const [undoCounter, setUndoCounter] = useState(0);
  const [clearCounter, setClearCounter] = useState(0);

  if (!selectedBillboard) {
    return (
      <BillboardSelector onSelect={setSelectedBillboard} />
    );
  }

  const handleUndo = () => {
    setUndoCounter(prev => prev + 1);
  }

  const handleClear = () => {
    setClearCounter(prev => prev + 1);
  }

  const handleSaveToServer = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const dataURL = canvas.toDataURL('image/png');
      fetch('http://localhost:3001/save-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataURL })
      })
        .then(res => res.json())
        .then(data => {
          console.log('Image saved:', data);
          // Notify gallery to refresh
          const bc = new BroadcastChannel('gallery_channel');
          bc.postMessage('refresh');
          bc.close(); // close channel after use
        })
        .catch(err => {
          console.error('Error saving image:', err);
        });
    }
  };

  // Determine brush visualization styles
  const brushWidth = brushSize; 
  const brushHeight = mode === 'marker' ? brushSize * ovalness : brushSize;
  const brushStyle = {
    width: `${brushWidth}px`,
    height: `${brushHeight}px`,
    backgroundColor: color,
    borderRadius: '50%',
    transform: mode === 'marker' ? `rotate(${rotation + Math.PI /2}rad)` : 'none',
    transition: 'all 0.2s ease',
  };

  return (
    <div className="app-container">
      <ReactP5Wrapper
        sketch={sketch}
        billboardImage={selectedBillboard}
        brushSize={brushSize}
        color={color}
        mode={mode}
        ovalness={ovalness}
        rotation={rotation}
        dripsEnabled={dripsEnabled}
        undoCounter={undoCounter}
        clearCounter={clearCounter}
      />

      <div className="controls-container">
        {/* Column 1: Mode Buttons */}
        <div className="column mode-buttons-column">
          <div className="mode-buttons-container">
            <button 
              className={`mode-button ${mode === 'spray' ? 'active-mode-button' : ''}`}
              onClick={() => setMode('spray')}
              aria-label="Spray Mode"
            >
              <img src={sprayIcon} alt="Spray Mode" />
            </button>
            <button 
              className={`mode-button ${mode === 'marker' ? 'active-mode-button' : ''}`}
              onClick={() => setMode('marker')}
              aria-label="Marker Mode"
            >
              <img src={markerIcon} alt="Marker Mode" />
            </button>
            <button 
              className={`mode-button ${mode === 'egg' ? 'active-mode-button' : ''}`}
              onClick={() => setMode('egg')}
              aria-label="Egg Mode"
            >
              <img src={eggIcon} alt="Egg Mode" />
            </button>
          </div>
        </div>

        {/* Column 2: Sliders (Hide when mode is 'egg') */}
        {mode !== 'egg' && (
          <div className="column sliders-column">
            <div className="slider-container">
              <label>Brush Size: {brushSize}</label><br/>
              <input
                type="range"
                min="2"
                max="100"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
              />
            </div>
            {mode === 'marker' && (
              <>
                <div className="slider-container">
                  <label>Ovalness: {Math.round(ovalness * 100)}%</label><br/>
                  <input
                    type="range"
                    min="0.3"
                    max="1"
                    step="0.01"
                    value={ovalness}
                    onChange={(e) => setOvalness(parseFloat(e.target.value))}
                  />
                </div>

                <div className="slider-container">
                  <label>Rotation: {(rotation * (180 / Math.PI)).toFixed()}°</label><br/>
                  <input
                    type="range"
                    min="0"
                    max={Math.PI / 2}
                    step="0.01"
                    value={rotation}
                    onChange={(e) => setRotation(parseFloat(e.target.value))}
                  />
                </div>

                <div className="custom-checkbox-wrapper">
                  <input
                    type="checkbox"
                    id="drips-checkbox"
                    className="custom-checkbox"
                    checked={dripsEnabled}
                    onChange={(e) => setDripsEnabled(e.target.checked)}
                  />
                  <label htmlFor="drips-checkbox" className="custom-checkbox-label">
                    Drips
                  </label>
                </div>
              </>
            )}
          </div>
        )}

        {/* Column 3: Color Picker and Brush Visualization (Hide when mode is 'egg') */}
        {mode !== 'egg' && (
          <div className="column color-brush-column">
            <div className="color-picker-container">
              <label>Color:</label><br/>
              <div className="custom-color-picker">
                <input
                  type="color"
                  className="color-picker"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
                <span className="color-display" style={{ backgroundColor: color }}></span>
              </div>
            </div>
            <div className="brush-visualization-container">
              <div className="brush-visualization">
                <div style={brushStyle}></div>
              </div>
            </div>
          </div>
        )}

        {/* Column 4: Other Buttons */}
        <div className="column other-buttons-column">
          <div className="other-controls-container">
            <button onClick={handleUndo}>Undo (Z)</button>
            <button onClick={handleClear}>Clear (C)</button>
            <button onClick={() => setSelectedBillboard(null)}>Back to Selection</button>
            <button onClick={handleSaveToServer}>Save to Server</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaintingPage;
