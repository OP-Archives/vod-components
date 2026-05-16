import { ChevronRight, Settings } from 'lucide-react';

interface ChatHeaderProps {
  isPortrait: boolean;
  showChat: boolean;
  setShowChat: (v: boolean) => void;
  setShowModal: (v: boolean) => void;
}

export default function ChatHeader(props: ChatHeaderProps) {
  const { isPortrait, showChat, setShowChat, setShowModal } = props;

  return (
    <div className="flex items-center justify-between flex-nowrap p-1">
      {!isPortrait && (
        <button
          onClick={() => setShowChat(!showChat)}
          className="text-white hover:text-gray-300 transition-colors"
          title="Collapse"
        >
          <ChevronRight size={20} />
        </button>
      )}
      <span className="flex-1 text-center text-sm font-medium text-white">Chat Replay</span>
      <button
        onClick={() => setShowModal(true)}
        className="text-white hover:text-gray-300 transition-colors"
        title="Settings"
      >
        <Settings size={20} />
      </button>
    </div>
  );
}
