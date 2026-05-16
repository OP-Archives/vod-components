export const adjustUsernameColor = (hex: string): string => {
  if (!hex) return '#8a2be2';

  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);

  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

  if (luminance < 90) {
    const mix = (90 - luminance) / 90;
    r = Math.round(r + (255 - r) * mix);
    g = Math.round(g + (255 - g) * mix);
    b = Math.round(b + (255 - b) * mix);
  }

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};
