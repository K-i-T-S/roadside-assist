import { pickProviderFields, validateProviderInput } from '@/lib/providers/validation'

describe('pickProviderFields', () => {
  it('whitelists only the known provider fields', () => {
    const result = pickProviderFields({
      name: 'Joe Towing',
      phone: '+96181290662',
      service_types: ['tow'],
      coverage_area: 'Beirut',
      active: true,
    })
    expect(result).toEqual({
      name: 'Joe Towing',
      phone: '+96181290662',
      service_types: ['tow'],
      coverage_area: 'Beirut',
      active: true,
    })
  })

  it('strips mass-assignment attempts on fields the client should never set', () => {
    const result = pickProviderFields({
      name: 'Joe Towing',
      phone: '+96181290662',
      service_types: ['tow'],
      coverage_area: 'Beirut',
      id: 'attacker-controlled-id',
      created_at: '1970-01-01T00:00:00Z',
      updated_at: '1970-01-01T00:00:00Z',
    })
    expect(result).not.toHaveProperty('id')
    expect(result).not.toHaveProperty('created_at')
    expect(result).not.toHaveProperty('updated_at')
  })

  it('omits fields absent from the body, for partial PUT updates', () => {
    const result = pickProviderFields({ active: false })
    expect(result).toEqual({ active: false })
  })
})

describe('validateProviderInput', () => {
  it('requires all fields in full (POST) mode', () => {
    const errors = validateProviderInput({})
    expect(errors).toEqual([
      'name: Provider name is required',
      'phone: Phone number is required',
      'service_types: At least one service type is required',
      'coverage_area: Coverage area is required',
    ])
  })

  it('only validates fields present in partial (PUT) mode', () => {
    const errors = validateProviderInput({ active: true }, { partial: true })
    expect(errors).toEqual([])
  })

  it('rejects a service type outside the known whitelist', () => {
    const errors = validateProviderInput({
      name: 'Joe Towing',
      phone: '+96181290662',
      service_types: ['tow', 'drop_table_providers'],
      coverage_area: 'Beirut',
    })
    expect(errors).toEqual(['service_types: Invalid service types'])
  })
})
