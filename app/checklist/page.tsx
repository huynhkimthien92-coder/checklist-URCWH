import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import ChecklistListClient from './checklistlistclient'

export default async function ChecklistPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')
  const role = (session.user as any)?.role
  if (role !== 'operator' && role !== 'admin' && role !== 'supervisor') redirect('/')

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <ChecklistListClient />
      </main>
    </div>
  )
}
