import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import SettingsIcon from '@mui/icons-material/Settings';
import PropTypes from 'prop-types';
import ExpandMore from '../../utils/ExpandMore';
import CustomToolTip from './CustomToolTip';

ChatHeader.propTypes = {
  isPortrait: PropTypes.bool,
  showChat: PropTypes.bool.isRequired,
  setShowChat: PropTypes.func.isRequired,
  setShowModal: PropTypes.func.isRequired,
};

export default function ChatHeader(props) {
  const { isPortrait, showChat, setShowChat, setShowModal } = props;

  const handleExpandClick = () => {
    setShowChat(!showChat);
  };

  return (
    <Box sx={{ display: 'grid', alignItems: 'center', p: 1 }}>
      {!isPortrait && (
        <Box
          sx={{
            justifySelf: 'left',
            gridColumnStart: 1,
            gridRowStart: 1,
          }}
        >
          <Tooltip title="Collapse">
            <ExpandMore expand={showChat} onClick={handleExpandClick} aria-expanded={showChat}>
              <ChevronLeftIcon />
            </ExpandMore>
          </Tooltip>
        </Box>
      )}
      <Box
        sx={{
          justifySelf: 'center',
          gridColumnStart: 1,
          gridRowStart: 1,
        }}
      >
        <Typography variant="body1">Chat Replay</Typography>
      </Box>
      <Box sx={{ justifySelf: 'end', gridColumnStart: 1, gridRowStart: 1 }}>
        <IconButton title="Settings" onClick={() => setShowModal(true)} color="primary">
          <SettingsIcon />
        </IconButton>
      </Box>
    </Box>
  );
}
