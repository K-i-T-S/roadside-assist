import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/auth/session'
import { pickProviderFields, validateProviderInput } from '@/lib/providers/validation'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAdminSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id } = await params
    
    // Validate request body (only fields present are checked/updated)
    const errors = validateProviderInput(body, { partial: true })

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
        ...pickProviderFields(body),
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
    const user = await getAdminSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
    
    // Block deletion while this provider has an assigned-but-not-completed job —
    // otherwise the requests.provider_id FK's ON DELETE SET NULL would silently
    // unassign an active request out from under it.
    const { count: activeRequestCount, error: activeRequestError } = await supabase
      .from('requests')
      .select('id', { count: 'exact', head: true })
      .eq('provider_id', id)
      .eq('status', 'assigned')

    if (activeRequestError) {
      return NextResponse.json(
        { error: 'Failed to check active requests', details: activeRequestError.message },
        { status: 500 }
      )
    }

    if (activeRequestCount && activeRequestCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete ${existingProvider.name}: still assigned to ${activeRequestCount} active request(s)` },
        { status: 409 }
      )
    }

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
