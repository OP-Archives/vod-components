declare module '*.css' {
  const content: string;
  export default content;
}

declare module 'can-autoplay' {
  interface Result {
    result: boolean;
  }
  function canAutoplay(options?: Record<string, unknown>): Promise<Result>;
  namespace canAutoplay {
    function video(options?: Record<string, unknown>): Promise<Result>;
  }
  export default canAutoplay;
}

declare module 'humanize-duration' {
  function humanize(ms: number, options?: Record<string, unknown>): string;
  export default humanize;
}

declare module 'simplebar-react/dist/simplebar.min.css' {
  const content: string;
  export default content;
}

declare module 'twemoji' {
  interface Options {
    folder?: string;
    ext?: string;
    className?: string;
    [key: string]: unknown;
  }
  export function parse(element: HTMLElement, options?: Options): void;
  export function test(text: string): boolean;
  const twemoji: { parse: typeof parse; test: typeof test };
  export default twemoji;
}

interface Document {
  webkitIsFullScreen?: boolean;
  webkitExitFullscreen?(): void;
  webkitFullscreenElement?: Element | null;
}

interface HTMLElement {
  webkitRequestFullscreen?(): void;
}

declare module 'tinyduration' {
  interface Duration {
    hours?: number;
    minutes?: number;
    seconds?: number;
    milliseconds?: number;
  }
  function parse(input: string): Duration | undefined;
  export { parse };
}

declare module 'react-dom/client' {
  import type { ReactNode } from 'react';
  interface Root {
    render(children: ReactNode): void;
  }
  export function createRoot(container: Element | DocumentFragment): Root;
}

interface ImportMeta {
  hot?: {
    accept(cb: (mod?: Record<string, unknown>) => void): void;
  };
}

interface HTMLElement {
  __viteRoot?: import('react-dom/client').Root;
}
