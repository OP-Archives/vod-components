import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react';
import { useParams } from 'react-router-dom';
import { useChatEngine } from '../hooks/useChatEngine';
import { useChatSettings } from '../hooks/useChatSettings';
import type {
  Comment,
  EmotesResponse,
  FfzEmote,
  BttvEmote,
  SevenTVEmote,
  PartInfo,
  PlayerState,
  VODUpload,
  GameEntry,
  Badge,
} from '../types';
import { toHHMMSS } from '../utils/helpers';
import { hasGetCurrentTime, isNativeVideo } from '../utils/typeGuards';
import ChatHeader from './Chat/ChatHeader';
import ChatMessages from './Chat/ChatMessages';
import ChatSettingsModal from './Chat/ChatSettingsModal';
import { useEmoteRendering } from './Chat/useEmoteRendering';
import { adjustUsernameColor } from './Chat/UsernameColor';

const BASE_BTTV_EMOTE_API = 'https://api.betterttv.net/3';
const BASE_7TV_EMOTE_API = 'https://7tv.io/v3';
const BASE_FFZ_EMOTE_API = 'https://api.frankerfacez.com/v1';

interface MemoizedCommentProps {
  comment: Comment;
  showTimestamp: boolean;
  transformBadges: (_badges: Comment['user_badges'], _keyPrefix: string) => React.ReactElement;
  transformMessage: (_fragments: Comment['message'], _keyPrefix: string) => React.ReactNode | null;
  fontFamily: string;
  messageFontSize: number;
}

const MemoizedComment = memo(function MemoizedComment({
  comment,
  showTimestamp,
  transformBadges,
  transformMessage,
  fontFamily,
  messageFontSize,
}: MemoizedCommentProps) {
  return (
    <div
      className="chat-message-optimize chat-message-highlight flex w-full shrink-0 items-baseline px-2 py-1 transition-colors hover:bg-white/5"
      style={{ '--highlight-color': adjustUsernameColor(comment.user_color) } as React.CSSProperties}
    >
      {showTimestamp && (
        <div
          className="mr-2 min-w-0 shrink-0 align-middle text-[#adadb8]"
          style={{ fontSize: 'var(--chat-font-size-timestamp)' }}
        >
          {toHHMMSS(comment.content_offset_seconds)}
        </div>
      )}
      <div
        className="min-w-0 flex-1 leading-6 break-words text-[#f0f0f5]"
        style={{ fontFamily, fontSize: `${messageFontSize}px` }}
      >
        {comment.user_badges && transformBadges(comment.user_badges, `comment-${comment.id}`)}
        <span className="font-bold" style={{ color: adjustUsernameColor(comment.user_color) }}>
          {comment.display_name}
        </span>
        <span>: </span>
        <span>{transformMessage(comment.message, `comment-${comment.id}`)}</span>
      </div>
    </div>
  );
});

export interface ChatProps {
  isPortrait: boolean;
  vodId: string;
  playerRef: React.RefObject<unknown>;
  userChatDelay: number;
  delay?: number;
  youtube?: VODUpload[];
  part?: PartInfo | null;
  setPart?: (_part: PartInfo | null) => void;
  games?: GameEntry[];
  isYoutubeVod?: boolean;
  platform: string;
  playerState: PlayerState;
  setUserChatDelay: (_v: number) => void;
  twitchId?: number;
  archiveApiBase: string;
  channel: string;
  chatOnLeft: boolean;
  setChatOnLeft: (_v: boolean) => void;
}

