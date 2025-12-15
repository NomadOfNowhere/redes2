import { type Song, type PlayerStatus } from "../types/song";
import React, { useState, useEffect } from 'react';

interface MusicPlayerProps {
  song: Song | null;
  onNext: () => void;
  onPrev: () => void;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ song, onNext, onPrev }) => {
  const [status, setStatus] = useState<PlayerStatus>('idle');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showRefresh, setShowRefresh] = useState(false);

  useEffect(() => {
    const handleProcessClosed = async (code: number) => {
      if (code === 0) {
        // Iniciar transición a 'sent'
        setIsTransitioning(true);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Duración de fade out
        setStatus('sent');
        setShowRefresh(false);
        setIsTransitioning(false);
        
        // Después de 1.5 segundos, mostrar el icono de refresh
        await new Promise(resolve => setTimeout(resolve, 1500));
        setShowRefresh(true);
      } else {
        setStatus('idle');
        setShowRefresh(false);
      }
    };
    window.electronAPI.onJavaFinished(handleProcessClosed);
  }, []);

  useEffect(() => {
    setStatus('idle');
    setShowRefresh(false);
    if (status === 'sending') {
      window.electronAPI.stopJava();
    }
  }, [song]);

  const togglePlayback = () => {
    if (!song) return;

    if (status === 'idle' || status === 'sent') {
      window.electronAPI.startServer(song.filepath);
      setStatus('sending');
    } else {
      window.electronAPI.stopJava();
      setStatus('idle');
    }
  };

  if (!song) {
    return (
      <div className="music-player">
        <div className="player-empty-state">
          <div className="empty-icon">🎵</div>
          <h4 className="empty-title">Select a song</h4>
          <p className="empty-text">Click on any song to start streaming</p>
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
      </div>

      <div className="progress-bar-wrapper">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ 
              width: status === 'sending' ? '100%' : '0%', 
              transition: 'width 1s ease-in-out' 
            }}
          />
        </div>
      </div>

      <div className="player-time">
        <span>
          {status === 'idle' && "Ready"}
          {status === 'sending' && "Sending..."}
          {status === 'sent' && "Completed!"}
        </span>
        <span>{song.duration}</span>
      </div>

      <div className="player-controls">
        <button className="control-button control-prev" onClick={onPrev}>
          <i className="bi bi-skip-start-fill"></i>
        </button>

        <button 
          className={`control-button control-play ${status === 'idle' ? 'active' : ''}`} 
          onClick={togglePlayback}
        >
          <div className="icon-container">
            <i className={`bi bi-cloud-arrow-up-fill icon-animated ${status === 'idle' && !isTransitioning ? 'visible' : ''}`}></i>
            <i className={`bi bi-stop-fill icon-animated ${status === 'sending' && !isTransitioning ? 'visible' : ''}`}></i>
            <i className={`bi bi-cloud-check-fill icon-animated icon-sent ${status === 'sent' && !showRefresh && !isTransitioning ? 'visible' : ''}`}></i>
            <i className={`bi bi-arrow-clockwise icon-animated icon-refresh ${status === 'sent' && showRefresh && !isTransitioning ? 'visible' : ''}`}></i>
          </div>
        </button>

        <button className="control-button control-next" onClick={onNext}>
          <i className="bi bi-skip-end-fill"></i>
        </button>
      </div>
    </div>
  );
};