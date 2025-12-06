import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { type Song, type SortOption } from './types/song';
import { SortDropdown } from './components/SortDropdown'
import { SongsGrid } from './components/SongsGrid';
import { MusicPlayer } from './components/MusicPlayer';
import songsData from './data/songs.json';

export const SONGS_DATA: Song[] = songsData as Song[];

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
        setSongs(SONGS_DATA);
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
      return sorted.sort((a, b) => a.genre.localeCompare(b.genre));
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