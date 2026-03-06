import { tooltipClasses } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';

const CustomWidthTooltip = styled(Tooltip)({
  [`& .${tooltipClasses.tooltip}`]: {
    maxWidth: 'none',
  },
});

CustomWidthTooltip.defaultProps = {
  slotProps: { popper: { disablePortal: true } },
};

export default CustomWidthTooltip;
