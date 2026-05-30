import { useEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { usePlayerLayout } from '../hooks/usePlayerLayout';
import type { VOD, PlayerState } from '../types';
import { convertTimestamp } from '../utils/helpers';
import Loading from '../utils/Loading';
import { getResumePosition, saveResumePosition, clearResumePosition } from '../utils/positionStorage';
import BaseVod from './BaseVod';
import type { ChatProps } from './Chat';
import PlayerLayout from './PlayerLayout';

export interface CustomVodProps {
  archiveApiBase: string;
  channel: string;
  logo: string;
  cdnBase?: string;
  type?: 'cdn' | 'manual';
  twitchId: number;
  tenant: string;
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

  const { isPortrait, chatOnLeft, setChatOnLeft } = usePlayerLayout();

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
      const savedPosition = getResumePosition(vodId, 'vod_', props.tenant);
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
        clearResumePosition(vodId, 'vod_', props.tenant);
        break;
      case 2:
        const pauseTime = playerRef.current.currentTime;
        if (pauseTime !== null && pauseTime > 0) saveResumePosition(vodId, pauseTime, 'vod_', props.tenant);
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
          saveResumePosition(vodId, t, 'vod_', props.tenant);
          lastSaveRef.current = now;
        }
      }
    }, 1000);

    // Save immediately on play
    const t = playerRef.current.currentTime;
    if (t > 0) {
      saveResumePosition(vodId, t, 'vod_', props.tenant);
      lastSaveRef.current = Date.now();
    }

    return () => clearInterval(interval);
  }, [playerState, vodId, playerRef]);

  if (vod === undefined) return <Loading logo={logo} />;

  const chatProps: ChatProps = {
    isPortrait,
    vodId: vodId!,
    playerRef,
    delay,
    userChatDelay,
    setUserChatDelay,
    playerState,
    platform: vod?.platform ?? '',
    twitchId,
    archiveApiBase,
    channel,
    chatOnLeft,
    setChatOnLeft,
  };

  return (
    <PlayerLayout
      isPortrait={isPortrait}
      chatOnLeft={chatOnLeft}
      setChatOnLeft={setChatOnLeft}
      playerElement={
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
      }
      chatProps={chatProps}
    />
  );
}
