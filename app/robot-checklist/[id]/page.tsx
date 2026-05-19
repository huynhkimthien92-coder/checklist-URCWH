// app/robot-checklist/[id]/page.tsx
export const dynamic = 'force-dynamic'

import { Navbar } from '@/components/layout/Navbar'
import { createServiceClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { RobotChecklistForm } from '@/components/forms/RobotChecklistForm'

// ✅ parse JSON từ DB
function safeParse(value: any) {
  if (!value) return value
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }
  return value
}

export default async function RobotChecklistDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('robot_checklists')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !data) notFound()

  // ✅ clean data từ DB
  const checklist = {
    ...data,
    items: safeParse(data.items) || [],
    day_entries: safeParse(data.day_entries) || {},
    operator_signatures: safeParse(data.operator_signatures) || {},
    supervisor_signatures: safeParse(data.supervisor_signatures) || {},
    incidents: safeParse(data.incidents) || [],
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-5 space-y-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Robot: {checklist.robot_number}
          </h1>
          <p className="text-sm text-slate-500">
            Tháng {checklist.month}/{checklist.year} · {checklist.area}
          </p>
        </div>

        <div className="bg-white border rounded-xl p-4">
          {/* ✅ gọi trực tiếp form */}
          <RobotChecklistForm
            checklist={checklist}
            readOnly={checklist.status === 'approved'}
          />
        </div>
      </main>
    </div>
  )
}
