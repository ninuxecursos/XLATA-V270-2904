// Logger utility - production optimized logging system
const isProduction = import.meta.env.PROD;
const isDev = import.meta.env.DEV;

export const createLogger = (prefix: string = '') => {
  return {
    // Alias for backward compatibility with console.log calls
    log: (...args: any[]) => {
      if (isDev) console.log(`📝 ${prefix}`, ...args);
    },
    // Dev only logs (completely disabled in production)
    debug: (...args: any[]) => {
      if (isDev) console.log(`🔍 ${prefix}`, ...args);
    },
    info: (...args: any[]) => {
      if (isDev) console.info(`ℹ️ ${prefix}`, ...args);
    },
    
    // Warnings (only in dev, silent in production)
    warn: (...args: any[]) => {
      if (isDev) console.warn(`⚠️ ${prefix}`, ...args);
    },
    
    // Critical errors only (always visible but minimized)
    error: (...args: any[]) => {
      if (isProduction) {
        // In production, only log to error tracking service, not console
        console.error(`❌ ${prefix}`, 'Error occurred');
      } else {
        console.error(`❌ ${prefix}`, ...args);
      }
    },
    
    // Success logs (dev only)
    success: (...args: any[]) => {
      if (isDev) console.log(`✅ ${prefix}`, ...args);
    }
  };
};

// Default logger for general use
export const logger = createLogger('[PDV]');