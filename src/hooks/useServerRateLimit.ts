import { supabase } from '@/integrations/supabase/client';

interface RateLimitResult {
  allowed: boolean;
  blocked: boolean;
  remainingSeconds: number;
  attemptsLeft: number;
}

interface RateLimitOptions {
  maxAttempts?: number;
  windowMinutes?: number;
  blockMinutes?: number;
}

/**
 * Server-side rate limiting hook
 * Uses Supabase Edge Function for secure rate limiting
 */
export const useServerRateLimit = () => {
  const checkRateLimit = async (
    action: string,
    options?: RateLimitOptions
  ): Promise<RateLimitResult> => {
    try {
      const { data, error } = await supabase.functions.invoke('check-rate-limit', {
        body: {
          action,
          maxAttempts: options?.maxAttempts ?? 5,
          windowMinutes: options?.windowMinutes ?? 15,
          blockMinutes: options?.blockMinutes ?? 30
        }
      });

      if (error) throw error;

      return {
        allowed: data.allowed,
        blocked: data.blocked,
        remainingSeconds: data.remaining_seconds,
        attemptsLeft: data.attempts_left
      };
    } catch (error) {
      console.error('Rate limit check failed:', error);
      // Fail open to not block users on errors
      return { 
        allowed: true, 
        blocked: false, 
        remainingSeconds: 0, 
        attemptsLeft: 5 
      };
    }
  };

  return { checkRateLimit };
};

export default useServerRateLimit;
