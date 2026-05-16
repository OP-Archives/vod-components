import canAutoplay from 'can-autoplay';
import { Copy, Maximize2, Minimize2, Check } from 'lucide-react';
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
  const localPlayerRef = useRef<unknown>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const autoHideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches);
  }, []);

  useEffect(() => {
    if (localPlayerRef.current) {
      // eslint-disable-next-line react-compiler/react-compiler -- syncing external ref is required for parent access
      (playerRef as React.MutableRefObject<unknown>).current = localPlayerRef.current;
    }
  }, [localPlayerRef.current]);

  useEffect(() => {
    if (!localPlayerRef.current) return;

    if (games) {
      (localPlayerRef.current as { loadVideoById: (id: string, time?: number) => void }).loadVideoById(
        games[part!.part - 1].video_id,
        part!.timestamp
      );
    } else {
      const index = youtube!.findIndex((data) => data.part === part!.part);
      (localPlayerRef.current as { loadVideoById: (id: string, time?: number) => void }).loadVideoById(
        youtube![index !== -1 ? index : part!.part - 1].upload_id,
        part!.timestamp
      );
    }
  }, [part, playerRef, youtube, games]);

  const timeUpdate = useCallback(() => {
    if (!localPlayerRef.current || (localPlayerRef.current as { getPlayerState: () => number }).getPlayerState() === 1)
      return;
    let currentTime = 0;
    if (youtube) {
      for (let video of youtube) {
        if (video.part! >= part!.part) break;
        currentTime += video.duration ?? 0;
      }
    }
    currentTime += (localPlayerRef.current as { getCurrentTime: () => number }).getCurrentTime() ?? 0;
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
    localPlayerRef.current = player;

    canAutoplay.video().then(({ result }: { result: boolean }) => {
      if (!result && localPlayerRef.current) (player as { mute: () => void }).mute();
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

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyTimestamp();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handlePointerMove = () => {
    setShowControls(true);
    if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
    autoHideTimerRef.current = setTimeout(() => {
      if ((localPlayerRef.current as { getPlayerState: () => number })?.getPlayerState() === 1) {
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
    <div
      ref={playerContainerRef}
      onPointerMove={isTouchDevice ? undefined : handlePointerMove}
      onPointerLeave={isTouchDevice ? undefined : handlePointerLeave}
      className="relative w-full h-full overflow-hidden"
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

      {!isTouchDevice && !showControls && <div className="absolute inset-0 z-10 pointer-events-auto bg-transparent" />}

      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center"
        style={{
          opacity: showControls ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: showControls ? ('auto' as const) : ('none' as const),
        }}
      >
        <button
          onClick={toggleTheatreMode}
          className="text-white hover:text-gray-300 transition-colors flex items-center justify-center"
          style={{ height: 32, width: 32 }}
          title={theatreMode ? 'Exit Theatre Mode' : 'Theatre Mode'}
        >
          {theatreMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
        {!games && (
          <button
            onClick={handleCopy}
            className="text-white hover:text-gray-300 transition-colors flex items-center justify-center"
            style={{ height: 32, width: 32 }}
            title={copied ? 'Copied!' : 'Copy Current Timestamp'}
            aria-label="Copy Current Timestamp"
          >
            {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}
