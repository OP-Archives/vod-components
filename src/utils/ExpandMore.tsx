import IconButton from '@mui/material/IconButton';
import { styled } from '@mui/material/styles';

interface ExpandMoreProps {
  expand?: boolean;
}

const ExpandMore = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== 'expand',
})<ExpandMoreProps>`
  margin-left: auto;
  transition: transform 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;

  ${({ expand }) => (expand ? `transform: rotate(0deg);` : `transform: rotate(180deg);`)}
`;

export default ExpandMore;
