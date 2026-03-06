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

Games.propTypes = {
  archiveApiBase: PropTypes.string.isRequired,
  channel: PropTypes.string.isRequired,
  logo: PropTypes.string.isRequired,
};

export default function Games(props) {
  const { archiveApiBase, channel, logo } = props;
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
    let tmpPart = search.get('part') !== null ? parseInt(search.get('part')) : 1;
    setPart({ part: tmpPart, timestamp: 0 });
    return;
  }, [vod, location.search]);

  const handlePartChange = (evt) => {
    const tmpPart = evt.target.value + 1;
    setPart({ part: tmpPart, timestamp: 0 });
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
          isPortrait={isPortrait}
          vodId={vodId}
          playerRef={playerRef}
          userChatDelay={userChatDelay}
          part={part}
          setPart={setPart}
          games={games}
          setUserChatDelay={setUserChatDelay}
          playerState={playerState}
        />
      </Box>
    </Box>
  );
}
