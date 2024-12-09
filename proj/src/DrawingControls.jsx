// src/DrawingControls.jsx
import React from 'react';

const DrawingControls = ({ onUndo, onClear }) => {
  return (
    <div className="drawing-controls" style={{ textAlign: 'center', marginTop: '10px' }}>
      <button onClick={onUndo} style={{ marginRight: '10px', padding: '8px 12px' }}>
        Undo
      </button>
      <button onClick={onClear} style={{ padding: '8px 12px' }}>
        Clear
      </button>
    </div>
  );
};

export default DrawingControls;
