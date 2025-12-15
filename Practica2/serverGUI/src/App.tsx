import React, { useState, useEffect } from 'react';
import { type Song, type SortOption } from './types/song';
import { SortDropdown } from './components/SortDropdown'
import { SongsGrid } from './components/SongsGrid';
import { MusicPlayer } from './components/MusicPlayer';
import { MP3_FILES } from './data/songsPath';
import { extractMetadata } from './data/extractMetadata';

const MusicGallery: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('alphabetical');
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadSongs = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        const promises = MP3_FILES.map(async (filepath, index) => {
          const safePath = filepath.replace(/\\/g, '/');
          const url = `media://${safePath}`;
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Error cargando ${filepath}`);
          
          const blob = await response.blob();
          const songData = await extractMetadata(blob, index + 1, filepath);
          return songData;
        });
        const allSongs = await Promise.all(promises);
        setSongs(allSongs);
      } catch (error) {
        console.error("Hubo un error cargando la biblioteca:", error);
      } finally {
        setLoading(false);
      }
    };
    loadSongs();
  }, []);

  const sortedSongs = React.useMemo(() => {
    const sorted = [...songs];
    switch(sortBy) {
      case 'alphabetical':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'artist':
        return sorted.sort((a, b) => a.artist.localeCompare(b.artist));
      case 'album':
        return sorted.sort((a, b) => a.album.localeCompare(b.album));
      case 'year':
        return sorted.sort((a, b) => a.year.localeCompare(b.year));
      case 'duration':
        const toSeconds = (timeStr : string) => {
          const [min, sec] = timeStr.split(':').map(Number);
          return min * 60 + sec;
        }
        return sorted.sort((a, b) => toSeconds(a.duration) - toSeconds(b.duration));
    }
  }, [songs, sortBy]);

  const handleNext = () => {
    if (!selectedSong || sortedSongs.length === 0) return;
    const currentIndex = sortedSongs.findIndex(s => s.id === selectedSong.id);
    const nextIndex = (currentIndex + 1) % sortedSongs.length;
    setSelectedSong(sortedSongs[nextIndex]);
  };

  const handlePrev = () => {
    if (!selectedSong || sortedSongs.length === 0) return;
    const currentIndex = sortedSongs.findIndex(s => s.id === selectedSong.id);
    const prevIndex = (currentIndex - 1 + sortedSongs.length) % sortedSongs.length;
    setSelectedSong(sortedSongs[prevIndex]);
  };

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
          <div className="col-6 col-sm-7 col-md-8 col-lg-8">
            <div className="gallery-header">
              <div className="header-title-section">
                <h1 className="gallery-title">
                  <span className="title-text">Streamify</span>
                  <i className="bi bi-cloud-haze2-fill ms-1"></i>
                </h1>
                <small className="header-subtitle">  
                  powered by UDP!
                </small>
              </div>
              <SortDropdown sortBy={sortBy} onSortChange={setSortBy} />
            </div>
            
            <SongsGrid
              songs={sortedSongs}
              selectedSong={selectedSong}
              hoveredId={hoveredId}
              onSongSelect={setSelectedSong}
              onSongHover={setHoveredId}
            />
          </div>

          <div className="col-6 col-sm-5 col-md-4 col-lg-4">
            <MusicPlayer 
              song={selectedSong}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicGallery;