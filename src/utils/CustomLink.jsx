import { styled } from '@mui/material/styles';
import Link from '@mui/material/Link';
import PropTypes from 'prop-types';

const CustomLink = styled((props) => <Link {...props} />)`
  &:hover {
    opacity: 50%;
  }
`;

CustomLink.propTypes = {
  href: PropTypes.string,
  children: PropTypes.node,
};

export default CustomLink;
