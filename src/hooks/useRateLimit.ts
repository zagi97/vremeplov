// src/hooks/useRateLimit.ts
import { useState, useEffect } from 'react';

interface RateLimitConfig {
  maxRequests: number;
  timeWindow: number; // u minutama
  key: string; // unique identifier (npr. user ID ili IP)
}

interface RateLimitState {
  isLimited: boolean;
  remainingRequests: number;
  resetTime: Date | null;
  requestCount: number;
}

export const useRateLimit = (config: RateLimitConfig): [RateLimitState, () => boolean] => {
  const [state, setState] = useState<RateLimitState>({
    isLimited: false,
    remainingRequests: config.maxRequests,
    resetTime: null,
    requestCount: 0
  });

  const storageKey = `rateLimit_${config.key}`;

  // Učitaj existing rate limit data
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        const now = new Date();
        const resetTime = new Date(data.resetTime);

        if (now > resetTime) {
          // Reset rate limit
          const newResetTime = new Date(now.getTime() + config.timeWindow * 60 * 1000);
          setState({
            isLimited: false,
            remainingRequests: config.maxRequests,
            resetTime: newResetTime,
            requestCount: 0
          });
        } else {
          // Koristi existing data
          setState({
            isLimited: data.requestCount >= config.maxRequests,
            remainingRequests: Math.max(0, config.maxRequests - data.requestCount),
            resetTime: resetTime,
            requestCount: data.requestCount
          });
        }
      } catch (error) {
        console.error('Rate limit data corrupted, resetting:', error);
        initializeRateLimit();
      }
    } else {
      initializeRateLimit();
    }
  }, [config.key, config.maxRequests, config.timeWindow]);

  const initializeRateLimit = () => {
    const now = new Date();
    const resetTime = new Date(now.getTime() + config.timeWindow * 60 * 1000);
    
    setState({
      isLimited: false,
      remainingRequests: config.maxRequests,
      resetTime,
      requestCount: 0
    });
  };

  // Funkcija za pokušaj request-a
  const attemptRequest = (): boolean => {
    const now = new Date();
    
    // Provjeri je li reset time prošao
    if (state.resetTime && now > state.resetTime) {
      initializeRateLimit();
      return attemptRequest(); // Rekurzivno pozovi nakon reset-a
    }

    // Provjeri rate limit
    if (state.requestCount >= config.maxRequests) {
      setState(prev => ({ ...prev, isLimited: true }));
      return false;
    }

    // Increment request count
    const newRequestCount = state.requestCount + 1;
    const newState = {
      requestCount: newRequestCount,
      isLimited: newRequestCount >= config.maxRequests,
      remainingRequests: Math.max(0, config.maxRequests - newRequestCount),
      resetTime: state.resetTime
    };

    setState(newState);

    // Spremi u localStorage
    localStorage.setItem(storageKey, JSON.stringify(newState));

    return true;
  };

  return [state, attemptRequest];
};

// USAGE EXAMPLES:

// 1. Upload Rate Limiting
export const useUploadRateLimit = (userId: string) => {
  return useRateLimit({
    maxRequests: 20, // 20 uploads
    timeWindow: 60,  // per hour
    key: `upload_${userId}`
  });
};

// 2. API Request Rate Limiting  
export const useApiRateLimit = (userId: string) => {
  return useRateLimit({
    maxRequests: 100, // 100 API calls
    timeWindow: 60,   // per hour
    key: `api_${userId}`
  });
};

// 3. Search Rate Limiting
export const useSearchRateLimit = (userId: string) => {
  return useRateLimit({
    maxRequests: 50,  // 50 searches
    timeWindow: 10,   // per 10 minutes
    key: `search_${userId}`
  });
};