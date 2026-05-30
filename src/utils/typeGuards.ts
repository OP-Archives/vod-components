export function hasWebkitRequestFullscreen(
  el: unknown
): el is HTMLElement & { webkitRequestFullscreen?: () => Promise<void> } {
  return typeof (el as { webkitRequestFullscreen?: () => void })?.webkitRequestFullscreen === 'function';
}

export function hasWebkitEnterFullscreen(el: unknown): el is HTMLVideoElement & { webkitEnterFullscreen?: () => void } {
  return typeof (el as { webkitEnterFullscreen?: () => void })?.webkitEnterFullscreen === 'function';
}

export function hasGetCurrentTime(el: unknown): el is { getCurrentTime: () => number } {
  return typeof (el as { getCurrentTime?: () => number })?.getCurrentTime === 'function';
}

export function isNativeVideo(el: unknown): el is HTMLVideoElement {
  return el instanceof HTMLVideoElement;
}
