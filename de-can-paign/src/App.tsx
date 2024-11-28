import { useState } from 'react';
import BillboardSelector from './components/BillboardSelector';
import P5Wrapper from './components/P5Wrapper';
import drawingSketch from './sketches/drawingSketch';

const App = () => {
  const [selectedBillboard, setSelectedBillboard] = useState(null);

  return (
    <div>
      {!selectedBillboard ? (
        <BillboardSelector onSelect={setSelectedBillboard} />
      ) : (
        <div>
          <P5Wrapper
            sketch={drawingSketch}
            billboardImage={selectedBillboard}
            width={800}
            height={600}
          />
          <button onClick={() => setSelectedBillboard(null)}>Back to Selection</button>
        </div>
      )}
    </div>
  );
};

export default App;
