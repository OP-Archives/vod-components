import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import Divider from '@mui/material/Divider';
import Loading from '../utils/Loading';
import { useLocation, useParams } from 'react-router-dom';
import NotFound from '../utils/NotFound';
import Chat from './Chat';
import { toSeconds, convertTimestamp } from '../utils/helpers';
import BaseVod from './BaseVod';
import { getResumePosition, saveResumePosition, clearResumePosition } from '../utils/positionStorage';
import PropTypes from 'prop-types';

YoutubeVod.propTypes = {
  type: PropTypes.string,
  archiveApiBase: PropTypes.string.isRequired,
  channel: PropTypes.string.isRequired,
  defaultDelay: PropTypes.number,
  logo: PropTypes.string.isRequired,
};

export default function YoutubeVod(props) {
  const { type, archiveApiBase, channel, defaultDelay, logo } = props;
  const location = useLocation();
  const isPortrait = useMediaQuery('(orientation: portrait)');
  const { vodId } = useParams();
  const [vod, setVod] = useState(undefined);
  const [youtube, setYoutube] = useState(undefined);
  const [part, setPart] = useState(undefined);
  const [delay, setDelay] = useState(undefined);
  const [userChatDelay, setUserChatDelay] = useState(0);
  const [playerState, setPlayerState] = useState(-1);
  const playerRef = useRef(null);

  useEffect(() => {
    document.title = `${vodId} - ${channel}`;
    const fetchVod = async () => {
      await fetch(`${archiveApiBase}/vods/${vodId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then((response) => {
          setVod(response);
          if (!type) {
            const useType = response.youtube.some((youtube) => youtube.type === 'live') ? 'live' : 'vod';
            setYoutube(response.youtube.filter((data) => data.type === useType));
          } else {
            setYoutube(response.youtube.filter((data) => data.type === type));
          }
        })
        .catch((e) => {
          console.error(e);
        });
    };
    fetchVod();
    return;
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
      if (data.duration > timestamp) {
        tmpPart = data.part ?? youtube.indexOf(data) + 1;
        break;
      }
      timestamp -= data.duration;
    }
    setPart({ part: tmpPart, timestamp });
    return;
  }, [location.search, vodId, youtube]);

  useEffect(() => {
    if (!youtube || !vod) return;
    const vodDuration = toSeconds(vod.duration);
    let totalYoutubeDuration = 0;
    for (const data of youtube) {
      if (!data.duration) {
        totalYoutubeDuration += defaultDelay || 0;
        continue;
      }
      totalYoutubeDuration += data.duration;
    }
    const tmpDelay = Math.max(0, vodDuration - totalYoutubeDuration);
    setDelay(tmpDelay);
    return;
  }, [youtube, vod, defaultDelay]);

  // Handle Resume Positions depending on player state.
  useEffect(() => {
    if (playerState === -1 || !vodId || !playerRef.current || !youtube || !part) return;

    switch (playerState) {
      // Player States: -1=unstarted, 0=ended, 1=playing, 2=paused, 3=buffering, 5=cued
      case 0:
        // Clear Resume Position only when the last part has ended
        if (part.part === youtube.length) {
          clearResumePosition(vodId, 'vod_');
        }
        break;
      case 2:
        let currentTime = playerRef.current?.getCurrentTime();
        if (currentTime !== null && currentTime > 0) {
          if (youtube) {
            for (let video of youtube) {
              if (video.part >= part.part) break;
              currentTime += video.duration;
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

  const handlePartChange = (evt) => {
    const tmpPart = evt.target.value + 1;
    setPart({ part: tmpPart, duration: 0 });
  };

  useEffect(() => {
    if (delay === undefined) return;
    console.info(`Chat Delay: ${userChatDelay + delay} seconds`);
  }, [userChatDelay, delay]);

  if (vod === undefined || part === undefined || delay === undefined || youtube === undefined) return <Loading logo={logo} />;

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
            origin={channel}
          />
        </Box>
        {isPortrait && <Divider />}
        <Chat
          archiveApiBase={archiveApiBase}
          isPortrait={isPortrait}
          vodId={vodId}
          playerRef={playerRef}
          delay={delay}
          userChatDelay={userChatDelay}
          youtube={youtube}
          part={part}
          setPart={setPart}
          setUserChatDelay={setUserChatDelay}
          isYoutubeVod={true}
          playerState={playerState}
        />
      </Box>
    </Box>
  );
}
