import { ServiceType } from '@/types'

export const VALID_PROVIDER_SERVICE_TYPES: ServiceType[] = [
  'tow',
  'battery_jump',
  'flat_tire',
  'fuel_delivery',
  'minor_repair',
]

export interface ProviderFields {
  name?: string
  phone?: string
  service_types?: ServiceType[]
  coverage_area?: string
  active?: boolean
}

const fieldValidators: Record<'name' | 'phone' | 'service_types' | 'coverage_area', (value: unknown) => string | null> = {
  name: (value) => {
    if (typeof value !== 'string' || value.trim().length === 0) {
      return 'Provider name is required'
    }
    if (value.length > 100) {
      return 'Name too long'
    }
    return null
  },
  phone: (value) => {
    if (typeof value !== 'string' || value.trim().length === 0) {
      return 'Phone number is required'
    }
    if (!/^\+?[1-9]\d{1,14}$/.test(value.replace(/\s/g, ''))) {
      return 'Invalid phone number format'
    }
    return null
  },
  service_types: (value) => {
    if (!Array.isArray(value) || value.length === 0) {
      return 'At least one service type is required'
    }
    const invalidTypes = value.filter((type) => !VALID_PROVIDER_SERVICE_TYPES.includes(type))
    if (invalidTypes.length > 0) {
      return 'Invalid service types'
    }
    return null
  },
  coverage_area: (value) => {
    if (typeof value !== 'string' || value.trim().length === 0) {
      return 'Coverage area is required'
    }
    if (value.length > 200) {
      return 'Coverage area too long'
    }
    return null
  },
}

/**
 * Validates provider input. In `partial` mode (PUT), only fields present on
 * `body` are checked — matching pickProviderFields's partial-update semantics.
 */
export function validateProviderInput(body: Record<string, unknown>, options: { partial?: boolean } = {}): string[] {
  const errors: string[] = []
  const fields = Object.keys(fieldValidators) as Array<keyof typeof fieldValidators>

  for (const field of fields) {
    if (options.partial && body[field] === undefined) continue
    const error = fieldValidators[field](body[field])
    if (error) errors.push(`${field}: ${error}`)
  }

  return errors
}

/**
 * Whitelists provider fields from an arbitrary request body, so callers can
 * never mass-assign columns like id/created_at/updated_at via the request.
 * Only fields actually present on `body` are included, so PUT can send a
 * partial update.
 */
export function pickProviderFields(body: Record<string, unknown>): ProviderFields {
  const fields: ProviderFields = {}

  if (body.name !== undefined) fields.name = body.name as string
  if (body.phone !== undefined) fields.phone = body.phone as string
  if (body.service_types !== undefined) fields.service_types = body.service_types as ServiceType[]
  if (body.coverage_area !== undefined) fields.coverage_area = body.coverage_area as string
  if (body.active !== undefined) fields.active = Boolean(body.active)

  return fields
}
