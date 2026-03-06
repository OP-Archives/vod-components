import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

const DEFAULT_LOADING_LOGO = process.env.LOADING_LOGO || null;

export default function Loading({ logo }) {
  const loadingLogo = logo || DEFAULT_LOADING_LOGO;
  
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        {loadingLogo && (
          <img alt="" src={loadingLogo} style={{ height: 'auto', maxWidth: '100%', maxHeight: 150 }} />
        )}
        <CircularProgress style={{ marginTop: loadingLogo ? '2rem' : '0' }} size="2rem" />
      </Box>
    </Box>
  );
}
