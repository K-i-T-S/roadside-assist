export type PhoneValidationReason =
  | 'missing-plus'
  | 'missing-country-code'
  | 'lebanese-digit-count'
  | 'digits-only'
  | 'international-digit-count'

export type PhoneValidationResult =
  | { valid: true; formatted: string }
  | { valid: false; reason: PhoneValidationReason }

const LEBANON_PREFIX = '+961'
const LEBANON_LOCAL_DIGITS = 8
const INTERNATIONAL_MIN_DIGITS = 6
const INTERNATIONAL_MAX_DIGITS = 12

/**
 * Validates a phone number against Lebanese format rules (+961 followed by
 * exactly 8 digits), falling back to a loose digit-count check for other
 * country codes. Replaces the previous parser, which split the input with a
 * greedy `\d{1,4}` regex and could never actually match a 3-digit "961"
 * country code segment, silently accepting 7- or 9-digit Lebanese numbers.
 */
export function validateLebanesePhone(rawPhone: string): PhoneValidationResult {
  const cleaned = rawPhone.replace(/\s/g, '')

  if (!cleaned.startsWith('+')) {
    return { valid: false, reason: 'missing-plus' }
  }

  if (cleaned.length <= 1) {
    return { valid: false, reason: 'missing-country-code' }
  }

  if (cleaned.startsWith(LEBANON_PREFIX)) {
    const localNumber = cleaned.slice(LEBANON_PREFIX.length)

    if (!/^\d+$/.test(localNumber)) {
      return { valid: false, reason: 'digits-only' }
    }

    if (localNumber.length !== LEBANON_LOCAL_DIGITS) {
      return { valid: false, reason: 'lebanese-digit-count' }
    }

    const formatted = `+961 ${localNumber.slice(0, 2)} ${localNumber.slice(2, 5)} ${localNumber.slice(5)}`
    return { valid: true, formatted }
  }

  const digitsAfterPlus = cleaned.slice(1)

  if (!/^\d+$/.test(digitsAfterPlus)) {
    return { valid: false, reason: 'digits-only' }
  }

  if (digitsAfterPlus.length < INTERNATIONAL_MIN_DIGITS || digitsAfterPlus.length > INTERNATIONAL_MAX_DIGITS) {
    return { valid: false, reason: 'international-digit-count' }
  }

  return { valid: true, formatted: cleaned }
}
