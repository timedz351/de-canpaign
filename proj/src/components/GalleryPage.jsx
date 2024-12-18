import { useEffect, useState } from "react";

const GalleryPage = () => {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchImages = () => {
    fetch("http://localhost:3001/images-list")
      .then(res => res.json())
      .then(data => {
        setImages(data);
        setCurrentIndex(0); // Reset index when new images are fetched
      })
      .catch(err => console.error("Error fetching image list:", err));
  };

  useEffect(() => {
    fetchImages();

    const bc = new BroadcastChannel('gallery_channel');
    bc.onmessage = (event) => {
      if (event.data === 'refresh') {
        fetchImages();
      }
    };

    return () => {
      bc.close();
    };
  }, []);

  useEffect(() => {
    if (images.length > 1) {
      // Automatically advance the carousel every 5 seconds
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
      }, 3800);

      return () => clearInterval(interval);
    }
  }, [images]);

  const containerStyle = {
    display: 'flex',
    flexDirection: 'row',
    transition: 'transform 0.8s ease',
    transform: `translateX(-${currentIndex * 100}vw)`,
    width: `${images.length * 100}vw`,
    height: '100vh',
    overflow: 'hidden',
  };

  const imageStyle = {
    width: '100vw',
    height: '100vh',
    objectFit: 'contain', // show entire image, may have empty space
    background: '#000',    // give a background for contrast if there's empty space
    flexShrink: 0,
  };

  if (images.length === 0) {
    return <div style={{ textAlign: 'center', marginTop: '20px' }}>No images found.</div>;
  }

  return (
    <div style={{ overflow: 'hidden', width: '100vw', height: '100vh' }}>
      <div style={containerStyle}>
        {images.map((image, idx) => (
          <img
            key={idx}
            src={`http://localhost:3001/saved_images/${image}`}
            alt=""
            style={imageStyle}
          />
        ))}
      </div>
    </div>
  );
};

export default GalleryPage;
