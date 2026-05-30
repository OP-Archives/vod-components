import { Pause, Loader2 } from 'lucide-react';
import type { Comment } from '../../types';

interface ChatMessagesProps {
  comments: Comment[] | React.MutableRefObject<Comment[]>;
  shownMessages: React.ReactElement[];
  scrolling: boolean;
  scrollToBottom: () => void;
  chatRef: React.MutableRefObject<HTMLElement | null>;
  handleScroll: () => void;
  isLoading: boolean;
  commentsCount: number;
}

export default function ChatMessages(props: ChatMessagesProps) {
  const { shownMessages, scrolling, scrollToBottom, chatRef, handleScroll, isLoading, commentsCount } = props;

  if (commentsCount === 0) {
    if (isLoading) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-white" />
        </div>
      );
    }
    return (
      <div className="flex h-full w-full flex-col items-center justify-center">
        <p className="text-sm text-[#9ca3af]">No messages</p>
      </div>
    );
  }

  return (
    <>
      <div
        ref={chatRef as React.Ref<HTMLDivElement>}
        onScroll={handleScroll}
        className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto"
      >
        <div className="min-h-0 flex-1"></div>

        <div className="flex shrink-0 flex-col py-2">{shownMessages}</div>
      </div>
      {scrolling && (
        <div className="relative flex justify-center">
          <button
            onClick={scrollToBottom}
            className="absolute bottom-1 z-10 flex cursor-pointer items-center gap-1.5 rounded-full bg-[#18181b] px-4 py-2 text-xs text-[#9ca3af] shadow-md transition-all hover:bg-[#18181b] hover:text-[#f0f0f5]"
          >
            <Pause size={18} />
            <span>Chat Paused</span>
          </button>
        </div>
      )}
    </>
  );
}
