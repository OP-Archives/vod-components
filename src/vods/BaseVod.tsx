import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState, useRef, ChangeEvent } from 'react';
import { useLocation } from 'react-router-dom';
import type { VOD, VODUpload, GameEntry, PartInfo, PlayerState, PlayerSettings } from '../types';
import CustomWidthTooltip from '../utils/CustomToolTip';
import { toHMS } from '../utils/helpers';
import { loadPlayerSettings, savePlayerSettings } from '../utils/playerSettings';
import { saveResumePosition } from '../utils/positionStorage';
import CustomPlayer from './CustomPlayer';
import GamesMenu from './GamesMenu';
import VodChapters from './VodChapters';
import YoutubePlayer from './YoutubePlayer';

export interface BaseVodProps {
  origin?: string;
  isYoutubeVod?: boolean;
  youtube?: VODUpload[];
  handlePartChange?: (evt: ChangeEvent<HTMLSelectElement>) => void;
  playerRef: React.RefObject<HTMLVideoElement | null>;
  part?: PartInfo | null;
  setPart?: (part: PartInfo | null) => void;
  vod: VOD | undefined;
  type?: string;
  setDelay?: (delay: number) => void;
  timestamp?: number;
  setTimestamp?: (ts: number) => void;
  setPlayerState: (state: PlayerState) => void;
  games?: GameEntry[];
  cdnBase?: string;
  logo: string;
  archiveApiBase: string;
  channel: string;
  isPortrait?: boolean;
}

