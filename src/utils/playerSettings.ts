import type { PlayerSettings } from '../types';

const PLAYER_SETTINGS_KEY = 'player-settings';

export const loadPlayerSettings = (): PlayerSettings => {
  try {
    const settings = localStorage.getItem(PLAYER_SETTINGS_KEY);
    return settings ? JSON.parse(settings) : { volume: 100, muted: false };
  } catch {
    return { volume: 100, muted: false };
  }
};

export const savePlayerSettings = (settings: PlayerSettings): void => {
  try {
    localStorage.setItem(PLAYER_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // localStorage not available
  }
};
