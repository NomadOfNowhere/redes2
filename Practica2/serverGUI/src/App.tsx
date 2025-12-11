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
    const loadAllSongs = async () => {
      try {
        const promises = MP3_FILES.map(async (filePath, index) => {
          // 1. Preparamos la URL
          // encodeURI es vital aquí porque tus rutas ya tienen "/" 
          // (encodeURIComponent rompería las barras, encodeURI respeta las barras pero codifica espacios y tildes)
          const url = encodeURI(filePath);
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Error cargando ${filePath}`);
          
          const blob = await response.blob();

          // 2. Extraemos los datos
          // Pasamos (index + 1) para que el ID sea 1, 2, 3...
          const songData = await extractMetadata(blob, index + 1);

          return songData;
        });

        // 3. Esperamos a que TODAS terminen y guardamos de una sola vez
        // Esto es mucho más eficiente que hacer setSongs dentro del bucle
        const allSongs = await Promise.all(promises);
        setSongs(allSongs);
      } catch (error) {
        console.error("Hubo un error cargando la biblioteca:", error);
      }
    };

    loadAllSongs();
  }, []);

  useEffect(() => {
    const loadSongs = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Error al cargar las canciones:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSongs();
  }, []);

  const sortedSongs = React.useMemo(() => {
    const sorted = [...songs];
    if (sortBy === 'alphabetical') {
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      return sorted.sort((a, b) => a.year.localeCompare(b.year));
    }
  }, [songs, sortBy]);

  if (loading) {
    return (
      <div className="loading-screen">
        Cargando biblioteca musical...
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
            <MusicPlayer song={selectedSong} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicGallery;