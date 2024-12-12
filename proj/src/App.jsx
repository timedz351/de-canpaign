import { Routes, Route } from 'react-router-dom';
import PaintingPage from './components/PaintingPage';
import GalleryPage from './components/GalleryPage';

const App = () => {
  return (
    <div>
      {/* <nav style={{ margin: '10px' }}>
        <Link to="/" style={{ marginRight: '10px' }}>Painting</Link>
        <Link to="/gallery">Gallery</Link>
      </nav> */}

      <Routes>
        <Route path="/" element={<PaintingPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
      </Routes>
    </div>
  );
};

export default App;
