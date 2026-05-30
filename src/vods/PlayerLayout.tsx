import { type ReactNode } from 'react';
import Chat from './Chat';
import type { ChatProps } from './Chat';

interface PlayerLayoutProps {
  isPortrait: boolean;
  chatOnLeft: boolean;
  setChatOnLeft: (v: boolean) => void;
  playerElement: ReactNode;
  chatProps: ChatProps;
}

export default function PlayerLayout(props: PlayerLayoutProps) {
  const { isPortrait, chatOnLeft, setChatOnLeft, playerElement, chatProps } = props;

  const layoutClass = isPortrait ? 'flex-col' : chatOnLeft ? 'flex-row-reverse' : 'flex-row';

  return (
    <div className="h-full w-full">
      <div className={`flex ${layoutClass} h-full w-full min-w-0 overflow-hidden`}>
        <div className={`min-w-0 min-h-0 overflow-hidden ${isPortrait ? 'w-full flex-shrink-0' : 'h-full flex-1'}`}>
          <div className="flex w-full shrink-0 flex-col h-full">{playerElement}</div>
        </div>
        {isPortrait && <hr className="border-[#303032]" />}
        <Chat {...chatProps} chatOnLeft={chatOnLeft} setChatOnLeft={setChatOnLeft} />
      </div>
    </div>
  );
}
