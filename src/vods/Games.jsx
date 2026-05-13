import { useEffect, useState, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import useMediaQuery from '@mui/material/useMediaQuery';
import Divider from '@mui/material/Divider';
import Loading from '../utils/Loading';
import { useLocation, useParams } from 'react-router-dom';
import Chat from './Chat';
import BaseVod from './BaseVod';
import PropTypes from 'prop-types';
import { getResumePosition, saveResumePosition, clearResumePosition } from '../utils/positionStorage';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

Games.propTypes = {
  archiveApiBase: PropTypes.string.isRequired,
  channel: PropTypes.string.isRequired,
  logo: PropTypes.string.isRequired,
  twitchId: PropTypes.number.isRequired,
};

export default function Games(props) {
  const { archiveApiBase, channel, logo, twitchId } = props;
  const location = useLocation();
  const isPortrait = useMediaQuery('(orientation: portrait)');
  const { vodId } = useParams();
  const [vod, setVod] = useState(undefined);
  const [games, setGames] = useState(undefined);
  const [part, setPart] = useState(undefined);
  const [userChatDelay, setUserChatDelay] = useState(0);
  const [playerState, setPlayerState] = useState(-1);
  const playerRef = useRef(null);

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
  }, [vodId, archiveApiBase, channel]);

  useEffect(() => {
    if (!vod) return;
    setGames(vod.games);
    if (!vod.games || vod.games.length === 0) {
      setPart(null);
      return;
    }

    const search = new URLSearchParams(location.search);

    //Check if game id is in query
    const game_id = search.get('game_id') !== null ? parseInt(search.get('game_id')) : undefined;
    const index = vod.games.findIndex((game) => parseInt(game.id) === game_id);

    let savedTimestamp = 0;
    const selectedGameIndex = index === -1 ? 0 : index;
    const selectedGameId = vod.games[selectedGameIndex].id;
    const savedPosition = getResumePosition(selectedGameId, 'game_');
    if (savedPosition !== null) {
      savedTimestamp = savedPosition;
    }

    setPart({ part: index === -1 ? 1 : index + 1, timestamp: savedTimestamp });
    return;
  }, [vod, location.search]);

  // Handle Resume Positions depending on player state.
  useEffect(() => {
    if (playerState === -1 || !playerRef.current) return;

    const currentGame = games?.[part.part - 1];

    switch (playerState) {
      // Player States: -1=unstarted, 0=ended, 1=playing, 2=paused, 3=buffering, 5=cued
      case 0:
        // Clear Resume Position when video has ended.
        clearResumePosition(currentGame.id, 'game_');
        break;
      case 2:
        const currentTime = playerRef.current?.getCurrentTime();
        if (currentTime !== null && currentTime > 0) {
          saveResumePosition(currentGame.id, currentTime, 'game_');
        }
        break;
      default:
        break;
    }
    return;
  }, [playerState, games, playerRef, part]);

  const handlePartChange = (evt) => {
    const tmpPart = evt.target.value + 1;
    const selectedGameId = games[tmpPart - 1].id;
    const savedPosition = getResumePosition(selectedGameId, 'game_');
    let savedTimestamp = 0;
    if (savedPosition !== null) {
      savedTimestamp = savedPosition;
    }
    setPart({ part: tmpPart, timestamp: savedTimestamp });
  };

  useEffect(() => {
    console.info(`Chat Delay: ${userChatDelay} seconds`);
    return;
  }, [userChatDelay]);

  if (vod === undefined) return <Loading logo={logo} />;

  if (!games || games.length === 0) {
    return (
      <Box
        sx={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        {logo && <img src={logo} alt="" style={{ height: 'auto', maxWidth: '200px' }} />}
        <Typography variant="h6" color="text.secondary">
          No games found
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {vod.prev && (
            <IconButton component="a" href={`/games/${vod.prev.id}`}>
              <NavigateBeforeIcon />
              Previous Game
            </IconButton>
          )}
          {vod.next && (
            <IconButton component="a" href={`/games/${vod.next.id}`}>
              Next Game
              <NavigateNextIcon />
            </IconButton>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <Box sx={{ display: 'flex', flexDirection: isPortrait ? 'column' : 'row', height: '100%', width: '100%' }}>
        <Box sx={{ display: 'flex', height: isPortrait ? 'auto' : '100%', width: '100%', minWidth: 0 }}>
          <BaseVod
            {...props}
            logo={logo}
            handlePartChange={handlePartChange}
            games={games}
            playerRef={playerRef}
            part={part}
            setPart={setPart}
            vod={vod}
            setPlayerState={setPlayerState}
          />
        </Box>
        {isPortrait && <Divider />}
        <Chat
          archiveApiBase={archiveApiBase}
          isPortrait={isPortrait}
          vodId={vodId}
          playerRef={playerRef}
          userChatDelay={userChatDelay}
          part={part}
          setPart={setPart}
          games={games}
          setUserChatDelay={setUserChatDelay}
          playerState={playerState}
          twitchId={twitchId}
          channel={channel}
        />
      </Box>
    </Box>
  );
}