export default function Chat(props: ChatProps) {
  const { tenant: channel } = useParams<{ tenant: string }>() || {};
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
    setUserChatDelay,
    platform,
    twitchId,
    archiveApiBase,
    chatOnLeft,
    setChatOnLeft,
    playerState,
  } = props;

  const channelName = channel || props.channel;

  const [showChat, setShowChat] = useState(true);
  const [emotes, setEmotes] = useState<Omit<EmotesResponse, 'vodId'>>({
    ffz_emotes: [],
    bttv_emotes: [],
    seventv_emotes: [],
  });
  const [showModal, setShowModal] = useState(false);
  const badgesRef = useRef<
    | {
        platform: 'twitch' | 'kick';
        channel: Badge[];
        global: Badge[];
        kickBadges: Record<string, string>;
      }
    | undefined
  >(undefined);

  const {
    showTimestamp,
    chatWidth,
    fontFamily,
    messageFontSize,
    filterRegex,
    userChatDelay: settingsDelay,
    setShowTimestamp,
    setChatWidth,
    setFontFamily,
    setMessageFontSize,
  } = useChatSettings();

  const mergedDelay = delay ?? settingsDelay ?? 0;

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
      if (hasGetCurrentTime(current)) {
        time += current.getCurrentTime();
      }
    } else if (games) {
      time += parseFloat(games![(part?.part ?? 1) - 1].start);
      if (hasGetCurrentTime(current)) {
        time += current.getCurrentTime();
      }
    } else {
      if (isNativeVideo(current)) {
        time += current.currentTime ?? 0;
      }
    }
    time += mergedDelay;
    time += userChatDelay ?? 0;
    return time;
  }, [playerRef, youtube, mergedDelay, part, userChatDelay, games, isYoutubeVod]);

  const isPlaying = useCallback(() => {
    const current = playerRef.current;
    if (!current) return false;
    if (isYoutubeVod || games) {
      return (
        typeof current === 'object' &&
        current !== null &&
        'getPlayerState' in current &&
        (current as { getPlayerState?: () => number })?.getPlayerState?.() === 1
      );
    }
    if (isNativeVideo(current)) {
      return current.paused === false;
    }
    return false;
  }, [isYoutubeVod, games, playerRef]);

  const shouldFilterMessage = useCallback(
    (message: string): boolean => {
      const regex = filterRegex;
      if (!regex) return false;
      regex.lastIndex = 0;
      return regex.test(message);
    },
    [filterRegex]
  );

  const { messages, scrolling, isLoading, commentsCount, chatRef, bottomAnchorRef, handleScroll, scrollToBottom } =
    useChatEngine({
      channel: channelName!,
      vodId,
      archiveApiBase,
      playerRef,
      getCurrentTime,
      isPlaying,
      shouldFilterMessage,
      playerState,
    });

  const { transformMessage, transformBadges } = useEmoteRendering({ emotes, badgesRef, platform });

  const commentElements = useMemo(() => {
    return messages.map((comment) => (
      <MemoizedComment
        key={comment.id}
        comment={comment}
        showTimestamp={showTimestamp}
        transformBadges={transformBadges}
        transformMessage={transformMessage}
        fontFamily={fontFamily}
        messageFontSize={messageFontSize}
      />
    ));
  }, [messages, showTimestamp, transformBadges, transformMessage, fontFamily, messageFontSize]);

  useEffect(() => {
    const abortController = new AbortController();

    const loadBadges = () => {
      const url =
        platform === 'kick'
          ? `${archiveApiBase}/${channelName}/badges/kick`
          : `${archiveApiBase}/${channelName}/badges/twitch`;
      fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: abortController.signal,
      })
        .then((response) => response.json())
        .then((response) => {
          if (!response.success) throw response;
          return response.data;
        })
        .then((data) => {
          if (platform === 'kick') {
            const subscriber = (data as { subscriber: Record<string, string> }).subscriber || {};
            const kickBadges: Record<string, string> = {};
            for (const [month, url] of Object.entries(subscriber)) {
              kickBadges[`subscriber_${month}`] = url;
            }
            badgesRef.current = { platform: 'kick', channel: [], global: [], kickBadges };
          } else {
            const twitchData = (data as { channel: Badge[]; global: Badge[] }) || { channel: [], global: [] };
            badgesRef.current = {
              platform: 'twitch',
              channel: twitchData.channel,
              global: twitchData.global,
              kickBadges: {},
            };
          }
        })
        .catch((e) => {
          if (e.name !== 'AbortError') {
            console.error('Badge loading failed:', e);
            badgesRef.current = { platform: platform as 'twitch' | 'kick', channel: [], global: [], kickBadges: {} };
          }
        });
    };

    const loadArchiveEmotes = async () => {
      try {
        const response = await fetch(`${archiveApiBase}/${channelName}/vods/${vodId}/emotes`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: abortController.signal,
        });
        const data = await response.json();
        if (!data.success) throw data;
        const emotesData = data.data;
        const hasFfz = emotesData.ffz_emotes?.length;
        const hasBttv = emotesData.bttv_emotes?.length;
        const has7tv = emotesData.seventv_emotes?.length;

        if (hasFfz || hasBttv || has7tv) {
          setEmotes((prev) => ({
            ffz_emotes: hasFfz ? emotesData.ffz_emotes : prev.ffz_emotes,
            bttv_emotes: hasBttv ? emotesData.bttv_emotes : prev.bttv_emotes,
            seventv_emotes: has7tv ? emotesData.seventv_emotes : prev.seventv_emotes,
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
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          console.error(e);
          fallbackLoadEmotes();
        }
      }
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
          setEmotes((emotes) => ({
            ...emotes,
            bttv_emotes: emotes.bttv_emotes.concat((data as BttvEmote[]) || []),
          }));
        })
        .catch((e) => {
          if (e.name !== 'AbortError') {
            console.error(e);
          }
        });
    };

    const loadBTTVChannelEmotes = async () => {
      if (!twitchId) return;
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
      if (!twitchId) return;
      await fetch(`${BASE_FFZ_EMOTE_API}/room/id/${twitchId}`, {
        method: 'GET',
        signal: abortController.signal,
      })
        .then((response) => response.json())
        .then((data) => {
          if ((data as { status: number }).status >= 400) return;
          const d = data as {
            sets?: Record<string, { emoticons: FfzEmote[] }>;
            room?: { set?: number };
          };
          const emoticons = d.sets?.[String(d.room?.set)]?.emoticons || [];
          setEmotes((emotes) => ({ ...emotes, ffz_emotes: emoticons }));
        })
        .catch((e) => {
          if (e.name !== 'AbortError') {
            console.error(e);
          }
        });
    };

    const load7TVEmotes = async () => {
      if (!twitchId) return;
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
          setEmotes((emotes) => ({
            ...emotes,
            seventv_emotes: emotes.seventv_emotes.concat(d.emotes || []),
          }));
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
  }, [vodId, twitchId, platform, channelName, archiveApiBase]);

  return (
    <div
      className={`${isPortrait ? 'w-full flex-1' : 'shrink-0 self-stretch'} relative flex min-h-0 min-w-0 flex-col bg-[#16161e]`}
    >
      {showChat && (
        <>
          <ChatHeader
            isPortrait={isPortrait}
            showChat={showChat}
            setShowChat={setShowChat}
            setShowModal={setShowModal}
            chatOnLeft={chatOnLeft}
          />
          <hr className="border-t border-[#222230]" />
          <div
            className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
            style={{ width: isPortrait ? '100%' : `${chatWidth || 340}px` }}
          >
            <ChatMessages
              comments={messages}
              isLoading={isLoading}
              commentsCount={commentsCount}
              shownMessages={commentElements}
              scrolling={scrolling}
              scrollToBottom={scrollToBottom}
              chatRef={chatRef as React.MutableRefObject<HTMLElement | null>}
              bottomAnchorRef={bottomAnchorRef}
              handleScroll={handleScroll}
            />
          </div>
        </>
      )}
      {!isPortrait && !showChat && (
        <div className={`absolute top-2 ${chatOnLeft ? 'left-2' : 'right-2'} z-50`}>
          <button
            onClick={() => setShowChat(!showChat)}
            className={`flex cursor-pointer items-center justify-center border border-[#222230] bg-[#16161e] p-1.5 text-white shadow-xl transition-all hover:bg-[#18181b] hover:text-gray-300 ${chatOnLeft ? 'rounded-r-lg border-l-0' : 'rounded-l-lg border-r-0'}`}
            title="Expand Chat"
          >
            {chatOnLeft ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
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
        fontFamily={fontFamily}
        setFontFamily={setFontFamily}
        messageFontSize={messageFontSize}
        setMessageFontSize={setMessageFontSize}
        chatOnLeft={chatOnLeft}
        setChatOnLeft={setChatOnLeft}
      />
    </div>
  );
}
