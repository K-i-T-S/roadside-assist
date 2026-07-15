import { validateLebanesePhone } from '@/lib/phone'

describe('validateLebanesePhone', () => {
  it('accepts a valid 8-digit Lebanese number and formats it', () => {
    const result = validateLebanesePhone('+96181290662')
    expect(result).toEqual({ valid: true, formatted: '+961 81 290 662' })
  })

  it('accepts a valid 8-digit Lebanese number that already has spacing', () => {
    const result = validateLebanesePhone('+961 81 290 662')
    expect(result).toEqual({ valid: true, formatted: '+961 81 290 662' })
  })

  it('rejects a 7-digit Lebanese number (missing a digit)', () => {
    const result = validateLebanesePhone('+9618129066')
    expect(result).toEqual({ valid: false, reason: 'lebanese-digit-count' })
  })

  it('rejects a 9-digit Lebanese number (one digit too many)', () => {
    const result = validateLebanesePhone('+961812906621')
    expect(result).toEqual({ valid: false, reason: 'lebanese-digit-count' })
  })

  it('rejects a Lebanese number containing a non-digit character', () => {
    const result = validateLebanesePhone('+96181290a62')
    expect(result).toEqual({ valid: false, reason: 'digits-only' })
  })

  it('accepts a valid international number outside the +961 prefix', () => {
    const result = validateLebanesePhone('+15551234567')
    expect(result).toEqual({ valid: true, formatted: '+15551234567' })
  })

  it('rejects an international number that is too short', () => {
    const result = validateLebanesePhone('+123')
    expect(result).toEqual({ valid: false, reason: 'international-digit-count' })
  })

  it('rejects a number missing the leading +', () => {
    const result = validateLebanesePhone('96181290662')
    expect(result).toEqual({ valid: false, reason: 'missing-plus' })
  })

  it('rejects a bare "+" with no digits after it', () => {
    const result = validateLebanesePhone('+')
    expect(result).toEqual({ valid: false, reason: 'missing-country-code' })
  })
})
