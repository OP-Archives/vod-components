import React, { useMemo, useCallback } from 'react';
import type {
  EmoteEntry,
  EmoteProvider,
  FfzEmote,
  BttvEmote,
  SevenTVEmote,
  Badge,
  BadgeVersion,
  Comment,
} from '../../types';
import MessageTooltip from './MessageTooltip';
import { Twemoji, emojiTest, extractEmojis } from './Twemoji';

const BASE_TWITCH_CDN = 'https://static-cdn.jtvnw.net';
const BASE_FFZ_EMOTE_CDN = 'https://cdn.frankerfacez.com/emote';
const BASE_BTTV_EMOTE_CDN = 'https://cdn.betterttv.net/emote';
const BASE_7TV_EMOTE_CDN = 'https://cdn.7tv.app/emote';
const BASE_KICK_EMOTE_CDN = 'https://files.kick.com/emotes';

const URL_REGEX = /^(https?:\/\/)?[\w.-]+\.[\w\/.-]+$/i;

interface UseEmoteRenderingOptions {
  emotes: {
    ffz_emotes?: FfzEmote[];
    bttv_emotes?: BttvEmote[];
    seventv_emotes?: SevenTVEmote[];
  };
  badgesRef: React.RefObject<
    | {
        platform: 'twitch' | 'kick';
        channel: Badge[];
        global: Badge[];
        kickBadges: Record<string, string>;
      }
    | undefined
  >;
  platform: string;
}

interface UseEmoteRenderingReturn {
  transformMessage: (fragments: Comment['message'], keyPrefix: string) => React.ReactNode | null;
  transformBadges: (textBadges: Comment['user_badges'], keyPrefix: string) => React.ReactElement;
  renderEmoteTooltip: (emote: EmoteEntry, word: string, key: string) => React.ReactElement;
}

