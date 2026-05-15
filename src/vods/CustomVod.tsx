import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import type { VOD, PlayerState } from '../types';
import { convertTimestamp } from '../utils/helpers';
import Loading from '../utils/Loading';
import { getResumePosition, saveResumePosition, clearResumePosition } from '../utils/positionStorage';
import BaseVod from './BaseVod';
import Chat from './Chat';

export default function CustomVod(props: {
  archiveApiBase: string;
  channel: string;
  logo: string;
  cdnBase?: string;
  twitchId: number;
}) {
  const { archiveApiBase, channel, logo, cdnBase, twitchId } = props;
  const location = useLocation();
  const isPortrait = useMediaQuery('(orientation: portrait)');
  const { vodId } = useParams<{ vodId: string }>();
  const [vod, setVod] = useState<VOD | undefined>(undefined);
  const [timestamp, setTimestamp] = useState<number | undefined>(undefined);
  const [delay, setDelay] = useState(0);
  const [userChatDelay, setUserChatDelay] = useState(0);
  const [playerState, setPlayerState] = useState<PlayerState>(-1);
  const playerRef = useRef<HTMLVideoElement | null>(null);

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

  useEffect(() => {
    if (playerState === -1 || !vodId || !playerRef.current) return;

    switch (playerState) {
      case 0:
        clearResumePosition(vodId, 'vod_');
        break;
      case 2:
        const currentTime = playerRef.current.currentTime;
        if (currentTime !== null && currentTime > 0) saveResumePosition(vodId, currentTime, 'vod_');
        break;
      default:
        break;
    }
    return;
  }, [playerState, vodId, playerRef]);

  if (vod === undefined) return <Loading logo={logo} />;

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <Box sx={{ display: 'flex', flexDirection: isPortrait ? 'column' : 'row', height: '100%', width: '100%' }}>
        <Box sx={{ display: 'flex', height: isPortrait ? 'auto' : '100%', width: '100%', minWidth: 0 }}>
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
          setUserChatDelay={setUserChatDelay}
          isYoutubeVod={false}
          playerState={playerState}
          twitchId={twitchId}
          channel={channel}
        />
      </Box>
    </Box>
  );
}
