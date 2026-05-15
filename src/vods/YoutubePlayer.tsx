import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WidthFullIcon from '@mui/icons-material/WidthFull';
import WidthNormalIcon from '@mui/icons-material/WidthNormal';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import useMediaQuery from '@mui/material/useMediaQuery';
import canAutoplay from 'can-autoplay';
import { useEffect, useRef, useState, useCallback } from 'react';
import Youtube from 'react-youtube';
import type { VODUpload, GameEntry, PartInfo, PlayerState } from '../types';
import { getResumePosition } from '../utils/positionStorage';

interface YoutubePlayerProps {
  youtube?: VODUpload[];
  playerRef: React.RefObject<unknown>;
  part: PartInfo | null;
  setPart?: (part: PartInfo | null) => void;
  setCurrentTime: (time: number) => void;
  setPlayerState: (state: PlayerState) => void;
  games?: GameEntry[];
  origin?: string;
  setTheatreMode: (v: boolean) => void;
  theatreMode: boolean;
  copyTimestamp: () => void;
}

export default function YoutubePlayer(props: YoutubePlayerProps) {
  const {
    youtube,
    playerRef,
    part,
    setPart,
    setCurrentTime,
    setPlayerState,
    games,
    origin,
    setTheatreMode,
    theatreMode,
    copyTimestamp,
  } = props;
  const timeIntervalRef = useRef<number | null>(null);
  const [showControls, setShowControls] = useState(true);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const isTouchDevice = useMediaQuery('(pointer: coarse)');
  const autoHideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!playerRef.current) return;

    if (games) {
      (playerRef.current as { loadVideoById: (id: string, time?: number) => void }).loadVideoById(
        games[part!.part - 1].video_id,
        part!.timestamp
      );
    } else {
      const index = youtube!.findIndex((data) => data.part === part!.part);
      (playerRef.current as { loadVideoById: (id: string, time?: number) => void }).loadVideoById(
        youtube![index !== -1 ? index : part!.part - 1].upload_id,
        part!.timestamp
      );
    }
  }, [part, playerRef, youtube, games]);

  const timeUpdate = useCallback(() => {
    if (!playerRef.current || (playerRef.current as { getPlayerState: () => number }).getPlayerState() === 1) return;
    let currentTime = 0;
    if (youtube) {
      for (let video of youtube) {
        if (video.part! >= part!.part) break;
        currentTime += video.duration ?? 0;
      }
    }
    currentTime += (playerRef.current as { getCurrentTime: () => number }).getCurrentTime() ?? 0;
    setCurrentTime(currentTime);
  }, [playerRef, youtube, part, setCurrentTime]);

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

  useEffect(() => {
    return () => {
      stopLoop();
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
    };
  }, [stopLoop]);

  const onReady = (evt: { target: unknown }) => {
    const player = evt.target;
    playerRef.current = player;

    canAutoplay.video().then(({ result }: { result: boolean }) => {
      if (!result && playerRef.current) (player as { mute: () => void }).mute();
    });

    if (games) {
      (player as { loadVideoById: (id: string, time?: number) => void }).loadVideoById(
        games[part!.part - 1].video_id,
        part!.timestamp
      );
    } else {
      const index = youtube!.findIndex((data) => data.part === part!.part);
      (player as { loadVideoById: (id: string, time?: number) => void }).loadVideoById(
        youtube![index !== -1 ? index : 0].upload_id,
        part!.timestamp
      );
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
    const nextPart = part!.part + 1;

    if (games) {
      if (nextPart > games.length) return;
      const selectedGameId = games[nextPart - 1].id;
      const savedPosition = getResumePosition(selectedGameId, 'game_');
      let savedTimestamp = 0;
      if (savedPosition !== null) {
        savedTimestamp = savedPosition;
      }
      setPart?.({ part: nextPart, timestamp: savedTimestamp });
    } else {
      if (nextPart > youtube!.length) return;
      setPart?.({ part: nextPart, timestamp: 0 });
    }
  };

  const onError = (evt: { data: number }) => {
    if (evt.data !== 150) console.error(evt.data);
  };

  const handlePointerMove = () => {
    setShowControls(true);
    if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
    autoHideTimerRef.current = setTimeout(() => {
      if ((playerRef.current as { getPlayerState: () => number })?.getPlayerState() === 1) {
        setShowControls(false);
      }
    }, 3000);
  };

  const handlePointerLeave = () => {
    setShowControls(false);
  };

  const handleStateChange = (evt: { data: number }) => {
    if (evt.data !== undefined) {
      setPlayerState(evt.data as PlayerState);
    }

    if (evt.data === 1) {
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
      onPointerMove={isTouchDevice ? undefined : handlePointerMove}
      onPointerLeave={isTouchDevice ? undefined : handlePointerLeave}
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

      {!isTouchDevice && !showControls && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            pointerEvents: 'auto',
            background: 'transparent',
          }}
        />
      )}

      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2,
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
        {!games && (
          <Tooltip title={`Copy Current Timestamp`}>
            <IconButton onClick={copyTimestamp} color="inherit" aria-label="Copy Current Timestamp" component="button">
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}
