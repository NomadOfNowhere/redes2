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
        Loading music library...
      </div>
    );
  }

  return (
    <div className="music-gallery">
      <div className="container-fluid music-container">
        <div className="row">
          <div className="col-lg-8">
            <div className="gallery-header">
              <h1 className="gallery-title">Mi Biblioteca Musical</h1>
            </div>
            <div className="col-lg-4">
            <MusicPlayer song={null}
            />
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicGallery;