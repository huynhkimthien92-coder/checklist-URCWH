// ================= IMPORT =================// ================= IMPORT { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

import { Navbar } from '@/components/layout/Navbar'
import { RobotChecklistForm } from '@/components/forms/RobotChecklistForm'

// ================= CONFIG =================
export const dynamic = 'force-dynamic'

// ================= PAGE =================
export default async function RobotChecklistPage({
  params,
}: {
  params: { id: string }
}) {
  // ===== AUTH =====
  const session = await getServerSession(authOptions)

  if (!session) {
    notFound()
  }

  // ===== DB =====
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('robot_checklists')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !data) {
    notFound()
  }

  // ===== ROLE =====
  const isSupervisor =
    (session.user as any)?.role === 'supervisor'

  // ===== UI =====
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* NAVBAR */}
      <Navbar />

      {/* CONTENT */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 space-y-4">

        {/* HEADER */}
        <div className="border-b pb-3">
          <h1 className="text-xl font-bold text-slate-900">
            🤖 Robot Checklist
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            {data.robot_number} — {data.month}/{data.year}
          </p>

          <p className="text-xs mt-1">
            Status:{' '}
            <span className="font-semibold">
              {data.status}
            </span>
          </p>
        </div>

        {/* FORM */}
        <RobotChecklistForm
          checklist={data}
          readOnly={data.status === 'approved'}
          isSupervisor={isSupervisor}
        />

      </main>
    </div>
  )
}