export default function BaseVod(props: BaseVodProps) {
  const {
    origin,
    isYoutubeVod,
    youtube,
    handlePartChange,
    playerRef,
    part: partValue,
    setPart,
    vod,
    type,
    setDelay,
    timestamp,
    setTimestamp,
    setPlayerState,
    games,
    cdnBase,
    isPortrait,
  } = props;
  const part = partValue ?? null;
  const location = useLocation();
  const pathPrefix = location.pathname.split('/')[1];
  const [theatreMode, setTheatreMode] = useState(false);
  const [collapseOpen, setCollapseOpen] = useState(true);

  const [chapter, setChapter] = useState<
    { name: string; image: string; start: number; duration: number; end: number } | null | undefined
  >(undefined);
  const [currentTime, setCurrentTime] = useState<number | undefined>(undefined);
  const [playerSettings, setPlayerSettings] = useState<PlayerSettings>(() => loadPlayerSettings());
  const lastSaveRef = useRef<number>(0);

  useEffect(() => {
    if (!vod) return;
    setCollapseOpen(!theatreMode);
  }, [theatreMode, vod]);

  useEffect(() => {
    if (!vod) return;
    setChapter(vod.chapters.length > 0 ? vod.chapters[0] : null);
  }, [vod]);

  useEffect(() => {
    savePlayerSettings(playerSettings);
  }, [playerSettings]);

  useEffect(() => {
    if (!playerRef.current || !vod?.chapters?.length || currentTime === undefined) return;

    if (!games) {
      const currentChapter = vod.chapters.find(
        (chapter) => currentTime >= chapter.start && currentTime < chapter.start + chapter.end
      );

      if (currentChapter) {
        setChapter(currentChapter);
      }
    }

    const now = Date.now();
    if (now - lastSaveRef.current > 10000) {
      const currentGame = games?.[part!.part - 1];
      const saveId = currentGame ? currentGame.id : vod.id;
      const prefix = currentGame ? 'game_' : 'vod_';
      saveResumePosition(String(saveId), currentTime, prefix);

      lastSaveRef.current = now;
    }
  }, [currentTime, vod, playerRef, games, part]);

  const copyTimestamp = async (passedTime?: number) => {
    let timeToCopy = passedTime;

    if (timeToCopy === undefined || isNaN(timeToCopy)) {
      if (playerRef.current) {
        if (isYoutubeVod || games) {
          let baseTime = 0;
          if (youtube && isYoutubeVod) {
            for (let i = 0; i < youtube.length; i++) {
              if (i + 1 >= (part?.part ?? 1)) break;
              baseTime += youtube[i].duration ?? 0;
            }
          } else if (games && part) {
            baseTime = parseFloat(games[part.part - 1].start);
          }
          // @ts-expect-error - YouTube Player API
          timeToCopy = baseTime + (playerRef.current.getCurrentTime?.() || 0);
        } else {
          timeToCopy = (playerRef.current as HTMLVideoElement).currentTime || 0;
        }
      } else {
        timeToCopy = currentTime || 0;
      }
    }

    const url = `${window.location.origin}${window.location.pathname}?t=${toHMS(timeToCopy ?? 0)}`;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  if (!vod) return null;

  return (
    <div
      className={`flex w-full flex-col items-start min-w-0 overflow-hidden relative min-h-0 ${isPortrait ? 'h-auto' : 'h-full'}`}
    >
      <div className={`relative w-full min-h-0 ${isPortrait ? 'aspect-video flex-shrink-0' : 'h-full flex-1'}`}>
        {isYoutubeVod ? (
          <YoutubePlayer
            playerRef={playerRef}
            part={part}
            youtube={youtube}
            setCurrentTime={setCurrentTime}
            setPart={setPart}
            setPlayerState={setPlayerState}
            origin={origin}
            theatreMode={theatreMode}
            setTheatreMode={setTheatreMode}
            copyTimestamp={copyTimestamp}
          />
        ) : games ? (
          <YoutubePlayer
            playerRef={playerRef}
            part={part}
            games={games}
            setPart={setPart}
            setPlayerState={setPlayerState}
            setCurrentTime={setCurrentTime}
            origin={origin}
            theatreMode={theatreMode}
            setTheatreMode={setTheatreMode}
            copyTimestamp={copyTimestamp}
          />
        ) : (
          <CustomPlayer
            playerRef={playerRef}
            setCurrentTime={setCurrentTime}
            setDelay={setDelay}
            type={type}
            vod={vod}
            timestamp={timestamp}
            setPlayerState={setPlayerState}
            cdnBase={cdnBase}
            defaultVolume={playerSettings.volume}
            defaultMuted={playerSettings.muted}
            onUpdateSettings={(settings) => setPlayerSettings(settings)}
            theatreMode={theatreMode}
            setTheatreMode={setTheatreMode}
            copyTimestamp={copyTimestamp}
          />
        )}
      </div>

      <div
        className={`transition-all duration-300 ease-in-out w-full ${collapseOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="flex p-2 items-center overflow-hidden bg-[#18181b] rounded-b-lg">
          {chapter && !games && (
            <VodChapters
              chapters={vod.chapters}
              chapter={chapter}
              setChapter={setChapter}
              setTimestamp={setTimestamp}
              setPart={setPart}
              youtube={youtube}
              isYoutubeVod={isYoutubeVod}
            />
          )}
          {games && part && <GamesMenu games={games} part={part} setPart={setPart!} />}

          <div className="flex-1 min-w-0 flex items-center">
            <CustomWidthTooltip title={vod.title}>
              <span className="block w-full font-semibold text-sm truncate leading-none">{vod.title}</span>
            </CustomWidthTooltip>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex gap-2">
              {isYoutubeVod && (
                <select
                  value={part!.part - 1}
                  onChange={(e) => handlePartChange?.(e as unknown as ChangeEvent<HTMLSelectElement>)}
                  className="bg-[#18181b] border border-[#303032] rounded-md px-2 h-7 sm:h-9 text-xs sm:text-sm text-white appearance-none pr-6 sm:pr-8"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.25em 1.25em',
                  }}
                >
                  {youtube!.map((data, i) => (
                    <option key={data.id} value={i}>
                      {data?.part || i + 1}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {vod.prev[0] && (
              <CustomWidthTooltip title="Previous">
                <a
                  href={`/${pathPrefix}/${vod.prev[0].id}`}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
              </CustomWidthTooltip>
            )}
            {vod.next[0] && (
              <CustomWidthTooltip title="Next">
                <a
                  href={`/${pathPrefix}/${vod.next[0].id}`}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
              </CustomWidthTooltip>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
