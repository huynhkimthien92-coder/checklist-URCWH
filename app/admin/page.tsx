import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminDashboardClient from './AdminDashboardClient'

export default async function Page() {
  const session = await getServerSession(authOptions)

  if (!session) redirect('/auth/login')

  const role = (session.user as any)?.role
  if (role !== 'admin') {
    redirect('/')  // chỉ admin vào được
  }

  return <AdminDashboardClient />
}
