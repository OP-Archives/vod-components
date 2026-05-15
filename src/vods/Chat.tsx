import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import type {
  Comment,
  EmotesResponse,
  FfzEmote,
  BttvEmote,
  SevenTVEmote,
  EmoteEntry,
  EmoteProvider,
  PartInfo,
  PlayerState,
  VODUpload,
  GameEntry,
  Badge,
  BadgeVersion,
} from '../types';
import { toHHMMSS } from '../utils/helpers';
import { safeLocalStorage } from '../utils/safeLocalStorage';
import ChatHeader from './Chat/ChatHeader';
import ChatMessages from './Chat/ChatMessages';
import ChatSettingsModal from './Chat/ChatSettingsModal';
import MessageTooltip from './Chat/MessageTooltip';
import { Twemoji, testEmoji } from './Chat/Twemoji';

const BASE_TWITCH_CDN = 'https://static-cdn.jtvnw.net';
const BASE_FFZ_EMOTE_CDN = 'https://cdn.frankerfacez.com/emote';
const BASE_BTTV_EMOTE_CDN = 'https://emotes.overpowered.tv/bttv';
const BASE_7TV_EMOTE_CDN = 'https://cdn.7tv.app/emote';
const BASE_FFZ_EMOTE_API = 'https://api.frankerfacez.com/v1';
const BASE_BTTV_EMOTE_API = 'https://api.betterttv.net/3';
const BASE_7TV_EMOTE_API = 'https://7tv.io/v3';

const SCROLL_TOLERANCE = 50;

interface ChatProps {
  isPortrait: boolean;
  vodId: string;
  playerRef: React.RefObject<unknown>;
  userChatDelay: number;
  delay?: number;
  youtube?: VODUpload[];
  part?: PartInfo | null;
  setPart?: (part: PartInfo | null) => void;
  games?: GameEntry[];
  isYoutubeVod?: boolean;
  playerState: PlayerState;
  setUserChatDelay: (v: number) => void;
  twitchId: number;
  archiveApiBase: string;
  channel: string;
}

