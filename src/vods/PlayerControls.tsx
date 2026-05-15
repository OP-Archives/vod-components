import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SettingsIcon from '@mui/icons-material/Settings';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import WidthFullIcon from '@mui/icons-material/WidthFull';
import WidthNormalIcon from '@mui/icons-material/WidthNormal';
import Box from '@mui/material/Box';
import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Slider from '@mui/material/Slider';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useState, useEffect, useRef } from 'react';
import { formatTime } from '../utils/helpers';

const CONTROL_BAR_HEIGHT = 60;
const AUTO_HIDE_DELAY = 3000;

interface PlayerControlsProps {
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  isFullscreen: boolean;
  onTogglePlayPause: () => void;
  onVolumeChange: (event: Event, newValue: number | number[]) => void;
  onSeekChange: (event: Event, newValue: number | number[]) => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  playerContainerRef: React.RefObject<HTMLDivElement | null>;
  theatreMode: boolean;
  onToggleTheatreMode: () => void;
  playbackSpeed?: number;
  onPlaybackSpeedChange?: (speed: number) => void;
  onCopyTimestamp?: (time: number) => void;
}

export default function PlayerControls(props: PlayerControlsProps) {
  const {
    isPlaying,
    volume,
    isMuted,
    currentTime,
    duration,
    isFullscreen,
    onTogglePlayPause,
    onVolumeChange,
    onSeekChange,
    onToggleMute,
    onToggleFullscreen,
    playerContainerRef,
    theatreMode,
    onToggleTheatreMode,
    playbackSpeed = 1,
    onPlaybackSpeedChange,
    onCopyTimestamp,
  } = props;

  const [showControls, setShowControls] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<HTMLElement | null>(null);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const autoHideTimerRef = useRef<number | null>(null);
  const closeSettingsTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);

      if (!isMenuOpen) {
        autoHideTimerRef.current = setTimeout(() => {
          if (isPlaying) {
            setShowControls(false);
          }
        }, AUTO_HIDE_DELAY);
      }
    };

    const handleMouseLeave = () => {
      if (isPlaying && !isMenuOpen) {
        setShowControls(false);
      }
    };

    const playerContainer = playerContainerRef.current;
    if (playerContainer) {
      playerContainer.addEventListener('mousemove', handleMouseMove);
      playerContainer.addEventListener('mouseleave', handleMouseLeave);
      playerContainer.addEventListener('click', handleMouseMove);
    }

    if (isMenuOpen) {
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
      setShowControls(true);
    } else if (isPlaying) {
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, AUTO_HIDE_DELAY);
    }

    return () => {
      if (playerContainer) {
        playerContainer.removeEventListener('mousemove', handleMouseMove);
        playerContainer.removeEventListener('mouseleave', handleMouseLeave);
        playerContainer.removeEventListener('click', handleMouseMove);
      }
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
    };
  }, [isPlaying, isMenuOpen, playerContainerRef]);

  useEffect(() => {
    return () => {
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
      if (closeSettingsTimerRef.current) clearTimeout(closeSettingsTimerRef.current);
    };
  }, []);

  const handleCopyTimestamp = () => {
    if (onCopyTimestamp) {
      onCopyTimestamp(currentTime);
    }
    handleCloseSettings();
  };

  const handlePlaybackSpeedChange = (speed: number) => {
    if (onPlaybackSpeedChange) {
      onPlaybackSpeedChange(speed);
    }
    handleCloseSettings();
  };

  const handleCloseSettings = () => {
    setIsMenuOpen(false);

    closeSettingsTimerRef.current = setTimeout(() => {
      setSettingsAnchorEl(null);
      setShowSpeedMenu(false);
    }, 250);
  };

  return (
    <Fade in={showControls} timeout={300} onDoubleClick={(e) => e.stopPropagation()}>
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          minHeight: CONTROL_BAR_HEIGHT,
          maxHeight: '30vh',
          background: `linear-gradient(to top, rgba(0,0,0,0.8), transparent)`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '0px 8px 8px 8px',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Slider
            value={currentTime}
            valueLabelDisplay="auto"
            valueLabelFormat={formatTime}
            onChange={onSeekChange}
            min={0}
            max={duration}
            size="small"
            sx={{
              '& .MuiSlider-thumb': {
                height: { xs: 10, sm: 12 },
                width: { xs: 10, sm: 12 },
              },
              '& .MuiSlider-track': {
                height: { xs: 3, sm: 4 },
              },
              '& .MuiSlider-rail': {
                height: { xs: 3, sm: 4 },
              },
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.25, md: 0.75 } }}>
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.25, md: 0.75 }, minWidth: { xs: 70, md: 90 } }}
          >
            <Tooltip title={isPlaying ? 'Pause' : 'Play'}>
              <IconButton
                onClick={onTogglePlayPause}
                color="inherit"
                sx={{ height: { xs: 28, md: 32 }, width: { xs: 28, md: 32 } }}
              >
                {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
              </IconButton>
            </Tooltip>

            <Tooltip title={isMuted ? 'Unmute' : 'Mute'}>
              <IconButton
                onClick={onToggleMute}
                color="inherit"
                sx={{ height: { xs: 28, md: 32 }, width: { xs: 28, md: 32 } }}
              >
                {isMuted || volume === 0 ? <VolumeOffIcon /> : <VolumeUpIcon />}
              </IconButton>
            </Tooltip>
            <Slider
              value={isMuted ? 0 : volume}
              onChange={onVolumeChange}
              size="small"
              sx={{
                width: { xs: 55, md: 70 },
                '& .MuiSlider-thumb': {
                  height: { xs: 10, md: 12 },
                  width: { xs: 10, md: 12 },
                },
                '& .MuiSlider-track': {
                  height: { xs: 3, md: 4 },
                },
                '& .MuiSlider-rail': {
                  height: { xs: 3, md: 4 },
                },
                mr: 1,
              }}
            />
          </Box>

          <Typography
            variant="body2"
            sx={{
              minWidth: { xs: 50, md: 65 },
              fontSize: { xs: '11px', md: '12px' },
              flexShrink: 0,
              display: { xs: 'none', md: 'block' },
            }}
          >
            {`${formatTime(currentTime)} / ${formatTime(duration)}`}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.25, md: 0.5 }, marginLeft: 'auto' }}>
            <Tooltip title="Settings">
              <IconButton
                onClick={(e) => {
                  setSettingsAnchorEl(e.currentTarget);
                  setIsMenuOpen(true);
                }}
                color="inherit"
                sx={{ height: { xs: 30, md: 32 }, width: { xs: 30, md: 32 } }}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title={theatreMode ? 'Exit Theatre Mode' : 'Theatre Mode'}>
              <IconButton
                onClick={onToggleTheatreMode}
                color="inherit"
                sx={{ height: { xs: 30, md: 32 }, width: { xs: 30, md: 32 } }}
              >
                {theatreMode ? <WidthNormalIcon /> : <WidthFullIcon />}
              </IconButton>
            </Tooltip>

            <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
              <IconButton
                onClick={onToggleFullscreen}
                color="inherit"
                sx={{ height: { xs: 30, md: 32 }, width: { xs: 30, md: 32 } }}
              >
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </Tooltip>
          </Box>

          <Menu
            anchorEl={settingsAnchorEl}
            open={isMenuOpen}
            onClose={handleCloseSettings}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Fade in={isMenuOpen}>
              <Box>
                {showSpeedMenu ? (
                  <MenuItem onClick={() => setShowSpeedMenu(false)}>
                    <KeyboardArrowLeftIcon fontSize="small" sx={{ mr: 1 }} />
                    Back
                  </MenuItem>
                ) : (
                  <MenuItem onClick={() => setShowSpeedMenu(true)}>
                    Playback Speed
                    <KeyboardArrowRightIcon fontSize="small" sx={{ ml: 'auto' }} />
                  </MenuItem>
                )}
                {showSpeedMenu ? null : (
                  <Box component="div">
                    <Box sx={{ borderTop: 1, borderColor: 'divider', my: 0.5 }} />
                    <MenuItem onClick={handleCopyTimestamp}>
                      <ContentCopyIcon fontSize="small" sx={{ mr: 1 }} />
                      Copy Timestamp
                    </MenuItem>
                  </Box>
                )}
                {showSpeedMenu && (
                  <Box component="div" sx={{ px: 2, py: 1 }}>
                    {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 3].map((speed) => (
                      <MenuItem
                        key={speed}
                        onClick={() => handlePlaybackSpeedChange(speed)}
                        selected={playbackSpeed === speed}
                      >
                        {speed}x
                      </MenuItem>
                    ))}
                  </Box>
                )}
              </Box>
            </Fade>
          </Menu>
        </Box>
      </Box>
    </Fade>
  );
}
