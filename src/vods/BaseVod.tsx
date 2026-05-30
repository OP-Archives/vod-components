import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState, ChangeEvent } from 'react';
import { useLocation } from 'react-router-dom';
import type { VOD, VODUpload, GameEntry, PartInfo, PlayerState, PlayerSettings, Chapter } from '../types';
import CustomWidthTooltip from '../utils/CustomToolTip';
import { toHMS } from '../utils/helpers';
import { loadPlayerSettings, savePlayerSettings } from '../utils/playerSettings';
import CustomPlayer from './CustomPlayer';
import GamesMenu from './GamesMenu';
import VodChapters from './VodChapters';
import YoutubePlayer from './YoutubePlayer';

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

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
  logo?: string;
  isPortrait?: boolean;
  channel: string;
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
    channel,
  } = props;
  const part = partValue ?? null;
  const location = useLocation();
  const pathPrefix = location.pathname.split('/')[1];
  const [theatreMode, setTheatreMode] = useState(false);

  const [chapter, setChapter] = useState<
    { name: string; image: string; start: number; duration: number; end: number } | null | undefined
  >(undefined);
  const [currentTime, setCurrentTime] = useState<number | undefined>(undefined);
  const [playerSettings, setPlayerSettings] = useState<PlayerSettings>(() => loadPlayerSettings());

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
        (chapter: Chapter) => currentTime >= chapter.start && currentTime < chapter.end
      );

      if (currentChapter) {
        setChapter(currentChapter);
      }
    }
  }, [currentTime, vod, playerRef, games, part]);

  useEffect(() => {
    if (theatreMode) {
      document.body.classList.add('theatre-mode');
    } else {
      document.body.classList.remove('theatre-mode');
    }
    return () => document.body.classList.remove('theatre-mode');
  }, [theatreMode]);

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
      className={`vod-player-container relative flex w-full min-w-0 flex-col items-center ${isPortrait ? '' : 'h-full min-h-0'}`}
    >
      {/* Player container stretches to remaining available height natively. 
        If Theatre Mode is toggled, it forces h-full to push the title/profile below the fold. 
      */}
      <div className={`relative w-full bg-black ${isPortrait ? 'aspect-video shrink-0' : 'min-h-0 flex-1'}`}>
        <div className="absolute inset-0">
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
              channel={channel}
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
              channel={channel}
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
      </div>

      <div className="theatre-hide w-full shrink-0 border-t border-[#222230] bg-[#16161e] p-2 shadow-lg">
        <div className="flex items-center overflow-hidden">
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

          <div className="flex min-w-0 flex-1 flex-col">
            <CustomWidthTooltip title={vod.title}>
              <span className="inline-block max-w-full truncate text-sm leading-none font-semibold">{vod.title}</span>
            </CustomWidthTooltip>
            <span className="mt-1 block w-full truncate text-xs text-[#9ca3af]">
              {DATE_FORMATTER.format(new Date(vod.created_at)).replace(',', '')}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex gap-2">
              {isYoutubeVod && youtube!.length > 1 && (
                <div className="relative">
                  <select
                    value={part!.part - 1}
                    onChange={(e) => handlePartChange?.(e)}
                    className="h-7 appearance-none rounded-md border border-[#222230] bg-[#16161e] pl-2 pr-5 text-xs text-white transition-colors focus:border-[#222230] focus:outline-none sm:h-9 sm:pr-7 sm:text-sm"
                  >
                    {youtube!.map((data, i) => (
                      <option key={data.id} value={i}>
                        {data?.part || i + 1}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5">
                    <svg className="h-4 w-4 text-[#9ca3af]" fill="none" viewBox="0 0 20 20">
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M6 8l4 4 4-4"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>
            {vod.prev && vod.prev.length > 0 && (
              <CustomWidthTooltip title="Previous VOD">
                <a
                  href={`/${pathPrefix}/${vod.prev[0].id}`}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </a>
              </CustomWidthTooltip>
            )}
            {vod.next && vod.next.length > 0 && (
              <CustomWidthTooltip title="Next VOD">
                <a
                  href={`/${pathPrefix}/${vod.next[0].id}`}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </a>
              </CustomWidthTooltip>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
