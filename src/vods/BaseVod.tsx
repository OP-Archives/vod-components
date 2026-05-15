import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import { useEffect, useState, ChangeEvent, RefObject } from 'react';
import { useLocation } from 'react-router-dom';
import type { VOD, VODUpload, GameEntry, PartInfo, PlayerState, PlayerSettings } from '../types';
import CustomWidthTooltip from '../utils/CustomToolTip';
import { toHMS } from '../utils/helpers';
import { loadPlayerSettings, savePlayerSettings } from '../utils/playerSettings';
import { saveResumePosition } from '../utils/positionStorage';
import CustomPlayer from './CustomPlayer';
import VodChapters from './VodChapters';
import YoutubePlayer from './YoutubePlayer';

interface BaseVodProps {
  origin?: string;
  isYoutubeVod?: boolean;
  youtube?: VODUpload[];
  handlePartChange?: (evt: ChangeEvent<HTMLSelectElement>) => void;
  playerRef: RefObject<HTMLVideoElement | null>;
  part?: PartInfo | null;
  setPart?: (part: PartInfo | null) => void;
  vod: VOD | undefined;
  type?: string;
  setDelay?: (delay: number) => void;
  timestamp?: number;
  setTimestamp?: (ts: number) => void;
  setPlayerState: (state: PlayerState) => void;
  games?: GameEntry[];
  cdnBase?: string;
  logo: string;
  archiveApiBase: string;
  channel: string;
  twitchId: number;
}

export default function BaseVod(props: BaseVodProps) {
  const {
    origin,
    isYoutubeVod,
    youtube,
    handlePartChange,
    playerRef,
    part: partValue,
    setPart,
    vod,
    type,
    setDelay,
    timestamp,
    setTimestamp,
    setPlayerState,
    games,
    cdnBase,
  } = props;
  const part = partValue ?? null;
  const location = useLocation();
  const pathPrefix = location.pathname.split('/')[1];

  if (!vod) return null;

  const [chapter, setChapter] = useState<
    { name: string; image: string; start: number; duration: number; end: number } | null | undefined
  >(undefined);
  const [currentTime, setCurrentTime] = useState<number | undefined>(undefined);
  const [playerSettings, setPlayerSettings] = useState<PlayerSettings>(() => loadPlayerSettings());
  const [theatreMode, setTheatreMode] = useState(false);

  useEffect(() => {
    setChapter(vod.chapters.length > 0 ? vod.chapters[0] : null);
  }, [vod]);

  useEffect(() => {
    savePlayerSettings(playerSettings);
  }, [playerSettings]);

  useEffect(() => {
    if (!playerRef.current || !vod?.chapters?.length || currentTime === undefined) return;

    if (!games) {
      const currentChapter = vod.chapters.find(
        (chapter) => currentTime >= chapter.start && currentTime < chapter.start + chapter.end
      );

      if (currentChapter) {
        setChapter(currentChapter);
      }
    }
    const currentGame = games?.[part!.part - 1];
    const saveId = currentGame ? currentGame.id : vod.id;
    const prefix = currentGame ? 'game_' : 'vod_';
    saveResumePosition(String(saveId), currentTime, prefix);
  }, [currentTime, vod, playerRef, games, part]);

  const copyTimestamp = () => {
    if (currentTime === undefined) return;
    navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?t=${toHMS(currentTime)}`);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100%',
        width: '100%',
        flexDirection: 'column',
        alignItems: 'flex-start',
        minWidth: 0,
        overflow: 'hidden',
        position: 'relative',
        minHeight: 0,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          flex: '1 1 auto',
          minHeight: 0,
        }}
      >
        {isYoutubeVod ? (
          <YoutubePlayer
            playerRef={playerRef}
            part={part}
            youtube={youtube}
            setCurrentTime={setCurrentTime}
            setPart={setPart}
            setPlayerState={setPlayerState}
            origin={origin}
            theatreMode={theatreMode}
            setTheatreMode={setTheatreMode}
            copyTimestamp={copyTimestamp}
          />
        ) : games ? (
          <YoutubePlayer
            playerRef={playerRef}
            part={part}
            games={games}
            setPart={setPart}
            setPlayerState={setPlayerState}
            setCurrentTime={setCurrentTime}
            origin={origin}
            theatreMode={theatreMode}
            setTheatreMode={setTheatreMode}
            copyTimestamp={copyTimestamp}
          />
        ) : (
          <CustomPlayer
            playerRef={playerRef}
            setCurrentTime={setCurrentTime}
            setDelay={setDelay}
            type={type}
            vod={vod}
            timestamp={timestamp}
            setPlayerState={setPlayerState}
            cdnBase={cdnBase}
            defaultVolume={playerSettings.volume}
            defaultMuted={playerSettings.muted}
            onUpdateSettings={(settings) => setPlayerSettings(settings)}
            theatreMode={theatreMode}
            setTheatreMode={setTheatreMode}
            copyTimestamp={copyTimestamp}
          />
        )}
      </Box>
      <Collapse in={!theatreMode} timeout="auto" unmountOnExit sx={{ minHeight: 'auto !important', width: '100%' }}>
        <Box sx={{ display: 'flex', p: 1, alignItems: 'center' }}>
          {chapter && !games && (
            <VodChapters
              chapters={vod.chapters}
              chapter={chapter}
              setChapter={setChapter}
              setTimestamp={setTimestamp}
              setPart={setPart}
              youtube={youtube}
              isYoutubeVod={isYoutubeVod}
            />
          )}
          <CustomWidthTooltip title={vod.title}>
            <Typography sx={{ fontWeight: 550 }} variant="body1" noWrap={true}>{`${vod.title}`}</Typography>
          </CustomWidthTooltip>
          <Box sx={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
            <Box sx={{ ml: 0.5 }}>
              {isYoutubeVod && (
                <FormControl variant="outlined">
                  <InputLabel id="select-label">Part</InputLabel>
                  <Select
                    labelId="select-label"
                    label="Part"
                    value={part!.part - 1}
                    onChange={(e) => handlePartChange?.(e as unknown as ChangeEvent<HTMLSelectElement>)}
                    autoWidth
                  >
                    {youtube!.map((data, i) => {
                      return (
                        <MenuItem key={data.id} value={i}>
                          {data?.part || i + 1}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              )}
              {games && (
                <FormControl variant="outlined">
                  <InputLabel id="select-label">Game</InputLabel>
                  <Select
                    labelId="select-label"
                    label="Game"
                    value={part!.part - 1}
                    onChange={(e) => handlePartChange?.(e as unknown as ChangeEvent<HTMLSelectElement>)}
                    autoWidth
                  >
                    {games.map((data, i) => {
                      return (
                        <MenuItem key={data.id} value={i}>
                          {data.game_name}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              )}
            </Box>
            {vod.prev && (
              <CustomWidthTooltip title="Previous">
                <IconButton size="small" component="a" href={`/${pathPrefix}/${vod.prev.id}`}>
                  <NavigateBeforeIcon fontSize="small" />
                </IconButton>
              </CustomWidthTooltip>
            )}
            {vod.next && (
              <CustomWidthTooltip title="Next">
                <IconButton size="small" component="a" href={`/${pathPrefix}/${vod.next.id}`}>
                  <NavigateNextIcon fontSize="small" />
                </IconButton>
              </CustomWidthTooltip>
            )}
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}
