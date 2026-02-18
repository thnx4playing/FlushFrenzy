/**
 * useLeaderboard.ts
 * 
 * React hook for easy leaderboard integration.
 * Handles caching, state management, and error handling.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getLeaderboard,
  submitScore,
  getRank,
  checkHealth,
  LeaderboardError,
} from './leaderboardApi';

type GameMode = 'quick-flush' | 'endless-plunge';

type LeaderboardEntry = {
  rank: number;
  initials: string;
  score: number;
  round: number | null;
  timestamp: number;
};

type UseLeaderboardOptions = {
  gameMode: GameMode;
  autoRefresh?: boolean; // Automatically refresh on mount
  cacheTimeout?: number; // Cache timeout in ms (default 5 min)
};

type UseLeaderboardReturn = {
  // State
  entries: LeaderboardEntry[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  lastUpdated: number | null;
  isOnline: boolean;
  
  // Actions
  refresh: () => Promise<void>;
  submit: (initials: string, score: number, round?: number) => Promise<{
    success: boolean;
    rank?: number;
    error?: string;
  }>;
  checkRank: (score: number) => Promise<{
    rank: number;
    percentile: number;
    isTopTen: boolean;
  } | null>;
  clearCache: () => Promise<void>;
};

const CACHE_KEY_PREFIX = 'LEADERBOARD_CACHE_';
const DEFAULT_CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Store last used name
const PLAYER_NAME_KEY = 'PLAYER_NAME';

export async function getStoredInitials(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(PLAYER_NAME_KEY);
    return stored || 'PLAYER';
  } catch {
    return 'PLAYER';
  }
}

export async function storeInitials(name: string): Promise<void> {
  try {
    await AsyncStorage.setItem(PLAYER_NAME_KEY, name.toUpperCase());
  } catch {
    // Ignore storage errors
  }
}

export function useLeaderboard(options: UseLeaderboardOptions): UseLeaderboardReturn {
  const { gameMode, autoRefresh = true, cacheTimeout = DEFAULT_CACHE_TIMEOUT } = options;
  
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  
  const mountedRef = useRef(true);
  const cacheKey = `${CACHE_KEY_PREFIX}${gameMode}`;
  
  // Check if cache is valid
  const isCacheValid = useCallback(async (): Promise<boolean> => {
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (!cached) return false;
      
      const { timestamp } = JSON.parse(cached);
      return Date.now() - timestamp < cacheTimeout;
    } catch {
      return false;
    }
  }, [cacheKey, cacheTimeout]);
  
  // Load from cache
  const loadFromCache = useCallback(async (): Promise<LeaderboardEntry[] | null> => {
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (!cached) return null;
      
      const { entries: cachedEntries, timestamp } = JSON.parse(cached);
      
      if (Date.now() - timestamp < cacheTimeout) {
        setLastUpdated(timestamp);
        return cachedEntries;
      }
      
      return null;
    } catch {
      return null;
    }
  }, [cacheKey, cacheTimeout]);
  
  // Save to cache
  const saveToCache = useCallback(async (newEntries: LeaderboardEntry[]) => {
    try {
      const cacheData = {
        entries: newEntries,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch {
      // Ignore cache errors
    }
  }, [cacheKey]);
  
  // Refresh leaderboard
  const refresh = useCallback(async () => {
    if (!mountedRef.current) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Check connectivity first
      const healthy = await checkHealth();
      setIsOnline(healthy);
      
      if (!healthy) {
        // Try to use cached data
        const cached = await loadFromCache();
        if (cached) {
          setEntries(cached);
          setError('Offline - showing cached data');
        } else {
          setError('Unable to connect. Check your internet.');
        }
        return;
      }
      
      const result = await getLeaderboard(gameMode);
      
      if (mountedRef.current) {
        setEntries(result.entries);
        setLastUpdated(result.lastUpdated);
        await saveToCache(result.entries);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      
      if (err instanceof LeaderboardError) {
        setError(err.message);
      } else {
        setError('Failed to load leaderboard');
      }
      
      // Try to use cached data on error
      const cached = await loadFromCache();
      if (cached) {
        setEntries(cached);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [gameMode, loadFromCache, saveToCache]);
  
  // Submit score
  const submit = useCallback(async (
    initials: string,
    score: number,
    round?: number
  ): Promise<{ success: boolean; rank?: number; error?: string }> => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const result = await submitScore(gameMode, initials, score, round);
      
      // Store initials for next time
      await storeInitials(initials);
      
      // Refresh leaderboard after successful submit
      await refresh();
      
      return {
        success: true,
        rank: result.rank,
      };
    } catch (err) {
      let errorMessage = 'Failed to submit score';
      
      if (err instanceof LeaderboardError) {
        if (err.statusCode === 429) {
          errorMessage = 'Too many submissions. Try again later.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsSubmitting(false);
    }
  }, [gameMode, refresh]);
  
  // Check rank for a score
  const checkRank = useCallback(async (score: number) => {
    try {
      const result = await getRank(gameMode, score);
      return {
        rank: result.rank,
        percentile: result.percentile,
        isTopTen: result.isTopTen,
      };
    } catch {
      return null;
    }
  }, [gameMode]);
  
  // Clear cache
  const clearCache = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(cacheKey);
      setEntries([]);
      setLastUpdated(null);
    } catch {
      // Ignore errors
    }
  }, [cacheKey]);
  
  // Auto-refresh on mount
  useEffect(() => {
    mountedRef.current = true;
    
    if (autoRefresh) {
      refresh();
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, [autoRefresh, gameMode]); // Re-fetch when game mode changes
  
  return {
    entries,
    isLoading,
    isSubmitting,
    error,
    lastUpdated,
    isOnline,
    refresh,
    submit,
    checkRank,
    clearCache,
  };
}

/**
 * Hook to check if a score qualifies for the leaderboard
 */
export function useLeaderboardQualification(gameMode: GameMode) {
  const [minQualifyingScore, setMinQualifyingScore] = useState<number>(0);
  const [isChecking, setIsChecking] = useState(false);
  
  const checkQualification = useCallback(async (score: number): Promise<{
    qualifies: boolean;
    rank: number;
    isTopTen: boolean;
  }> => {
    setIsChecking(true);
    
    try {
      const result = await getRank(gameMode, score);
      
      // Update minimum qualifying score (top 100)
      if (result.total >= 100) {
        // We'd need to fetch the 100th score, but for now just check if in top 100
        setMinQualifyingScore(result.rank <= 100 ? 0 : score);
      }
      
      return {
        qualifies: result.isTopHundred,
        rank: result.rank,
        isTopTen: result.isTopTen,
      };
    } catch {
      // Assume qualifies on error (be generous)
      return {
        qualifies: true,
        rank: 1,
        isTopTen: false,
      };
    } finally {
      setIsChecking(false);
    }
  }, [gameMode]);
  
  return {
    minQualifyingScore,
    isChecking,
    checkQualification,
  };
}
