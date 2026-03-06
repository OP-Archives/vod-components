import Collapse from '@mui/material/Collapse';
import { styled } from '@mui/material/styles';
import { collapseClasses } from '@mui/material/Collapse';
import PropTypes from 'prop-types';

CustomCollapse.propTypes = {
  children: PropTypes.node.isRequired,
  in: PropTypes.bool.isRequired,
};

const CustomCollapse = styled(({ ...props }) => <Collapse {...props} />)({
  [`& .${collapseClasses.wrapper}`]: {
    height: '100%',
  },
});

export default CustomCollapse;
