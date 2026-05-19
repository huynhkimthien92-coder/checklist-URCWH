// app/robot-checklist/[id]/page.tsx

import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import { RobotChecklistForm } from '@/components/forms/RobotChecklistForm'

export const dynamic = 'force-dynamic'

export default async function RobotChecklistPage({
  params
}: {
  params: { id: string }
}) {

  // ✅ AUTH
  const session = await getServerSession(authOptions)

  if (!session) {
    notFound() // ✅ KHÔNG return
  }

  const supabase = createServiceClient()

  // ✅ FETCH
  const { data, error } = await supabase
    .from('robot_checklists')
    .select('*')
    .eq('id', params.id)
    .single()

  // ✅ FIX LỖI CỦA BẠN Ở ĐÂY
  if (error || !data) {
    notFound() // ✅ KHÔNG return
  }

  // ✅ role
  const isSupervisor =
    (session.user as any)?.role === 'supervisor'

  return (
    <div className="p-4">

      <h1 className="text-xl font-bold">
        Robot Checklist
      </h1>

      <p className="text-sm text-gray-500">
        {data.robot_number} — {data.month}/{data.year}
      </p>

      <RobotChecklistForm
        checklist={data}
        readOnly={data.status === 'approved'}
        isSupervisor={isSupervisor}
      />

    </div>
  )
}
