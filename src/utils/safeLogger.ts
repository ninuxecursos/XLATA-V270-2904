// Safe logger utility - sanitizes sensitive data before logging
const isDev = import.meta.env.DEV;

// Sensitive field patterns to sanitize
const SENSITIVE_PATTERNS = [
  /email/i,
  /password/i,
  /token/i,
  /key/i,
  /secret/i,
  /auth/i,
  /credential/i,
  /api[_-]?key/i,
  /access[_-]?token/i,
  /refresh[_-]?token/i,
];

// Partially redact IDs for security
const sanitizeId = (value: string): string => {
  if (value.length <= 8) return '***';
  return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
};

// Recursively sanitize object data
const sanitizeData = (data: any): any => {
  if (data === null || data === undefined) return data;
  
  if (typeof data === 'string') {
    // Check if this looks like sensitive data
    if (data.length > 20 && /^[a-f0-9-]{20,}$/i.test(data)) {
      return sanitizeId(data);
    }
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }
  
  if (typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Check if key matches sensitive patterns
      const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
      
      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (key.toLowerCase().includes('id') && typeof value === 'string') {
        sanitized[key] = sanitizeId(value);
      } else {
        sanitized[key] = sanitizeData(value);
      }
    }
    return sanitized;
  }
  
  return data;
};

export const createSafeLogger = (prefix: string = '') => {
  return {
    // Dev only logs
    debug: (...args: any[]) => {
      if (isDev) {
        const sanitized = args.map(arg => sanitizeData(arg));
        console.log(`🔍 ${prefix}`, ...sanitized);
      }
    },
    info: (...args: any[]) => {
      if (isDev) {
        const sanitized = args.map(arg => sanitizeData(arg));
        console.info(`ℹ️ ${prefix}`, ...sanitized);
      }
    },
    
    // Always visible logs (sanitized)
    warn: (...args: any[]) => {
      const sanitized = args.map(arg => sanitizeData(arg));
      console.warn(`⚠️ ${prefix}`, ...sanitized);
    },
    error: (...args: any[]) => {
      const sanitized = args.map(arg => sanitizeData(arg));
      console.error(`❌ ${prefix}`, ...sanitized);
    },
    
    // Success logs (dev only)
    success: (...args: any[]) => {
      if (isDev) {
        const sanitized = args.map(arg => sanitizeData(arg));
        console.log(`✅ ${prefix}`, ...sanitized);
      }
    }
  };
};

// Default safe logger for general use
export const safeLogger = createSafeLogger('[PDV]');
