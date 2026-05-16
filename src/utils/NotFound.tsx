import { useEffect } from 'react';
import CustomLink from './CustomLink';

export default function NotFound({ channel, logo }: { channel: string; logo?: string }) {
  useEffect(() => {
    document.title = `Not Found - ${channel}`;
  }, [channel]);

  const siteLogo = logo || null;

  return (
    <div className="flex flex-col justify-center items-center h-screen w-full">
      {siteLogo && <img src={siteLogo} alt="" className="h-auto max-w-[200px]" />}
      <div className="flex justify-center" style={{ marginTop: siteLogo ? '1rem' : '0' }}>
        <CustomLink href="/">
          <span className="text-sm text-gray-400">Nothing over here..</span>
        </CustomLink>
      </div>
    </div>
  );
}