export default function Chat(props: ChatProps) {
  const {
    isPortrait,
    vodId,
    playerRef,
    userChatDelay,
    delay,
    youtube,
    part,
    games,
    isYoutubeVod,
    playerState,
    setUserChatDelay,
    twitchId,
    archiveApiBase,
    channel,
  } = props;

  const [showChat, setShowChat] = useState(true);
  const [shownMessages, setShownMessages] = useState<React.ReactElement[]>([]);
  const [emotes, setEmotes] = useState<Omit<EmotesResponse, 'vodId'>>({
    ffz_emotes: [],
    bttv_emotes: [],
    seventv_emotes: [],
  });
  const [scrolling, setScrolling] = useState(false);
  const [showTimestamp, setShowTimestamp] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [chatWidth, setChatWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    const updateChatWidth = () => {
      if (typeof window === 'undefined') return;

      const savedSettings = safeLocalStorage.getItem('chatSettings');

      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          if (settings.chatWidth !== undefined) {
            setChatWidth(settings.chatWidth as number);
          }
          if (settings.showTimestamp !== undefined) {
            setShowTimestamp(Boolean(settings.showTimestamp));
          }
          return;
        } catch (e) {
          console.error('Failed to parse chat settings from localStorage', e);
        }
      }

      const screenWidth = window.innerWidth;
      setChatWidth(screenWidth <= 600 ? 250 : screenWidth <= 900 ? 300 : 340);
    };

    updateChatWidth();
  }, []);

  const isAtBottomRef = useRef(true);
  const comments = useRef<Comment[]>([]);
  const badges = useRef<Record<'channel' | 'global', Badge[]> | undefined>(undefined);
  const cursor = useRef<string | null>(null);
  const loopRef = useRef<number | null>(null);
  const loopCbRef = useRef<typeof loop>(undefined);
  const playRef = useRef<number | null>(null);
  const chatRef = useRef<HTMLElement | null>(null);
  const stoppedAtIndex = useRef(0);
  const newMessages = useRef<React.ReactElement[]>([]);
  const paginationAbortRef = useRef<AbortController | null>(null);
  const isFetchingNext = useRef(false);
  const lastFetchedCursor = useRef<string | null>(null);
  const lastScrollHeight = useRef(0);
  const isAutoScrolling = useRef(false);
  const lastScrollTop = useRef(0);
  const scrollingRef = useRef(scrolling);

  useEffect(() => {
    const abortController = new AbortController();

    const loadBadges = () => {
      fetch(`${archiveApiBase}/${channel}/badges/twitch`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: abortController.signal,
      })
        .then((response) => response.json())
        .then((response) => {
          if (!response.success) {
            throw response;
          }
          return response.data;
        })
        .then((data) => {
          badges.current = data || { channel: [], global: [] };
        })
        .catch((e) => {
          if (e.name !== 'AbortError') {
            console.error('Badge loading failed:', e);
            badges.current = { channel: [], global: [] };
          }
        });
    };

    const loadArchiveEmotes = async () => {
      await fetch(`${archiveApiBase}/${channel}/vods/${vodId}/emotes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: abortController.signal,
      })
        .then((response) => response.json())
        .then((response) => {
          if (!response.success) {
            throw response;
          }
          return response.data;
        })
        .then((data) => {
          const hasFfz = (data as EmotesResponse)?.ffz_emotes?.length;
          const hasBttv = (data as EmotesResponse)?.bttv_emotes?.length;
          const has7tv = (data as EmotesResponse)?.seventv_emotes?.length;

          if (hasFfz || hasBttv || has7tv) {
            setEmotes((prev) => ({
              ffz_emotes: hasFfz ? (data as EmotesResponse).ffz_emotes : prev.ffz_emotes,
              bttv_emotes: hasBttv ? (data as EmotesResponse).bttv_emotes : prev.bttv_emotes,
              seventv_emotes: has7tv ? (data as EmotesResponse).seventv_emotes : prev.seventv_emotes,
            }));
          }

          loadBTTVGlobalEmotes();
          load7TVGlobalEmotes();

          if (!hasFfz) loadFFZEmotes();
          if (!hasBttv) {
            loadBTTVChannelEmotes();
          }
          if (!has7tv) {
            load7TVEmotes();
          }
        })
        .catch((e) => {
          if (e.name !== 'AbortError') {
            console.error(e);
            fallbackLoadEmotes();
          }
        });
    };

    const fallbackLoadEmotes = async () => {
      await Promise.all([
        loadBTTVChannelEmotes(),
        loadBTTVGlobalEmotes(),
        load7TVEmotes(),
        load7TVGlobalEmotes(),
        loadFFZEmotes(),
      ]);
    };

    const loadBTTVGlobalEmotes = async () => {
      await fetch(`${BASE_BTTV_EMOTE_API}/cached/emotes/global`, {
        method: 'GET',
        signal: abortController.signal,
      })
        .then((response) => response.json())
        .then((data) => {
          if ((data as { status: number }).status >= 400) return;
          setEmotes((emotes) => ({ ...emotes, bttv_emotes: emotes.bttv_emotes.concat((data as BttvEmote[]) || []) }));
        })
        .catch((e) => {
          if (e.name !== 'AbortError') {
            console.error(e);
          }
        });
    };

    const loadBTTVChannelEmotes = async () => {
      await fetch(`${BASE_BTTV_EMOTE_API}/cached/users/twitch/${twitchId}`, {
        method: 'GET',
        signal: abortController.signal,
      })
        .then((response) => response.json())
        .then((data) => {
          if ((data as { status: number }).status >= 400) return;
          const d = data as { sharedEmotes?: BttvEmote[]; channelEmotes?: BttvEmote[] };
          setEmotes((emotes) => ({
            ...emotes,
            bttv_emotes: emotes.bttv_emotes.concat((d.sharedEmotes || []).concat(d.channelEmotes || [])),
          }));
        })
        .catch((e) => {
          if (e.name !== 'AbortError') {
            console.error(e);
          }
        });
    };

    const loadFFZEmotes = async () => {
      await fetch(`${BASE_FFZ_EMOTE_API}/room/id/${twitchId}`, {
        method: 'GET',
        signal: abortController.signal,
      })
        .then((response) => response.json())
        .then((data) => {
          if ((data as { status: number }).status >= 400) return;
          const d = data as { sets?: Record<string, { emoticons: FfzEmote[] }>; room?: { set?: number } };
          const emoticons = d.sets?.[d.room?.set as unknown as string]?.emoticons || [];
          setEmotes((emotes) => ({ ...emotes, ffz_emotes: emoticons }));
        })
        .catch((e) => {
          if (e.name !== 'AbortError') {
            console.error(e);
          }
        });
    };

    const load7TVEmotes = async () => {
      await fetch(`${BASE_7TV_EMOTE_API}/users/twitch/${twitchId}`, {
        method: 'GET',
        signal: abortController.signal,
      })
        .then((response) => response.json())
        .then((data) => {
          if ((data as { status_code: number }).status_code >= 400) return;
          const d = data as { emote_set?: { emotes: SevenTVEmote[] } };
          setEmotes((emotes) => ({ ...emotes, seventv_emotes: d.emote_set?.emotes || [] }));
        })
        .catch((e) => {
          if (e.name !== 'AbortError') {
            console.error(e);
          }
        });
    };

    const load7TVGlobalEmotes = async () => {
      await fetch(`${BASE_7TV_EMOTE_API}/emote-sets/global`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: abortController.signal,
      })
        .then((response) => response.json())
        .then((data) => {
          const d = data as { emotes: SevenTVEmote[] };
          setEmotes((emotes) => ({ ...emotes, seventv_emotes: emotes.seventv_emotes.concat(d.emotes || []) }));
        })
        .catch((e) => {
          if (e.name !== 'AbortError') {
            console.error(e);
          }
        });
    };

    loadArchiveEmotes();
    loadBadges();

    return () => {
      abortController.abort();
    };
  }, [vodId, archiveApiBase, twitchId, channel]);

  const emoteLookup = useMemo(() => {
    const lookup = new Map<string, EmoteEntry>();
    const ffz = (emotes as { ffz_emotes?: FfzEmote[] })?.ffz_emotes || [];
    const bttv = (emotes as { bttv_emotes?: BttvEmote[] })?.bttv_emotes || [];
    const seventv = (emotes as { seventv_emotes?: SevenTVEmote[] })?.seventv_emotes || [];

    ffz.forEach((emote: FfzEmote) => {
      const code = typeof emote.code === 'string' ? emote.code : (emote.text as string);
      const name = typeof emote.name === 'string' ? emote.name : code;
      lookup.set(code || name, { ...emote, code, name, provider: 'FFZ' as EmoteProvider });
    });
    bttv.forEach((emote: BttvEmote) =>
      lookup.set(emote.code, { ...emote, name: emote.code, provider: 'BTTV' as EmoteProvider })
    );
    seventv.forEach((emote: SevenTVEmote) =>
      lookup.set(emote.code, { ...emote, name: emote.code, provider: '7TV' as EmoteProvider })
    );

    return lookup;
  }, [emotes]);

  const getCurrentTime = useCallback(() => {
    const current = playerRef.current;
    if (!current) return 0;
    let time = 0;
    if (youtube && isYoutubeVod) {
      for (let i = 0; i < youtube.length; i++) {
        const video = youtube[i];
        if (i + 1 >= (part?.part ?? 1)) break;
        time += video.duration ?? 0;
      }
      time += (current as { getCurrentTime?: () => number }).getCurrentTime?.() ?? 0;
    } else if (games) {
      time += parseFloat(games![(part?.part ?? 1) - 1].start);
      time += (current as { getCurrentTime?: () => number }).getCurrentTime?.() ?? 0;
    } else {
      time += (current as { currentTime?: number }).currentTime ?? 0;
    }
    time += delay ?? 0;
    time += userChatDelay ?? 0;
    return time;
  }, [playerRef, youtube, delay, part, userChatDelay, games, isYoutubeVod]);

  const isPlaying = useCallback(() => {
    const current = playerRef.current;
    if (!current) return false;
    if (isYoutubeVod || games) {
      return (current as { getPlayerState?: () => number }).getPlayerState?.() === 1;
    }
    return !!(current as { paused?: boolean }).paused === false;
  }, [isYoutubeVod, games, playerRef]);

  const getEmoteImageUrl = useCallback((emote: EmoteEntry, type: EmoteProvider, size: number = 1): string => {
    switch (type) {
      case 'FFZ':
        return `${BASE_FFZ_EMOTE_CDN}/${emote.id}/${size}`;
      case 'BTTV':
        return `${BASE_BTTV_EMOTE_CDN}/${emote.id}/${size === 4 ? 2 : size}x`;
      case '7TV':
        return `${BASE_7TV_EMOTE_CDN}/${emote.id}/${size}x.webp`;
      default:
        return `${BASE_TWITCH_CDN}/emoticons/v2/${emote.id}/default/dark/${size}.0`;
    }
  }, []);

  const getEmoteImageSrcSet = useCallback((emote: EmoteEntry, type: EmoteProvider): string => {
    switch (type) {
      case 'FFZ':
        return `${BASE_FFZ_EMOTE_CDN}/${emote.id}/1 1x, ${BASE_FFZ_EMOTE_CDN}/${emote.id}/2 2x, ${BASE_FFZ_EMOTE_CDN}/${emote.id}/4 4x`;
      case 'BTTV':
        return `${BASE_BTTV_EMOTE_CDN}/${emote.id}/1x 1x, ${BASE_BTTV_EMOTE_CDN}/${emote.id}/2x 2x, ${BASE_BTTV_EMOTE_CDN}/${emote.id}/3x 3x`;
      case '7TV':
        return `${BASE_7TV_EMOTE_CDN}/${emote.id}/1x.webp 1x, ${BASE_7TV_EMOTE_CDN}/${emote.id}/2x.webp 2x, ${BASE_7TV_EMOTE_CDN}/${emote.id}/3x.webp 3x, ${BASE_7TV_EMOTE_CDN}/${emote.id}/4x.webp 4x`;
      default:
        return `${BASE_TWITCH_CDN}/emoticons/v2/${emote.id}/default/dark/1.0 1x, ${BASE_TWITCH_CDN}/emoticons/v2/${emote.id}/default/dark/2.0 2x, ${BASE_TWITCH_CDN}/emoticons/v2/${emote.id}/default/dark/3.0 4x`;
    }
  }, []);

  const SEVENTV_isZeroWidth = useCallback((emote: EmoteEntry): boolean => {
    const ZERO_WIDTH = 1 << 8;
    return (emote.flags && ZERO_WIDTH) !== 0;
  }, []);

  const renderEmoteTooltip = useCallback(
    (emote: EmoteEntry, word: string, key: string) => {
      const emoteType = emote.provider;

      return (
        <MessageTooltip
          key={key}
          title={
            <Box sx={{ maxWidth: '30rem', textAlign: 'center' }}>
              <img
                crossOrigin="anonymous"
                style={{
                  marginBottom: '0.3rem',
                  border: 'none',
                  maxWidth: '100%',
                  verticalAlign: 'top',
                }}
                src={getEmoteImageUrl(emote, emoteType, 2)}
                alt={word}
              />
              <Typography
                sx={{ display: 'block' }}
                variant="caption"
              >{`Emote: ${emote.name || emote.code}`}</Typography>
              <Typography sx={{ display: 'block' }} variant="caption">{`${emoteType} Emotes`}</Typography>
            </Box>
          }
        >
          <Box sx={{ display: 'inline' }}>
            <img
              crossOrigin="anonymous"
              style={{
                verticalAlign: 'middle',
                border: 'none',
                maxWidth: '100%',
                minHeight: '28px',
              }}
              src={getEmoteImageUrl(emote, emoteType)}
              srcSet={getEmoteImageSrcSet(emote, emoteType)}
              alt={word}
            />{' '}
          </Box>
        </MessageTooltip>
      );
    },
    [getEmoteImageUrl, getEmoteImageSrcSet]
  );

  const renderZeroWidthEmote = useCallback(
    (emote: EmoteEntry, word: string, key: string) => {
      const emoteType = emote.provider;

      return (
        <span>
          <img
            key={key}
            crossOrigin="anonymous"
            style={{
              position: 'absolute',
              verticalAlign: 'middle',
              maxWidth: '100%',
              border: 'none',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
            src={getEmoteImageUrl(emote, emoteType)}
            srcSet={getEmoteImageSrcSet(emote, emoteType)}
            alt={word}
          />
        </span>
      );
    },
    [getEmoteImageUrl, getEmoteImageSrcSet]
  );

  const shouldFilterMessage = useCallback((message: string): boolean => {
    const savedSettings = safeLocalStorage.getItem('chatSettings');
    if (!savedSettings) return false;

    try {
      const settings = JSON.parse(savedSettings);
      const filterWords = (settings.filterWords as string[]) || [];
      if (!filterWords || filterWords.length === 0) return false;

      const wordsToMatch = filterWords.map((word) => {
        const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return `\\b${escapedWord}\\b`;
      });

      const pattern = new RegExp(wordsToMatch.join('|'), 'g');

      return pattern.test(message);
    } catch (e) {
      console.error('Failed to parse filter words', e);
      return false;
    }
  }, []);

  const transformMessage = useCallback(
    (fragments: Comment['message'], keyPrefix: string): React.ReactElement | null => {
      if (!fragments) return null;

      const textFragments: React.ReactElement[] = [];
      for (const fragment of fragments) {
        if (fragment.emote || (fragment as unknown as { emoticon?: { emoticon_id: string } }).emoticon) {
          const emoteID = fragment.emote
            ? fragment.emote.emoteID
            : (fragment as unknown as { emoticon: { emoticon_id: string } }).emoticon.emoticon_id;
          textFragments.push(
            renderEmoteTooltip(
              { id: emoteID, code: fragment.text, provider: 'Twitch' as EmoteProvider },
              fragment.text,
              `${keyPrefix}-emote-${fragment.text}-${Math.random().toString(36).slice(2, 11)}`
            )
          );
        } else {
          const words = fragment.text.split(' ');
          let lastNormalEmote: React.ReactElement | null = null;
          let lastNormalEmoteIndex = -1;
          for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const emote = emoteLookup.get(word);
            if (emote) {
              if (emote.provider === '7TV') {
                const isZeroWidth = SEVENTV_isZeroWidth(emote);

                if (isZeroWidth && lastNormalEmote) {
                  const zeroWidthEmote = renderZeroWidthEmote(
                    emote,
                    word,
                    `${keyPrefix}-emote-${word}-${i}-${Math.random().toString(36).slice(2, 11)}`
                  );

                  const emoteContainer = (
                    <Box
                      key={`${keyPrefix}-emote-container-${word}-${i}-${Math.random().toString(36).slice(2, 11)}`}
                      sx={{ display: 'inline', position: 'relative', verticalAlign: 'middle' }}
                    >
                      {zeroWidthEmote}
                      {lastNormalEmote}
                    </Box>
                  );

                  if (lastNormalEmoteIndex >= 0 && lastNormalEmoteIndex < textFragments.length) {
                    textFragments[lastNormalEmoteIndex] = emoteContainer;
                  }
                  lastNormalEmote = null;
                  lastNormalEmoteIndex = -1;
                } else {
                  const normalEmote = renderEmoteTooltip(
                    emote,
                    word,
                    `${keyPrefix}-emote-${word}-${i}-${Math.random().toString(36).slice(2, 11)}`
                  );
                  lastNormalEmote = normalEmote;
                  lastNormalEmoteIndex = textFragments.length;
                  textFragments.push(normalEmote);
                }
              } else {
                const normalEmote = renderEmoteTooltip(
                  emote,
                  word,
                  `${keyPrefix}-emote-${word}-${i}-${Math.random().toString(36).slice(2, 11)}`
                );
                lastNormalEmote = normalEmote;
                lastNormalEmoteIndex = textFragments.length;
                textFragments.push(normalEmote);
              }
            } else {
              lastNormalEmote = null;
              lastNormalEmoteIndex = -1;
              if (testEmoji(word)) {
                textFragments.push(
                  <Twemoji
                    key={`${keyPrefix}-twemoji-${word}-${i}-${Math.random().toString(36).slice(2, 11)}`}
                    options={{ className: 'twemoji' }}
                  >
                    <Typography variant="body1" sx={{ display: 'inline' }}>{`${word} `}</Typography>
                  </Twemoji>
                );
              } else {
                textFragments.push(
                  <Typography
                    key={`${keyPrefix}-twemoji-${word}-${i}-${Math.random().toString(36).slice(2, 11)}`}
                    variant="body1"
                    sx={{ display: 'inline' }}
                  >{`${word} `}</Typography>
                );
              }
            }
          }
        }
      }

      return textFragments.length > 0 ? <Box sx={{ display: 'inline' }}>{textFragments}</Box> : null;
    },
    [emoteLookup, renderEmoteTooltip, SEVENTV_isZeroWidth, renderZeroWidthEmote]
  );

  const transformBadges = (textBadges: Comment['user_badges'], keyPrefix: string): React.ReactElement => {
    if (!badges.current) {
      return <Box sx={{ display: 'inline' }} />;
    }

    const badgeWrapper: React.ReactElement[] = [];
    const { channel: channelBadges, global: globalBadges } = badges.current;

    for (let i = 0; i < textBadges!.length; i++) {
      const textBadge = textBadges![i];
      const badgeId = textBadge._id ?? textBadge.setID;
      const version = textBadge.version;

      const badge =
        channelBadges?.find((b: Badge) => b.set_id === badgeId) ||
        globalBadges?.find((b: Badge) => b.set_id === badgeId);
      if (!badge) continue;

      const badgeVersion = badge.versions.find((v: BadgeVersion) => v.id === version);
      if (!badgeVersion) continue;

      badgeWrapper.push(
        <MessageTooltip
          key={`${keyPrefix}-badge-${badgeId}-${version}`}
          title={
            <Box sx={{ maxWidth: '30rem', textAlign: 'center' }}>
              <img
                crossOrigin="anonymous"
                style={{
                  marginBottom: '0.3rem',
                  border: 'none',
                  maxWidth: '100%',
                  verticalAlign: 'top',
                }}
                src={badgeVersion.image_url_4x}
                alt=""
              />
              <Typography sx={{ display: 'block' }} variant="caption">{`${badgeId}`}</Typography>
            </Box>
          }
        >
          <img
            crossOrigin="anonymous"
            style={{
              display: 'inline-block',
              minWidth: '1rem',
              height: '1rem',
              margin: '0 .2rem .1rem 0',
              backgroundPosition: '50%',
              verticalAlign: 'middle',
            }}
            srcSet={`${badgeVersion.image_url_1x} 1x, ${badgeVersion.image_url_2x} 2x, ${badgeVersion.image_url_4x} 4x`}
            src={badgeVersion.image_url_1x}
            alt=""
          />
        </MessageTooltip>
      );
    }

    return <Box sx={{ display: 'inline' }}>{badgeWrapper}</Box>;
  };

  const buildComments = useCallback(() => {
    if (!playerRef.current || comments.current.length === 0 || !cursor.current || stoppedAtIndex.current === null)
      return;
    if (!isPlaying()) return;

    const time = getCurrentTime();

    if (
      stoppedAtIndex.current > 0 &&
      comments.current[stoppedAtIndex.current - 1] &&
      comments.current[stoppedAtIndex.current - 1].content_offset_seconds > time
    ) {
      setShownMessages([]);
      stoppedAtIndex.current = 0;
    }

    let lastIndex = comments.current.length;
    for (let i = stoppedAtIndex.current; i < comments.current.length; i++) {
      if (comments.current[i].content_offset_seconds > time) {
        lastIndex = i;
        break;
      }
    }

    if (stoppedAtIndex.current === lastIndex && stoppedAtIndex.current !== 0) return;

    const fetchNextComments = () => {
      if (isFetchingNext.current) return;
      if (cursor.current === lastFetchedCursor.current) return;

      isFetchingNext.current = true;

      if (paginationAbortRef.current) {
        paginationAbortRef.current.abort();
      }
      paginationAbortRef.current = new AbortController();
      lastFetchedCursor.current = cursor.current;

      fetch(`${archiveApiBase}/${channel}/vods/${vodId}/comments?cursor=${cursor.current}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: paginationAbortRef.current.signal,
      })
        .then((response) => response.json())
        .then((response) => {
          if (!response.success) {
            throw response;
          }
          return response.data;
        })
        .then((data) => {
          stoppedAtIndex.current = 0;
          comments.current = data.comments;
          cursor.current = data.cursor;
        })
        .catch((e) => {
          if (e.name !== 'AbortError') {
            console.error(e);
          }
        })
        .finally(() => {
          isFetchingNext.current = false;
        });
    };

    newMessages.current = [];
    for (let i = stoppedAtIndex.current; i < lastIndex; i++) {
      const comment = comments.current[i];
      if (!comment.message) continue;

      const messageText = comment.message.map((fragment) => fragment.text).join(' ');

      if (shouldFilterMessage(messageText)) {
        continue;
      }

      newMessages.current.push(
        <Box key={comment.id} sx={{ width: '100%' }}>
          <Box
            sx={{
              alignItems: 'flex-start',
              display: 'flex',
              flexWrap: 'nowrap',
              width: '100%',
              pl: 0.5,
              pt: 0.5,
              pr: 0.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
              {showTimestamp && (
                <Box sx={{ display: 'inline', pl: 1, pr: 1 }}>
                  <Typography variant="caption" color="textSecondary">
                    {toHHMMSS(comment.content_offset_seconds)}
                  </Typography>
                </Box>
              )}
              <Box sx={{ flexGrow: 1 }}>
                {comment.user_badges && transformBadges(comment.user_badges, `comment-${comment.id}`)}
                <Box sx={{ textDecoration: 'none', display: 'inline' }}>
                  <span style={{ color: comment.user_color, fontWeight: 600 }}>{comment.display_name}</span>
                </Box>
                <Box sx={{ display: 'inline' }}>
                  <span>: </span>
                  {transformMessage(comment.message, `comment-${comment.id}`)}
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      );
    }

    if (newMessages.current.length > 0) {
      setShownMessages((prevShownMessages) => {
        const existingKeys = new Set(prevShownMessages.map((msg) => msg.key));

        const uniqueNewMessages = newMessages.current.filter((msg) => !existingKeys.has(msg.key));

        const concatMessages = prevShownMessages.concat(uniqueNewMessages);

        if (concatMessages.length > 200) {
          concatMessages.splice(0, concatMessages.length - 200);
        }
        return concatMessages;
      });

      stoppedAtIndex.current = lastIndex;
      if (!isFetchingNext.current && comments.current.length === lastIndex) fetchNextComments();
    }
  }, [
    getCurrentTime,
    playerRef,
    vodId,
    showTimestamp,
    transformMessage,
    isPlaying,
    shouldFilterMessage,
    archiveApiBase,
    channel,
    transformBadges,
  ]);

  const scrollToBottom = () => {
    if (!chatRef.current) return;

    setScrolling(false);
    scrollingRef.current = false;
    isAtBottomRef.current = true;
    isAutoScrolling.current = true;

    const scrollToBottomSmooth = () => {
      if (scrollingRef.current || !isAtBottomRef.current) {
        isAutoScrolling.current = false;
        return;
      }
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
        setTimeout(() => {
          isAutoScrolling.current = false;
        }, 150);
      }
    };

    scrollToBottomSmooth();
  };

  const handleImageLoad = useCallback(() => {
    if (!isAtBottomRef.current || scrollingRef.current) return;

    if (!isAutoScrolling.current) {
      isAutoScrolling.current = true;
      requestAnimationFrame(() => {
        if (chatRef.current) {
          chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
        setTimeout(() => {
          isAutoScrolling.current = false;
        }, 50);
      });
    }
  }, []);

  useEffect(() => {
    if (!chatRef.current) return;

    const innerContent = chatRef.current.firstElementChild;
    if (!innerContent) return;

    const resizeObserver = new ResizeObserver(() => {
      if (isAtBottomRef.current && !scrollingRef.current && chatRef.current) {
        isAutoScrolling.current = true;
        chatRef.current.scrollTop = chatRef.current.scrollHeight;

        setTimeout(() => {
          isAutoScrolling.current = false;
        }, 50);
      }
    });

    resizeObserver.observe(innerContent);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (paginationAbortRef.current) paginationAbortRef.current.abort();
    };
  }, []);

  useEffect(() => {
    if (scrolling || !isAtBottomRef.current || shownMessages.length === 0) return;
    scrollToBottom();
  }, [shownMessages, scrolling]);

  const loop = useCallback(() => {
    if (loopRef.current !== null) clearInterval(loopRef.current);
    buildComments();
    loopRef.current = setInterval(buildComments, 1000);
    return () => {
      if (loopRef.current !== null) {
        clearInterval(loopRef.current);
        loopRef.current = null;
      }
    };
  }, [buildComments]);

  useEffect(() => {
    loopCbRef.current = loop;
  }, [loop]);

  const handleScroll = useCallback(() => {
    if (!chatRef.current) return;

    if (isAutoScrolling.current) {
      lastScrollHeight.current = chatRef.current.scrollHeight;
      lastScrollTop.current = chatRef.current.scrollTop;
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = chatRef.current;

    if (scrollHeight !== lastScrollHeight.current) {
      lastScrollHeight.current = scrollHeight;
      lastScrollTop.current = scrollTop;
      return;
    }

    const isScrollingUp = scrollTop < lastScrollTop.current;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    const isAtBottom = distanceFromBottom <= SCROLL_TOLERANCE;

    if (isScrollingUp) {
      isAtBottomRef.current = false;
      setScrolling(true);
      scrollingRef.current = true;
    } else if (isAtBottom) {
      isAtBottomRef.current = true;
      setScrolling(false);
      scrollingRef.current = false;
    }

    lastScrollHeight.current = scrollHeight;
    lastScrollTop.current = scrollTop;
  }, []);

  const stopLoop = () => {
    if (loopRef.current !== null) clearInterval(loopRef.current);
  };

  useEffect(() => {
    const abortController = new AbortController();

    if (playRef.current) clearTimeout(playRef.current);
    if (playerState === -1 || !playerRef.current) return;

    const fetchComments = (offset: number = 0) => {
      fetch(`${archiveApiBase}/${channel}/vods/${vodId}/comments?content_offset_seconds=${Math.floor(offset)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: abortController.signal,
      })
        .then((response) => response.json())
        .then((response) => {
          if (!response.success) {
            throw response;
          }
          return response.data;
        })
        .then((data) => {
          comments.current = data.comments;
          cursor.current = data.cursor;
        })
        .catch((e) => {
          if (e.name !== 'AbortError') {
            console.error(e);
          }
        });
    };

    const handlePlayerStateChange = () => {
      if (playerState === 1) {
        const time = getCurrentTime();
        if (
          comments.current.length === 0 ||
          time < comments.current[0].content_offset_seconds ||
          time > comments.current[comments.current.length - 1].content_offset_seconds
        ) {
          playRef.current = setTimeout(() => {
            stopLoop();
            stoppedAtIndex.current = 0;
            comments.current = [];
            cursor.current = null;
            setShownMessages([]);
            fetchComments(time);
            loopCbRef.current?.();
          }, 300);
        } else {
          loopCbRef.current?.();
        }
      } else {
        stopLoop();
      }
    };

    handlePlayerStateChange();

    const currentChatRef = chatRef.current;

    return () => {
      abortController.abort();
      stopLoop();
      if (playRef.current) clearTimeout(playRef.current);

      if (currentChatRef) {
        currentChatRef.removeEventListener('scroll', handleScroll);
      }
    };
  }, [vodId, playerRef, playerState, getCurrentTime, handleScroll, isPlaying, archiveApiBase, channel]);

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      {showChat && (
        <>
          <ChatHeader
            isPortrait={isPortrait}
            showChat={showChat}
            setShowChat={setShowChat}
            setShowModal={setShowModal}
          />
          <Divider />
          <Box sx={{ height: '100%', width: isPortrait ? 'unset' : `${chatWidth}px`, minHeight: 0 }}>
            <ChatMessages
              comments={comments}
              shownMessages={shownMessages}
              scrolling={scrolling}
              scrollToBottom={scrollToBottom}
              chatRef={chatRef}
              handleScroll={handleScroll}
              handleImageLoad={handleImageLoad}
            />
          </Box>
        </>
      )}
      {!isPortrait && !showChat && (
        <Box sx={{ position: 'absolute', right: 0, top: 0 }}>
          <Tooltip title="Expand">
            <IconButton onClick={() => setShowChat(!showChat)}>
              <ChevronRightIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )}
      <ChatSettingsModal
        userChatDelay={userChatDelay}
        setUserChatDelay={setUserChatDelay}
        showModal={showModal}
        setShowModal={setShowModal}
        showTimestamp={showTimestamp}
        setShowTimestamp={setShowTimestamp}
        chatWidth={chatWidth}
        setChatWidth={setChatWidth}
      />
    </Box>
  );
}
