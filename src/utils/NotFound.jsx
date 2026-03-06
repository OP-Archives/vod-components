import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import CustomLink from './CustomLink';

const NotFound = styled((props) => {
  const { channel, logo } = props;
  document.title = `Not Found - ${channel}`;
  const siteLogo = import.meta.env.VITE_NOT_FOUND_LOGO || logo || null;
  
  return (
    <div {...props}>
      {siteLogo && <img src={siteLogo} alt="" style={{ height: 'auto', maxWidth: '200px' }} />}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: siteLogo ? '1rem' : '0' }}>
        <CustomLink href="/">
          <Typography variant="body2" color="textSecondary">
            Nothing over here..
          </Typography>
        </CustomLink>
      </div>
    </div>
  );
})`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
`;

export default NotFound;
