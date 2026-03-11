import { useEffect, useRef, useState, useCallback } from 'react';
import Youtube from 'react-youtube';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import WidthFullIcon from '@mui/icons-material/WidthFull';
import WidthNormalIcon from '@mui/icons-material/WidthNormal';
import { getResumePosition } from '../utils/positionStorage';
import useMediaQuery from '@mui/material/useMediaQuery';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

export default function YoutubePlayer(props) {
  const { youtube, playerRef, part, setPart, setCurrentTime, setPlayerState, games, origin, setTheatreMode, theatreMode, copyTimestamp } = props;
  const timeIntervalRef = useRef(null);
  const [showControls, setShowControls] = useState(true);
  const playerContainerRef = useRef(null);
  const isTouchDevice = useMediaQuery('(pointer: coarse)');
  const autoHideTimerRef = useRef(null);

  useEffect(() => {
    if (!playerRef.current) return;

    if (games) {
      playerRef.current.loadVideoById(games[part.part - 1].video_id, part.timestamp);
    } else {
      const index = youtube.findIndex((data) => data.part === part.part);
      playerRef.current.loadVideoById(youtube[index !== -1 ? index : part.part - 1].id, part.timestamp);
    }
  }, [part, playerRef, youtube, games]);

  const timeUpdate = useCallback(() => {
    if (!playerRef.current || playerRef.current.getPlayerState() !== 1) return;
    let currentTime = 0;
    if (youtube) {
      for (let video of youtube) {
        if (video.part >= part.part) break;
        currentTime += video.duration;
      }
    }
    currentTime += playerRef.current.getCurrentTime() ?? 0;
    setCurrentTime(currentTime);
  }, [playerRef, youtube, part.part, setCurrentTime]);

  const startLoop = useCallback(() => {
    if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
    timeIntervalRef.current = setInterval(timeUpdate, 1000);
  }, [timeUpdate]);

  const stopLoop = useCallback(() => {
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
      timeIntervalRef.current = null;
    }
  }, []);

  const onReady = (evt) => {
    const player = evt.target;
    playerRef.current = player;

    if (games) {
      playerRef.current.loadVideoById(games[part.part - 1].video_id, part.timestamp);
    } else {
      const index = youtube.findIndex((data) => data.part === part.part);
      player.loadVideoById(youtube[index !== -1 ? index : 0].id, part.timestamp);
    }
  };

  const onPlay = () => {
    timeUpdate();
    startLoop();
  };

  const onPause = () => {
    stopLoop();
  };

  const onEnd = () => {
    const nextPart = part.part + 1;

    if (games) {
      if (nextPart > games.length) return;
      const selectedGameId = games[nextPart - 1].id;
      const savedPosition = getResumePosition(selectedGameId, 'game_');
      let savedTimestamp = 0;
      if (savedPosition !== null) {
        savedTimestamp = savedPosition;
      }
      setPart({ part: nextPart, timestamp: savedTimestamp });
    } else {
      if (nextPart > youtube.length) return;
      setPart({ part: nextPart, timestamp: 0 });
    }
  };

  const onError = (evt) => {
    if (evt.data !== 150) console.error(evt.data);
  };

  useEffect(() => {
    if (isTouchDevice) return;

    const handleMouseMove = () => {
      setShowControls(true);
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = setTimeout(() => {
        if (playerRef.current.getPlayerState() === 1) {
          setShowControls(false);
        }
      }, 3000);
    };

    const handleMouseLeave = () => {
      setShowControls(false);
    };

    const container = playerContainerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
      }
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
      stopLoop();
    };
  }, [isTouchDevice, playerRef, stopLoop]);

  const handleStateChange = (evt) => {
    if (evt.data !== undefined) {
      setPlayerState(evt.data);
    }

    if (evt.data === 1 && isTouchDevice) {
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
    }

    if (evt.data === 2 && isTouchDevice) {
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
      setShowControls(true);
    }
  };

  const toggleTheatreMode = () => {
    setTheatreMode(!theatreMode);
  };

  return (
    <Box
      ref={playerContainerRef}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <Youtube
        className="player"
        opts={{
          height: '100%',
          width: '100%',
          playerVars: {
            autoplay: 1,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            origin: origin || '',
            controls: 1,
            showinfo: 0,
            iv_load_policy: 3,
          },
        }}
        onReady={onReady}
        onPlay={onPlay}
        onPause={onPause}
        onEnd={onEnd}
        onError={onError}
        onStateChange={handleStateChange}
      />

      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: showControls ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: showControls ? 'auto' : 'none',
        }}
      >
        <Tooltip title={theatreMode ? 'Exit Theatre Mode' : 'Theatre Mode'}>
          <IconButton onClick={toggleTheatreMode} color="inherit" sx={{ height: 32, width: 32 }}>
            {theatreMode ? <WidthNormalIcon fontSize="small" /> : <WidthFullIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title={`Copy Current Timestamp`}>
          <IconButton onClick={copyTimestamp} color="inherit" aria-label="Copy Current Timestamp" rel="noopener noreferrer" target="_blank">
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
