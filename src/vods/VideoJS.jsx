import { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import PropTypes from 'prop-types';

VideoJS.propTypes = {
  options: PropTypes.object.isRequired,
  onReady: PropTypes.func,
};

export const VideoJS = (props) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const { options, onReady } = props;

  useEffect(() => {
    if (!playerRef.current) {
      if (!videoRef.current) return;

      const player = (playerRef.current = videojs(videoRef.current, options, () => {
        onReady && onReady(player);
      }));
    }
  }, [options, videoRef, onReady]);

  return (
    <div data-vjs-player>
      <video ref={videoRef} autoPlay playsInline className="video-js player" />
    </div>
  );
};

export default VideoJS;
