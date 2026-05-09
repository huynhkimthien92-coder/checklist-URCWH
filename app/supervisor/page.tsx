import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SupervisorClient from './SupervisorClient'

export default async function Page() {
  const session = await getServerSession(authOptions)

  if (!session) redirect('/auth/login')

  const role = (session.user as any)?.role
  if (role !== 'supervisor' && role !== 'admin') {
    redirect('/')
  }

  return <SupervisorClient />
}
