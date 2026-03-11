const PLAYER_SETTINGS_KEY = 'player-settings';

export const loadPlayerSettings = () => {
  try {
    const settings = localStorage.getItem(PLAYER_SETTINGS_KEY);
    return settings ? JSON.parse(settings) : { volume: 100, muted: false };
  } catch {
    return { volume: 100, muted: false };
  }
};

export const savePlayerSettings = (settings) => {
  try {
    localStorage.setItem(PLAYER_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // localStorage not available
  }
};
