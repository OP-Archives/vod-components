import { useEffect, useState, useRef } from 'react';
import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import Divider from '@mui/material/Divider';
import Loading from '../utils/Loading';
import { useLocation, useParams } from 'react-router-dom';
import NotFound from '../utils/NotFound';
import Chat from './Chat';
import BaseVod from './BaseVod';
import PropTypes from 'prop-types';
import { getResumePosition, saveResumePosition, clearResumePosition } from '../utils/positionStorage';

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
        })
        .catch((e) => {
          console.error(e);
        });
    };
    fetchVod();
    return;
  }, [vodId, archiveApiBase, channel]);

  useEffect(() => {
    if (!vod) return;
    setGames(vod.games);
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

  if (vod === undefined || part === undefined) return <Loading logo={logo} />;

  if (games.length === 0) return <NotFound channel={channel} logo={logo} />;

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <Box sx={{ display: 'flex', flexDirection: isPortrait ? 'column' : 'row', height: '100%', width: '100%' }}>
        <BaseVod {...props} logo={logo} handlePartChange={handlePartChange} games={games} playerRef={playerRef} part={part} setPart={setPart} vod={vod} setPlayerState={setPlayerState} />
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
        />
      </Box>
    </Box>
  );
}
