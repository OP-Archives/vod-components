import { parse } from 'tinyduration';

export const convertTimestamp = (timestamp: string): number => {
  try {
    const duration = parse(`PT${timestamp.toUpperCase()}`);
    return (duration?.hours || 0) * 60 * 60 + (duration?.minutes || 0) * 60 + (duration?.seconds || 0);
  } catch {
    return 0;
  }
};

export const toSeconds = (hms: string): number => {
  var p = hms.split(':'),
    s = 0,
    m = 1;

  while (p.length > 0) {
    s += m * parseInt(p.pop()!, 10);
    m *= 60;
  }

  return s;
};

export const toHMS = (secs: number): string => {
  let sec_num = parseInt(secs.toString(), 10);
  let hours = Math.floor(sec_num / 3600);
  let minutes = Math.floor(sec_num / 60) % 60;
  let seconds = sec_num % 60;

  return `${hours}h${minutes}m${seconds}s`;
};

export const toHHMMSS = (secs: number): string => {
  var sec_num = parseInt(secs.toString(), 10);
  var hours = Math.floor(sec_num / 3600);
  var minutes = Math.floor(sec_num / 60) % 60;
  var seconds = sec_num % 60;

  return [hours, minutes, seconds]
    .map((v) => (v < 10 ? '0' + v : v))
    .filter((v, i) => v !== '00' || i > 0)
    .join(':');
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const getImage = (link: string | undefined, width: number = 40, height: number = 53): string => {
  if (!link) return 'https://static-cdn.jtvnw.net/ttv-static/404_boxart.jpg';
  return link.replace('{width}x{height}', `${width}x${height}`);
};

export const formatTime = (time: number | undefined): string => {
  const isTimeNaN = isNaN(time as number);
  const hours = !isTimeNaN ? Math.floor((time as number) / 3600) : 0,
    remainder = !isTimeNaN ? (time as number) % 3600 : 0,
    minutes = !isTimeNaN ? Math.floor(remainder / 60) : 0,
    seconds = !isTimeNaN ? Math.floor(remainder % 60) : 0;

  let hh: string | undefined, mm: string, ss: string;
  if (hours !== 0) hh = hours.toString().padStart(2, '0');

  mm = minutes.toString().padStart(2, '0');
  ss = seconds.toString().padStart(2, '0');

  return `${hh ? `${hh}:` : ''}${mm}:${ss}`;
};
