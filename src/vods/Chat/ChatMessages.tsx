import { Pause } from 'lucide-react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
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
        <div className="flex justify-center items-center h-full w-full flex-col">
          <div className="flex flex-col justify-center items-center">
            <div className="spinner mt-2" />
          </div>
        </div>
      );
    }

    return (
      <div className="flex justify-center items-center h-full w-full flex-col">
        <p className="text-gray-400 text-sm">No messages</p>
      </div>
    );
  }

  return (
    <>
      <SimpleBar
        scrollableNodeProps={{ ref: chatRef, onScroll: handleScroll }}
        style={{ height: '100%', overflowX: 'hidden' }}
      >
        <div className="flex justify-end flex-col p-0">
          <div className="flex flex-wrap min-h-0">{shownMessages}</div>
        </div>
      </SimpleBar>
      {scrolling && (
        <div className="relative flex justify-center">
          <button
            onClick={scrollToBottom}
            className="absolute bottom-1 z-10 rounded-full bg-[#18181b] text-xs text-gray-300 px-4 py-2 flex items-center gap-1.5 shadow-lg hover:bg-[#2f2f35] hover:text-white transition-all cursor-pointer"
          >
            <Pause size={18} />
            <span>Chat Paused</span>
          </button>
        </div>
      )}
    </>
  );
}
