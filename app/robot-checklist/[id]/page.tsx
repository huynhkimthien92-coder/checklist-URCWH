// app/robot-checklist/[id]/page.tsx// app/robot-check()

  // ✅ FETCH DATA
  const { data, error } = await supabase
    .from('robot_checklists')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !data) {
    return notFound()
  }

  // ✅ OPTIONAL: xác định supervisor (tuỳ role system của bạn)
  const isSupervisor =
    (session.user as any)?.role === 'supervisor'

  return (
    <div className="p-4">

      {/* HEADER */}
      <div className="mb-4">
        <h1 className="text-xl font-bold">
          Robot Checklist
        </h1>

        <p className="text-sm text-gray-500">
          Robot: {data.robot_number} — {data.month}/{data.year}
        </p>

        <p className="text-xs mt-1">
          Status: <span className="font-semibold">{data.status}</span>
        </p>
      </div>

      {/* FORM */}
      <RobotChecklistForm
        checklist={data}
        readOnly={data.status === 'approved'}
        isSupervisor={isSupervisor}
      />

    </div>
  )
}

import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import { RobotChecklistForm } from '@/components/forms/RobotChecklistForm'

export const dynamic = 'force-dynamic'

// ======================= PAGE =======================
export default async function RobotChecklistPage({
  params
}: {
  params: { id: string }
}) {

  // ✅ AUTH
  const session = await getServerSession(authOptions)

  if (!session) {
    return notFound()
  }

