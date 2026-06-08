import { useState, useRef, useCallback, useEffect } from 'react';
import type { Comment, MessageFragment } from '../types';

const MAX_CHAT_MESSAGES = 200;
const CHAT_LOOP_INTERVAL_MS = 1000;
const CHAT_STATE_CHANGE_DELAY_MS = 300;

interface UseChatEngineOptions {
  channel: string;
  vodId: string;
  archiveApiBase: string;
  playerRef: React.RefObject<unknown>;
  getCurrentTime: () => number;
  isPlaying: () => boolean;
  shouldFilterMessage: (message: string) => boolean;
  playerState?: number;
}

interface UseChatEngineReturn {
  messages: Comment[];
  scrolling: boolean;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
  commentsCount: number;
  chatRef: React.RefObject<HTMLElement | null>;
  bottomAnchorRef: React.RefObject<HTMLDivElement | null>;
  handleScroll: () => void;
  scrollToBottom: () => void;
}

export function useChatEngine({
  channel,
  vodId,
  archiveApiBase,
  playerRef,
  getCurrentTime,
  isPlaying,
  shouldFilterMessage,
  playerState,
}: UseChatEngineOptions): UseChatEngineReturn {
  const [messages, setMessages] = useState<Comment[]>([]);
  const [scrolling, setScrolling] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [commentsCount, setCommentsCount] = useState(0);

  const commentsRef = useRef<Comment[]>([]);
  const cursorRef = useRef<string | null>(null);
  const loopRef = useRef<number | null>(null);
  const loopCbRef = useRef<(() => void) | undefined>(undefined);
  const playRef = useRef<number | null>(null);
  const chatRef = useRef<HTMLElement | null>(null);
  const stoppedAtIndexRef = useRef(0);
  const newMessagesRef = useRef<Comment[]>([]);
  const paginationAbortRef = useRef<AbortController | null>(null);
  const isFetchingNextRef = useRef(false);
  const lastFetchedCursorRef = useRef<string | null>(null);
  const lastScrollHeightRef = useRef(0);
  const isAutoScrollingRef = useRef(false);
  const isAtBottomRef = useRef(true);
  const lastScrollTopRef = useRef(0);
  const bottomAnchorRef = useRef<HTMLDivElement | null>(null);
  const scrollRAFRef = useRef<number | null>(null);
  const scrollingRef = useRef(scrolling);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    scrollingRef.current = scrolling;
  }, [scrolling]);

  const fetchWithRetry = useCallback(
    async <T>(fetchFn: () => Promise<T>, retries = 3, delayMs = 1000): Promise<T | null> => {
      for (let i = 0; i < retries; i++) {
        try {
          return await fetchFn();
        } catch (e) {
          if (e instanceof DOMException && e.name === 'AbortError') throw e;
          if (i === retries - 1) {
            console.error('Chat fetch failed after retries:', e);
            return null;
          }
          await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
        }
      }
      return null;
    },
    []
  );

  const fetchNextComments = useCallback(() => {
    if (isFetchingNextRef.current) return;
    if (cursorRef.current === lastFetchedCursorRef.current) return;

    isFetchingNextRef.current = true;

    if (paginationAbortRef.current) {
      paginationAbortRef.current.abort();
    }
    paginationAbortRef.current = new AbortController();
    lastFetchedCursorRef.current = cursorRef.current;

    fetchWithRetry(
      () =>
        fetch(`${archiveApiBase}/${channel}/vods/${vodId}/comments?cursor=${cursorRef.current}`)
          .then((response) => response.json())
          .then((response) => {
            if (!response.success) throw response;
            return response.data;
          }),
      3,
      1000
    )
      .then((data) => {
        if (!data) return;
        stoppedAtIndexRef.current = 0;
        commentsRef.current = data.comments;
        cursorRef.current = data.cursor;
      })
      .finally(() => {
        isFetchingNextRef.current = false;
      });
  }, [channel, vodId, fetchWithRetry]);

  const buildComments = useCallback(() => {
    if (
      !playerRef.current ||
      commentsRef.current.length === 0 ||
      !cursorRef.current ||
      stoppedAtIndexRef.current === null
    )
      return;
    if (!isPlaying()) return;

    const time = getCurrentTime();

    if (
      stoppedAtIndexRef.current > 0 &&
      commentsRef.current[stoppedAtIndexRef.current - 1] &&
      commentsRef.current[stoppedAtIndexRef.current - 1].content_offset_seconds > time
    ) {
      setMessages([]);
      stoppedAtIndexRef.current = 0;
    }

    let lastIndex = commentsRef.current.length;
    for (let i = stoppedAtIndexRef.current; i < commentsRef.current.length; i++) {
      if (commentsRef.current[i].content_offset_seconds > time) {
        lastIndex = i;
        break;
      }
    }

    if (stoppedAtIndexRef.current === lastIndex && stoppedAtIndexRef.current !== 0) return;

    newMessagesRef.current = [];
    for (let i = stoppedAtIndexRef.current; i < lastIndex; i++) {
      const comment = commentsRef.current[i];
      if (!comment.message) continue;

      const messageText = comment.message.map((fragment: MessageFragment) => fragment.text).join(' ');

      if (shouldFilterMessage(messageText)) {
        continue;
      }

      newMessagesRef.current.push(comment);
    }

    if (newMessagesRef.current.length > 0) {
      setMessages((prevMessages) => {
        const existingIds = new Set(prevMessages.map((msg) => msg.id));

        const uniqueNewMessages = newMessagesRef.current.filter((msg) => !existingIds.has(msg.id));

        const concatMessages = prevMessages.concat(uniqueNewMessages);

        const maxLimit = isAtBottomRef.current ? MAX_CHAT_MESSAGES : 2000;

        if (concatMessages.length > maxLimit) {
          concatMessages.splice(0, concatMessages.length - maxLimit);
        }
        return concatMessages;
      });

      stoppedAtIndexRef.current = lastIndex;
      if (!isFetchingNextRef.current && commentsRef.current.length === lastIndex) fetchNextComments();
    }
  }, [playerRef, getCurrentTime, isPlaying, shouldFilterMessage, fetchNextComments]);

  const scrollToBottom = useCallback(() => {
    if (!chatRef.current) return;

    setScrolling(false);
    scrollingRef.current = false;
    isAtBottomRef.current = true;
    isAutoScrollingRef.current = true;

    const scrollToBottomSmooth = () => {
      if (scrollingRef.current || !isAtBottomRef.current) {
        isAutoScrollingRef.current = false;
        return;
      }
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
        setTimeout(() => {
          isAutoScrollingRef.current = false;
        }, 150);
      }
    };

    scrollToBottomSmooth();
  }, []);

  const handleScroll = useCallback(() => {
    if (!chatRef.current) return;
    if (isAutoScrollingRef.current) return;

    if (scrollRAFRef.current) cancelAnimationFrame(scrollRAFRef.current);

    scrollRAFRef.current = requestAnimationFrame(() => {
      if (!chatRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = chatRef.current;
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

      const isAtBottom = distanceFromBottom <= 50;

      if (isAtBottom) {
        isAtBottomRef.current = true;
        setScrolling(false);
        scrollingRef.current = false;
      } else {
        if (scrollTop < lastScrollTopRef.current - 25) {
          isAtBottomRef.current = false;
          setScrolling(true);
          scrollingRef.current = true;
        }
      }

      lastScrollTopRef.current = scrollTop;
    });
  }, []);

  const startLoop = useCallback(() => {
    if (loopRef.current !== null) clearInterval(loopRef.current);
    buildComments();
    loopRef.current = setInterval(buildComments, CHAT_LOOP_INTERVAL_MS);
    return () => {
      if (loopRef.current !== null) {
        clearInterval(loopRef.current);
        loopRef.current = null;
      }
    };
  }, [buildComments]);

  const stopLoop = useCallback(() => {
    if (loopRef.current !== null) clearInterval(loopRef.current);
  }, []);

  const fetchComments = useCallback(
    async (offset: number = 0) => {
      const data = await fetchWithRetry(
        () =>
          fetch(`${archiveApiBase}/${channel}/vods/${vodId}/comments?content_offset_seconds=${Math.floor(offset)}`)
            .then((response) => response.json())
            .then((response) => {
              if (!response.success) throw response;
              return response.data;
            }),
        3,
        1000
      );

      if (data) {
        commentsRef.current = data.comments;
        cursorRef.current = data.cursor;
        setCommentsCount(data.comments.length);
      }

      if (!hasFetchedRef.current && data) {
        hasFetchedRef.current = true;
        setIsLoading(false);
      }
    },
    [channel, vodId, fetchWithRetry]
  );

  useEffect(() => {
    loopCbRef.current = startLoop;
  }, [startLoop]);

  useEffect(() => {
    if (scrolling || !isAtBottomRef.current || messages.length === 0) return;
    scrollToBottom();
  }, [messages, scrolling, scrollToBottom]);

  useEffect(() => {
    if (!chatRef.current) return;

    const innerContent = chatRef.current.firstElementChild;
    if (!innerContent) return;

    const resizeObserver = new ResizeObserver(() => {
      if (isAtBottomRef.current && !scrollingRef.current && chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
        lastScrollHeightRef.current = chatRef.current.scrollHeight;
        lastScrollTopRef.current = chatRef.current.scrollTop;
      }
    });

    resizeObserver.observe(innerContent);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const anchor = bottomAnchorRef.current;
    if (!anchor || !chatRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isAutoScrollingRef.current) {
          isAtBottomRef.current = true;
          setScrolling(false);
          scrollingRef.current = false;
        }
      },
      {
        root: chatRef.current,
        rootMargin: '0px 0px 100px 0px',
        threshold: 0,
      }
    );

    observer.observe(anchor);

    return () => {
      observer.disconnect();
      if (scrollRAFRef.current) cancelAnimationFrame(scrollRAFRef.current);
    };
  }, [chatRef]);

  useEffect(() => {
    return () => {
      if (paginationAbortRef.current) paginationAbortRef.current.abort();
    };
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    if (playRef.current) clearTimeout(playRef.current);
    if (playerState === -1 || !playerRef.current) return;

    const handlePlayerStateChange = () => {
      if (playerState === 1) {
        const time = getCurrentTime();
        if (
          commentsRef.current.length === 0 ||
          time < commentsRef.current[0].content_offset_seconds ||
          time > commentsRef.current[commentsRef.current.length - 1].content_offset_seconds
        ) {
          playRef.current = setTimeout(() => {
            stopLoop();
            stoppedAtIndexRef.current = 0;
            commentsRef.current = [];
            cursorRef.current = null;
            setMessages([]);
            setCommentsCount(0);
            hasFetchedRef.current = false;
            setIsLoading(true);
            fetchComments(time);
            loopCbRef.current?.();
          }, CHAT_STATE_CHANGE_DELAY_MS);
        } else {
          loopCbRef.current?.();
        }
      } else {
        stopLoop();
      }
    };

    handlePlayerStateChange();

    return () => {
      abortController.abort();
      stopLoop();
      if (playRef.current) clearTimeout(playRef.current);
    };
  }, [vodId, playerRef, playerState, getCurrentTime, stopLoop, fetchComments]);

  return {
    messages,
    scrolling,
    isLoading,
    setIsLoading,
    commentsCount,
    chatRef,
    bottomAnchorRef,
    handleScroll,
    scrollToBottom,
  };
}
