import { useEffect, useState, ChangeEvent } from 'react';
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
  tenant: string;
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
    tenant,
  } = props;
  const part = partValue ?? null;
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
              tenant={tenant}
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
              tenant={tenant}
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
                <select
                  value={part!.part - 1}
                  onChange={(e) => handlePartChange?.(e)}
                  className="h-7 appearance-none rounded-md border border-[#222230] bg-[#16161e] px-2 pr-6 text-xs text-white transition-colors focus:border-white focus:outline-none sm:h-9 sm:pr-8 sm:text-sm"
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
          </div>
        </div>
      </div>
    </div>
  );
}
