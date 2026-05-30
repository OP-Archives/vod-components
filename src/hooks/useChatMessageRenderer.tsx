import { memo, useCallback } from 'react';
import type { Comment, EmoteEntry, EmoteProvider, Badge, BadgeVersion } from '../types';
import { toHHMMSS } from '../utils/helpers';
import MessageTooltip from '../vods/Chat/MessageTooltip';
import { Twemoji, emojiTest, extractEmojis } from '../vods/Chat/Twemoji';
import { adjustUsernameColor } from '../vods/Chat/UsernameColor';

const URL_REGEX = /^(https?:\/\/)?[\w.-]+\.[\w\/.-]+$/i;

interface MemoizedCommentProps {
  comment: Comment;
  showTimestamp: boolean;
  transformBadges: (_badges: Comment['user_badges'], _keyPrefix: string) => React.ReactElement;
  transformMessage: (_fragments: Comment['message'], _keyPrefix: string) => React.ReactNode | null;
  fontFamily: string;
  messageFontSize: number;
}

export const MemoizedComment = memo(function MemoizedComment({
  comment,
  showTimestamp,
  transformBadges,
  transformMessage,
  fontFamily,
  messageFontSize,
}: MemoizedCommentProps) {
  return (
    <div
      className="chat-message-highlight flex w-full shrink-0 items-baseline px-2 py-1 transition-colors hover:bg-white/5"
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

interface ChatMessageRendererProps {
  emoteLookup: Map<string, EmoteEntry>;
  getEmoteImageUrl: (emote: EmoteEntry, type: EmoteProvider, size?: number) => string;
  getEmoteImageSrcSet: (emote: EmoteEntry, type: EmoteProvider) => string;
  seventvIsZeroWidth: (emote: EmoteEntry) => boolean;
  badgesRef: React.RefObject<Record<'channel' | 'global', Badge[]> | undefined>;
}

export function useChatMessageRenderer({
  emoteLookup,
  getEmoteImageUrl,
  getEmoteImageSrcSet,
  seventvIsZeroWidth,
  badgesRef,
}: ChatMessageRendererProps) {
  const renderEmoteTooltip = useCallback(
    (emote: EmoteEntry, word: string, key: string) => {
      const emoteType = emote.provider;
      return (
        <MessageTooltip
          key={key}
          title={
            <div className="flex w-fit flex-col items-center">
              <img
                className="mb-[0.3rem] w-auto border-none align-top"
                src={getEmoteImageUrl(emote, emoteType, 2)}
                alt={word}
              />
              <p className="block text-xs">{`Emote: ${emote.name || emote.code}`}</p>
              <p className="block text-xs">{`${emoteType} Emotes`}</p>
            </div>
          }
        >
          <span style={{ display: 'inline-block', verticalAlign: 'middle' }}>
            <img
              className="h-auto min-h-[28px] w-auto max-w-full border-none"
              style={{ verticalAlign: 'middle' }}
              src={getEmoteImageUrl(emote, emoteType)}
              srcSet={getEmoteImageSrcSet(emote, emoteType)}
              alt={word}
            />{' '}
          </span>
        </MessageTooltip>
      );
    },
    [getEmoteImageUrl, getEmoteImageSrcSet]
  );

  const renderCombinedEmoteTooltip = useCallback(
    (normalEmote: EmoteEntry, zwEmote: EmoteEntry, key: string) => {
      const normalType = normalEmote.provider;
      const zwType = zwEmote.provider;
      return (
        <MessageTooltip
          key={key}
          title={
            <div className="flex w-fit flex-col items-center gap-2">
              <div className="flex flex-col items-center">
                <img
                  className="mb-[0.3rem] w-auto border-none align-top"
                  src={getEmoteImageUrl(normalEmote, normalType, 2)}
                  alt={normalEmote.code}
                />
                <p className="block text-xs">{`Emote: ${normalEmote.name || normalEmote.code}`}</p>
                <p className="block text-xs">{`${normalType} Emotes`}</p>
              </div>
              <hr className="w-full border-[#222230]" />
              <div className="flex flex-col items-center">
                <img
                  className="mb-[0.3rem] w-auto border-none align-top"
                  src={getEmoteImageUrl(zwEmote, zwType, 2)}
                  alt={zwEmote.code}
                />
                <p className="block text-xs">{`Zero-Width: ${zwEmote.name || zwEmote.code}`}</p>
                <p className="block text-xs">{`${zwType} Emotes`}</p>
              </div>
            </div>
          }
        >
          <span style={{ display: 'inline-block', position: 'relative', verticalAlign: 'middle' }}>
            <img
              className="h-auto min-h-[28px] w-auto max-w-full border-none"
              style={{ verticalAlign: 'middle' }}
              src={getEmoteImageUrl(normalEmote, normalType)}
              srcSet={getEmoteImageSrcSet(normalEmote, normalType)}
              alt={normalEmote.code}
            />
            <img
              className="pointer-events-none absolute top-1/2 left-1/2 h-auto w-auto max-w-full -translate-x-1/2 -translate-y-1/2 border-none align-middle"
              style={{ verticalAlign: 'middle' }}
              src={getEmoteImageUrl(zwEmote, zwType)}
              srcSet={getEmoteImageSrcSet(zwEmote, zwType)}
              alt={zwEmote.code}
            />
          </span>
        </MessageTooltip>
      );
    },
    [getEmoteImageUrl, getEmoteImageSrcSet]
  );

  const transformMessage = useCallback(
    (fragments: Comment['message'], keyPrefix: string): React.ReactNode | null => {
      if (!fragments) return null;

      const textFragments: (React.ReactElement | string)[] = [];
      for (let fIndex = 0; fIndex < fragments.length; fIndex++) {
        const fragment = fragments[fIndex];

        if (fragment.emote || fragment.emoticon) {
          const emoteID = fragment.emote ? fragment.emote.emoteID : fragment.emoticon!.emoticon_id;
          textFragments.push(
            renderEmoteTooltip(
              { id: emoteID, code: fragment.text, provider: 'Twitch' as EmoteProvider },
              fragment.text,
              `${keyPrefix}-frag-${fIndex}-emote-${fragment.text}`
            ),
            ' '
          );
        } else {
          const words = fragment.text.split(' ');
          let lastNormalEmoteData: EmoteEntry | null = null;
          let lastNormalEmoteIndex = -1;
          for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const emote = emoteLookup.get(word);
            if (emote) {
              if (emote.provider === '7TV') {
                const isZeroWidth = seventvIsZeroWidth(emote);

                if (isZeroWidth && lastNormalEmoteData) {
                  const storedEmote = lastNormalEmoteData as EmoteEntry;
                  const combinedKey = `${keyPrefix}-frag-${fIndex}-combined-${storedEmote.code}-${word}-${i}`;
                  const combined = renderCombinedEmoteTooltip(storedEmote, emote, combinedKey);

                  if (lastNormalEmoteIndex >= 0 && lastNormalEmoteIndex < textFragments.length) {
                    textFragments[lastNormalEmoteIndex] = combined;
                  }
                  lastNormalEmoteData = null;
                  lastNormalEmoteIndex = -1;
                } else if (isZeroWidth) {
                  const zeroWidthKey = `${keyPrefix}-frag-${fIndex}-emote-${word}-${i}`;
                  const zwSpan = (
                    <MessageTooltip
                      key={zeroWidthKey}
                      title={
                        <div className="flex w-fit flex-col items-center">
                          <img
                            className="mb-[0.3rem] w-auto border-none align-top"
                            src={getEmoteImageUrl(emote, emote.provider, 2)}
                            alt={word}
                          />
                          <p className="block text-xs">{`Emote: ${emote.name || emote.code}`}</p>
                          <p className="block text-xs">{`${emote.provider} Emotes`}</p>
                        </div>
                      }
                    >
                      <span style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                        <img
                          className="h-auto min-h-[28px] w-auto max-w-full border-none"
                          style={{ verticalAlign: 'middle' }}
                          src={getEmoteImageUrl(emote, emote.provider)}
                          srcSet={getEmoteImageSrcSet(emote, emote.provider)}
                          alt={word}
                        />{' '}
                      </span>
                    </MessageTooltip>
                  );
                  textFragments.push(zwSpan, ' ');
                } else {
                  const normalKey = `${keyPrefix}-frag-${fIndex}-emote-${word}-${i}`;
                  const normalEmoteEl = renderEmoteTooltip(emote, word, normalKey);
                  lastNormalEmoteData = emote;
                  lastNormalEmoteIndex = textFragments.length;
                  textFragments.push(normalEmoteEl, ' ');
                }
              } else {
                const normalKey = `${keyPrefix}-frag-${fIndex}-emote-${word}-${i}`;
                const normalEmoteEl = renderEmoteTooltip(emote, word, normalKey);
                lastNormalEmoteData = emote;
                lastNormalEmoteIndex = textFragments.length;
                textFragments.push(normalEmoteEl, ' ');
              }
            } else {
              lastNormalEmoteData = null;
              if (emojiTest(word)) {
                const parts = extractEmojis(word);
                for (const part of parts) {
                  if (part.text) {
                    textFragments.push(
                      <span key={`${keyPrefix}-frag-${fIndex}-text-${part.text}-${i}`}>{part.text}</span>
                    );
                  } else {
                    textFragments.push(
                      <MessageTooltip
                        key={`${keyPrefix}-frag-${fIndex}-twemoji-${part.emoji}-${i}`}
                        title={
                          <div className="flex w-fit flex-col items-center">
                            <Twemoji options={{ className: 'twemoji' }}>{part.emoji}</Twemoji>
                            <p className="block text-xs">Twitter Emotes</p>
                          </div>
                        }
                      >
                        <span style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                          <Twemoji options={{ className: 'twemoji' }}>{part.emoji}</Twemoji>
                        </span>
                      </MessageTooltip>
                    );
                  }
                }
                textFragments.push(' ');
              } else if (URL_REGEX.test(word)) {
                textFragments.push(
                  <a
                    key={`${keyPrefix}-frag-${fIndex}-text-${word}-${i}`}
                    href={`/leave?target=${encodeURIComponent(word)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--chat-accent)] hover:underline"
                  >
                    {word}
                  </a>,
                  ' '
                );
              } else {
                textFragments.push(<span key={`${keyPrefix}-frag-${fIndex}-text-${word}-${i}`}>{word}</span>, ' ');
              }
            }
          }
        }
      }

      return textFragments.length > 0 ? <span style={{ display: 'inline' }}>{textFragments}</span> : null;
    },
    [
      emoteLookup,
      renderEmoteTooltip,
      renderCombinedEmoteTooltip,
      seventvIsZeroWidth,
      getEmoteImageUrl,
      getEmoteImageSrcSet,
    ]
  );

  const transformBadges = useCallback(
    (textBadges: Comment['user_badges'], keyPrefix: string): React.ReactElement => {
      if (!badgesRef.current) {
        return <span className="inline" />;
      }

      const badgeWrapper: React.ReactElement[] = [];
      const { channel: channelBadges, global: globalBadges } = badgesRef.current;

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
              <div className="flex w-fit flex-col items-center">
                <img className="mb-[0.3rem] max-w-full border-none align-top" src={badgeVersion.image_url_4x} alt="" />
                <p className="block text-xs">{`${badgeId}`}</p>
              </div>
            }
          >
            <img
              className="inline-block h-[1rem] min-w-[1rem] align-middle"
              style={{ margin: '0 0.2rem 0.1rem 0', backgroundPosition: '50%' }}
              srcSet={`${badgeVersion.image_url_1x} 1x, ${badgeVersion.image_url_2x} 2x, ${badgeVersion.image_url_4x} 4x`}
              src={badgeVersion.image_url_1x}
              alt=""
            />
          </MessageTooltip>
        );
      }

      return <span style={{ display: 'inline' }}>{badgeWrapper}</span>;
    },
    [badgesRef]
  );

  return {
    transformMessage,
    transformBadges,
  };
}
