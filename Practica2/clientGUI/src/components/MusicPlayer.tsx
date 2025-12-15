import { type Song } from "../types/song";
import React, { useState, useEffect } from 'react';
import { extractMetadata } from "../data/extractMetadata";

type PlayerState = 'idle' | 'waiting' | 'playing';

interface MusicPlayerProps {
  song: Song | null;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ song }) => {
  const [playerState, setPlayerState] = useState<PlayerState>('idle');
  const [currentSong, setCurrentSong] = useState<Song | null>(song);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [justReceived, setJustReceived] = useState(false);

  useEffect(() => {
    const handleProcessClosed = (code: number) => {
      setPlayerState('idle');
      setCurrentSong(null);
      console.log(code);
    };
    window.electronAPI.onJavaFinished(handleProcessClosed);
  }, []);
      
  useEffect(() => {
    const handleReceiveSong = async (path: string) => {
      try {
        const safePath = path.replace(/\\/g, '/');
        const url = `media://${safePath}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error loading ${path}`);
        const blob = await response.blob();
        const songData = await extractMetadata(blob, 0, path);
        console.log("Received song:", path);
        
        // Trigger animation
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentSong(songData);
          setPlayerState('playing');
          setJustReceived(true);
          setIsTransitioning(false);
        }, 300);
        
        // Remove "just received" animation after it plays
        setTimeout(() => setJustReceived(false), 1000);
      } catch (error) {
        console.error("Error receiving song:", error);
        setPlayerState('idle');
      }
    };
    window.electronAPI.onSongReceived(handleReceiveSong);
  }, []);

  const togglePlayback = () => {
    if (playerState === 'idle') {
      window.electronAPI.startClient();
      setPlayerState('waiting');
    } else if (playerState === 'waiting' || playerState === 'playing') {
      window.electronAPI.stopJava();
      setPlayerState('idle');
      setCurrentSong(null);
    }
  };

  const getStateMessage = () => {
    switch (playerState) {
      case 'idle':
        return 'Ready to stream';
      case 'waiting':
        return 'Waiting for server...';
      case 'playing':
        return 'Now playing!';
      default:
        return '';
    }
  };

  if (!currentSong) {
    return (
      <div className="music-player">
        <div className={`player-empty-state ${playerState === 'waiting' ? 'waiting' : ''}`}>
          <div className={`empty-icon ${playerState === 'waiting' ? 'pulse-rotate' : ''}`}>
            {playerState === 'waiting' ? 
              <i className="bi bi-music-player-fill"></i> :
              <i className="bi bi-music-note-beamed"></i> 
            }
            
          </div>
          <h4 className="empty-title">
            {playerState === 'waiting' ? 'Waiting for stream...' : 'Stream a song!'}
          </h4>
          <p className="empty-text">{getStateMessage()}</p>
          
          {playerState === 'waiting' && (
            <div className="waiting-dots">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          )}
        </div>
        
        <div className="player-controls">
          <button 
            className={`control-button control-play ${playerState !== 'idle' ? 'active' : ''}`} 
            onClick={togglePlayback}
          >
            <div className="icon-container">
              <i 
                className={`bi bi-cloud-arrow-down-fill icon-animated ${playerState === 'idle' ? 'visible' : ''}`}
              ></i>
              <i 
                className={`bi bi-hourglass-split icon-animated icon-waiting ${playerState === 'waiting' ? 'visible' : ''}`}
              ></i>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="music-player">
      <div className={`player-album-art ${justReceived ? 'just-received' : ''} ${isTransitioning ? 'transitioning' : ''}`}>
        <img 
          src={currentSong.image} 
          alt={currentSong.title} 
          className={`album-image ${playerState === 'playing' ? 'playing' : ''}`} 
        />
        {playerState === 'playing' && (
          <div className="playing-overlay">
            <div className="sound-wave">
              <span className="bar"></span>
              <span className="bar"></span>
              <span className="bar"></span>
              <span className="bar"></span>
            </div>
          </div>
        )}
      </div>

      <h3 className={`player-song-title ${justReceived ? 'slide-in' : ''}`}>
        {currentSong.title}
      </h3>
      <p className={`player-artist ${justReceived ? 'slide-in delay-1' : ''}`}>
        {currentSong.artist}
      </p>
      <p className={`player-album ${justReceived ? 'slide-in delay-2' : ''}`}>
        {currentSong.album}
      </p>

      <div className={`player-tags ${justReceived ? 'slide-in delay-3' : ''}`}>
        <span className="tag-genre">{currentSong.year}</span>
      </div>

      <div className="progress-bar-wrapper">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ 
              width: playerState === 'playing' ? '100%' : '0%', 
              transition: 'width 1s ease-in-out' 
            }} 
          />
        </div>
      </div>

      <div className="player-time">
        <span className={playerState === 'playing' ? 'playing-text' : ''}>
          {getStateMessage()}
        </span>
        <span>{currentSong.duration}</span>
      </div>

      <div className="player-controls">
        <button 
          className={`control-button control-play ${playerState === 'playing' ? 'active' : ''}`} 
          onClick={togglePlayback}
        >
          <div className="icon-container">
            <i 
              className={`bi bi-stop-fill icon-animated icon-stop ${playerState !== 'idle' ? 'visible' : ''}`}
            ></i>
          </div>
        </button>
      </div>
    </div>
  );
};