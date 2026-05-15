import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { YoutubeVod, CustomVod, Games } from 'vod-components';
import { useState, useCallback, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';

/* ── App ───────────────────────────────────────────────────────────────── */

const darkTheme = createTheme({ palette: { mode: 'dark' } });

function PlaygroundContent() {
  const navigate = useNavigate();
  const { vodId: routeVodId } = useParams();
  const vodId = routeVodId || '1673';
  const [tab, setTab] = useState(0);
  const [archiveApiBase, setArchiveApiBase] = useState('https://archive.overpowered.tv/api/v1');
  const [channel, setChannel] = useState('xqc');
  const [logo, setLogo] = useState('https://yt3.ggpht.com/Lws_RLhUhKXEcSKaN09iMwZ0RnDA8c0Eiq2bP3teiaG9lt8JhNJH6tioTYeSs_yNaIYEzejjPA=s88-c-k-c0x00ffffff-no-rj');
  const [twitchId, setTwitchId] = useState('71092938');
  const [defaultDelay, setDefaultDelay] = useState(0);
  const [cdnBase, setCdnBase] = useState('https://cdn.example.com');
  const [showSidebar, setShowSidebar] = useState(true);
  const [type, setType] = useState('vod');
  const [customType, setCustomType] = useState('cdn');
  const [origin, setOrigin] = useState(window.location.origin);
  const [vodIdInput, setVodIdInput] = useState(vodId);

  useEffect(() => {
    setVodIdInput(vodId);
  }, [vodId]);

  const handleTabChange = (_e, newTab) => {
    setTab(newTab);
    navigate(`/${['youtube', 'custom', 'games'][newTab]}/${vodIdInput.trim() || vodId}`, { replace: true });
  };

  const applyVodId = () => {
    if (vodIdInput.trim()) {
      navigate(`/${['youtube', 'custom', 'games'][tab]}/${vodIdInput.trim()}`, { replace: true });
    }
  };

  const renderComponent = () => {
    const commonProps = { archiveApiBase, channel, logo, twitchId: parseInt(twitchId) };

    switch (tab) {
      case 0:
        return <YoutubeVod {...commonProps} defaultDelay={parseInt(defaultDelay) || 0} type={type} origin={origin} />;
      case 1:
        return <CustomVod {...commonProps} cdnBase={cdnBase} type={customType} />;
      case 2:
        return <Games {...commonProps} type="games" />;
      default:
        return <Navigate to="/youtube" replace />;
    }
  };

  const inputStyle = { mb: 1.5, width: '100%' };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', bgcolor: '#0e0e10', color: '#efeff1' }}>
      {/* Top bar */}
      <Box sx={{ borderBottom: 1, borderColor: '#2f2f35', bgcolor: '#18181b' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mr: 3, whiteSpace: 'nowrap' }}>
            VOD Components Playground
          </Typography>
          <Tabs value={tab} onChange={handleTabChange} textColor="inherit" sx={{ minHeight: 48 }}>
            <Tab label="YouTube VOD" value={0} sx={{ minHeight: 48 }} />
            <Tab label="Custom VOD" value={1} sx={{ minHeight: 48 }} />
            <Tab label="Games" value={2} sx={{ minHeight: 48 }} />
          </Tabs>
          <Box sx={{ ml: 'auto' }}>
            <Switch checked={showSidebar} onChange={(e) => setShowSidebar(e.target.checked)} size="small" />
            <Typography variant="caption" sx={{ ml: 0.5, verticalAlign: 'middle' }}>
              Props
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Main component area */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <Routes>
            <Route path="/youtube/:vodId" element={renderComponent()} />
            <Route path="/custom/:vodId" element={renderComponent()} />
            <Route path="/games/:vodId" element={renderComponent()} />
            <Route path="*" element={<Navigate to={`/${['youtube', 'custom', 'games'][tab]}/${vodId}`} replace />} />
          </Routes>
        </Box>

        {/* Props sidebar */}
        {showSidebar && (
          <Box
            sx={{
              width: 280,
              borderLeft: 1,
              borderColor: '#2f2f35',
              bgcolor: '#18181b',
              overflowY: 'auto',
              p: 2,
              flexShrink: 0,
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1, color: '#adadb8' }}>
              Shared Props
            </Typography>
            <TextField label="Archive API Base" value={archiveApiBase} onChange={(e) => setArchiveApiBase(e.target.value)} size="small" sx={inputStyle} />
            <TextField label="Channel" value={channel} onChange={(e) => setChannel(e.target.value)} size="small" sx={inputStyle} />
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField label="VOD ID" value={vodIdInput} onChange={(e) => setVodIdInput(e.target.value)} size="small" sx={{ flex: 1 }} onKeyDown={(e) => e.key === 'Enter' && applyVodId()} />
                <Button size="small" variant="outlined" onClick={applyVodId}>Go</Button>
              </Box>
            <TextField label="Logo URL" value={logo} onChange={(e) => setLogo(e.target.value)} size="small" sx={inputStyle} />
            <TextField label="Twitch ID" type="number" value={twitchId} onChange={(e) => setTwitchId(e.target.value)} size="small" sx={inputStyle} />

            {tab === 0 && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: '#adadb8' }}>
                  YouTube VOD Props
                </Typography>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select value={type} onChange={(e) => setType(e.target.value)}>
                    <MenuItem value="live">live</MenuItem>
                    <MenuItem value="vod">vod</MenuItem>
                    <MenuItem value="">auto</MenuItem>
                  </Select>
                </FormControl>
                <TextField label="Default Delay (s)" type="number" value={defaultDelay} onChange={(e) => setDefaultDelay(e.target.value)} size="small" sx={inputStyle} />
                <TextField label="Origin" value={origin} onChange={(e) => setOrigin(e.target.value)} size="small" sx={inputStyle} />
              </>
            )}

            {tab === 1 && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: '#adadb8' }}>
                  Custom VOD Props
                </Typography>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select value={customType} onChange={(e) => setCustomType(e.target.value)}>
                    <MenuItem value="cdn">cdn</MenuItem>
                    <MenuItem value="manual">manual</MenuItem>
                  </Select>
                </FormControl>
                <TextField label="CDN Base" value={cdnBase} onChange={(e) => setCdnBase(e.target.value)} size="small" sx={inputStyle} />
              </>
            )}

            <Typography variant="caption" sx={{ display: 'block', mt: 2, color: '#5c5c65' }}>
              Navigate to /youtube, /custom, or /games to switch components.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <BrowserRouter>
        <PlaygroundContent />
      </BrowserRouter>
    </ThemeProvider>
  );
}

createRoot(document.getElementById('root')).render(<App />);
