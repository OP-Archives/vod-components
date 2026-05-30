import Hls, { Events, ErrorTypes } from 'hls.js';
import type { ErrorData } from 'hls.js';
import { useRef, useEffect, useState } from 'react';
import type { PlayerSource } from '../types';

const setNativeVideoSrc = (video: HTMLVideoElement, url: string) => {
  video.src = url;
};

interface HlsConfig {
  enableWorker: boolean;
  lowLatencyMode: boolean;
  backBufferLength: number;
  maxBufferLength: number;
  maxMaxBufferLength: number;
  maxBufferSize: number;
  maxBufferHole: number;
  liveSyncDurationCount: number;
  liveDurationInfinity: boolean;
  debug: boolean;
}

const hlsConfig: HlsConfig = {
  enableWorker: true,
  lowLatencyMode: false,
  backBufferLength: 90,
  maxBufferLength: 30,
  maxMaxBufferLength: 600,
  maxBufferSize: 60 * 1000 * 1000,
  maxBufferHole: 0.5,
  liveSyncDurationCount: 3,
  liveDurationInfinity: false,
  debug: false,
} as const;

interface UseHlsPlayerOptions {
  type?: string;
  cdnBase?: string;
  platformVodId: string;
  playerRef: React.RefObject<HTMLVideoElement | null>;
}

export interface UseHlsPlayerReturn {
  source: PlayerSource;
  setSource: React.Dispatch<React.SetStateAction<PlayerSource>>;
  fileError: string | undefined;
}

export function useHlsPlayer({ type, cdnBase, platformVodId, playerRef }: UseHlsPlayerOptions): UseHlsPlayerReturn {
  const hlsInstance = useRef<Hls | null>(null);
  const [source, setSource] = useState<PlayerSource>(undefined);
  const [fileError, setFileError] = useState<string | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;

    const initHls = async () => {
      if (type === 'cdn') {
        if (!cdnBase) {
          setFileError('CDN URL not configured');
          return;
        }
        const hlsUrl = `${cdnBase}/videos/${platformVodId}/hls/${platformVodId}.m3u8`;
        setSource(hlsUrl);

        const videoEl = playerRef.current;
        if (!videoEl) return;

        if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
          setNativeVideoSrc(videoEl, hlsUrl);
          return;
        }

        if (!isMounted) return;

        if (Hls.isSupported()) {
          hlsInstance.current = new Hls(hlsConfig);
          hlsInstance.current.loadSource(hlsUrl);
          hlsInstance.current.attachMedia(videoEl);

          hlsInstance.current.on(Events.ERROR, (_event: string, data: ErrorData) => {
            if (data.fatal) {
              switch (data.type) {
                case ErrorTypes.NETWORK_ERROR:
                case ErrorTypes.MEDIA_ERROR:
                  hlsInstance.current!.destroy();
                  break;
                default:
                  hlsInstance.current!.destroy();
                  setFileError('Failed to load video');
                  break;
              }
            }
          });
        }
      }
    };

    initHls();

    return () => {
      isMounted = false;
      if (hlsInstance.current) {
        hlsInstance.current.destroy();
      }
    };
  }, [type, cdnBase, platformVodId, playerRef]);

  return { source, setSource, fileError };
}
