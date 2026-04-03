import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Collapse from '@mui/material/Collapse';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import VodChapters from './VodChapters';
import CustomWidthTooltip from '../utils/CustomToolTip';
import { toHMS } from '../utils/helpers';
import YoutubePlayer from './YoutubePlayer';
import CustomPlayer from './CustomPlayer';
import { saveResumePosition } from '../utils/positionStorage';
import { loadPlayerSettings, savePlayerSettings } from '../utils/playerSettings';

export default function BaseVod(props) {
  const { origin, isYoutubeVod, youtube, handlePartChange, playerRef, part, setPart, vod, type, setDelay, timestamp, setTimestamp, setPlayerState, games, cdnBase } = props;
  const [chapter, setChapter] = useState(undefined);
  const [currentTime, setCurrentTime] = useState(undefined);
  const [playerSettings, setPlayerSettings] = useState(() => loadPlayerSettings());
  const [theatreMode, setTheatreMode] = useState(false);

  useEffect(() => {
    if (!vod) return;
    setChapter(vod.chapters.length > 0 ? vod.chapters[0] : null);
  }, [vod]);

  useEffect(() => {
    savePlayerSettings(playerSettings);
  }, [playerSettings]);

  useEffect(() => {
    if (!playerRef.current || !vod?.chapters?.length || currentTime === undefined) return;

    if (!games) {
      const currentChapter = vod.chapters.find((chapter) => currentTime >= chapter.start && currentTime < chapter.start + chapter.end);

      if (currentChapter) {
        setChapter(currentChapter);
      }
    }
    const currentGame = games?.[part.part - 1];
    const saveId = currentGame ? currentGame.id : vod.id;
    const prefix = currentGame ? 'game_' : 'vod_';
    saveResumePosition(saveId, currentTime, prefix);
  }, [currentTime, vod, playerRef, games, part]);

  const copyTimestamp = () => {
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
            defaultVolume={playerSettings.volume}
            defaultMuted={playerSettings.muted}
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
            defaultVolume={playerSettings.volume}
            defaultMuted={playerSettings.muted}
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
            <VodChapters chapters={vod.chapters} chapter={chapter} setChapter={setChapter} setTimestamp={setTimestamp} setPart={setPart} youtube={youtube} isYoutubeVod={isYoutubeVod} />
          )}
          <CustomWidthTooltip title={vod.title}>
            <Typography fontWeight={550} variant="body1" noWrap={true}>{`${vod.title}`}</Typography>
          </CustomWidthTooltip>
          <Box sx={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
            <Box sx={{ ml: 0.5 }}>
              {isYoutubeVod && (
                <FormControl variant="outlined">
                  <InputLabel id="select-label">Part</InputLabel>
                  <Select labelId="select-label" label="Part" value={part.part - 1} onChange={handlePartChange} autoWidth>
                    {youtube.map((data, i) => {
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
                  <Select labelId="select-label" label="Game" value={part.part - 1} onChange={handlePartChange} autoWidth>
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
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}
