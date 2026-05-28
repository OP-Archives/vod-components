import { useEffect, useRef, useState, ChangeEvent } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import type { VOD, VODUpload, PartInfo, PlayerState } from '../types';
import { convertTimestamp } from '../utils/helpers';
import Loading from '../utils/Loading';
import NotFound from '../utils/NotFound';
import { getResumePosition, saveResumePosition, clearResumePosition } from '../utils/positionStorage';
import BaseVod from './BaseVod';
import Chat from './Chat';

export interface YoutubeVodProps {
  type?: string;
  archiveApiBase: string;
  channel: string;
  defaultDelay?: number;
  logo: string;
  twitchId: number;
  origin?: string;
}

export default function YoutubeVod(props: YoutubeVodProps) {
  const { type, archiveApiBase, channel, defaultDelay, logo, twitchId, origin } = props;
  const location = useLocation();
  const { vodId } = useParams<{ vodId: string }>();
  const [vod, setVod] = useState<VOD | undefined>(undefined);
  const [youtube, setYoutube] = useState<VODUpload[] | undefined>(undefined);
  const [part, setPart] = useState<PartInfo | null>(null);
  const [delay, setDelay] = useState<number | undefined>(undefined);
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
          if (!type) {
            const useType = data.vod_uploads.some((youtube: VODUpload) => youtube.type === 'live') ? 'live' : 'vod';
            setYoutube(data.vod_uploads.filter((data: VODUpload) => data.type === useType));
          } else {
            setYoutube(data.vod_uploads.filter((data: VODUpload) => data.type === type));
          }
        })
        .catch((e) => {
          if (e.name !== 'AbortError') {
            console.error(e);
          }
        });
    };
    fetchVod();
    return () => {
      abortController.abort();
    };
  }, [vodId, type, archiveApiBase, channel]);

  useEffect(() => {
    if (!youtube || !vodId) return;

    const search = new URLSearchParams(location.search);
    const timestampQuery = search.get('t');
    let timestamp = timestampQuery !== null ? convertTimestamp(timestampQuery) : 0;
    const partQuery = search.get('part');
    let tmpPart = partQuery !== null ? parseInt(partQuery) : 1;
    if (timestamp === 0) {
      const savedPosition = getResumePosition(vodId);
      if (savedPosition !== null && savedPosition > 0) {
        console.info(`Resuming Playback from ${savedPosition}`);
        timestamp = savedPosition;
      }
    }
    for (const data of youtube) {
      if (data.duration !== null && data.duration > timestamp) {
        tmpPart = data.part ?? youtube.indexOf(data) + 1;
        break;
      }
      timestamp -= data.duration ?? 0;
    }
    setPart({ part: tmpPart, timestamp });
    return;
  }, [location.search, vodId, youtube]);

  useEffect(() => {
    if (!youtube || !vod) return;
    let totalYoutubeDuration = 0;
    for (const data of youtube) {
      if (!data.duration) {
        totalYoutubeDuration += defaultDelay || 0;
        continue;
      }
      totalYoutubeDuration += data.duration;
    }
    const tmpDelay = Math.max(0, vod.duration - totalYoutubeDuration);
    setDelay(tmpDelay);
    return;
  }, [youtube, vod, defaultDelay]);

  const lastSaveRef = useRef<number>(0);

  useEffect(() => {
    if (playerState === -1 || !vodId || !playerRef.current || !youtube || !part) return;

    switch (playerState) {
      case 0:
        if (part.part === youtube.length) {
          clearResumePosition(vodId, 'vod_');
        }
        break;
      case 2:
        const ytP = playerRef.current as { getCurrentTime?(): number } | null | undefined;
        let pauseTime = ytP?.getCurrentTime?.() ?? 0;
        if (pauseTime > 0) {
          if (youtube) {
            for (let video of youtube) {
              if ((video.part ?? 0) >= part.part) break;
              pauseTime += video.duration ?? 0;
            }
          }
          saveResumePosition(vodId, pauseTime, 'vod_');
        }
        break;
      default:
        break;
    }
    return;
  }, [playerState, vodId, playerRef, youtube, part]);

  useEffect(() => {
    if (playerState !== 1 || !vodId || !playerRef.current || !youtube || !part) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastSaveRef.current > 10000) {
        const ytP = playerRef.current as { getCurrentTime?(): number } | null | undefined;
        let t = ytP?.getCurrentTime?.() ?? 0;
        if (t > 0 && youtube) {
          for (const video of youtube) {
            if ((video.part ?? 0) >= part.part) break;
            t += video.duration ?? 0;
          }
          saveResumePosition(vodId, t, 'vod_');
          lastSaveRef.current = now;
        }
      }
    }, 1000);

    // Save immediately on play
    const ytP = playerRef.current as { getCurrentTime?(): number } | null | undefined;
    let t = ytP?.getCurrentTime?.() ?? 0;
    if (t > 0 && youtube) {
      for (const video of youtube) {
        if ((video.part ?? 0) >= part.part) break;
        t += video.duration ?? 0;
      }
      saveResumePosition(vodId, t, 'vod_');
      lastSaveRef.current = Date.now();
    }

    return () => clearInterval(interval);
  }, [playerState, vodId, playerRef, youtube, part]);

  const handlePartChange = (evt: ChangeEvent<HTMLSelectElement>) => {
    const tmpPart = Number(evt.target.value) + 1;
    setPart({ part: tmpPart, timestamp: 0 });
  };

  useEffect(() => {
    if (delay === undefined) return;
    console.info(`Chat Delay: ${userChatDelay + delay} seconds`);
  }, [userChatDelay, delay]);

  if (vod === undefined || !part || delay === undefined || youtube === undefined) return <Loading logo={logo} />;

  if (youtube.length === 0) return <NotFound channel={channel} logo={logo} />;

  return (
    <div className="h-full w-full">
      <div className={`flex ${isPortrait ? 'flex-col' : 'flex-row'} h-full w-full min-w-0 overflow-hidden`}>
        <div className={`min-w-0 min-h-0 overflow-hidden ${isPortrait ? 'w-full flex-shrink-0' : 'h-full flex-1'}`}>
          <BaseVod
            {...props}
            logo={logo}
            handlePartChange={handlePartChange}
            youtube={youtube}
            isYoutubeVod={true}
            playerRef={playerRef}
            part={part}
            setPart={setPart}
            vod={vod}
            setPlayerState={setPlayerState}
            origin={origin}
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
          youtube={youtube}
          part={part}
          setPart={setPart}
          setUserChatDelay={setUserChatDelay}
          isYoutubeVod={true}
          playerState={playerState}
          platform={vod?.platform ?? ''}
          twitchId={twitchId}
          channel={channel}
        />
      </div>
    </div>
  );
}
