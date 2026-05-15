import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { useEffect } from 'react';
import CustomLink from './CustomLink';

const StyledContainer = styled('div')`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
`;

export default function NotFound({ channel, logo }: { channel: string; logo?: string }) {
  useEffect(() => {
    document.title = `Not Found - ${channel}`;
  }, [channel]);

  const siteLogo = logo || null;

  return (
    <StyledContainer>
      {siteLogo && <img src={siteLogo} alt="" style={{ height: 'auto', maxWidth: '200px' }} />}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: siteLogo ? '1rem' : '0' }}>
        <CustomLink href="/">
          <Typography variant="body2" color="textSecondary">
            Nothing over here..
          </Typography>
        </CustomLink>
      </div>
    </StyledContainer>
  );
}
