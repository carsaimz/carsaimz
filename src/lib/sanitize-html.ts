/**
 * Carsai Mozambique — HTML Sanitization Utility
 *
 * Provides safe HTML rendering using isomorphic-dompurify.
 * Used wherever dangerouslySetInnerHTML is needed (ad content, Quill output, etc.)
 */

import DOMPurify from 'isomorphic-dompurify';

// ── Default allowed tags and attributes ──

const DEFAULT_ALLOWED_TAGS = [
  'a', 'abbr', 'b', 'blockquote', 'br', 'cite', 'code', 'col', 'colgroup',
  'dd', 'del', 'dl', 'dt', 'em', 'figcaption', 'figure', 'h1', 'h2', 'h3',
  'h4', 'h5', 'h6', 'hr', 'i', 'img', 'ins', 'kbd', 'li', 'mark', 'ol',
  'p', 'pre', 's', 'small', 'span', 'strong', 'sub', 'sup', 'table', 'tbody',
  'td', 'tfoot', 'th', 'thead', 'tr', 'u', 'ul', 'var', 'div', 'section',
  'article', 'aside', 'header', 'footer', 'nav', 'main', 'details', 'summary',
  'input',
];

const DEFAULT_ALLOWED_ATTR = [
  'href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'style',
  'width', 'height', 'loading', 'colspan', 'rowspan', 'align', 'valign',
  'type', 'checked', 'disabled', 'name', 'value', 'id', 'data-*',
];

type SanitizeConfig = Record<string, unknown>;

/**
 * Sanitize HTML content for safe rendering
 *
 * @param html - Raw HTML string to sanitize
 * @param options - Optional DOMPurify config overrides
 * @returns Sanitized HTML string safe for dangerouslySetInnerHTML
 */
export function sanitizeHtml(html: string, options?: SanitizeConfig): string {
  if (!html || typeof html !== 'string') return '';

  const result = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: DEFAULT_ALLOWED_TAGS,
    ALLOWED_ATTR: DEFAULT_ALLOWED_ATTR,
    ALLOW_DATA_ATTR: true,
    // Allow safe URI schemes
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp?):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    // Remove unsafe attributes
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    // Keep id and class for styling
    ADD_ATTR: ['target'],
    ...options,
  });

  // DOMPurify.sanitize returns TrustedHTML in some environments, convert to string
  return String(result);
}

/**
 * Sanitize HTML specifically for ad content.
 * Stricter: no scripts, no iframes, no forms.
 */
export function sanitizeAdHtml(html: string): string {
  return sanitizeHtml(html, {
    ALLOWED_TAGS: [
      'a', 'b', 'br', 'blockquote', 'center', 'code', 'col', 'colgroup',
      'dd', 'del', 'div', 'dl', 'dt', 'em', 'figcaption', 'figure',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img', 'ins',
      'kbd', 'li', 'mark', 'ol', 'p', 'pre', 's', 'small', 'span',
      'strong', 'sub', 'sup', 'table', 'tbody', 'td', 'tfoot', 'th',
      'thead', 'tr', 'u', 'ul', 'var',
    ],
    FORBID_TAGS: ['script', 'iframe', 'form', 'input', 'button', 'textarea', 'select', 'style', 'link', 'meta', 'object', 'embed', 'applet'],
  });
}

/**
 * Sanitize HTML for Quill/rich text editor output.
 * Allows standard Quill output tags.
 */
export function sanitizeQuillHtml(html: string): string {
  return sanitizeHtml(html, {
    ALLOWED_TAGS: [
      'a', 'b', 'br', 'blockquote', 'code', 'del', 'div', 'em',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img', 'ins',
      'li', 'ol', 'p', 'pre', 's', 'span', 'strong', 'sub', 'sup',
      'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'u', 'ul',
    ],
    FORBID_TAGS: ['script', 'iframe', 'form', 'input', 'button', 'textarea', 'select', 'style', 'link', 'meta'],
  });
}
