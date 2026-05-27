/**
 * Rate limiting hook for protecting against brute force attacks
 * Uses localStorage to track attempts with automatic cleanup
 */

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

interface RateLimitState {
  attempts: number;
  firstAttemptTime: number;
  blockedUntil: number | null;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  blockDurationMs: 30 * 60 * 1000, // 30 minutes block
};

const STORAGE_KEY_PREFIX = 'rate_limit_';

const getStorageKey = (action: string): string => {
  return `${STORAGE_KEY_PREFIX}${action}`;
};

const getState = (action: string): RateLimitState => {
  try {
    const stored = localStorage.getItem(getStorageKey(action));
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return { attempts: 0, firstAttemptTime: 0, blockedUntil: null };
};

const setState = (action: string, state: RateLimitState): void => {
  try {
    localStorage.setItem(getStorageKey(action), JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
};

const clearState = (action: string): void => {
  try {
    localStorage.removeItem(getStorageKey(action));
  } catch {
    // Ignore storage errors
  }
};

export const useRateLimit = (action: string, config: Partial<RateLimitConfig> = {}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const checkRateLimit = (): { allowed: boolean; remainingTime: number; attemptsLeft: number } => {
    const now = Date.now();
    const state = getState(action);

    // Check if currently blocked
    if (state.blockedUntil && now < state.blockedUntil) {
      const remainingTime = Math.ceil((state.blockedUntil - now) / 1000 / 60);
      return { allowed: false, remainingTime, attemptsLeft: 0 };
    }

    // Reset if blocked period expired
    if (state.blockedUntil && now >= state.blockedUntil) {
      clearState(action);
      return { allowed: true, remainingTime: 0, attemptsLeft: finalConfig.maxAttempts };
    }

    // Reset if window expired
    if (state.firstAttemptTime && now - state.firstAttemptTime > finalConfig.windowMs) {
      clearState(action);
      return { allowed: true, remainingTime: 0, attemptsLeft: finalConfig.maxAttempts };
    }

    const attemptsLeft = finalConfig.maxAttempts - state.attempts;
    return { allowed: attemptsLeft > 0, remainingTime: 0, attemptsLeft: Math.max(0, attemptsLeft) };
  };

  const recordAttempt = (): { blocked: boolean; remainingTime: number } => {
    const now = Date.now();
    let state = getState(action);

    // Reset if window expired
    if (state.firstAttemptTime && now - state.firstAttemptTime > finalConfig.windowMs) {
      state = { attempts: 0, firstAttemptTime: 0, blockedUntil: null };
    }

    // Set first attempt time if not set
    if (!state.firstAttemptTime) {
      state.firstAttemptTime = now;
    }

    state.attempts += 1;

    // Block if max attempts reached
    if (state.attempts >= finalConfig.maxAttempts) {
      state.blockedUntil = now + finalConfig.blockDurationMs;
      setState(action, state);
      const remainingTime = Math.ceil(finalConfig.blockDurationMs / 1000 / 60);
      return { blocked: true, remainingTime };
    }

    setState(action, state);
    return { blocked: false, remainingTime: 0 };
  };

  const resetRateLimit = (): void => {
    clearState(action);
  };

  const getRemainingAttempts = (): number => {
    const { attemptsLeft } = checkRateLimit();
    return attemptsLeft;
  };

  return {
    checkRateLimit,
    recordAttempt,
    resetRateLimit,
    getRemainingAttempts,
  };
};
