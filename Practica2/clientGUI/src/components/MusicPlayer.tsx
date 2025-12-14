import { type Song } from "../types/song";
import React, { useState, useEffect } from 'react';
import { extractMetadata } from "../data/extractMetadata";
interface MusicPlayerProps {
  song: Song | null;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ song }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState<Song | null>(song);

  useEffect(() => {
    const handleProcessClosed = (code: number) => {
      setIsPlaying(false);
      console.log(code);
    };
    window.electronAPI.onJavaFinished(handleProcessClosed);
  }, []);
      
  useEffect(() => {
    const handleReceiveSong = async (path: string) => {
      try {
        const safePath = path.replace(/\\/g, '/');
        const url = `media://${safePath}`;
        // const url = encodeURI(path);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error loading ${path}`);
        const blob = await response.blob();
        const songData = await extractMetadata(blob, 0, path);
        console.log("Received song:", path);
        setCurrentSong(songData);
      } catch (error) {
        console.error("Error receiving song:", error);
      }
    };
    window.electronAPI.onSongReceived(handleReceiveSong);
  }, []);

  const togglePlayback = () => {
      if (isPlaying) {
        window.electronAPI.stopJava();
        setIsPlaying(false);
      } else {
        window.electronAPI.startClient();
        setIsPlaying(true);
      }
    };

  if (!currentSong) {
    return (
      <div className="music-player">
        <div className="player-empty-state">
          <div className="empty-icon">🎵</div>
          <h4 className="empty-title">Escuchar servidor</h4>
          <p className="empty-text">Start listening</p>
        </div>
        
      <div className="player-controls">
        <button 
          className={`control-button control-play ${isPlaying ? 'active' : ''}`} 
          onClick={togglePlayback}
        >
          {isPlaying ? (
              <i className="bi bi-stop-fill"></i>
          ) : (
              <i className="bi bi-play-fill"></i>
          )}
        </button>
      </div>
      </div>
    );
  }

  return (
    <div className="music-player">
      <div className="player-album-art">
        <img src={currentSong.image} alt={currentSong.title} className="album-image" />
      </div>
      
      <h3 className="player-song-title">{currentSong.title}</h3>
      <p className="player-artist">{currentSong.artist}</p>
      <p className="player-album">{currentSong.album}</p>

      <div className="player-tags">
        <span className="tag-genre">{currentSong.year}</span>
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
        <span>{isPlaying ? "Reproduciendo..." : "Listo"}</span>
        <span>{currentSong.duration}</span>
      </div>

      <div className="player-controls">
        <button className="control-button control-prev">
          <i className="bi bi-cloud-arrow-down-fill"></i>
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
      </div>
    </div>
  );
};

