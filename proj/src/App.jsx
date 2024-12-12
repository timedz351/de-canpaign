import { Routes, Route } from 'react-router-dom';
import PaintingPage from './components/PaintingPage';
import GalleryPage from './components/GalleryPage';
import { useEffect } from 'react';

const App = () => {
  useEffect(() => {
    const handleContextMenu = (event) => {
      event.preventDefault();
    };

    document.addEventListener('contextmenu', handleContextMenu);
    
    // Cleanup to avoid memory leaks
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);
  
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
