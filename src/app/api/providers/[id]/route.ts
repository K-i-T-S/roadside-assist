import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json()
    const { id } = await params
    
    // Validate request body
    const errors: string[] = []
    
    if (body.name !== undefined) {
      const nameError = providerSchema.name(body.name)
      if (nameError) errors.push(`name: ${nameError}`)
    }
    
    if (body.phone !== undefined) {
      const phoneError = providerSchema.phone(body.phone)
      if (phoneError) errors.push(`phone: ${phoneError}`)
    }
    
    if (body.service_types !== undefined) {
      const serviceTypesError = providerSchema.service_types(body.service_types)
      if (serviceTypesError) errors.push(`service_types: ${serviceTypesError}`)
    }
    
    if (body.coverage_area !== undefined) {
      const coverageAreaError = providerSchema.coverage_area(body.coverage_area)
      if (coverageAreaError) errors.push(`coverage_area: ${coverageAreaError}`)
    }
    
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
    
    // Check if provider exists
    const { data: existingProvider } = await supabase
      .from('providers')
      .select('id')
      .eq('id', id)
      .single()
    
    if (!existingProvider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }
    
    // Check for duplicate phone number (if phone is being updated)
    if (body.phone) {
      const { data: duplicateProvider } = await supabase
        .from('providers')
        .select('id')
        .eq('phone', body.phone)
        .neq('id', id)
        .single()
      
      if (duplicateProvider) {
        return NextResponse.json(
          { error: 'A provider with this phone number already exists' },
          { status: 409 }
        )
      }
    }
    
    const { data, error } = await supabase
      .from('providers')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to update provider', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ provider: data })
  } catch (error) {
    console.error('Provider PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    const supabase = await createServerClient()
    
    // Check if provider exists
    const { data: existingProvider } = await supabase
      .from('providers')
      .select('id, name')
      .eq('id', id)
      .single()
    
    if (!existingProvider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }
    
    // Check for active requests (in a real implementation, you'd check the requests table)
    // For now, we'll allow deletion but could add this check later
    
    const { error } = await supabase
      .from('providers')
      .delete()
      .eq('id', id)
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete provider', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      message: `Provider ${existingProvider.name} deleted successfully` 
    })
  } catch (error) {
    console.error('Provider DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
