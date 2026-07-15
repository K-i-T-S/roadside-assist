import 'server-only'
import { cache } from 'react'
import type { User } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase/server'

/**
 * The single source of truth for server-side admin authorization in this
 * app. Always calls supabase.auth.getUser() — never getSession() — because
 * getUser() revalidates the JWT against the Supabase Auth server on every
 * call, while getSession() trusts whatever is in the cookie without
 * verification and must never be used for an authorization decision.
 *
 * Wrapped in React's cache() so multiple calls within the same request
 * (e.g. from a layout and a page it renders) share one Supabase round trip.
 */
export const getAdminSession = cache(async (): Promise<User | null> => {
  const supabase = await createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
})
