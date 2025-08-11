/**
 * Security utilities for NoSQL injection prevention and input validation
 */

/**
 * Sanitizes user input to prevent NoSQL injection attacks
 * Escapes special regex characters and MongoDB operators
 * @param {string} input - The user input to sanitize
 * @returns {string} - Sanitized string safe for MongoDB operations
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Escape special regex characters that could be used for injection
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Sanitizes regex input for MongoDB $regex queries
 * @param {string} input - The user input to sanitize for regex
 * @returns {string} - Sanitized string safe for regex operations
 */
export function sanitizeRegexInput(input) {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove or escape dangerous characters for regex
  // This prevents regex denial of service and injection attacks
  return input
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')  // Escape regex metacharacters
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '')    // Remove control characters
    .trim()
    .substring(0, 100); // Limit length to prevent DoS
}

/**
 * Creates a safe MongoDB regex query object
 * @param {string} input - The user input for regex search
 * @param {string} options - Regex options (default: 'i' for case-insensitive)
 * @returns {Object} - Safe MongoDB regex query object
 */
export function createSafeRegexQuery(input, options = 'i') {
  const sanitizedInput = sanitizeRegexInput(input);
  
  if (!sanitizedInput) {
    return null;
  }
  
  return {
    $regex: sanitizedInput,
    $options: options
  };
}

/**
 * Validates and sanitizes organization name input
 * @param {string} organizationName - The organization name to validate
 * @returns {Object} - { isValid: boolean, sanitized: string, error?: string }
 */
export function validateOrganizationName(organizationName) {
  if (!organizationName || typeof organizationName !== 'string') {
    return {
      isValid: false,
      sanitized: '',
      error: 'Organization name is required and must be a string'
    };
  }
  
  const trimmed = organizationName.trim();
  
  // Check length
  if (trimmed.length < 2 || trimmed.length > 50) {
    return {
      isValid: false,
      sanitized: '',
      error: 'Organization name must be between 2 and 50 characters'
    };
  }
  
  // Check for dangerous characters
  if (!/^[a-zA-Z0-9\s\-_.]+$/.test(trimmed)) {
    return {
      isValid: false,
      sanitized: '',
      error: 'Organization name contains invalid characters'
    };
  }
  
  // Sanitize for regex use
  const sanitized = sanitizeInput(trimmed);
  
  return {
    isValid: true,
    sanitized: sanitized
  };
}

/**
 * Validates and sanitizes machine search filters
 * @param {Object} filters - Object containing filter values
 * @returns {Object} - Sanitized filters safe for MongoDB queries
 */
export function sanitizeSearchFilters(filters) {
  const sanitized = {};
  
  const allowedFields = ['machineId', 'brand', 'model', 'workplace'];
  
  for (const [key, value] of Object.entries(filters)) {
    if (allowedFields.includes(key) && value && typeof value === 'string') {
      const safeRegex = createSafeRegexQuery(value);
      if (safeRegex) {
        sanitized[key] = safeRegex;
      }
    }
  }
  
  return sanitized;
}

/**
 * Rate limiting helper to prevent brute force attacks
 * Simple in-memory rate limiter (for production, use Redis or similar)
 */
class RateLimiter {
  constructor(maxRequests = 100, windowMs = 15 * 60 * 1000) { // 100 requests per 15 minutes
    this.requests = new Map();
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  isAllowed(identifier) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Clean old entries
    this.requests.forEach((timestamps, key) => {
      const filtered = timestamps.filter(time => time > windowStart);
      if (filtered.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, filtered);
      }
    });
    
    // Get current requests for this identifier
    const currentRequests = this.requests.get(identifier) || [];
    const recentRequests = currentRequests.filter(time => time > windowStart);
    
    // Check if under limit
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    
    return true;
  }
}

// Export rate limiter instance
export const searchRateLimiter = new RateLimiter(50, 5 * 60 * 1000); // 50 searches per 5 minutes
