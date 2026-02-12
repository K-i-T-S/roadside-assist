import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

interface Provider {
  id: string
  name: string
  phone: string
  service_types: string[]
  coverage_area: string
  active: boolean
  created_at: string
  updated_at: string
}

const providerSchema = {
  name: (value: string) => {
    if (!value || value.trim().length === 0) {
      return 'Provider name is required'
    }
    if (value.length > 100) {
      return 'Name too long'
    }
    return null
  },
  phone: (value: string) => {
    if (!value || value.trim().length === 0) {
      return 'Phone number is required'
    }
    if (!/^\+?[1-9]\d{1,14}$/.test(value.replace(/\s/g, ''))) {
      return 'Invalid phone number format'
    }
    return null
  },
  service_types: (value: string[]) => {
    if (!value || value.length === 0) {
      return 'At least one service type is required'
    }
    const validTypes = ['tow', 'battery_jump', 'flat_tire', 'fuel_delivery', 'minor_repair']
    const invalidTypes = value.filter(type => !validTypes.includes(type))
    if (invalidTypes.length > 0) {
      return 'Invalid service types'
    }
    return null
  },
  coverage_area: (value: string) => {
    if (!value || value.trim().length === 0) {
      return 'Coverage area is required'
    }
    if (value.length > 200) {
      return 'Coverage area too long'
    }
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    
    let query = supabase
      .from('providers')
      .select('*')
      .order('name')
    
    if (status === 'active') {
      query = query.eq('active', true)
    } else if (status === 'inactive') {
      query = query.eq('active', false)
    }
    
    const { data, error } = await query
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch providers', details: error.message },
        { status: 500 }
      )
    }
    
    // Apply search filter on the client side for more flexible searching
    let filteredData = data || []
    if (search) {
      const searchLower = search.toLowerCase()
      filteredData = filteredData.filter((provider: Provider) =>
        provider.name.toLowerCase().includes(searchLower) ||
        provider.phone.includes(search) ||
        provider.coverage_area.toLowerCase().includes(searchLower)
      )
    }
    
    return NextResponse.json({ providers: filteredData })
  } catch (error) {
    console.error('Providers GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const errors: string[] = []
    
    const nameError = providerSchema.name(body.name)
    if (nameError) errors.push(`name: ${nameError}`)
    
    const phoneError = providerSchema.phone(body.phone)
    if (phoneError) errors.push(`phone: ${phoneError}`)
    
    const serviceTypesError = providerSchema.service_types(body.service_types)
    if (serviceTypesError) errors.push(`service_types: ${serviceTypesError}`)
    
    const coverageAreaError = providerSchema.coverage_area(body.coverage_area)
    if (coverageAreaError) errors.push(`coverage_area: ${coverageAreaError}`)
    
    if (errors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: errors
        },
        { status: 400 }
      )
    }
    
    const supabase = await createServerClient()
    
    // Check for duplicate phone number
    const { data: existingProvider } = await supabase
      .from('providers')
      .select('id')
      .eq('phone', body.phone)
      .single()
    
    if (existingProvider) {
      return NextResponse.json(
        { error: 'A provider with this phone number already exists' },
        { status: 409 }
      )
    }
    
    const { data, error } = await supabase
      .from('providers')
      .insert(body)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to create provider', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ provider: data }, { status: 201 })
  } catch (error) {
    console.error('Providers POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
