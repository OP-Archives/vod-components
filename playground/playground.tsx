import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import type { ChangeEvent } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { YoutubeVod, CustomVod, Games } from 'vod-components';
import { useState, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';

const darkTheme = createTheme({ palette: { mode: 'dark' } });

const tabs = ['youtube', 'custom', 'games'] as const;

function PlaygroundContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { vodId: routeVodId } = useParams();
  const vodId = routeVodId || '1673';
  const [tab, setTab] = useState(() => {
    const path = location.pathname.split('/')[1];
    return tabs.indexOf(path as (typeof tabs)[number]) >= 0
      ? tabs.indexOf(path as (typeof tabs)[number])
      : 0;
  });
  const [archiveApiBase, setArchiveApiBase] = useState('https://archive.overpowered.tv/api/v1');
  const [channel, setChannel] = useState('xqc');
  const [logo, setLogo] = useState('https://xqc.wtf/assets/logo-D84ej4L_.png');
  const [twitchId, setTwitchId] = useState('71092938');
  const [showSidebar, setShowSidebar] = useState(true);
  const [vodIdInput, setVodIdInput] = useState(vodId);

  const [youtubeType, setYoutubeType] = useState<'live' | 'vod' | ''>('vod');
  const [youtubeDefaultDelay, setYoutubeDefaultDelay] = useState(0);
  const [youtubeOrigin, setYoutubeOrigin] = useState(window.location.origin);
  const [customCdnBase, setCustomCdnBase] = useState('https://cdn.xqc.wtf');
  const [customType, setCustomType] = useState<'cdn' | 'manual'>('cdn');

  useEffect(() => {
    const path = location.pathname.split('/')[1];
    const newTab = tabs.indexOf(path as (typeof tabs)[number]);
    if (newTab >= 0) setTab(newTab);
  }, [location.pathname]);

  useEffect(() => {
    setVodIdInput(vodId);
  }, [vodId]);

  const handleTabChange = (_e: React.SyntheticEvent, newTab: number) => {
    setTab(newTab);
    navigate(`/${tabs[newTab]}/${vodIdInput.trim() || vodId}`, { replace: true });
  };

  const applyVodId = () => {
    if (vodIdInput.trim()) {
      navigate(`/${tabs[tab]}/${vodIdInput.trim()}`, { replace: true });
    }
  };

  const propsRef = useRef({
    shared: { archiveApiBase, channel, logo, twitchId: parseInt(twitchId) },
    youtube: { type: youtubeType, defaultDelay: youtubeDefaultDelay, origin: youtubeOrigin },
    custom: { cdnBase: customCdnBase, customType },
    games: {},
  });

  const [youtubeKey, setYoutubeKey] = useState(0);
  const [customKey, setCustomKey] = useState(0);
  const [gamesKey, setGamesKey] = useState(0);

  const applyProps = () => {
    propsRef.current = {
      shared: { archiveApiBase, channel, logo, twitchId: parseInt(twitchId) },
      youtube: { type: youtubeType, defaultDelay: youtubeDefaultDelay, origin: youtubeOrigin },
      custom: { cdnBase: customCdnBase, customType },
      games: {},
    };
    setYoutubeKey((k) => k + 1);
    setCustomKey((k) => k + 1);
    setGamesKey((k) => k + 1);
  };

  const inputStyle = { mb: 1.5, width: '100%' };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        bgcolor: '#0e0e10',
        color: '#efeff1',
      }}
    >
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
            <Switch
              checked={showSidebar}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShowSidebar(e.target.checked)}
              size="small"
            />
            <Typography variant="caption" sx={{ ml: 0.5, verticalAlign: 'middle' }}>
              Props
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <Routes>
            <Route path="/youtube/:vodId" element={<YoutubeVod {...propsRef.current.shared} defaultDelay={propsRef.current.youtube.defaultDelay || 0} type={propsRef.current.youtube.type} origin={propsRef.current.youtube.origin} key={youtubeKey} />} />
            <Route path="/custom/:vodId" element={<CustomVod {...propsRef.current.shared} cdnBase={propsRef.current.custom.cdnBase} type={propsRef.current.custom.customType} key={customKey} />} />
            <Route path="/games/:vodId" element={<Games {...propsRef.current.shared} type="games" key={gamesKey} />} />
            <Route path="*" element={<Navigate to={`/${tabs[tab]}/${vodId}`} replace />} />
          </Routes>
        </Box>

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
            <TextField
              label="Archive API Base"
              value={archiveApiBase}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setArchiveApiBase(e.target.value)}
              size="small"
              sx={inputStyle}
            />
            <TextField
              label="Channel"
              value={channel}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChannel(e.target.value)}
              size="small"
              sx={inputStyle}
            />
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                label="VOD ID"
                value={vodIdInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVodIdInput(e.target.value)}
                size="small"
                sx={{ flex: 1 }}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && applyVodId()}
              />
              <Button size="small" variant="outlined" onClick={applyVodId}>
                Go
              </Button>
            </Box>
            <TextField
              label="Logo URL"
              value={logo}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLogo(e.target.value)}
              size="small"
              sx={inputStyle}
            />
            <TextField
              label="Twitch ID"
              type="number"
              value={twitchId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTwitchId(e.target.value)}
              size="small"
              sx={inputStyle}
            />

           {tab === 0 && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: '#adadb8' }}>
                  YouTube VOD Props
                </Typography>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={youtubeType}
                    onChange={(e: SelectChangeEvent) => setYoutubeType(((e.target as { value: string }).value as 'live' | 'vod' | '') || '')}
                  >
                    <MenuItem value="live">live</MenuItem>
                    <MenuItem value="vod">vod</MenuItem>
                    <MenuItem value="">auto</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Default Delay (s)"
                  type="number"
                  value={youtubeDefaultDelay}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setYoutubeDefaultDelay(Number(e.target.value))}
                  size="small"
                  sx={inputStyle}
                />
                <TextField
                  label="Origin"
                  value={youtubeOrigin}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setYoutubeOrigin(e.target.value)}
                  size="small"
                  sx={inputStyle}
                />
              </>
            )}

            {tab === 1 && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: '#adadb8' }}>
                  Custom VOD Props
                </Typography>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={customType}
                    onChange={(e: SelectChangeEvent) => setCustomType((e.target as { value: string }).value as 'cdn' | 'manual')}
                  >
                    <MenuItem value="cdn">cdn</MenuItem>
                    <MenuItem value="manual">manual</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="CDN Base"
                  value={customCdnBase}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomCdnBase(e.target.value)}
                  size="small"
                  sx={inputStyle}
                />
              </>
            )}

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={applyProps}
              sx={{ mt: 2, mb: 1, py: 1.5, fontWeight: 700 }}
            >
              Apply to All
            </Button>

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

const container = document.getElementById('root')!;

function setupRoot() {
  let root = (container as any).__viteRoot;
  if (!root) {
    root = (container as any).__viteRoot = createRoot(container);
  }
  root.render(<App />);
}

setupRoot();

if (import.meta.hot) {
  import.meta.hot.accept((mod: any) => {
    if (mod?.default) {
      const root = (container as any).__viteRoot;
      root.render(<mod.default />);
    }
  });
}

declare namespace NodeJS {
  interface ImportMeta {
    hot?: {
      accept(cb: (mod?: any) => void): void;
    };
  }
}

interface HTMLElement {
  __viteRoot?: import('react-dom/client').Root;
}
