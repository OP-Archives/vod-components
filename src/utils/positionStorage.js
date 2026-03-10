import { safeLocalStorage } from './safeLocalStorage';

/**
 * Get the resume position for a VOD or game
 * @param {string} id - The VOD ID or Game ID
 * @param {string} prefix - The prefix for the key ('vod_' or 'game_')
 * @returns {number|null} The saved timestamp or null if none exists
 */
export const getResumePosition = (id, prefix = 'vod_') => {
  const savedPositions = safeLocalStorage.getItem('lastPlayed');
  if (savedPositions) {
    try {
      const positions = JSON.parse(savedPositions);
      const key = `${prefix}${id}`;
      if (positions[key] !== undefined) {
        return parseFloat(positions[key]);
      }
    } catch (error) {
      console.error('Error parsing resume positions:', error);
      return null;
    }
  }

  return null;
};

const MAX_POSITIONS = 1000;

/**
 * Save the resume position for a VOD or game
 * @param {string} id - The VOD ID or Game ID
 * @param {number} timestamp - The timestamp to save
 * @param {string} prefix - The prefix for the key ('vod_' or 'game_')
 */
export const saveResumePosition = (id, timestamp, prefix = 'vod_') => {
  let positions;
  try {
    positions = JSON.parse(safeLocalStorage.getItem('lastPlayed') || '{}');
  } catch (error) {
    console.error('Error parsing saved positions:', error);
    positions = {};
  }

  const key = `${prefix}${id}`;
  positions[key] = timestamp;

  if (Object.keys(positions).length > MAX_POSITIONS) {
    const sortedEntries = Object.entries(positions)
      .sort((a, b) => a[1] - b[1])
      .slice(0, Object.keys(positions).length - MAX_POSITIONS);

    sortedEntries.forEach(([key]) => delete positions[key]);
  }

  safeLocalStorage.setItem('lastPlayed', JSON.stringify(positions));
};

/**
 * Clear the resume position for a VOD or game
 * @param {string} id - The VOD ID or Game ID
 * @param {string} prefix - The prefix for the key ('vod_' or 'game_')
 */
export const clearResumePosition = (id, prefix = 'vod_') => {
  const savedPositions = safeLocalStorage.getItem('lastPlayed');
  if (!savedPositions) return;

  try {
    const positions = JSON.parse(savedPositions);
    const key = `${prefix}${id}`;
    delete positions[key];
    safeLocalStorage.setItem('lastPlayed', JSON.stringify(positions));
  } catch (error) {
    console.error('Error clearing resume position:', error);
  }
};
