import { styled } from '@mui/material/styles';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import type { TooltipProps } from '@mui/material/Tooltip';

interface MessageTooltipProps extends Omit<TooltipProps, 'title'> {
  title: React.ReactNode;
}

const MessageTooltip = styled(({ className, ...props }: MessageTooltipProps) => (
  <Tooltip {...props} slotProps={{ popper: { disablePortal: true } }} classes={{ popper: className }} />
))(() => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: '#fff',
    color: 'rgba(0, 0, 0, 0.87)',
  },
}));

export default MessageTooltip;
