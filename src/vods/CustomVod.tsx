import { useEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import type { VOD, PlayerState } from '../types';
import { convertTimestamp } from '../utils/helpers';
import Loading from '../utils/Loading';
import { getResumePosition, saveResumePosition, clearResumePosition } from '../utils/positionStorage';
import BaseVod from './BaseVod';
import Chat from './Chat';

export interface CustomVodProps {
  archiveApiBase: string;
  channel: string;
  logo: string;
  cdnBase?: string;
  type?: 'cdn' | 'manual';
  twitchId: number;
}

export default function CustomVod(props: CustomVodProps) {
  const { archiveApiBase, channel, logo, cdnBase, twitchId } = props;
  const location = useLocation();
  const { vodId } = useParams<{ vodId: string }>();
  const [vod, setVod] = useState<VOD | undefined>(undefined);
  const [timestamp, setTimestamp] = useState<number | undefined>(undefined);
  const [delay, setDelay] = useState(0);
  const [userChatDelay, setUserChatDelay] = useState(0);
  const [playerState, setPlayerState] = useState<PlayerState>(-1);
  const playerRef = useRef<HTMLVideoElement | null>(null);
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(orientation: portrait)');
    setIsPortrait(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsPortrait(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const abortController = new AbortController();

    document.title = `${vodId} - ${channel}`;
    const fetchVod = async () => {
      try {
        await fetch(`${archiveApiBase}/${channel}/vods/${vodId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: abortController.signal,
        })
          .then((response) => response.json())
          .then((response) => {
            if (!response.success) {
              throw response;
            }
            return response.data;
          })
          .then((data) => {
            setVod(data);
          })
          .catch((e) => {
            if (e.name !== 'AbortError') {
              console.error(e);
            }
          });
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          console.error(e);
        }
      }
    };
    fetchVod();
    return () => {
      abortController.abort();
    };
  }, [vodId, archiveApiBase, channel]);

  useEffect(() => {
    console.info(`Chat Delay: ${userChatDelay + delay} seconds`);
    return;
  }, [userChatDelay, delay]);

  useEffect(() => {
    if (!vodId) return;

    const search = new URLSearchParams(location.search);
    const timestampQuery = search.get('t');
    const timestampValue = timestampQuery !== null ? convertTimestamp(timestampQuery) : 0;
    if (timestampValue > 0) {
      setTimestamp(timestampValue);
    } else {
      const savedPosition = getResumePosition(vodId);
      if (savedPosition !== null && savedPosition > 0) {
        console.info(`Resuming Playback from ${savedPosition}`);
        setTimestamp(savedPosition);
      }
    }
  }, [vodId, location.search]);

  const lastSaveRef = useRef<number>(0);

  useEffect(() => {
    if (playerState === -1 || !vodId || !playerRef.current) return;

    switch (playerState) {
      case 0:
        clearResumePosition(vodId, 'vod_');
        break;
      case 2:
        const pauseTime = playerRef.current.currentTime;
        if (pauseTime !== null && pauseTime > 0) saveResumePosition(vodId, pauseTime, 'vod_');
        break;
      default:
        break;
    }
    return;
  }, [playerState, vodId, playerRef]);

  useEffect(() => {
    if (playerState !== 1 || !vodId || !playerRef.current) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastSaveRef.current > 10000) {
        const t = playerRef.current!.currentTime;
        if (t > 0) {
          saveResumePosition(vodId, t, 'vod_');
          lastSaveRef.current = now;
        }
      }
    }, 1000);

    // Save immediately on play
    const t = playerRef.current.currentTime;
    if (t > 0) {
      saveResumePosition(vodId, t, 'vod_');
      lastSaveRef.current = Date.now();
    }

    return () => clearInterval(interval);
  }, [playerState, vodId, playerRef]);

  if (vod === undefined) return <Loading logo={logo} />;

  return (
    <div className="h-full w-full">
      <div className={`flex ${isPortrait ? 'flex-col' : 'flex-row'} h-full w-full min-w-0 overflow-hidden`}>
        <div className={`min-w-0 min-h-0 overflow-hidden ${isPortrait ? 'w-full flex-shrink-0' : 'h-full flex-1'}`}>
          <BaseVod
            {...props}
            logo={logo}
            playerRef={playerRef}
            vod={vod}
            timestamp={timestamp}
            setTimestamp={setTimestamp}
            setDelay={setDelay}
            setPlayerState={setPlayerState}
            cdnBase={cdnBase}
            type={props.type}
            isPortrait={isPortrait}
          />
        </div>
        {isPortrait && <hr className="border-[#303032]" />}
        <Chat
          archiveApiBase={archiveApiBase}
          isPortrait={isPortrait}
          vodId={vodId!}
          playerRef={playerRef}
          delay={delay}
          userChatDelay={userChatDelay}
          setUserChatDelay={setUserChatDelay}
          isYoutubeVod={false}
          playerState={playerState}
          twitchId={twitchId}
          channel={channel}
        />
      </div>
    </div>
  );
}
