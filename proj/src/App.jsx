import { useState } from 'react';
import { ReactP5Wrapper } from 'react-p5-wrapper';
import sketch from './sketch';
import BillboardSelector from './components/BillboardSelector';

const App = () => {
  const [brushSize, setBrushSize] = useState(30);
  const [color, setColor] = useState('#ff0000');
  const [mode, setMode] = useState('spray'); // 'spray' or 'marker'
  const [ovalness, setOvalness] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [dripsEnabled, setDripsEnabled] = useState(true);

  // State for billboard selection
  const [selectedBillboard, setSelectedBillboard] = useState(null);

  // Counters for triggering undo and clear actions inside the sketch
  const [undoCounter, setUndoCounter] = useState(0);
  const [clearCounter, setClearCounter] = useState(0);

  const toggleMode = () => {
    setMode(prev => (prev === 'spray' ? 'marker' : 'spray'));
  };

  const handleUndo = () => {
    setUndoCounter(prev => prev + 1);
  }

  const handleClear = () => {
    setClearCounter(prev => prev + 1);
  }
  
  const handleSaveToServer = () => {
    // Get the canvas element from p5 - by default react-p5-wrapper creates a canvas in the DOM
    const canvas = document.querySelector('canvas'); 
    if (canvas) {
      const dataURL = canvas.toDataURL('image/png'); // Convert canvas to base64 image data
      fetch('http://localhost:3001/save-image', { // Point to your Node server
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataURL })
      })
      .then(res => res.json())
      .then(data => {
        console.log('Image saved:', data);
      })
      .catch(err => {
        console.error('Error saving image:', err);
      });
    }
  };

  // If no billboard selected, show the selector
  if (!selectedBillboard) {
    return <BillboardSelector onSelect={setSelectedBillboard} />;
  }

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

        <div>
          <button onClick={() => setSelectedBillboard(null)}>Back to Selection</button>
        </div>

        <div>
          <button onClick={handleSaveToServer}>Save to Server</button>
        </div>  
      </div>
    </div>
  );
};

export default App;
