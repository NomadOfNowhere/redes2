import { type Song } from '../types/song';

interface SongCardProps {
  song: Song;
  isSelected: boolean;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}

export const SongCard: React.FC<SongCardProps> = ({ 
  song, 
  isSelected, 
  isHovered, 
  onHover, 
  onLeave, 
  onClick 
}) => {
  const cardClass = `song-card ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`;

  return (
    <div 
      className={cardClass}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      <div className="song-card-image-wrapper">
        <img 
          src={song.image} 
          alt={song.title}
          className={`song-card-image ${isHovered ? 'zoomed' : ''}`}
        />
        {(isHovered || isSelected) && (
          <div className="song-card-overlay">
            <div className="play-button">
              <div className="play-icon" />
            </div>
          </div>
        )}
      </div>
      <div className="song-card-body">
        <h6 className="song-card-title">{song.title}</h6>
        <p className="song-card-artist">{song.artist}</p>
      </div>
    </div>
  );
};
