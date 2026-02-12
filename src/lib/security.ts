// Security utilities and constants

export const SECURITY_CONFIG = {
  // Rate limiting
  RATE_LIMIT: {
    SUBMISSION_ATTEMPTS: 5,
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    PHONE_ATTEMPTS: 3,
    PHONE_WINDOW_MS: 5 * 60 * 1000, // 5 minutes
  },
  
  // Input validation
  VALIDATION: {
    MAX_PHONE_LENGTH: 20,
    MAX_LOCATION_LENGTH: 500,
    MAX_NOTES_LENGTH: 1000,
    MIN_PHONE_LENGTH: 8,
  },
  
  // Content Security Policy
  CSP: {
    DEFAULT_SRC: "'self'",
    SCRIPT_SRC: "'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com",
    STYLE_SRC: "'self' 'unsafe-inline'",
    IMG_SRC: "'self' data: https:",
    FONT_SRC: "'self' data:",
    CONNECT_SRC: "'self' https://*.supabase.co https://maps.googleapis.com",
    FRAME_SRC: "'self' https://www.openstreetmap.org https://*.tile.openstreetmap.org https://www.google.com/maps",
  }
}

// Sanitize input to prevent XSS
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

// Validate Lebanese phone number format
export function validateLebanesePhone(phone: string): boolean {
  const sanitizedPhone = sanitizeInput(phone)
  const phoneRegex = /^\+961\s?\d{1,2}\s?\d{3}\s?\d{3}$/
  return phoneRegex.test(sanitizedPhone.replace(/\s/g, ''))
}

// Validate Google Maps URL
export function validateMapsUrl(url: string): boolean {
  const sanitizedUrl = sanitizeInput(url)
  try {
    const urlObj = new URL(sanitizedUrl)
    return (
      urlObj.hostname.includes('maps.google.com') ||
      urlObj.hostname.includes('goo.gl') ||
      urlObj.hostname.includes('maps.app.goo.gl')
    )
  } catch {
    return false
  }
}

// Rate limiting implementation (client-side)
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map()

  isAllowed(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now()
    const attempts = this.attempts.get(key) || []
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < windowMs)
    
    if (validAttempts.length >= maxAttempts) {
      return false
    }
    
    validAttempts.push(now)
    this.attempts.set(key, validAttempts)
    return true
  }

  reset(key: string): void {
    this.attempts.delete(key)
  }
}

export const rateLimiter = new RateLimiter()

// Generate CSRF token (simplified version)
export function generateCSRFToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Validate CSRF token
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  return token === sessionToken
}
