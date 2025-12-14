import React, { useState, useEffect } from 'react';
import { MusicPlayer } from './components/MusicPlayer';

const MusicGallery: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadSongs = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error("Hubo un error cargando la biblioteca:", error);
      } finally {
        setLoading(false);
      }
    };
    loadSongs();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading music library...</p>
      </div>
    );
  }

  return (
    <div className="music-gallery">
      <div className="container-fluid music-container">
        <div className="row">
          <div className="col-lg-8">
            <div className="header-section">
              <h1 className="gallery-title">
                Streamify
                <i className="bi bi-cloud-fog2-fill ms-2"></i>
              </h1>
              <div className="powered-by">
                <span className="powered-text">powered by UDP!</span>
              </div>
            </div>
            <div className="col-12 col-sm-12 col-md-12 col-lg-12">
              <MusicPlayer song={null} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicGallery;