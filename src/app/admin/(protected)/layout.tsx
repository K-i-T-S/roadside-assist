import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/auth/session'

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAdminSession()

  if (!user) {
    redirect('/admin/login')
  }

  return <>{children}</>
}
