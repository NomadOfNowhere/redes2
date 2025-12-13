import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
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
          // 1. Preparamos la URL
          // encodeURI es vital aquí porque tus rutas ya tienen "/" 
          // (encodeURIComponent rompería las barras, encodeURI respeta las barras pero codifica espacios y tildes)
          const url = encodeURI(filepath);
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Error cargando ${filepath}`);
          
          const blob = await response.blob();

          // 2. Extraemos los datos
          // Pasamos (index + 1) para que el ID sea 1, 2, 3...
          const songData = await extractMetadata(blob, index + 1, "public" + filepath);
          return songData;
        });

        // 3. Esperamos a que TODAS terminen y guardamos de una sola vez
        // Esto es mucho más eficiente que hacer setSongs dentro del bucle
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

    // 1. Buscamos dónde está la canción actual
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

          <div className="col-lg-4">
            <MusicPlayer song={selectedSong}
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