export function useEmoteRendering({ emotes, badgesRef, platform }: UseEmoteRenderingOptions): UseEmoteRenderingReturn {
  const emoteLookup = useMemo(() => {
    const lookup = new Map<string, EmoteEntry>();
    const ffz = emotes?.ffz_emotes || [];
    const bttv = emotes?.bttv_emotes || [];
    const seventv = emotes?.seventv_emotes || [];

    ffz.forEach((emote: FfzEmote) => {
      const code = emote.code || emote.text;
      const name = emote.name || code;
      lookup.set(code || name, { ...emote, code, name, provider: 'FFZ' as EmoteProvider });
    });
    bttv.forEach((emote: BttvEmote) =>
      lookup.set(emote.code, { ...emote, name: emote.code, provider: 'BTTV' as EmoteProvider })
    );
    seventv.forEach((emote: SevenTVEmote) => {
      const code = emote.code || '';
      const name = emote.name || code;
      lookup.set(name, { ...emote, code, name, provider: '7TV' as EmoteProvider });
    });

    return lookup;
  }, [emotes]);

  const getEmoteImageUrl = useCallback((emote: EmoteEntry, type: EmoteProvider, size: number = 1): string => {
    switch (type) {
      case 'FFZ':
        return `${BASE_FFZ_EMOTE_CDN}/${emote.id}/${size}`;
      case 'BTTV':
        return `${BASE_BTTV_EMOTE_CDN}/${emote.id}/${size === 4 ? 2 : size}x`;
      case '7TV':
        return `${BASE_7TV_EMOTE_CDN}/${emote.id}/${size}x.webp`;
      case 'Kick':
        return `${BASE_KICK_EMOTE_CDN}/${emote.id}/fullsize`;
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
      case 'Kick':
        return `${BASE_KICK_EMOTE_CDN}/${emote.id}/fullsize 1x`;
      default:
        return `${BASE_TWITCH_CDN}/emoticons/v2/${emote.id}/default/dark/1.0 1x, ${BASE_TWITCH_CDN}/emoticons/v2/${emote.id}/default/dark/2.0 2x, ${BASE_TWITCH_CDN}/emoticons/v2/${emote.id}/default/dark/3.0 4x`;
    }
  }, []);

  const SEVENTV_isZeroWidth = useCallback((emote: EmoteEntry): boolean => {
    const ZERO_WIDTH = 1 << 8;
    return (emote.flags && ZERO_WIDTH) !== 0;
  }, []);

  const getEmoteImageClassName = useCallback((type: EmoteProvider): string => {
    return type === 'Kick'
      ? 'h-auto min-h-[28px] max-h-[32px] w-auto max-w-full border-none'
      : 'h-auto min-h-[28px] w-auto max-w-full border-none';
  }, []);

  const getEmoteImageStyle = useCallback((emote: EmoteEntry): React.CSSProperties => {
    if (emote.width && emote.height) {
      return { width: `${emote.width}px`, height: `${emote.height}px` };
    }
    return {};
  }, []);

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
              className={getEmoteImageClassName(emoteType)}
              style={{ ...getEmoteImageStyle(emote), verticalAlign: 'middle' }}
              src={getEmoteImageUrl(emote, emoteType)}
              srcSet={getEmoteImageSrcSet(emote, emoteType)}
              alt={word}
            />{' '}
          </span>
        </MessageTooltip>
      );
    },
    [getEmoteImageUrl, getEmoteImageSrcSet, getEmoteImageClassName, getEmoteImageStyle]
  );

  const renderCombinedEmoteTooltip = useCallback(
    (baseData: { normal?: EmoteEntry; twemoji?: string; isZw?: boolean }, zwEmotes: EmoteEntry[], key: string) => {
      const normalType = baseData.normal?.provider;
      const baseCode = baseData.twemoji || baseData.normal?.code || '';
      const baseName = baseData.twemoji
        ? ''
        : baseData.isZw
          ? baseData.normal?.name || baseData.normal?.code
          : baseData.normal?.name || baseData.normal?.code;
      const baseProviderLabel = baseData.twemoji
        ? 'Twitter Emotes'
        : baseData.isZw
          ? 'Zero-Width'
          : `${normalType} Emotes`;

      return (
        <MessageTooltip
          key={key}
          title={
            <div className="flex w-fit max-w-[280px] flex-col gap-0">
              <div className="flex flex-col items-center self-center">
                {baseData.twemoji ? (
                  <div className="mb-[0.3rem]">
                    <Twemoji options={{ className: 'twemoji' }}>{baseData.twemoji}</Twemoji>
                  </div>
                ) : (
                  <img
                    className="mb-[0.3rem] w-auto border-none align-top"
                    src={getEmoteImageUrl(baseData.normal!, normalType!, 2)}
                    alt={baseCode}
                  />
                )}
                <p className="block text-xs font-bold">{baseName}</p>
                <p className="block text-[11px] text-[#9ca3af]">{baseProviderLabel}</p>
              </div>
              {zwEmotes.length > 0 && (
                <div className="mt-1 flex w-full flex-col items-center border-t border-[#222230] pt-0">
                  <p className="mb-1.5 text-[11px] font-semibold text-[#9ca3af]">Modifiers:</p>
                  <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
                    {zwEmotes.map((zwEmote, index) => (
                      <span
                        key={`${zwEmote.code}-${index}`}
                        className="flex items-center text-xs whitespace-nowrap text-[#f0f0f5]"
                      >
                        <img
                          className="mr-1.5 h-[1.25rem] w-auto border-none align-middle"
                          src={getEmoteImageUrl(zwEmote, zwEmote.provider, 1)}
                          alt={zwEmote.code}
                        />
                        - {zwEmote.name || zwEmote.code}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          }
        >
          <span style={{ display: 'inline-grid', placeItems: 'center', verticalAlign: 'middle' }}>
            {baseData.twemoji ? (
              <span
                style={{ gridArea: '1 / 1', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Twemoji options={{ className: 'twemoji' }}>{baseData.twemoji}</Twemoji>
              </span>
            ) : (
              <img
                className={getEmoteImageClassName(normalType!)}
                style={{ ...getEmoteImageStyle(baseData.normal!), gridArea: '1 / 1', verticalAlign: 'middle' }}
                src={getEmoteImageUrl(baseData.normal!, normalType!)}
                srcSet={getEmoteImageSrcSet(baseData.normal!, normalType!)}
                alt={baseCode}
              />
            )}
            {zwEmotes.map((zwEmote, index) => (
              <img
                key={`${zwEmote.code}-${index}`}
                className="pointer-events-none h-auto min-h-[28px] w-auto max-w-none border-none"
                style={{
                  ...getEmoteImageStyle(zwEmote),
                  gridArea: '1 / 1',
                  verticalAlign: 'middle',
                  zIndex: 10 + index,
                }}
                src={getEmoteImageUrl(zwEmote, zwEmote.provider)}
                srcSet={getEmoteImageSrcSet(zwEmote, zwEmote.provider)}
                alt={zwEmote.code}
              />
            ))}
          </span>
        </MessageTooltip>
      );
    },
    [getEmoteImageUrl, getEmoteImageSrcSet, getEmoteImageClassName, getEmoteImageStyle]
  );

  const transformMessage = useCallback(
    (fragments: Comment['message'], keyPrefix: string): React.ReactNode | null => {
      if (!fragments) return null;

      const textFragments: (React.ReactElement | string)[] = [];
      let lastNormalEmoteData: {
        normal?: EmoteEntry;
        twemoji?: string;
        zws: EmoteEntry[];
        textFragIndex: number;
        isZw?: boolean;
      } | null = null;

      for (let fIndex = 0; fIndex < fragments.length; fIndex++) {
        const fragment = fragments[fIndex];

        if (fragment.emote || fragment.emoticon) {
          const emoteID = fragment.emote ? fragment.emote.emoteID : fragment.emoticon!.emoticon_id;
          const platformType = (platform.charAt(0).toUpperCase() + platform.slice(1)) as EmoteProvider;
          const platformEmote: EmoteEntry = {
            id: emoteID,
            code: fragment.text,
            provider: platformType,
          };
          lastNormalEmoteData = {
            normal: platformEmote,
            twemoji: undefined,
            zws: [],
            textFragIndex: textFragments.length,
          };
          textFragments.push(
            renderEmoteTooltip(platformEmote, fragment.text, `${keyPrefix}-frag-${fIndex}-emote-${fragment.text}`),
            ' '
          );
        } else {
          const words = fragment.text.split(' ');
          for (let i = 0; i < words.length; i++) {
            const word = words[i];

            if (!word) {
              textFragments.push(' ');
              continue;
            }
            const emote = emoteLookup.get(word);
            if (emote) {
              if (emote.provider === '7TV' && SEVENTV_isZeroWidth(emote)) {
                if (lastNormalEmoteData) {
                  lastNormalEmoteData.zws.push(emote);
                  const baseCode = lastNormalEmoteData.twemoji || lastNormalEmoteData.normal!.code;
                  const combinedKey = `${keyPrefix}-frag-${fIndex}-combined-${baseCode}-${i}`;
                  textFragments[lastNormalEmoteData.textFragIndex] = renderCombinedEmoteTooltip(
                    lastNormalEmoteData,
                    lastNormalEmoteData.zws,
                    combinedKey
                  );
                } else {
                  lastNormalEmoteData = {
                    normal: emote,
                    twemoji: undefined,
                    zws: [],
                    textFragIndex: textFragments.length,
                    isZw: true,
                  };
                  textFragments.push(
                    renderEmoteTooltip(emote, word, `${keyPrefix}-frag-${fIndex}-emote-${word}-${i}`),
                    ' '
                  );
                }
              } else {
                const normalKey = `${keyPrefix}-frag-${fIndex}-emote-${word}-${i}`;
                const normalEmoteEl = renderEmoteTooltip(emote, word, normalKey);
                lastNormalEmoteData = {
                  normal: emote,
                  twemoji: undefined,
                  zws: [],
                  textFragIndex: textFragments.length,
                };
                textFragments.push(normalEmoteEl, ' ');
              }
            } else {
              if (emojiTest(word)) {
                const parts = extractEmojis(word);
                parts.forEach((part, pIndex) => {
                  if (part.text) {
                    textFragments.push(
                      <span key={`${keyPrefix}-frag-${fIndex}-text-${part.text}-${i}-${pIndex}`}>{part.text}</span>
                    );
                    lastNormalEmoteData = null;
                  } else {
                    const twemojiIndex = textFragments.length;
                    textFragments.push(
                      <MessageTooltip
                        key={`${keyPrefix}-frag-${fIndex}-twemoji-${part.emoji}-${i}-${pIndex}`}
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
                    lastNormalEmoteData = { twemoji: part.emoji, zws: [], textFragIndex: twemojiIndex };
                  }
                });
                textFragments.push(' ');
              } else if (URL_REGEX.test(word)) {
                textFragments.push(
                  <a
                    key={`${keyPrefix}-frag-${fIndex}-text-${word}-${i}`}
                    href={word}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--chat-accent)] hover:underline"
                  >
                    {word}
                  </a>,
                  ' '
                );
                lastNormalEmoteData = null;
              } else {
                textFragments.push(<span key={`${keyPrefix}-frag-${fIndex}-text-${word}-${i}`}>{word}</span>, ' ');
                lastNormalEmoteData = null;
              }
            }
          }
        }
      }

      return textFragments.length > 0 ? (
        <span style={{ display: 'inline', verticalAlign: 'middle' }}>{textFragments}</span>
      ) : null;
    },
    [
      emoteLookup,
      renderEmoteTooltip,
      renderCombinedEmoteTooltip,
      SEVENTV_isZeroWidth,
      getEmoteImageUrl,
      getEmoteImageSrcSet,
      platform,
    ]
  );

  const transformBadges = useCallback(
    (textBadges: Comment['user_badges'], keyPrefix: string): React.ReactElement => {
      if (!badgesRef.current) {
        return <span className="inline" />;
      }

      const badgeWrapper: React.ReactElement[] = [];

      if (badgesRef.current.platform === 'kick') {
        const milestoneKeys = Object.keys(badgesRef.current.kickBadges)
          .map((k) => k.replace('subscriber_', ''))
          .sort((a, b) => Number(a) - Number(b));

        for (let i = 0; i < textBadges!.length; i++) {
          const textBadge = textBadges![i];
          if (textBadge.url) {
            const badgeTitle = textBadge.setID
              ? `${textBadge.setID.charAt(0).toUpperCase() + textBadge.setID.slice(1)} ${textBadge.badgeVersionId || ''}`.trim()
              : 'Badge';

            badgeWrapper.push(
              <MessageTooltip
                key={`${keyPrefix}-badge-global-${textBadge.setID}-${textBadge.badgeVersionId || i}`}
                title={
                  <div className="flex w-fit flex-col items-center">
                    <img className="mb-[0.3rem] h-[2rem] w-auto border-none align-top" src={textBadge.url} alt="" />
                    <p className="block text-xs">{badgeTitle}</p>
                  </div>
                }
              >
                <img
                  className="inline-block h-[1rem] min-w-[1rem] align-middle"
                  style={{ margin: '0 0.2rem 0.1rem 0', backgroundPosition: '50%' }}
                  src={textBadge.url}
                  alt=""
                />
              </MessageTooltip>
            );
            continue;
          }

          if (textBadge.setID === 'subscriber') {
            const version = Number(textBadge.badgeVersionId);
            let matchedMilestone: string | null = null;
            for (const m of milestoneKeys) {
              if (Number(m) <= version) matchedMilestone = m;
              else break;
            }
            if (!matchedMilestone) continue;
            const key = `subscriber_${matchedMilestone}`;
            const url = badgesRef.current.kickBadges[key];
            if (!url) continue;

            badgeWrapper.push(
              <MessageTooltip
                key={`${keyPrefix}-badge-${key}`}
                title={
                  <div className="flex w-fit flex-col items-center">
                    <img className="mb-[0.3rem] max-w-full border-none align-top" src={url} alt="" />
                    <p className="block text-xs">{`${textBadge.badgeVersionId}-Month Subscriber`}</p>
                  </div>
                }
              >
                <img
                  className="inline-block h-[1rem] min-w-[1rem] align-middle"
                  style={{ margin: '0 0.2rem 0.1rem 0', backgroundPosition: '50%' }}
                  src={url}
                  alt=""
                />
              </MessageTooltip>
            );
          } else if (textBadge.setID === 'sub_gifter') {
            badgeWrapper.push(
              <MessageTooltip
                key={`${keyPrefix}-badge-sub_gifter-${textBadge.badgeVersionId}`}
                title={
                  <div className="flex w-fit flex-col items-center">
                    <svg
                      viewBox="0 0 32 32"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="mb-[0.3rem] size-[calc(1em*(18/13))]"
                      style={{ margin: '0 0 0.3rem 0' }}
                    >
                      <g clipPath="url(#clip0_162_470)">
                        <g clipPath="url(#clip1_162_470)">
                          <path d="M22.34 9.5L26 4H18L16 7L14 4H6L9.66 9.5H4V15.1H28V9.5H22.34Z" fill="#53FC18" />
                          <path d="M26.0799 19.0996H5.8999V28.4996H26.0799V19.0996Z" fill="#53FC18" />
                          <path d="M26.0799 15.0996H5.8999V19.0996H26.0799V15.0996Z" fill="#32970E" />
                        </g>
                      </g>
                      <defs>
                        <clipPath id="clip0_162_470">
                          <rect width="24" height="24.5" fill="white" transform="translate(4 4)" />
                        </clipPath>
                        <clipPath id="clip1_162_470">
                          <rect width="24" height="24.5" fill="white" transform="translate(4 4)" />
                        </clipPath>
                      </defs>
                    </svg>
                    <p className="block text-xs">{`Gifted ${textBadge.badgeVersionId} subs`}</p>
                  </div>
                }
              >
                <svg
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="inline-block h-[1rem] min-w-[1rem] align-middle"
                  style={{ margin: '0 0.2rem 0.1rem 0', backgroundPosition: '50%' }}
                >
                  <g clipPath="url(#clip0_162_470)">
                    <g clipPath="url(#clip1_162_470)">
                      <path d="M22.34 9.5L26 4H18L16 7L14 4H6L9.66 9.5H4V15.1H28V9.5H22.34Z" fill="#53FC18" />
                      <path d="M26.0799 19.0996H5.8999V28.4996H26.0799V19.0996Z" fill="#53FC18" />
                      <path d="M26.0799 15.0996H5.8999V19.0996H26.0799V15.0996Z" fill="#32970E" />
                    </g>
                  </g>
                  <defs>
                    <clipPath id="clip0_162_470">
                      <rect width="24" height="24.5" fill="white" transform="translate(4 4)" />
                    </clipPath>
                    <clipPath id="clip1_162_470">
                      <rect width="24" height="24.5" fill="white" transform="translate(4 4)" />
                    </clipPath>
                  </defs>
                </svg>
              </MessageTooltip>
            );
          }
        }
      } else {
        const { channel: channelBadges, global: globalBadges } = badgesRef.current;

        const channelBadgeMap = new Map<string, Badge>();
        for (const b of channelBadges || []) {
          channelBadgeMap.set(b.set_id, b);
        }
        const globalBadgeMap = new Map<string, Badge>();
        for (const b of globalBadges || []) {
          globalBadgeMap.set(b.set_id, b);
        }

        for (let i = 0; i < textBadges!.length; i++) {
          const textBadge = textBadges![i];
          const badgeId = textBadge._id ?? textBadge.setID;
          const version = textBadge.version;

          const badge = channelBadgeMap.get(badgeId) || globalBadgeMap.get(badgeId);
          if (!badge) continue;

          const badgeVersion = badge.versions.find((v: BadgeVersion) => v.id === version);
          if (!badgeVersion) continue;

          badgeWrapper.push(
            <MessageTooltip
              key={`${keyPrefix}-badge-${badgeId}-${version}`}
              title={
                <div className="flex w-fit flex-col items-center">
                  <img
                    className="mb-[0.3rem] max-w-full border-none align-top"
                    src={badgeVersion.image_url_4x}
                    alt=""
                  />
                  <p className="block text-xs">
                    {badgeId === 'subscriber'
                      ? version === '0' || version === '1'
                        ? 'Subscriber'
                        : `${version}-Month Subscriber`
                      : version !== '1'
                        ? `${badgeId} ${version}`
                        : badgeId}
                  </p>
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
      }

      return <>{badgeWrapper}</>;
    },
    [badgesRef]
  );

  return {
    transformMessage,
    transformBadges,
    renderEmoteTooltip,
  };
}
