import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useEffect, useRef, useState, ChangeEvent } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import type { VOD, VODUpload, PartInfo, PlayerState } from '../types';
import { convertTimestamp } from '../utils/helpers';
import Loading from '../utils/Loading';
import NotFound from '../utils/NotFound';
import { getResumePosition, saveResumePosition, clearResumePosition } from '../utils/positionStorage';
import BaseVod from './BaseVod';
import Chat from './Chat';

export default function YoutubeVod(props: {
  type?: string;
  archiveApiBase: string;
  channel: string;
  defaultDelay?: number;
  logo: string;
  twitchId: number;
  origin?: string;
}) {
  const { type, archiveApiBase, channel, defaultDelay, logo, twitchId, origin } = props;
  const location = useLocation();
  const isPortrait = useMediaQuery('(orientation: portrait)');
  const { vodId } = useParams<{ vodId: string }>();
  const [vod, setVod] = useState<VOD | undefined>(undefined);
  const [youtube, setYoutube] = useState<VODUpload[] | undefined>(undefined);
  const [part, setPart] = useState<PartInfo | null>(null);
  const [delay, setDelay] = useState<number | undefined>(undefined);
  const [userChatDelay, setUserChatDelay] = useState(0);
  const [playerState, setPlayerState] = useState<PlayerState>(-1);
  const playerRef = useRef<HTMLVideoElement | null>(null);

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
        let currentTime = ytP?.getCurrentTime?.() ?? 0;
        if (currentTime > 0) {
          if (youtube) {
            for (let video of youtube) {
              if ((video.part ?? 0) >= part.part) break;
              currentTime += video.duration ?? 0;
            }
          }
          saveResumePosition(vodId, currentTime, 'vod_');
        }
        break;
      default:
        break;
    }
    return;
  }, [playerState, vodId, playerRef, youtube, part]);

  const handlePartChange = (evt: ChangeEvent<HTMLSelectElement>) => {
    const tmpPart = evt.target.value + 1;
    setPart({ part: parseInt(tmpPart), timestamp: 0 });
  };

  useEffect(() => {
    if (delay === undefined) return;
    console.info(`Chat Delay: ${userChatDelay + delay} seconds`);
  }, [userChatDelay, delay]);

  if (vod === undefined || !part || delay === undefined || youtube === undefined) return <Loading logo={logo} />;

  if (youtube.length === 0) return <NotFound channel={channel} logo={logo} />;

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <Box sx={{ display: 'flex', flexDirection: isPortrait ? 'column' : 'row', height: '100%', width: '100%' }}>
        <Box sx={{ display: 'flex', height: isPortrait ? 'auto' : '100%', width: '100%', minWidth: 0 }}>
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
          />
        </Box>
        {isPortrait && <Divider />}
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
          twitchId={twitchId}
          channel={channel}
        />
      </Box>
    </Box>
  );
}
