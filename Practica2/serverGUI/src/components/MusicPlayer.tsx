import { type Song } from "../types/song";

interface MusicPlayerProps {
  song: Song | null;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ song }) => {
  if (!song) {
    return (
      <div className="music-player">
        <div className="player-empty-state">
          <div className="empty-icon">🎵</div>
          <h4 className="empty-title">Selecciona una canción</h4>
          <p className="empty-text">Haz clic en cualquier canción para reproducirla</p>
        </div>
      </div>
    );
  }

  return (
    <div className="music-player">
      <div className="player-album-art">
        <img src={song.image} alt={song.title} className="album-image" />
      </div>

      <h3 className="player-song-title">{song.title}</h3>
      <p className="player-artist">{song.artist}</p>
      <p className="player-album">{song.album}</p>

      <div className="player-tags">
        <span className="tag-genre">{song.genre}</span>
        <span className="tag-duration">{song.duration}</span>
      </div>

      <div className="progress-bar-wrapper">
        <div className="progress-bar">
          <div className="progress-fill" />
        </div>
      </div>

      <div className="player-time">
        <span>1:42</span>
        <span>{song.duration}</span>
      </div>

      <div className="player-controls">
        <button className="control-button control-prev">⏮</button>
        <button className="control-button control-play">▶</button>
        <button className="control-button control-next">⏭</button>
      </div>
    </div>
  );
};
