/**
 * Leaderboard API Client
 * 
 * Handles all communication with the Flush Frenzy leaderboard service.
 * Privacy-first: No user tracking, no device IDs, just scores and initials.
 */

// Flush Frenzy Leaderboard API endpoint
const API_BASE_URL = 'https://ijgs61ytv0.execute-api.us-east-1.amazonaws.com/prod';

// Timeout for API requests (ms)
const REQUEST_TIMEOUT = 10000;

/**
 * Custom error class for API errors
 */
export class LeaderboardError extends Error {
  constructor(message, statusCode = null, retryAfter = null) {
    super(message);
    this.name = 'LeaderboardError';
    this.statusCode = statusCode;
    this.retryAfter = retryAfter;
  }
}

/**
 * Fetch with timeout wrapper
 */
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      throw new LeaderboardError('Request timed out', 408);
    }
    throw error;
  }
}

/**
 * Get the leaderboard for a specific game mode
 * 
 * @param {string} gameMode - 'quick-flush' or 'endless-plunge'
 * @param {number} limit - Maximum number of entries to fetch (default 100)
 * @returns {Promise<LeaderboardResponse>}
 */
export async function getLeaderboard(gameMode, limit = 100) {
  try {
    const url = `${API_BASE_URL}/leaderboard/${gameMode}?limit=${limit}`;
    const response = await fetchWithTimeout(url, { method: 'GET' });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new LeaderboardError(
        error.error || 'Failed to fetch leaderboard',
        response.status
      );
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof LeaderboardError) throw error;
    throw new LeaderboardError('Network error: Unable to connect to leaderboard');
  }
}

/**
 * Submit a score to the leaderboard
 * 
 * @param {string} gameMode - 'quick-flush' or 'endless-plunge'
 * @param {string} name - 1-6 character player name (A-Z, 0-9)
 * @param {number} score - Player's score
 * @param {number} round - (Optional) Round reached for endless-plunge
 * @returns {Promise<SubmitScoreResponse>}
 */
export async function submitScore(gameMode, name, score, round = null) {
  try {
    const url = `${API_BASE_URL}/leaderboard/${gameMode}`;
    const body = { initials: name, score };
    
    if (gameMode === 'endless-plunge' && round !== null) {
      body.round = round;
    }
    
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new LeaderboardError(
        error.error || 'Failed to submit score',
        response.status,
        error.retryAfter
      );
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof LeaderboardError) throw error;
    throw new LeaderboardError('Network error: Unable to submit score');
  }
}

/**
 * Get the rank for a specific score
 * 
 * @param {string} gameMode - 'quick-flush' or 'endless-plunge'
 * @param {number} score - Score to check rank for
 * @returns {Promise<RankResponse>}
 */
export async function getRank(gameMode, score) {
  try {
    const url = `${API_BASE_URL}/leaderboard/${gameMode}/rank/${score}`;
    const response = await fetchWithTimeout(url, { method: 'GET' });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new LeaderboardError(
        error.error || 'Failed to get rank',
        response.status
      );
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof LeaderboardError) throw error;
    throw new LeaderboardError('Network error: Unable to get rank');
  }
}

/**
 * Check if the leaderboard service is available
 * 
 * @returns {Promise<boolean>}
 */
export async function checkHealth() {
  try {
    const url = `${API_BASE_URL}/health`;
    const response = await fetchWithTimeout(url, { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
}

// TypeScript-style type definitions (for reference)
/**
 * @typedef {Object} LeaderboardEntry
 * @property {number} rank - Position on leaderboard
 * @property {string} initials - 3-character player initials
 * @property {number} score - Player's score
 * @property {number|null} round - Round reached (endless-plunge only)
 * @property {number} timestamp - Unix timestamp of submission
 */

/**
 * @typedef {Object} LeaderboardResponse
 * @property {string} gameMode - Game mode
 * @property {LeaderboardEntry[]} entries - Leaderboard entries
 * @property {number} count - Number of entries
 * @property {number} lastUpdated - Timestamp of last update
 */

/**
 * @typedef {Object} SubmitScoreResponse
 * @property {boolean} success - Whether submission was successful
 * @property {LeaderboardEntry} entry - The submitted entry
 * @property {number} rank - Rank of the submitted score
 * @property {number} remaining - Remaining submissions this hour
 */

/**
 * @typedef {Object} RankResponse
 * @property {number} score - The score checked
 * @property {number} rank - Rank of the score
 * @property {number} total - Total entries on leaderboard
 * @property {number} percentile - Percentile (0-100)
 * @property {boolean} isTopTen - Whether score is in top 10
 * @property {boolean} isTopHundred - Whether score is in top 100
 */
