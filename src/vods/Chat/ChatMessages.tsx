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
}

export default function ChatMessages(props: ChatMessagesProps) {
  const { comments, shownMessages, scrolling, scrollToBottom, chatRef, handleScroll } = props;

  const commentsArray = Array.isArray(comments) ? comments : comments.current;

  if (commentsArray && commentsArray.length === 0) {
    return (
      <div className="flex justify-center items-center h-full w-full flex-col">
        <div className="flex flex-col justify-center items-center">
          <div className="spinner mt-2" />
        </div>
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
          <div className="flex flex-wrap min-h-0 items-end">{shownMessages}</div>
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
