import { useEffect, useState, useRef, ChangeEvent } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { usePlayerLayout } from '../hooks/usePlayerLayout';
import type { VOD, GameEntry, PartInfo, PlayerState } from '../types';
import Loading from '../utils/Loading';
import { getResumePosition, saveResumePosition, clearResumePosition } from '../utils/positionStorage';
import BaseVod from './BaseVod';
import type { ChatProps } from './Chat';
import PlayerLayout from './PlayerLayout';

export interface GamesProps {
  archiveApiBase: string;
  channel: string;
  logo: string;
  twitchId: number;
  origin?: string;
  tenant: string;
}

export default function Games(props: GamesProps) {
  const { archiveApiBase, channel, logo, twitchId } = props;
  const location = useLocation();
  const { vodId } = useParams<{ vodId: string }>();
  const [vod, setVod] = useState<VOD | undefined>(undefined);
  const [games, setGames] = useState<GameEntry[] | undefined>(undefined);
  const [part, setPart] = useState<PartInfo | null | undefined>(undefined);
  const [userChatDelay, setUserChatDelay] = useState(0);
  const [playerState, setPlayerState] = useState<PlayerState>(-1);
  const playerRef = useRef<HTMLVideoElement | null>(null);

  const { isPortrait, chatOnLeft, setChatOnLeft } = usePlayerLayout();

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
    const savedPosition = getResumePosition(selectedGameId, 'game_', props.tenant);
    if (savedPosition !== null) {
      savedTimestamp = savedPosition;
    }

    setPart({ part: index === -1 ? 1 : index + 1, timestamp: savedTimestamp });
    return;
  }, [vod, location.search]);

  const lastSaveRef = useRef<number>(0);

  useEffect(() => {
    if (playerState === -1 || !playerRef.current || !part || !games) return;

    const currentGame = games[part.part - 1];
    if (!currentGame) return;

    switch (playerState) {
      case 0:
        clearResumePosition(currentGame.id, 'game_', props.tenant);
        break;
      case 2:
        const ytP = playerRef.current as { getCurrentTime?(): number } | null | undefined;
        const pauseTime = ytP?.getCurrentTime?.() ?? 0;
        if (pauseTime > 0) {
          saveResumePosition(currentGame.id, pauseTime, 'game_', props.tenant);
        }
        break;
      default:
        break;
    }
    return;
  }, [playerState, games, playerRef, part]);

  useEffect(() => {
    if (playerState !== 1 || !playerRef.current || !part || !games) return;

    const currentGame = games[part.part - 1];
    if (!currentGame) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastSaveRef.current > 10000) {
        const ytP = playerRef.current as { getCurrentTime?(): number } | null | undefined;
        const t = ytP?.getCurrentTime?.() ?? 0;
        if (t > 0) {
          saveResumePosition(currentGame.id, t, 'game_', props.tenant);
          lastSaveRef.current = now;
        }
      }
    }, 1000);

    // Save immediately on play
    const ytP = playerRef.current as { getCurrentTime?(): number } | null | undefined;
    const t = ytP?.getCurrentTime?.() ?? 0;
    if (t > 0) {
      saveResumePosition(currentGame.id, t, 'game_', props.tenant);
      lastSaveRef.current = Date.now();
    }

    return () => clearInterval(interval);
  }, [playerState, games, playerRef, part]);

  const handlePartChange = (evt: ChangeEvent<HTMLSelectElement>) => {
    const tmpPart = parseInt(evt.target.value) + 1;
    const selectedGameId = games![tmpPart - 1].id;
    const savedPosition = getResumePosition(selectedGameId, 'game_', props.tenant);
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
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-4">
        {logo && <img src={logo} alt="" className="h-auto max-w-[200px]" />}
        <p className="text-lg text-gray-400">No games found</p>
        <div className="flex gap-2">
          {vod.prev[0] && (
            <a
              href={`/games/${vod.prev[0].id}`}
              className="text-white hover:text-gray-300 transition-colors flex items-center gap-1"
            >
              <span>Previous Game</span>
            </a>
          )}
          {vod.next[0] && (
            <a
              href={`/games/${vod.next[0].id}`}
              className="text-white hover:text-gray-300 transition-colors flex items-center gap-1"
            >
              <span>Next Game</span>
            </a>
          )}
        </div>
      </div>
    );
  }

  const chatProps: ChatProps = {
    isPortrait,
    vodId: vodId!,
    playerRef,
    userChatDelay,
    setUserChatDelay,
    part: part ?? null,
    games,
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
          handlePartChange={handlePartChange}
          games={games}
          playerRef={playerRef}
          part={part}
          setPart={setPart}
          vod={vod}
          setPlayerState={setPlayerState}
          isPortrait={isPortrait}
        />
      }
      chatProps={chatProps}
    />
  );
}
