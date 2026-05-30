import { safeLocalStorage } from './safeLocalStorage';

export const getResumePosition = (id: string, prefix: string = 'vod_', tenantId: string): number | null => {
  if (!tenantId) throw new Error('tenantId is required for getResumePosition');
  const savedPositions = safeLocalStorage.getItem('lastPlayed');
  if (savedPositions) {
    try {
      const positions = JSON.parse(savedPositions);
      const key = `${tenantId}_${prefix}${id}`;
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

export const saveResumePosition = (id: string, timestamp: number, prefix: string = 'vod_', tenantId: string): void => {
  if (!tenantId) throw new Error('tenantId is required for saveResumePosition');
  let positions: Record<string, number>;
  try {
    positions = JSON.parse(safeLocalStorage.getItem('lastPlayed') || '{}');
  } catch (error) {
    console.error('Error parsing saved positions:', error);
    positions = {};
  }

  const key = `${tenantId}_${prefix}${id}`;
  positions[key] = timestamp;

  if (Object.keys(positions).length > MAX_POSITIONS) {
    const sortedEntries = Object.entries(positions)
      .sort((a, b) => a[1] - b[1])
      .slice(0, Object.keys(positions).length - MAX_POSITIONS);

    sortedEntries.forEach(([key]) => delete positions[key]);
  }

  safeLocalStorage.setItem('lastPlayed', JSON.stringify(positions));
};

export const clearResumePosition = (id: string, prefix: string = 'vod_', tenantId: string): void => {
  if (!tenantId) throw new Error('tenantId is required for clearResumePosition');
  const savedPositions = safeLocalStorage.getItem('lastPlayed');
  if (!savedPositions) return;

  try {
    const positions = JSON.parse(savedPositions);
    const key = `${tenantId}_${prefix}${id}`;
    delete positions[key];
    safeLocalStorage.setItem('lastPlayed', JSON.stringify(positions));
  } catch (error) {
    console.error('Error clearing resume position:', error);
  }
};
