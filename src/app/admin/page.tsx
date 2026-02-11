'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        router.push('/admin/dashboard')
      } else {
        router.push('/admin/login')
      }
    }

    checkAuthAndRedirect()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-500">Redirecting...</div>
    </div>
  )
}
