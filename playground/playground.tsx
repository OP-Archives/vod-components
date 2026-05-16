import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import type { ChangeEvent } from 'react';
import { YoutubeVod, CustomVod, Games } from '../src/index';
import { useState, useRef, useEffect } from 'react';
import '../src/index.css';

const tabs = ['youtube', 'custom', 'games'] as const;

function PlaygroundContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { vodId: routeVodId } = useParams();
  const vodId = routeVodId || '1673';
  const [tab, setTab] = useState(() => {
    const path = location.pathname.split('/')[1];
    return tabs.indexOf(path as (typeof tabs)[number]) >= 0 ? tabs.indexOf(path as (typeof tabs)[number]) : 0;
  });
  const [archiveApiBase, setArchiveApiBase] = useState('https://archive.overpowered.tv/api/v1');
  const [channel, setChannel] = useState('xqc');
  const [logo, setLogo] = useState('https://xqc.wtf/assets/logo-D84ej4L_.png');
  const [twitchId, setTwitchId] = useState('71092938');
  const [showSidebar, setShowSidebar] = useState(() => window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setShowSidebar(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
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

  const handleTabChange = (_e: unknown, newTab: number) => {
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
   games: { origin: youtubeOrigin },
    };
    setYoutubeKey((k) => k + 1);
    setCustomKey((k) => k + 1);
    setGamesKey((k) => k + 1);
  };

  const labelClasses = 'block text-sm font-medium text-gray-400 mb-1';
  const inputClasses =
    'w-full bg-[#2f2f35] border border-[#3f3f46] rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500';
  const selectClasses =
    'w-full bg-[#2f2f35] border border-[#3f3f46] rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500';

  return (
    <div className="flex flex-col h-screen w-full bg-[#0e0e10] text-[#efeff1] overflow-hidden">
      <div className="border-b border-[#2f2f35] bg-[#18181b]">
        <div className="flex items-center px-4">
          <h1 className="text-lg font-bold mr-3 whitespace-nowrap">VOD Components Playground</h1>
          <div className="flex gap-0">
            {tabs.map((t, i) => (
              <button
                key={t}
                onClick={() => handleTabChange({}, i)}
                className={`px-4 py-3 text-sm transition-colors ${tab === i ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
              >
                {t === 'youtube' ? 'YouTube VOD' : t === 'custom' ? 'Custom VOD' : 'Games'}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <input
              type="checkbox"
              checked={showSidebar}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setShowSidebar(e.target.checked)}
              className="w-4 h-4 accent-blue-500"
            />
            <span className="text-xs">Props</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden min-w-0">
          <Routes>
            <Route
              path="/youtube/:vodId"
              element={
                <YoutubeVod
                  {...propsRef.current.shared}
                  defaultDelay={propsRef.current.youtube.defaultDelay || 0}
                  type={propsRef.current.youtube.type}
                  origin={propsRef.current.youtube.origin}
                  key={youtubeKey}
                />
              }
            />
            <Route
              path="/custom/:vodId"
              element={
                <CustomVod
                  {...propsRef.current.shared}
                  cdnBase={propsRef.current.custom.cdnBase}
                  type={propsRef.current.custom.customType}
                  key={customKey}
                />
              }
            />
            <Route path="/games/:vodId" element={<Games {...propsRef.current.shared} key={gamesKey} />} />
            <Route path="*" element={<Navigate to={`/${tabs[tab]}/${vodId}`} replace />} />
          </Routes>
        </div>

        {showSidebar && (
          <div className="w-[280px] flex flex-col flex-shrink-0">
            <h3 className="text-sm font-medium text-[#adadb8] mb-4">Shared Props</h3>
            <label className={labelClasses}>Archive API Base</label>
            <input
              className={inputClasses}
              value={archiveApiBase}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setArchiveApiBase(e.target.value)}
            />
            <label className={labelClasses}>Channel</label>
            <input
              className={inputClasses}
              value={channel}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setChannel(e.target.value)}
            />
            <div className="flex gap-2 items-center mb-3">
              <input
                className="flex-1 bg-[#2f2f35] border border-[#3f3f46] rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                value={vodIdInput}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setVodIdInput(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && applyVodId()}
              />
              <button
                onClick={applyVodId}
                className="bg-transparent border border-[#3f3f46] text-white px-4 py-2 rounded text-sm hover:bg-[#2f2f35] transition-colors"
              >
                Go
              </button>
            </div>
            <label className={labelClasses}>Logo URL</label>
            <input
              className={inputClasses}
              value={logo}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setLogo(e.target.value)}
            />
            <label className={labelClasses}>Twitch ID</label>
            <input
              className={inputClasses}
              type="number"
              value={twitchId}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setTwitchId(e.target.value)}
            />

            {tab === 0 && (
              <>
                <h3 className="text-sm font-medium text-[#adadb8] mt-6 mb-1">YouTube VOD Props</h3>
                <label className={labelClasses}>Type</label>
                <select
                  className={selectClasses}
                  value={youtubeType}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setYoutubeType((e.target as HTMLSelectElement).value as 'live' | 'vod' | '')
                  }
                >
                  <option value="live">live</option>
                  <option value="vod">vod</option>
                  <option value="">auto</option>
                </select>
                <label className={labelClasses}>Default Delay (s)</label>
                <input
                  className={inputClasses}
                  type="number"
                  value={youtubeDefaultDelay}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setYoutubeDefaultDelay(Number(e.target.value))}
                />
                <label className={labelClasses}>Origin</label>
                <input
                  className={inputClasses}
                  value={youtubeOrigin}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setYoutubeOrigin(e.target.value)}
                />
              </>
            )}

            {tab === 1 && (
              <>
                <h3 className="text-sm font-medium text-[#adadb8] mt-6 mb-1">Custom VOD Props</h3>
                <label className={labelClasses}>Type</label>
                <select
                  className={selectClasses}
                  value={customType}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setCustomType((e.target as HTMLSelectElement).value as 'cdn' | 'manual')
                  }
                >
                  <option value="cdn">cdn</option>
                  <option value="manual">manual</option>
                </select>
                <label className={labelClasses}>CDN Base</label>
                <input
                  className={inputClasses}
                  value={customCdnBase}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomCdnBase(e.target.value)}
                />
              </>
            )}

            <button
              onClick={applyProps}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm font-bold transition-colors mt-2 mb-1"
            >
              Apply to All
            </button>

            <p className="text-xs text-[#5c5c65] block mt-2">
              Navigate to /youtube, /custom, or /games to switch components.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <PlaygroundContent />
    </BrowserRouter>
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
