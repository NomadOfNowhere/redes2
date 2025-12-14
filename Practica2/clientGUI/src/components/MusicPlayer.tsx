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
        return 'Listening to server...';
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
            {playerState === 'waiting' ? '📡' : '🎵'}
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

      <style>{`
        /* Animación de transición entre canciones */
        .player-album-art.transitioning {
          opacity: 0;
          transform: scale(0.9);
        }

        .player-album-art.just-received {
          animation: popIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        @keyframes popIn {
          0% {
            opacity: 0;
            transform: scale(0.8) rotate(-5deg);
          }
          50% {
            transform: scale(1.05) rotate(2deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }

        /* Animación de imagen cuando está reproduciendo */
        .album-image {
          transition: transform 0.3s ease;
        }

        .album-image.playing {
          animation: subtleRotate 20s linear infinite;
        }

        @keyframes subtleRotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Overlay de reproducción */
        .playing-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(139, 92, 246, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        /* Barras de sonido animadas */
        .sound-wave {
          display: flex;
          gap: 4px;
          align-items: flex-end;
          height: 40px;
        }

        .sound-wave .bar {
          width: 4px;
          background: white;
          border-radius: 2px;
          animation: soundWave 1s ease-in-out infinite;
        }

        .sound-wave .bar:nth-child(1) {
          animation-delay: 0s;
        }

        .sound-wave .bar:nth-child(2) {
          animation-delay: 0.2s;
        }

        .sound-wave .bar:nth-child(3) {
          animation-delay: 0.4s;
        }

        .sound-wave .bar:nth-child(4) {
          animation-delay: 0.6s;
        }

        @keyframes soundWave {
          0%, 100% {
            height: 10px;
          }
          50% {
            height: 40px;
          }
        }

        /* Animaciones de slide-in para texto */
        .slide-in {
          animation: slideIn 0.5s ease-out;
        }

        .slide-in.delay-1 {
          animation-delay: 0.1s;
          opacity: 0;
          animation-fill-mode: forwards;
        }

        .slide-in.delay-2 {
          animation-delay: 0.2s;
          opacity: 0;
          animation-fill-mode: forwards;
        }

        .slide-in.delay-3 {
          animation-delay: 0.3s;
          opacity: 0;
          animation-fill-mode: forwards;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* Texto "Playing..." pulsante */
        .playing-text {
          animation: textPulse 1.5s ease-in-out infinite;
        }

        @keyframes textPulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        /* Animaciones de iconos */
        .icon-container {
          position: relative;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .icon-animated {
          position: absolute;
          opacity: 0;
          transform: scale(0.5) rotate(-90deg);
          transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .icon-animated.visible {
          opacity: 1;
          transform: scale(1) rotate(0deg);
        }

        .icon-stop.visible {
          animation: stopBounce 0.4s ease-out;
        }

        @keyframes stopBounce {
          0% {
            transform: scale(0.5) rotate(90deg);
            opacity: 0;
          }
          60% {
            transform: scale(1.2) rotate(-5deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        /* Hover en botón */
        .control-button:hover .icon-animated.visible {
          transform: scale(1.15) rotate(5deg);
        }

        /* Estado activo del botón */
        .control-button.active {
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.6);
          animation: glowPulse 2s ease-in-out infinite;
        }

        @keyframes glowPulse {
          0%, 100% {
            box-shadow: 0 0 20px rgba(139, 92, 246, 0.6);
          }
          50% {
            box-shadow: 0 0 30px rgba(139, 92, 246, 0.8);
          }
        }

        /* Ajuste para player-album-art */
        .player-album-art {
          position: relative;
          transition: all 0.3s ease;
        }
      `}</style>
    </div>
  );
};