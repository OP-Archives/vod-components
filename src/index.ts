import './index.css';
import 'simplebar-react/dist/simplebar.min.css';

// Vods
export { default as YoutubeVod } from './vods/YoutubeVod';
export { default as CustomVod } from './vods/CustomVod';
export { default as Games } from './vods/Games';

// Component props types
export type { CustomVodProps } from './vods/CustomVod';
export type { GamesProps } from './vods/Games';
export type { YoutubeVodProps } from './vods/YoutubeVod';
export type { PlayerProps } from './vods/CustomPlayer';
export type { BaseVodProps } from './vods/BaseVod';

// Types
export * from './types';
