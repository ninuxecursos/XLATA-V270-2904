import DOMPurify from 'dompurify';

/**
 * Strict HTML sanitization - removes ALL HTML tags
 * Use for user input that should be plain text only
 */
export const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  });
};

/**
 * Rich HTML sanitization with strict whitelist
 * Use for admin-generated content (blog posts, help articles, etc.)
 * Allows safe formatting tags but blocks dangerous elements
 */
export const sanitizeRichHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'strong', 'em', 'b', 'i', 'u', 's', 'mark',
      'a', 'ul', 'ol', 'li',
      'blockquote', 'code', 'pre',
      'img', 'figure', 'figcaption',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'span', 'div', 'section', 'article'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id',
      'target', 'rel', 'width', 'height', 'loading'
    ],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'button', 'object', 'embed', 'svg', 'math'],
    FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus', 'onblur', 'onsubmit', 'onkeydown', 'onkeyup'],
    ADD_URI_SAFE_ATTR: ['href', 'src'],
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false
  });
};

/**
 * Message sanitization - minimal formatting for messages/notifications
 * Use for admin messages, notifications, etc.
 */
export const sanitizeMessage = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p', 'span', 'a'],
    ALLOWED_ATTR: ['class', 'href', 'target', 'rel'],
    FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover']
  });
};

/**
 * JSON-LD sanitization for Schema.org structured data
 * Escapes HTML entities to prevent script injection
 */
export const sanitizeJsonLd = (data: object): string => {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
};

/**
 * Sanitizes text input by trimming and removing potential XSS
 */
export const sanitizeText = (input: string): string => {
  return sanitizeHtml(input.trim());
};

/**
 * Sanitizes multi-line text (preserves line breaks)
 */
export const sanitizeMultilineText = (input: string): string => {
  return input
    .split('\n')
    .map(line => sanitizeText(line))
    .join('\n');
};

/**
 * Sanitizes URL to prevent javascript: and data: URI attacks
 */
export const sanitizeUrl = (url: string): string => {
  if (!url) return '';
  
  const trimmedUrl = url.trim().toLowerCase();
  
  // Block dangerous protocols
  if (
    trimmedUrl.startsWith('javascript:') ||
    trimmedUrl.startsWith('data:') ||
    trimmedUrl.startsWith('vbscript:')
  ) {
    return '';
  }
  
  // Allow safe protocols
  if (
    trimmedUrl.startsWith('http://') ||
    trimmedUrl.startsWith('https://') ||
    trimmedUrl.startsWith('/') ||
    trimmedUrl.startsWith('#') ||
    trimmedUrl.startsWith('mailto:') ||
    trimmedUrl.startsWith('tel:')
  ) {
    return url.trim();
  }
  
  // Prepend https:// to relative URLs that look like domains
  if (trimmedUrl.includes('.') && !trimmedUrl.includes(' ')) {
    return `https://${url.trim()}`;
  }
  
  return url.trim();
};
