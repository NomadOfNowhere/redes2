import { type Song } from '../types/song';
import { SongCard } from './SongCard';

interface SongsGridProps {
  songs: Song[];
  selectedSong: Song | null;
  hoveredId: number | null;
  onSongSelect: (song: Song) => void;
  onSongHover: (id: number | null) => void;
}

export const SongsGrid: React.FC<SongsGridProps> = ({ 
  songs, 
  selectedSong, 
  hoveredId, 
  onSongSelect, 
  onSongHover 
}) => {
  return (
    <div className="row g-3">
      {songs.map((song) => (
        <div key={song.id} className="col-6 col-sm-4 col-md-3 col-lg-2">
          <SongCard
            song={song}
            isSelected={selectedSong?.id === song.id}
            isHovered={hoveredId === song.id}
            onHover={() => onSongHover(song.id)}
            onLeave={() => onSongHover(null)}
            onClick={() => onSongSelect(song)}
          />
        </div>
      ))}
    </div>
  );
};