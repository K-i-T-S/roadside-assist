import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/auth/session'
import { pickProviderFields, validateProviderInput } from '@/lib/providers/validation'

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

export async function GET(request: NextRequest) {
  try {
    const user = await getAdminSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
    const user = await getAdminSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate request body
    const errors = validateProviderInput(body)

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
    
    const fields = pickProviderFields(body)

    const { data, error } = await supabase
      .from('providers')
      .insert({ ...fields, active: fields.active ?? true })
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
