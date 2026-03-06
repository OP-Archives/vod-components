import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

export default function Loading({ logo }) {
  const loadingLogo = import.meta.env.VITE_LOADING_LOGO || logo || null;
  
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
