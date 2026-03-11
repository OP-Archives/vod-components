import { useRef, useEffect, useState, useCallback } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import PlayerControls from './PlayerControls';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import Hls from 'hls.js';
import { toSeconds, sleep } from '../utils/helpers';
import { loadPlayerSettings, savePlayerSettings } from '../utils/playerSettings';
import useMediaQuery from '@mui/material/useMediaQuery';
import canAutoplay from 'can-autoplay';

// Optimized HLS configuration
const hlsConfig = {
  enableWorker: true,
  lowLatencyMode: false,
  backBufferLength: 90,
  maxBufferLength: 30,
  maxMaxBufferLength: 600,
  maxBufferSize: 60 * 1000 * 1000,
  maxBufferHole: 0.5,
  liveSyncDurationCount: 3,
  liveDurationInfinity: false,
  debug: false,
};

export default function Player(props) {
  const { setCurrentTime, type, vod, timestamp, setDelay, setPlayerState, cdnBase, defaultVolume, defaultMuted, theatreMode, setTheatreMode, copyTimestamp, playerRef } = props;
  const hlsInstance = useRef(null);
  const playerContainerRef = useRef(null);
  const timeIntervalRef = useRef(null);
  const [source, setSource] = useState(undefined);
  const [fileError, setFileError] = useState(undefined);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(defaultVolume || 100);
  const [isMuted, setIsMuted] = useState(defaultMuted || false);
  const [currentTime, setCurrentTimeState] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const isTouchDevice = useMediaQuery('(pointer: coarse)');

  const stopLoop = useCallback(() => {
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
      timeIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    const settings = loadPlayerSettings();
    if (settings) {
      setVolume(settings.volume ?? 100);
      setIsMuted(settings.muted ?? false);
    }
  }, []);

  // HLS streaming with MP4 fallback
  useEffect(() => {
    if (type === 'cdn' && source) {
      const hlsUrl = `${cdnBase}/videos/${vod.id}/${vod.id}.m3u8`;
      const mp4Url = `${cdnBase}/videos/${vod.id}.mp4`;

      if (Hls.isSupported()) {
        hlsInstance.current = new Hls(hlsConfig);
        hlsInstance.current.loadSource(hlsUrl);
        hlsInstance.current.attachMedia(playerRef.current);

        hlsInstance.current.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
              case Hls.ErrorTypes.MEDIA_ERROR:
                hlsInstance.current.destroy();
                // Update source to MP4 URL
                setSource(mp4Url);
                playerRef.current.src = mp4Url;
                playerRef.current.load();
                // Auto-play after fallback
                playerRef.current.play().catch(() => {});
                break;
              default:
                hlsInstance.current.destroy();
                setFileError('Failed to load video');
                break;
            }
          }
        });
      } else if (playerRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS (Safari)
        playerRef.current.src = hlsUrl;
      }
    }

    return () => {
      if (hlsInstance.current) hlsInstance.current.destroy();
      stopLoop();
    };
  }, [type, source, cdnBase, vod.id, playerRef, stopLoop]);

  const timeUpdate = useCallback(() => {
    if (!playerRef.current || playerRef.current.paused) return;
    const currentTime = playerRef.current.currentTime ?? 0;
    setCurrentTimeState(currentTime);
  }, [playerRef]);

  const startLoop = useCallback(() => {
    if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
    timeIntervalRef.current = setInterval(timeUpdate, 1000);
  }, [timeUpdate]);

  const fileChange = (evt) => {
    setFileError(null);
    const file = evt.target.files[0];

    if (!file || !file.type.match(/video\//)) {
      return setFileError('Please select a valid video file');
    }

    // Revoke previous object URL
    if (source && typeof source === 'object' && source.objectUrl) {
      URL.revokeObjectURL(source.objectUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setSource({ src: objectUrl, type: file.type, objectUrl });
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (source && typeof source === 'object' && source.objectUrl) {
        URL.revokeObjectURL(source.objectUrl);
      }
    };
  }, [source]);

  const toggleFullscreen = useCallback(() => {
    if (!playerRef.current) return;

    if (!document.fullscreenElement && !document.webkitIsFullScreen) {
      if (playerContainerRef.current.requestFullscreen) {
        playerContainerRef.current.requestFullscreen();
      } else if (playerContainerRef.current.webkitRequestFullscreen) {
        playerContainerRef.current.webkitRequestFullscreen();
      }

      if (isTouchDevice) {
        window.screen.orientation.lock('landscape').catch((e) => console.error(e));
      }

      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
      setIsFullscreen(false);
    }
  }, [playerRef, isTouchDevice]);

  const togglePlayPause = useCallback(() => {
    if (!playerRef.current) return;
    if (playerRef.current.paused) {
      playerRef.current.play();
    } else {
      playerRef.current.pause();
    }
  }, [playerRef]);

  const toggleMute = useCallback(() => {
    if (!playerRef.current) return;
    playerRef.current.muted = !playerRef.current.muted;
    setIsMuted(playerRef.current.muted);
  }, [playerRef]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }

      switch (e.code) {
        case 'Space':
        case 'KeyK':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'KeyM':
          toggleMute();
          break;
        case 'KeyF':
          toggleFullscreen();
          break;
        case 'ArrowRight':
          if (playerRef.current) playerRef.current.currentTime += 5;
          break;
        case 'ArrowLeft':
          if (playerRef.current) playerRef.current.currentTime -= 5;
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (playerRef.current) {
            playerRef.current.volume = Math.min(1, playerRef.current.volume + 0.1);
            playerRef.current.muted = false;
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (playerRef.current) {
            playerRef.current.volume = Math.max(0, playerRef.current.volume - 0.1);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerRef, toggleFullscreen, toggleMute, togglePlayPause]);

  const handleVolumeChange = (event, newValue) => {
    if (!playerRef.current) return;
    playerRef.current.muted = newValue === 0 ? true : false;
    playerRef.current.volume = newValue / 100;
  };

  const playerOnVolumeChange = () => {
    savePlayerSettings({ volume: playerRef.current.volume, muted: playerRef.current.muted });
    setVolume(playerRef.current.volume);
    setIsMuted(playerRef.current.muted);
  };

  const handleSeekChange = (event, newValue) => {
    if (playerRef.current) {
      playerRef.current.currentTime = newValue;
      setCurrentTimeState(newValue);
    }
  };

  const handlePlaybackSpeedChange = (speed) => {
    if (!playerRef.current) return;
    setPlaybackSpeed(speed);
    playerRef.current.playbackRate = speed;
  };

  const handleError = (_e) => {
    const video = playerRef.current;
    if (!video || !video.error) return;

    switch (video.error.code) {
      case video.error.MEDIA_ERR_FORMAT:
        setFileError('This video format is not supported by your browser');
        break;
      case video.error.MEDIA_ERR_DECODE:
        setFileError('Failed to decode the video file - it may be corrupted or use an unsupported codec');
        break;
      case video.error.MEDIA_ERR_NETWORK:
        setFileError('Network error while loading the video - please check your connection');
        break;
      case video.error.MEDIA_ERR_ABORTED:
        setFileError('Video loading was aborted');
        break;
      default:
        setFileError(`An error occurred while playing the video (Error code: ${video.error.code})`);
    }
  };

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    setPlayerState(1);
    timeUpdate();
    startLoop();
  }, [timeUpdate, startLoop, setPlayerState]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    setPlayerState(2);
    stopLoop();
  }, [stopLoop, setPlayerState]);

  const handleEnded = () => setPlayerState(0);
  const handleWaiting = () => setPlayerState(3);
  const handlePlaying = () => setPlayerState(1);

  const handleTimeUpdate = () => {
    if (playerRef.current) {
      setCurrentTime(playerRef.current.currentTime);
      setCurrentTimeState(playerRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    const duration = playerRef.current.duration;
    setDuration(duration);

    const vodDuration = toSeconds(vod.duration);
    const tmpDelay = vodDuration - duration < 0 ? 0 : vodDuration - duration;
    setDelay(tmpDelay);
  };

  // Autoplay with mute fallback
  useEffect(() => {
    if (source && playerRef.current) {
      canAutoplay.video({ inline: true }).then(async (obj) => {
        if (obj.result) return (playerRef.current.muted = isMuted);

        let mutedAutoplay = await canAutoplay.video({ muted: true, inline: true });
        if (mutedAutoplay.result) return (playerRef.current.muted = true);

        setIsPlaying(false);
      });
    }
  }, [source, playerRef, isMuted]);

  useEffect(() => {
    if (!source || !playerRef.current) return;

    // Handle manual file uploads and CDN MP4 fallback
    if (type === 'manual') {
      playerRef.current.src = source.src;
    } else if (typeof source === 'string' && source.endsWith('.mp4')) {
      playerRef.current.src = source;
    }

    const set = async () => {
      let playerDuration = playerRef.current.duration;
      while (isNaN(playerDuration) || playerDuration === 0) {
        playerDuration = playerRef.current.duration;
        await sleep(100);
      }
      const vodDuration = toSeconds(vod.duration);
      const tmpDelay = vodDuration - playerDuration < 0 ? 0 : vodDuration - playerDuration;
      setDelay(tmpDelay);
      setDuration(playerDuration);
    };

    set();
  }, [source, type, setDelay, vod.duration, playerRef]);

  useEffect(() => {
    if (!playerRef.current || timestamp === undefined || !source) return;
    playerRef.current.currentTime = timestamp;
  }, [timestamp, source, playerRef]);

  const toggleTheatreMode = () => {
    setTheatreMode(!theatreMode);
  };

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      {type === 'manual' && !source && (
        <Paper sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
          {fileError && <Alert severity="error">{fileError}</Alert>}
          <Box sx={{ mt: 1 }}>
            <Button variant="contained" component="label">
              Select Video
              <input type="file" hidden onChange={fileChange} accept="video/*,.mkv" />
            </Button>
          </Box>
        </Paper>
      )}

      <Box
        ref={playerContainerRef}
        sx={{
          visibility: !source ? 'hidden' : 'visible',
          height: '100%',
          width: '100%',
          outline: 'none',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer',
        }}
        onDoubleClick={toggleFullscreen}
        onClick={() => playerRef.current?.focus()}
      >
        {/* Native video element */}
        <video
          ref={playerRef}
          playsInline
          autoPlay
          tabIndex="-1"
          poster={vod.thumbnail_url}
          preload="auto"
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
          onWaiting={handleWaiting}
          onPlaying={handlePlaying}
          onError={handleError}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onVolumeChange={playerOnVolumeChange}
          style={{ height: '100%', width: '100%' }}
        />

        {/* Play overlay */}
        {!isPlaying && (
          <Box
            onClick={togglePlayPause}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.5)',
              cursor: 'pointer',
            }}
          >
            <PlayArrowIcon sx={{ fontSize: 80, color: 'white' }} />
          </Box>
        )}

        {/* Controls */}
        <PlayerControls
          isPlaying={isPlaying}
          volume={volume}
          isMuted={isMuted}
          currentTime={currentTime}
          duration={duration}
          theatreMode={theatreMode}
          isFullscreen={isFullscreen}
          playbackSpeed={playbackSpeed}
          onTogglePlayPause={togglePlayPause}
          onVolumeChange={handleVolumeChange}
          onSeekChange={handleSeekChange}
          onToggleMute={toggleMute}
          onToggleTheatreMode={toggleTheatreMode}
          onToggleFullscreen={toggleFullscreen}
          playerContainerRef={playerContainerRef}
          onPlaybackSpeedChange={handlePlaybackSpeedChange}
          onCopyTimestamp={copyTimestamp}
        />
      </Box>
    </Box>
  );
}
