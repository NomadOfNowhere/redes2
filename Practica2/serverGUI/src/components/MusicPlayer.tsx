import { type Song } from "../types/song";
import React, { useState, useEffect } from 'react';

interface MusicPlayerProps {
  song: Song | null;
  onNext: () => void;
  onPrev: () => void;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ song, onNext, onPrev }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const handleProcessClosed = (code: number) => {
      setIsPlaying(false);
    };
    window.electronAPI.onJavaFinished(handleProcessClosed);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      window.electronAPI.stopJava();
      setIsPlaying(false);
    }
  }, [song]);

  const togglePlayback = () => {
      if (!song) return;

      if (isPlaying) {
        window.electronAPI.stopJava();
        setIsPlaying(false);
      } else {
        window.electronAPI.startServer(song.filepath);
        setIsPlaying(true);
      }
    };

  if (!song) {
    return (
      <div className="music-player">
        <div className="player-empty-state">
          <div className="empty-icon">🎵</div>
          <h4 className="empty-title">Select a song</h4>
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
        <span className="tag-genre">{song.year}</span>
        {/* <span className="tag-duration">{song.duration}</span> */}
      </div>

      <div className="progress-bar-wrapper">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: isPlaying ? '100%' : '0%', transition: 'width 1s ease-in-out' }} 
          />
        </div>
      </div>

      <div className="player-time">
        <span>{isPlaying ? "Enviando..." : "Listo"}</span>
        <span>{song.duration}</span>
      </div>

      <div className="player-controls">
        <button className="control-button control-prev" onClick={onPrev}>
          <i className="bi bi-skip-backward-fill"></i>
        </button>

        <button 
          className={`control-button control-play ${isPlaying ? 'active' : ''}`} 
          onClick={togglePlayback}
        >
          {isPlaying ? (
              <i className="bi bi-pause-fill"></i>
          ) : (
              <i className="bi bi-play-fill"></i>
          )}
        </button>
        <button className="control-button control-next" onClick={onNext}>
          <i className="bi bi-skip-forward-fill"></i>
        </button>
      </div>
    </div>
  );
};
// ⬅ ➡
