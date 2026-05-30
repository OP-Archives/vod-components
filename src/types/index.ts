// VOD types
export interface VOD {
  id: number;
  platform_vod_id: string;
  platform: 'twitch';
  title: string;
  duration: number;
  platform_stream_id: string;
  created_at: string;
  is_live: boolean;
  started_at: string;
  updated_at: string;
  vod_uploads: VODUpload[];
  chapters: Chapter[];
  games: GameEntry[];
  prev: VODNavigation[];
  next: VODNavigation[];
}

export interface VODUpload {
  id: number;
  upload_id: string;
  type: 'live' | 'vod';
  duration: number | null;
  part: number | null;
  status: string;
  thumbnail_url: string;
  created_at: string;
}

export interface Chapter {
  name: string;
  image: string;
  start: number;
  duration: number;
  end: number;
}

export interface GameEntry {
  id: string;
  game_name: string;
  video_id: string;
  start: string;
  duration: number;
  chapter_image?: string;
}

export interface VODNavigation {
  id: number;
  platform: string;
  platform_vod_id: string;
}

// Emotes types
export interface EmotesResponse {
  vodId: number;
  ffz_emotes: FfzEmote[];
  bttv_emotes: BttvEmote[];
  seventv_emotes: SevenTVEmote[];
}

export interface FfzEmote {
  id: number | string;
  code?: string;
  name?: string;
  text: string;
  [key: string]: unknown;
}

export interface BttvEmote {
  id: string;
  code: string;
}

export interface SevenTVEmote {
  id: string;
  code: string;
  name?: string;
  flags: number;
}

// Comments types
export interface CommentsResponse {
  comments: Comment[];
  cursor: string;
}

export interface Comment {
  id: string;
  vod_id: number;
  display_name: string;
  content_offset_seconds: number;
  user_color: string;
  created_at: string;
  message: MessageFragment[];
  user_badges: UserBadge[];
}

export interface MessageFragment {
  text: string;
  emote: { id: string; from: number; emoteID: string } | null;
  emoticon?: { emoticon_id: string };
}

export interface UserBadge {
  _id?: string;
  setID: string;
  version: string;
}

// Badges types
export interface BadgesResponse {
  data: {
    channel: Badge[];
    global: Badge[];
  };
}

export interface Badge {
  set_id: string;
  versions: BadgeVersion[];
}

export interface BadgeVersion {
  id: string;
  image_url_1x: string;
  image_url_2x: string;
  image_url_4x: string;
  title: string;
  description: string;
  click_action: string;
  click_url: string | null;
}

// Shared component types
export interface PartInfo {
  part: number;
  timestamp: number;
}

export type EmoteProvider = 'FFZ' | 'BTTV' | '7TV' | 'Twitch' | 'Kick';

export type PlayerState = -1 | 0 | 1 | 2 | 3 | 5;

export interface EmoteEntry {
  id: string | number;
  code: string;
  name?: string;
  provider: EmoteProvider;
  [key: string]: unknown;
}

export type PlayerSource = string | { src: string; type: string; objectUrl: string } | undefined;

export interface ChatSettings {
  chatWidth?: number;
  showTimestamp?: boolean;
  filterWords?: string[];
}

export interface PlayerSettings {
  volume: number;
  muted: boolean;
}
