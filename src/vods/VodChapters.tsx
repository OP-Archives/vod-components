import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import humanize from 'humanize-duration';
import { useState, memo } from 'react';
import type { Chapter, VODUpload, PartInfo } from '../types';
import { toSeconds, getImage } from '../utils/helpers';

interface VodChaptersProps {
  chapters: Chapter[];
  chapter: { name: string; image: string; start: number; duration: number; end: number } | null;
  setPart?: (part: PartInfo) => void;
  youtube?: VODUpload[];
  setChapter: (ch: { name: string; image: string; start: number; duration: number; end: number } | null) => void;
  setTimestamp?: (ts: number) => void;
  isYoutubeVod?: boolean;
}

const VodChapters = memo<VodChaptersProps>(function VodChapters({
  chapters,
  chapter,
  setPart,
  youtube,
  setChapter,
  setTimestamp,
  isYoutubeVod,
}) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleChapterClick = (data: Chapter) => {
    if (isYoutubeVod && youtube) {
      let part = 1;
      let timestamp = data?.start;
      if (timestamp! > 1) {
        for (let data of youtube) {
          if ((data.duration ?? 0) > timestamp!) {
            part = data?.part || 1;
            break;
          }
          timestamp! -= data.duration ?? 0;
        }
      }
      setPart?.({ part: part, timestamp: timestamp! });
    } else {
      setTimestamp?.(data?.start || toSeconds(data.duration.toString()));
    }
    setChapter(data);
    setAnchorEl(null);
  };

  return (
    <Box sx={{ pr: 1 }}>
      <Tooltip title={chapter!.name}>
        <IconButton onClick={handleClick}>
          <img alt="" src={getImage(chapter!.image)} style={{ width: '40px', height: '53px' }} />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
        sx={{ maxWidth: '280px', maxHeight: '400px' }}
      >
        {chapters.map((data) => {
          return (
            <MenuItem
              onClick={() => handleChapterClick(data)}
              key={`${data.name}-${data.start}`}
              selected={data.start === chapter!.start}
            >
              <Box sx={{ display: 'flex' }}>
                <Box sx={{ mr: 1 }}>
                  <img alt="" src={getImage(data.image)} style={{ width: '40px', height: '53px' }} />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography color="primary" variant="body2" noWrap>{`${data.name}`}</Typography>
                  {data.end !== undefined && (
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      noWrap
                    >{`${humanize(data.duration * 1000, { largest: 2 })}`}</Typography>
                  )}
                </Box>
              </Box>
            </MenuItem>
          );
        })}
      </Menu>
    </Box>
  );
});

export default VodChapters;
