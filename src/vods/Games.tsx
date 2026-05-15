import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useEffect, useState, useRef, ChangeEvent } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import type { VOD, GameEntry, PartInfo, PlayerState } from '../types';
import Loading from '../utils/Loading';
import { getResumePosition, saveResumePosition, clearResumePosition } from '../utils/positionStorage';
import BaseVod from './BaseVod';
import Chat from './Chat';

export default function Games(props: { archiveApiBase: string; channel: string; logo: string; twitchId: number }) {
  const { archiveApiBase, channel, logo, twitchId } = props;
  const location = useLocation();
  const isPortrait = useMediaQuery('(orientation: portrait)');
  const { vodId } = useParams<{ vodId: string }>();
  const [vod, setVod] = useState<VOD | undefined>(undefined);
  const [games, setGames] = useState<GameEntry[] | undefined>(undefined);
  const [part, setPart] = useState<PartInfo | null | undefined>(undefined);
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
    const game_id = search.get('game_id') !== null ? parseInt(search.get('game_id')!) : undefined;
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

  useEffect(() => {
    if (playerState === -1 || !playerRef.current) return;

    const currentGame = games?.[part!.part - 1];

    switch (playerState) {
      case 0:
        clearResumePosition(currentGame!.id, 'game_');
        break;
      case 2:
        const ytP = playerRef.current as { getCurrentTime?(): number } | null | undefined;
        const currentTime = ytP?.getCurrentTime?.() ?? 0;
        if (currentTime > 0) {
          saveResumePosition(currentGame!.id, currentTime, 'game_');
        }
        break;
      default:
        break;
    }
    return;
  }, [playerState, games, playerRef, part]);

  const handlePartChange = (evt: ChangeEvent<HTMLSelectElement>) => {
    const tmpPart = parseInt(evt.target.value) + 1;
    const selectedGameId = games![tmpPart - 1].id;
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
          vodId={vodId!}
          playerRef={playerRef}
          userChatDelay={userChatDelay}
          part={part ?? null}
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
