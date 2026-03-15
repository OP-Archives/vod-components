import Tooltip from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';
import { tooltipClasses } from '@mui/material/Tooltip';

const MessageTooltip = styled(({ className, ...props }) => <Tooltip {...props} slotProps={{ popper: { disablePortal: true } }} classes={{ popper: className }} />)(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: '#fff',
    color: 'rgba(0, 0, 0, 0.87)',
  },
}));

export default MessageTooltip;
