import { styled } from '@mui/material/styles';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';

const CustomWidthTooltip = styled(Tooltip, {
  shouldForwardProp: (prop) => prop !== 'popperDisablePortal',
})({
  [`& .${tooltipClasses.tooltip}`]: {
    maxWidth: 'none',
  },
});

export default CustomWidthTooltip;
